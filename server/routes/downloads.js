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
 * Redirects the browser directly to the Cloudinary URL with fl_attachment so
 * the browser downloads the file with the correct filename.
 *
 * Why redirect instead of proxy: the cPanel server has outbound HTTPS firewall
 * restrictions that cause ETIMEDOUT when connecting to Cloudinary's CDN.
 * A redirect lets the browser fetch directly from Cloudinary — no server
 * bandwidth consumed, no firewall issue.
 */
router.get('/download/:id', async (req, res) => {
  try {
    const [[row]] = await db.execute(
      'SELECT file_path, original_filename FROM downloads WHERE id = ?',
      [req.params.id]
    );
    if (!row) return res.status(404).json({ success: false, message: 'Download not found' });
    if (!row.file_path) return res.status(404).json({ success: false, message: 'File not available' });

    // Build a Cloudinary fl_attachment URL so the browser saves the file
    // with the original filename rather than the hashed Cloudinary public_id.
    const filename = row.original_filename || 'download';
    const downloadUrl = buildCloudinaryAttachmentUrl(row.file_path, filename);

    // 302 redirect — browser fetches directly from Cloudinary CDN
    res.redirect(302, downloadUrl);

  } catch (err) {
    logger.error('Download route error', { error: err.message || err.toString() });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * Append fl_attachment to a Cloudinary URL so the browser triggers a download
 * with the given filename.
 *
 * Input:  https://res.cloudinary.com/<cloud>/raw/upload/v1/<public_id>.pdf
 * Output: https://res.cloudinary.com/<cloud>/raw/upload/fl_attachment:<name>/v1/<public_id>.pdf
 */
function buildCloudinaryAttachmentUrl(fileUrl, filename) {
  try {
    // Cloudinary raw uploads strip the file extension from the public_id.
    // If the stored URL has no extension, derive it from the original filename
    // and append it — this covers records uploaded before the upload-time fix
    // and any environment (staging, other domains) where old data may exist.
    const ext = filename && filename.includes('.')
      ? filename.split('.').pop().toLowerCase()
      : null;
    let url = fileUrl;
    if (ext && ext.length <= 10) {
      const base = url.split('?')[0];
      if (!base.endsWith('.' + ext)) {
        url = url + '.' + ext;
      }
    }

    // Insert the fl_attachment transformation after the upload type segment.
    // Works for /raw/upload/, /image/upload/, and /video/upload/ URLs.
    const encoded = encodeURIComponent(filename);
    return url.replace(
      /\/(raw|image|video)\/upload\//,
      `/$1/upload/fl_attachment:${encoded}/`
    );
  } catch {
    return fileUrl; // fall back to plain URL if anything is unexpected
  }
}

module.exports = router;