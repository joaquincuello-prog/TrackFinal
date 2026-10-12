const TrazabilidadModel = require('../models/trazabilidad.model');

/**
 * Servicio de Trazabilidad y Genealogía (KIT AVZ-03)
 */
class TrazabilidadService {
  /**
   * Reconstruye la genealogía hacia atrás (Backward Traceability) para un lote PT.
   * @param {string} codigoLotePT
   */
  static async obtenerGenealogiaAtras(codigoLotePT) {
    const codigoLimpio = String(codigoLotePT || '').trim();
    if (!codigoLimpio) {
      const error = new Error('Se requiere el código de lote de producto terminado');
      error.statusCode = 400;
      throw error;
    }

    const data = await TrazabilidadModel.getGenealogiaAtras(codigoLimpio);
    if (!data) {
      const error = new Error(`No se encontró el lote de producto terminado con código '${codigoLimpio}'`);
      error.statusCode = 404;
      throw error;
    }

    return data;
  }

  /**
   * Reconstruye la genealogía hacia adelante / Recall logístico para una materia prima.
   * @param {string} codigoLoteMP
   */
  static async obtenerGenealogiaAdelante(codigoLoteMP) {
    const codigoLimpio = String(codigoLoteMP || '').trim();
    if (!codigoLimpio) {
      const error = new Error('Se requiere el código de lote de materia prima');
      error.statusCode = 400;
      throw error;
    }

    const data = await TrazabilidadModel.getGenealogiaAdelante(codigoLimpio);
    if (!data) {
      const error = new Error(`No se encontró el lote de materia prima con código '${codigoLimpio}'`);
      error.statusCode = 404;
      throw error;
    }

    return data;
  }

  /**
   * Ejecuta el bloqueo preventivo cautelar (Recall) para los lotes elaborados con una MP observada.
   * @param {string} codigoLoteMP
   * @param {number} usuarioId
   * @param {string} motivo
   */
  static async ejecutarBloqueoPreventivo(codigoLoteMP, usuarioId, motivo) {
    if (!codigoLoteMP) {
      const error = new Error('Se requiere el código de lote de materia prima para el bloqueo preventivo');
      error.statusCode = 400;
      throw error;
    }

    return await TrazabilidadModel.bloqueoPreventivoRecall(codigoLoteMP, usuarioId, motivo);
  }
}

module.exports = TrazabilidadService;
