# TiDB Cloud Setup Guide for Kigumo TVC

## 📋 Overview

This guide explains how to configure TiDB Cloud (a fully-managed MySQL-compatible database) with the Kigumo TVC project. TiDB is wire-compatible with MySQL, so **no application code changes are needed** — only configuration updates.

---

## 🚀 Quick Start (5 Steps)

### Step 1: Get TiDB Cloud Credentials
1. Log in to [TiDB Cloud Console](https://tidbcloud.com)
2. Select your cluster and click **Connect**
3. Copy these values from the Connection dialog:
   - **Host** (e.g., `abc123.tidbcloud.com`)
   - **Port** (default: `4000`)
   - **Username**
   - **Password**
   - **Database name** (or create a new one)

### Step 2: Download CA Certificate
1. In the TiDB Cloud console, click the **CA Certificate** download link
2. Save the downloaded file as `tidb-ca.pem`
3. Place it in: `server/certs/tidb-ca.pem`

### Step 3: Update .env File
Edit the `.env` file at your project root:

```env
DB_HOST=abc123.tidbcloud.com
DB_PORT=4000
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=kigumo_tvc
DB_SSL=true
DB_SSL_CA_PATH=server/certs/tidb-ca.pem
```

### Step 4: Verify .gitignore
Ensure `.gitignore` contains (✅ already configured):
```
.env
server/certs/*.pem
```

### Step 5: Start the Application
```bash
npm install
npm start
```

You should see:
```
✅ SSL/TLS configured with CA certificate for TiDB Cloud
✅ Database connected successfully
```

---

## 🔧 Technical Implementation Details

### What Changed in the Code?

**File: `server/db.js`**
- Added `fs` and `path` modules for file operations
- Added SSL configuration logic that:
  - Reads the `DB_SSL` environment variable
  - If enabled, loads the CA certificate from disk
  - Configures the MySQL connection pool with SSL/TLS settings
  - Provides clear error messages if certificate is missing

**Important:** All other application code remains completely unchanged because TiDB is MySQL wire-compatible.

### How It Works

```javascript
if (process.env.DB_SSL === 'true') {
    // 1. Read the CA certificate from disk
    const caCert = fs.readFileSync(caPath, 'utf8');
    
    // 2. Configure SSL in the connection pool
    poolConfig.ssl = {
        ca: caCert,
        rejectUnauthorized: true  // Verify server certificate
    };
}
```

This ensures:
- ✅ Encrypted connections between your app and TiDB
- ✅ Certificate verification prevents man-in-the-middle attacks
- ✅ Meets enterprise security requirements

---

## 🔐 Security Best Practices

| Practice | Status | Details |
|----------|--------|---------|
| Never commit `.env` to git | ✅ | Already in `.gitignore` |
| Never commit `.pem` files | ✅ | Already in `.gitignore` |
| Use environment variables | ✅ | All secrets from `.env` |
| Enable SSL/TLS | ✅ | `DB_SSL=true` configured |
| Certificate verification | ✅ | `rejectUnauthorized=true` |
| Rotate credentials regularly | 📋 | Team responsibility |

---

## 🆘 Troubleshooting

### Error: "CA certificate not found at: server/certs/tidb-ca.pem"

**Cause:** The certificate file doesn't exist at the expected path.

**Solution:**
1. Verify the file exists: `ls server/certs/tidb-ca.pem`
2. If missing, download it again from TiDB Cloud Console
3. Ensure the path in `.env` matches: `DB_SSL_CA_PATH=server/certs/tidb-ca.pem`

### Error: "connect ECONNREFUSED 127.0.0.1:4000"

**Cause:** Trying to connect to localhost instead of TiDB Cloud.

**Solution:**
- Verify `DB_HOST` is your TiDB Cloud endpoint (NOT localhost)
- Example: `DB_HOST=abc123.tidbcloud.com`

### Error: "Access denied for user 'username'@'%'"

**Cause:** Incorrect credentials.

**Solution:**
1. Verify username and password in `.env` match TiDB Cloud console
2. Check that the database exists or create it
3. Ensure the user has permissions on the database

### Error: "Database connection failed"

**Solution:**
1. Check that TiDB cluster is running (TiDB Cloud console)
2. Verify firewall/network allows outbound connections on port 4000
3. Try connecting with MySQL client: `mysql -h <host> -u <user> -p -P 4000`

---

## 📚 Environment Variables Reference

```env
# Connection
DB_HOST=              # TiDB Cloud endpoint (required)
DB_PORT=4000          # TiDB default port (usually 4000)
DB_USER=              # Database username (required)
DB_PASSWORD=          # Database password (required)
DB_NAME=kigumo_tvc    # Database name (created or existing)

# SSL/TLS
DB_SSL=true           # Enable SSL (required for TiDB Cloud)
DB_SSL_CA_PATH=       # Path to CA certificate (required if DB_SSL=true)

# Application
NODE_ENV=development  # development | production
LOG_LEVEL=DEBUG       # DEBUG | INFO | WARN | ERROR
```

---

## 🔄 Migration from Local MySQL to TiDB Cloud

If you're migrating from a local MySQL database:

1. **Backup local data:**
   ```bash
   mysqldump -u root -p kigumo_tvc > backup.sql
   ```

2. **Restore to TiDB Cloud:**
   ```bash
   mysql -h <tidb-host> -u <user> -p -P 4000 kigumo_tvc < backup.sql
   ```

3. **Update `.env` with TiDB credentials**

4. **Test the connection:**
   ```bash
   npm start
   ```

---

## ✅ Verification Checklist

- [ ] `.env` file created with TiDB credentials
- [ ] `DB_SSL=true` in `.env`
- [ ] `DB_SSL_CA_PATH` points to valid certificate file
- [ ] CA certificate downloaded from TiDB Cloud Console
- [ ] Certificate placed at `server/certs/tidb-ca.pem`
- [ ] `.gitignore` contains `.env` and `*.pem` files
- [ ] Application starts without SSL errors
- [ ] Database connection logs show `✅ SSL/TLS configured`
- [ ] Database queries work correctly
- [ ] No hardcoded credentials in source code

---

## 📞 Support

For issues or questions:
1. Check the **Troubleshooting** section above
2. Review logs with `LOG_LEVEL=DEBUG`
3. Consult [TiDB Cloud Documentation](https://docs.pingcap.com/tidbcloud)
4. Contact your team's database administrator

---

## 🔗 Resources

- [TiDB Cloud Console](https://tidbcloud.com)
- [TiDB Documentation](https://docs.pingcap.com/tidbcloud)
- [MySQL2 Node.js Driver](https://github.com/sidorares/node-mysql2)
- [SSL/TLS Connection Strings](https://docs.pingcap.com/tidbcloud/connection-strings)
