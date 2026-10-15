// Panel de administrador  ->  /api/admin
//   GET /api/admin/reservas?fecha=AAAA-MM-DD   reservas del día, ordenadas por hora y mesa
//   PUT /api/admin/reservas/:id                confirmar, cancelar o modificar una reserva

const { Router } = require('express');
const db = require('../db/conexion');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = Router();

// Todas las rutas de este archivo exigen sesión y rol admin
router.use(verificarToken, soloAdmin);

const DURACION_MIN = 120;
const ESTADOS = ['activa', 'confirmada', 'cancelada'];

const SELECT_RESERVA = `
  SELECT r.id, r.codigo, r.usuario_id, u.nombre AS cliente,
         r.mesa_id, m.numero AS mesa, m.ubicacion,
         r.fecha, TIME_FORMAT(r.hora, '%H:%i') AS hora,
         r.personas, r.preferencia, r.estado
  FROM reservas r
  JOIN usuarios u ON u.id = r.usuario_id
  LEFT JOIN mesas m ON m.id = r.mesa_id`;

// Reservas del día, ordenadas por hora y mesa
router.get('/reservas', async (req, res, next) => {
  try {
    const hoy = new Date().toISOString().slice(0, 10);
    const fecha = req.query.fecha || hoy;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ error: 'fecha debe tener formato AAAA-MM-DD' });
    }
    const [reservas] = await db.query(
      `${SELECT_RESERVA} WHERE r.fecha = ? ORDER BY r.hora, m.numero`,
      [fecha]
    );
    res.json(reservas);
  } catch (error) {
    next(error);
  }
});

// ¿La mesa tiene otra reserva vigente que se cruce? (se ignora la que se edita)
async function hayConflicto(conn, mesaId, fecha, hora, excluirId) {
  const [filas] = await conn.query(
    `SELECT id FROM reservas
     WHERE mesa_id = ? AND fecha = ? AND estado <> 'cancelada' AND id <> ?
       AND ABS(TIME_TO_SEC(hora) - TIME_TO_SEC(?)) < ?`,
    [mesaId, fecha, excluirId, hora, DURACION_MIN * 60]
  );
  return filas.length > 0;
}

// Confirmar, cancelar o modificar (estado, fecha, hora, mesa_id, personas, preferencia)
router.put('/reservas/:id', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [actuales] = await conn.query(
      `SELECT id, mesa_id, personas, preferencia, estado,
              DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha,
              TIME_FORMAT(hora, '%H:%i') AS hora
       FROM reservas WHERE id = ? FOR UPDATE`,
      [Number(req.params.id)]
    );
    if (!actuales.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    const act = actuales[0];
    const body = req.body ?? {};

    const nueva = {
      estado: body.estado ?? act.estado,
      fecha: body.fecha ?? act.fecha,
      hora: body.hora ?? act.hora,
      mesa_id: body.mesa_id ?? act.mesa_id,
      personas: body.personas ?? act.personas,
      preferencia: body.preferencia ?? act.preferencia,
    };

    if (!ESTADOS.includes(nueva.estado)) {
      await conn.rollback();
      return res.status(400).json({ error: 'estado debe ser activa, confirmada o cancelada' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nueva.fecha) || !/^\d{2}:\d{2}$/.test(nueva.hora)) {
      await conn.rollback();
      return res.status(400).json({ error: 'Formato inválido: fecha AAAA-MM-DD y hora HH:MM' });
    }
    if (!Number.isInteger(nueva.personas) || nueva.personas < 1) {
      await conn.rollback();
      return res.status(400).json({ error: 'personas debe ser un entero mayor a 0' });
    }

    // Si la reserva queda vigente, hay que revalidar mesa, capacidad y conflictos
    if (nueva.estado !== 'cancelada') {
      if (!nueva.mesa_id) {
        await conn.rollback();
        return res.status(400).json({ error: 'La reserva necesita una mesa' });
      }
      const [mesas] = await conn.query('SELECT id, capacidad FROM mesas WHERE id = ? FOR UPDATE', [nueva.mesa_id]);
      if (!mesas.length) {
        await conn.rollback();
        return res.status(404).json({ error: 'La mesa no existe' });
      }
      if (mesas[0].capacidad < nueva.personas) {
        await conn.rollback();
        return res.status(400).json({ error: 'La mesa no tiene capacidad para tantas personas' });
      }
      if (await hayConflicto(conn, nueva.mesa_id, nueva.fecha, nueva.hora, act.id)) {
        await conn.rollback();
        return res.status(409).json({ error: 'Esa mesa ya está reservada en ese horario' });
      }
    }

    await conn.query(
      `UPDATE reservas
       SET estado = ?, fecha = ?, hora = ?, mesa_id = ?, personas = ?, preferencia = ?
       WHERE id = ?`,
      [nueva.estado, nueva.fecha, nueva.hora, nueva.mesa_id, nueva.personas, nueva.preferencia, act.id]
    );
    await conn.commit();

    const [filas] = await db.query(`${SELECT_RESERVA} WHERE r.id = ?`, [act.id]);
    res.json(filas[0]);
  } catch (error) {
    await conn.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Esa mesa ya está reservada en ese horario' });
    }
    next(error);
  } finally {
    conn.release();
  }
});

module.exports = router;