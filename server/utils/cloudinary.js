/**
 * Cloudinary Configuration & Dual-Mode Resilient File Storage
 * 
 * Optimized for cPanel hosting with TiDB & Cloudinary:
 * - Automatically ensures environment variables are loaded via loadEnv
 * - Direct binary streaming (upload_stream) avoiding V8 heap base64 allocations
 * - Dedicated IPv4 https.Agent to bypass IPv6 routing blackholes on shared hosting
 * - Transparent Local Disk Fallback: If Cloudinary times out or outbound port 443
 *   is blocked by cPanel CSF firewall, files are automatically and safely saved
 *   to `public/uploads/<folder>/` and served via `/uploads/...` with zero downtime!
 * - Smart Circuit Breaker: skips network timeouts for subsequent uploads if Cloudinary is down
 * - Formats error properties (isTimeout, http_code) for graceful HTTP responses
 */

require('./loadEnv');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { Readable } = require('stream');
const cloudinary = require('cloudinary').v2;
const logger = require('./cloudinaryLogger');

const CLOUDINARY_TIMEOUT = parseInt(process.env.CLOUDINARY_TIMEOUT, 10) || 8000;
const STORAGE_DRIVER = (process.env.UPLOAD_STORAGE_DRIVER || 'auto').toLowerCase(); // 'auto' | 'local' | 'cloudinary'
const LOCAL_UPLOADS_BASE = path.join(__dirname, '../../public/uploads');

// Dedicated IPv4 HTTPS agent to prevent IPv6 DNS/handshake hangs on shared hosts
const httpsAgent = new https.Agent({
  family: 4,
  keepAlive: true,
  keepAliveMsecs: 15000,
  timeout: CLOUDINARY_TIMEOUT
});

// Configure Cloudinary SDK with global settings
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
  timeout:    CLOUDINARY_TIMEOUT
});

// Circuit breaker state
let cloudinaryFailureCount = 0;
let circuitOpenUntil = 0;
const CIRCUIT_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes cooldown before probing Cloudinary again

// Non-blocking ping check at startup with safety guard
if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_CLOUD_NAME) {
  if (STORAGE_DRIVER !== 'local') {
    cloudinary.api.ping({ timeout: 5000 })
      .then(() => {
        cloudinaryFailureCount = 0;
        circuitOpenUntil = 0;
        logger.info('✅ Cloudinary connected successfully (outbound port 443 open)');
      })
      .catch(err => {
        cloudinaryFailureCount++;
        circuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
        logger.warn('⚠️ Cloudinary connection check failed; local storage fallback armed', {
          error: err.message,
          http_code: err.http_code,
          driver: STORAGE_DRIVER,
          suggestion: 'Check cPanel firewall (outbound TCP port 443) or use local uploads.'
        });
      });
  } else {
    logger.info('📁 Storage driver explicitly set to "local". Cloudinary outbound calls disabled.');
  }
} else {
  logger.warn('⚠️ Cloudinary environment variables missing or incomplete at startup. Local fallback active.');
}

/**
 * Check if an error represents a network timeout or connection block
 */
function isTimeoutError(err) {
  if (!err) return false;
  return (
    err.http_code === 499 ||
    err.http_code === 408 ||
    err.http_code === 504 ||
    err.name === 'TimeoutError' ||
    err.code === 'ETIMEDOUT' ||
    err.code === 'ESOCKETTIMEDOUT' ||
    err.code === 'ECONNRESET' ||
    err.code === 'ECONNREFUSED' ||
    err.code === 'EHOSTUNREACH' ||
    err.code === 'ENOTFOUND' ||
    err.code === 'EAI_AGAIN' ||
    Boolean(err.message && /timeout|timed out|client closed|socket hang up/i.test(err.message))
  );
}

/**
 * Save a file locally to public/uploads/<folder>/<filename>
 * Used as a transparent fallback when Cloudinary is blocked, or in pure local mode.
 * 
 * @param {Buffer|string|object} file - Buffer, data URI, path, or Multer file object
 * @param {object} options - upload options (folder, resource_type, filename, etc.)
 * @returns {object} Synthetic Cloudinary result compatible with all frontend templates
 */
function saveLocalFallback(file, options = {}) {
  const start = Date.now();
  try {
    const rawFolder = options.folder || 'general';
    // Clean folder: strip 'kigumo-tvc/' prefix or unsafe characters
    const sanitizedFolder = rawFolder
      .replace(/^kigumo-tvc\/?/i, '')
      .replace(/[^a-zA-Z0-9_\-\/]/g, '') || 'general';

    const targetDir = path.join(LOCAL_UPLOADS_BASE, sanitizedFolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Determine extension
    let ext = '';
    let bufferToWrite;

    if (Buffer.isBuffer(file)) {
      bufferToWrite = file;
    } else if (file && typeof file === 'object' && file.buffer) {
      bufferToWrite = file.buffer;
      if (file.originalname) {
        ext = path.extname(file.originalname).toLowerCase();
      }
    } else if (typeof file === 'string' && file.startsWith('data:')) {
      const match = file.match(/^data:([^;]+);base64,(.*)$/);
      if (match) {
        const mime = match[1];
        bufferToWrite = Buffer.from(match[2], 'base64');
        if (mime.includes('pdf')) ext = '.pdf';
        else if (mime.includes('png')) ext = '.png';
        else if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
      } else {
        bufferToWrite = Buffer.from(file);
      }
    } else if (typeof file === 'string' && fs.existsSync(file)) {
      bufferToWrite = fs.readFileSync(file);
      ext = path.extname(file).toLowerCase();
    } else {
      bufferToWrite = Buffer.from(file || '');
    }

    if (!ext) {
      if (options.resource_type === 'raw' || options.format === 'pdf') ext = '.pdf';
      else if (options.resource_type === 'video') ext = '.mp4';
      else if (options.format) ext = `.${options.format.replace(/^\./, '')}`;
      else ext = '.jpg';
    }

    // Build unique, safe filename
    let baseName = options.public_id || options.filename || 'file';
    baseName = path.basename(baseName, path.extname(baseName)).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const finalFilename = `${uniqueSuffix}_${baseName}${ext}`;
    const destinationPath = path.join(targetDir, finalFilename);

    fs.writeFileSync(destinationPath, bufferToWrite);

    // Build relative URL served by Express static ('/uploads')
    const relativeUrl = `/uploads/${sanitizedFolder}/${finalFilename}`.replace(/\/+/g, '/');
    const duration = Date.now() - start;

    logger.info('💾 Saved file to local storage (resilient upload active)', {
      url: relativeUrl,
      sizeBytes: bufferToWrite.length,
      duration: `${duration}ms`,
      destination: destinationPath
    });

    return {
      public_id: `local/${sanitizedFolder}/${finalFilename}`,
      secure_url: relativeUrl,
      url: relativeUrl,
      width: options.width || 800,
      height: options.height || 600,
      format: ext.replace('.', ''),
      resource_type: options.resource_type || (ext === '.pdf' ? 'raw' : 'image'),
      bytes: bufferToWrite.length,
      is_local_fallback: true
    };
  } catch (err) {
    logger.error('❌ Failed to save local file fallback', { error: err.message, stack: err.stack });
    throw err;
  }
}

/**
 * Upload a Buffer directly using Cloudinary's upload_stream.
 * Avoids base64 encoding and multi-megabyte string allocation in V8 heap.
 * @param {Buffer} buffer - file buffer from Multer memoryStorage
 * @param {object} options - Cloudinary upload options (folder, resource_type, timeout, etc.)
 * @returns {Promise<object>} Cloudinary upload result
 */
function uploadBufferStream(buffer, options = {}) {
  const start = Date.now();
  const timeoutMs = options.timeout || CLOUDINARY_TIMEOUT;
  const defaults = {
    folder: 'kigumo-tvc',
    resource_type: 'auto',
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    agent: httpsAgent
  };
  const uploadOptions = { ...defaults, ...options, timeout: timeoutMs };

  logger.debug('Streaming buffer to Cloudinary', {
    folder: uploadOptions.folder,
    resource_type: uploadOptions.resource_type,
    timeout: timeoutMs,
    bytes: buffer.length
  });

  return new Promise((resolve, reject) => {
    let finished = false;
    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      const err = new Error(`Cloudinary upload stream timed out after ${timeoutMs}ms`);
      err.isTimeout = true;
      err.http_code = 499;
      err.code = 'ETIMEDOUT';
      logger.error('❌ Cloudinary stream upload timed out', {
        folder: uploadOptions.folder,
        duration: `${Date.now() - start}ms`
      });
      reject(err);
    }, timeoutMs);

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (err, result) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        const duration = Date.now() - start;

        if (err) {
          err.isTimeout = isTimeoutError(err);
          err.duration = duration;
          logger.error('❌ Stream upload failed', {
            error: err.message,
            http_code: err.http_code,
            code: err.code,
            duration: `${duration}ms`
          });
          return reject(err);
        }

        logger.info('✅ Stream upload successful', {
          public_id: result.public_id,
          secure_url: result.secure_url,
          format: result.format,
          bytes: result.bytes,
          duration: `${duration}ms`
        });
        resolve(result);
      }
    );

    const readable = Readable.from(buffer);
    readable.on('error', (streamErr) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      logger.error('❌ Readable stream error during Cloudinary upload', { error: streamErr.message });
      reject(streamErr);
    });

    readable.pipe(uploadStream);
  });
}

/**
 * Upload a file to Cloudinary with automatic local disk fallback.
 * Handles Buffers, file paths, and data URIs seamlessly.
 * 
 * If Cloudinary is unreachable (due to cPanel CSF firewall or network drop),
 * it automatically saves to public/uploads/ and returns the local URL.
 * 
 * @param {string|Buffer|object} file - file buffer, path, data URI, or Multer object
 * @param {object} options - folder, public_id, resource_type, timeout, etc.
 * @returns {Promise<object>} { secure_url, public_id, width, height, format, bytes, is_local_fallback }
 */
async function uploadFile(file, options = {}) {
  const start = Date.now();
  const allowLocalFallback = (process.env.ALLOW_LOCAL_FALLBACK !== 'false');

  // 1. Direct local mode check
  if (STORAGE_DRIVER === 'local') {
    return saveLocalFallback(file, options);
  }

  // 2. Circuit Breaker check
  const now = Date.now();
  if (now < circuitOpenUntil && allowLocalFallback) {
    logger.warn('⚡ Cloudinary circuit breaker OPEN (previous attempts timed out). Using local storage immediately.', {
      folder: options.folder,
      circuitRemainingSeconds: Math.round((circuitOpenUntil - now) / 1000)
    });
    return saveLocalFallback(file, options);
  }

  // 3. Normalize buffer from Multer object if needed
  let bufferToStream = null;
  if (Buffer.isBuffer(file)) {
    bufferToStream = file;
  } else if (file && typeof file === 'object' && Buffer.isBuffer(file.buffer)) {
    bufferToStream = file.buffer;
    if (!options.filename && file.originalname) {
      options.filename = file.originalname;
    }
  }

  // 4. Attempt Cloudinary upload
  const timeoutMs = options.timeout || CLOUDINARY_TIMEOUT;

  try {
    let result;
    if (bufferToStream) {
      result = await uploadBufferStream(bufferToStream, { ...options, timeout: timeoutMs });
    } else {
      const defaults = {
        folder: 'kigumo-tvc',
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        timeout: timeoutMs,
        agent: httpsAgent
      };
      const uploadOptions = { ...defaults, ...options };
      logger.debug('Uploading file to Cloudinary', {
        folder: uploadOptions.folder,
        resource_type: uploadOptions.resource_type,
        timeout: uploadOptions.timeout
      });
      result = await cloudinary.uploader.upload(file, uploadOptions);
    }

    // Success - reset circuit breaker
    cloudinaryFailureCount = 0;
    circuitOpenUntil = 0;
    return result;

  } catch (err) {
    const isTimeout = isTimeoutError(err);
    const duration = Date.now() - start;

    logger.error('❌ Cloudinary upload attempt failed', {
      error: err.message,
      http_code: err.http_code,
      code: err.code,
      isTimeout,
      duration: `${duration}ms`
    });

    // Trip circuit breaker on network failure
    cloudinaryFailureCount++;
    if (cloudinaryFailureCount >= 2 || isTimeout) {
      circuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
      logger.warn(`⚡ Cloudinary circuit breaker tripped for ${CIRCUIT_COOLDOWN_MS / 1000}s due to connection failure.`);
    }

    // Fall back to local storage if enabled
    if (allowLocalFallback && STORAGE_DRIVER !== 'cloudinary') {
      logger.warn('🔄 Falling back to local disk storage for upload', {
        folder: options.folder,
        reason: err.message
      });
      return saveLocalFallback(bufferToStream || file, options);
    }

    // Strict Cloudinary mode: re-throw formatted error
    err.isTimeout = isTimeout;
    err.duration = duration;
    err.userMessage = isTimeout
      ? 'File upload timed out. The server could not reach Cloudinary storage.'
      : (err.message || 'Cloudinary upload failed');

    throw err;
  }
}

/**
 * Delete a file by public_id (supports both Cloudinary public_ids and local fallback files).
 */
async function deleteFile(publicId, options = {}) {
  const start = Date.now();
  if (!publicId) return { result: 'not found' };

  // If local fallback file
  if (typeof publicId === 'string' && (publicId.startsWith('local/') || publicId.startsWith('/uploads/'))) {
    try {
      const relative = publicId.replace(/^local\//, '').replace(/^\/uploads\//, '');
      const fullPath = path.join(LOCAL_UPLOADS_BASE, relative);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        logger.info('🗑️ Deleted local upload file', { path: fullPath, duration: `${Date.now() - start}ms` });
        return { result: 'ok', local: true };
      }
      return { result: 'not found', local: true };
    } catch (err) {
      logger.error('❌ Failed to delete local file', { publicId, error: err.message });
      throw err;
    }
  }

  // Cloudinary delete
  try {
    const deleteOptions = { timeout: 15000, ...options };
    const result = await cloudinary.uploader.destroy(publicId, deleteOptions);
    const duration = Date.now() - start;
    logger.info('✅ Cloudinary delete successful', { public_id: publicId, result, duration: `${duration}ms` });
    return result;
  } catch (err) {
    logger.error('❌ Cloudinary delete failed', { public_id: publicId, error: err.message, duration: `${Date.now() - start}ms` });
    throw err;
  }
}

/**
 * Generate an optimised delivery URL.
 * If URL is already local (/uploads/...), returns it directly.
 */
function optimisedUrl(publicId, transformations = {}) {
  if (!publicId) return '';
  if (typeof publicId === 'string' && (publicId.startsWith('/uploads/') || publicId.startsWith('http://') || publicId.startsWith('https://'))) {
    return publicId;
  }
  return cloudinary.url(publicId, {
    secure: true,
    fetch_format: 'auto',
    quality: 'auto',
    ...transformations
  });
}

/**
 * Get current storage system status
 */
function getStorageStatus() {
  const isWritable = (() => {
    try {
      if (!fs.existsSync(LOCAL_UPLOADS_BASE)) {
        fs.mkdirSync(LOCAL_UPLOADS_BASE, { recursive: true });
      }
      const testFile = path.join(LOCAL_UPLOADS_BASE, `.health_${Date.now()}`);
      fs.writeFileSync(testFile, 'ok');
      fs.unlinkSync(testFile);
      return true;
    } catch (_) {
      return false;
    }
  })();

  return {
    driver: STORAGE_DRIVER,
    allowLocalFallback: process.env.ALLOW_LOCAL_FALLBACK !== 'false',
    circuitOpen: Date.now() < circuitOpenUntil,
    circuitRemainingSeconds: Math.max(0, Math.round((circuitOpenUntil - Date.now()) / 1000)),
    cloudinaryFailureCount,
    localBaseDirectory: LOCAL_UPLOADS_BASE,
    localDirectoryWritable: isWritable
  };
}

module.exports = {
  uploadFile,
  uploadBufferStream,
  saveLocalFallback,
  deleteFile,
  optimisedUrl,
  isTimeoutError,
  getStorageStatus,
  CLOUDINARY_TIMEOUT
};
