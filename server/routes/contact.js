/**
 * Contact Form API Route
 * POST /api/v1/contact
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../utils/logger');

router.post('/', async (req, res) => {
  try {
    const { full_name, email, phone, subject, message } = req.body;
    if (!full_name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    await db.execute(
      `INSERT INTO contact_enquiries (full_name, email, phone_number, subject, message) VALUES (?, ?, ?, ?, ?)`,
      [full_name, email, phone || null, subject, message]
    );
    logger.info('Contact form submission received', { email });
    res.json({ success: true, message: 'Your message has been sent.' });
  } catch (err) {
    logger.error('Contact form error', { error: err.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;