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

// Switch to memory storage for Cloudinary uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed =
      /jpeg|jpg|png|gif|webp|pdf|docx|doc|xlsx|xls|pptx|ppt|zip|rar/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
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

// ── USERS ──
router.post("/users/add-lecturer", upload.single("photo"), async (req, res) => {
  try {
    const { full_name, email, phone, department_id } = req.body;
    const bcrypt = require("bcryptjs");
    const hash = await bcrypt.hash(phone, 12);
    const photo = await uploadToCloudinary(req.file, "kigumo-tvc/staff");
    await db.execute(
      "INSERT INTO users (full_name, email, password, role, primary_department_id, photo_path) VALUES (?,?,?,?,?,?)",
      [full_name, email, hash, "lecturer", department_id, photo],
    );
    res.json({ success: true, message: "Lecturer added" });
  } catch (err) {
    logger.error("Add lecturer error", { error: err.message });
    res.status(500).json({ success: false, message: "Failed: " + err.message });
  }
});

router.patch("/users/:id/deactivate", async (req, res) => {
  await db.execute("UPDATE users SET is_active = FALSE WHERE id = ?", [
    req.params.id,
  ]);
  res.json({ success: true });
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
      return res
        .status(400)
        .json({
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

module.exports = router;
