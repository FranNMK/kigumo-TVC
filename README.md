# Kigumo TVC — College Management System

A full-stack web application for **Kigumo Technical and Vocational College**. It serves two audiences: the **public-facing website** (courses, admissions, news, downloads, contact) and the **staff/student portal** (authentication, role-based dashboards, course materials, timetables, announcements, and an admin control panel). A separate **Innovation Portal** sub-system handles skills competitions, participant registration, and scoring.

All file storage (images, documents, PDFs) is handled through **Cloudinary**. The database is **TiDB Cloud** (MySQL-protocol compatible), accessed via `mysql2`. The app is deployed on **cPanel** using the Node.js Selector (Passenger).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v22 LTS |
| Framework | Express v5 |
| Database | TiDB Cloud Serverless (MySQL 8.0 protocol) via `mysql2` |
| File storage | Cloudinary v2 |
| Sessions | `express-session` + `express-mysql-session` (TiDB-backed) |
| Auth | `bcryptjs` (password compare), session cookies |
| Upload handling | `multer` (memory storage — no disk writes) |
| Rate limiting | `express-rate-limit` (login endpoint: 5 attempts / 15 min) |
| Logging | Custom structured logger (`server/utils/logger.js`) writing to `logs/` |
| Input validation | `express-validator` (innovation portal routes) |

---

## Project Structure

```
kigumo-TVC/
├── database/               # Schema & seed SQL files (one *-schema.sql + one seed per table)
│   └── migrations/         # Incremental ALTER/CREATE scripts; apply in order against live DB
├── logs/                   # Runtime log files (gitignored); auto-created on startup
├── portal/                 # Authenticated portal HTML pages (served at /portal/*)
│   ├── login.html
│   ├── student-dashboard.html
│   ├── lecturer-dashboard.html
│   ├── management-dashboard.html
│   └── admin/
│       └── dashboard.html
├── public/                 # Public-facing website (served as static files)
│   ├── assets/             # Shared CSS, JS, images
│   ├── uploads/            # Legacy local upload directory (served at /uploads — see note below)
│   ├── innovation/         # Innovation portal front-end
│   │   ├── admin/          # Innovation admin dashboard
│   │   │   └── dashboard.html
│   │   ├── coordinator/    # Coordinator scoring dashboard
│   │   │   └── dashboard.html
│   │   ├── assets/
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── about.html
│   │   └── results.html
│   ├── index.html          # Homepage
│   ├── about.html
│   ├── admissions.html
│   ├── apply.html          # Online application form
│   ├── contact.html
│   ├── course-details.html # Individual course detail page
│   ├── courses.html
│   ├── departments.html
│   ├── downloads.html
│   ├── news.html
│   ├── news-article.html
│   └── portals.html        # External portals listing page
├── server/
│   ├── db.js               # mysql2 pool + SSL config + custom execute() + getConnection export
│   ├── index.js            # Express entry point; mounts all routes, session config
│   ├── middleware/
│   │   ├── auth.js         # isAuthenticated, hasRole, withDepartment, innovation guards
│   │   └── requestLogger.js
│   ├── routes/
│   │   ├── admin.js        # Full CRUD for all content (admin role required)
│   │   ├── announcements.js
│   │   ├── applications.js # Public online application form + Cloudinary upload
│   │   ├── auth.js         # Login / logout / session check (/api/v1/auth/me)
│   │   ├── bom.js          # Board of Management members (public read)
│   │   ├── contact.js      # Contact form submissions
│   │   ├── content.js      # Editable page sections / principal message
│   │   ├── courses.js      # Courses with fees + intake dates (public)
│   │   ├── departments.js  # Departments with HOD info + courses (public)
│   │   ├── downloads.js    # Public downloadable documents
│   │   ├── innovation-auth.js
│   │   ├── innovation-categories.js
│   │   ├── innovation-events.js
│   │   ├── innovation-participants.js  # Includes bulk import with DB transaction
│   │   ├── innovation-scores.js
│   │   ├── management.js   # Read-only overview for principal/deputies
│   │   ├── materials.js    # Course materials upload/download (lecturer/student)
│   │   ├── news.js         # Published news articles (public)
│   │   ├── partners.js     # Partner logos (public)
│   │   ├── portals.js      # External portals list (public)
│   │   ├── slides.js       # Homepage hero slider (public)
│   │   ├── stats.js        # Public student/course/department counts
│   │   ├── timetable.js    # Class schedules per department/lecturer
│   │   └── users.js        # User listing + HOD student management
│   └── utils/
│       ├── cloudinary.js       # uploadFile / deleteFile / optimisedUrl helpers
│       ├── cloudinaryLogger.js # Dedicated logger for Cloudinary operations
│       ├── dbLogger.js         # Query logging wrapper (dev/DEBUG only)
│       └── logger.js           # Main structured logger (file + console, with rotation)
├── .env.example
├── .gitignore
└── package.json
```

> **`public/uploads/`** is served statically at `/uploads`. It exists for legacy compatibility. All new uploads go through Cloudinary; nothing in the current routes writes to disk.

---

## Environment Variables

Every variable the server code actually reads. Copy `.env.example` to `.env` and fill in the required values.

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Port to listen on. Default: `3000` |
| `NODE_ENV` | Yes | Set to `production` on live server, `development` locally |
| `SESSION_SECRET` | **Yes in prod** | Secret used to sign session cookies. Server refuses to start in production if unset. Generate with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `APP_ORIGINS` | Yes | Comma-separated CORS origins (no trailing slashes). E.g. `https://www.kigumotvc.ac.ke,https://assets.kigumotvc.ac.ke` |
| `RAILWAY_PUBLIC_DOMAIN` | No | Legacy Railway deployment variable. Leave commented out — remove when Railway is retired |
| `DB_HOST` | Yes | TiDB Cloud gateway hostname |
| `DB_PORT` | No | TiDB port. Default: `4000` |
| `DB_USER` | Yes | TiDB username |
| `DB_PASSWORD` | Yes | TiDB password |
| `DB_NAME` | No | Database name. Default: `kigumo_tvc` |
| `DB_SSL` | No | Set to `true` to enable SSL (required for TiDB Cloud). Default: off |
| `DB_SSL_CA_PATH` | No | Path to TiDB CA certificate `.pem` file on the server. Enables `rejectUnauthorized: true` |
| `DB_SSL_CA_BASE64` | No | Base64-encoded TiDB CA certificate (alternative to `DB_SSL_CA_PATH`) |
| `CLOUDINARY_CLOUD_NAME` | Yes | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `LOG_LEVEL` | No | `DEBUG` enables verbose query + request logging. Default: `INFO` in production, `DEBUG` in development |

---

## Database

TiDB Cloud Serverless (MySQL 8.0 compatible). The `database/` directory contains schema files — one `*-schema.sql` and one seed `*.sql` per table. The `database/migrations/` directory contains incremental migrations that must be applied to an already-initialised database.

**Initialising from scratch:**
1. Run `database/kigumo_tvc-schema-create.sql` to create the database.
2. Run each `*-schema.sql` file to create tables (order within this set does not matter; no foreign-key dependencies between schema files).
3. Run each seed `*.sql` file to insert reference data.
4. Apply all files in `database/migrations/` in numeric order (`001_`, `002_`, …).

The `sessions` table is created automatically by `express-mysql-session` on first startup.

**Key tables:**

| Group | Tables |
|---|---|
| Users & auth | `users`, `hod_assignments` |
| Academic | `departments`, `courses`, `fees`, `intake_dates`, `cohort_batches`, `timetable`, `materials`, `material_cohorts`, `intake_dates_global`, `intake_settings` |
| Content | `slider_slides`, `news_articles`, `bom_members`, `page_content`, `principal_message`, `partners`, `portals`, `downloads`, `download_categories` |
| Student data | `student_non_academic_memberships`, `gallery_albums`, `gallery_photos` |
| Operations | `announcements`, `applications`, `contact_enquiries`, `recycle_bin`, `sessions` |
| Innovation portal | `innovation_users`, `innovation_events`, `innovation_participants`, `innovation_skills_categories`, `innovation_scores` |

---

## Local Setup

```bash
# 1. Clone
git clone https://github.com/FranNMK/kigumo-TVC.git
cd kigumo-TVC

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env — fill in DB_HOST, DB_USER, DB_PASSWORD, Cloudinary credentials,
# SESSION_SECRET, and APP_ORIGINS

# 4. Start the development server
npm run dev
```

The server starts on `http://localhost:3000` by default.  
Public site: `http://localhost:3000`  
Staff portal: `http://localhost:3000/portal/login`  
Innovation portal: `http://localhost:3000/innovation`

> **No auto-reload:** `npm run dev` runs `node` directly (same as `npm start`). For auto-reload locally, run `npx nodemon server/index.js` instead.

---

## Deployment (cPanel)

This app is deployed on **cPanel shared hosting** using:

- **Node.js Selector** (Passenger) — sets the Node.js version, application root, and startup file (`server/index.js`). Passenger manages the process lifecycle.
- **cPanel Git Version Control** — pulls from the GitHub repository on demand. After each pull, restart the Node.js app in Node.js Selector for changes to take effect.
- **Environment variables** — set in the Node.js Selector interface or in a `.env` file in the application root (loaded by `dotenv` at startup).
- **Application root** — the repo root. `npm install` must be re-run after any `package.json` changes (use the "Run NPM Install" button in Node.js Selector).

`app.set('trust proxy', 1)` is configured in `server/index.js`, which is required for correct IP detection behind the cPanel reverse proxy.

---

## Known Limitations / Pending Items

| Item | Status | Notes |
|---|---|---|
| TiDB SSL certificate | ⚠️ Pending | Currently using `rejectUnauthorized: false` (encrypted but unauthenticated). Set `DB_SSL_CA_PATH` or `DB_SSL_CA_BASE64` in `.env` once the CA cert is downloaded from TiDB Cloud → Connect page |
| Railway CORS entry | ⚠️ Pending removal | `https://kigumo-tvc-production.up.railway.app` is hardcoded in the `railwayOrigins` array in `server/index.js`. Remove `RAILWAY_PUBLIC_DOMAIN` from `.env` and delete the `railwayOrigins` block when Railway is fully retired |
| Existing materials PDFs | ⚠️ Data migration needed | Files uploaded before migration `001` was applied were stored as Cloudinary `image` type. Their `download_url` will 404. Re-upload or run a Cloudinary `resource_type` migration for those files |
| Gallery tables | 🔧 Incomplete feature | `gallery_albums` and `gallery_photos` schema files exist and the tables appear in the recycle-bin restore allowlist and the DB warmup list, but **no API routes exist** for them (`server/routes/` has no gallery route file). The feature is not yet implemented |
| No automated tests | 🔧 Future | `npm test` exits with an error. No test suite exists |
