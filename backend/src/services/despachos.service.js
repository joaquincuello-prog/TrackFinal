const db = require('../config/db');
const DespachoModel = require('../models/despacho.model');
const LotePTModel = require('../models/lotePT.model');
const EventoTrazabilidadModel = require('../models/eventoTrazabilidad.model');

/**
 * Servicio de Despacho y Expedición de Producto Terminado
 */
class DespachosService {
  /**
   * Registra la salida física y legal de mercadería hacia un cliente:
   * 1. Verifica estado bromatológico y operativo del lote PT.
   * 2. Registra el despacho con su número de remito.
   * 3. Actualiza el estado del lote a DESPACHADO.
   * 4. Registra el evento en Punto 6 (Playa de Despacho).
   * 
   * @param {Object} data
   * @param {number} usuarioId - Supervisor / Encargado de despacho
   */
  static async registrarDespacho(data, usuarioId) {
    const { lote_pt_id, cliente_id, numero_remito, cantidad_despachada } = data;

    if (!lote_pt_id || !cliente_id || !numero_remito || !cantidad_despachada) {
      const error = new Error('Campos requeridos: lote_pt_id, cliente_id, numero_remito, cantidad_despachada');
      error.statusCode = 400;
      throw error;
    }

    const cantidadNum = Number(cantidad_despachada);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      const error = new Error('La cantidad despachada debe ser mayor a 0');
      error.statusCode = 400;
      throw error;
    }

    return await db.withTransaction(async (client) => {
      // 1. Obtener lote PT y validar su estado
      const lote = await LotePTModel.findById(lote_pt_id, client);
      if (!lote) {
        const error = new Error(`Lote de producto terminado ID ${lote_pt_id} no encontrado`);
        error.statusCode = 404;
        throw error;
      }

      const estadosNoPermitidos = ['BLOQUEADO', 'RECHAZADO', 'CUARENTENA'];
      if (estadosNoPermitidos.includes(lote.estado)) {
        const error = new Error(
          `No es posible despachar el lote ${lote.codigo_lote_pt} porque se encuentra en estado '${lote.estado}'. Requiere liberación bromatológica.`
        );
        error.statusCode = 400;
        throw error;
      }

      // 2. Insertar despacho
      const despacho = await DespachoModel.create(
        {
          lote_pt_id,
          cliente_id,
          numero_remito,
          cantidad_despachada: cantidadNum,
          usuario_id: usuarioId,
        },
        client
      );

      // 3. Actualizar estado del lote a DESPACHADO
      const loteActualizado = await LotePTModel.updateEstado(lote.id, 'DESPACHADO', client);

      // 4. Registrar evento inmutable en Punto 6 ('PC-DESP' - Playa de Despacho y Expedición)
      await EventoTrazabilidadModel.create(
        {
          lote_pt_id: lote.id,
          punto_captura_id: 6,
          usuario_id: usuarioId,
          etapa_nombre: 'Salida de Planta y Despacho',
          linea_equipo: 'Playa de Carga Camión Térmico',
          observaciones: `Mercadería despachada con remito ${numero_remito}. Cantidad: ${cantidadNum} unidades.`,
        },
        client
      );

      return {
        despacho,
        lote_actualizado: loteActualizado,
      };
    });
  }
}

module.exports = DespachosService;
