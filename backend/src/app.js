const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Middlewares
const errorHandler = require('./middlewares/error.middleware');

// Rutas
const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const materiasPrimasRoutes = require('./routes/materiasPrimas.routes');
const lotesPTRoutes = require('./routes/lotesPT.routes');
const produccionRoutes = require('./routes/produccion.routes');
const trazabilidadRoutes = require('./routes/trazabilidad.routes');
const despachosRoutes = require('./routes/despachos.routes');

const app = express();

// 1. Seguridad HTTP y Cabeceras
app.use(helmet());

// 2. Configuración de CORS
app.use(cors({
  origin: '*', // Permitir conexión desde frontend de desarrollo o red de planta
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 3. Parseo de cuerpo JSON
app.use(express.json());

// 4. Logger simple de peticiones en entorno de desarrollo
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// 5. Healthcheck del servicio
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Servicio API TrackFinal operativo',
    empresa: 'Lácteos San Antonio S.A.',
    sistema: 'KIT AVZ-03 (Trazabilidad de Lote/Unidad)',
    timestamp: new Date().toISOString(),
  });
});

// 6. Montaje de Rutas de la API REST
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/productos', productosRoutes);
app.use('/api/v1/materias-primas', materiasPrimasRoutes);
app.use('/api/v1/lotes-pt', lotesPTRoutes);
app.use('/api/v1/produccion', produccionRoutes);
app.use('/api/v1/trazabilidad', trazabilidadRoutes);
app.use('/api/v1/despachos', despachosRoutes);

// 7. Manejador para rutas inexistentes (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta ${req.method} ${req.originalUrl} no encontrada en este servidor`,
  });
});

// 8. Manejador centralizado de excepciones (500, 400, etc.)
app.use(errorHandler);

module.exports = app;
