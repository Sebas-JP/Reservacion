// src/middleware/auth.js
// Middlewares para proteger rutas
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cambia_este_secreto';

// Revisa el token en cada petición protegida.
// Si es válido deja pasar; si no, responde 401.
function verificarToken(req, res, next) {
  const header = req.headers['authorization'];

  // Formato esperado: "Authorization: Bearer <token>"
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ mensaje: 'No autorizado: falta el token' });
  }

  const token = header.split(' ')[1];

  try {
    const datos = jwt.verify(token, JWT_SECRET);
    req.usuario = datos; // { id, nombre, rol } disponible para las demás rutas
    next();
  } catch (error) {
    return res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
}

// Verifica que el usuario sea admin (usar DESPUÉS de verificarToken)
function soloAdmin(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso solo para administradores' });
  }
  next();
}

module.exports = { verificarToken, soloAdmin };