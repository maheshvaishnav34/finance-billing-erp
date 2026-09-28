import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded
dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'redes_erp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  decimalNumbers: true,
  dateStrings: true
};

export const pool = mysql.createPool(dbConfig);

/**
 * Test connectivity to MySQL
 * @returns {Promise<boolean>}
 */
export async function checkDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Execute parameterized query with automatic error formatting
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<[any, any]>}
 */
export async function query(sql, params = []) {
  try {
    return await pool.query(sql, params);
  } catch (err) {
    console.error(`[MySQL Query Error] SQL: ${sql} | Error: ${err.message}`);
    throw err;
  }
}

/**
 * Execute database transaction with auto commit / rollback
 * @param {Function} callback (connection) => Promise<any>
 * @returns {Promise<any>}
 */
export async function transaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    console.error(`[MySQL Transaction Rolled Back] Error: ${err.message}`);
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Gracefully close pool on application shutdown
 */
export async function closePool() {
  try {
    await pool.end();
    console.log('✅ MySQL connection pool closed gracefully.');
  } catch (err) {
    console.error('Error closing MySQL pool:', err);
  }
}

export default pool;
