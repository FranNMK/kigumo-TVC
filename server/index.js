const express = require("express");
const session = require("express-session");
const path = require("path");
require("dotenv").config();
const logger = require("./utils/logger");
const requestLogger = require("./middleware/requestLogger");

const app = express();

app.use(requestLogger);

// ── Middleware ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public folder (website pages)
app.use(express.static(path.join(__dirname, "../public")));
app.use("/public", express.static(path.join(__dirname, "../public")));

// Serve portal files (login, dashboards) - CRITICAL ADDITION
// Portal HTML files need to be accessible from /portal/ path
app.use("/portal", express.static(path.join(__dirname, "../portal")));

// Serve uploaded files (materials, images, documents)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Session configuration - UPDATED with security best practices
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "kigumo-tvc-dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Prevents client-side JS from reading cookie
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict", // CSRF protection
      maxAge: 30 * 60 * 1000, // 30 minutes
    },
  }),
);

// ── API Routes ─────────────────────────────────────────────
// UPDATED: Using /api/v1/ prefix as specified in architecture
// Authentication routes (login, logout, session check)
app.use("/api/v1/auth", require("./routes/auth"));

// Courses routes
app.use("/api/v1/courses", require("./routes/courses"));

// Timetable routes
app.use("/api/v1/timetable", require("./routes/timetable"));

// Materials routes
app.use("/api/v1/materials", require("./routes/materials"));

app.use("/api/v1/departments", require("./routes/departments"));
app.use("/api/v1/bom", require("./routes/bom"));
app.use("/api/v1/content", require("./routes/content"));
app.use("/api/v1/news", require("./routes/news"));
app.use("/api/v1/users", require("./routes/users"));
app.use("/api/v1/contact", require("./routes/contact"));
app.use("/api/v1/downloads", require("./routes/downloads"));
app.use("/api/v1/announcements", require("./routes/announcements"));
app.use("/api/v1/management", require("./routes/management"));
app.use("/api/v1/admin", require("./routes/admin"));
app.use('/api/v1/stats', require('./routes/stats'));
app.use('/api/v1/slides', require('./routes/slides'));
app.use('/api/v1/partners', require('./routes/partners'));

// ── Portal Page Routes ─────────────────────────────────────
// CRITICAL ADDITION: These routes serve portal HTML pages
// without exposing .html extension in URLs (clean URLs)

/**
 * GET /portal - Redirects to login page
 */
app.get("/portal", (req, res) => {
  res.redirect("/portal/login");
});

/**
 * GET /portal/login - Serves login page
 */
app.get("/portal/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../portal/login.html"));
});

/**
 * GET /portal/student-dashboard - Protected student dashboard
 * Frontend checks auth via /api/v1/auth/me
 */
app.get("/portal/student-dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../portal/student-dashboard.html"));
});

/**
 * GET /portal/lecturer-dashboard - Protected lecturer/HOD dashboard
 */
app.get("/portal/lecturer-dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../portal/lecturer-dashboard.html"));
});

/**
 * GET /portal/management-dashboard - Protected management dashboard
 */
app.get("/portal/management-dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../portal/management-dashboard.html"));
});

/**
 * GET /portal/admin/dashboard - Protected admin panel
 */
app.get("/portal/admin/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../portal/admin/dashboard.html"));
});
// ── Public Page Routes (for clean URLs) ────────────────────
// Optional: Serve public pages without .html extension
app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/about.html"));
});

app.get("/departments", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/departments.html"));
});

app.get("/courses", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/courses.html"));
});

app.get("/admissions", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admissions.html"));
});

app.get("/news", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/news.html"));
});

app.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/contact.html"));
});

app.get("/downloads", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/downloads.html"));
});

// ── Health check ────────────────────────────────────────────
app.get("/api/ping", (req, res) => {
  res.json({
    success: true,
    message: "Kigumo TVC server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ── 404 handler ─────────────────────────────────────────────
// Updated to handle both API and HTML requests appropriately
app.use((req, res) => {
  // Check if request expects JSON (API call)
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      error: "Route not found",
      code: "NOT_FOUND",
    });
  }

  // For HTML requests, send a simple 404 page
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 - Page Not Found | Kigumo TVC</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: #f8f9fa;
          color: #1a1a2e;
        }
        .error-container {
          text-align: center;
          padding: 2rem;
        }
        h1 { font-size: 6rem; color: #1a7a1a; margin: 0; }
        p { font-size: 1.2rem; margin: 1rem 0; }
        a { color: #1a7a1a; text-decoration: none; font-weight: bold; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="error-container">
        <h1>404</h1>
        <p>Page not found</p>
        <p><a href="/">← Back to Homepage</a></p>
      </div>
    </body>
    </html>
  `);
});

// ── Global Error Handler ────────────────────────────────────
// CRITICAL ADDITION: Catches unhandled errors in routes
app.use((err, req, res, next) => {
  // Log error internally
  if (process.env.NODE_ENV !== "production") {
    console.error("Server Error:", err.stack);
  } else {
    console.error("Server Error:", err.message);
  }

  // Never expose error details to client in production
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
    code: "SERVER_ERROR",
  });
});

// ── Start server ────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info("🚀 Kigumo TVC Server started", {
    port: PORT,
    environment: process.env.NODE_ENV || "development",
  });

  logger.info(`📁 Public site: http://localhost:${PORT}`);
  logger.info(`🔐 School Portal: http://localhost:${PORT}/portal/login`);
});

// Auto-clean recycle bin every 24 hours
setInterval(
  async () => {
    try {
      const db = require("./db");
      await db.execute(
        "DELETE FROM recycle_bin WHERE restore_deadline < NOW()",
      );
      logger.info("Recycle bin auto-cleanup completed");
    } catch (e) {
      logger.error("Recycle bin cleanup failed", { error: e.message });
    }
  },
  24 * 60 * 60 * 1000,
);

// ── Uncaught Exception Handler ──────────────────────────────
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION", {
    error: err.message,
    stack: err.stack,
  });
});

// ── Unhandled Promise Rejection Handler ────────────────────
process.on("unhandledRejection", (reason, promise) => {
  logger.error("UNHANDLED PROMISE REJECTION", {
    error: reason.message || reason,
    stack: reason.stack,
  });
});
