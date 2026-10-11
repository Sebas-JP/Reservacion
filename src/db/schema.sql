-- Script de la base de datos: Plataforma de Reservas de Restaurante
-- Motor: SQLite (node:sqlite)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      TEXT NOT NULL,
  correo      TEXT NOT NULL UNIQUE,
  contrasena  TEXT NOT NULL,                       -- hash de bcryptjs, nunca texto plano
  rol         TEXT NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin'))
);

CREATE TABLE IF NOT EXISTS mesas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  numero      INTEGER NOT NULL UNIQUE,
  capacidad   INTEGER NOT NULL CHECK (capacidad > 0)
);

CREATE TABLE IF NOT EXISTS reservas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id  INTEGER NOT NULL,
  mesa_id     INTEGER,                              -- opcional: se puede asignar una mesa
  fecha       TEXT NOT NULL,                        -- formato YYYY-MM-DD
  hora        TEXT NOT NULL,                        -- formato HH:MM
  personas    INTEGER NOT NULL CHECK (personas > 0),
  estado      TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'cancelada')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (mesa_id)    REFERENCES mesas(id)    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_reservas_fecha_hora ON reservas (fecha, hora);
CREATE INDEX IF NOT EXISTS idx_reservas_usuario    ON reservas (usuario_id);

-- Evita que una misma mesa tenga dos reservas activas en la misma fecha y hora
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservas_sin_conflicto
  ON reservas (mesa_id, fecha, hora)
  WHERE estado = 'activa' AND mesa_id IS NOT NULL;
