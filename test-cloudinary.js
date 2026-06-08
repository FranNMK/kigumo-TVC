/**
 * Cloudinary Onboarding Test Script
 * 
 * 1. Configure Cloudinary with your credentials
 * 2. Upload a sample image from Cloudinary's demo
 * 3. Print metadata (width, height, format, bytes)
 * 4. Generate an optimised transformed URL (f_auto, q_auto)
 */

const cloudinary = require('cloudinary').v2;

// ── CONFIGURE ───────────────────────────────────────
// Replace the three placeholders below with your real values
cloudinary.config({
  cloud_name: 'dabo8y2bw',     // ← replace this
  api_key:    '984851794387469',        // ← replace this
  api_secret: 'd1G7TEoJ7VrXeo6LJMyAaEtqdjw',     // ← replace this
  secure: true
});

// ── UPLOAD A SAMPLE IMAGE ──────────────────────────
async function runTest() {
  try {
    console.log('Uploading sample image...\n');

    // Upload an image from Cloudinary's demo domain
    const result = await cloudinary.uploader.upload(
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      { folder: 'kigumo-tvc-test' }
    );

    console.log('✅ Upload successful!');
    console.log('  Secure URL:', result.secure_url);
    console.log('  Public ID :', result.public_id);
    console.log('');

    // ── GET IMAGE DETAILS ──────────────────────────
    console.log('📷 Image metadata:');
    console.log('  Width :', result.width, 'px');
    console.log('  Height:', result.height, 'px');
    console.log('  Format:', result.format);
    console.log('  Size  :', result.bytes, 'bytes');
    console.log('');

    // ── TRANSFORM (f_auto, q_auto) ─────────────────
    // f_auto – automatically delivers the best format for the browser (WebP, AVIF, etc.)
    // q_auto – automatically selects the optimal quality/size balance
    const transformedUrl = cloudinary.url(result.public_id, {
      secure: true,
      fetch_format: 'auto',
      quality: 'auto'
    });

    console.log('✨ Done! Click the link below to see the optimised version.');
    console.log('   Check the size and the format.\n');
    console.log('   ' + transformedUrl);
    console.log('');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

runTest();