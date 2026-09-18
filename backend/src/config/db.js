const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'trackfinal_db',
  max: 20, // Máximo de conexiones concurrentes en el pool
  idleTimeoutMillis: 30000, // Cerrar conexiones inactivas tras 30s
  connectionTimeoutMillis: 5000, // Tiempo límite para obtener conexión
});

// Manejo de errores imprevistos en clientes inactivos
pool.on('error', (err) => {
  console.error('[DATABASE POOL ERROR] Error inesperado en el cliente inactivo de PostgreSQL:', err.message);
});

/**
 * Ejecuta una consulta simple utilizando el pool.
 * @param {string} text - Consulta SQL parametrizada ($1, $2, etc.)
 * @param {Array} params - Parámetros de la consulta
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = (text, params) => {
  return pool.query(text, params);
};

/**
 * Obtiene un cliente dedicado del pool (debe liberarse manualmente con client.release()).
 * @returns {Promise<import('pg').PoolClient>}
 */
const getClient = () => {
  return pool.connect();
};

/**
 * Helper transaccional ACID.
 * Ejecuta un bloque de operaciones dentro de BEGIN / COMMIT / ROLLBACK.
 * Garantiza la liberación segura del cliente en el bloque finally.
 * 
 * @param {Function} callback - Función asíncrona que recibe `client` y ejecuta queries
 * @returns {Promise<any>} - Retorno de la función callback
 */
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  getClient,
  withTransaction,
};
