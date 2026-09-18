const MateriaPrimaModel = require('../models/materiaPrima.model');

/**
 * Controlador de Materias Primas e Insumos Lácteos
 */
class MateriasPrimasController {
  /**
   * GET /api/v1/materias-primas
   */
  static async getAll(req, res, next) {
    try {
      const items = await MateriaPrimaModel.getAll();
      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/materias-primas/lotes
   * Lotes con saldo positivo disponibles para fraccionamiento/elaboración
   */
  static async getLotesDisponibles(req, res, next) {
    try {
      const lotes = await MateriaPrimaModel.getLotesDisponibles();
      res.status(200).json({
        success: true,
        data: lotes,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MateriasPrimasController;
