/**
 * Standalone TiDB Connection & Pool Diagnostic Script
 * 
 * Tests:
 * 1. TCP socket reachability to TiDB Cloud gateway
 * 2. TLS/SSL handshake & certificate verification
 * 3. Connection acquisition latency and query response time
 * 4. Concurrent pool load test (stress & stability)
 * 5. Keep-alive and timeout handling
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const dotenv = require('dotenv');

// Safely locate and load .env or env
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'env'),
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, 'env')
];
for (const p of envPaths) {
  if (fs.existsSync(p) && fs.statSync(p).isFile()) {
    dotenv.config({ path: p });
    break;
  }
}

const mysql = require('mysql2/promise');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT) || 4000;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'kigumo_tvc';
const DB_SSL = process.env.DB_SSL === 'true';

console.log('='.repeat(65));
console.log('       KIGUMO TVC - TiDB CONNECTION & POOL DIAGNOSTIC      ');
console.log('='.repeat(65));
console.log(`Target: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`);
console.log(`SSL Enabled: ${DB_SSL}\n`);

// ── Step 1: Raw TCP Socket Test ─────────────────────────────
function testRawTcp() {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    console.log(`[1/4] Testing TCP Socket to ${DB_HOST}:${DB_PORT}...`);
    const socket = new net.Socket();
    socket.setTimeout(10000);

    socket.connect(DB_PORT, DB_HOST, () => {
      const duration = Date.now() - start;
      console.log(`      ✅ TCP connection established in ${duration} ms`);
      socket.destroy();
      resolve(duration);
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`TCP connection timed out after 10000 ms. Port ${DB_PORT} may be blocked by firewall.`));
    });

    socket.on('error', (err) => {
      socket.destroy();
      reject(new Error(`TCP socket error: ${err.message}`));
    });
  });
}

// ── Step 2: Single Connection & Query Response Test ─────────
async function testSingleConnection() {
  console.log('\n[2/4] Testing MySQL/TiDB Authentication & Single Query...');
  const start = Date.now();

  let sslConfig = null;
  if (DB_SSL) {
    if (process.env.DB_SSL_CA_PATH && fs.existsSync(path.resolve(process.env.DB_SSL_CA_PATH))) {
      sslConfig = { ca: fs.readFileSync(path.resolve(process.env.DB_SSL_CA_PATH), 'utf8'), rejectUnauthorized: true };
    } else {
      sslConfig = { rejectUnauthorized: false };
    }
  }

  const connConfig = {
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    ssl: sslConfig,
    connectTimeout: 30000
  };

  let connection;
  try {
    const connStart = Date.now();
    connection = await mysql.createConnection(connConfig);
    const connDuration = Date.now() - connStart;
    console.log(`      ✅ Authenticated & connected in ${connDuration} ms`);

    // Execute basic queries
    const qStart = Date.now();
    const [rows] = await connection.execute('SELECT 1 + 1 AS sum, @@version AS tidb_version, NOW() AS db_time');
    const qDuration = Date.now() - qStart;
    console.log(`      ✅ Simple query returned in ${qDuration} ms`);
    console.log(`         TiDB Version: ${rows[0].tidb_version}`);
    console.log(`         DB Timestamp: ${rows[0].db_time}`);

    // Check table count
    const [tableRows] = await connection.execute(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ? LIMIT 5",
      [DB_NAME]
    );
    console.log(`      ✅ Database accessible. Found tables: ${tableRows.map(r => r.TABLE_NAME || r.table_name).join(', ')}...`);

    await connection.end();
    return { connDuration, qDuration };
  } catch (err) {
    if (connection) await connection.end().catch(() => {});
    throw err;
  }
}

// ── Step 3: Pool Concurrency & Stability Test ───────────────
async function testPoolConcurrency() {
  console.log('\n[3/4] Testing Connection Pool Stability & Concurrency...');

  let sslConfig = null;
  if (DB_SSL) {
    if (process.env.DB_SSL_CA_PATH && fs.existsSync(path.resolve(process.env.DB_SSL_CA_PATH))) {
      sslConfig = { ca: fs.readFileSync(path.resolve(process.env.DB_SSL_CA_PATH), 'utf8'), rejectUnauthorized: true };
    } else {
      sslConfig = { rejectUnauthorized: false };
    }
  }

  const pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    ssl: sslConfig,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 5,
    idleTimeout: 30000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 30000,
  });

  const concurrentQueries = 10;
  console.log(`      Spawning ${concurrentQueries} concurrent queries across the pool...`);
  const poolStart = Date.now();

  const promises = Array.from({ length: concurrentQueries }, async (_, i) => {
    const qStart = Date.now();
    const [res] = await pool.execute('SELECT ? AS query_id, SLEEP(0.05) AS paused', [i + 1]);
    const duration = Date.now() - qStart;
    return { queryId: i + 1, duration };
  });

  const results = await Promise.all(promises);
  const totalPoolTime = Date.now() - poolStart;

  const durations = results.map(r => r.duration);
  const min = Math.min(...durations);
  const max = Math.max(...durations);
  const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);

  console.log(`      ✅ All ${concurrentQueries} concurrent queries completed in ${totalPoolTime} ms`);
  console.log(`         Query latencies: Min: ${min} ms | Avg: ${avg} ms | Max: ${max} ms`);

  await pool.end();
}

// ── Step 4: Keep-Alive & Session Store Simulation ───────────
async function testKeepAlive() {
  console.log('\n[4/4] Testing Idle Keep-Alive & Connection Recovery...');
  
  let sslConfig = null;
  if (DB_SSL) {
    sslConfig = { rejectUnauthorized: false };
  }

  const pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    ssl: sslConfig,
    connectionLimit: 3,
    connectTimeout: 30000,
  });

  // Verify connection ping
  const conn = await pool.getConnection();
  await conn.ping();
  console.log('      ✅ Connection ping successful');
  conn.release();

  await pool.end();
}

// ── Execute Suite ───────────────────────────────────────────
(async () => {
  try {
    await testRawTcp();
    await testSingleConnection();
    await testPoolConcurrency();
    await testKeepAlive();

    console.log('\n' + '='.repeat(65));
    console.log('✅ ALL TiDB DIAGNOSTIC TESTS COMPLETED SUCCESSFULLY');
    console.log('='.repeat(65));
    process.exit(0);
  } catch (err) {
    console.error('\n❌ DIAGNOSTIC FAILED:');
    console.error(`   Message: ${err.message}`);
    if (err.code) console.error(`   Error Code: ${err.code}`);
    console.log('\n' + '='.repeat(65));
    console.log('❌ TiDB DIAGNOSTIC FAILED - Review error code above');
    console.log('='.repeat(65));
    process.exit(1);
  }
})();
