// Reservas  ->  /api/reservas
//   POST /api/reservas    crea una reserva y devuelve su código de confirmación

const { Router } = require('express');
const db = require('../db/conexion');
const { verificarToken } = require('../middleware/auth');

const router = Router();

const DURACION_MIN = 120; // cada reserva ocupa la mesa 2 horas

// Genera un código como RES-K7P2M (sin letras confusas como O, 0, I, 1)
function generarCodigo() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = 'RES-';
  for (let i = 0; i < 5; i++) {
    codigo += letras[Math.floor(Math.random() * letras.length)];
  }
  return codigo;
}

// ¿La mesa ya tiene una reserva vigente que se cruce con esta hora?
// Solo cuentan las que no están canceladas.
async function hayConflicto(conn, mesaId, fecha, hora) {
  const [filas] = await conn.query(
    `SELECT id FROM reservas
     WHERE mesa_id = ? AND fecha = ? AND estado <> 'cancelada'
       AND ABS(TIME_TO_SEC(hora) - TIME_TO_SEC(?)) < ?`,
    [mesaId, fecha, hora, DURACION_MIN * 60]
  );
  return filas.length > 0;
}

router.post('/', verificarToken, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const usuario_id = req.usuario.id;
    const { mesa_id, fecha, hora, personas, preferencia } = req.body ?? {};

    if (!fecha || !hora || !personas) {
      return res.status(400).json({ error: 'Faltan datos: fecha, hora y personas' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}$/.test(hora)) {
      return res.status(400).json({ error: 'Formato inválido: fecha AAAA-MM-DD y hora HH:MM' });
    }
    if (!Number.isInteger(personas) || personas < 1) {
      return res.status(400).json({ error: 'personas debe ser un número entero mayor a 0' });
    }
    if (new Date(`${fecha}T${hora}:00`) < new Date()) {
      return res.status(400).json({ error: 'No se puede reservar en el pasado' });
    }

    // La transacción y el bloqueo (FOR UPDATE) evitan que dos clientes
    // reserven la misma mesa al mismo tiempo.
    await conn.beginTransaction();

    let mesa = null;
    if (mesa_id) {
      // El cliente eligió una mesa
      const [m] = await conn.query('SELECT id, numero, capacidad FROM mesas WHERE id = ? FOR UPDATE', [mesa_id]);
      if (!m.length) {
        await conn.rollback();
        return res.status(404).json({ error: 'La mesa no existe' });
      }
      if (m[0].capacidad < personas) {
        await conn.rollback();
        return res.status(400).json({ error: 'La mesa no tiene capacidad para tantas personas' });
      }
      if (await hayConflicto(conn, m[0].id, fecha, hora)) {
        await conn.rollback();
        return res.status(409).json({ error: 'Esa mesa ya está reservada en ese horario' });
      }
      mesa = m[0];
    } else {
      // Asignación automática: la mesa más pequeña que alcance y esté libre
      const [candidatas] = await conn.query(
        'SELECT id, numero, capacidad FROM mesas WHERE capacidad >= ? ORDER BY capacidad, numero FOR UPDATE',
        [personas]
      );
      for (const c of candidatas) {
        if (!(await hayConflicto(conn, c.id, fecha, hora))) {
          mesa = c;
          break;
        }
      }
      if (!mesa) {
        await conn.rollback();
        return res.status(409).json({ error: 'No hay mesas disponibles en ese horario' });
      }
    }

    const codigo = generarCodigo();
    const [resultado] = await conn.query(
      `INSERT INTO reservas (codigo, usuario_id, mesa_id, fecha, hora, personas, preferencia)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [codigo, usuario_id, mesa.id, fecha, hora, personas, preferencia || null]
    );
    await conn.commit();

    res.status(201).json({
      id: resultado.insertId,
      codigo,
      mesa_id: mesa.id,
      mesa: mesa.numero,
      fecha,
      hora,
      personas,
      preferencia: preferencia || null,
      estado: 'activa',
    });
  } catch (error) {
    await conn.rollback();
    // Red de seguridad: el índice único de la Persona 1
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Esa mesa ya está reservada en ese horario' });
    }
    next(error);
  } finally {
    conn.release();
  }
});

// Mis reservas  ->  GET /api/reservas/mias
// TEMPORAL: usuario_id viene en la URL hasta que exista el login (Persona 2).
router.get('/mias', verificarToken, async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const [reservas] = await db.query(
      `SELECT r.id, r.codigo, r.mesa_id, m.numero AS mesa, m.ubicacion,
              r.fecha, r.hora, r.personas, r.preferencia, r.estado
       FROM reservas r
       LEFT JOIN mesas m ON m.id = r.mesa_id
       WHERE r.usuario_id = ?
       ORDER BY r.fecha DESC, r.hora DESC`,
      [usuarioId]
    );
    res.json(reservas);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', verificarToken, async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const [resultado] = await db.query(
      `UPDATE reservas SET estado = 'cancelada'
       WHERE id = ? AND usuario_id = ? AND estado <> 'cancelada'`,
      [Number(req.params.id), usuarioId]
    );
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada o ya cancelada' });
    }
    res.json({ mensaje: 'Reserva cancelada' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;