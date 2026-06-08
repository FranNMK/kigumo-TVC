/**
 * News Routes
 * Public API for fetching published news articles with pagination and filtering.
 * @module routes/news
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../utils/logger');

router.get('/', async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const category = req.query.category || null;

    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 10;
    const offset = (page - 1) * limit;

    let sql = `SELECT id, title, body, category, image_path, published_at, created_by
               FROM news_articles WHERE is_published = TRUE`;
    let countSql = `SELECT COUNT(*) AS total FROM news_articles WHERE is_published = TRUE`;
    const params = [];

    if (category && ['event','partnership','graduation','achievement','general'].includes(category)) {
      sql += ` AND category = ?`;
      countSql += ` AND category = ?`;
      params.push(category);
    }

    // Use integer interpolation for LIMIT/OFFSET (already validated as integers)
    sql += ` ORDER BY published_at DESC LIMIT ${offset}, ${limit}`;

    const [rows] = await db.execute(sql, params);
    const [[{ total }]] = await db.execute(countSql, params);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: rows,
      page,
      limit,
      total,
      totalPages
    });
  } catch (err) {
    logger.error('Error fetching news', { error: err.message });
    res.status(500).json({ success: false, message: 'Failed to fetch news', code: 'SERVER_ERROR' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, title, body, category, image_path, published_at, created_by
       FROM news_articles WHERE id = ? AND is_published = TRUE`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Article not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    logger.error('Error fetching article', { error: err.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;