const db = require('../config/db');

/**
 * Repositorio de Usuarios y Roles (RBAC)
 */
class UsuarioModel {
  /**
   * Busca un usuario por su dirección de email (incluye el nombre del rol).
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  static async findByEmail(email) {
    const text = `
      SELECT 
        u.id, 
        u.nombre, 
        u.apellido, 
        u.legajo, 
        u.email, 
        u.password_hash, 
        u.activo, 
        r.nombre AS rol
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE LOWER(u.email) = LOWER($1)
      LIMIT 1;
    `;
    const { rows } = await db.query(text, [email]);
    return rows[0] || null;
  }

  /**
   * Busca un usuario por su ID primario.
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const text = `
      SELECT 
        u.id, 
        u.nombre, 
        u.apellido, 
        u.legajo, 
        u.email, 
        u.activo, 
        r.nombre AS rol,
        u.created_at
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1
      LIMIT 1;
    `;
    const { rows } = await db.query(text, [id]);
    return rows[0] || null;
  }
}

module.exports = UsuarioModel;
