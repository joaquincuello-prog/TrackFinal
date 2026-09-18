const db = require('../config/db');

/**
 * Repositorio de Órdenes de Producción (OP)
 */
class OrdenProduccionModel {
  /**
   * Obtiene el listado de órdenes de producción.
   */
  static async getAll() {
    const text = `
      SELECT 
        op.id, 
        op.numero_op, 
        op.producto_terminado_id,
        pt.nombre AS producto_nombre, 
        pt.codigo_sku, 
        op.cantidad_planificada, 
        pt.unidad_medida, 
        op.fecha_inicio, 
        op.fecha_fin, 
        op.linea_produccion, 
        op.estado, 
        op.created_at
      FROM ordenes_produccion op
      JOIN productos_terminados pt ON op.producto_terminado_id = pt.id
      ORDER BY op.created_at DESC;
    `;
    const { rows } = await db.query(text);
    return rows;
  }

  /**
   * Obtiene una orden de producción por su ID.
   * @param {number} id
   * @param {import('pg').PoolClient} [client]
   */
  static async findById(id, client = null) {
    const text = `
      SELECT 
        op.id, 
        op.numero_op, 
        op.producto_terminado_id,
        pt.nombre AS producto_nombre, 
        pt.codigo_sku, 
        pt.dias_vida_util,
        op.cantidad_planificada, 
        pt.unidad_medida, 
        op.fecha_inicio, 
        op.fecha_fin, 
        op.linea_produccion, 
        op.estado, 
        op.created_at
      FROM ordenes_produccion op
      JOIN productos_terminados pt ON op.producto_terminado_id = pt.id
      WHERE op.id = $1
      LIMIT 1;
    `;
    const executor = client || db;
    const { rows } = await executor.query(text, [id]);
    return rows[0] || null;
  }

  /**
   * Actualiza el estado de una orden de producción.
   * @param {number} id
   * @param {string} estado
   * @param {import('pg').PoolClient} [client]
   */
  static async updateEstado(id, estado, client = null) {
    const text = `
      UPDATE ordenes_produccion
      SET 
        estado = $1,
        fecha_fin = CASE WHEN $1 = 'FINALIZADA' THEN NOW() ELSE fecha_fin END
      WHERE id = $2
      RETURNING *;
    `;
    const executor = client || db;
    const { rows } = await executor.query(text, [estado, id]);
    return rows[0] || null;
  }
}

module.exports = OrdenProduccionModel;
