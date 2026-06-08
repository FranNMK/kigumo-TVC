// Public partner logos (no auth required)
app.get('/api/v1/partners', async (req, res) => {
  try {
    const db = require('./db');
    const [rows] = await db.execute(
      'SELECT name, logo_path, website_url FROM partners WHERE is_active = TRUE ORDER BY sort_order'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});