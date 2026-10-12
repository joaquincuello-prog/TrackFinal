const TrazabilidadService = require('../services/trazabilidad.service');

/**
 * Controlador de Genealogía y Trazabilidad (KIT AVZ-03)
 */
class TrazabilidadController {
  /**
   * GET /api/v1/trazabilidad/backward/:codigo
   * Árbol completo hacia atrás del lote PT
   */
  static async getGenealogiaAtras(req, res, next) {
    try {
      const data = await TrazabilidadService.obtenerGenealogiaAtras(req.params.codigo);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/trazabilidad/forward/:codigo
   * Recall hacia adelante desde lote MP
   */
  static async getGenealogiaAdelante(req, res, next) {
    try {
      const data = await TrazabilidadService.obtenerGenealogiaAdelante(req.params.codigo);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/trazabilidad/recall/bloqueo-preventivo
   * Bloqueo cautelar de todos los lotes PT que contengan un lote de MP observado
   */
  static async bloqueoPreventivoRecall(req, res, next) {
    try {
      const { codigo_lote_mp, motivo } = req.body;
      const resultado = await TrazabilidadService.ejecutarBloqueoPreventivo(
        codigo_lote_mp,
        req.usuario.id,
        motivo
      );

      res.status(200).json({
        success: true,
        message: `Protocolo de Recall ejecutado exitosamente para el lote ${codigo_lote_mp}`,
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TrazabilidadController;
