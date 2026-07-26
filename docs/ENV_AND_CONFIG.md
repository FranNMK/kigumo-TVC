# ENV_AND_CONFIG.md — Kigumo TVC

## Source of Truth

All `process.env.*` references were grepped across every `.js` file in the repo. The table below is the **complete** list of environment variables actually read by the code.

## Variable Reference

| Variable | Files that read it | Required | Default (in code) | Notes |
|---|---|---|---|---|
| `PORT` | `server/index.js:338` | No | `3000` | Passenger sets this; do not override unless you know what you're doing |
| `NODE_ENV` | `server/index.js`, `server/db.js`, `server/utils/logger.js`, `server/routes/auth.js` | Yes | `"development"` | Set to `production` on live server. Controls: session cookie `secure` flag, CORS dev origins, log verbosity, stack trace exposure |
| `SESSION_SECRET` | `server/index.js:83–88` | **Yes in production** | Dev fallback string (hard-coded) | Server calls `process.exit(1)` at startup if `NODE_ENV=production` and this is unset. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `APP_ORIGINS` | `server/index.js:28–29` | Yes in production | `[]` (empty) | Comma-separated allowed CORS origins, no trailing slashes. If unset in production, a WARN is logged but the server still starts. Railway and localhost origins are added separately |
| `RAILWAY_PUBLIC_DOMAIN` | `server/index.js:41` | No | `""` (ignored when unset) | Legacy. The string `"https://kigumo-tvc-production.up.railway.app"` is hardcoded in the `railwayOrigins` array regardless of this var. Remove when Railway is retired |
| `DB_HOST` | `server/db.js:13` | Yes | `"localhost"` | TiDB Cloud gateway hostname |
| `DB_PORT` | `server/db.js:17` | No | `4000` | TiDB default port |
| `DB_USER` | `server/db.js:14` | Yes | `"root"` | TiDB username |
| `DB_PASSWORD` | `server/db.js:15` | Yes | `""` | TiDB password |
| `DB_NAME` | `server/db.js:16` | No | `"kigumo_tvc"` | Database name |
| `DB_SSL` | `server/db.js:32` | No | SSL disabled | Set to `"true"` (string) to enable SSL. Required for TiDB Cloud |
| `DB_SSL_CA_PATH` | `server/db.js:36` | No | — | Path to CA `.pem` file. Enables `rejectUnauthorized: true` |
| `DB_SSL_CA_BASE64` | `server/db.js:51–53` | No | — | Base64-encoded CA cert. Alternative to `DB_SSL_CA_PATH`. If neither is set and `DB_SSL=true`, falls back to `rejectUnauthorized: false` |
| `CLOUDINARY_CLOUD_NAME` | `server/utils/cloudinary.js:8` | Yes | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | `server/utils/cloudinary.js:9` | Yes | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | `server/utils/cloudinary.js:10` | Yes | — | Cloudinary API secret |
| `LOG_LEVEL` | `server/utils/logger.js:23`, `server/db.js:146` | No | `"INFO"` in production, `"DEBUG"` in development | Values: `ERROR`, `WARN`, `INFO`, `DEBUG`. Setting `DEBUG` also enables DB query logging wrapper |

## Cross-check Against README Table

The README lists all 16 variables above. All are confirmed present in code. No variables found in code that are absent from the README. No variables listed in the README that are absent from the code.

**One nuance not in the README:** `RAILWAY_PUBLIC_DOMAIN` is described as contributing "nothing when the var is unset." This is accurate — but the string `"https://kigumo-tvc-production.up.railway.app"` is hardcoded in `server/index.js` line 40 and is always present in `allowedOrigins` even when the env var is not set. The Railway origin is always in the CORS allowlist. The README notes this as pending removal.

## `.env.example` vs Code

`.env.example` covers all variables. Default values in the example file match code defaults with one exception: `.env.example` sets `NODE_ENV=production` as the example value, while the code defaults to `"development"` when the var is unset. This is intentional (the example targets production) but could confuse a developer setting up locally who copies the file without reading it.
