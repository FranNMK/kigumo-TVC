/**
 * Temporary login test script
 * Run with: node server/test-login.js
 * Enter reg_number and password to see what's happening.
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testLogin() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kigumo_tvc',
    waitForConnections: true,
  });

  // Use the same query as login route
  const [rows] = await pool.execute(
    `SELECT id, full_name, reg_number, password, role
     FROM users
     WHERE reg_number = ? AND is_active = TRUE`,
    ['DICT/2501/1712']   // <-- change this to any reg_number you want to test
  );

  if (rows.length === 0) {
    console.log('❌ User not found');
    process.exit();
  }

  const user = rows[0];
  console.log('✅ User found:', user.full_name, 'Role:', user.role);
  console.log('Stored hash:', user.password);

  // Test the password
  const testPassword = '0712345678';  // <-- put the password you type in the form here
  const match = await bcrypt.compare(testPassword, user.password);

  if (match) {
    console.log('✅ Password MATCH!');
  } else {
    console.log('❌ Password DOES NOT MATCH');
    // Let's see what the hash of the test password would be
    const newHash = await bcrypt.hash(testPassword, 12);
    console.log('Hash of test password:', newHash);
  }

  await pool.end();
}

testLogin().catch(err => console.error(err));