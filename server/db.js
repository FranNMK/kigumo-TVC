/**
 * Database Connection Pool
 * 
 * Creates and exports a MySQL2 promise-based connection pool.
 * All queries should use this pool via db.execute().
 * 
 * @module db
 */

const mysql = require('mysql2/promise');
const { wrapPoolWithLogging } = require('./utils/dbLogger');
const logger = require('./utils/logger');

// ── Pool Configuration ─────────────────────────────────────

const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kigumo_tvc',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10, // Maximum concurrent connections
    queueLimit: 0, // Unlimited queue
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

// ── Create Pool ────────────────────────────────────────────

let pool;

try {
    pool = mysql.createPool(poolConfig);
    
    // Test connection on startup
    pool.getConnection()
        .then(connection => {
            logger.info('✅ Database connected successfully', {
                host: poolConfig.host,
                database: poolConfig.database
            });
            connection.release();
        })
        .catch(err => {
            logger.error('❌ Database connection failed', {
                error: err.message,
                code: err.code,
                host: poolConfig.host,
                database: poolConfig.database
            });
            // Don't crash - let the application start and retry
        });
    
} catch (err) {
    logger.error('❌ Failed to create database pool', {
        error: err.message,
        code: err.code
    });
    throw err; // This one should crash - configuration error
}

// ── Wrap pool with query logging ──────────────────────────

// After pool creation, run a warm-up query
pool.execute('SELECT 1 FROM departments LIMIT 1')
  .then(() => logger.debug('Database buffer pool warmed up'))
  .catch(() => {});
  
// Only log queries in development or when LOG_LEVEL=DEBUG
if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'DEBUG') {
    pool = wrapPoolWithLogging(pool);
    logger.info('Database query logging enabled');
}

// ── Export ─────────────────────────────────────────────────

module.exports = pool;