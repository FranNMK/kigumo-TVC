const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../utils/logger');
const { body, query, param, validationResult } = require('express-validator');
const { isInnovationAuthenticated, isInnovationCoordinator } = require('../middleware/auth');

// POST /api/v1/innovation/scores (Coordinator only)
router.post('/', isInnovationAuthenticated, isInnovationCoordinator, [
  body('participant_id').isInt(),
  body('event_id').isInt(),
  body('category_id').isInt(),
  body('score').isFloat({ min: 0, max: 100 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { participant_id, event_id, category_id, score, remarks } = req.body;
  const coordinator_id = req.innovationUser.id;

  try {
    const [result] = await db.execute(
      `INSERT INTO innovation_scores (participant_id, event_id, category_id, coordinator_id, score, remarks)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE score = VALUES(score), remarks = VALUES(remarks), coordinator_id = VALUES(coordinator_id)`,
      [participant_id, event_id, category_id, coordinator_id, score, remarks || null]
    );
    res.json({ message: 'Score saved successfully', id: result.insertId || 'updated' });
  } catch (err) {
    logger.error('Error saving innovation score', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/innovation/scores/ranking (public)
router.get('/ranking', [
  query('event_id').isInt(),
  query('category_id').isInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { event_id, category_id } = req.query;

  try {
    const [rows] = await db.execute(`
      SELECT 
        ROW_NUMBER() OVER (ORDER BY s.score DESC) as position,
        p.admission_number,
        p.full_name,
        d.name as department_name,
        s.score,
        s.remarks
      FROM innovation_scores s
      JOIN innovation_participants p ON s.participant_id = p.id
      JOIN departments d ON p.department_id = d.id
      WHERE s.event_id = ? AND s.category_id = ?
      ORDER BY s.score DESC
    `, [event_id, category_id]);
    res.json(rows);
  } catch (err) {
    logger.error('Error fetching innovation ranking', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;