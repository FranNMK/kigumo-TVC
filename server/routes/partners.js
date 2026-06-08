const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const [rows] = await db.execute(
    'SELECT id, name, logo_path, website_url FROM partners WHERE is_active = TRUE ORDER BY sort_order'
  );
  res.json({ success: true, data: rows });
});

module.exports = router;