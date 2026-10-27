/**
 * Standalone Environment Diagnostic & Validation Tool
 * 
 * Tests environment variable loading across potential cPanel paths (.env, env)
 * and validates database, session, and Cloudinary configuration formats.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('='.repeat(65));
console.log('       KIGUMO TVC - ENVIRONMENT CONFIGURATION AUDIT       ');
console.log('='.repeat(65));

// 1. Locate environment file
const candidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'env'),
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, 'env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../env')
];

let loadedPath = null;
for (const p of candidates) {
  if (fs.existsSync(p) && fs.statSync(p).isFile()) {
    const result = dotenv.config({ path: p });
    if (!result.error) {
      loadedPath = p;
      break;
    }
  }
}

if (!loadedPath) {
  console.log('\n❌ [CRITICAL] No valid .env or env file could be loaded!');
  console.log('   Checked candidates:');
  candidates.forEach(c => console.log(`    - ${c}`));
} else {
  console.log(`\n✅ Loaded environment file from: ${loadedPath}`);
}

// 2. Safe masker helper
function mask(val, showLen = 3) {
  if (!val) return '<NOT SET>';
  const str = String(val);
  if (str.length <= showLen * 2) return '***';
  return str.substring(0, showLen) + '...' + str.substring(str.length - showLen);
}

// 3. Define schema with validators
const checks = [
  {
    category: 'Application & Core',
    vars: [
      {
        name: 'NODE_ENV',
        required: false,
        default: 'development',
        validate: v => ['development', 'production', 'test'].includes(v) ? null : 'Must be development, production, or test'
      },
      {
        name: 'PORT',
        required: false,
        default: '3000',
        validate: v => /^\d+$/.test(v) && Number(v) > 0 && Number(v) <= 65535 ? null : 'Port must be a valid integer between 1 and 65535'
      },
      {
        name: 'SESSION_SECRET',
        required: true,
        sensitive: true,
        validate: v => {
          if (!v) return 'Missing SESSION_SECRET (Required in production)';
          if (v.length < 32) return 'Weak secret! Recommend at least 32 characters for security';
          return null;
        }
      },
      {
        name: 'APP_ORIGINS',
        required: false,
        validate: v => {
          if (!v) return null;
          const origins = v.split(',').map(s => s.trim());
          const invalid = origins.filter(o => !o.startsWith('http://') && !o.startsWith('https://'));
          return invalid.length > 0 ? `Invalid origin format: ${invalid.join(', ')}` : null;
        }
      }
    ]
  },
  {
    category: 'TiDB / MySQL Database',
    vars: [
      {
        name: 'DB_HOST',
        required: true,
        validate: v => {
          if (!v) return 'Missing DB_HOST (Required for TiDB)';
          if (v === 'localhost' || v === '127.0.0.1') return 'Using local host. For TiDB Cloud, expected gateway endpoint (*.tidbcloud.com)';
          return null;
        }
      },
      {
        name: 'DB_PORT',
        required: true,
        default: '4000',
        validate: v => /^\d+$/.test(v) && Number(v) === 4000 ? null : (Number(v) > 0 ? 'Note: TiDB default port is 4000' : 'Invalid port')
      },
      {
        name: 'DB_USER',
        required: true,
        validate: v => {
          if (!v) return 'Missing DB_USER';
          if (!v.includes('.')) return 'TiDB Cloud users usually follow the format <prefix>.<username>';
          return null;
        }
      },
      {
        name: 'DB_PASSWORD',
        required: true,
        sensitive: true,
        validate: v => (!v || v.trim() === '') ? 'Missing DB_PASSWORD' : null
      },
      {
        name: 'DB_NAME',
        required: true,
        validate: v => (!v || v.trim() === '') ? 'Missing DB_NAME' : null
      },
      {
        name: 'DB_SSL',
        required: true,
        default: 'true',
        validate: v => (v === 'true' || v === '1') ? null : 'TiDB Cloud requires TLS/SSL connection (DB_SSL=true)'
      },
      {
        name: 'DB_SSL_CA_PATH',
        required: false,
        validate: v => {
          if (!v) return null;
          return fs.existsSync(path.resolve(v)) ? null : `CA file path does not exist on this machine: ${v} (fallback to rejectUnauthorized: false if unset)`;
        }
      }
    ]
  },
  {
    category: 'Cloudinary Storage',
    vars: [
      {
        name: 'CLOUDINARY_CLOUD_NAME',
        required: true,
        validate: v => {
          if (!v || v.trim() === '') return 'Missing CLOUDINARY_CLOUD_NAME';
          if (!/^[a-zA-Z0-9_\-]+$/.test(v)) return 'Invalid cloud name format';
          return null;
        }
      },
      {
        name: 'CLOUDINARY_API_KEY',
        required: true,
        validate: v => {
          if (!v || v.trim() === '') return 'Missing CLOUDINARY_API_KEY';
          if (!/^\d+$/.test(v)) return 'Cloudinary API Key is expected to be a numeric string';
          return null;
        }
      },
      {
        name: 'CLOUDINARY_API_SECRET',
        required: true,
        sensitive: true,
        validate: v => {
          if (!v || v.trim() === '') return 'Missing CLOUDINARY_API_SECRET';
          if (v.length < 15) return 'API Secret appears too short';
          return null;
        }
      }
    ]
  }
];

// 4. Run verification
let totalErrors = 0;
let totalWarnings = 0;

checks.forEach(section => {
  console.log(`\n--- [${section.category}] ---`);
  section.vars.forEach(v => {
    const rawVal = process.env[v.name];
    const isSet = rawVal !== undefined && rawVal !== '';
    const displayVal = v.sensitive ? mask(rawVal) : (isSet ? rawVal : (v.default ? `${v.default} (default)` : '<UNSET>'));
    
    let status = 'PASS';
    let msg = '';
    
    if (!isSet && v.required) {
      status = 'FAIL';
      msg = 'REQUIRED variable is missing or empty!';
      totalErrors++;
    } else if (v.validate) {
      const err = v.validate(rawVal || v.default);
      if (err) {
        if (v.required && (!isSet || err.includes('Missing') || err.includes('Invalid'))) {
          status = 'FAIL';
          msg = err;
          totalErrors++;
        } else {
          status = 'WARN';
          msg = err;
          totalWarnings++;
        }
      }
    }

    const badge = status === 'PASS' ? '✅ PASS' : (status === 'WARN' ? '⚠️  WARN' : '❌ FAIL');
    console.log(`${badge} | ${v.name.padEnd(24)} = ${displayVal.padEnd(28)} ${msg ? `-> ${msg}` : ''}`);
  });
});

console.log('\n' + '='.repeat(65));
console.log(`SUMMARY: ${totalErrors === 0 ? 'PASSED' : 'FAILED'} (${totalErrors} Errors, ${totalWarnings} Warnings)`);
console.log('='.repeat(65));

if (totalErrors > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
