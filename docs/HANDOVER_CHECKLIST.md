# HANDOVER_CHECKLIST.md — Kigumo TVC

## Access & Credentials

- [ ] cPanel login (Webcom Kenya) — username, password, control panel URL
- [ ] cPanel hosting account email address (for Webcom Kenya support tickets)
- [ ] GitHub account access — `https://github.com/FranNMK/kigumo-TVC` (repo owner: FranNMK)
- [ ] GitHub deploy key or personal access token configured in cPanel Git Version Control
- [ ] TiDB Cloud account — `DB_HOST`, `DB_USER`, `DB_PASSWORD` (production values)
- [ ] TiDB Cloud CA certificate `.pem` file (for `DB_SSL_CA_PATH` or `DB_SSL_CA_BASE64`)
- [ ] Cloudinary account — `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- [ ] Production `SESSION_SECRET` value (currently set in cPanel Node.js Selector env vars)
- [ ] Production `APP_ORIGINS` value (e.g. `https://www.kigumotvc.ac.ke,...`)
- [ ] Domain registrar access for `kigumotvc.ac.ke`
- [ ] Innovation portal admin credentials (separate from main portal — stored in `innovation_users` table)

## Server

- [ ] cPanel Node.js Selector: Node.js version, application root path, startup file (`server/index.js`)
- [ ] Location of `.env` file on the server (or confirm env vars are set in Node.js Selector UI only)
- [ ] SSH access details (if available for the hosting account)
- [ ] Location of logs directory on server (`<app_root>/logs/`)

## Database

- [ ] TiDB Cloud cluster name and region
- [ ] TiDB Cloud project access (invite new maintainer or transfer ownership)
- [ ] Confirm migrations 001 and 002 have been applied to live DB
- [ ] Confirm innovation portal tables exist in live DB (schemas not in `database/` folder — source unknown)

## Pending Actions at Handover

- [ ] Remove Railway CORS entry from `server/index.js` when Railway is decommissioned
- [ ] Set `DB_SSL_CA_PATH` or `DB_SSL_CA_BASE64` to enable full TLS verification
- [ ] Address NPROC/503 issue (Cloudinary upload timeout — see KNOWN_ISSUES.md #1)
