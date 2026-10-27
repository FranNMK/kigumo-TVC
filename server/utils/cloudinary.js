/**
 * Cloudinary Configuration & Helpers
 * 
 * Optimized for cPanel hosting with TiDB & Cloudinary:
 * - Automatically ensures environment variables are loaded via loadEnv
 * - Configures explicit upload timeout (default 60,000ms) to prevent 499 Request Timeouts
 * - Implements 1-step automatic retry for transient timeouts and connection resets
 * - Formats error properties (isTimeout, http_code) for graceful HTTP responses
 */

require('./loadEnv');
const cloudinary = require('cloudinary').v2;
const logger = require('./cloudinaryLogger');

const CLOUDINARY_TIMEOUT = parseInt(process.env.CLOUDINARY_TIMEOUT) || 60000;

// Configure Cloudinary SDK with global timeout
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
  timeout:    CLOUDINARY_TIMEOUT
});

// Non-blocking ping check with safety guard
if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.api.ping({ timeout: 15000 })
    .then(() => logger.info('✅ Cloudinary connected successfully'))
    .catch(err => {
      logger.error('❌ Cloudinary connection check failed', {
        error: err.message,
        http_code: err.http_code,
        suggestion: 'Verify CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and network access to api.cloudinary.com'
      });
    });
} else {
  logger.warn('⚠️ Cloudinary environment variables missing or incomplete at startup.');
}

/**
 * Check if an error represents a network timeout or 499 Request Timeout
 */
function isTimeoutError(err) {
  if (!err) return false;
  return (
    err.http_code === 499 ||
    err.http_code === 408 ||
    err.http_code === 504 ||
    err.code === 'ETIMEDOUT' ||
    err.code === 'ESOCKETTIMEDOUT' ||
    err.code === 'ECONNRESET' ||
    (err.message && /timeout|timed out|client closed/i.test(err.message))
  );
}

/**
 * Upload a file to Cloudinary with timeout protection and retry.
 * @param {string|Buffer} file - file path, buffer, or base64 data URI
 * @param {object} options - folder, public_id, resource_type, timeout, etc.
 * @returns {Promise<object>} { secure_url, public_id, width, height, format, bytes }
 */
async function uploadFile(file, options = {}) {
  const start = Date.now();
  const defaults = {
    folder: 'kigumo-tvc',
    resource_type: 'auto',
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    timeout: CLOUDINARY_TIMEOUT
  };
  const uploadOptions = { ...defaults, ...options };

  logger.debug('Uploading file to Cloudinary', {
    folder: uploadOptions.folder,
    resource_type: uploadOptions.resource_type,
    timeout: uploadOptions.timeout
  });

  try {
    const result = await cloudinary.uploader.upload(file, uploadOptions);
    const duration = Date.now() - start;
    logger.info('✅ Upload successful', {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      bytes: result.bytes,
      duration: `${duration}ms`
    });
    return result;
  } catch (err) {
    const isTimeout = isTimeoutError(err);
    const duration = Date.now() - start;

    // Retry once on timeout or connection reset if under max allowed time
    if (isTimeout && !uploadOptions._isRetry) {
      logger.warn(`⚠️ Cloudinary upload timed out after ${duration}ms (code: ${err.http_code || err.code}). Retrying once...`);
      try {
        const retryStart = Date.now();
        const retryResult = await cloudinary.uploader.upload(file, {
          ...uploadOptions,
          timeout: CLOUDINARY_TIMEOUT + 15000, // slight extension for retry
          _isRetry: true
        });
        logger.info('✅ Upload retry succeeded', {
          public_id: retryResult.public_id,
          duration: `${Date.now() - retryStart}ms`
        });
        return retryResult;
      } catch (retryErr) {
        err = retryErr;
      }
    }

    // Attach rich error metadata for HTTP controllers
    err.isTimeout = isTimeout;
    err.duration = duration;
    err.userMessage = isTimeout
      ? 'File upload timed out. The file may be too large or your internet connection is slow. Please try again with a smaller file.'
      : (err.message || 'Cloudinary upload failed');

    logger.error('❌ Upload failed', {
      error: err.message,
      http_code: err.http_code,
      code: err.code,
      isTimeout: err.isTimeout,
      duration: `${Date.now() - start}ms`
    });

    throw err;
  }
}

/**
 * Delete a file from Cloudinary by public_id.
 */
async function deleteFile(publicId, options = {}) {
  const start = Date.now();
  logger.debug('Deleting file from Cloudinary', { public_id: publicId });

  try {
    const deleteOptions = { timeout: 30000, ...options };
    const result = await cloudinary.uploader.destroy(publicId, deleteOptions);
    const duration = Date.now() - start;
    logger.info('✅ Delete successful', { public_id: publicId, result, duration: `${duration}ms` });
    return result;
  } catch (err) {
    logger.error('❌ Delete failed', { public_id: publicId, error: err.message, duration: `${Date.now() - start}ms` });
    throw err;
  }
}

/**
 * Generate an optimised delivery URL.
 */
function optimisedUrl(publicId, transformations = {}) {
  return cloudinary.url(publicId, {
    secure: true,
    fetch_format: 'auto',
    quality: 'auto',
    ...transformations
  });
}

module.exports = {
  uploadFile,
  deleteFile,
  optimisedUrl,
  isTimeoutError,
  CLOUDINARY_TIMEOUT
};