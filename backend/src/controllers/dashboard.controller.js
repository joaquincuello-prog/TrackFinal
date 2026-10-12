const DashboardModel = require('../models/dashboard.model');

/**
 * Controlador para el Dashboard de KPIs Industriales – KIT AVZ-03 (TrackFinal)
 */
class DashboardController {
  /**
   * GET /api/v1/dashboard/kpis
   * Retorna métricas de resumen: totales por estado, tasa de conformidad e indicadores MTTt.
   */
  static async getKPIs(req, res, next) {
    try {
      const { desde, hasta } = req.query;
      const kpis = await DashboardModel.getKPIsResumen({ desde, hasta });

      res.status(200).json({
        success: true,
        data: {
          kpis,
          mttt_manual_horas: '24-48 hs',
          mttt_sistema_segundos: '< 5 seg',
          empresa: 'Lácteos San Antonio S.A.',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/distribucion-estados
   * Retorna un array [{ estado, cantidad }] para gráfico de dona.
   */
  static async getDistribucionEstados(req, res, next) {
    try {
      const { desde, hasta } = req.query;
      const distribucion = await DashboardModel.getDistribucionEstados({ desde, hasta });

      res.status(200).json({
        success: true,
        data: distribucion,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/volumen-linea
   * Retorna [{ linea_produccion, total_unidades, cantidad_lotes }] para gráfico de barras.
   */
  static async getVolumenPorLinea(req, res, next) {
    try {
      const { desde, hasta, linea_produccion } = req.query;
      const volumen = await DashboardModel.getVolumenPorLinea({ desde, hasta, linea_produccion });

      res.status(200).json({
        success: true,
        data: volumen,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/lotes-export
   * Retorna el listado completo de lotes aplicando todos los filtros avanzados.
   * Destinado a exportación CSV/Excel desde el frontend.
   */
  static async getLotesExport(req, res, next) {
    try {
      const {
        desde,
        hasta,
        producto_id,
        linea_produccion,
        estados,
        busqueda,
        lote_mp,
      } = req.query;

      // Normalizar el parámetro `estados`: puede llegar como string CSV o como array (qs)
      const estadosArr = estados
        ? (Array.isArray(estados) ? estados : estados.split(',').map((s) => s.trim()).filter(Boolean))
        : undefined;

      const lotes = await DashboardModel.getLotesConFiltrosAvanzados({
        desde,
        hasta,
        producto_id,
        linea_produccion,
        estados: estadosArr,
        busqueda,
        lote_mp,
      });

      res.status(200).json({
        success: true,
        total: lotes.length,
        data: lotes,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/panel-operativo
   * Retorna métricas extendidas: producción por producto, despachos por cliente,
   * alertas sanitarias/vencimiento y últimos eventos en planta.
   */
  static async getPanelOperativo(req, res, next) {
    try {
      const { desde, hasta, diasAlerta } = req.query;
      const panel = await DashboardModel.getPanelOperativo({ desde, hasta, diasAlerta });

      res.status(200).json({
        success: true,
        data: panel,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DashboardController;
