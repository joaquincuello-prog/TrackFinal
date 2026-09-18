const LotePTModel = require('../models/lotePT.model');
const LotesPTService = require('../services/lotesPT.service');

/**
 * Controlador de Lotes de Producto Terminado y Rótulo QR
 */
class LotesPTController {
  /**
   * GET /api/v1/lotes-pt
   * Listado paginable o filtrable por estado/búsqueda
   */
  static async getAll(req, res, next) {
    try {
      const { estado, busqueda } = req.query;
      const lotes = await LotePTModel.getAll({ estado, busqueda });

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
   * GET /api/v1/lotes-pt/:codigo
   */
  static async getByCodigo(req, res, next) {
    try {
      const lote = await LotePTModel.findByCodigo(req.params.codigo);
      if (!lote) {
        return res.status(404).json({
          success: false,
          error: `Lote ${req.params.codigo} no encontrado`,
        });
      }

      res.status(200).json({
        success: true,
        data: lote,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/lotes-pt
   * Generación atómica de lote PT con payload JSONB de QR y evento inicial de envasado
   */
  static async create(req, res, next) {
    try {
      const resultado = await LotesPTService.crearLotePT(req.body, req.usuario.id);

      res.status(201).json({
        success: true,
        message: 'Lote de producto terminado generado exitosamente con código QR',
        data: {
          id: resultado.lote.id,
          codigo_lote_pt: resultado.lote.codigo_lote_pt,
          estado: resultado.lote.estado,
          fecha_elaboracion: resultado.lote.fecha_elaboracion,
          fecha_vencimiento: resultado.lote.fecha_vencimiento,
          codigo_qr_payload: resultado.lote.codigo_qr_payload,
          evento_inicial: resultado.evento_inicial,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/lotes-pt/:codigo/estado
   * Modificación de estado (Bloqueo, Cuarentena, Aprobación)
   */
  static async cambiarEstado(req, res, next) {
    try {
      const { estado, motivo } = req.body;
      if (!estado) {
        return res.status(400).json({
          success: false,
          error: 'El campo estado es requerido',
        });
      }

      const loteActualizado = await LotesPTService.cambiarEstado(
        req.params.codigo,
        estado,
        req.usuario.id,
        motivo
      );

      res.status(200).json({
        success: true,
        message: `Estado del lote ${req.params.codigo} actualizado a ${estado}`,
        data: loteActualizado,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LotesPTController;
