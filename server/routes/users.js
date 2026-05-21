/**
 * Users Routes (public limited)
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../utils/logger');

router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    let sql = `SELECT id, full_name, email, reg_number, role, primary_department_id, photo_path, bio FROM users WHERE is_active = TRUE`;
    const params = [];
    if (role) {
      sql += ` AND role = ?`;
      params.push(role);
    }
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('Error fetching users', { error: err.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;