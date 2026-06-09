/**
 * Downloads Routes
 * Public API for fetching downloadable documents
 * Admin CRUD handled in admin.js
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const https = require('https');
const logger = require('../utils/logger');

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
    logger.error('Error fetching downloads', { error: err.message });
    res.status(500).json({ success: false, message: 'Failed to fetch downloads' });
  }
});

/**
 * GET /api/v1/downloads/download/:id
 * Streams a file from Cloudinary with the original filename
 */
router.get('/download/:id', async (req, res) => {
  try {
    const [[row]] = await db.execute(
      'SELECT file_path, original_filename FROM downloads WHERE id = ?',
      [req.params.id]
    );
    if (!row) return res.status(404).json({ success: false, message: 'Download not found' });

    const filename = row.original_filename || 'download';
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    https.get(row.file_path, (cloudRes) => {
      if (cloudRes.statusCode !== 200) {
        return res.status(404).json({ success: false, message: 'File not found' });
      }
      cloudRes.pipe(res);
    }).on('error', (err) => {
      logger.error('Download proxy error', { error: err.message });
      res.status(500).json({ success: false, message: 'Download failed' });
    });

  } catch (err) {
    logger.error('Download route error', { error: err.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;