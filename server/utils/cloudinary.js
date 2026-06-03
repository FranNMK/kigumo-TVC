/**
 * Cloudinary Configuration & Helpers
 * All uploads and transformations route through this module.
 */
const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

// ── Configure from environment ─────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// (Optional) verify configuration on startup
cloudinary.api.ping()
  .then(() => logger.info('✅ Cloudinary connected'))
  .catch(err => logger.error('❌ Cloudinary config error', { error: err.message }));

/**
 * Upload a file buffer or local path to Cloudinary.
 * @param {string|Buffer} file - file path or buffer
 * @param {object} options - folder, public_id, resource_type, etc.
 * @returns {Promise<object>} { secure_url, public_id, width, height, format, bytes }
 */
async function uploadFile(file, options = {}) {
  const defaults = {
    folder: 'kigumo-tvc',
    resource_type: 'auto',          // auto-detect image/video/raw
    use_filename: true,
    unique_filename: true,
    overwrite: false
  };
  const uploadOptions = { ...defaults, ...options };
  const result = await cloudinary.uploader.upload(file, uploadOptions);
  return result;
}

/**
 * Delete a file from Cloudinary by public_id.
 * @param {string} publicId
 * @param {object} options - resource_type etc.
 */
async function deleteFile(publicId, options = {}) {
  return cloudinary.uploader.destroy(publicId, options);
}

/**
 * Generate an optimised delivery URL.
 * @param {string} publicId - the public_id from upload result
 * @param {object} transformations - optional transformations
 * @returns {string} secure URL
 */
function optimisedUrl(publicId, transformations = {}) {
  return cloudinary.url(publicId, {
    secure: true,
    fetch_format: 'auto',   // f_auto – best format for the browser
    quality: 'auto',        // q_auto – optimal quality/size balance
    ...transformations
  });
}

module.exports = { uploadFile, deleteFile, optimisedUrl };