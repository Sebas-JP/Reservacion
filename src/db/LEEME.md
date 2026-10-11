# Base de datos y servidor (rama `feature/db-mesas`)

Base de datos **MariaDB** (paquete `mysql2`). Hay que tener MariaDB encendido en el computador
(por ejemplo con XAMPP: botón Start en MySQL). La base `restaurante` y sus tablas se crean solas.

## Cómo usarla

```bash
npm install
npm install mysql2          # nueva dependencia (si package.json aún no la trae)
cp .env.example .env        # y revisar DB_USER / DB_PASSWORD (en XAMPP: root y vacío)
npm run seed                # crea la base, las tablas y datos de ejemplo
npm start                   # http://localhost:3000  ->  /api/salud
```

Usuarios de ejemplo: `admin@restaurante.com / admin123` y `cliente@restaurante.com / cliente123`.

## Usar la conexión

Todo es **asíncrono**: se usa `await` y la función debe ser `async`. Los `?` evitan inyección SQL.

```js
const db = require('../db/conexion');

const [filas] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
const usuario = filas[0];            // undefined si no existe

const [resultado] = await db.query(
  'INSERT INTO reservas (usuario_id, fecha, hora, personas) VALUES (?, ?, ?, ?)',
  [usuarioId, '2026-10-15', '20:00', 4]
);
console.log(resultado.insertId);
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
router.get('/', async (req, res, next) => {
  try {
    const [reservas] = await db.query('SELECT * FROM reservas');
    res.json(reservas);
  } catch (error) { next(error); }
});

module.exports = router;
```

## Tablas

- **usuarios**: `id`, `nombre`, `correo` (único), `contrasena` (hash bcryptjs), `rol` (`cliente` | `admin`)
- **mesas**: `id`, `numero` (único), `capacidad`, `ubicacion` (`interior` | `terraza`), `estado` (`libre` | `reservada` | `ocupada`, por defecto `libre`)
- **reservas**: `id`, `usuario_id`, `mesa_id` (opcional), `fecha` (`YYYY-MM-DD`), `hora` (se guarda `HH:MM`, se lee `HH:MM:SS`), `personas`, `estado` (`activa` | `confirmada` | `cancelada`)

Una mesa no puede tener dos reservas **activas o confirmadas** en la misma fecha y hora (índice único
`idx_reservas_sin_conflicto`; las canceladas no bloquean). Si pasa, MariaDB lanza un error con
`error.code === 'ER_DUP_ENTRY'`; la ruta de reservas debe capturarlo y responder "mesa ocupada".
Ojo: el índice solo detecta la misma hora exacta; solapes de horario se validan en código.

## Catálogo de mesas (API)

- `GET /api/mesas` → lista de mesas ordenada por número.
- Filtros opcionales: `?ubicacion=terraza`, `?estado=libre`, `?capacidad_minima=4` (se pueden combinar).
- `GET /api/mesas/:id` → una mesa (404 si no existe).

Para cambiar el estado de una mesa desde el backend de reservas:

```js
await db.query('UPDATE mesas SET estado = ? WHERE id = ?', ['reservada', mesaId]);
```

## Si cambias la base de datos

Agrega tablas o columnas **al final** de `src/db/schema.sql` (con `CREATE TABLE IF NOT EXISTS`).
Las tablas que ya existen en tu MariaDB local no se modifican solas: si cambias una tabla existente,
bórrala en tu base local (`DROP DATABASE restaurante;`) y corre `npm run seed` otra vez.
