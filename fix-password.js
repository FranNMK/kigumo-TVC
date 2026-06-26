require('dotenv').config(); // Load .env so DB_HOST, etc. are set
const bcrypt = require('bcryptjs');
const db = require('./server/db'); // Uses your existing db.js query interface

async function fixPassword() {
  const plainPassword = '0710217048';
  const hash = await bcrypt.hash(plainPassword, 12);
  console.log('New clean hash (60 chars):', hash);

  try {
    // Assuming db.js exports a promisified query function (like db.query)
    await db.query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE email = ?',
      [hash, 'admin@kigumotvc.ac.ke']
    );
    console.log('✅ Password updated successfully!');
  } catch (err) {
    console.error('❌ Update failed:', err);
  }
}

fixPassword();