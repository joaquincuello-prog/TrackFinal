const db = require('../config/db');

/**
 * Repositorio de Materias Primas y Lotes de Insumos
 */
class MateriaPrimaModel {
  /**
   * Catálogo maestro de materias primas.
   */
  static async getAll() {
    const text = `
      SELECT id, codigo_sku, nombre, descripcion, unidad_medida, created_at
      FROM materias_primas
      ORDER BY id ASC;
    `;
    const { rows } = await db.query(text);
    return rows;
  }

  /**
   * Obtiene los lotes de materias primas disponibles con stock positivo.
   */
  static async getLotesDisponibles() {
    const text = `
      SELECT 
        lmp.id, 
        lmp.materia_prima_id,
        lmp.codigo_lote_mp, 
        mp.nombre AS materia_prima_nombre, 
        mp.codigo_sku, 
        lmp.proveedor, 
        lmp.fecha_recepcion, 
        lmp.fecha_vencimiento, 
        lmp.cantidad_inicial, 
        lmp.cantidad_actual, 
        mp.unidad_medida, 
        lmp.estado
      FROM lotes_materia_prima lmp
      JOIN materias_primas mp ON lmp.materia_prima_id = mp.id
      WHERE lmp.estado = 'DISPONIBLE' AND lmp.cantidad_actual > 0
      ORDER BY lmp.fecha_vencimiento ASC;
    `;
    const { rows } = await db.query(text);
    return rows;
  }

  /**
   * Busca un lote de materia prima por su ID, bloqueando la fila si se pasa un cliente transaccional (SELECT ... FOR UPDATE).
   * @param {number} id - ID del lote MP
   * @param {import('pg').PoolClient} [client] - Cliente de base de datos transaccional opcional
   */
  static async findLoteById(id, client = null) {
    const text = `
      SELECT 
        lmp.id, 
        lmp.materia_prima_id,
        lmp.codigo_lote_mp, 
        lmp.proveedor, 
        lmp.fecha_recepcion, 
        lmp.fecha_vencimiento, 
        lmp.cantidad_inicial, 
        lmp.cantidad_actual, 
        lmp.estado,
        mp.nombre AS materia_prima_nombre,
        mp.unidad_medida
      FROM lotes_materia_prima lmp
      JOIN materias_primas mp ON lmp.materia_prima_id = mp.id
      WHERE lmp.id = $1
      ${client ? 'FOR UPDATE' : ''};
    `;
    const executor = client || db;
    const { rows } = await executor.query(text, [id]);
    return rows[0] || null;
  }

  /**
   * Actualiza el stock remanente y estado de un lote de materia prima dentro de una transacción.
   * @param {number} id
   * @param {number} nuevaCantidad
   * @param {string} nuevoEstado
   * @param {import('pg').PoolClient} client
   */
  static async updateStock(id, nuevaCantidad, nuevoEstado, client) {
    const text = `
      UPDATE lotes_materia_prima
      SET 
        cantidad_actual = $1,
        estado = $2
      WHERE id = $3
      RETURNING *;
    `;
    const { rows } = await client.query(text, [nuevaCantidad, nuevoEstado, id]);
    return rows[0];
  }
}

module.exports = MateriaPrimaModel;
