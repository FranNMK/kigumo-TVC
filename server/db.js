/**
 * Database Connection Pool
 * 
 * Configured specifically for TiDB Cloud Serverless on cPanel hosting:
 * - Automatically loads environment via loadEnv
 * - Configures connection pool with keep-alive, generous TLS timeouts, and idle limits
 * - Retries queries transparently on ETIMEDOUT (write/connect), ECONNRESET, EPIPE, etc.
 * - Active heartbeat ping keeps connections warm through intermediate cloud firewalls
 */

require('./utils/loadEnv');
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
  maxIdle: 5,                     // Limit idle connections kept open
  idleTimeout: 45000,             // Close idle connections before remote NAT/firewall drops them (45s)
  queueLimit: 0,
  enableKeepAlive: true,          // Socket-level TCP keep-alive
  keepAliveInitialDelay: 10000,   // Initial delay before TCP keepalive probes (10s)
  connectTimeout: 30000,          // 30s connection timeout for TiDB Cloud cross-region TLS handshake
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

  // 3. Fallback: encrypted without strict CA validation
  if (!sslConfig) {
    logger.info('ℹ️ Using standard TLS encryption for TiDB Cloud (rejectUnauthorized: false)');
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
      logger.error('❌ Database connection initial check failed', {
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

/**
 * Identify if an error is caused by a broken or timed-out connection
 */
function isConnectionLossError(err) {
  if (!err) return false;
  return (
    err.code === 'ETIMEDOUT' ||
    err.code === 'ECONNRESET' ||
    err.code === 'EPIPE' ||
    err.code === 'PROTOCOL_CONNECTION_LOST' ||
    err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' ||
    err.code === 'PROTOCOL_PACKETS_OUT_OF_ORDER' ||
    err.code === 'ECONNREFUSED' ||
    err.code === 'EHOSTUNREACH' ||
    err.code === 'ER_CON_COUNT_ERROR' ||
    (err.message && /ETIMEDOUT|Connection lost|closed|reset|broken pipe/i.test(err.message))
  );
}

// ── Custom execute() with resilient retry on ETIMEDOUT and logging ──
async function execute(sql, params = []) {
  const start = Date.now();
  try {
    const [rows] = await pool.execute(sql, params);
    const duration = Date.now() - start;
    logger.debug(`DB Query (${duration}ms): ${sql}`, { duration, params, rowCount: rows?.length });
    return [rows];
  } catch (err) {
    const duration = Date.now() - start;
    logger.error(`DB Query Failed (${duration}ms): ${sql}`, { error: err.message, code: err.code, params, duration });

    // If connection timed out or was dropped by remote cloud/NAT, retry once with fresh connection
    if (isConnectionLossError(err)) {
      logger.warn(`⚠️ TiDB connection lost (${err.code || err.message}). Discarding stale socket and retrying query once...`);
      try {
        // Short pause to allow socket cleanup
        await new Promise(r => setTimeout(r, 300));
        const retryStart = Date.now();
        const [rows] = await pool.execute(sql, params);
        logger.info(`✅ DB Query Retry Succeeded (${Date.now() - retryStart}ms): ${sql}`);
        return [rows];
      } catch (retryErr) {
        logger.error(`❌ DB Query Retry Failed: ${sql}`, { error: retryErr.message, code: retryErr.code });
        throw retryErr;
      }
    }
    throw err;
  }
}

// ── Active Keep-Alive Heartbeat ─────────────────────────────
// Pings TiDB every 50 seconds to prevent AWS NLB or cPanel firewalls
// from dropping idle connections silently, which causes write ETIMEDOUT.
const heartbeatInterval = setInterval(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    logger.warn('⚠️ TiDB heartbeat ping blip (pool will reconnect on next query):', {
      error: err.message,
      code: err.code
    });
  }
}, 50000);
heartbeatInterval.unref(); // Do not block process termination

// ── Warm up frequently used tables ──────────────────────────
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
    } catch (_) { /* ignore table warmup errors */ }
  }
  logger.info('✅ Database tables warmed up');
}
warmupTables().catch(() => {});

// ── Query logging (development only) ────────────────────────
if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'DEBUG') {
  pool = wrapPoolWithLogging(pool);
  logger.info('Database query logging enabled (wrapped)');
}

// ── Exports ────────────────────────────────────────────────
module.exports = {
  pool,
  execute,   // Always use this in your route files instead of pool.execute()
  isConnectionLossError,

  /**
   * Obtain a raw connection from the pool for manual transaction control.
   * IMPORTANT: always call connection.release() in a finally block.
   * @returns {Promise<import('mysql2/promise').PoolConnection>}
   */
  getConnection: () => pool.getConnection(),
};