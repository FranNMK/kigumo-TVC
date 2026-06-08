const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

async function deleteAllInFolder(folder) {
  let nextCursor = null;
  let totalDeleted = 0;
  do {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder + '/',
      max_results: 500,
      next_cursor: nextCursor
    });
    const publicIds = result.resources.map(r => r.public_id);
    if (publicIds.length > 0) {
      const delResult = await cloudinary.api.delete_resources(publicIds, {
        resource_type: 'raw'  // for PDFs etc. Change to 'image' if you have images
      });
      totalDeleted += Object.keys(delResult.deleted).length;
    }
    nextCursor = result.next_cursor;
  } while (nextCursor);
  console.log(`Deleted ${totalDeleted} files from Cloudinary folder: ${folder}`);
}

deleteAllInFolder('kigumo-tvc').catch(err => console.error(err));