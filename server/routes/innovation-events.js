const express = require('express');
const router = express.Router();
const db = require('../db');
const { body, param, validationResult } = require('express-validator');
const { isInnovationAuthenticated, isInnovationAdmin } = require('../middleware/auth');

// GET all events (public)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, description, event_type, start_date, end_date, status, created_at FROM innovation_events ORDER BY start_date DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching innovation events:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET single event (public)
router.get('/:id', [
  param('id').isInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const [rows] = await db.execute('SELECT * FROM innovation_events WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create event (Admin only)
router.post('/', isInnovationAuthenticated, isInnovationAdmin, [
  body('name').notEmpty().trim(),
  body('event_type').isIn(['skills_competition', 'innovation_exhibition', 'research_project']),
  body('start_date').isISO8601(),
  body('end_date').isISO8601(),
  body('status').optional().isIn(['draft', 'active', 'archived'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description, event_type, start_date, end_date, status = 'draft' } = req.body;

  try {
    const [result] = await db.execute(
      'INSERT INTO innovation_events (name, description, event_type, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description || null, event_type, start_date, end_date, status]
    );
    res.status(201).json({ id: result.insertId, message: 'Event created successfully' });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update event (Admin only)
router.put('/:id', isInnovationAuthenticated, isInnovationAdmin, [
  param('id').isInt(),
  body('name').optional().trim(),
  body('status').optional().isIn(['draft', 'active', 'archived'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  const updates = req.body;
  const allowed = ['name', 'description', 'event_type', 'start_date', 'end_date', 'status'];
  const fields = [];
  const values = [];

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }

  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
  values.push(id);

  try {
    const [result] = await db.execute(
      `UPDATE innovation_events SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event updated successfully' });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;