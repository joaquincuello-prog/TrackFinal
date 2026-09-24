const db = require('../config/db');

/**
 * Repositorio de Consumos de Materia Prima en Producción - MySQL
 */
class ConsumoMPModel {
  /**
   * Registra un consumo de materia prima asociado a una OP (dentro de una transacción).
   */
  static async create({ orden_produccion_id, lote_mp_id, cantidad_consumida, operario_id }, client) {
    const text = `
      INSERT INTO consumos_materia_prima 
        (orden_produccion_id, lote_mp_id, cantidad_consumida, operario_id)
      VALUES 
        (?, ?, ?, ?);
    `;
    const res = await client.query(text, [
      orden_produccion_id,
      lote_mp_id,
      cantidad_consumida,
      operario_id,
    ]);

    const newId = res.insertId;
    const { rows } = await client.query('SELECT * FROM consumos_materia_prima WHERE id = ? LIMIT 1;', [newId]);
    return rows[0];
  }

  /**
   * Obtiene todos los consumos registrados para una orden de producción.
   */
  static async getByOrdenId(ordenProduccionId) {
    const text = `
      SELECT 
        cmp.id,
        cmp.orden_produccion_id,
        cmp.cantidad_consumida,
        cmp.timestamp_consumo,
        lmp.codigo_lote_mp,
        mp.nombre AS materia_prima_nombre,
        mp.unidad_medida,
        CONCAT(u.nombre, ' ', u.apellido) AS operario_nombre
      FROM consumos_materia_prima cmp
      JOIN lotes_materia_prima lmp ON cmp.lote_mp_id = lmp.id
      JOIN materias_primas mp ON lmp.materia_prima_id = mp.id
      JOIN usuarios u ON cmp.operario_id = u.id
      WHERE cmp.orden_produccion_id = ?
      ORDER BY cmp.timestamp_consumo ASC;
    `;
    const { rows } = await db.query(text, [ordenProduccionId]);
    return rows;
  }
}

module.exports = ConsumoMPModel;
