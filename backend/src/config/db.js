const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones MySQL 8+ con soporte de Promesas
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trackfinal_db',
  waitForConnections: true,
  connectionLimit: 20, // Máximo de conexiones simultáneas en el pool
  queueLimit: 0,
  decimalNumbers: true, // Mapear campos decimales a números
  dateStrings: true,    // Retornar fechas formateadas YYYY-MM-DD
});

/**
 * Normaliza una consulta SQL convirtiendo placeholders de estilo PostgreSQL ($1, $2)
 * a placeholders de estilo MySQL (?).
 * @param {string} sql 
 * @returns {string}
 */
const normalizeQuery = (sql) => {
  return sql.replace(/\$\d+/g, '?');
};

/**
 * Ejecuta una consulta sobre el pool devolviendo un formato estandarizado { rows, insertId, affectedRows }
 * compatible con la capa de modelos.
 * @param {string} sql - Sentencia SQL
 * @param {Array} params - Parámetros de la consulta
 * @returns {Promise<{ rows: Array, insertId: number, affectedRows: number }>}
 */
const query = async (sql, params = []) => {
  const normalizedSql = normalizeQuery(sql);
  const [result] = await pool.query(normalizedSql, params);
  
  if (Array.isArray(result)) {
    return {
      rows: result,
      insertId: null,
      affectedRows: 0,
    };
  }

  return {
    rows: [],
    insertId: result.insertId,
    affectedRows: result.affectedRows,
  };
};

/**
 * Obtiene una conexión dedicada del pool.
 * @returns {Promise<mysql.PoolConnection>}
 */
const getClient = async () => {
  return await pool.getConnection();
};

/**
 * Helper transaccional ACID para MySQL.
 * Ejecuta un bloque de operaciones dentro de START TRANSACTION / COMMIT / ROLLBACK.
 * Garantiza la liberación segura de la conexión en el bloque finally.
 * 
 * @param {Function} callback - Función asíncrona que recibe `client` y ejecuta queries
 * @returns {Promise<any>}
 */
const withTransaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Envoltura de cliente transaccional compatible con el formato { rows, insertId }
    const clientWrapper = {
      query: async (sql, params = []) => {
        const normalizedSql = normalizeQuery(sql);
        const [result] = await connection.query(normalizedSql, params);

        if (Array.isArray(result)) {
          return {
            rows: result,
            insertId: null,
            affectedRows: 0,
          };
        }

        return {
          rows: [],
          insertId: result.insertId,
          affectedRows: result.affectedRows,
        };
      },
      rawConnection: connection,
    };

    const result = await callback(clientWrapper);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  query,
  getClient,
  withTransaction,
};
