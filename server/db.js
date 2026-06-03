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

// Read CA certificate if SSL is enabled
let sslConfig = null;
if (process.env.DB_SSL === 'true') {
  const caPath = process.env.DB_SSL_CA_PATH;
  if (!caPath) {
    logger.warn('DB_SSL is enabled but DB_SSL_CA_PATH is not set. SSL will be enabled without CA verification.');
    sslConfig = { rejectUnauthorized: false };
  } else {
    try {
      const caCertPath = path.resolve(caPath);
      if (!fs.existsSync(caCertPath)) {
        logger.error(`❌ SSL CA certificate not found at: ${caCertPath}`);
        throw new Error(`CA certificate not found at ${caCertPath}`);
      }
      const caCert = fs.readFileSync(caCertPath, 'utf8');
      sslConfig = { ca: caCert, rejectUnauthorized: true };
      logger.info('✅ SSL/TLS configured with CA certificate for TiDB Cloud');
    } catch (err) {
      logger.error(`❌ Failed to configure SSL: ${err.message}`);
      throw err;
    }
  }
}

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kigumo_tvc',
  port: parseInt(process.env.DB_PORT) || 4000,          // TiDB uses 4000
  waitForConnections: true,
  connectionLimit: 5,                                   // TiDB Serverless free tier sweet spot
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,                         // 10 seconds
  connectTimeout: 15000,                                // 15 seconds                            // 20 seconds to get a connection                                       // 60 seconds query timeout
  ssl: sslConfig
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

// ── Warm up frequently used tables ────────────────────────

async function warmupTables() {
  const tables = [
    'users', 'courses', 'departments', 'fees', 'intake_dates',
    'announcements', 'timetable', 'materials', 'news_articles',
    'downloads', 'contact_enquiries', 'bom_members', 'slider_slides',
    'page_content', 'principal_message', 'hod_assignments',
    'student_non_academic_memberships', 'gallery_albums', 'gallery_photos',
    'recycle_bin'
  ];
  for (const table of tables) {
    try {
      await pool.execute(`SELECT COUNT(*) FROM ${table}`);
    } catch (e) {
      // ignore missing tables or any errors
    }
  }
  logger.info('✅ Database tables warmed up');
}

// Run warmup after pool creation
warmupTables().catch(() => {});

// ── Wrap pool with query logging ──────────────────────────

// Only log queries in development or when LOG_LEVEL=DEBUG
if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'DEBUG') {
  pool = wrapPoolWithLogging(pool);
  logger.info('Database query logging enabled');
}

// ── Export ─────────────────────────────────────────────────

module.exports = pool;