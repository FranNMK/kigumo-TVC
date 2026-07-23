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
| Auth | `bcryptjs` (cost factor 12), session cookies |
| Upload handling | `multer` (memory storage — no disk writes) |
| Rate limiting | `express-rate-limit` (login endpoint) |
| Logging | Custom structured logger (`server/utils/logger.js`) writing to `logs/` |
| Input validation | `express-validator` (innovation portal routes) |

---

## Project Structure

```
kigumo-TVC/
├── database/               # Schema & seed SQL files (one file per table)
├── logs/                   # Runtime log files (gitignored)
├── portal/                 # Authenticated portal HTML pages
│   ├── login.html
│   ├── student-dashboard.html
│   ├── lecturer-dashboard.html
│   ├── management-dashboard.html
│   └── admin/
│       └── dashboard.html
├── public/                 # Public-facing website
│   ├── assets/             # Shared CSS, JS, images
│   ├── innovation/         # Innovation portal front-end
│   │   ├── admin/          # Innovation admin dashboard
│   │   └── coordinator/    # Coordinator scoring dashboard
│   ├── index.html          # Homepage
│   ├── about.html
│   ├── courses.html
│   ├── admissions.html
│   ├── apply.html          # Online application form
│   ├── departments.html
│   ├── news.html / news-article.html
│   ├── downloads.html
│   ├── contact.html
│   └── portals.html        # External portals listing page
├── server/
│   ├── db.js               # mysql2 connection pool + SSL config + getConnection export
│   ├── index.js            # Express entry point; mounts all routes
│   ├── middleware/
│   │   ├── auth.js         # isAuthenticated, hasRole, innovation guards
│   │   └── requestLogger.js
│   ├── routes/
│   │   ├── admin.js        # Full CRUD for all content (admin role required)
│   │   ├── announcements.js
│   │   ├── applications.js # Public online application form + Cloudinary upload
│   │   ├── auth.js         # Login / logout / session check
│   │   ├── bom.js          # Board of Management members (public read)
│   │   ├── contact.js      # Contact form submissions
│   │   ├── content.js      # Editable page sections / principal message
│   │   ├── courses.js      # Courses with fees + intake dates (public)
│   │   ├── departments.js  # Departments with HOD info + courses (public)
│   │   ├── downloads.js    # Public downloadable documents
│   │   ├── innovation-auth.js
│   │   ├── innovation-categories.js
│   │   ├── innovation-events.js
│   │   ├── innovation-participants.js  # Includes bulk import with transaction
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
├── package.json
└── requirements.md         # Older requirements doc (partially outdated — see this README)
```

---

## Environment Variables

Every variable the server code actually reads. Set these in `.env` (copy from `.env.example`).

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

> **Variables in code but not in `.env.example`:** `LOG_LEVEL` is referenced in `logger.js` and `db.js` but not documented in `.env.example`. Add it if you want to control it from the environment.
>
> **Variables in `package.json`/`requirements.md` but unused in server code:** `i18next` and `uuid` are listed as dependencies but are not imported anywhere in `server/`. They can be removed (see Part 2 of this document for details).

---

## Database

TiDB Cloud Serverless (MySQL 8.0 compatible). Schema files are in `database/` — one `*-schema.sql` + one seed `*.sql` per table. To initialise a fresh database, run each schema file in order through the TiDB Cloud SQL console or a MySQL client.

Key tables: `users`, `departments`, `courses`, `fees`, `intake_dates`, `materials`, `material_cohorts`, `downloads`, `announcements`, `timetable`, `news_articles`, `bom_members`, `slider_slides`, `partners`, `principal_message`, `page_content`, `portals`, `recycle_bin`, `applications`, `sessions` (auto-created by `express-mysql-session` on first run).

Innovation portal tables: `innovation_users`, `innovation_events`, `innovation_participants`, `innovation_skills_categories`, `innovation_scores`.

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

> **Note:** There is no `nodemon` in the current `package.json`. `npm run dev` runs `node` directly. For auto-reload locally, run `npx nodemon server/index.js` instead.

---

## Deployment (cPanel)

This app is deployed on **cPanel shared hosting** using:

- **Node.js Selector** (Passenger) — sets the Node.js version, application root, and startup file (`server/index.js`). Passenger manages the process lifecycle.
- **cPanel Git Version Control** — pulls from the GitHub repository on demand. After each pull, restart the Node.js app in Node.js Selector for changes to take effect.
- **Environment variables** — set in the Node.js Selector interface or in a `.env` file in the application root (loaded by `dotenv` at startup).
- **Application root** — the repo root. `npm install` must be re-run after any `package.json` changes (use the "Run NPM Install" button in Node.js Selector).

Passenger spawns the process with `app set('trust proxy', 1)` already configured, which is required for correct IP detection behind the cPanel reverse proxy.

---

## Known Limitations / Pending Items

| Item | Status | Notes |
|---|---|---|
| TiDB SSL certificate | ⚠️ Pending | Currently using `rejectUnauthorized: false` (encrypted but unauthenticated). Set `DB_SSL_CA_PATH` or `DB_SSL_CA_BASE64` in `.env` once the CA cert is downloaded from TiDB Cloud → Connect page |
| Railway CORS entry | ⚠️ Pending removal | `https://kigumo-tvc-production.up.railway.app` is still in the CORS allowlist. Remove `RAILWAY_PUBLIC_DOMAIN` from `.env` and delete the `railwayOrigins` block in `index.js` when Railway is fully retired |
| Existing materials PDFs | ⚠️ Data migration needed | Files uploaded before the Tier 1 fix were stored as Cloudinary `image` type. Their `download_url` (from `GET /api/v1/materials/my`) will 404. Re-upload or run a Cloudinary resource_type migration for those files |
| `i18next` / `uuid` dependencies | 🔧 Cleanup | Listed in `package.json` but not used anywhere in server code. Safe to remove with `npm uninstall i18next uuid` |
| `requirements.md` | 📄 Outdated | Contains old package versions and references a non-existent `schema.sql`/`seed.sql`. This README supersedes it |
| No automated tests | 🔧 Future | `npm test` currently exits with an error. No test suite exists |
