/**
 * Downloads Routes
 * Public API for fetching downloadable documents
 * Admin CRUD handled in admin.js
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../utils/logger');

/**
 * GET /api/v1/download-categories
 * Public endpoint — returns category names and display names so the
 * downloads page can show human-readable section headings.
 * (Admin CRUD for categories lives in /api/v1/admin/download-categories)
 */
router.get('/download-categories', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT dc.name, dc.display_name
       FROM download_categories dc
       ORDER BY dc.name`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    // Table may not exist on first deploy — return empty list so page still renders
    logger.warn('Download categories fetch failed', { error: err.message });
    res.json({ success: true, data: [] });
  }
});

/**
 * GET /api/v1/downloads
 * Returns all downloads grouped by category
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, title, category, file_path, file_size, original_filename, uploaded_at FROM downloads ORDER BY category, uploaded_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('Error fetching downloads', { error: err.message || err.toString() });
    res.status(500).json({ success: false, message: 'Failed to fetch downloads' });
  }
});

/**
 * GET /api/v1/downloads/download/:id
 * Redirects the browser to the local /uploads/ path so the browser
 * downloads the file directly from the same origin — no CORS issues.
 */
router.get('/download/:id', async (req, res) => {
  try {
    const [[row]] = await db.execute(
      'SELECT file_path, original_filename FROM downloads WHERE id = ?',
      [req.params.id]
    );
    if (!row) return res.status(404).json({ success: false, message: 'Download not found' });
    if (!row.file_path) return res.status(404).json({ success: false, message: 'File not available' });

    // file_path is stored as /uploads/<filename> — redirect directly to it.
    // Same-origin redirect: browser honours the download attribute and saves the file.
    res.redirect(302, row.file_path);

  } catch (err) {
    logger.error('Download route error', { error: err.message || err.toString() });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;