/**
 * Database Connection Pool
 * 
 * Creates and exports a MySQL2 promise-based connection pool.
 * All queries should use this pool via db.execute().
 * 
 * @module db
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
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

// ── SSL/TLS Configuration for TiDB Cloud ───────────────────

if (process.env.DB_SSL === 'true') {
    const caPath = process.env.DB_SSL_CA_PATH;
    
    if (!caPath) {
        logger.warn('DB_SSL is enabled but DB_SSL_CA_PATH is not set. SSL will be enabled without CA verification.');
        poolConfig.ssl = 'Amazon RDS';
    } else {
        try {
            const caCertPath = path.resolve(caPath);
            if (!fs.existsSync(caCertPath)) {
                logger.error(`❌ SSL CA certificate not found at: ${caCertPath}`);
                logger.error('Please download your TiDB Cloud CA certificate from the TiDB Cloud dashboard.');
                logger.error('Place it at the path specified in DB_SSL_CA_PATH environment variable.');
                throw new Error(`CA certificate not found at ${caCertPath}`);
            }
            
            const caCert = fs.readFileSync(caCertPath, 'utf8');
            poolConfig.ssl = {
                ca: caCert,
                rejectUnauthorized: true
            };
            logger.info('✅ SSL/TLS configured with CA certificate for TiDB Cloud');
        } catch (err) {
            logger.error(`❌ Failed to configure SSL: ${err.message}`);
            throw err;
        }
    }
}

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