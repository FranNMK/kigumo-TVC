/**
 * Downloads Route
 * GET /api/v1/downloads
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../utils/logger');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, title, category, file_path, file_size, uploaded_at FROM downloads ORDER BY category, uploaded_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('Error fetching downloads', { error: err.message });
    res.status(500).json({ success: false, message: 'Failed to fetch downloads' });
  }
});

module.exports = router;