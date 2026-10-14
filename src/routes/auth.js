// src/routes/auth.js
// Rutas de autenticación: registro y login (base de datos MariaDB con mysql2)
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/conexion'); // conexión que hace la Persona 1

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cambia_este_secreto';

// POST /api/auth/registro
// Recibe nombre, correo y contraseña; encripta la contraseña y guarda al usuario
router.post('/registro', async (req, res) => {
  try {
    const { nombre, correo, contrasena } = req.body || {};

    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({ mensaje: 'Nombre, correo y contraseña son obligatorios' });
    }

    // Revisar que el correo no esté registrado
    const [existe] = await db.query('SELECT id FROM usuarios WHERE correo = ?', [correo]);
    if (existe.length > 0) {
      return res.status(409).json({ mensaje: 'El correo ya está registrado' });
    }

    // Encriptar contraseña
    const hash = await bcrypt.hash(contrasena, 10);

    // Todo el que se registra entra como 'cliente' (nadie se registra como admin)
    const [resultado] = await db.query(
      'INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES (?, ?, ?, ?)',
      [nombre, correo, hash, 'cliente']
    );

    res.status(201).json({ mensaje: 'Usuario registrado correctamente', id: resultado.insertId });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
});

// POST /api/auth/login
// Verifica correo y contraseña; si son correctos devuelve un token JWT
router.post('/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body || {};

    if (!correo || !contrasena) {
      return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios' });
    }

    const [filas] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
    if (filas.length === 0) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    const usuario = filas[0];
    const coincide = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!coincide) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
});

module.exports = router;