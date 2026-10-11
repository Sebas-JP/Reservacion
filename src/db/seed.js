// Datos de ejemplo. Ejecutar con: npm run seed
// Es seguro correrlo varias veces (no duplica registros).

const db = require('./conexion');
const bcrypt = require('bcryptjs');

const usuarios = [
  { nombre: 'Administrador', correo: 'admin@restaurante.com', contrasena: 'admin123', rol: 'admin' },
  { nombre: 'Cliente Demo', correo: 'cliente@restaurante.com', contrasena: 'cliente123', rol: 'cliente' },
];

const insertarUsuario = db.prepare(
  'INSERT OR IGNORE INTO usuarios (nombre, correo, contrasena, rol) VALUES (?, ?, ?, ?)'
);
for (const u of usuarios) {
  insertarUsuario.run(u.nombre, u.correo, bcrypt.hashSync(u.contrasena, 10), u.rol);
}

const mesas = [[1, 2], [2, 2], [3, 4], [4, 4], [5, 6], [6, 8]];
const insertarMesa = db.prepare('INSERT OR IGNORE INTO mesas (numero, capacidad) VALUES (?, ?)');
for (const [numero, capacidad] of mesas) insertarMesa.run(numero, capacidad);

const total = (tabla) => db.prepare(`SELECT COUNT(*) AS n FROM ${tabla}`).get().n;
console.log(`Seed listo -> usuarios: ${total('usuarios')}, mesas: ${total('mesas')}, reservas: ${total('reservas')}`);
console.log('Admin:   admin@restaurante.com / admin123');
console.log('Cliente: cliente@restaurante.com / cliente123');
