require('dotenv').config();
const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 3000;

/**
 * Inicialización y verificación de servicios
 */
const startServer = async () => {
  try {
    // 1. Probar conectividad con PostgreSQL
    console.log('[DATABASE] Verificando conexión con el servidor PostgreSQL...');
    const res = await db.query('SELECT NOW() AS now, current_database() AS db_name, version() AS version;');
    console.log(`[DATABASE OK] Conectado exitosamente a la base '${res.rows[0].db_name}' (${res.rows[0].now})`);

    // 2. Levantar servidor HTTP
    const server = app.listen(PORT, () => {
      console.log('=============================================================');
      console.log(`  TRACKFINAL API REST — KIT AVZ-03`);
      console.log(`  Lácteos San Antonio S.A. | Planta Cañuelas`);
      console.log(`  Servidor escuchando en: http://localhost:${PORT}`);
      console.log(`  Healthcheck: http://localhost:${PORT}/api/v1/health`);
      console.log(`  Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log('=============================================================');
    });

    // 3. Manejo de señales de terminación segura (Graceful Shutdown)
    const gracefulShutdown = async (signal) => {
      console.log(`\n[SHUTDOWN] Señal ${signal} recibida. Cerrando servidor HTTP y conexiones de base de datos...`);
      server.close(async () => {
        try {
          await db.pool.end();
          console.log('[SHUTDOWN OK] Pool de PostgreSQL cerrado limpiamente.');
          process.exit(0);
        } catch (err) {
          console.error('[SHUTDOWN ERROR] Error al cerrar pool:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    console.error('[FATAL SERVER ERROR] Error al iniciar el servidor backend:', error.message);
    console.error('Verifique que el servicio PostgreSQL esté activo y las credenciales en .env sean correctas.');
    process.exit(1);
  }
};

startServer();
