# DEPLOYMENT_RUNBOOK.md — Kigumo TVC

## Prerequisites

- cPanel account at Webcom Kenya hosting
- GitHub access to `https://github.com/FranNMK/kigumo-TVC`
- Node.js Selector configured in cPanel pointing to `server/index.js`

---

## Standard Deploy (code push → live)

1. **Push to GitHub**
   ```
   git push origin main
   ```

2. **Log in to cPanel** → *Git™ Version Control* → find the `kigumo-TVC` repository → click **Manage** → **Pull or Deploy** → **Update from Remote**.

3. **If `package.json` changed** (new or removed dependency):
   - Go to *Setup Node.js App* → find the app → click **Run NPM Install**.
   - This must complete without errors before restarting.

4. **Restart the Node.js app**:
   - *Setup Node.js App* → find the app → click the **Restart** button (circular arrow icon).
   - Passenger sends SIGTERM to the old worker and starts a new one.

5. **Verify**: visit `https://kigumotvc.ac.ke/api/ping` — should return `{"success":true,...}`. Check `logs/app.log` or `logs/error.log` for startup errors.

> **No auto-reload on file change.** Passenger only restarts when you click Restart, or when the `tmp/restart.txt` file is touched.

---

## Environment Variable Changes

Environment variables are set in cPanel *Setup Node.js App* → **Environment Variables** panel.
Alternatively, edit the `.env` file in the application root.

After any `.env` change: **restart the app** (Step 4 above). The app reads `.env` once at startup via `dotenv`.

---

## Rollback

1. In cPanel Git Version Control, the previous commit hash is visible.
2. SSH into the hosting account and run:
   ```
   cd ~/path/to/kigumo-TVC
   git checkout <previous-commit-hash>
   ```
3. Restart the app via Node.js Selector.

---

## Troubleshooting

### 503 / NPROC Limit (cPanel "Entry Process" exhaustion)

**Symptom:** Site returns HTTP 503. cPanel error logs contain entries like:
```
cagefs_enter: too many entry processes
```

**What this means:** Webcom Kenya's shared hosting plan limits concurrent entry processes (NPROC). The Cloudinary upload calls — which spawn a new OS process or thread internally via the Cloudinary Node SDK — push the per-account process count over the limit. Webcom Kenya confirmed 842 limit-hit events in a 24-hour window.

**Immediate check:**
1. cPanel → *Resource Usage* (may be labelled "CPU and Concurrent Connection Usage" or similar).
2. Look at the **Entry Processes** row. If it shows the limit repeatedly being hit (graph pinned at ceiling), this is the cause.

**Immediate fix (restore service):**
1. cPanel → *Setup Node.js App* → **Stop** the app.
2. Wait 30–60 seconds for all lingering processes to clear.
3. **Start** the app again.
4. If Restart itself fails (the restart button triggers a new entry process that immediately hits the limit): use **Stop** then **Start** as separate actions, not Restart. If even Stop/Start is unavailable, contact Webcom Kenya support to kill the stuck processes from their side.

**Root cause in code (verified):**
- `server/utils/cloudinary.js` `uploadFile()` calls `cloudinary.uploader.upload()` with no explicit timeout. If Cloudinary is slow or the cPanel outbound connection stalls, the Node process holds an open connection and Passenger may spawn an additional worker for the next request — compounding entry-process usage.
- `server/routes/admin.js` `uploadToCloudinary()` (line 73–85) wraps `uploadFile()` and re-throws on error, but does not impose a timeout. Upload calls that block will hold a worker until Cloudinary or the OS cleans up.
- Both `server/routes/admin.js` and `server/routes/materials.js` set `multer` `fileSize` limit to **50 MB**. A 50 MB upload buffered in memory and then forwarded to Cloudinary is a long-lived request.

**Mitigation (not yet implemented — for the next maintainer):**
- Wrap `cloudinary.uploader.upload()` in a `Promise.race` with a timeout (e.g., 30 s).
- Reduce multer `fileSize` limit for admin routes to something realistic (e.g., 10 MB for images, separate limit for documents).
- Consider moving Cloudinary uploads to a background worker (out of scope for current architecture).

**Webcom Kenya plan limits (as confirmed by support):**
- Entry Processes: 100 concurrent
- COULD NOT VERIFY exact plan tier name or whether upgrading to a higher-tier plan increases this limit — needs confirmation from Frank.

### App Starts But DB Connection Fails

Symptom: `GET /api/ping` returns 200 but all data endpoints return 500.
Check `logs/error.log` for `Database connection failed` entries.
Causes: TiDB Cloud serverless instance sleeping (auto-wakes on next query — wait and retry), wrong `DB_HOST`/`DB_PASSWORD`, or SSL config mismatch.

### Sessions Lost After Restart

Expected behaviour: Passenger restarts create a new worker process. The session store is in TiDB (`sessions` table), so sessions survive restarts. If sessions are being lost, check that the `sessions` table exists in TiDB and that `DB_*` vars are correctly set.

### Logs Location

| File | Content |
|---|---|
| `logs/app.log` | INFO-level request log + startup messages (production: console only, not file) |
| `logs/error.log` | All ERROR-level events |
| `logs/warn.log` | All WARN-level events |

Note: in production (`NODE_ENV=production`), only ERROR and WARN are written to file. INFO and DEBUG go to console (Passenger stdout), which is accessible in cPanel *Logs* → *Error Log* or via SSH.
