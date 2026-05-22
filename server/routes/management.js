/**
 * Management Dashboard API
 * Read-only overview for Principal & Deputy Principals
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../utils/logger');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// Apply authentication & role guard to all routes
router.use(isAuthenticated);
router.use(hasRole('chief_principal', 'deputy_principal_academics', 'deputy_principal_administration'));

/**
 * GET /api/v1/management/overview
 * Returns total counts for key resources
 */
router.get('/overview', async (req, res) => {
  try {
    const [[{ totalStudents }]] = await db.execute(
      `SELECT COUNT(*) AS totalStudents FROM users WHERE role = 'student' AND is_active = TRUE`
    );
    const [[{ totalLecturers }]] = await db.execute(
      `SELECT COUNT(*) AS totalLecturers FROM users WHERE role IN ('lecturer','hod') AND is_active = TRUE`
    );
    const [[{ totalCourses }]] = await db.execute(
      `SELECT COUNT(*) AS totalCourses FROM courses WHERE is_active = TRUE`
    );
    const [[{ totalDepartments }]] = await db.execute(
      `SELECT COUNT(*) AS totalDepartments FROM departments`
    );

    res.json({
      success: true,
      data: { totalStudents, totalLecturers, totalCourses, totalDepartments }
    });
  } catch (err) {
    logger.error('Management overview error', { error: err.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * GET /api/v1/management/departments
 * Department resource matrix (academic departments)
 */
router.get('/departments', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        d.id, d.name,
        u.full_name AS hod_name,
        COUNT(DISTINCT m.id) AS materialsCount,
        COUNT(DISTINCT s.id) AS studentCount
      FROM departments d
      LEFT JOIN hod_assignments ha ON d.id = ha.department_id
      LEFT JOIN users u ON ha.lecturer_id = u.id AND u.is_active = TRUE
      LEFT JOIN courses c ON c.department_id = d.id
      LEFT JOIN materials m ON m.course_id = c.id
      LEFT JOIN users s ON s.primary_department_id = d.id AND s.role = 'student' AND s.is_active = TRUE
      WHERE d.type = 'academic'
      GROUP BY d.id, d.name, u.full_name
      ORDER BY d.name
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('Management departments error', { error: err.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;