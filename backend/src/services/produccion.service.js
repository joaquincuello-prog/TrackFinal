const db = require('../config/db');
const MateriaPrimaModel = require('../models/materiaPrima.model');
const ConsumoMPModel = require('../models/consumoMP.model');
const OrdenProduccionModel = require('../models/ordenProduccion.model');

/**
 * Servicio de Producción y Consumo Transaccional de Materias Primas
 */
class ProduccionService {
  /**
   * Registra el consumo de un lote de materia prima en una orden de producción bajo transacción ACID:
   * 1. Verifica existencia de la OP.
   * 2. Bloquea la fila del lote MP con SELECT ... FOR UPDATE.
   * 3. Valida saldo suficiente y estado disponible.
   * 4. Descuenta el saldo y actualiza estado si queda en 0.
   * 5. Inserta el registro de consumo genealógico.
   * 
   * @param {Object} data
   * @param {number} data.orden_produccion_id
   * @param {number} data.lote_mp_id
   * @param {number} data.cantidad_consumida
   * @param {number} usuarioId - Operario que registra la tina/elaboración
   */
  static async registrarConsumoMP(data, usuarioId) {
    const { orden_produccion_id, lote_mp_id, cantidad_consumida } = data;

    if (!orden_produccion_id || !lote_mp_id || !cantidad_consumida) {
      const error = new Error('Campos requeridos: orden_produccion_id, lote_mp_id, cantidad_consumida');
      error.statusCode = 400;
      throw error;
    }

    const cantidadNum = Number(cantidad_consumida);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      const error = new Error('La cantidad consumida debe ser un número positivo');
      error.statusCode = 400;
      throw error;
    }

    // Ejecutar en bloque transaccional atómico
    return await db.withTransaction(async (client) => {
      // 1. Verificar existencia de la orden de producción
      const op = await OrdenProduccionModel.findById(orden_produccion_id, client);
      if (!op) {
        const error = new Error(`Orden de producción ID ${orden_produccion_id} no encontrada`);
        error.statusCode = 404;
        throw error;
      }

      // 2. Bloquear y verificar el lote de materia prima (FOR UPDATE para prevenir race conditions)
      const loteMP = await MateriaPrimaModel.findLoteById(lote_mp_id, client);
      if (!loteMP) {
        const error = new Error(`Lote de materia prima ID ${lote_mp_id} no encontrado`);
        error.statusCode = 404;
        throw error;
      }

      if (loteMP.estado !== 'DISPONIBLE') {
        const error = new Error(`El lote de materia prima ${loteMP.codigo_lote_mp} no está disponible (Estado actual: ${loteMP.estado})`);
        error.statusCode = 400;
        throw error;
      }

      const saldoActual = Number(loteMP.cantidad_actual);
      if (saldoActual < cantidadNum) {
        const error = new Error(
          `Stock insuficiente en el lote ${loteMP.codigo_lote_mp}. Saldo disponible: ${saldoActual} ${loteMP.unidad_medida}, Solicitado: ${cantidadNum} ${loteMP.unidad_medida}`
        );
        error.statusCode = 400;
        throw error;
      }

      // 3. Calcular nuevo saldo y estado
      const nuevoSaldo = Number((saldoActual - cantidadNum).toFixed(2));
      const nuevoEstado = nuevoSaldo === 0 ? 'AGOTADO' : 'DISPONIBLE';

      // 4. Actualizar stock en lotes_materia_prima
      const loteActualizado = await MateriaPrimaModel.updateStock(
        lote_mp_id,
        nuevoSaldo,
        nuevoEstado,
        client
      );

      // 5. Registrar el consumo en la tabla genealógica
      const consumo = await ConsumoMPModel.create(
        {
          orden_produccion_id,
          lote_mp_id,
          cantidad_consumida: cantidadNum,
          operario_id: usuarioId,
        },
        client
      );

      // 6. Si la OP estaba en CREADA, pasarla a EN_PROCESO
      if (op.estado === 'CREADA') {
        await OrdenProduccionModel.updateEstado(op.id, 'EN_PROCESO', client);
      }

      return {
        consumo,
        lote_mp_actualizado: {
          id: loteActualizado.id,
          codigo_lote_mp: loteActualizado.codigo_lote_mp,
          cantidad_anterior: saldoActual,
          cantidad_actual: nuevoSaldo,
          estado: nuevoEstado,
        },
      };
    });
  }
}

module.exports = ProduccionService;
