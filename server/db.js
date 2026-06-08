/**
 * Database Connection Pool
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
  port: parseInt(process.env.DB_PORT) || 4000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 15000,
};

// ── SSL/TLS Configuration for TiDB Cloud ───────────────────
if (process.env.DB_SSL === 'true') {
  let sslConfig = null;

  // 1. Try to load from CA file path
  const caPath = process.env.DB_SSL_CA_PATH;
  if (caPath) {
    try {
      const caCertPath = path.resolve(caPath);
      if (fs.existsSync(caCertPath)) {
        const caCert = fs.readFileSync(caCertPath, 'utf8');
        sslConfig = { ca: caCert, rejectUnauthorized: true };
        logger.info('✅ SSL/TLS configured from CA file');
      }
    } catch (err) {
      logger.warn('Could not load CA file, falling back to env variable');
    }
  }

  // 2. Fallback: Base64‑encoded CA certificate from environment variable
  if (!sslConfig && process.env.DB_SSL_CA_BASE64) {
    try {
      const caCert = Buffer.from(process.env.DB_SSL_CA_BASE64, 'base64').toString('utf8');
      sslConfig = { ca: caCert, rejectUnauthorized: true };
      logger.info('✅ SSL/TLS configured from Base64 env variable');
    } catch (err) {
      logger.error('Failed to decode Base64 CA certificate');
    }
  }

  // 3. Last resort: insecure (not recommended)
  if (!sslConfig) {
    logger.warn('⚠️ No CA certificate available – SSL will be less secure');
    sslConfig = { rejectUnauthorized: false };
  }

  poolConfig.ssl = sslConfig;
}

// ── Create Pool ────────────────────────────────────────────
let pool;
try {
  pool = mysql.createPool(poolConfig);

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
    });

} catch (err) {
  logger.error('❌ Failed to create database pool', {
    error: err.message,
    code: err.code
  });
  throw err;
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
    } catch (e) { /* ignore */ }
  }
  logger.info('✅ Database tables warmed up');
}
warmupTables().catch(() => {});

// ── Query logging (development only) ───────────────────────
if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'DEBUG') {
  pool = wrapPoolWithLogging(pool);
  logger.info('Database query logging enabled');
}

module.exports = pool;