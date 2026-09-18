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
    if (!codigoLotePT) {
      const error = new Error('Se requiere el código de lote de producto terminado');
      error.statusCode = 400;
      throw error;
    }

    const data = await TrazabilidadModel.getGenealogiaAtras(codigoLotePT);
    if (!data) {
      const error = new Error(`No se encontró el lote de producto terminado con código '${codigoLotePT}'`);
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
    if (!codigoLoteMP) {
      const error = new Error('Se requiere el código de lote de materia prima');
      error.statusCode = 400;
      throw error;
    }

    const data = await TrazabilidadModel.getGenealogiaAdelante(codigoLoteMP);
    if (!data) {
      const error = new Error(`No se encontró el lote de materia prima con código '${codigoLoteMP}'`);
      error.statusCode = 404;
      throw error;
    }

    return data;
  }
}

module.exports = TrazabilidadService;
