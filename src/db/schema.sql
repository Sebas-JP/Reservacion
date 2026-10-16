-- Script de la base de datos: Plataforma de Reservas de Restaurante
-- Motor: MariaDB. La base "restaurante" la crea conexion.js (iniciar) si no existe.
-- Si agregas tablas o columnas nuevas, escríbelas AL FINAL de este archivo.

CREATE TABLE IF NOT EXISTS usuarios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  correo      VARCHAR(150) NOT NULL UNIQUE,
  contrasena  VARCHAR(255) NOT NULL,                -- hash de bcryptjs, nunca texto plano
  rol         VARCHAR(10)  NOT NULL DEFAULT 'cliente',
  CONSTRAINT chk_usuarios_rol CHECK (rol IN ('cliente', 'admin'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mesas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  numero      INT NOT NULL UNIQUE,
  capacidad   INT NOT NULL,
  ubicacion   VARCHAR(10) NOT NULL DEFAULT 'interior',
  estado      VARCHAR(10) NOT NULL DEFAULT 'libre',
  CONSTRAINT chk_mesas_capacidad CHECK (capacidad > 0),
  CONSTRAINT chk_mesas_ubicacion CHECK (ubicacion IN ('interior', 'terraza')),
  CONSTRAINT chk_mesas_estado    CHECK (estado IN ('libre', 'reservada', 'ocupada'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reservas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  mesa_id     INT NULL,                             -- opcional: se puede asignar una mesa
  fecha       DATE NOT NULL,                        -- se lee como 'YYYY-MM-DD'
  hora        TIME NOT NULL,                        -- se escribe 'HH:MM', se lee 'HH:MM:SS'
  personas    INT NOT NULL,
  estado      VARCHAR(10) NOT NULL DEFAULT 'activa',
  -- Truco para evitar choques: vale 1 mientras la reserva está activa o confirmada y NULL
  -- si está cancelada. MariaDB permite varios NULL en un índice único, así que las
  -- canceladas no bloquean la mesa.
  bloquea_mesa TINYINT AS (CASE WHEN estado IN ('activa', 'confirmada') THEN 1 ELSE NULL END) VIRTUAL,
  CONSTRAINT chk_reservas_personas CHECK (personas > 0),
  CONSTRAINT chk_reservas_estado   CHECK (estado IN ('activa', 'confirmada', 'cancelada')),
  CONSTRAINT fk_reservas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_reservas_mesa    FOREIGN KEY (mesa_id)    REFERENCES mesas(id)    ON DELETE SET NULL,
  INDEX idx_reservas_fecha_hora (fecha, hora),
  INDEX idx_reservas_usuario (usuario_id),
  -- Una misma mesa no puede tener dos reservas vigentes en la misma fecha y hora
  UNIQUE KEY idx_reservas_sin_conflicto (mesa_id, fecha, hora, bloquea_mesa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Persona 3: código de confirmación y preferencia de la reserva
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS codigo VARCHAR(10) NULL;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS preferencia VARCHAR(255) NULL;
ALTER TABLE reservas ADD UNIQUE INDEX IF NOT EXISTS idx_reservas_codigo (codigo);