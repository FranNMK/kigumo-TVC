/**
 * Timetable Routes
 * Student: GET /my  → timetable for student's department
 * Lecturer: GET /my → own teaching slots
 * Admin: full CRUD later
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../utils/logger');
const { isAuthenticated, hasRole, withDepartment } = require('../middleware/auth');

/**
 * GET /api/v1/timetable/my
 * Returns timetable for the authenticated user's department (student) or own lectures (lecturer/HOD)
 */
router.get('/my', isAuthenticated, async (req, res) => {
  try {
    const user = req.session.user;
    let sql, params;

    if (user.role === 'student') {
      // Student sees timetable for their primary department
      sql = `
        SELECT t.id, t.subject, t.day, t.time_start, t.time_end, t.room,
               c.name AS course_name,
               u.full_name AS lecturer_name
        FROM timetable t
        JOIN courses c ON t.course_id = c.id
        JOIN users u ON t.lecturer_id = u.id
        WHERE t.department_id = ?
        ORDER BY FIELD(t.day, 'Mon','Tue','Wed','Thu','Fri'), t.time_start
      `;
      params = [user.primary_department_id];
    } else if (['lecturer','hod'].includes(user.role)) {
      // Lecturer/HOD sees their own teaching slots
      sql = `
        SELECT t.id, t.subject, t.day, t.time_start, t.time_end, t.room,
               d.name AS department_name,
               c.name AS course_name
        FROM timetable t
        JOIN departments d ON t.department_id = d.id
        JOIN courses c ON t.course_id = c.id
        WHERE t.lecturer_id = ?
        ORDER BY FIELD(t.day, 'Mon','Tue','Wed','Thu','Fri'), t.time_start
      `;
      params = [user.id];
    } else {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const [rows] = await db.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('Timetable error', { error: err.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;