# SECURITY_NOTES.md — Kigumo TVC

Every item below is verified against a specific file and line. Nothing here is speculative.

---

## 1. Password Hashing

**Scheme:** `bcryptjs` with cost factor **12**.

Verified in `server/routes/admin.js` line 423 (`bcrypt.hash(phone, 12)`) and `server/routes/users.js` line 104 (`bcrypt.hash(phone, 12)`). Password comparison uses `bcrypt.compare()` in `server/routes/auth.js` line 154.

**Note:** The "password" for all users is their phone number. This is a design decision, not a code defect — it is explicitly documented in the auth route comments. It means the effective entropy of passwords is limited to Kenyan phone number formats. Administrators should be aware of this when training staff.

Innovation portal uses the same scheme: `bcrypt.compare()` in `server/routes/innovation-auth.js` line 33, column name `password_hash`.

---

## 2. Session Cookie Configuration

Verified in `server/index.js` lines 115–121:

| Setting | Value | Notes |
|---|---|---|
| `httpOnly` | `true` | Client-side JS cannot read the cookie |
| `secure` | `true` when `NODE_ENV=production` | Cookie only sent over HTTPS in production |
| `sameSite` | `"lax"` in production, `"strict"` in development | Mitigates CSRF |
| `maxAge` | `30 * 60 * 1000` (30 minutes) | Session store expiry also set to 30 min |

The session secret is checked at startup (`server/index.js` lines 83–86): if `NODE_ENV=production` and `SESSION_SECRET` is unset, the server calls `process.exit(1)`. A hard-coded fallback dev secret exists for non-production use only.

The session store expiry check runs every 15 minutes (`checkExpirationInterval: 15 * 60 * 1000`).

**Innovation portal logout note:** `POST /innovation/auth/logout` deletes only `req.session.innovationUser` — it does not call `session.destroy()`. This is intentional (see `server/routes/innovation-auth.js` lines 64–73 comments) so a user logged into both portals simultaneously can log out of one without ending the other. The side effect is that expired innovation sessions must rely on the 30-minute session cookie maxAge, not an explicit destroy call.

---

## 3. TiDB SSL — `rejectUnauthorized: false` Fallback

Verified in `server/db.js` lines 62–65:

```js
if (!sslConfig) {
  logger.warn('⚠️ No CA certificate available – SSL will be less secure');
  sslConfig = { rejectUnauthorized: false };
}
```

When `DB_SSL=true` but neither `DB_SSL_CA_PATH` nor `DB_SSL_CA_BASE64` is set, the server connects to TiDB Cloud with encryption but without certificate verification. A MITM attacker on the network between the server and TiDB Cloud could intercept the connection. Fix: download the CA `.pem` from TiDB Cloud → Connect page and set one of the two env vars.

---

## 4. Rate Limiting Scope

`express-rate-limit` is imported and applied in **one place only**: `server/routes/auth.js` lines 16 and 66. The limiter is:
- **5 attempts per 15-minute window per IP**
- Applied only to `POST /api/v1/auth/login`

No rate limiting exists on any other endpoint — including:
- `POST /api/v1/applications` (public file upload)
- `POST /api/v1/contact` (public form submission)
- `POST /api/v1/innovation/auth/login`
- Any admin write endpoint

The innovation login (`server/routes/innovation-auth.js`) has no rate limiter.

---

## 5. CORS Configuration

Verified in `server/index.js` lines 28–60:

- Allowed origins are built from three sources: `APP_ORIGINS` env var (intended production domains), `localhost:3000` and `localhost:8080` when `NODE_ENV !== "production"`, and a hardcoded Railway URL (`https://kigumo-tvc-production.up.railway.app`) that is always present regardless of env vars.
- `credentials: true` is set, which is required for session cookies to work cross-origin.
- If `APP_ORIGINS` is unset in production, a WARN is logged but the server still starts — at which point only the Railway URL and `localhost` origins are in the allowlist, which would break the production domain.
- `OPTIONS` preflight is handled by the `cors()` middleware.

---

## 6. Input Validation Coverage

`express-validator` is used **only in the innovation portal routes**. Verified by grepping all route files:

| File | Validation |
|---|---|
| `innovation-auth.js` | `body('email').isEmail()`, `body('password').notEmpty()` |
| `innovation-events.js` | `body('name').notEmpty()`, `body('event_type').isIn(...)`, date fields `.isISO8601()` |
| `innovation-participants.js` | `body('event_id').isInt()`, `body('admission_number').notEmpty()`, etc. |
| `innovation-scores.js` | `body('score').isFloat({ min: 0, max: 100 })` |
| `innovation-categories.js` | `body('department_id').isInt()`, `body('name').notEmpty()` |

**All main portal routes** (`admin.js`, `materials.js`, `users.js`, `announcements.js`, `applications.js`, etc.) use **manual presence checks only** — e.g. `if (!title || !body)` — with no schema validation library. This means:

- Type coercion is not enforced. Integer fields accept any string that MySQL will coerce (or reject at DB level).
- String length is not checked in code; MySQL column lengths are the only constraint (e.g. `full_name VARCHAR(100)`).
- `applications.js` (lines 73–97) is the most thorough manual validation: it checks for required fields, validates email format with `includes('@')` (not RFC-compliant), and checks phone number format with a regex.
- `server/routes/users.js` line 84 validates `reg_number` format with a regex before inserting.

No XSS sanitisation is applied in any route. Stored content is rendered by the frontend — whether the frontend escapes it is not verifiable from the server-side code alone.

---

## 7. File Upload Security

Verified in `server/routes/admin.js` lines 29–70 and `server/routes/materials.js` lines 16–53:

- Both multer instances use `memoryStorage()` — files are never written to a temp directory during upload.
- File extension is checked against an allowlist (`ALLOWED_EXTENSIONS`).
- MIME type is checked against a category prefix (e.g. `image/`, `application/`) but the check intentionally accepts empty MIME and `application/octet-stream` to handle inconsistent browser behaviour.
- Maximum file size: **50 MB** for admin and materials routes; **5 MB** for `applications.js`.
- There is no server-side content inspection (magic byte check). The extension + loose MIME check is the only guard.
- Files uploaded via admin downloads and materials routes are stored in `public/uploads/` with a `Date.now()` prefix. This directory is served publicly at `/uploads/` — anyone who knows or can guess the filename can download it without authentication.

---

## 8. `GET /api/v1/users` — Public User Listing

Verified in `server/routes/users.js` lines 10–27: this endpoint requires no authentication and returns all active users filtered by role if requested. The response includes `id, full_name, email, reg_number, role, primary_department_id, photo_path, bio`. This is intentional (the about page and departments page use it to display HOD profiles), but it means all staff names, emails, and registration numbers are publicly enumerable.

---

## 9. Admin Password Reset Has No Current-Password Check

Verified in `server/routes/admin.js` lines 700–719: `PATCH /admin/users/:id/password` accepts `{ new_password }` and updates the hash with no requirement to supply the existing password. Any admin can reset any user's password, including other admin accounts, with no confirmation step.

---

## 10. No CSRF Token Protection

The session cookie uses `sameSite: "lax"` in production. `lax` allows the cookie to be sent with top-level navigations (e.g. form POSTs from another origin in some browser/scenario combinations). There are no CSRF tokens on any form or API endpoint. The practical risk is mitigated by the API being JSON-only (non-simple content types) and CORS `credentials: true` requiring an explicit allowlist, but it is not formally protected.
