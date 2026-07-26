/**
 * Materials Routes (Local Storage)
 * Files are saved to public/uploads/ — same approach as admin.js downloads.
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
const fs = require("fs");

const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp',
  'pdf', 'doc', 'docx', 'ppt', 'pptx',
  'mp4', 'txt',
]);

const EXT_CATEGORY = {
  jpg: 'image/', jpeg: 'image/', png: 'image/', gif: 'image/', webp: 'image/',
  pdf: 'application/pdf',
  doc: 'application/', docx: 'application/',
  ppt: 'application/', pptx: 'application/',
  mp4: 'video/',
  txt: 'text/',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error(`File type not allowed: .${ext}`));
    }

    const mime = file.mimetype || '';
    const category = EXT_CATEGORY[ext] || '';

    const mimeOk =
      mime === '' ||
      mime === 'application/octet-stream' ||
      mime.startsWith(category);

    if (mimeOk) return cb(null, true);

    cb(new Error(`File type not allowed: .${ext} (${mime})`));
  },
});

// ── Helper: extract admission prefix from reg_number ───────
function getStudentPrefix(regNumber) {
  if (!regNumber) return null;
  const match = regNumber.match(/^([A-Z]+\/\d{4})/);
  return match ? match[1] : null;
}

// ── Helper: save buffer to public/uploads and return the URL path ──
function saveLocalFile(buffer, originalname) {
  const uploadDir = path.join(__dirname, "../../public/uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const filename = Date.now() + "_" + originalname.replace(/\s+/g, "_");
  fs.writeFileSync(path.join(uploadDir, filename), buffer);
  return "/uploads/" + filename;
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
        SELECT DISTINCT m.id, m.title, m.description, m.file_path, m.file_size,
            m.original_filename, m.uploaded_at,
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
        SELECT m.id, m.title, m.description, m.file_path, m.file_size, m.original_filename, m.uploaded_at,
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

    const [rows] = await db.execute(sql, params);
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
      let course_id = parseInt(req.body.course_id) || 1;

      if (!title || !req.file) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields (title, file)",
        });
      }

      // admission_prefixes can be a JSON array string or a comma-separated string
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

      // Save file locally to public/uploads/
      const fileUrl = saveLocalFile(req.file.buffer, req.file.originalname);
      const originalFilename = req.file.originalname;

      const [result] = await db.execute(
        `INSERT INTO materials (title, description, file_path, file_size, original_filename, course_id, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          description || "",
          fileUrl,
          req.file.size,
          originalFilename,
          course_id,
          req.session.user.id,
        ],
      );

      for (const prefix of prefixes) {
        await db.execute(
          `INSERT INTO material_cohorts (material_id, admission_prefix) VALUES (?, ?)`,
          [result.insertId, prefix],
        );
      }

      logger.info("Material uploaded locally", {
        material_id: result.insertId,
        prefixes,
        file_path: fileUrl,
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
        "SELECT id, file_path FROM materials WHERE id = ? AND uploaded_by = ?",
        [req.params.id, req.session.user.id],
      );
      if (materials.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Material not found" });
      }

      const material = materials[0];

      // Delete local file if it exists
      if (material.file_path && material.file_path.startsWith("/uploads/")) {
        const localPath = path.join(
          __dirname,
          "../../public",
          material.file_path,
        );
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
          logger.info("Local material file deleted", { path: localPath });
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

// ── GET /download/:id – serve file with original filename ──
// Auth check is performed server-side. Redirects to the local /uploads/ path.
router.get('/download/:id', isAuthenticated, async (req, res) => {
  try {
    const user = req.session.user;

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

    const { file_path } = rows[0];
    if (!file_path) return res.status(404).json({ success: false, message: 'File not available' });

    // file_path is stored as /uploads/<filename> — redirect directly to it.
    res.redirect(302, file_path);

  } catch (err) {
    logger.error('Download route error', { error: err.message || err.toString() });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
