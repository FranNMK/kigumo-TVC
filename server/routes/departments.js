/**
 * Departments Routes
 *
 * Public API for fetching academic and non-academic departments.
 * Includes HOD information and department details.
 *
 * @module routes/departments
 * @requires express
 */

const express = require("express");
const router = express.Router();
const db = require("../db");
const logger = require("../utils/logger");

/**
 * GET /api/v1/departments/with-courses
 * Returns all departments with their courses in a single query
 */
router.get("/with-courses", async (req, res) => {
  try {
    // Get all departments with HOD info
    const [departments] = await db.execute(`
  SELECT d.id, d.name, d.type, d.description, d.image_path,
         u.full_name AS hod_name, u.email AS hod_email, u.photo_path AS hod_photo
  FROM departments d
  LEFT JOIN hod_assignments ha ON d.id = ha.department_id
  LEFT JOIN users u ON ha.lecturer_id = u.id AND u.is_active = TRUE
  ORDER BY d.type ASC, d.name ASC
`);

    // Get all courses for all departments
    const [allCourses] = await db.execute(`
      SELECT c.id, c.name, c.duration_years, c.examining_body, c.cbet_status, 
             c.entry_requirements, c.description, c.department_id
      FROM courses c
      WHERE c.is_active = TRUE
      ORDER BY c.name ASC
    `);

    // Group courses by department_id
    const coursesByDept = {};
    allCourses.forEach((course) => {
      if (!coursesByDept[course.department_id]) {
        coursesByDept[course.department_id] = [];
      }
      coursesByDept[course.department_id].push(course);
    });

    // Attach courses to each department
    const result = departments.map((dept) => ({
      ...dept,
      courses: coursesByDept[dept.id] || [],
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    logger.error("Error fetching departments with courses", {
      error: err.message,
    });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * GET /api/v1/departments
 *
 * Returns all active departments with optional type filtering.
 * Includes HOD name and photo when available.
 *
 * Query params:
 *   - type: 'academic' | 'non_academic' (optional, returns all if not specified)
 *
 * Response:
 *   {
 *     success: true,
 *     data: [{ id, name, type, description, hod_name, hod_photo }]
 *   }
 */
router.get("/", async (req, res) => {
  const { type } = req.query;
  let sql = `
    SELECT d.id, d.name, d.type, d.description, d.image_path, d.created_at,
           u.full_name AS hod_name, u.email AS hod_email, u.photo_path AS hod_photo
    FROM departments d
    LEFT JOIN hod_assignments ha ON d.id = ha.department_id
    LEFT JOIN users u ON ha.lecturer_id = u.id AND u.is_active = TRUE
    WHERE 1=1
  `;
  const params = [];
  if (type && (type === "academic" || type === "non_academic")) {
    sql += ` AND d.type = ?`;
    params.push(type);
  }
  sql += ` ORDER BY d.type ASC, d.name ASC`;
  const [departments] = await db.execute(sql, params);
  res.json({ success: true, data: departments });
});
/**
 * GET /api/v1/departments/:id
 *
 * Returns a single department with full details.
 * Includes HOD information and list of courses offered.
 *
 * Response:
 *   {
 *     success: true,
 *     data: {
 *       id, name, type, description,
 *       hod: { name, email, photo, bio },
 *       courses: [{ id, name, duration, examining_body }]
 *     }
 *   }
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is numeric
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID.",
        code: "INVALID_ID",
      });
    }

    // Fetch department with HOD info
    const [departments] = await db.execute(
      `SELECT 
                d.id,
                d.name,
                d.type,
                d.description,
                d.created_at,
                u.id AS hod_id,
                u.full_name AS hod_name,
                u.email AS hod_email,
                u.photo_path AS hod_photo,
                u.bio AS hod_bio
            FROM departments d
            LEFT JOIN hod_assignments ha ON d.id = ha.department_id
            LEFT JOIN users u ON ha.lecturer_id = u.id AND u.is_active = TRUE
            WHERE d.id = ?`,
      [id],
    );

    if (departments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
        code: "NOT_FOUND",
      });
    }

    const department = departments[0];

    // Fetch courses for this department
    const [courses] = await db.execute(
      `SELECT 
                id, name, duration_years, examining_body, 
                cbet_status, entry_requirements, description
            FROM courses 
            WHERE department_id = ? AND is_active = TRUE
            ORDER BY name ASC`,
      [id],
    );

    // Format response
    const response = {
      id: department.id,
      name: department.name,
      type: department.type,
      description: department.description,
      created_at: department.created_at,
      hod: department.hod_id
        ? {
            id: department.hod_id,
            name: department.hod_name,
            email: department.hod_email,
            photo: department.hod_photo,
            bio: department.hod_bio,
          }
        : null,
      courses: courses.map((course) => ({
        id: course.id,
        name: course.name,
        duration: course.duration_years,
        examining_body: course.examining_body,
        cbet_status: course.cbet_status === 1,
        entry_requirements: course.entry_requirements,
        description: course.description,
      })),
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error("Error fetching department", {
      error: error.message,
      stack: error.stack,
      departmentId: req.params.id,
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch department details.",
      code: "SERVER_ERROR",
    });
  }
});

/**
 * GET /api/v1/departments/:id/courses
 *
 * Returns courses for a specific department.
 *
 * Response:
 *   {
 *     success: true,
 *     data: [{ id, name, duration_years, examining_body, cbet_status }]
 *   }
 */
router.get("/:id/courses", async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID.",
        code: "INVALID_ID",
      });
    }

    const [courses] = await db.execute(
      `SELECT 
                c.id, c.name, c.duration_years, c.examining_body, 
                c.cbet_status, c.entry_requirements, c.description
            FROM courses c
            WHERE c.department_id = ? AND c.is_active = TRUE
            ORDER BY c.name ASC`,
      [id],
    );

    // Format boolean field
    const formattedCourses = courses.map((course) => ({
      ...course,
      cbet_status: course.cbet_status === 1,
    }));

    res.json({
      success: true,
      data: formattedCourses,
    });
  } catch (error) {
    logger.error("Error fetching department courses", {
      error: error.message,
      departmentId: req.params.id,
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch department courses.",
      code: "SERVER_ERROR",
    });
  }
});

module.exports = router;
