/**
 * Users Routes (public limited)
 */
const express = require("express");
const router = express.Router();
const db = require("../db");
const logger = require("../utils/logger");
const { isAuthenticated, hasRole } = require("../middleware/auth");

router.get("/", async (req, res) => {
  try {
    const { role } = req.query;
    // bio is excluded — it's not needed by the public API callers (departments.html, etc.)
    // photo_path is kept because departments.html uses it to display HOD photos.
    let sql = `SELECT id, full_name, email, reg_number, role, primary_department_id, photo_path FROM users WHERE is_active = TRUE`;
    const params = [];
    if (role) {
      sql += ` AND role = ?`;
      params.push(role);
    }
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error("Error fetching users", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * GET /api/v1/users/department/:id
 * Returns students belonging to a department (HOD only)
 */
router.get(
  "/department/:id",
  isAuthenticated,
  hasRole("hod"),
  async (req, res) => {
    try {
      // Ensure HOD only sees their own department
      if (req.session.user.primary_department_id != req.params.id) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied" });
      }
      const [rows] = await db.execute(
        `SELECT id, full_name, email, reg_number, year_of_study, is_active
       FROM users
       WHERE role = 'student' AND primary_department_id = ? AND is_active = TRUE
       ORDER BY full_name`,
        [req.params.id],
      );
      res.json({ success: true, data: rows });
    } catch (err) {
      logger.error("Dept students error", { error: err.message });
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

/**
 * POST /api/v1/users/add-student
 * HOD adds a student to their department
 */
router.post(
  "/add-student",
  isAuthenticated,
  hasRole("hod"),
  async (req, res) => {
    try {
      const {
        full_name,
        email,
        reg_number,
        phone,
        year_of_study,
        department_id,
      } = req.body;
      if (!full_name || !reg_number || !phone) {
        return res
          .status(400)
          .json({ success: false, message: "Missing required fields" });
      }
      // Validate reg_number format
      if (!/^[A-Z]+\/\d{4}\/\d+$/i.test(reg_number)) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Invalid registration number format",
          });
      }
      // Ensure HOD can only add to own department
      if (req.session.user.primary_department_id != department_id) {
        return res
          .status(403)
          .json({
            success: false,
            message: "You can only add to your department",
          });
      }

      // Hash password (phone number) using bcrypt
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash(phone, 12);

      await db.execute(
        `INSERT INTO users (full_name, email, reg_number, password, role, primary_department_id, year_of_study)
       VALUES (?, ?, ?, ?, 'student', ?, ?)`,
        [
          full_name,
          email || null,
          reg_number,
          hashedPassword,
          department_id,
          year_of_study || 1,
        ],
      );

      logger.info("Student added by HOD", {
        reg_number,
        added_by: req.session.user.id,
      });
      res.json({ success: true, message: "Student added successfully" });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res
          .status(400)
          .json({
            success: false,
            message: "Registration number or email already exists",
          });
      }
      logger.error("Add student error", { error: err.message });
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

module.exports = router;
