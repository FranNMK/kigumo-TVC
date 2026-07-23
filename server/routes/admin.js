const express = require("express");
const router = express.Router();
const db = require("../db");
const logger = require("../utils/logger");
const { isAuthenticated, hasRole } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const { uploadFile, deleteFile } = require("../utils/cloudinary");

router.use(isAuthenticated);
router.use(hasRole("admin"));

// Allowed extensions → their accepted MIME types.
// Both the extension AND the MIME type must match; extension-only checks
// can be bypassed by renaming a file.
const ALLOWED_TYPES = {
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  gif:  'image/gif',
  webp: 'image/webp',
  pdf:  'application/pdf',
  doc:  'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls:  'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt:  'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip:  'application/zip',
  rar:  'application/x-rar-compressed',
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

// Helper: upload buffer to Cloudinary and return the secure URL
async function uploadToCloudinary(file, folder) {
  if (!file) return null;
  const fileBase64 = file.buffer.toString("base64");
  const dataURI = `data:${file.mimetype};base64,${fileBase64}`;
  const result = await uploadFile(dataURI, { folder });
  return result.secure_url;
}

// ── Helper: Sync HOD assignment for a user ──
async function syncHodAssignment(userId, departmentId, isHod) {
  if (isHod && departmentId) {
    // Remove any existing HOD for this department (so only one HOD per dept)
    await db.execute("DELETE FROM hod_assignments WHERE department_id = ?", [departmentId]);
    // Assign this user as HOD
    await db.execute(
      "INSERT INTO hod_assignments (department_id, lecturer_id, assigned_at) VALUES (?, ?, NOW())",
      [departmentId, userId]
    );
  } else {
    // If not HOD, or no department, remove any HOD assignment for this user
    await db.execute("DELETE FROM hod_assignments WHERE lecturer_id = ?", [userId]);
  }
}

// ── PORTALS CRUD ──
router.get('/portals', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM portals ORDER BY sort_order'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('Admin portals fetch error', { error: err.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/portals', async (req, res) => {
  try {
    const { name, description, link, icon, sort_order } = req.body;
    if (!name || !link) {
      return res.status(400).json({ success: false, message: 'Name and link are required' });
    }
    const [result] = await db.execute(
      'INSERT INTO portals (name, description, link, icon, sort_order) VALUES (?, ?, ?, ?, ?)',
      [name, description || '', link, icon || '🔗', sort_order || 0]
    );
    res.json({ success: true, message: 'Portal added', id: result.insertId });
  } catch (err) {
    logger.error('Portal create error', { error: err.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/portals/:id', async (req, res) => {
  try {
    const { name, description, link, icon, sort_order, is_active } = req.body;
    await db.execute(
      `UPDATE portals SET name=?, description=?, link=?, icon=?, sort_order=?, is_active=? WHERE id=?`,
      [name, description || '', link, icon || '🔗', sort_order || 0, is_active === undefined ? 1 : (is_active ? 1 : 0), req.params.id]
    );
    res.json({ success: true, message: 'Portal updated' });
  } catch (err) {
    logger.error('Portal update error', { error: err.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/portals/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM portals WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Portal deleted' });
  } catch (err) {
    logger.error('Portal delete error', { error: err.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ── GET ALL DEPARTMENTS (with new fields) ──
router.get("/departments", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        d.id, 
        d.name, 
        d.type, 
        d.description, 
        d.image_path, 
        d.created_at,
        d.vision, 
        d.mission, 
        d.objective, 
        NULL AS examining_body,
        u.full_name AS hod_name, 
        u.id AS hod_id,
        u.email AS hod_email, 
        u.photo_path AS hod_photo 
      FROM departments d
      LEFT JOIN hod_assignments ha ON ha.department_id = d.id
      LEFT JOIN users u ON u.id = ha.lecturer_id
      ORDER BY d.name
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error("Departments fetch error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── SLIDES ──
router.get("/slides", async (req, res) => {
  const [rows] = await db.execute(
    "SELECT * FROM slider_slides ORDER BY sort_order",
  );
  res.json({ success: true, data: rows });
});

router.post("/slides", upload.single("image"), async (req, res) => {
  try {
    const {
      badge_text,
      heading,
      subtext,
      btn1_text,
      btn1_url,
      btn2_text,
      btn2_url,
      sort_order,
    } = req.body;
    const image_path = await uploadToCloudinary(req.file, "kigumo-tvc/slider");
    await db.execute(
      `INSERT INTO slider_slides (image_path, badge_text, heading, subtext, btn1_text, btn1_url, btn2_text, btn2_url, sort_order, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        image_path,
        badge_text,
        heading,
        subtext,
        btn1_text,
        btn1_url,
        btn2_text,
        btn2_url,
        sort_order || 0,
        req.session.user.id,
      ],
    );
    res.json({ success: true, message: "Slide added" });
  } catch (err) {
    logger.error("Slide upload error", { error: err.message });
    res
      .status(500)
      .json({ success: false, message: "Upload failed: " + err.message });
  }
});

router.patch("/slides/:id/toggle", async (req, res) => {
  await db.execute(
    "UPDATE slider_slides SET is_active = NOT is_active WHERE id = ?",
    [req.params.id],
  );
  res.json({ success: true });
});

router.delete("/slides/:id", async (req, res) => {
  const [[row]] = await db.execute("SELECT * FROM slider_slides WHERE id = ?", [
    req.params.id,
  ]);
  if (row) {
    await db.execute(
      "INSERT INTO recycle_bin (original_table, original_id, data_snapshot, deleted_by) VALUES (?,?,?,?)",
      ["slider_slides", row.id, JSON.stringify(row), req.session.user.id],
    );
    await db.execute("DELETE FROM slider_slides WHERE id = ?", [req.params.id]);
  }
  res.json({ success: true, message: "Moved to recycle bin" });
});

// ── PRINCIPAL MESSAGE ──
router.put("/principal-message", upload.single("photo"), async (req, res) => {
  try {
    const { principal_name, title, message } = req.body;
    const [[existing]] = await db.execute(
      "SELECT * FROM principal_message WHERE is_active = TRUE LIMIT 1",
    );

    if (existing) {
      await db.execute(
        "INSERT INTO recycle_bin (original_table, original_id, data_snapshot, deleted_by) VALUES (?,?,?,?)",
        [
          "principal_message",
          existing.id,
          JSON.stringify(existing),
          req.session.user.id,
        ],
      );
      await db.execute("DELETE FROM principal_message WHERE id = ?", [
        existing.id,
      ]);
    }

    // Upload new photo to Cloudinary, or keep existing if no new file
    let photo_path;
    if (req.file) {
      photo_path = await uploadToCloudinary(req.file, "kigumo-tvc/principal");
    } else {
      photo_path = existing?.image_path || null;
    }

    await db.execute(
      "INSERT INTO principal_message (principal_name, title, message, image_path, is_active, created_by) VALUES (?,?,?,?,TRUE,?)",
      [principal_name, title, message, photo_path, req.session.user.id],
    );
    res.json({ success: true, message: "Principal message updated" });
  } catch (err) {
    logger.error("Principal message update error", { error: err.message });
    res
      .status(500)
      .json({ success: false, message: "Update failed: " + err.message });
  }
});

// ── PAGE CONTENT ──
router.get("/page-content", async (req, res) => {
  const [rows] = await db.execute(
    "SELECT page_key, section_key FROM page_content ORDER BY page_key, section_key",
  );
  res.json({ success: true, data: rows });
});

router.put("/page-content/:pageKey/:sectionKey", async (req, res) => {
  const { content_html } = req.body;
  const [[existing]] = await db.execute(
    "SELECT * FROM page_content WHERE page_key=? AND section_key=?",
    [req.params.pageKey, req.params.sectionKey],
  );
  if (existing) {
    await db.execute(
      "INSERT INTO recycle_bin (original_table, original_id, data_snapshot, deleted_by) VALUES (?,?,?,?)",
      [
        "page_content",
        existing.id,
        JSON.stringify(existing),
        req.session.user.id,
      ],
    );
  }
  await db.execute(
    "INSERT INTO page_content (page_key, section_key, content_html, updated_by) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE content_html=?, updated_by=?",
    [
      req.params.pageKey,
      req.params.sectionKey,
      content_html,
      req.session.user.id,
      content_html,
      req.session.user.id,
    ],
  );
  res.json({ success: true, message: "Content saved" });
});

// CREATE user (admin adds any role)
router.post("/users", upload.single("photo"), async (req, res) => {
  try {
    const {
      full_name,
      email,
      reg_number,
      phone,
      role,
      department_id,
      year_of_study,
      bio,
    } = req.body;
    if (!full_name || !phone || !role) {
      return res.status(400).json({
        success: false,
        message: "Full name, phone (password), and role are required",
      });
    }
    // Validate role
    const validRoles = [
      "student",
      "lecturer",
      "hod",
      "deputy_principal_academics",
      "deputy_principal_administration",
      "chief_principal",
      "admin",
      "registrar",
      "secretary",
      "dean_of_students",
    ];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }
    // Hash password (phone)
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(phone, 12);
    const photoPath = req.file
      ? await uploadToCloudinary(req.file, "kigumo-tvc/staff")
      : null;

    const [result] = await db.execute(
      `INSERT INTO users 
       (full_name, email, reg_number, password, role, primary_department_id, year_of_study, photo_path, bio) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name,
        email || null,
        reg_number || null,
        hashedPassword,
        role,
        department_id || null,
        year_of_study || 1,
        photoPath,
        bio || null,
      ]
    );

    // ── Auto‑assign HOD if role is 'hod' and department is given ──
    if (role === 'hod' && department_id) {
      await syncHodAssignment(result.insertId, department_id, true);
    }

    res.json({
      success: true,
      message: "User added successfully",
      id: result.insertId,
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Email or registration number already exists",
        });
    }
    logger.error("Admin user create error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.patch("/users/:id/deactivate", async (req, res) => {
  await db.execute("UPDATE users SET is_active = NOT is_active WHERE id = ?", [
    req.params.id,
  ]);
  res.json({ success: true });
});

// ── ADMIN: Full User CRUD ──
// GET all users (admin view with all fields)
router.get("/users", async (req, res) => {
  try {
    const { role, department } = req.query;
    // Single JOIN — avoids N+1 queries (one per user) to the remote TiDB instance
    let sql = `
      SELECT u.id, u.full_name, u.email, u.reg_number, u.role,
             u.primary_department_id, u.year_of_study, u.photo_path,
             u.bio, u.is_active, u.created_at, u.updated_at,
             d.name AS department_name
      FROM users u
      LEFT JOIN departments d ON d.id = u.primary_department_id
      WHERE 1=1`;
    const params = [];
    if (role) {
      sql += ` AND u.role = ?`;
      params.push(role);
    }
    if (department) {
      sql += ` AND u.primary_department_id = ?`;
      params.push(department);
    }
    sql += ` ORDER BY u.full_name`;
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error("Admin users fetch error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET single user
router.get("/users/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, full_name, email, reg_number, role, primary_department_id,
              year_of_study, photo_path, bio, is_active, created_at, updated_at
       FROM users WHERE id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const user = rows[0];
    if (user.primary_department_id) {
      const [[dept]] = await db.execute(
        "SELECT name FROM departments WHERE id = ?",
        [user.primary_department_id]
      );
      user.department_name = dept ? dept.name : null;
    } else {
      user.department_name = null;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    logger.error("Admin user fetch error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// UPDATE user
router.put("/users/:id", upload.single("photo"), async (req, res) => {
  try {
    const {
      full_name,
      email,
      reg_number,
      role,
      department_id,
      year_of_study,
      bio,
      is_active,
    } = req.body;

    // Fetch existing user
    const [[existing]] = await db.execute("SELECT * FROM users WHERE id = ?", [
      req.params.id,
    ]);
    if (!existing) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Build update fields
    let updateFields = [];
    let params = [];
    if (full_name !== undefined) {
      updateFields.push("full_name = ?");
      params.push(full_name);
    }
    if (email !== undefined) {
      updateFields.push("email = ?");
      params.push(email || null);
    }
    if (reg_number !== undefined) {
      updateFields.push("reg_number = ?");
      params.push(reg_number || null);
    }
    if (role !== undefined) {
      const validRoles = [
        "student",
        "lecturer",
        "hod",
        "deputy_principal_academics",
        "deputy_principal_administration",
        "chief_principal",
        "admin",
        "registrar",
        "secretary",
        "dean_of_students",
      ];
      if (!validRoles.includes(role)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid role" });
      }
      updateFields.push("role = ?");
      params.push(role);
    }
    if (department_id !== undefined) {
      updateFields.push("primary_department_id = ?");
      params.push(department_id || null);
    }
    if (year_of_study !== undefined) {
      updateFields.push("year_of_study = ?");
      params.push(year_of_study || 1);
    }
    if (bio !== undefined) {
      updateFields.push("bio = ?");
      params.push(bio || null);
    }
    if (is_active !== undefined) {
      updateFields.push("is_active = ?");
      params.push(is_active === "true" || is_active === true ? 1 : 0);
    }

    // Photo upload
    let photoPath = existing.photo_path;
    if (req.file) {
      photoPath = await uploadToCloudinary(req.file, "kigumo-tvc/staff");
      updateFields.push("photo_path = ?");
      params.push(photoPath);
    }

    if (updateFields.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No fields to update" });
    }

    params.push(req.params.id);
    await db.execute(
      `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
      params
    );

    // ── Sync HOD assignment based on new role and department ──
    const newRole = role !== undefined ? role : existing.role;
    const newDeptId = department_id !== undefined ? department_id : existing.primary_department_id;
    const isHod = (newRole === 'hod') && (newDeptId !== null && newDeptId !== undefined);

    // If the role is HOD and we have a department, assign. Otherwise remove any existing assignment.
    if (isHod) {
      await syncHodAssignment(req.params.id, newDeptId, true);
    } else {
      await syncHodAssignment(req.params.id, null, false);
    }

    res.json({ success: true, message: "User updated successfully" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Email or registration number already exists",
        });
    }
    logger.error("Admin user update error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE user (soft delete)
router.delete("/users/:id", async (req, res) => {
  // Fetch the user first (uses the shared pool — safe, no FK side-effects)
  let row;
  try {
    const [[found]] = await db.execute("SELECT * FROM users WHERE id = ?", [
      req.params.id,
    ]);
    if (!found) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    row = found;
  } catch (err) {
    logger.error("Admin user delete error (fetch)", { error: err.message });
    return res.status(500).json({ success: false, message: "Server error" });
  }

  // Archive + FK-disabled delete must run on a DEDICATED connection so that
  // `SET foreign_key_checks = 0` is scoped to this connection only and cannot
  // leak back into the shared pool even if an error occurs mid-sequence.
  const conn = await db.getConnection();
  try {
    // 1. Archive to recycle_bin
    await conn.execute(
      "INSERT INTO recycle_bin (original_table, original_id, data_snapshot, deleted_by) VALUES (?,?,?,?)",
      ["users", row.id, JSON.stringify(row), req.session.user.id]
    );

    // 2. Disable FK checks on this connection only
    await conn.execute("SET foreign_key_checks = 0");

    // 3. Hard delete the user
    await conn.execute("DELETE FROM users WHERE id = ?", [req.params.id]);

    res.json({ success: true, message: "User permanently deleted and archived" });
  } catch (err) {
    logger.error("Admin user delete error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    // Always restore FK checks and release the connection, even if step 3 threw.
    // This guarantees the connection is never returned to the pool with FK checks off.
    try { await conn.execute("SET foreign_key_checks = 1"); } catch (_) {}
    conn.release();
  }
});

// Reset password (optional)
router.patch("/users/:id/password", async (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password) {
      return res
        .status(400)
        .json({ success: false, message: "New password is required" });
    }
    const bcrypt = require("bcryptjs");
    const hashed = await bcrypt.hash(new_password, 12);
    await db.execute("UPDATE users SET password = ? WHERE id = ?", [
      hashed,
      req.params.id,
    ]);
    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    logger.error("Admin user password reset error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── ENQUIRIES ──
router.get("/enquiries", async (req, res) => {
  const [rows] = await db.execute(
    "SELECT * FROM contact_enquiries ORDER BY submitted_at DESC",
  );
  res.json({ success: true, data: rows });
});

router.patch("/enquiries/:id/read", async (req, res) => {
  await db.execute("UPDATE contact_enquiries SET is_read = TRUE WHERE id = ?", [
    req.params.id,
  ]);
  res.json({ success: true });
});

// ── RECYCLE BIN ──
router.get("/recycle-bin", async (req, res) => {
  const [rows] = await db.execute(
    "SELECT * FROM recycle_bin ORDER BY deleted_at DESC",
  );
  res.json({ success: true, data: rows });
});

router.post("/recycle-bin/:id/restore", async (req, res) => {
  const [[row]] = await db.execute("SELECT * FROM recycle_bin WHERE id = ?", [
    req.params.id,
  ]);
  if (!row) return res.status(404).json({ success: false });
  const data = JSON.parse(row.data_snapshot);
  const columns = Object.keys(data).join(",");
  const placeholders = Object.keys(data)
    .map(() => "?")
    .join(",");
  const values = Object.values(data);
  await db.execute(
    `INSERT INTO ${row.original_table} (${columns}) VALUES (${placeholders})`,
    values,
  );
  await db.execute("DELETE FROM recycle_bin WHERE id = ?", [req.params.id]);
  res.json({ success: true, message: "Restored" });
});

router.delete("/recycle-bin/:id", async (req, res) => {
  await db.execute("DELETE FROM recycle_bin WHERE id = ?", [req.params.id]);
  res.json({ success: true, message: "Permanently deleted" });
});

// ── TIMETABLE (admin view all) ──
router.get("/timetable/all", async (req, res) => {
  const [rows] = await db.execute(
    'SELECT t.*, d.name AS dept_name FROM timetable t JOIN departments d ON t.department_id = d.id ORDER BY FIELD(t.day,"Mon","Tue","Wed","Thu","Fri"), t.time_start',
  );
  res.json({ success: true, data: rows });
});

// ── NEWS CRUD ──
// GET all news (admin view, includes unpublished)
router.get("/news", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, title, category, is_published, published_at, created_by FROM news_articles ORDER BY published_at DESC",
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error("Admin news fetch error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET single news article
router.get("/news/:id", async (req, res) => {
  try {
    const [[row]] = await db.execute(
      "SELECT * FROM news_articles WHERE id = ?",
      [req.params.id],
    );
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Article not found" });
    res.json({ success: true, data: row });
  } catch (err) {
    logger.error("Admin news fetch error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// CREATE news article
router.post("/news", upload.single("image"), async (req, res) => {
  try {
    const { title, body, category } = req.body;
    if (!title || !body) {
      return res
        .status(400)
        .json({ success: false, message: "Title and body are required" });
    }

    const image_path = await uploadToCloudinary(req.file, "kigumo-tvc/news");

    const [result] = await db.execute(
      "INSERT INTO news_articles (title, body, category, image_path, created_by, is_published) VALUES (?,?,?,?,?,TRUE)",
      [title, body, category || "general", image_path, req.session.user.id],
    );

    logger.info("News article created", { article_id: result.insertId });
    res.json({
      success: true,
      message: "Article published",
      id: result.insertId,
    });
  } catch (err) {
    logger.error("News create error", { error: err.message });
    res
      .status(500)
      .json({ success: false, message: "Create failed: " + err.message });
  }
});

// UPDATE news article
router.put("/news/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, body, category, is_published } = req.body;

    // Get existing article
    const [[existing]] = await db.execute(
      "SELECT * FROM news_articles WHERE id = ?",
      [req.params.id],
    );
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Article not found" });

    // Archive to recycle bin before updating
    await db.execute(
      "INSERT INTO recycle_bin (original_table, original_id, data_snapshot, deleted_by) VALUES (?,?,?,?)",
      [
        "news_articles",
        existing.id,
        JSON.stringify(existing),
        req.session.user.id,
      ],
    );

    const image_path = req.file
      ? await uploadToCloudinary(req.file, "kigumo-tvc/news")
      : existing.image_path;

    const published =
      is_published === "false"
        ? false
        : is_published === "true"
          ? true
          : existing.is_published;

    await db.execute(
      "UPDATE news_articles SET title=?, body=?, category=?, image_path=?, is_published=? WHERE id=?",
      [
        title || existing.title,
        body || existing.body,
        category || existing.category,
        image_path,
        published,
        req.params.id,
      ],
    );

    res.json({ success: true, message: "Article updated" });
  } catch (err) {
    logger.error("News update error", { error: err.message });
    res
      .status(500)
      .json({ success: false, message: "Update failed: " + err.message });
  }
});

// DELETE news article (move to recycle bin)
router.delete("/news/:id", async (req, res) => {
  try {
    const [[row]] = await db.execute(
      "SELECT * FROM news_articles WHERE id = ?",
      [req.params.id],
    );
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Article not found" });

    await db.execute(
      "INSERT INTO recycle_bin (original_table, original_id, data_snapshot, deleted_by) VALUES (?,?,?,?)",
      ["news_articles", row.id, JSON.stringify(row), req.session.user.id],
    );
    await db.execute("DELETE FROM news_articles WHERE id = ?", [req.params.id]);

    res.json({ success: true, message: "Article moved to recycle bin" });
  } catch (err) {
    logger.error("News delete error", { error: err.message });
    res.status(500).json({ success: false, message: "Delete failed" });
  }
});

// Toggle publish/unpublish
router.patch("/news/:id/toggle", async (req, res) => {
  try {
    await db.execute(
      "UPDATE news_articles SET is_published = NOT is_published WHERE id = ?",
      [req.params.id],
    );
    res.json({ success: true, message: "Status toggled" });
  } catch (err) {
    logger.error("News toggle error", { error: err.message });
    res.status(500).json({ success: false, message: "Toggle failed" });
  }
});

// ── PARTNERS ──
router.get("/partners", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, name, logo_path, website_url, sort_order, is_active FROM partners ORDER BY sort_order",
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error("Partners fetch error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/partners", upload.single("logo"), async (req, res) => {
  try {
    const { name, website_url, sort_order } = req.body;
    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "Partner name is required" });
    const logo_path = await uploadToCloudinary(req.file, "kigumo-tvc/partners");
    await db.execute(
      "INSERT INTO partners (name, logo_path, website_url, sort_order) VALUES (?,?,?,?)",
      [name, logo_path, website_url || null, sort_order || 0],
    );
    res.json({ success: true, message: "Partner added" });
  } catch (err) {
    logger.error("Partner create error", { error: err.message });
    res.status(500).json({ success: false, message: "Failed: " + err.message });
  }
});

router.put("/partners/:id", upload.single("logo"), async (req, res) => {
  try {
    const { name, website_url, sort_order } = req.body;
    const [[existing]] = await db.execute(
      "SELECT * FROM partners WHERE id = ?",
      [req.params.id],
    );
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Partner not found" });
    const logo_path = req.file
      ? await uploadToCloudinary(req.file, "kigumo-tvc/partners")
      : existing.logo_path;
    await db.execute(
      "UPDATE partners SET name=?, logo_path=?, website_url=?, sort_order=? WHERE id=?",
      [
        name || existing.name,
        logo_path,
        website_url || existing.website_url,
        sort_order || existing.sort_order,
        req.params.id,
      ],
    );
    res.json({ success: true, message: "Partner updated" });
  } catch (err) {
    logger.error("Partner update error", { error: err.message });
    res.status(500).json({ success: false, message: "Update failed" });
  }
});

router.delete("/partners/:id", async (req, res) => {
  await db.execute("DELETE FROM partners WHERE id = ?", [req.params.id]);
  res.json({ success: true, message: "Partner deleted" });
});

router.patch("/partners/:id/toggle", async (req, res) => {
  await db.execute(
    "UPDATE partners SET is_active = NOT is_active WHERE id = ?",
    [req.params.id],
  );
  res.json({ success: true });
});

// ── BOM (Board of Management) CRUD ──
router.get("/bom", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM bom_members ORDER BY sort_order"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error("Admin BOM fetch error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/bom", upload.single("photo"), async (req, res) => {
  try {
    const { full_name, position, sort_order } = req.body;
    if (!full_name) {
      return res.status(400).json({ success: false, message: "Full name is required" });
    }
    const photo_path = await uploadToCloudinary(req.file, "kigumo-tvc/bom");
    await db.execute(
      "INSERT INTO bom_members (full_name, position, photo_path, sort_order, is_active) VALUES (?,?,?,?,TRUE)",
      [full_name, position || "", photo_path, sort_order || 0]
    );
    res.json({ success: true, message: "BOM member added" });
  } catch (err) {
    logger.error("BOM create error", { error: err.message });
    res.status(500).json({ success: false, message: "Failed: " + err.message });
  }
});

router.put("/bom/:id", upload.single("photo"), async (req, res) => {
  try {
    const { full_name, position, sort_order } = req.body;
    const [[existing]] = await db.execute(
      "SELECT * FROM bom_members WHERE id = ?",
      [req.params.id]
    );
    if (!existing) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }
    const photo_path = req.file
      ? await uploadToCloudinary(req.file, "kigumo-tvc/bom")
      : existing.photo_path;
    await db.execute(
      "UPDATE bom_members SET full_name=?, position=?, photo_path=?, sort_order=? WHERE id=?",
      [full_name || existing.full_name, position || existing.position, photo_path, sort_order || existing.sort_order, req.params.id]
    );
    res.json({ success: true, message: "BOM member updated" });
  } catch (err) {
    logger.error("BOM update error", { error: err.message });
    res.status(500).json({ success: false, message: "Update failed" });
  }
});

router.delete("/bom/:id", async (req, res) => {
  try {
    const [[row]] = await db.execute("SELECT * FROM bom_members WHERE id = ?", [
      req.params.id,
    ]);
    if (!row) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }
    // Archive to recycle bin
    await db.execute(
      "INSERT INTO recycle_bin (original_table, original_id, data_snapshot, deleted_by) VALUES (?,?,?,?)",
      ["bom_members", row.id, JSON.stringify(row), req.session.user.id]
    );
    await db.execute("DELETE FROM bom_members WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "BOM member moved to recycle bin" });
  } catch (err) {
    logger.error("BOM delete error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.patch("/bom/:id/toggle", async (req, res) => {
  try {
    await db.execute(
      "UPDATE bom_members SET is_active = NOT is_active WHERE id = ?",
      [req.params.id]
    );
    res.json({ success: true, message: "Status toggled" });
  } catch (err) {
    logger.error("BOM toggle error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── DOWNLOADS CRUD ──
// GET all downloads (admin view)
router.get("/downloads", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, title, category, file_path, file_size, original_filename, uploaded_at FROM downloads ORDER BY category, uploaded_at DESC",
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error("Admin downloads fetch error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// CREATE download
router.post("/downloads", upload.single("file"), async (req, res) => {
  try {
    const { title, category } = req.body;
    if (!title || !category || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Title, category, and file are required",
      });
    }

    const cloudinaryResult = await uploadFile(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      { folder: "kigumo-tvc/downloads", resource_type: "raw" },
    );

    await db.execute(
      "INSERT INTO downloads (title, category, file_path, file_size, original_filename, uploaded_by) VALUES (?,?,?,?,?,?)",
      [
        title,
        category,
        cloudinaryResult.secure_url,
        req.file.size,
        req.file.originalname,
        req.session.user.id,
      ],
    );

    res.json({ success: true, message: "Download added" });
  } catch (err) {
    logger.error("Download create error", { error: err.message });
    res
      .status(500)
      .json({ success: false, message: "Upload failed: " + err.message });
  }
});

// UPDATE download
router.put("/downloads/:id", upload.single("file"), async (req, res) => {
  try {
    const { title, category } = req.body;
    const [[existing]] = await db.execute(
      "SELECT * FROM downloads WHERE id = ?",
      [req.params.id],
    );
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Download not found" });

    let file_path = existing.file_path;
    let file_size = existing.file_size;
    let original_filename = existing.original_filename;

    if (req.file) {
      const cloudinaryResult = await uploadFile(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        { folder: "kigumo-tvc/downloads", resource_type: "raw" },
      );
      file_path = cloudinaryResult.secure_url;
      file_size = req.file.size;
      original_filename = req.file.originalname;
    }

    await db.execute(
      "UPDATE downloads SET title=?, category=?, file_path=?, file_size=?, original_filename=? WHERE id=?",
      [
        title || existing.title,
        category || existing.category,
        file_path,
        file_size,
        original_filename,
        req.params.id,
      ],
    );

    res.json({ success: true, message: "Download updated" });
  } catch (err) {
    logger.error("Download update error", { error: err.message });
    res.status(500).json({ success: false, message: "Update failed" });
  }
});

// DELETE download
router.delete("/downloads/:id", async (req, res) => {
  try {
    const [[row]] = await db.execute("SELECT * FROM downloads WHERE id = ?", [
      req.params.id,
    ]);
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Download not found" });

    await db.execute(
      "INSERT INTO recycle_bin (original_table, original_id, data_snapshot, deleted_by) VALUES (?,?,?,?)",
      ["downloads", row.id, JSON.stringify(row), req.session.user.id],
    );
    await db.execute("DELETE FROM downloads WHERE id = ?", [req.params.id]);

    res.json({ success: true, message: "Download moved to recycle bin" });
  } catch (err) {
    logger.error("Download delete error", { error: err.message });
    res.status(500).json({ success: false, message: "Delete failed" });
  }
});

// ── DOWNLOAD CATEGORIES ──
router.get("/download-categories", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT dc.name, dc.display_name, COUNT(d.id) AS file_count
       FROM download_categories dc
       LEFT JOIN downloads d ON d.category = dc.name
       GROUP BY dc.name, dc.display_name
       ORDER BY dc.name`,
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    // Table might not exist yet
    logger.warn("Download categories fetch failed (table may not exist)", {
      error: err.message,
    });
    res.json({ success: true, data: [] });
  }
});

router.post("/download-categories", async (req, res) => {
  try {
    const { name, display_name } = req.body;
    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "Category name is required" });
    await db.execute(
      "INSERT INTO download_categories (name, display_name) VALUES (?,?)",
      [name, display_name || name],
    );
    res.json({ success: true, message: "Category added" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res
        .status(400)
        .json({ success: false, message: "Category already exists" });
    logger.error("Category create error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put("/download-categories/:name", async (req, res) => {
  try {
    const { display_name } = req.body;
    await db.execute(
      "UPDATE download_categories SET display_name=? WHERE name=?",
      [display_name, req.params.name],
    );
    res.json({ success: true, message: "Category updated" });
  } catch (err) {
    logger.error("Category update error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/download-categories/:name", async (req, res) => {
  try {
    await db.execute("DELETE FROM download_categories WHERE name=?", [
      req.params.name,
    ]);
    res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    logger.error("Category delete error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── COHORT BATCHES ──
router.get("/cohorts", async (req, res) => {
  try {
    const { department_id } = req.query;
    let sql = `
      SELECT cb.id, cb.department_id, cb.batch_code, cb.intake_date, cb.label, cb.is_active,
             d.name AS department_name
      FROM cohort_batches cb
      JOIN departments d ON d.id = cb.department_id
      WHERE 1=1
    `;
    const params = [];

    if (department_id && /^\d+$/.test(department_id)) {
      sql += " AND cb.department_id = ?";
      params.push(department_id);
    }

    sql += " ORDER BY cb.intake_date DESC, cb.batch_code DESC";
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error("Cohorts fetch error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/cohorts", upload.none(), async (req, res) => {
  try {
    const { department_id, batch_code, intake_date, label } = req.body;
    if (!department_id || !batch_code || !intake_date) {
      return res.status(400).json({
        success: false,
        message: "Department, batch code, and intake date are required",
      });
    }

    await db.execute(
      "INSERT INTO cohort_batches (department_id, batch_code, intake_date, label, is_active) VALUES (?,?,?,?,TRUE)",
      [department_id, batch_code, intake_date, label || batch_code],
    );
    res.json({ success: true, message: "Cohort added" });
  } catch (err) {
    logger.error("Cohort create error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.patch("/cohorts/:id/toggle", async (req, res) => {
  try {
    await db.execute(
      "UPDATE cohort_batches SET is_active = NOT is_active WHERE id = ?",
      [req.params.id],
    );
    res.json({ success: true, message: "Cohort status updated" });
  } catch (err) {
    logger.error("Cohort toggle error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ── DEPARTMENTS CRUD (with vision, mission, objective) ──
router.post("/departments", upload.single("image"), async (req, res) => {
  try {
    const { name, type, description, vision, mission, objective } = req.body;
    if (!name || !type)
      return res.status(400).json({ success: false, message: "Name and type are required" });

    const image_path = req.file
      ? await uploadToCloudinary(req.file, "kigumo-tvc/departments")
      : null;

    await db.execute(
      `INSERT INTO departments (name, type, description, vision, mission, objective, image_path) 
       VALUES (?,?,?,?,?,?,?)`,
      [name, type, description || "", vision || null, mission || null, objective || null, image_path]
    );
    res.json({ success: true, message: "Department added" });
  } catch (err) {
    logger.error("Dept create error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
});

router.put("/departments/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, type, description, vision, mission, objective } = req.body;
    const [[existing]] = await db.execute("SELECT * FROM departments WHERE id = ?", [req.params.id]);

    if (!existing) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    const image_path = req.file
      ? await uploadToCloudinary(req.file, "kigumo-tvc/departments")
      : existing.image_path || null;

    await db.execute(
      `UPDATE departments 
       SET name=?, type=?, description=?, vision=?, mission=?, objective=?, image_path=? 
       WHERE id=?`,
      [name, type, description || "", vision || null, mission || null, objective || null, image_path, req.params.id]
    );
    res.json({ success: true, message: "Department updated" });
  } catch (err) {
    logger.error("Dept update error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
});

router.delete("/departments/:id", async (req, res) => {
  try {
    const [[row]] = await db.execute("SELECT * FROM departments WHERE id = ?", [
      req.params.id,
    ]);
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    await db.execute(
      "INSERT INTO recycle_bin (original_table, original_id, data_snapshot, deleted_by) VALUES (?,?,?,?)",
      ["departments", row.id, JSON.stringify(row), req.session.user.id],
    );
    await db.execute("DELETE FROM departments WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Department moved to recycle bin" });
  } catch (err) {
    logger.error("Dept delete error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ── HOD ASSIGNMENT ──
router.put("/departments/:id/hod", async (req, res) => {
  try {
    const { lecturer_id, assigned_at } = req.body;
    const deptId = req.params.id;

    if (!lecturer_id) {
      return res
        .status(400)
        .json({ success: false, message: "Lecturer is required" });
    }

    // 1. Get department info
    const [[dept]] = await db.execute(
      "SELECT * FROM departments WHERE id = ?",
      [deptId]
    );
    if (!dept) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }

    // 2. Get lecturer info
    const [[lecturer]] = await db.execute(
      'SELECT * FROM users WHERE id = ? AND role IN ("lecturer","hod")',
      [lecturer_id]
    );
    if (!lecturer) {
      return res.status(400).json({
        success: false,
        message: "Selected user is not a lecturer or HOD",
      });
    }

    // 3. ENSURE THEY ARE ONLY HOD OF THIS SPECIFIC DEPARTMENT (by type)
    // If assigning to an ACADEMIC department: remove them from ALL other academic departments
    // If assigning to a NON_ACADEMIC department: remove them from ALL other non-academic departments
    // This allows them to be HOD of 1 academic + 1 non-academic simultaneously.
    const targetType = dept.type; // 'academic' or 'non_academic'
    await db.execute(
      `DELETE FROM hod_assignments 
       WHERE lecturer_id = ? 
       AND department_id != ? 
       AND department_id IN (SELECT id FROM departments WHERE type = ?)`,
      [lecturer_id, deptId, targetType]
    );

    // 4. Remove any existing HOD assigned to this department (just in case)
    await db.execute("DELETE FROM hod_assignments WHERE department_id = ?", [
      deptId,
    ]);

    // 5. Assign the new HOD
    await db.execute(
      "INSERT INTO hod_assignments (department_id, lecturer_id, assigned_at) VALUES (?,?,?)",
      [
        deptId,
        lecturer_id,
        assigned_at || new Date().toISOString().split("T")[0],
      ]
    );

    // 6. Update user role to HOD if they are currently a lecturer
    if (lecturer.role === "lecturer") {
      await db.execute('UPDATE users SET role = "hod" WHERE id = ?', [
        lecturer_id,
      ]);
    }

    res.json({ success: true, message: "HOD assigned successfully" });
  } catch (err) {
    logger.error("HOD assignment error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ── COURSES CRUD ──
router.post("/courses", async (req, res) => {
  try {
    const {
      name,
      department_id,
      duration_years,
      examining_body,
      cbet_status,
      entry_requirements,
      description,
      fees,
      intakes,
    } = req.body;
    if (!name || !department_id || !duration_years || !examining_body) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Insert course
    const [result] = await db.execute(
      "INSERT INTO courses (name, duration_years, department_id, examining_body, cbet_status, entry_requirements, description) VALUES (?,?,?,?,?,?,?)",
      [
        name,
        duration_years,
        department_id,
        examining_body,
        cbet_status ? 1 : 0,
        entry_requirements || "",
        description || "",
      ],
    );

    // Insert fees
    if (fees) {
      for (const [year, fee] of Object.entries(fees)) {
        await db.execute(
          "INSERT INTO fees (course_id, year_of_study, tuition, examination, registration, id_card, other, other_label, last_updated) VALUES (?,?,?,?,?,?,?,?,CURDATE())",
          [
            result.insertId,
            year,
            fee.tuition || 0,
            fee.examination || 0,
            fee.registration || 0,
            fee.id_card || 0,
            fee.other || 0,
            fee.other_label || "",
          ],
        );
      }
    }

    // Insert intakes
    if (intakes && Array.isArray(intakes)) {
      for (const intake of intakes) {
        if (intake.date) {
          await db.execute(
            "INSERT INTO intake_dates (course_id, intake_date, label) VALUES (?,?,?)",
            [result.insertId, intake.date, intake.label || ""],
          );
        }
      }
    }

    res.json({ success: true, message: "Course added", id: result.insertId });
  } catch (err) {
    logger.error("Course create error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put("/courses/:id", async (req, res) => {
  try {
    const {
      name,
      department_id,
      duration_years,
      examining_body,
      cbet_status,
      entry_requirements,
      description,
      fees,
      intakes,
    } = req.body;

    // Update course basic info
    await db.execute(
      "UPDATE courses SET name=?, department_id=?, duration_years=?, examining_body=?, cbet_status=?, entry_requirements=?, description=? WHERE id=?",
      [
        name,
        department_id,
        duration_years,
        examining_body,
        cbet_status ? 1 : 0,
        entry_requirements || "",
        description || "",
        req.params.id,
      ],
    );

    // Update fees: delete old, insert new
    await db.execute("DELETE FROM fees WHERE course_id = ?", [req.params.id]);
    if (fees) {
      for (const [year, fee] of Object.entries(fees)) {
        await db.execute(
          "INSERT INTO fees (course_id, year_of_study, tuition, examination, registration, id_card, other, other_label, last_updated) VALUES (?,?,?,?,?,?,?,?,CURDATE())",
          [
            req.params.id,
            year,
            fee.tuition || 0,
            fee.examination || 0,
            fee.registration || 0,
            fee.id_card || 0,
            fee.other || 0,
            fee.other_label || "",
          ],
        );
      }
    }

    // Update intakes: delete old, insert new
    await db.execute("DELETE FROM intake_dates WHERE course_id = ?", [
      req.params.id,
    ]);
    if (intakes && Array.isArray(intakes)) {
      for (const intake of intakes) {
        if (intake.date) {
          await db.execute(
            "INSERT INTO intake_dates (course_id, intake_date, label) VALUES (?,?,?)",
            [req.params.id, intake.date, intake.label || ""],
          );
        }
      }
    }

    res.json({ success: true, message: "Course updated" });
  } catch (err) {
    logger.error("Course update error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.patch("/courses/:id/toggle", async (req, res) => {
  await db.execute(
    "UPDATE courses SET is_active = NOT is_active WHERE id = ?",
    [req.params.id],
  );
  res.json({ success: true });
});

router.delete("/courses/:id", async (req, res) => {
  try {
    const [[row]] = await db.execute("SELECT * FROM courses WHERE id = ?", [
      req.params.id,
    ]);
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    await db.execute(
      "INSERT INTO recycle_bin (original_table, original_id, data_snapshot, deleted_by) VALUES (?,?,?,?)",
      ["courses", row.id, JSON.stringify(row), req.session.user.id],
    );
    await db.execute("DELETE FROM courses WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Course moved to recycle bin" });
  } catch (err) {
    logger.error("Course delete error", { error: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── ADMIN: Applications ──
router.get("/applications", async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = `
      SELECT a.*, c.name AS course_name, d.name AS department_name
      FROM applications a
      LEFT JOIN courses c ON a.course_id = c.id
      LEFT JOIN departments d ON a.department_id = d.id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (a.reference_number LIKE ? OR a.full_name LIKE ?)';
      params.push('%' + search + '%', '%' + search + '%');
    }
    sql += ' ORDER BY a.submitted_at DESC';
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('Applications fetch error', { error: err.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get("/applications/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT a.*, c.name AS course_name, d.name AS department_name
      FROM applications a
      LEFT JOIN courses c ON a.course_id = c.id
      LEFT JOIN departments d ON a.department_id = d.id
      WHERE a.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.patch("/applications/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'reviewed', 'accepted', 'rejected'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    await db.execute(
      'UPDATE applications SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, req.params.id]
    );
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
