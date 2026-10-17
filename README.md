# Reservacion - Restaurante Ratatoulli

Plataforma web de reservas de restaurante: los clientes reservan mesas desde
el navegador y el administrador gestiona las reservas del día y el menú.

## Tecnologías
- Node.js + Express
- MariaDB (paquete mysql2)
- Autenticación con JWT y bcryptjs
- Subida de imágenes con multer
- Frontend en HTML, CSS y JavaScript (carpeta `public/`)

## Requisitos
- Node.js (versión LTS)
- Git
- MariaDB en ejecución (y HeidiSQL opcional para ver las tablas)

## Cómo correrlo
1. Clonar el repositorio:
```
   git clone https://github.com/Sebas-JP/Reservacion.git
   cd Reservacion
```
2. Instalar dependencias: `npm install`
3. Copiar `.env.example` a `.env` y completar:
   - `DB_PASSWORD`: la contraseña de `root` de tu MariaDB
   - `JWT_SECRET`: un texto largo y secreto (el mismo para todo el equipo)
4. Iniciar el servidor: `npm start`
   (la base `restaurante` y sus tablas se crean solas)
5. Cargar las mesas de ejemplo: `npm run seed`
6. Abrir http://localhost:3000

## Crear un administrador
Nadie puede registrarse como admin. Primero registra una cuenta normal en
`registro.html` y luego, en HeidiSQL o en la consola de MariaDB:

```sql
UPDATE usuarios SET rol = 'admin' WHERE correo = 'tu_correo@ejemplo.com';
```

El administrador entra por `login-admin.html`.

## Rutas principales de la API
Las marcadas con (T) exigen el header `Authorization: Bearer <token>`.

| Método | Ruta | Acceso |
|---|---|---|
| POST | /api/auth/registro | Público |
| POST | /api/auth/login | Público |
| GET | /api/mesas | Público |
| GET | /api/menu | Público |
| POST | /api/menu | Admin (T) |
| PUT | /api/menu/:id | Admin (T) |
| DELETE | /api/menu/:id | Admin (T) |
| POST | /api/reservas | Cliente (T) |
| GET | /api/reservas/mias | Cliente (T) |
| DELETE | /api/reservas/:id | Cliente (T) |
| GET | /api/admin/reservas?fecha=AAAA-MM-DD | Admin (T) |
| PUT | /api/admin/reservas/:id | Admin (T) |

## Reglas de negocio
- Cada reserva ocupa la mesa 2 horas; no se permiten reservas que se solapen.
- Estados de una reserva: `activa`, `confirmada`, `cancelada`.
- Cada reserva recibe un código de confirmación (`RES-XXXXX`).
- El menú del día lo carga el administrador (nombre, precio e imagen).

## Equipo
- Juana Leticia Cuin Sente: base de datos, servidor y catálogo de mesas
- Damaris Paola Diaz Cruz: autenticación y menú del día
- Edgar Sebastian Panjoj Guarcax: reservas y panel de administración
- Pedro Jose Delgado Mendoza: diseño del frontend