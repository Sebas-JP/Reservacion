# Base de datos y servidor (rama `feature/db`)

Base de datos SQLite con `node:sqlite` (requiere Node.js 22.13 o superior).
El archivo se crea solo en `data/restaurante.db` (no se sube a git).

## Cómo usarla

```bash
npm install
npm run seed    # crea tablas y datos de ejemplo
npm start       # http://localhost:3000  ->  /api/salud
```

Usuarios de ejemplo: `admin@restaurante.com / admin123` y `cliente@restaurante.com / cliente123`.

## Usar la conexión

```js
const db = require('../db/conexion');

const usuario = db.prepare('SELECT * FROM usuarios WHERE correo = ?').get(correo);
const info = db.prepare(
  'INSERT INTO reservas (usuario_id, fecha, hora, personas) VALUES (?, ?, ?, ?)'
).run(usuarioId, '2026-10-15', '20:00', 4);
console.log(info.lastInsertRowid);
```

## Contraseñas

En `usuarios.contrasena` se guarda el hash de **bcryptjs** (nunca texto plano):

```js
const bcrypt = require('bcryptjs');

const guardada = bcrypt.hashSync('miClave', 10);   // esto se guarda en la base
bcrypt.compareSync('miClave', guardada);           // true / false
```

## Agregar rutas

Crear un archivo en `src/routes/` que exporte un Router. `server.js` lo carga solo
y lo monta en `/api/<nombre-del-archivo>`:

```js
// src/routes/reservas.js  ->  /api/reservas
const { Router } = require('express');
const db = require('../db/conexion');

const router = Router();
router.get('/', (req, res) => res.json(db.prepare('SELECT * FROM reservas').all()));

module.exports = router;
```

## Tablas

- **usuarios**: `id`, `nombre`, `correo` (único), `contrasena` (hash bcryptjs), `rol` (`cliente` | `admin`)
- **mesas**: `id`, `numero` (único), `capacidad`
- **reservas**: `id`, `usuario_id`, `mesa_id` (opcional), `fecha` (`YYYY-MM-DD`), `hora` (`HH:MM`), `personas`, `estado` (`activa` | `cancelada`)

Una mesa no puede tener dos reservas **activas** en la misma fecha y hora (índice único
`idx_reservas_sin_conflicto`). Si pasa, SQLite lanza `UNIQUE constraint failed`; la ruta de
reservas debe capturarlo y responder "mesa ocupada".
