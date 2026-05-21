/**
 * Centralized Logging Utility for Kigumo TVC
 *
 * Provides structured logging with log levels, timestamps,
 * and multiple output destinations (console + file).
 *
 * Log Levels (from most to least severe):
 *   ERROR (0) - Critical errors requiring immediate attention
 *   WARN  (1) - Warning conditions that should be investigated
 *   INFO  (2) - General operational information
 *   DEBUG (3) - Detailed debugging information (development only)
 *
 * @module utils/logger
 */

const fs = require("fs");
const path = require("path");

// ── Configuration ──────────────────────────────────────────

// Determine log level from environment, default to INFO in production, DEBUG in development
const LOG_LEVEL =
  process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === "production" ? "INFO" : "DEBUG");

// Log directory path
const LOG_DIR = path.join(__dirname, "../../logs");

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Maximum log file size in bytes (10MB)
const MAX_LOG_SIZE = 10 * 1024 * 1024;

// Number of backup log files to keep
const MAX_BACKUP_FILES = 5;

// ── Log Level Hierarchy ────────────────────────────────────

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

// Current log level threshold (logs below this level are suppressed)
const currentLogLevel = LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.INFO;

// ── ANSI Color Codes (for console output) ──────────────────

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
  white: "\x1b[37m",
};

/**
 * Formats a timestamp for log entries.
 * Format: YYYY-MM-DD HH:MM:SS.mmm
 *
 * @returns {string} Formatted timestamp
 */
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const ms = String(now.getMilliseconds()).padStart(3, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Gets the caller location (file:line) for better debugging.
 * Parses the stack trace to find where the log was called from.
 *
 * @returns {string} File and line number of the caller
 */
function getCallerLocation() {
  const stack = new Error().stack;
  if (!stack) return "unknown";

  const lines = stack.split("\n");
  // Skip: Error line, getTimestamp, getCallerLocation, logMessage, the actual log method
  // Skip internal Node.js frames and logger frames to find actual caller
  let callerLine = "";
  for (let i = 4; i < lines.length; i++) {
    const line = lines[i];
    if (
      line &&
      !line.includes("node:internal") &&
      !line.includes("node:events") &&
      !line.includes("logger.js")
    ) {
      callerLine = line;
      break;
    }
  }
  if (!callerLine) {
    callerLine = lines[4] || lines[lines.length - 1];
  }

  // Extract file path and line number
  const match = callerLine.match(/\((.+)\)/) || callerLine.match(/at (.+)/);
  if (match && match[1]) {
    const parts = match[1].split(":");
    // Show relative path for readability
    const filePath = parts[0].replace(/^.*[\\/]/, "");
    const lineNum = parts[1] || "";
    return `${filePath}:${lineNum}`;
  }

  return "unknown";
}

/**
 * Formats a log entry for console output with colors.
 *
 * @param {string} level - Log level (ERROR, WARN, INFO, DEBUG)
 * @param {string} message - The log message
 * @param {Object} meta - Optional metadata object
 * @param {string} location - Caller file location
 * @returns {string} Colorized console log string
 */
function formatConsoleLog(level, message, meta, location) {
  const timestamp = getTimestamp();
  const color =
    {
      ERROR: COLORS.red,
      WARN: COLORS.yellow,
      INFO: COLORS.green,
      DEBUG: COLORS.cyan,
    }[level] || COLORS.white;

  let output = `${COLORS.gray}[${timestamp}]${COLORS.reset} `;
  output += `${color}[${level.padEnd(5)}]${COLORS.reset} `;
  output += `${COLORS.magenta}[${location}]${COLORS.reset} `;
  output += message;

  if (meta && Object.keys(meta).length > 0) {
    // Don't log sensitive fields
    const safeMeta = sanitizeForLogging(meta);
    output += ` ${COLORS.gray}${JSON.stringify(safeMeta)}${COLORS.reset}`;
  }

  return output;
}

/**
 * Formats a log entry for file output (no colors, JSON metadata).
 *
 * @param {string} level - Log level
 * @param {string} message - The log message
 * @param {Object} meta - Optional metadata object
 * @param {string} location - Caller file location
 * @returns {string} Plain text log line
 */
function formatFileLog(level, message, meta, location) {
  const timestamp = getTimestamp();
  let logLine = `[${timestamp}] [${level}] [${location}] ${message}`;

  if (meta && Object.keys(meta).length > 0) {
    const safeMeta = sanitizeForLogging(meta);
    logLine += ` | ${JSON.stringify(safeMeta)}`;
  }

  return logLine;
}

/**
 * Removes sensitive fields from metadata before logging.
 * Prevents passwords, tokens, and other secrets from appearing in logs.
 *
 * @param {Object} data - The data object to sanitize
 * @returns {Object} Sanitized data object
 */
function sanitizeForLogging(data) {
  if (!data || typeof data !== "object") return data;

  const sensitiveFields = [
    "password",
    "password_hash",
    "token",
    "secret",
    "authorization",
    "cookie",
    "sessionId",
    "credit_card",
    "ssn",
    "pin",
    "key",
  ];

  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (sanitized[field] !== undefined) {
      sanitized[field] = "[REDACTED]";
    }
  }

  // Also check nested objects (body, headers, etc.)
  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Writes a log entry to the appropriate log file.
 * Implements log rotation when file exceeds maximum size.
 *
 * @param {string} level - Log level
 * @param {string} logLine - Formatted log line to write
 */
function writeToFile(level, logLine) {
  try {
    // Determine log file based on level
    let logFileName;
    if (level === "ERROR") {
      logFileName = "error.log";
    } else if (level === "WARN") {
      logFileName = "warn.log";
    } else {
      logFileName = "app.log";
    }

    const logFilePath = path.join(LOG_DIR, logFileName);

    // Check if rotation is needed
    if (fs.existsSync(logFilePath)) {
      const stats = fs.statSync(logFilePath);
      if (stats.size >= MAX_LOG_SIZE) {
        rotateLogFile(logFilePath);
      }
    }

    // Append log entry to file
    fs.appendFileSync(logFilePath, logLine + "\n", "utf8");
  } catch (err) {
    // If file logging fails, write to stderr to avoid infinite loop
    console.error(`[LOGGER ERROR] Failed to write to log file: ${err.message}`);
  }
}

/**
 * Rotates log files to prevent unlimited growth.
 * Renames current file with timestamp, deletes oldest backups.
 *
 * @param {string} filePath - Path to the log file to rotate
 */
function rotateLogFile(filePath) {
  try {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);

    // Shift existing backup files (app.log.4 → app.log.5, etc.)
    for (let i = MAX_BACKUP_FILES; i >= 1; i--) {
      const oldFile = path.join(dir, `${base}.${i}${ext}`);
      const newFile = path.join(dir, `${base}.${i + 1}${ext}`);

      if (fs.existsSync(oldFile)) {
        if (i === MAX_BACKUP_FILES) {
          // Delete oldest backup
          fs.unlinkSync(oldFile);
        } else {
          // Rename to next number
          fs.renameSync(oldFile, newFile);
        }
      }
    }

    // Rename current file to .1
    const backupFile = path.join(dir, `${base}.1${ext}`);
    fs.renameSync(filePath, backupFile);
  } catch (err) {
    console.error(`[LOGGER ERROR] Log rotation failed: ${err.message}`);
  }
}

/**
 * Core logging function.
 * Checks log level threshold and dispatches to appropriate outputs.
 *
 * @param {string} level - Log level (ERROR, WARN, INFO, DEBUG)
 * @param {string} message - The message to log
 * @param {Object} meta - Optional metadata to include
 */
function logMessage(level, message, meta = {}) {
  // Check if this log level should be output
  if (LOG_LEVELS[level] > currentLogLevel) {
    return; // Suppress logs below current threshold
  }

  const location = getCallerLocation();

  // Console output (with colors)
  const consoleOutput = formatConsoleLog(level, message, meta, location);

  switch (level) {
    case "ERROR":
      console.error(consoleOutput);
      break;
    case "WARN":
      console.warn(consoleOutput);
      break;
    case "INFO":
      console.log(consoleOutput);
      break;
    case "DEBUG":
      console.debug(consoleOutput);
      break;
    default:
      console.log(consoleOutput);
  }

  // File output (always write ERROR and WARN, only write INFO/DEBUG in development)
  if (
    level === "ERROR" ||
    level === "WARN" ||
    process.env.NODE_ENV !== "production"
  ) {
    const fileOutput = formatFileLog(level, message, meta, location);
    writeToFile(level, fileOutput);
  }
}

// ── Public API ─────────────────────────────────────────────

/**
 * Logger object exposing log level methods.
 * Usage:
 *   const logger = require('./utils/logger');
 *   logger.error('Database connection failed', { error: err.message });
 *   logger.warn('Rate limit approaching', { current: 4, max: 5 });
 *   logger.info('Server started', { port: 3000 });
 *   logger.debug('Request body', { body: req.body });
 */
const logger = {
  /**
   * Log an error message.
   * Use for: Exceptions, failed operations, data corruption.
   *
   * @param {string} message - Error description
   * @param {Object} meta - Optional context (error object, stack trace, etc.)
   */
  error(message, meta = {}) {
    logMessage("ERROR", message, meta);
  },

  /**
   * Log a warning message.
   * Use for: Deprecated usage, approaching limits, recoverable issues.
   *
   * @param {string} message - Warning description
   * @param {Object} meta - Optional context
   */
  warn(message, meta = {}) {
    logMessage("WARN", message, meta);
  },

  /**
   * Log an informational message.
   * Use for: Server start, user actions, configuration, milestones.
   *
   * @param {string} message - Info description
   * @param {Object} meta - Optional context
   */
  info(message, meta = {}) {
    logMessage("INFO", message, meta);
  },

  /**
   * Log a debug message.
   * Use for: Variable values, function entry/exit, detailed flow tracing.
   * Only outputs when LOG_LEVEL=DEBUG or NODE_ENV=development.
   *
   * @param {string} message - Debug description
   * @param {Object} meta - Optional context
   */
  debug(message, meta = {}) {
    logMessage("DEBUG", message, meta);
  },
};

module.exports = logger;
