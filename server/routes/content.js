/**
 * Content Routes
 * Fetch page content and principal message.
 * @module routes/content
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../utils/logger');

// GET /api/v1/content/principal-message
router.get('/principal-message', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT principal_name, title, message, image_path FROM principal_message WHERE is_active = TRUE LIMIT 1`
    );
    if (rows.length === 0) return res.json({ success: true, data: null });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    logger.error('Error fetching principal message', { error: err.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/v1/content/:pageKey/:sectionKey
router.get('/:pageKey/:sectionKey', async (req, res) => {
  try {
    const { pageKey, sectionKey } = req.params;
    const [rows] = await db.execute(
      `SELECT content_html FROM page_content WHERE page_key = ? AND section_key = ?`,
      [pageKey, sectionKey]
    );
    if (rows.length === 0) return res.json({ success: true, data: null });
    res.json({ success: true, data: { content_html: rows[0].content_html } });
  } catch (err) {
    logger.error('Error fetching page content', { error: err.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;