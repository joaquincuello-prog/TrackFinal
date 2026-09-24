const db = require('../config/db');

/**
 * Repositorio de Órdenes de Producción (OP) - MySQL
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
      WHERE op.id = ?
      LIMIT 1;
    `;
    const executor = client || db;
    const { rows } = await executor.query(text, [id]);
    return rows[0] || null;
  }

  /**
   * Actualiza el estado de una orden de producción.
   */
  static async updateEstado(id, estado, client = null) {
    const text = `
      UPDATE ordenes_produccion
      SET 
        estado = ?,
        fecha_fin = CASE WHEN ? = 'FINALIZADA' THEN NOW() ELSE fecha_fin END
      WHERE id = ?;
    `;
    const executor = client || db;
    await executor.query(text, [estado, estado, id]);
    return await this.findById(id, executor);
  }
}

module.exports = OrdenProduccionModel;
