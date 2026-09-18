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
}

module.exports = TrazabilidadController;
