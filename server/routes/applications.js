const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');
const logger = require('../utils/logger');
const { uploadFile } = require('../utils/cloudinary');

// Multer config (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|gif/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext) || allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Only PDF, JPG, PNG, GIF allowed.'));
    }
  }
});

// ── HELPER: Upload to Cloudinary with correct resource_type ──
// PDFs are stored as 'raw' so they remain downloadable as original files.
// Images are stored as 'image' for optimised delivery.
async function uploadToCloudinary(file, folder) {
  if (!file) return null;
  const base64 = file.buffer.toString('base64');
  const dataURI = `data:${file.mimetype};base64,${base64}`;

  const resourceType = file.mimetype.startsWith('image/') ? 'image' : 'raw';

  const result = await uploadFile(dataURI, {
    folder,
    resource_type: resourceType,
    access_mode: 'public'
  });
  return result.secure_url;
}

// ── Helper: generate unique reference number ──
async function generateReference() {
  const year = new Date().getFullYear();
  let ref, exists;
  let attempts = 0;
  do {
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    ref = `KTVC/${year}/${random}`;
    const [rows] = await db.execute(
      'SELECT id FROM applications WHERE reference_number = ? LIMIT 1',
      [ref]
    );
    exists = rows.length > 0;
    attempts++;
  } while (exists && attempts < 100);
  return ref;
}

// ── POST /api/v1/applications ──
router.post('/', upload.fields([
  { name: 'kcse_cert', maxCount: 1 },
  { name: 'id_doc', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), async (req, res) => {
  try {
    const files = req.files || {};
    const body = req.body;

    // ── Validation ──
    const required = ['full_name', 'dob', 'gender', 'id_number', 'phone', 'email', 'kcse_year', 'kcse_grade', 'department_id', 'course_id', 'preferred_intake', 'study_mode'];
    for (const field of required) {
      if (!body[field] || body[field].trim() === '') {
        return res.status(400).json({ success: false, message: `Missing required field: ${field}` });
      }
    }

    // Email validation
    if (!body.email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    // Phone validation (basic Kenyan format)
    const phone = body.phone.replace(/\s/g, '');
    if (!/^(07|01|\+2547|\+2541)\d{8}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format' });
    }

    // File validation
    if (!files.kcse_cert || files.kcse_cert.length === 0) {
      return res.status(400).json({ success: false, message: 'KCSE Certificate is required' });
    }
    if (!files.id_doc || files.id_doc.length === 0) {
      return res.status(400).json({ success: false, message: 'National ID / Birth Certificate is required' });
    }

    // ── Upload to Cloudinary ──
    const kcseUrl = await uploadToCloudinary(files.kcse_cert[0], 'kigumo-tvc/applications/kcse');
    const idUrl = await uploadToCloudinary(files.id_doc[0], 'kigumo-tvc/applications/id');
    let photoUrl = null;
    if (files.photo && files.photo.length > 0) {
      photoUrl = await uploadToCloudinary(files.photo[0], 'kigumo-tvc/applications/photos');
    }

    // ── Generate reference ──
    const reference = await generateReference();

    // ── Insert into DB ──
    const [result] = await db.execute(`
      INSERT INTO applications (
        reference_number, full_name, dob, gender, id_number, phone, email, address,
        kcse_year, kcse_grade, prev_school, department_id, course_id,
        preferred_intake, study_mode,
        kcse_cert_path, id_doc_path, photo_path,
        status, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `, [
      reference,
      body.full_name.trim(),
      body.dob,
      body.gender,
      body.id_number.trim(),
      phone,
      body.email.trim(),
      body.address ? body.address.trim() : null,
      body.kcse_year,
      body.kcse_grade,
      body.prev_school ? body.prev_school.trim() : null,
      body.department_id,
      body.course_id,
      body.preferred_intake,
      body.study_mode,
      kcseUrl,
      idUrl,
      photoUrl
    ]);

    // ── Fetch course name for response ──
    const [courseRows] = await db.execute(
      'SELECT name FROM courses WHERE id = ?',
      [body.course_id]
    );
    const courseName = courseRows.length > 0 ? courseRows[0].name : 'Unknown';

    res.status(201).json({
      success: true,
      data: {
        reference_number: reference,
        applicant_name: body.full_name.trim(),
        course_name: courseName
      }
    });

  } catch (err) {
    logger.error('Application submission error', { error: err.message, stack: err.stack });
    res.status(500).json({ success: false, message: 'Submission failed. Please try again.' });
  }
});

module.exports = router;