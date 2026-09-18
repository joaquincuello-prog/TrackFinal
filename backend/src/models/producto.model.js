const db = require('../config/db');

/**
 * Repositorio del Catálogo Maestro de Productos Terminados
 */
class ProductoModel {
  /**
   * Obtiene todos los productos terminados disponibles.
   * @returns {Promise<Array>}
   */
  static async getAll() {
    const text = `
      SELECT 
        id, 
        codigo_sku, 
        nombre, 
        descripcion, 
        unidad_medida, 
        dias_vida_util, 
        temperatura_conservacion, 
        created_at
      FROM productos_terminados
      ORDER BY id ASC;
    `;
    const { rows } = await db.query(text);
    return rows;
  }

  /**
   * Obtiene un producto terminado por su ID.
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const text = `
      SELECT 
        id, 
        codigo_sku, 
        nombre, 
        descripcion, 
        unidad_medida, 
        dias_vida_util, 
        temperatura_conservacion, 
        created_at
      FROM productos_terminados
      WHERE id = $1
      LIMIT 1;
    `;
    const { rows } = await db.query(text, [id]);
    return rows[0] || null;
  }
}

module.exports = ProductoModel;
