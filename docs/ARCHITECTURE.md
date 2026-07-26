# ARCHITECTURE.md — Kigumo TVC

## Runtime & Framework

| Component | Value | Source |
|---|---|---|
| Runtime | Node.js (version selected via cPanel Node.js Selector) | `package.json` |
| Framework | Express v5 (`^5.2.1`) | `package.json` |
| Entry point | `server/index.js` | cPanel Passenger config |
| Module system | CommonJS (`"type": "commonjs"`) | `package.json` |

## Process Model

Passenger (cPanel Node.js Selector) manages the process. `app.listen()` is called in `server/index.js` on `process.env.PORT || 3000`. `app.set('trust proxy', 1)` is set, required for correct IP detection behind the Passenger reverse proxy.

A 24-hour `setInterval` in `server/index.js` cleans expired recycle-bin rows. This runs inside the single Passenger worker process — it resets on every restart.

## Folder Structure (verified against disk)

```
kigumo-TVC/
├── database/
│   ├── updated/            # Live TiDB dump — authoritative source for all schema/seed SQL
│   │   ├── kigumo_tvc-schema-create.sql
│   │   ├── kigumo_tvc.<table>-schema.sql   # one per table (31 tables total)
│   │   ├── kigumo_tvc.<table>.0000000010000.sql  # seed data per table
│   │   └── test-schema-create.sql
│   └── migrations/         # Historical migrations; already applied in updated/ dump
│       ├── 001_add_materials_resource_type.sql
│       └── 002_create_intake_dates_global.sql
├── docs/                   # Handover documentation (ARCHITECTURE, DATABASE, etc.)
├── logs/                   # Runtime logs; auto-created by logger.js on startup
├── portal/                 # Authenticated portal HTML pages
│   ├── login.html
│   ├── student-dashboard.html
│   ├── lecturer-dashboard.html
│   ├── management-dashboard.html
│   └── admin/
│       └── dashboard.html
├── public/                 # Public-facing static files (served at /)
│   ├── assets/             # Shared CSS, JS, images
│   ├── uploads/            # Local file storage (downloads + materials)
│   ├── innovation/
│   │   ├── admin/          # Innovation admin dashboard
│   │   ├── coordinator/    # Coordinator scoring dashboard
│   │   ├── assets/
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── about.html
│   │   └── results.html
│   ├── index.html
│   ├── about.html
│   ├── admissions.html
│   ├── apply.html
│   ├── contact.html
│   ├── course-details.html
│   ├── courses.html
│   ├── departments.html
│   ├── downloads.html
│   ├── news.html
│   ├── news-article.html
│   └── portals.html
├── server/
│   ├── db.js
│   ├── index.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── requestLogger.js
│   ├── routes/             # 27 route files (see table below)
│   └── utils/
│       ├── cloudinary.js
│       ├── cloudinaryLogger.js
│       ├── dbLogger.js
│       └── logger.js
├── .env.example
├── .gitignore
└── package.json
```

**Discrepancy from README:** The README project structure lists `public/uploads/` as "legacy local upload directory" and states "nothing in the current routes writes to disk." **This is incorrect.** Both `server/routes/materials.js` (lines 63–69, `saveLocalFile()`) and `server/routes/admin.js` (lines 1193–1198 downloads POST, lines 1228–1233 downloads PUT) write files to `public/uploads/` on disk. Downloads and course materials currently use local disk storage, not Cloudinary.

## Static File Serving (from `server/index.js`)

| Mount path | Source directory |
|---|---|
| `/` | `public/` |
| `/public` | `public/` (duplicate mount) |
| `/uploads` | `public/uploads/` |
| `/portal` | `portal/` |
| `/innovation` | `public/innovation/` |

## API Routes (all prefixed `/api/v1/`)

| Prefix | File | Auth |
|---|---|---|
| `/auth` | `routes/auth.js` | Public (login); session check |
| `/courses` | `routes/courses.js` | Public |
| `/timetable` | `routes/timetable.js` | Authenticated |
| `/materials` | `routes/materials.js` | Authenticated (lecturer/hod/student) |
| `/departments` | `routes/departments.js` | Public |
| `/bom` | `routes/bom.js` | Public |
| `/content` | `routes/content.js` | Public read |
| `/news` | `routes/news.js` | Public |
| `/users` | `routes/users.js` | Authenticated |
| `/contact` | `routes/contact.js` | Public |
| `/downloads` | `routes/downloads.js` | Public |
| `/announcements` | `routes/announcements.js` | Authenticated |
| `/management` | `routes/management.js` | Authenticated (management roles) |
| `/admin` | `routes/admin.js` | `isAuthenticated` + `hasRole('admin')` on router |
| `/stats` | `routes/stats.js` | Public |
| `/slides` | `routes/slides.js` | Public |
| `/partners` | `routes/partners.js` | Public |
| `/applications` | `routes/applications.js` | Public (submission) |
| `/portals` | `routes/portals.js` | Public |
| `/innovation/auth` | `routes/innovation-auth.js` | Innovation session |
| `/innovation/events` | `routes/innovation-events.js` | Innovation session |
| `/innovation/participants` | `routes/innovation-participants.js` | Innovation session (admin for write) |
| `/innovation/categories` | `routes/innovation-categories.js` | Innovation session |
| `/innovation/scores` | `routes/innovation-scores.js` | Innovation session |

**Special case:** `GET /api/v1/admin/intake-dates/public` is registered directly on `app` in `server/index.js` (line 151) *before* the admin router, because the admin router applies `isAuthenticated` globally and would block this public endpoint.

## Authentication

Two independent session namespaces coexist on the same express-session store:

- **Main portal:** `req.session.user` — set on login via `POST /api/v1/auth/login`
- **Innovation portal:** `req.session.innovationUser` — set on login via innovation-auth route

Middleware: `isAuthenticated`, `hasRole(...roles)`, `withDepartment`, `isHodOfDepartment` in `server/middleware/auth.js`. Innovation guards: `isInnovationAuthenticated`, `isInnovationAdmin`, `isInnovationCoordinator`.

Rate limiting: login endpoint only — 5 attempts per 15 minutes per IP (`routes/auth.js` lines 28–39).

## Session Storage

`express-mysql-session` using the same `mysql2` pool from `db.js`. Sessions stored in a `sessions` table (auto-created). Session expiry: 30 minutes (`maxAge: 30 * 60 * 1000`). Store expiration check interval: 15 minutes.

## File Storage

Two distinct patterns currently in use (contradicting the README's claim of Cloudinary-only):

| Route | Storage | Notes |
|---|---|---|
| Admin: news, slides, partners, BOM, users photos, departments | **Cloudinary** | via `uploadToCloudinary()` in `admin.js` |
| Admin: downloads | **Local disk** (`public/uploads/`) | `admin.js` lines 1193–1233 |
| Materials (lecturer upload) | **Local disk** (`public/uploads/`) | `materials.js` `saveLocalFile()` |
| Applications (KCSE cert, ID, photo) | **Cloudinary** | `applications.js` |

`server/utils/cloudinary.js` uses `resource_type: 'auto'` by default. The `uploadFile()` helper has no timeout configured beyond what the Cloudinary SDK default provides.

## Database

TiDB Cloud Serverless (MySQL 8.0 protocol). Connection pool configured in `db.js`: `connectionLimit: 10`, `queryTimeout: 30000ms`, `connectTimeout: 15000ms`, `idleTimeout: 30000ms`. A warm-up routine fires on startup, querying `COUNT(*)` from every known table including `gallery_albums` and `gallery_photos` (which have no API routes).

## Logging

Custom logger at `server/utils/logger.js`. Log files: `logs/app.log`, `logs/error.log`, `logs/warn.log`. Rotation at 10 MB, 5 backups. In production, only ERROR and WARN are written to file; INFO/DEBUG go to console only.

## Health Check

`GET /api/ping` — returns `{ success: true, timestamp, environment }`. No authentication required.

## Database Schema Source

Use `database/updated/` for all setup and reference — this is the live TiDB dump. The files in `database/` (root, without the `updated/` subfolder) are an earlier snapshot and are missing the six innovation tables and the `sessions` table. See `docs/DATABASE.md` for the full table reference.
