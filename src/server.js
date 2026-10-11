// Servidor principal. Configura Express, carga automáticamente las rutas de los
// demás compañeros desde src/routes/ y arranca el servidor.
//
// Convención: cada archivo en src/routes/ hace `module.exports = router` (un Router
// de Express) y se monta en /api/<nombre-del-archivo>.
//   src/routes/auth.js     -> /api/auth
//   src/routes/reservas.js -> /api/reservas

require('dotenv').config({ quiet: true });
const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const db = require('./db/conexion');

const app = express();
const PUERTO = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Comprobación rápida de que el servidor y la base de datos responden
app.get('/api/salud', (req, res) => {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM usuarios').get();
  res.json({ mensaje: 'Servidor funcionando', usuarios: n });
});

// Carga automática de rutas
const carpetaRutas = path.join(__dirname, 'routes');
if (fs.existsSync(carpetaRutas)) {
  const archivos = fs.readdirSync(carpetaRutas).filter((f) => f.endsWith('.js')).sort();
  for (const archivo of archivos) {
    const nombre = archivo.replace(/\.js$/, '');
    try {
      const router = require(path.join(carpetaRutas, archivo));
      if (typeof router !== 'function') {
        console.warn(`[rutas] ${archivo} no exporta un Router (module.exports = router), se omite.`);
        continue;
      }
      app.use(`/api/${nombre}`, router);
      console.log(`[rutas] /api/${nombre} cargada`);
    } catch (error) {
      console.error(`[rutas] Error cargando ${archivo}:`, error.message);
    }
  }
}

// 404 para rutas de API inexistentes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo general de errores
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PUERTO, () => {
  console.log(`Servidor en http://localhost:${PUERTO}`);
});
