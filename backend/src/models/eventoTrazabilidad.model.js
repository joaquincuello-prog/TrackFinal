const db = require('../config/db');

/**
 * Repositorio de Eventos de Trazabilidad Inmutables - MySQL
 */
class EventoTrazabilidadModel {
  /**
   * Registra un evento inmutable en la bitácora de trazabilidad.
   */
  static async create(
    { lote_pt_id, punto_captura_id, usuario_id, etapa_nombre, linea_equipo, observaciones },
    client = null
  ) {
    const text = `
      INSERT INTO eventos_trazabilidad
        (lote_pt_id, punto_captura_id, usuario_id, etapa_nombre, linea_equipo, observaciones)
      VALUES
        (?, ?, ?, ?, ?, ?);
    `;
    const executor = client || db;
    const res = await executor.query(text, [
      lote_pt_id,
      punto_captura_id,
      usuario_id,
      etapa_nombre,
      linea_equipo || null,
      observaciones || null,
    ]);

    const newId = res.insertId;
    const { rows } = await executor.query('SELECT * FROM eventos_trazabilidad WHERE id = ? LIMIT 1;', [newId]);
    return rows[0];
  }

  /**
   * Obtiene la cronología completa de eventos para un lote PT.
   */
  static async getByLoteId(lotePtId) {
    const text = `
      SELECT 
        et.id,
        et.etapa_nombre,
        et.linea_equipo,
        et.timestamp_evento,
        et.observaciones,
        pc.codigo_punto,
        pc.nombre AS punto_captura_nombre,
        CONCAT(u.nombre, ' ', u.apellido) AS operario_nombre,
        u.legajo AS operario_legajo
      FROM eventos_trazabilidad et
      JOIN puntos_captura pc ON et.punto_captura_id = pc.id
      JOIN usuarios u ON et.usuario_id = u.id
      WHERE et.lote_pt_id = ?
      ORDER BY et.timestamp_evento ASC;
    `;
    const { rows } = await db.query(text, [lotePtId]);
    return rows;
  }
}

module.exports = EventoTrazabilidadModel;
