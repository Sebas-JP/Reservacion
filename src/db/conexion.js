// Conexión compartida a la base de datos SQLite (node:sqlite).
// Uso desde otros módulos:
//   const db = require('../db/conexion');
//   const usuarios = db.prepare('SELECT * FROM usuarios').all();

const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const rutaDB = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'restaurante.db');

fs.mkdirSync(path.dirname(rutaDB), { recursive: true });

const db = new DatabaseSync(rutaDB);

// Activa llaves foráneas y crea las tablas si no existen
db.exec('PRAGMA foreign_keys = ON;');
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

// Migración: si la base ya existía de una versión anterior, agrega las columnas
// nuevas de mesas (CREATE TABLE IF NOT EXISTS no modifica tablas que ya existen).
function agregarColumna(tabla, columna, definicion) {
  const existe = db.prepare(`PRAGMA table_info(${tabla})`).all().some((c) => c.name === columna);
  if (!existe) db.exec(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`);
}
agregarColumna('mesas', 'ubicacion', "TEXT NOT NULL DEFAULT 'interior' CHECK (ubicacion IN ('interior', 'terraza'))");
agregarColumna('mesas', 'estado', "TEXT NOT NULL DEFAULT 'libre' CHECK (estado IN ('libre', 'reservada', 'ocupada'))");

module.exports = db;
