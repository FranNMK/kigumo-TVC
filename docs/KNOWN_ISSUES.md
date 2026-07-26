# KNOWN_ISSUES.md — Kigumo TVC

Each item verified against actual code. File and line references are exact.

---

## 1. Cloudinary NPROC / 503 on cPanel

**Status: STILL BROKEN (no mitigation in code)**

Verified in `server/utils/cloudinary.js` lines 38–51: `cloudinary.uploader.upload()` is called with no timeout. Verified in `server/routes/admin.js` line 73–85: the `uploadToCloudinary()` helper wraps `uploadFile()` and re-throws but imposes no timeout. Verified in both `server/routes/admin.js` line 48 and `server/routes/materials.js` line 33: multer `fileSize` limit is 50 MB with no separate limit for image vs document uploads.

No `Promise.race`, no `AbortSignal`, no `timeout` option passed to the Cloudinary SDK anywhere in the codebase.

---

## 2. Cohort Assignment Saving

**Status: WORKS — no bug in current code**

Verified in `server/routes/admin.js`:
- `POST /admin/cohorts` (lines 1369–1388): correctly inserts into `cohort_batches`.
- `PATCH /admin/cohorts/:id/toggle` (lines 1390–1401): correctly toggles `is_active`.

Verified in `server/routes/materials.js`:
- `POST /materials/upload` (lines 119–197): reads `admission_prefixes` from request body, inserts one row per prefix into `material_cohorts`. Logic handles JSON array, comma-separated string, and plain array formats.

No evidence of a cohort-assignment-saving bug in the current code. If this was previously broken, it has been fixed.

---

## 3. Innovation Portal Bulk Import

**Status: IMPLEMENTED AND WORKING**

Verified in `server/routes/innovation-participants.js` lines 159–210:
- `POST /api/v1/innovation/participants/import` exists.
- Validates `participants` array with `express-validator`.
- Row-level validation with error collection (`validRows` / `errorRows`).
- Uses `db.getConnection()`, `beginTransaction()`, single bulk `INSERT ... VALUES (?,?,?,?),...`, `commit()`, and `rollback()` in the catch block.
- `connection.release()` in `finally`.
- Handles `ER_DUP_ENTRY` distinctly (409 response).

This is a complete, working implementation. The README description "Includes bulk import with DB transaction" is accurate.

---

## 4. Materials PDF resource_type Mismatch (pre-migration-001 files)

**Status: STILL A DATA PROBLEM — code now correct for new uploads, old data affected**

Verified: migration `001_add_materials_resource_type.sql` adds the `resource_type` column with `DEFAULT 'raw'`. The column exists in the live schema (`database/kigumo_tvc.materials-schema.sql` lines 13–14).

**Critical finding — materials are now stored on local disk, not Cloudinary:**
`server/routes/materials.js` `saveLocalFile()` (lines 63–69) writes files to `public/uploads/` and stores a path like `/uploads/filename.pdf` in `file_path`. The `public_id` and `resource_type` columns in `materials` are therefore null/unused for all materials uploaded via the current lecturer-upload route. The `resource_type` mismatch issue (image vs raw on Cloudinary) only applies to files that were uploaded via an earlier Cloudinary-based version of the materials route. Any such legacy rows with a Cloudinary URL in `file_path` will still 404 if `resource_type` is wrong. New uploads do not use Cloudinary at all.

To find affected rows:
```sql
SELECT id, title, file_path FROM materials WHERE file_path LIKE 'https://res.cloudinary.com%';
```

---

## 5. Gallery Feature (schema exists, no routes)

**Status: INCOMPLETE — tables exist in live DB, no API routes**

Verified: `database/updated/kigumo_tvc.gallery_albums-schema.sql` and `database/updated/kigumo_tvc.gallery_photos-schema.sql` are present in the live TiDB dump — the tables exist in production.

Verified: `server/db.js` warmup list (lines 132–133) includes `gallery_albums` and `gallery_photos` — warmup runs against these tables on every startup.

No file matching `gallery` exists in `server/routes/`. No gallery API endpoints exist anywhere in `server/index.js`. The feature has live DB tables but zero backend code.

---

## 6. TiDB SSL Certificate (`rejectUnauthorized: false`)

**Status: STILL PENDING**

Verified in `server/db.js` lines 62–65: when `DB_SSL=true` but neither `DB_SSL_CA_PATH` nor `DB_SSL_CA_BASE64` is set, the code falls back to `{ rejectUnauthorized: false }` with a WARN log: `"⚠️ No CA certificate available – SSL will be less secure"`.

Connection is encrypted but the server does not verify the TiDB Cloud certificate. Fix: download the CA `.pem` from TiDB Cloud → Connect page and set `DB_SSL_CA_PATH` or `DB_SSL_CA_BASE64`.

---

## 7. Railway CORS Entry Still Hardcoded

**Status: STILL PRESENT**

Verified in `server/index.js` lines 39–42:
```js
const railwayOrigins = [
  "https://kigumo-tvc-production.up.railway.app",
  process.env.RAILWAY_PUBLIC_DOMAIN || "",
].filter(Boolean);
```
The Railway URL is hardcoded regardless of whether `RAILWAY_PUBLIC_DOMAIN` is set. It is always included in `allowedOrigins`. Not a security issue (only affects which origins receive CORS headers), but it should be removed when Railway is decommissioned.

---

## 8. Downloads Route Uses Local Disk, Not Cloudinary

**Status: CONFIRMED — contradicts README**

Verified in `server/routes/admin.js` lines 1183–1210 (`POST /admin/downloads`) and lines 1213–1248 (`PUT /admin/downloads/:id`): both write the uploaded file to `public/uploads/` on disk using `fs.writeFileSync()`. The README states "nothing in the current routes writes to disk." This is incorrect.

---

## 9. No Automated Tests

**Status: CONFIRMED**

`package.json` scripts: `"test": "echo \"Error: no test specified\" && exit 1"`. No test files exist anywhere in the repo.

---

## 10. `admin.js` Applies `isAuthenticated` + `hasRole('admin')` at Router Level — Intake Dates Public Route Requires Workaround

**Status: BY DESIGN, but fragile**

Verified in `server/index.js` lines 151–163: `GET /api/v1/admin/intake-dates/public` is registered directly on `app` before `app.use('/api/v1/admin', require('./routes/admin'))` to bypass the admin router's auth middleware. This works correctly but means any future developer adding a public admin sub-route must remember to use the same pattern.

---

## 11. `innovation_projects` Table Exists in Live DB — No API Routes

**Status: INCOMPLETE — table exists, no backend code**

Verified in `database/updated/kigumo_tvc.innovation_projects-schema.sql`: the table exists in production with columns `event_id`, `participant_id`, `title`, `description`, `document_path`, `status` (`submitted`/`under_review`/`approved`/`rejected`). FKs to `innovation_events` and `innovation_participants` (both ON DELETE CASCADE).

No route file for projects exists in `server/routes/`. Not referenced in `server/index.js`. Not mentioned in the README. This was not in the original `database/` folder and only appeared in the live TiDB dump (`database/updated/`).

---

## 12. Innovation Tables Were Missing from `database/` — Now in `database/updated/`

**Status: RESOLVED**

The original `database/` folder had no schema files for any innovation tables. This has been resolved: all six innovation tables (`innovation_users`, `innovation_events`, `innovation_participants`, `innovation_skills_categories`, `innovation_scores`, `innovation_projects`) are now present in `database/updated/`. Use `database/updated/` for all fresh setup operations going forward.
