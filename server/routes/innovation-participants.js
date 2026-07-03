const express = require('express');
const router = express.Router();
const db = require('../db');
const { body, param, validationResult } = require('express-validator');
const { isInnovationAuthenticated, isInnovationAdmin } = require('../middleware/auth');

// ==========================================
// GET All Participants (Admin = all, Coordinator = own dept)
// ==========================================
router.get('/', isInnovationAuthenticated, async (req, res) => {
  const user = req.innovationUser;
  let sql = `
    SELECT p.id, p.event_id, p.admission_number, p.full_name, p.department_id, 
           d.name as department_name, e.name as event_name, p.created_at
    FROM innovation_participants p
    JOIN departments d ON p.department_id = d.id
    JOIN innovation_events e ON p.event_id = e.id
  `;
  const params = [];

  if (user.role === 'coordinator') {
    sql += ' WHERE p.department_id = ?';
    params.push(user.department_id);
  }
  
  // 👇 CHANGE: Sort by p.id DESC instead of p.created_at DESC
  sql += ' ORDER BY p.id DESC';

  try {
    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching participants:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// GET Single Participant (Admin only)
// ==========================================
router.get('/:id', isInnovationAuthenticated, isInnovationAdmin, [
  param('id').isInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const [rows] = await db.execute(`
      SELECT p.id, p.event_id, p.admission_number, p.full_name, p.department_id,
             d.name as department_name, e.name as event_name, p.created_at
      FROM innovation_participants p
      JOIN departments d ON p.department_id = d.id
      JOIN innovation_events e ON p.event_id = e.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ error: 'Participant not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching participant:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// POST Add Participant (Admin only)
// ==========================================
router.post('/', isInnovationAuthenticated, isInnovationAdmin, [
  body('event_id').isInt(),
  body('admission_number').notEmpty().trim(),
  body('full_name').notEmpty().trim(),
  body('department_id').isInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { event_id, admission_number, full_name, department_id } = req.body;

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

// ==========================================
// PUT Update Participant (Admin only)
// ==========================================
router.put('/:id', isInnovationAuthenticated, isInnovationAdmin, [
  param('id').isInt(),
  body('admission_number').optional().trim(),
  body('full_name').optional().trim(),
  body('department_id').optional().isInt(),
  body('event_id').optional().isInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  const updates = req.body;
  const allowed = ['admission_number', 'full_name', 'department_id', 'event_id'];
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
      `UPDATE innovation_participants SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Participant not found' });
    res.json({ message: 'Participant updated successfully' });
  } catch (err) {
    console.error('Error updating participant:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// DELETE Participant (Admin only)
// ==========================================
router.delete('/:id', isInnovationAuthenticated, isInnovationAdmin, [
  param('id').isInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const [result] = await db.execute('DELETE FROM innovation_participants WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Participant not found' });
    res.json({ message: 'Participant deleted successfully' });
  } catch (err) {
    console.error('Error deleting participant:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// POST Import Participants (Bulk Insert with Validation)
// ==========================================
router.post('/import', isInnovationAuthenticated, isInnovationAdmin, [
  body('participants').isArray({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const participants = req.body.participants;
  const validRows = [];
  const errorRows = [];

  // Validate each row
  participants.forEach((row, index) => {
    const { event_id, admission_number, full_name, department_id } = row;
    if (event_id && admission_number && full_name && department_id) {
      validRows.push([event_id, admission_number.trim(), full_name.trim(), department_id]);
    } else {
      errorRows.push({ row: index + 1, data: row, error: 'Missing required fields (event_id, admission_number, full_name, department_id)' });
    }
  });

  if (validRows.length === 0) {
    return res.status(400).json({ error: 'No valid rows to import', errorRows });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Build bulk insert query
    const placeholders = validRows.map(() => '(?, ?, ?, ?)').join(', ');
    const flatValues = validRows.flat();
    
    const sql = `INSERT INTO innovation_participants (event_id, admission_number, full_name, department_id) VALUES ${placeholders}`;
    await connection.execute(sql, flatValues);

    await connection.commit();
    res.status(201).json({ 
      message: `Successfully imported ${validRows.length} participants.`, 
      imported: validRows.length,
      errors: errorRows 
    });
  } catch (err) {
    await connection.rollback();
    console.error('Error importing participants:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Duplicate admission numbers found in import batch.', errorRows });
    }
    res.status(500).json({ error: 'Internal server error during import' });
  } finally {
    connection.release();
  }
});

module.exports = router;