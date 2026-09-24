const db = require('../config/db');

/**
 * Repositorio de Clientes y Despachos (Expedición y Remitos) - MySQL
 */
class DespachoModel {
  /**
   * Obtiene todos los clientes registrados.
   */
  static async getAllClientes() {
    const text = `
      SELECT id, cuit, razon_social, direccion, telefono, created_at
      FROM clientes
      ORDER BY razon_social ASC;
    `;
    const { rows } = await db.query(text);
    return rows;
  }

  /**
   * Registra un despacho de producto terminado vinculado a un cliente y remito.
   */
  static async create({ lote_pt_id, cliente_id, numero_remito, cantidad_despachada, usuario_id }, client) {
    const text = `
      INSERT INTO despachos
        (lote_pt_id, cliente_id, numero_remito, cantidad_despachada, usuario_id)
      VALUES
        (?, ?, ?, ?, ?);
    `;
    const res = await client.query(text, [
      lote_pt_id,
      cliente_id,
      numero_remito,
      cantidad_despachada,
      usuario_id,
    ]);

    const newId = res.insertId;
    const { rows } = await client.query('SELECT * FROM despachos WHERE id = ? LIMIT 1;', [newId]);
    return rows[0];
  }

  /**
   * Obtiene el listado de despachos realizados con datos de lote y cliente.
   */
  static async getAll() {
    const text = `
      SELECT 
        d.id,
        d.numero_remito,
        d.fecha_despacho,
        d.cantidad_despachada,
        lpt.codigo_lote_pt,
        pt.nombre AS producto_nombre,
        pt.unidad_medida,
        c.razon_social AS cliente_nombre,
        c.cuit AS cliente_cuit,
        CONCAT(u.nombre, ' ', u.apellido) AS despachador_nombre
      FROM despachos d
      JOIN lotes_producto_terminado lpt ON d.lote_pt_id = lpt.id
      JOIN ordenes_produccion op ON lpt.orden_produccion_id = op.id
      JOIN productos_terminados pt ON op.producto_terminado_id = pt.id
      JOIN clientes c ON d.cliente_id = c.id
      JOIN usuarios u ON d.usuario_id = u.id
      ORDER BY d.fecha_despacho DESC;
    `;
    const { rows } = await db.query(text);
    return rows;
  }
}

module.exports = DespachoModel;
