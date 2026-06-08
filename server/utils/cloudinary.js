/**
 * Cloudinary Configuration & Helpers
 */
const cloudinary = require('cloudinary').v2;
const logger = require('./cloudinaryLogger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

cloudinary.api.ping()
  .then(() => logger.info('✅ Cloudinary connected'))
  .catch(err => logger.error('❌ Cloudinary config error', { error: err.message }));

/**
 * Upload a file to Cloudinary.
 * @param {string|Buffer} file - file path, buffer, or base64 data URI
 * @param {object} options - folder, public_id, resource_type, etc.
 * @returns {Promise<object>} { secure_url, public_id, width, height, format, bytes }
 */
async function uploadFile(file, options = {}) {
  const start = Date.now();
  const defaults = {
    folder: 'kigumo-tvc',
    resource_type: 'auto',
    use_filename: true,
    unique_filename: true,
    overwrite: false
  };
  const uploadOptions = { ...defaults, ...options };

  logger.debug('Uploading file to Cloudinary', { options: uploadOptions });

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
    logger.error('❌ Upload failed', { error: err.message, duration: `${Date.now() - start}ms` });
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
    const result = await cloudinary.uploader.destroy(publicId, options);
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

module.exports = { uploadFile, deleteFile, optimisedUrl };