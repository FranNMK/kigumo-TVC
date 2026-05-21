/**
 * BOM Routes
 * Public API for Board of Management members.
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../utils/logger');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, full_name, position, photo_path, sort_order FROM bom_members WHERE is_active = TRUE ORDER BY sort_order ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('Error fetching BOM', { error: err.message });
    res.status(500).json({ success: false, message: 'Failed to fetch BOM' });
  }
});

module.exports = router;