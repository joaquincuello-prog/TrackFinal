const DespachoModel = require('../models/despacho.model');
const DespachosService = require('../services/despachos.service');

/**
 * Controlador de Expedición, Remitos y Clientes
 */
class DespachosController {
  /**
   * GET /api/v1/despachos/clientes
   */
  static async getClientes(req, res, next) {
    try {
      const clientes = await DespachoModel.getAllClientes();
      res.status(200).json({
        success: true,
        data: clientes,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/despachos
   */
  static async getAll(req, res, next) {
    try {
      const despachos = await DespachoModel.getAll();
      res.status(200).json({
        success: true,
        data: despachos,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/despachos
   */
  static async create(req, res, next) {
    try {
      const resultado = await DespachosService.registrarDespacho(req.body, req.usuario.id);

      res.status(201).json({
        success: true,
        message: 'Despacho registrado correctamente y lote vinculado al cliente',
        data: {
          despacho_id: resultado.despacho.id,
          numero_remito: resultado.despacho.numero_remito,
          lote_pt_id: resultado.despacho.lote_pt_id,
          nuevo_estado_lote: resultado.lote_actualizado.estado,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DespachosController;
