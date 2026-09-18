const OrdenProduccionModel = require('../models/ordenProduccion.model');
const ConsumoMPModel = require('../models/consumoMP.model');
const ProduccionService = require('../services/produccion.service');

/**
 * Controlador del Proceso Productivo (Órdenes de Producción y Consumos de Materia Prima)
 */
class ProduccionController {
  /**
   * GET /api/v1/produccion/ordenes
   */
  static async getOrdenes(req, res, next) {
    try {
      const ordenes = await OrdenProduccionModel.getAll();
      res.status(200).json({
        success: true,
        data: ordenes,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/produccion/ordenes/:id
   */
  static async getOrdenById(req, res, next) {
    try {
      const orden = await OrdenProduccionModel.findById(req.params.id);
      if (!orden) {
        return res.status(404).json({
          success: false,
          error: 'Orden de producción no encontrada',
        });
      }
      res.status(200).json({
        success: true,
        data: orden,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/produccion/ordenes/:id/consumos
   */
  static async getConsumosByOrden(req, res, next) {
    try {
      const consumos = await ConsumoMPModel.getByOrdenId(req.params.id);
      res.status(200).json({
        success: true,
        data: consumos,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/produccion/consumos
   * Transacción ACID de consumo con descuento de stock
   */
  static async registrarConsumo(req, res, next) {
    try {
      const resultado = await ProduccionService.registrarConsumoMP(req.body, req.usuario.id);

      res.status(201).json({
        success: true,
        message: 'Consumo de materia prima registrado y stock descontado exitosamente',
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProduccionController;
