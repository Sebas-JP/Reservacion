const express = require('express');
const db = require('../db/conexion');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();
const DURACION_MIN = 120; // cada reserva ocupa la mesa 2 horas

const SELECT_RESERVA = `
  SELECT r.id, r.codigo, r.usuario_id, u.nombre AS cliente,
         r.mesa_id, m.numero AS mesa, m.ubicacion,
         DATE_FORMAT(r.fecha, '%Y-%m-%d') AS fecha,
         TIME_FORMAT(r.hora, '%H:%i') AS hora,
         r.personas, r.preferencia, r.estado
  FROM reservas r
  JOIN mesas m ON m.id = r.mesa_id
  JOIN usuarios u ON u.id = r.usuario_id`;

function generarCodigo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = 'RES-';
  for (let i = 0; i < 5; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

function error(status, mensaje) {
  return { status, mensaje };
}

// ¿La mesa ya tiene una reserva activa que se solape con esta hora?
async function hayConflicto(conn, mesaId, fecha, hora, excluirId = 0) {
  const [filas] = await conn.query(
    `SELECT id FROM reservas
     WHERE mesa_id = ? AND fecha = ? AND estado <> 'cancelada' AND id <> ?
       AND ABS(TIME_TO_SEC(hora) - TIME_TO_SEC(?)) < ?`,
    [mesaId, fecha, excluirId, hora, DURACION_MIN * 60]
  );
  return filas.length > 0;
}

function validarFechaHora(fecha, hora) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) return 'Fecha inválida (use AAAA-MM-DD)';
  if (!/^\d{2}:\d{2}$/.test(hora || '')) return 'Hora inválida (use HH:MM)';
  if (new Date(`${fecha}T${hora}:00`) < new Date()) return 'No se puede reservar en el pasado';
  return null;
}

// ---------- CLIENTE ----------

// Crear reserva (mesa_id es opcional: si no viene, se asigna una libre)
router.post('/reservas', verificarToken, async (req, res) => {
  const { fecha, hora, personas, preferencia, mesa_id } = req.body;
  const msg = validarFechaHora(fecha, hora);
  if (msg) return res.status(400).json({ error: msg });
  if (!Number.isInteger(personas) || personas < 1) {
    return res.status(400).json({ error: 'Número de personas inválido' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Se bloquean las mesas para que dos clientes no reserven a la vez
    let mesa = null;
    if (mesa_id) {
      const [m] = await conn.query('SELECT * FROM mesas WHERE id = ? FOR UPDATE', [mesa_id]);
      mesa = m[0];
      if (!mesa) throw error(404, 'La mesa no existe');
      if (mesa.capacidad < personas) throw error(400, 'La mesa no tiene capacidad suficiente');
      if (await hayConflicto(conn, mesa.id, fecha, hora)) {
        throw error(409, 'La mesa ya está reservada en ese horario');
      }
    } else {
      const [candidatas] = await conn.query(
        'SELECT * FROM mesas WHERE capacidad >= ? ORDER BY capacidad, numero FOR UPDATE',
        [personas]
      );
      for (const c of candidatas) {
        if (!(await hayConflicto(conn, c.id, fecha, hora))) { mesa = c; break; }
      }
      if (!mesa) throw error(409, 'No hay mesas disponibles en ese horario');
    }

    const codigo = generarCodigo();
    const [r] = await conn.query(
      `INSERT INTO reservas (codigo, usuario_id, mesa_id, fecha, hora, personas, preferencia)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [codigo, req.usuario.id, mesa.id, fecha, hora, personas, preferencia || null]
    );
    await conn.commit();

    const [filas] = await db.query(`${SELECT_RESERVA} WHERE r.id = ?`, [r.insertId]);
    res.status(201).json(filas[0]);
  } catch (e) {
    await conn.rollback();
    if (e.status) return res.status(e.status).json({ error: e.mensaje });
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    conn.release();
  }
});

// Mis reservas
router.get('/reservas/mias', verificarToken, async (req, res) => {
  try {
    const [filas] = await db.query(
      `${SELECT_RESERVA} WHERE r.usuario_id = ? ORDER BY r.fecha DESC, r.hora DESC`,
      [req.usuario.id]
    );
    res.json(filas);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Cancelar una reserva propia
router.delete('/reservas/:id', verificarToken, async (req, res) => {
  try {
    const [r] = await db.query(
      `UPDATE reservas SET estado = 'cancelada'
       WHERE id = ? AND usuario_id = ? AND estado <> 'cancelada'`,
      [req.params.id, req.usuario.id]
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json({ mensaje: 'Reserva cancelada' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ---------- ADMIN ----------

// Reservas del día, ordenadas por hora y mesa
router.get('/admin/reservas', verificarToken, soloAdmin, async (req, res) => {
  const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);
  try {
    const [filas] = await db.query(
      `${SELECT_RESERVA} WHERE r.fecha = ? ORDER BY r.hora, m.numero`,
      [fecha]
    );
    res.json(filas);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Confirmar, cancelar o modificar cualquier reserva
router.put('/admin/reservas/:id', verificarToken, soloAdmin, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [act] = await conn.query('SELECT * FROM reservas WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!act[0]) throw error(404, 'Reserva no encontrada');

    const fechaAct = (await conn.query(
      `SELECT DATE_FORMAT(fecha,'%Y-%m-%d') AS f, TIME_FORMAT(hora,'%H:%i') AS h
       FROM reservas WHERE id = ?`, [req.params.id]))[0][0];

    const nueva = {
      estado: req.body.estado ?? act[0].estado,
      fecha: req.body.fecha ?? fechaAct.f,
      hora: req.body.hora ?? fechaAct.h,
      mesa_id: req.body.mesa_id ?? act[0].mesa_id,
      personas: req.body.personas ?? act[0].personas,
      preferencia: req.body.preferencia ?? act[0].preferencia
    };

    if (!['pendiente', 'confirmada', 'cancelada'].includes(nueva.estado)) {
      throw error(400, 'Estado inválido');
    }

    if (nueva.estado !== 'cancelada') {
      const [m] = await conn.query('SELECT * FROM mesas WHERE id = ?', [nueva.mesa_id]);
      if (!m[0]) throw error(404, 'La mesa no existe');
      if (m[0].capacidad < nueva.personas) throw error(400, 'La mesa no tiene capacidad suficiente');
      if (await hayConflicto(conn, nueva.mesa_id, nueva.fecha, nueva.hora, act[0].id)) {
        throw error(409, 'La mesa ya está reservada en ese horario');
      }
    }

    await conn.query(
      `UPDATE reservas SET estado=?, fecha=?, hora=?, mesa_id=?, personas=?, preferencia=?
       WHERE id=?`,
      [nueva.estado, nueva.fecha, nueva.hora, nueva.mesa_id, nueva.personas, nueva.preferencia, act[0].id]
    );
    await conn.commit();

    const [filas] = await db.query(`${SELECT_RESERVA} WHERE r.id = ?`, [act[0].id]);
    res.json(filas[0]);
  } catch (e) {
    await conn.rollback();
    if (e.status) return res.status(e.status).json({ error: e.mensaje });
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    conn.release();
  }
});

module.exports = router;