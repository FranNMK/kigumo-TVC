/**
 * Materials Routes (Cloudinary Backend)
 * Student: GET /my   → materials for courses in student's department
 * Lecturer: upload, edit, delete own materials
 */
const express = require("express");
const router = express.Router();
const db = require("../db");
const logger = require("../utils/logger");
const { isAuthenticated, hasRole } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const { uploadFile, deleteFile } = require("../utils/cloudinary");
const cloudinary = require("cloudinary").v2;

// Image MIME types — anything else (PDF, DOCX, PPTX, …) is uploaded as raw
const IMAGE_MIMETYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "image/svg+xml", "image/bmp", "image/tiff"
]);

// Allowed extensions → their accepted MIME types.
// Both must match so a renamed file is rejected before it reaches Cloudinary.
const ALLOWED_TYPES = {
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  gif:  'image/gif',
  webp: 'image/webp',
  pdf:  'application/pdf',
  doc:  'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt:  'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  mp4:  'video/mp4',
  txt:  'text/plain',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const expectedMime = ALLOWED_TYPES[ext];
    if (expectedMime && file.mimetype === expectedMime) {
      return cb(null, true);
    }
    cb(new Error(`File type not allowed: .${ext} / ${file.mimetype}`));
  },
});

// ── Helper: generate download URL with original filename ──
function getDownloadUrl(public_id, original_filename, resource_type) {
  if (!public_id || !original_filename) return null;
  // Use the Cloudinary SDK to build a properly-versioned URL so we never
  // hardcode /v1/ or the cloud name.  resource_type comes from the upload result
  // stored per-file (defaults to 'raw' for non-image materials).
  return cloudinary.url(public_id, {
    secure: true,
    resource_type: resource_type || "raw",
    type: "upload",
    flags: `attachment:${encodeURIComponent(original_filename)}`,
  });
}

// ── Helper: extract admission prefix from reg_number ───────
function getStudentPrefix(regNumber) {
  if (!regNumber) return null;
  // matches DICT/2501, CICT/2501, etc.
  const match = regNumber.match(/^([A-Z]+\/\d{4})/);
  return match ? match[1] : null;
}

// ── GET /my ────────────────────────────────────────────────
router.get("/my", isAuthenticated, async (req, res) => {
  try {
    const user = req.session.user;
    let sql, params;

    if (user.role === "student") {
      const prefix = getStudentPrefix(user.reg_number);
      if (!prefix) {
        return res.json({ success: true, data: [] });
      }
      sql = `
        SELECT DISTINCT m.id, m.title, m.description, m.file_path, m.file_size, m.original_filename, m.uploaded_at,
            c.name AS course_name
        FROM materials m
        JOIN material_cohorts mc ON m.id = mc.material_id
        JOIN courses c ON m.course_id = c.id
        WHERE mc.admission_prefix = ?
        ORDER BY m.uploaded_at DESC
      `;
      params = [prefix];
    } else if (["lecturer", "hod"].includes(user.role)) {
      sql = `
        SELECT m.id, m.title, m.description, m.file_path, m.file_size, m.original_filename, m.public_id, m.uploaded_at,
       c.name AS course_name,
       GROUP_CONCAT(mc.admission_prefix SEPARATOR ', ') AS cohorts
        FROM materials m
        JOIN courses c ON m.course_id = c.id
        LEFT JOIN material_cohorts mc ON m.id = mc.material_id
        WHERE m.uploaded_by = ?
        GROUP BY m.id, c.name
        ORDER BY m.uploaded_at DESC
      `;
      params = [user.id];
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    let [rows] = await db.execute(sql, params);

    // Enhance with download URL using original filename
    rows = rows.map((row) => ({
      ...row,
      download_url: getDownloadUrl(row.public_id, row.original_filename),
    }));

    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error("Materials error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── POST /upload ───────────────────────────────────────────
router.post(
  "/upload",
  isAuthenticated,
  hasRole("lecturer", "hod"),
  upload.single("file"),
  async (req, res) => {
    try {
      const { title, description, admission_prefixes } = req.body;
      let course_id = parseInt(req.body.course_id) || 1; // default to 1

      if (!title || !req.file) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields (title, file)",
        });
      }

      // admission_prefixes can be a JSON array string (if sent as JSON) or a comma-separated string
      // Process admission_prefixes (can be JSON string, plain string, or already an array)
      let prefixes = [];
      if (admission_prefixes) {
        if (Array.isArray(admission_prefixes)) {
          prefixes = admission_prefixes;
        } else if (typeof admission_prefixes === "string") {
          try {
            const parsed = JSON.parse(admission_prefixes);
            prefixes = Array.isArray(parsed) ? parsed : [];
          } catch {
            prefixes = admission_prefixes
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          }
        }
      }

      // Upload to Cloudinary.
      // Non-image files (PDF, DOCX, PPTX, …) must use resource_type 'raw' so
      // that Cloudinary stores and delivers them as their original bytes.
      // Images keep resource_type 'image' so transformations still work.
      const isImage = IMAGE_MIMETYPES.has(req.file.mimetype);
      const fileBase64 = req.file.buffer.toString("base64");
      const dataURI = `data:${req.file.mimetype};base64,${fileBase64}`;
      const cloudinaryResult = await uploadFile(dataURI, {
        folder: "kigumo-tvc/materials",
        resource_type: isImage ? "image" : "raw",
      });

      // Insert material
      const originalFilename = req.file.originalname; // <-- grab the original name
      const [result] = await db.execute(
        `INSERT INTO materials (title, description, file_path, file_size, original_filename, course_id, uploaded_by, public_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          description || "",
          cloudinaryResult.secure_url,
          req.file.size || cloudinaryResult.bytes,
          originalFilename, // <-- new field
          course_id,
          req.session.user.id,
          cloudinaryResult.public_id,
        ],
      );

      // Insert cohort associations — one row per prefix using db.execute()
      // (db.query is not exported; mysql2's execute() doesn't support the
      //  bulk-values shorthand, so we insert rows individually in a loop)
      for (const prefix of prefixes) {
        await db.execute(
          `INSERT INTO material_cohorts (material_id, admission_prefix) VALUES (?, ?)`,
          [result.insertId, prefix],
        );
      }

      logger.info("Material uploaded", {
        material_id: result.insertId,
        prefixes,
        public_id: cloudinaryResult.public_id,
      });

      res.json({
        success: true,
        message: "File uploaded successfully",
        material_id: result.insertId,
      });
    } catch (err) {
      logger.error("Upload error", { error: err.message });
      res
        .status(500)
        .json({ success: false, message: "Upload failed: " + err.message });
    }
  },
);

// ── PUT /:id (edit title/description) ──────────────────────
router.put(
  "/:id",
  isAuthenticated,
  hasRole("lecturer", "hod"),
  async (req, res) => {
    try {
      const { title, description } = req.body;
      if (!title)
        return res
          .status(400)
          .json({ success: false, message: "Title is required" });

      const [rows] = await db.execute(
        "SELECT id FROM materials WHERE id = ? AND uploaded_by = ?",
        [req.params.id, req.session.user.id],
      );
      if (rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Material not found or not yours" });
      }

      await db.execute(
        "UPDATE materials SET title = ?, description = ? WHERE id = ?",
        [title, description || "", req.params.id],
      );
      res.json({ success: true, message: "Material updated" });
    } catch (err) {
      logger.error("Edit material error", { error: err.message });
      res.status(500).json({ success: false, message: "Update failed" });
    }
  },
);

// ── DELETE /:id ────────────────────────────────────────────
router.delete(
  "/:id",
  isAuthenticated,
  hasRole("lecturer", "hod"),
  async (req, res) => {
    try {
      const [materials] = await db.execute(
        "SELECT id, public_id FROM materials WHERE id = ? AND uploaded_by = ?",
        [req.params.id, req.session.user.id],
      );
      if (materials.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Material not found" });
      }

      const material = materials[0];

      // Delete from Cloudinary if public_id exists
      if (material.public_id) {
        try {
          await deleteFile(material.public_id);
          logger.info("Cloudinary file deleted", {
            public_id: material.public_id,
          });
        } catch (cloudErr) {
          logger.warn("Cloudinary deletion failed", {
            error: cloudErr.message,
          });
        }
      }

      // Database FK cascades will remove material_cohorts rows
      await db.execute("DELETE FROM materials WHERE id = ?", [material.id]);

      res.json({ success: true, message: "Material deleted" });
    } catch (err) {
      logger.error("Delete error", { error: err.message });
      res.status(500).json({ success: false, message: "Delete failed" });
    }
  },
);

// ── GET /cohorts – return available cohorts for the lecturer's department ──
router.get(
  "/cohorts",
  isAuthenticated,
  hasRole("lecturer", "hod"),
  async (req, res) => {
    try {
      const deptId = req.session.user.primary_department_id;
      const [rows] = await db.execute(
        "SELECT id, batch_code, label, intake_date FROM cohort_batches WHERE department_id = ? AND is_active = TRUE ORDER BY intake_date",
        [deptId],
      );
      res.json({ success: true, data: rows });
    } catch (err) {
      logger.error("Cohorts fetch error", { error: err.message });
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

const https = require('https');

// ── GET /download/:id – download with original filename ──────
router.get('/download/:id', isAuthenticated, async (req, res) => {
  try {
    const user = req.session.user;

    // Different queries based on role – the user must have access to this material
    let sql, params;
    if (user.role === 'student') {
      const prefix = getStudentPrefix(user.reg_number);
      if (!prefix) return res.status(403).json({ success: false, message: 'Access denied' });

      sql = `
        SELECT m.file_path, m.original_filename
        FROM materials m
        JOIN material_cohorts mc ON m.id = mc.material_id
        WHERE m.id = ? AND mc.admission_prefix = ?
      `;
      params = [req.params.id, prefix];
    } else if (['lecturer', 'hod'].includes(user.role)) {
      sql = `
        SELECT m.file_path, m.original_filename
        FROM materials m
        WHERE m.id = ? AND m.uploaded_by = ?
      `;
      params = [req.params.id, user.id];
    } else {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const [rows] = await db.execute(sql, params);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Material not found' });

    const { file_path, original_filename } = rows[0];
    if (!file_path) return res.status(404).json({ success: false, message: 'File not available' });

    // Stream the file from Cloudinary to the client
    const filename = original_filename || 'download';
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    https.get(file_path, (cloudRes) => {
      if (cloudRes.statusCode !== 200) {
        res.status(cloudRes.statusCode).json({ success: false, message: 'File not found on Cloudinary' });
        return;
      }
      cloudRes.pipe(res);
    }).on('error', (err) => {
      logger.error('Download proxy error', { error: err.message });
      res.status(500).json({ success: false, message: 'Download failed' });
    });

  } catch (err) {
    logger.error('Download route error', { error: err.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
