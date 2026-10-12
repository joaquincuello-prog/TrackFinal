const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboard.controller');
const authenticateToken = require('../middlewares/auth.middleware');

// Todas las rutas del dashboard requieren token válido
router.use(authenticateToken);

/**
 * GET /api/v1/dashboard/kpis
 * KPIs de resumen: totales por estado, tasa de conformidad e indicadores MTTt.
 * Query params opcionales: desde, hasta (YYYY-MM-DD)
 */
router.get('/kpis', DashboardController.getKPIs);

/**
 * GET /api/v1/dashboard/distribucion-estados
 * Distribución de lotes por estado para gráfico de dona.
 * Query params opcionales: desde, hasta
 */
router.get('/distribucion-estados', DashboardController.getDistribucionEstados);

/**
 * GET /api/v1/dashboard/volumen-linea
 * Volumen de unidades y cantidad de lotes agrupado por línea de producción.
 * Query params opcionales: desde, hasta, linea_produccion
 */
router.get('/volumen-linea', DashboardController.getVolumenPorLinea);

/**
 * GET /api/v1/dashboard/lotes-export
 * Listado de lotes con filtros avanzados para exportación CSV/Excel.
 * Query params opcionales: desde, hasta, producto_id, linea_produccion,
 *                          estados (CSV), busqueda, lote_mp
 */
router.get('/lotes-export', DashboardController.getLotesExport);

/**
 * GET /api/v1/dashboard/panel-operativo
 * Indicadores extendidos de planta, mercado, alertas y eventos recientes.
 */
router.get('/panel-operativo', DashboardController.getPanelOperativo);

module.exports = router;
