// Datos de ejemplo. Ejecutar con: npm run seed
// Crea la base y las tablas si faltan. Es seguro correrlo varias veces (no duplica registros).

const db = require('./conexion');
const bcrypt = require('bcryptjs');

const usuarios = [
  { nombre: 'Administrador', correo: 'admin@restaurante.com', contrasena: 'admin123', rol: 'admin' },
  { nombre: 'Cliente Demo', correo: 'cliente@restaurante.com', contrasena: 'cliente123', rol: 'cliente' },
];

// [numero, capacidad, ubicacion]. Si la mesa ya existe se actualizan capacidad y
// ubicacion, pero NO su estado actual.
const mesas = [
  [1, 2, 'interior'], [2, 2, 'interior'], [3, 4, 'interior'],
  [4, 4, 'interior'], [5, 6, 'interior'], [6, 8, 'interior'],
  [7, 2, 'terraza'],  [8, 4, 'terraza'],  [9, 4, 'terraza'], [10, 6, 'terraza'],
];

async function total(tabla) {
  const [[{ n }]] = await db.query(`SELECT COUNT(*) AS n FROM ${tabla}`);
  return n;
}

async function main() {
  await db.iniciar();

  for (const u of usuarios) {
    await db.query(
      'INSERT IGNORE INTO usuarios (nombre, correo, contrasena, rol) VALUES (?, ?, ?, ?)',
      [u.nombre, u.correo, bcrypt.hashSync(u.contrasena, 10), u.rol]
    );
  }

  for (const [numero, capacidad, ubicacion] of mesas) {
    const [r] = await db.query('SELECT id FROM mesas WHERE numero = ?', [numero]);
    if (r.length) {
      await db.query('UPDATE mesas SET capacidad = ?, ubicacion = ? WHERE numero = ?', [capacidad, ubicacion, numero]);
    } else {
      await db.query('INSERT INTO mesas (numero, capacidad, ubicacion) VALUES (?, ?, ?)', [numero, capacidad, ubicacion]);
    }
  }

  console.log(`Seed listo -> usuarios: ${await total('usuarios')}, mesas: ${await total('mesas')}, reservas: ${await total('reservas')}`);
  console.log('Admin:   admin@restaurante.com / admin123');
  console.log('Cliente: cliente@restaurante.com / cliente123');
  await db.end();
}

main().catch((error) => {
  console.error('Error en el seed:', error.message);
  process.exit(1);
});
