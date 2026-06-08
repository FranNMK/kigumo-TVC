/**
 * Cloudinary Operations Logger
 * Writes to both console and logs/cloudinary.log
 */
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'cloudinary.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function getTimestamp() {
  return new Date().toISOString();
}

function log(level, message, meta = {}) {
  const timestamp = getTimestamp();
  const logLine = `[${timestamp}] [${level}] ${message} ${JSON.stringify(meta)}`;

  // Console output
  switch (level) {
    case 'ERROR': console.error(logLine); break;
    case 'WARN': console.warn(logLine); break;
    default: console.log(logLine);
  }

  // File output
  try {
    fs.appendFileSync(LOG_FILE, logLine + '\n');
  } catch (err) {
    console.error(`[CloudinaryLogger] Failed to write to file: ${err.message}`);
  }
}

module.exports = {
  debug: (msg, meta) => log('DEBUG', msg, meta),
  info: (msg, meta) => log('INFO', msg, meta),
  warn: (msg, meta) => log('WARN', msg, meta),
  error: (msg, meta) => log('ERROR', msg, meta),
};