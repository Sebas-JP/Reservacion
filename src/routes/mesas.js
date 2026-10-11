// Catálogo de mesas  ->  /api/mesas
//   GET /api/mesas                  lista todas (ordenadas por número)
//   GET /api/mesas?ubicacion=terraza&estado=libre&capacidad_minima=4   filtros opcionales
//   GET /api/mesas/:id              una mesa
//
// Cambiar el estado de una mesa (libre/reservada/ocupada) lo hace el backend de
// reservas directamente en la base de datos:
//   await db.query('UPDATE mesas SET estado = ? WHERE id = ?', ['reservada', mesaId]);

const { Router } = require('express');
const db = require('../db/conexion');

const UBICACIONES = ['interior', 'terraza'];
const ESTADOS = ['libre', 'reservada', 'ocupada'];
const COLUMNAS = 'id, numero, capacidad, ubicacion, estado';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { ubicacion, estado, capacidad_minima } = req.query;
    const condiciones = [];
    const valores = [];

    if (ubicacion !== undefined) {
      if (!UBICACIONES.includes(ubicacion)) {
        return res.status(400).json({ error: 'ubicacion debe ser interior o terraza' });
      }
      condiciones.push('ubicacion = ?');
      valores.push(ubicacion);
    }
    if (estado !== undefined) {
      if (!ESTADOS.includes(estado)) {
        return res.status(400).json({ error: 'estado debe ser libre, reservada u ocupada' });
      }
      condiciones.push('estado = ?');
      valores.push(estado);
    }
    if (capacidad_minima !== undefined) {
      const n = Number(capacidad_minima);
      if (!Number.isInteger(n) || n < 1) {
        return res.status(400).json({ error: 'capacidad_minima debe ser un entero mayor a 0' });
      }
      condiciones.push('capacidad >= ?');
      valores.push(n);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const [mesas] = await db.query(`SELECT ${COLUMNAS} FROM mesas ${where} ORDER BY numero`, valores);
    res.json(mesas);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [mesas] = await db.query(`SELECT ${COLUMNAS} FROM mesas WHERE id = ?`, [Number(req.params.id)]);
    if (!mesas.length) return res.status(404).json({ error: 'Mesa no encontrada' });
    res.json(mesas[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
