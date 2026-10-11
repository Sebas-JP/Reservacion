// Conexión compartida a MariaDB (paquete mysql2).
// Uso desde otros módulos (todo es asíncrono, hay que usar await):
//   const db = require('../db/conexion');
//   const [usuarios] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
//   const [resultado] = await db.query('INSERT INTO ... VALUES (?, ?)', [a, b]);  // resultado.insertId
//
// La configuración sale del archivo .env (ver .env.example).

require('dotenv').config({ quiet: true });
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

const NOMBRE_DB = process.env.DB_NAME || 'restaurante';

const configuracion = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

// Pool de conexiones a la base "restaurante". Fechas y horas se devuelven como texto.
const db = mysql.createPool({
  ...configuracion,
  database: NOMBRE_DB,
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
});

// Crea la base de datos y las tablas si no existen. server.js y seed.js la esperan
// antes de arrancar. Es seguro llamarla varias veces.
db.iniciar = async function iniciar() {
  try {
    const raiz = await mysql.createConnection({ ...configuracion, multipleStatements: true });
    await raiz.query(`CREATE DATABASE IF NOT EXISTS \`${NOMBRE_DB}\` CHARACTER SET utf8mb4`);
    await raiz.query(`USE \`${NOMBRE_DB}\``);
    await raiz.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
    await raiz.end();
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('No se pudo conectar a MariaDB. Revisa que esté encendido y los datos de .env (DB_USER, DB_PASSWORD).');
    }
    throw error;
  }
};

module.exports = db;
