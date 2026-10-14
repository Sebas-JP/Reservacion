// Reservas  ->  /api/reservas
//   POST /api/reservas    crea una reserva y devuelve su código de confirmación

const { Router } = require('express');
const db = require('../db/conexion');

const router = Router();

// Genera un código como RES-K7P2M (sin letras confusas como O, 0, I, 1)
function generarCodigo() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = 'RES-';
  for (let i = 0; i < 5; i++) {
    codigo += letras[Math.floor(Math.random() * letras.length)];
  }
  return codigo;
}

router.post('/', async (req, res, next) => {
  try {
    // TEMPORAL: usuario_id viene en el body hasta que exista el login (Persona 2).
    // Después se reemplaza por req.usuario.id
    const { usuario_id, mesa_id, fecha, hora, personas, preferencia } = req.body ?? {};

    if (!usuario_id || !mesa_id || !fecha || !hora || !personas) {
      return res.status(400).json({ error: 'Faltan datos: usuario_id, mesa_id, fecha, hora y personas' });
    }

    // La mesa debe existir y tener capacidad para el grupo
    const [mesas] = await db.query('SELECT id, capacidad FROM mesas WHERE id = ?', [mesa_id]);
    if (!mesas.length) {
      return res.status(404).json({ error: 'La mesa no existe' });
    }
    if (mesas[0].capacidad < personas) {
      return res.status(400).json({ error: 'La mesa no tiene capacidad para tantas personas' });
    }

    const codigo = generarCodigo();
    const [resultado] = await db.query(
      `INSERT INTO reservas (codigo, usuario_id, mesa_id, fecha, hora, personas, preferencia)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [codigo, usuario_id, mesa_id, fecha, hora, personas, preferencia || null]
    );

    res.status(201).json({
      id: resultado.insertId,
      codigo,
      mesa_id,
      fecha,
      hora,
      personas,
      preferencia: preferencia || null,
      estado: 'activa',
    });
  } catch (error) {
    // El índice único de la Persona 1 detecta la misma mesa, fecha y hora
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Esa mesa ya está reservada en ese horario' });
    }
    next(error);
  }
});

module.exports = router;