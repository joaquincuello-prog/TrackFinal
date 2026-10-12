const mysql = require('mysql2/promise');
require('dotenv').config();
const { executeMemoryQuery } = require('./memoryDb');

const isVercelWithoutExternalDb =
  Boolean(process.env.VERCEL) &&
  (!process.env.DB_HOST ||
    process.env.DB_HOST === 'localhost' ||
    process.env.DB_HOST === '127.0.0.1');

let useMemoryFallback = isVercelWithoutExternalDb;

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
  connectTimeout: 4000,
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

const isConnectionError = (err) => {
  if (!err) return false;
  const codes = [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'EHOSTUNREACH',
    'PROTOCOL_CONNECTION_LOST',
    'ER_ACCESS_DENIED_ERROR',
    'ER_BAD_DB_ERROR',
  ];
  return codes.includes(err.code) || /connect ECONNREFUSED/i.test(err.message || '');
};

/**
 * Ejecuta una consulta sobre el pool devolviendo un formato estandarizado { rows, insertId, affectedRows }
 * compatible con la capa de modelos. Si se despliega en Vercel sin base externa, usa la réplica en memoria.
 * @param {string} sql - Sentencia SQL
 * @param {Array} params - Parámetros de la consulta
 * @returns {Promise<{ rows: Array, insertId: number, affectedRows: number }>}
 */
const query = async (sql, params = []) => {
  const normalizedSql = normalizeQuery(sql);

  if (useMemoryFallback) {
    return await executeMemoryQuery(normalizedSql, params);
  }

  try {
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
  } catch (err) {
    if (isConnectionError(err)) {
      console.warn('[DB FALLBACK] MySQL no disponible en este entorno. Activando réplica en memoria.');
      useMemoryFallback = true;
      return await executeMemoryQuery(normalizedSql, params);
    }
    throw err;
  }
};

/**
 * Obtiene una conexión dedicada del pool.
 * @returns {Promise<mysql.PoolConnection>}
 */
const getClient = async () => {
  return await pool.getConnection();
};

/**
 * Helper transaccional ACID para MySQL (con soporte de fallback en memoria para Vercel).
 * @param {Function} callback - Función asíncrona que recibe `client` y ejecuta queries
 * @returns {Promise<any>}
 */
const withTransaction = async (callback) => {
  if (useMemoryFallback) {
    const memoryClient = {
      query: async (sql, params = []) => {
        const normalizedSql = normalizeQuery(sql);
        return await executeMemoryQuery(normalizedSql, params);
      },
    };
    return await callback(memoryClient);
  }

  let connection;
  try {
    connection = await pool.getConnection();
  } catch (err) {
    if (isConnectionError(err)) {
      console.warn('[DB FALLBACK] MySQL no disponible para transacción. Usando réplica en memoria.');
      useMemoryFallback = true;
      return await withTransaction(callback);
    }
    throw err;
  }

  try {
    await connection.beginTransaction();

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
