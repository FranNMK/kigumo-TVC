/**
 * Public Stats API
 * GET /api/v1/stats - returns total students, courses, departments
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../utils/logger');

router.get('/', async (req, res) => {
  try {
    const [[{ totalStudents }]] = await db.execute(
      `SELECT COUNT(*) AS totalStudents FROM users WHERE role = 'student' AND is_active = TRUE`
    );
    const [[{ totalCourses }]] = await db.execute(
      `SELECT COUNT(*) AS totalCourses FROM courses WHERE is_active = TRUE`
    );
    const [[{ totalDepartments }]] = await db.execute(
      `SELECT COUNT(*) AS totalDepartments FROM departments WHERE type = 'academic'`
    );
    const [[{ totalLecturers }]] = await db.execute(
      `SELECT COUNT(*) AS totalLecturers FROM users WHERE role IN ('lecturer','hod') AND is_active = TRUE`
    );

    // Years since establishment (2015)
    const yearsSinceEstablishment = new Date().getFullYear() - 2023;

    res.json({
      success: true,
      data: {
        totalStudents,
        totalCourses,
        totalDepartments,
        totalLecturers,
        yearsSinceEstablishment
      }
    });
  } catch (err) {
    logger.error('Stats error', { error: err.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;