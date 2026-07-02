const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { body, validationResult } = require('express-validator');

// POST /api/v1/innovation/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const [rows] = await db.execute(
      `SELECT id, full_name, email, phone, password_hash, role, department_id, is_active, must_change_password 
       FROM innovation_users 
       WHERE email = ? AND is_active = 1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.innovationUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
      must_change_password: user.must_change_password
    };

   res.json({
  success: true,
  user: req.session.innovationUser,
  redirectUrl: user.role === 'admin' 
    ? '/innovation/admin/dashboard.html'   // ← add .html
    : '/innovation/coordinator/dashboard.html' // ← add .html
});
  } catch (err) {
    console.error('Innovation login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/innovation/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// GET /api/v1/innovation/auth/me
router.get('/me', (req, res) => {
  if (!req.session.innovationUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json(req.session.innovationUser);
});

module.exports = router;