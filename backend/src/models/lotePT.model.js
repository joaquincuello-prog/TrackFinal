const db = require('../config/db');

/**
 * Repositorio de Lotes de Producto Terminado (PT) con Identificación QR y Estado (MySQL)
 */
class LotePTModel {
  /**
   * Helper para asegurar que el campo codigo_qr_payload sea un objeto JSON.
   */
  static _parseQrPayload(row) {
    if (!row) return row;
    if (row.codigo_qr_payload && typeof row.codigo_qr_payload === 'string') {
      try {
        row.codigo_qr_payload = JSON.parse(row.codigo_qr_payload);
      } catch (e) {
        // mantener como string si falla el parseo
      }
    }
    return row;
  }

  /**
   * Inserta un nuevo lote de producto terminado con su payload JSON para código QR.
   */
  static async create(data, client = null) {
    const text = `
      INSERT INTO lotes_producto_terminado
        (orden_produccion_id, codigo_lote_pt, cantidad_elaborada, fecha_elaboracion, fecha_vencimiento, estado, codigo_qr_payload, ubicacion_deposito)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const executor = client || db;
    const payloadStr = typeof data.codigo_qr_payload === 'string'
      ? data.codigo_qr_payload
      : JSON.stringify(data.codigo_qr_payload);

    const res = await executor.query(text, [
      data.orden_produccion_id,
      data.codigo_lote_pt,
      data.cantidad_elaborada,
      data.fecha_elaboracion,
      data.fecha_vencimiento,
      data.estado || 'EN_PROCESO',
      payloadStr,
      data.ubicacion_deposito || null,
    ]);

    const newId = res.insertId;
    const { rows } = await executor.query('SELECT * FROM lotes_producto_terminado WHERE id = ? LIMIT 1;', [newId]);
    return this._parseQrPayload(rows[0]);
  }

  /**
   * Obtiene todos los lotes de producto terminado con filtros opcionales.
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
      queryText += ` AND lpt.estado = ?`;
    }

    if (filtros.busqueda) {
      values.push(`%${filtros.busqueda}%`);
      values.push(`%${filtros.busqueda}%`);
      queryText += ` AND (lpt.codigo_lote_pt LIKE ? OR pt.nombre LIKE ?)`;
    }

    queryText += ` ORDER BY lpt.created_at DESC;`;

    const { rows } = await db.query(queryText, values);
    return rows.map((r) => this._parseQrPayload(r));
  }

  /**
   * Busca un lote PT por su código alfanumérico único.
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
      WHERE lpt.codigo_lote_pt = ?
      LIMIT 1;
    `;
    const { rows } = await db.query(text, [codigoLotePT]);
    return this._parseQrPayload(rows[0] || null);
  }

  /**
   * Busca un lote PT por su ID numérico.
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
      WHERE lpt.id = ?
      LIMIT 1;
    `;
    const executor = client || db;
    const { rows } = await executor.query(text, [id]);
    return this._parseQrPayload(rows[0] || null);
  }

  /**
   * Actualiza el estado de un lote de producto terminado.
   */
  static async updateEstado(idOCodigo, nuevoEstado, client = null) {
    const isNum = !isNaN(Number(idOCodigo));
    const text = isNum
      ? `UPDATE lotes_producto_terminado SET estado = ? WHERE id = ?;`
      : `UPDATE lotes_producto_terminado SET estado = ? WHERE codigo_lote_pt = ?;`;
    const executor = client || db;
    await executor.query(text, [nuevoEstado, idOCodigo]);

    if (isNum) {
      return await this.findById(idOCodigo, executor);
    } else {
      return await this.findByCodigo(idOCodigo);
    }
  }
}

module.exports = LotePTModel;
