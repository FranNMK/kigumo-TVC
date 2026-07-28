const express = require("express");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const path = require("path");
require("dotenv").config();
const logger = require("./utils/logger");
const requestLogger = require("./middleware/requestLogger");
// === Innovation Portal Routes ===
const innovationAuthRoutes = require('./routes/innovation-auth');
const innovationEventsRoutes = require('./routes/innovation-events');
const innovationParticipantsRoutes = require('./routes/innovation-participants');
const innovationCategoriesRoutes = require('./routes/innovation-categories');
const innovationScoresRoutes = require('./routes/innovation-scores');


const app = express();
app.set('trust proxy', 1);

app.use(requestLogger);

const cors = require("cors");

// ── CORS configuration ─────────────────────────────────────
// APP_ORIGINS  – comma-separated list of production/staging origins, set in .env
//               e.g. APP_ORIGINS=https://www.kigumotvc.ac.ke,https://assets.kigumotvc.ac.ke
// RAILWAY_PUBLIC_DOMAIN – kept so it can be removed from .env when Railway is retired;
//                         it contributes nothing when the var is unset.
const envOrigins = process.env.APP_ORIGINS
  ? process.env.APP_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

const devOrigins =
  process.env.NODE_ENV !== "production"
    ? ["http://localhost:3000", "http://localhost:8080"]
    : [];

// Railway origin: kept for backward compatibility — remove RAILWAY_PUBLIC_DOMAIN
// from .env once the Railway deployment is fully retired.
const railwayOrigins = [
  "https://kigumo-tvc-production.up.railway.app",
  process.env.RAILWAY_PUBLIC_DOMAIN || "",
].filter(Boolean);

const allowedOrigins = [...envOrigins, ...devOrigins, ...railwayOrigins];

if (process.env.NODE_ENV === "production" && envOrigins.length === 0) {
  logger.warn(
    "⚠️  APP_ORIGINS is not set — no production domains are in the CORS allowlist. " +
    "Add APP_ORIGINS=https://www.kigumotvc.ac.ke,https://assets.kigumotvc.ac.ke to your .env file."
  );
}

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// ── Middleware ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public folder (website pages)
app.use(express.static(path.join(__dirname, "../public")));
app.use("/public", express.static(path.join(__dirname, "../public")));

// Serve locally uploaded files (admin downloads)
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Serve portal files (login, dashboards)
app.use("/portal", express.static(path.join(__dirname, "../portal")));

// Serve innovation portal static assets
app.use('/innovation', express.static(path.join(__dirname, '../public/innovation')));

// ── Session secret ─────────────────────────────────────────
// Crash loudly at startup if SESSION_SECRET is missing in production.
// A missing secret would silently fall back to a known public string,
// which allows anyone to forge session cookies.
if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  logger.error("FATAL: SESSION_SECRET environment variable is not set. Server will not start.");
  process.exit(1);
}
const sessionSecret =
  process.env.SESSION_SECRET || "kigumo-tvc-dev-only-secret-do-not-use-in-prod";

// ── Session store ───────────────────────────────────────────
// Use the existing mysql2 pool (from db.js) so sessions survive process
// restarts and are shared across Passenger worker processes.
// express-mysql-session creates the `sessions` table automatically on first run.
const { pool: dbPool } = require("./db");
const sessionStore = new MySQLStore(
  {
    // Reuse the existing pool — do NOT create a second connection.
    // These options are ignored when a connection is passed in:
    createDatabaseTable: true,   // auto-create `sessions` table if absent
    clearExpired: true,          // periodically DELETE expired rows
    checkExpirationInterval: 15 * 60 * 1000, // check every 15 min
    expiration: 30 * 60 * 1000,              // match cookie maxAge (30 min)
    endConnectionOnClose: false, // don't close the shared pool on store.close()
  },
  dbPool
);

// Session configuration
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true, // Prevents client-side JS from reading cookie
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict", // CSRF protection
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

// Public intake-dates endpoint must be registered BEFORE the admin router
// because admin.js applies router.use(isAuthenticated) which blocks all routes
// inside it — including the one explicitly marked public.
app.get("/api/v1/admin/intake-dates/public", async (req, res) => {
  try {
    const [rows] = await dbPool.execute(
      `SELECT id, label, intake_date, application_deadline, programs_available, status
       FROM intake_dates_global
       WHERE YEAR(intake_date) >= YEAR(CURDATE())
       ORDER BY intake_date ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Public popup endpoint — returns the single intake that has show_popup=1 and
// is currently open or upcoming (the most recent one set by admin).
app.get("/api/v1/admin/intake-dates/popup", async (req, res) => {
  try {
    const [rows] = await dbPool.execute(
      `SELECT id, label, intake_date, application_deadline, programs_available, status
       FROM intake_dates_global
       WHERE show_popup = 1
         AND status IN ('open','upcoming')
       ORDER BY intake_date ASC
       LIMIT 1`
    );
    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.use("/api/v1/admin", require("./routes/admin"));
app.use("/api/v1/stats", require("./routes/stats"));
app.use("/api/v1/slides", require("./routes/slides"));
app.use("/api/v1/partners", require("./routes/partners"));
app.use("/api/v1/applications", require("./routes/applications"));
app.use("/api/v1/portals", require("./routes/portals"));
app.use('/api/v1/innovation/auth', innovationAuthRoutes);
app.use('/api/v1/innovation/events', innovationEventsRoutes);
app.use('/api/v1/innovation/participants', innovationParticipantsRoutes);
app.use('/api/v1/innovation/categories', innovationCategoriesRoutes);
app.use('/api/v1/innovation/scores', innovationScoresRoutes);

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
app.use((err, req, res, next) => {
  // Log full detail server-side; never expose stack traces to the client
  logger.error("Unhandled server error", {
    error: err.message,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    method: req.method,
    url: req.originalUrl,
  });

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
