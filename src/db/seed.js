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

// [numero, capacidad, ubicacion]. Si la mesa ya existe se actualizan capacidad y
// ubicacion, pero NO su estado actual.
const mesas = [
  [1, 2, 'interior'], [2, 2, 'interior'], [3, 4, 'interior'],
  [4, 4, 'interior'], [5, 6, 'interior'], [6, 8, 'interior'],
  [7, 2, 'terraza'],  [8, 4, 'terraza'],  [9, 4, 'terraza'], [10, 6, 'terraza'],
];
// Primero intenta actualizar; solo inserta si la mesa no existe (así los id quedan consecutivos).
const actualizarMesa = db.prepare('UPDATE mesas SET capacidad = ?, ubicacion = ? WHERE numero = ?');
const insertarMesa = db.prepare('INSERT INTO mesas (numero, capacidad, ubicacion) VALUES (?, ?, ?)');
for (const [numero, capacidad, ubicacion] of mesas) {
  const { changes } = actualizarMesa.run(capacidad, ubicacion, numero);
  if (changes === 0) insertarMesa.run(numero, capacidad, ubicacion);
}

const total = (tabla) => db.prepare(`SELECT COUNT(*) AS n FROM ${tabla}`).get().n;
console.log(`Seed listo -> usuarios: ${total('usuarios')}, mesas: ${total('mesas')}, reservas: ${total('reservas')}`);
console.log('Admin:   admin@restaurante.com / admin123');
console.log('Cliente: cliente@restaurante.com / cliente123');
