const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../utils/logger');

// GET all active portals (public)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, description, link, icon FROM portals WHERE is_active = TRUE ORDER BY sort_order'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('Public portals fetch error', { error: err.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;