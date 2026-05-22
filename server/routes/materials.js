/**
 * Materials Routes
 * Student: GET /my  → materials for courses in student's department
 * Lecturer: upload, edit, delete own materials
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../utils/logger');
const { isAuthenticated, hasRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const dir = `uploads/${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}`;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|docx|pptx|mp4/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(null, ext);
  }
});

/**
 * GET /api/v1/materials/my
 * Student: materials for their department's courses
 * Lecturer: own uploaded materials
 */
router.get('/my', isAuthenticated, async (req, res) => {
  try {
    const user = req.session.user;
    let sql, params;

    if (user.role === 'student') {
      sql = `
        SELECT m.id, m.title, m.description, m.file_path, m.file_size, m.uploaded_at,
               c.name AS course_name
        FROM materials m
        JOIN courses c ON m.course_id = c.id
        WHERE c.department_id = ?
        ORDER BY m.uploaded_at DESC
      `;
      params = [user.primary_department_id];
    } else if (['lecturer','hod'].includes(user.role)) {
      sql = `
        SELECT m.id, m.title, m.description, m.file_path, m.file_size, m.uploaded_at,
               c.name AS course_name
        FROM materials m
        JOIN courses c ON m.course_id = c.id
        WHERE m.uploaded_by = ?
        ORDER BY m.uploaded_at DESC
      `;
      params = [user.id];
    } else {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const [rows] = await db.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('Materials error', { error: err.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * POST /api/v1/materials/upload
 * Lecturer/HOD uploads a file
 */
router.post('/upload', isAuthenticated, hasRole('lecturer','hod'), upload.single('file'), async (req, res) => {
  try {
    const { title, description, course_id } = req.body;
    if (!title || !course_id || !req.file) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const filePath = req.file.path.replace(/\\/g, '/'); // for Windows
    await db.execute(
      `INSERT INTO materials (title, description, file_path, file_size, course_id, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description || '', filePath, Math.round(req.file.size/1024), course_id, req.session.user.id]
    );

    res.json({ success: true, message: 'File uploaded' });
  } catch (err) {
    logger.error('Upload error', { error: err.message });
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

module.exports = router;