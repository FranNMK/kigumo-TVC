/**
 * Cloudinary Configuration & Helpers
 * 
 * Optimized for cPanel hosting with TiDB & Cloudinary:
 * - Automatically ensures environment variables are loaded via loadEnv
 * - Direct binary streaming (upload_stream) avoiding V8 heap base64 allocations
 * - Configures explicit upload timeout (default 30,000ms) to stay within Apache/Passenger proxy limits
 * - Formats error properties (isTimeout, http_code) for graceful HTTP responses
 */

require('./loadEnv');
const { Readable } = require('stream');
const cloudinary = require('cloudinary').v2;
const logger = require('./cloudinaryLogger');

const CLOUDINARY_TIMEOUT = parseInt(process.env.CLOUDINARY_TIMEOUT, 10) || 30000;

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
    Boolean(err.message && /timeout|timed out|client closed/i.test(err.message))
  );
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
    overwrite: false
  };
  const uploadOptions = { ...defaults, ...options };

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
 * Upload a file to Cloudinary with timeout protection and retry.
 * Handles Buffers, file paths, and data URIs seamlessly.
 * @param {string|Buffer} file - file buffer, path, or base64 data URI
 * @param {object} options - folder, public_id, resource_type, timeout, etc.
 * @returns {Promise<object>} { secure_url, public_id, width, height, format, bytes }
 */
async function uploadFile(file, options = {}) {
  const start = Date.now();
  const timeoutMs = options.timeout || CLOUDINARY_TIMEOUT;

  // If file is a Buffer, use uploadBufferStream directly
  if (Buffer.isBuffer(file)) {
    try {
      return await uploadBufferStream(file, { ...options, timeout: timeoutMs });
    } catch (err) {
      if (isTimeoutError(err) && !options._isRetry) {
        logger.warn(`⚠️ Cloudinary stream upload timed out. Retrying once with +10s...`);
        return await uploadBufferStream(file, {
          ...options,
          timeout: timeoutMs + 10000,
          _isRetry: true
        });
      }
      throw err;
    }
  }

  // Fallback for strings, paths, or data URIs
  const defaults = {
    folder: 'kigumo-tvc',
    resource_type: 'auto',
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    timeout: timeoutMs
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

    if (isTimeout && !uploadOptions._isRetry) {
      logger.warn(`⚠️ Cloudinary upload timed out after ${duration}ms (code: ${err.http_code || err.code}). Retrying once...`);
      try {
        const retryStart = Date.now();
        const retryResult = await cloudinary.uploader.upload(file, {
          ...uploadOptions,
          timeout: timeoutMs + 10000,
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
  uploadBufferStream,
  deleteFile,
  optimisedUrl,
  isTimeoutError,
  CLOUDINARY_TIMEOUT
};