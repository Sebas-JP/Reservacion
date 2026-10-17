// src/routes/menu.js
// API del menú del día -> /api/menu
//
//   GET  /api/menu              -> lista todos los platos disponibles (clientes)
//   GET  /api/menu/:id          -> un plato por id
//   POST /api/menu              -> agregar plato (solo admin)
//   PUT  /api/menu/:id          -> editar plato (solo admin)
//   DELETE /api/menu/:id        -> eliminar plato (solo admin)

const { Router } = require('express');
const db = require('../db/conexion');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = Router();

// GET /api/menu
// Devuelve todos los platos disponibles (disponible = 1)
router.get('/', async (req, res, next) => {
  try {
    const [platos] = await db.query(
      'SELECT id, nombre, descripcion, precio, imagen_url FROM menu WHERE disponible = 1 ORDER BY id'
    );
    res.json(platos);
  } catch (error) {
    next(error);
  }
});

// GET /api/menu/:id
// Devuelve un plato por su id
router.get('/:id', async (req, res, next) => {
  try {
    const [platos] = await db.query(
      'SELECT id, nombre, descripcion, precio, imagen_url FROM menu WHERE id = ?',
      [Number(req.params.id)]
    );
    if (!platos.length) {
      return res.status(404).json({ mensaje: 'Plato no encontrado' });
    }
    res.json(platos[0]);
  } catch (error) {
    next(error);
  }
});

// POST /api/menu
// Agrega un plato nuevo (solo admin)
// Body: { nombre, descripcion, precio, imagen_url }
router.post('/', verificarToken, soloAdmin, async (req, res, next) => {
  try {
    const { nombre, descripcion, precio, imagen_url } = req.body || {};

    if (!nombre || precio === undefined) {
      return res.status(400).json({ mensaje: 'Nombre y precio son obligatorios' });
    }
    if (isNaN(precio) || Number(precio) <= 0) {
      return res.status(400).json({ mensaje: 'El precio debe ser un número mayor a 0' });
    }

    const [resultado] = await db.query(
      'INSERT INTO menu (nombre, descripcion, precio, imagen_url) VALUES (?, ?, ?, ?)',
      [nombre, descripcion || null, Number(precio), imagen_url || null]
    );

    res.status(201).json({ mensaje: 'Plato agregado correctamente', id: resultado.insertId });
  } catch (error) {
    next(error);
  }
});

// PUT /api/menu/:id
// Edita un plato existente (solo admin)
// Body: { nombre, descripcion, precio, imagen_url, disponible }
router.put('/:id', verificarToken, soloAdmin, async (req, res, next) => {
  try {
    const { nombre, descripcion, precio, imagen_url, disponible } = req.body || {};
    const id = Number(req.params.id);

    // Verificar que el plato existe
    const [platos] = await db.query('SELECT id FROM menu WHERE id = ?', [id]);
    if (!platos.length) {
      return res.status(404).json({ mensaje: 'Plato no encontrado' });
    }

    await db.query(
      `UPDATE menu SET
        nombre      = COALESCE(?, nombre),
        descripcion = COALESCE(?, descripcion),
        precio      = COALESCE(?, precio),
        imagen_url  = COALESCE(?, imagen_url),
        disponible  = COALESCE(?, disponible)
       WHERE id = ?`,
      [
        nombre || null,
        descripcion || null,
        precio ? Number(precio) : null,
        imagen_url || null,
        disponible !== undefined ? Number(disponible) : null,
        id,
      ]
    );

    res.json({ mensaje: 'Plato actualizado correctamente' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/menu/:id
// Elimina un plato (solo admin)
router.delete('/:id', verificarToken, soloAdmin, async (req, res, next) => {
  try {
    const [resultado] = await db.query('DELETE FROM menu WHERE id = ?', [Number(req.params.id)]);
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Plato no encontrado' });
    }
    res.json({ mensaje: 'Plato eliminado correctamente' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
