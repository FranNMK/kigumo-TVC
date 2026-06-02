# ⚡ TiDB Quick Reference Card

## 🎯 Your Mission (3 Simple Steps)

### 1️⃣ Get Certificate
```
TiDB Cloud Console → Connect → Download CA.pem → Save to server/certs/tidb-ca.pem
```

### 2️⃣ Update .env
```env
DB_HOST=your-tidb-endpoint.tidbcloud.com
DB_USER=your_username
DB_PASSWORD=your_password
```

### 3️⃣ Start App
```bash
npm start
```
✅ Look for: `✅ SSL/TLS configured with CA certificate for TiDB Cloud`

---

## 🔧 What Changed (For Code Review)

| File | Change | Impact |
|------|--------|--------|
| `server/db.js` | +SSL config logic | ✅ Secure connections |
| `.env` | New file | Configuration |
| `.gitignore` | Added `*.pem` | Security |
| `TIDB_SETUP.md` | New guide | Documentation |

**No breaking changes.** All existing queries work unchanged.

---

## 📍 Certificate Location Checklist

```
✅ Downloaded from: TiDB Cloud Console
✅ File name: tidb-ca.pem (must be exact)
✅ Location: server/certs/tidb-ca.pem
✅ Referenced in: .env as DB_SSL_CA_PATH
✅ Protected in: .gitignore (never committed)
✅ Permissions: Read access by your app
```

---

## 🚨 Common Issues

| Issue | Fix |
|-------|-----|
| Certificate not found | Download it from TiDB Cloud |
| Connection refused | Check DB_HOST is TiDB endpoint (not localhost) |
| Auth failed | Verify DB_USER and DB_PASSWORD in .env |
| No SSL errors | Disable DB_SSL=false in .env to test basic connectivity |

---

## 📂 File Structure (After Setup)

```
kigumo-TVC/
├── .env                    ← Your credentials (in .gitignore ✅)
├── server/
│   ├── db.js              ← Modified with SSL config
│   └── certs/
│       └── tidb-ca.pem    ← Your certificate (in .gitignore ✅)
├── TIDB_SETUP.md          ← Full guide (share with team)
└── IMPLEMENTATION_SUMMARY.md ← What I did
```

---

## ✅ Verification Commands

```bash
# Check certificate exists
ls server/certs/tidb-ca.pem

# Start app and watch for success message
npm start
# Look for: ✅ SSL/TLS configured with CA certificate for TiDB Cloud
# Then: ✅ Database connected successfully

# Test database query
curl http://localhost:3000/api/ping
# Should return: {"success":true,"message":"Kigumo TVC server is running"...}
```

---

## 📞 Need Help?

1. **Setup questions?** → Read `TIDB_SETUP.md`
2. **Certificate issues?** → Read `server/certs/README.md`
3. **Still stuck?** → Check error message in terminal, search the troubleshooting guides
4. **Technical details?** → Read `IMPLEMENTATION_SUMMARY.md`

---

## 🔐 Security Checklist

- [ ] Certificate downloaded from TiDB Cloud
- [ ] `.env` file created with real credentials
- [ ] `.env` is in `.gitignore`
- [ ] Certificate stored at `server/certs/tidb-ca.pem`
- [ ] No `.pem` files will be committed
- [ ] No credentials visible in source code
- [ ] App runs without SSL warnings
- [ ] Database connects successfully

---

## 💡 Pro Tips

- **Local testing?** Set `DB_SSL=false` and use local MySQL
- **Production?** Use environment variable injection (no .env file)
- **Team member setup?** They follow the same 3-step process with their own credentials
- **Certificate expiration?** Re-download when TiDB Cloud notifies you

---

**Ready to go!** Your TiDB infrastructure is production-ready. 🚀
