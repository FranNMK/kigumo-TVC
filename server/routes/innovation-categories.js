const express = require('express');
const router = express.Router();
const db = require('../db');
const { body, param, validationResult } = require('express-validator');
const { isInnovationAuthenticated, isInnovationAdmin } = require('../middleware/auth');

// GET all active categories (public)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT c.id, c.name, c.description, c.is_active, d.id as department_id, d.name as department_name
      FROM innovation_skills_categories c
      JOIN departments d ON c.department_id = d.id
      WHERE c.is_active = 1
      ORDER BY d.name, c.name
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create category (Admin only)
router.post('/', isInnovationAuthenticated, isInnovationAdmin, [
  body('department_id').isInt(),
  body('name').notEmpty().trim(),
  body('description').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { department_id, name, description } = req.body;

  try {
    const [result] = await db.execute(
      'INSERT INTO innovation_skills_categories (department_id, name, description) VALUES (?, ?, ?)',
      [department_id, name, description || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Category created successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Category already exists for this department' });
    }
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;