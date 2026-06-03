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
const cloudinary = require('../utils/cloudinary');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Multer config for file upload from client
const storage = multer.memoryStorage(); // Keep in memory for Cloudinary upload
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|docx|pptx|mp4|txt|doc/;
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
        SELECT m.id, m.title, m.description, m.file_path, m.file_size, m.public_id, m.uploaded_at,
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
 * Lecturer/HOD uploads a file to Cloudinary
 */
router.post('/upload', isAuthenticated, hasRole('lecturer','hod'), upload.single('file'), async (req, res) => {
  try {
    const { title, description, course_id } = req.body;
    if (!title || !course_id || !req.file) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Convert buffer to base64 for Cloudinary
    const fileBase64 = req.file.buffer.toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${fileBase64}`;
    
    // Upload to Cloudinary
    const cloudinaryResult = await cloudinary.uploadFile(dataURI, `kigumo-tvc/materials`);
    
    // Store both secure_url and public_id in database
    const [result] = await db.execute(
      `INSERT INTO materials (title, description, file_path, file_size, course_id, uploaded_by, public_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || '',
        cloudinaryResult.secure_url,
        req.file.size,
        course_id,
        req.session.user.id,
        cloudinaryResult.public_id
      ]
    );

    logger.info('Material uploaded to Cloudinary', { 
      title, 
      course_id, 
      public_id: cloudinaryResult.public_id,
      material_id: result.insertId
    });

    res.json({ 
      success: true, 
      message: 'File uploaded successfully',
      data: { id: result.insertId, public_id: cloudinaryResult.public_id }
    });
  } catch (err) {
    logger.error('Upload error', { error: err.message });
    res.status(500).json({ success: false, message: 'Upload failed: ' + err.message });
  }
});

/**
 * DELETE /api/v1/materials/:id
 * Lecturer/HOD deletes their own material and removes from Cloudinary
 */
router.delete('/:id', isAuthenticated, hasRole('lecturer','hod'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;

    // Get material details
    const [materials] = await db.execute(
      `SELECT id, public_id, file_path FROM materials WHERE id = ? AND uploaded_by = ?`,
      [id, userId]
    );

    if (!materials.length) {
      return res.status(404).json({ success: false, message: 'Material not found or not yours' });
    }

    const material = materials[0];

    // Delete from Cloudinary if public_id exists
    if (material.public_id) {
      try {
        await cloudinary.deleteFile(material.public_id);
        logger.info('File deleted from Cloudinary', { public_id: material.public_id });
      } catch (cloudErr) {
        logger.warn('Cloudinary deletion failed', { public_id: material.public_id, error: cloudErr.message });
        // Don't fail the delete if Cloudinary fails - proceed with DB delete
      }
    }

    // Delete from database
    await db.execute(`DELETE FROM materials WHERE id = ?`, [id]);

    logger.info('Material deleted', { material_id: id, public_id: material.public_id });
    res.json({ success: true, message: 'Material deleted' });
  } catch (err) {
    logger.error('Delete error', { error: err.message });
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

module.exports = router;