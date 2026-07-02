const express = require('express');
const router = express.Router();
const db = require('../db');
const { body, param, validationResult } = require('express-validator');
const { isInnovationAuthenticated } = require('../middleware/auth');

// GET all participants (Admin -> all, Coordinator -> own department)
router.get('/', isInnovationAuthenticated, async (req, res) => {
  const user = req.innovationUser;
  let sql = `
    SELECT p.id, p.event_id, p.admission_number, p.full_name, p.department_id, 
           d.name as department_name, e.name as event_name
    FROM innovation_participants p
    JOIN departments d ON p.department_id = d.id
    JOIN innovation_events e ON p.event_id = e.id
  `;
  const params = [];

  if (user.role === 'coordinator') {
    sql += ' WHERE p.department_id = ?';
    params.push(user.department_id);
  }
  sql += ' ORDER BY p.created_at DESC';

  try {
    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching participants:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST add participant (Admin or Coordinator for their department)
router.post('/', isInnovationAuthenticated, [
  body('event_id').isInt(),
  body('admission_number').notEmpty().trim(),
  body('full_name').notEmpty().trim(),
  body('department_id').isInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { event_id, admission_number, full_name, department_id } = req.body;
  const user = req.innovationUser;

  if (user.role === 'coordinator' && user.department_id !== parseInt(department_id)) {
    return res.status(403).json({ error: 'Forbidden: You can only add participants to your assigned department' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO innovation_participants (event_id, admission_number, full_name, department_id) VALUES (?, ?, ?, ?)',
      [event_id, admission_number, full_name, department_id]
    );
    res.status(201).json({ id: result.insertId, message: 'Participant added successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Participant already registered for this event' });
    }
    console.error('Error adding participant:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE participant (Admin or Coordinator)
router.delete('/:id', isInnovationAuthenticated, [
  param('id').isInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  const user = req.innovationUser;

  try {
    let sql = 'DELETE FROM innovation_participants WHERE id = ?';
    const params = [id];

    if (user.role === 'coordinator') {
      sql = 'DELETE p FROM innovation_participants p WHERE p.id = ? AND p.department_id = ?';
      params.push(user.department_id);
    }

    const [result] = await db.execute(sql, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Participant not found or access denied' });
    }
    res.json({ message: 'Participant removed successfully' });
  } catch (err) {
    console.error('Error deleting participant:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;