/**
 * Announcements Routes
 * Student: GET /my → college-wide + own department
 * Lecturer/HOD: create, edit, delete own announcements
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../utils/logger');
const { isAuthenticated, hasRole } = require('../middleware/auth');

/**
 * GET /api/v1/announcements/my
 */
router.get('/my', isAuthenticated, async (req, res) => {
  try {
    const user = req.session.user;
    let sql = `
      SELECT a.id, a.title, a.body, a.scope, a.department_id, a.posted_at,
             u.full_name AS posted_by_name
      FROM announcements a
      JOIN users u ON a.posted_by = u.id
      WHERE a.scope = 'college_wide'
    `;
    const params = [];
    if (user.role === 'student' || user.role === 'hod' || user.role === 'lecturer') {
      sql += ` OR (a.scope = 'department' AND a.department_id = ?)`;
      params.push(user.primary_department_id);
    }
    sql += ` ORDER BY a.posted_at DESC LIMIT 50`;
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('Announcements error', { error: err.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * POST /api/v1/announcements
 * Lecturer/HOD creates announcement
 */
router.post('/', isAuthenticated, hasRole('lecturer','hod'), async (req, res) => {
  try {
    const { title, body, scope, department_id } = req.body;
    if (!title || !body || !scope) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }
    let deptId = null;
    if (scope === 'department') {
      deptId = department_id || req.session.user.primary_department_id;
    }
    await db.execute(
      `INSERT INTO announcements (title, body, scope, department_id, posted_by) VALUES (?,?,?,?,?)`,
      [title, body, scope, deptId, req.session.user.id]
    );
    res.json({ success: true, message: 'Announcement posted' });
  } catch (err) {
    logger.error('Post announcement error', { error: err.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;