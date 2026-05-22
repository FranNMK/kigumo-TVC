const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../utils/logger');
const { isAuthenticated, hasRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

router.use(isAuthenticated);
router.use(hasRole('admin'));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const now = new Date();
      cb(null, `uploads/${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}`);
    },
    filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
  }),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// ── SLIDES ──
router.get('/slides', async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM slider_slides ORDER BY sort_order');
  res.json({ success: true, data: rows });
});
router.post('/slides', upload.single('image'), async (req, res) => {
  const { badge_text, heading, subtext, btn1_text, btn1_url, btn2_text, btn2_url, sort_order } = req.body;
  const image_path = req.file ? req.file.path : null;
  await db.execute(`INSERT INTO slider_slides (image_path,badge_text,heading,subtext,btn1_text,btn1_url,btn2_text,btn2_url,sort_order,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [image_path, badge_text, heading, subtext, btn1_text, btn1_url, btn2_text, btn2_url, sort_order||0, req.session.user.id]);
  res.json({ success: true, message: 'Slide added' });
});
router.patch('/slides/:id/toggle', async (req, res) => {
  await db.execute('UPDATE slider_slides SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});
router.delete('/slides/:id', async (req, res) => {
  const [[row]] = await db.execute('SELECT * FROM slider_slides WHERE id = ?', [req.params.id]);
  if (row) {
    await db.execute('INSERT INTO recycle_bin (original_table, original_id, data_snapshot, deleted_by) VALUES (?,?,?,?)',
      ['slider_slides', row.id, JSON.stringify(row), req.session.user.id]);
    await db.execute('DELETE FROM slider_slides WHERE id = ?', [req.params.id]);
  }
  res.json({ success: true, message: 'Moved to recycle bin' });
});

// ── PRINCIPAL MESSAGE ──
router.put('/principal-message', upload.single('photo'), async (req, res) => {
  const { principal_name, title, message } = req.body;
  const [[existing]] = await db.execute('SELECT * FROM principal_message WHERE is_active = TRUE LIMIT 1');
  if (existing) {
    await db.execute('INSERT INTO recycle_bin (original_table, original_id, data_snapshot, deleted_by) VALUES (?,?,?,?)',
      ['principal_message', existing.id, JSON.stringify(existing), req.session.user.id]);
    await db.execute('DELETE FROM principal_message WHERE id = ?', [existing.id]);
  }
  const photo_path = req.file ? req.file.path : (existing?.image_path || null);
  await db.execute('INSERT INTO principal_message (principal_name, title, message, image_path, is_active, created_by) VALUES (?,?,?,?,TRUE,?)',
    [principal_name, title, message, photo_path, req.session.user.id]);
  res.json({ success: true, message: 'Principal message updated' });
});

// ── PAGE CONTENT ──
router.get('/page-content', async (req, res) => {
  const [rows] = await db.execute('SELECT page_key, section_key FROM page_content ORDER BY page_key, section_key');
  res.json({ success: true, data: rows });
});
router.put('/page-content/:pageKey/:sectionKey', async (req, res) => {
  const { content_html } = req.body;
  const [[existing]] = await db.execute('SELECT * FROM page_content WHERE page_key=? AND section_key=?', [req.params.pageKey, req.params.sectionKey]);
  if (existing) {
    await db.execute('INSERT INTO recycle_bin (original_table, original_id, data_snapshot, deleted_by) VALUES (?,?,?,?)',
      ['page_content', existing.id, JSON.stringify(existing), req.session.user.id]);
  }
  await db.execute('INSERT INTO page_content (page_key, section_key, content_html, updated_by) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE content_html=?, updated_by=?',
    [req.params.pageKey, req.params.sectionKey, content_html, req.session.user.id, content_html, req.session.user.id]);
  res.json({ success: true, message: 'Content saved' });
});

// ── USERS ──
router.post('/users/add-lecturer', upload.single('photo'), async (req, res) => {
  const { full_name, email, phone, department_id } = req.body;
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash(phone, 12);
  const photo = req.file ? req.file.path : null;
  await db.execute('INSERT INTO users (full_name, email, password, role, primary_department_id, photo_path) VALUES (?,?,?,?,?,?)',
    [full_name, email, hash, 'lecturer', department_id, photo]);
  res.json({ success: true, message: 'Lecturer added' });
});
router.patch('/users/:id/deactivate', async (req, res) => {
  await db.execute('UPDATE users SET is_active = FALSE WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// ── ENQUIRIES ──
router.get('/enquiries', async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM contact_enquiries ORDER BY submitted_at DESC');
  res.json({ success: true, data: rows });
});
router.patch('/enquiries/:id/read', async (req, res) => {
  await db.execute('UPDATE contact_enquiries SET is_read = TRUE WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// ── RECYCLE BIN ──
router.get('/recycle-bin', async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM recycle_bin ORDER BY deleted_at DESC');
  res.json({ success: true, data: rows });
});
router.post('/recycle-bin/:id/restore', async (req, res) => {
  const [[row]] = await db.execute('SELECT * FROM recycle_bin WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ success: false });
  const data = JSON.parse(row.data_snapshot);
  const columns = Object.keys(data).join(',');
  const placeholders = Object.keys(data).map(() => '?').join(',');
  const values = Object.values(data);
  await db.execute(`INSERT INTO ${row.original_table} (${columns}) VALUES (${placeholders})`, values);
  await db.execute('DELETE FROM recycle_bin WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Restored' });
});
router.delete('/recycle-bin/:id', async (req, res) => {
  await db.execute('DELETE FROM recycle_bin WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Permanently deleted' });
});

// ── TIMETABLE (admin view all) ──
router.get('/timetable/all', async (req, res) => {
  const [rows] = await db.execute('SELECT t.*, d.name AS dept_name FROM timetable t JOIN departments d ON t.department_id = d.id ORDER BY FIELD(t.day,"Mon","Tue","Wed","Thu","Fri"), t.time_start');
  res.json({ success: true, data: rows });
});

module.exports = router;