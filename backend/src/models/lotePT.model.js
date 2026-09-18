const db = require('../config/db');

/**
 * Repositorio de Lotes de Producto Terminado (PT) con Identificación QR y Estado
 */
class LotePTModel {
  /**
   * Inserta un nuevo lote de producto terminado con su payload JSONB para código QR.
   * @param {Object} data
   * @param {number} data.orden_produccion_id
   * @param {string} data.codigo_lote_pt
   * @param {number} data.cantidad_elaborada
   * @param {string} data.fecha_elaboracion
   * @param {string} data.fecha_vencimiento
   * @param {string} [data.estado='EN_PROCESO']
   * @param {Object} data.codigo_qr_payload
   * @param {string} [data.ubicacion_deposito]
   * @param {import('pg').PoolClient} [client]
   */
  static async create(data, client = null) {
    const text = `
      INSERT INTO lotes_producto_terminado
        (orden_produccion_id, codigo_lote_pt, cantidad_elaborada, fecha_elaboracion, fecha_vencimiento, estado, codigo_qr_payload, ubicacion_deposito)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const executor = client || db;
    const { rows } = await executor.query(text, [
      data.orden_produccion_id,
      data.codigo_lote_pt,
      data.cantidad_elaborada,
      data.fecha_elaboracion,
      data.fecha_vencimiento,
      data.estado || 'EN_PROCESO',
      JSON.stringify(data.codigo_qr_payload), // PostgreSQL driver almacena JSONB
      data.ubicacion_deposito || null,
    ]);
    return rows[0];
  }

  /**
   * Obtiene todos los lotes de producto terminado con filtros opcionales.
   * @param {Object} [filtros={}]
   * @param {string} [filtros.estado]
   * @param {string} [filtros.busqueda]
   */
  static async getAll(filtros = {}) {
    let queryText = `
      SELECT 
        lpt.id,
        lpt.codigo_lote_pt,
        lpt.cantidad_elaborada,
        lpt.fecha_elaboracion,
        lpt.fecha_vencimiento,
        lpt.estado,
        lpt.ubicacion_deposito,
        lpt.codigo_qr_payload,
        lpt.created_at,
        op.numero_op,
        pt.nombre AS producto_nombre,
        pt.codigo_sku,
        pt.unidad_medida,
        pt.temperatura_conservacion
      FROM lotes_producto_terminado lpt
      JOIN ordenes_produccion op ON lpt.orden_produccion_id = op.id
      JOIN productos_terminados pt ON op.producto_terminado_id = pt.id
      WHERE 1=1
    `;
    const values = [];

    if (filtros.estado) {
      values.push(filtros.estado);
      queryText += ` AND lpt.estado = $${values.length}`;
    }

    if (filtros.busqueda) {
      values.push(`%${filtros.busqueda}%`);
      queryText += ` AND (lpt.codigo_lote_pt ILIKE $${values.length} OR pt.nombre ILIKE $${values.length})`;
    }

    queryText += ` ORDER BY lpt.created_at DESC;`;

    const { rows } = await db.query(queryText, values);
    return rows;
  }

  /**
   * Busca un lote PT por su código alfanumérico único.
   * @param {string} codigoLotePT
   */
  static async findByCodigo(codigoLotePT) {
    const text = `
      SELECT 
        lpt.id,
        lpt.orden_produccion_id,
        lpt.codigo_lote_pt,
        lpt.cantidad_elaborada,
        lpt.fecha_elaboracion,
        lpt.fecha_vencimiento,
        lpt.estado,
        lpt.ubicacion_deposito,
        lpt.codigo_qr_payload,
        lpt.created_at,
        op.numero_op,
        op.linea_produccion,
        pt.id AS producto_id,
        pt.nombre AS producto_nombre,
        pt.codigo_sku,
        pt.unidad_medida,
        pt.dias_vida_util,
        pt.temperatura_conservacion
      FROM lotes_producto_terminado lpt
      JOIN ordenes_produccion op ON lpt.orden_produccion_id = op.id
      JOIN productos_terminados pt ON op.producto_terminado_id = pt.id
      WHERE lpt.codigo_lote_pt = $1
      LIMIT 1;
    `;
    const { rows } = await db.query(text, [codigoLotePT]);
    return rows[0] || null;
  }

  /**
   * Busca un lote PT por su ID numérico.
   * @param {number} id
   * @param {import('pg').PoolClient} [client]
   */
  static async findById(id, client = null) {
    const text = `
      SELECT 
        lpt.*,
        pt.nombre AS producto_nombre,
        pt.codigo_sku
      FROM lotes_producto_terminado lpt
      JOIN ordenes_produccion op ON lpt.orden_produccion_id = op.id
      JOIN productos_terminados pt ON op.producto_terminado_id = pt.id
      WHERE lpt.id = $1
      LIMIT 1;
    `;
    const executor = client || db;
    const { rows } = await executor.query(text, [id]);
    return rows[0] || null;
  }

  /**
   * Actualiza el estado de un lote de producto terminado.
   * @param {string|number} idOCodigo
   * @param {string} nuevoEstado
   * @param {import('pg').PoolClient} [client]
   */
  static async updateEstado(idOCodigo, nuevoEstado, client = null) {
    const isNum = !isNaN(Number(idOCodigo));
    const text = isNum
      ? `UPDATE lotes_producto_terminado SET estado = $1 WHERE id = $2 RETURNING *;`
      : `UPDATE lotes_producto_terminado SET estado = $1 WHERE codigo_lote_pt = $2 RETURNING *;`;
    const executor = client || db;
    const { rows } = await executor.query(text, [nuevoEstado, idOCodigo]);
    return rows[0] || null;
  }
}

module.exports = LotePTModel;
