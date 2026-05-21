/**
 * Courses Routes
 * 
 * Public API for fetching courses with fees and intake dates.
 * Replaces the placeholder courses.js.
 * 
 * @module routes/courses
 * @requires express
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../utils/logger');

/**
 * GET /api/v1/courses
 * 
 * Returns all active courses with department info, fees, and next intake.
 * Optional query param: department_id to filter by department.
 * 
 * Query params:
 *   - department_id: number (optional)
 * 
 * Response:
 *   {
 *     success: true,
 *     data: [{ 
 *       id, name, duration_years, examining_body, cbet_status,
 *       department: { id, name },
 *       fees: [{ year_of_study, tuition, examination, ... }],
 *       next_intake: { date, label }
 *     }]
 *   }
 */
router.get('/', async (req, res) => {
    try {
        const { department_id } = req.query;
        
        let sql = `
            SELECT 
                c.id,
                c.name,
                c.duration_years,
                c.examining_body,
                c.cbet_status,
                c.entry_requirements,
                c.description,
                c.is_active,
                d.id AS department_id,
                d.name AS department_name,
                d.type AS department_type
            FROM courses c
            JOIN departments d ON c.department_id = d.id
            WHERE c.is_active = TRUE
        `;
        
        const params = [];
        
        if (department_id && /^\d+$/.test(department_id)) {
            sql += ` AND c.department_id = ?`;
            params.push(department_id);
        }
        
        sql += ` ORDER BY d.name ASC, c.name ASC`;
        
        const [courses] = await db.execute(sql, params);
        
        if (courses.length === 0) {
            return res.json({
                success: true,
                data: [],
                message: 'No active courses found.'
            });
        }
        
        // Fetch fees for all courses in one query
        const courseIds = courses.map(c => c.id);
        const placeholders = courseIds.map(() => '?').join(',');
        
        const [fees] = await db.execute(
            `SELECT 
                course_id, year_of_study, tuition, examination, 
                registration, id_card, other, other_label
            FROM fees 
            WHERE course_id IN (${placeholders})
            ORDER BY course_id, year_of_study`,
            courseIds
        );
        
        // Fetch next intake date for all courses
        const [intakes] = await db.execute(
            `SELECT 
                course_id, intake_date, label
            FROM intake_dates 
            WHERE course_id IN (${placeholders}) 
                AND intake_date >= CURDATE()
            ORDER BY course_id, intake_date ASC`,
            courseIds
        );
        
        // Group fees and intakes by course_id
        const feesMap = {};
        fees.forEach(f => {
            if (!feesMap[f.course_id]) feesMap[f.course_id] = [];
            feesMap[f.course_id].push({
                year_of_study: f.year_of_study,
                tuition: parseFloat(f.tuition),
                examination: parseFloat(f.examination),
                registration: parseFloat(f.registration),
                id_card: parseFloat(f.id_card),
                other: parseFloat(f.other),
                other_label: f.other_label,
                total: parseFloat(f.tuition) + parseFloat(f.examination) + 
                       parseFloat(f.registration) + parseFloat(f.id_card) + 
                       parseFloat(f.other)
            });
        });
        
        const intakeMap = {};
        intakes.forEach(i => {
            if (!intakeMap[i.course_id]) {
                intakeMap[i.course_id] = {
                    date: i.intake_date,
                    label: i.label
                };
            }
        });
        
        // Format response
        const formattedCourses = courses.map(course => ({
            id: course.id,
            name: course.name,
            duration_years: course.duration_years,
            examining_body: course.examining_body,
            cbet_status: course.cbet_status === 1,
            entry_requirements: course.entry_requirements,
            description: course.description,
            department: {
                id: course.department_id,
                name: course.department_name,
                type: course.department_type
            },
            fees: feesMap[course.id] || [],
            next_intake: intakeMap[course.id] || null
        }));
        
        logger.debug('Courses fetched', { 
            count: formattedCourses.length,
            department_id: department_id || 'all'
        });
        
        res.json({
            success: true,
            data: formattedCourses
        });
        
    } catch (error) {
        logger.error('Error fetching courses', {
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({
            success: false,
            message: 'Failed to fetch courses.',
            code: 'SERVER_ERROR'
        });
    }
});

/**
 * GET /api/v1/courses/:id
 * 
 * Returns a single course with full details, fees, and intake dates.
 * 
 * Response:
 *   {
 *     success: true,
 *     data: { 
 *       id, name, duration_years, examining_body, 
 *       department: { id, name },
 *       fees: [...],
 *       intake_dates: [...]
 *     }
 *   }
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID.',
                code: 'INVALID_ID'
            });
        }
        
        // Fetch course with department info
        const [courses] = await db.execute(
            `SELECT 
                c.id,
                c.name,
                c.duration_years,
                c.examining_body,
                c.cbet_status,
                c.entry_requirements,
                c.description,
                d.id AS department_id,
                d.name AS department_name,
                d.type AS department_type,
                d.description AS department_description
            FROM courses c
            JOIN departments d ON c.department_id = d.id
            WHERE c.id = ? AND c.is_active = TRUE`,
            [id]
        );
        
        if (courses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Course not found.',
                code: 'NOT_FOUND'
            });
        }
        
        const course = courses[0];
        
        // Fetch fees
        const [fees] = await db.execute(
            `SELECT 
                year_of_study, tuition, examination, registration, 
                id_card, other, other_label
            FROM fees 
            WHERE course_id = ?
            ORDER BY year_of_study`,
            [id]
        );
        
        // Format fees with total
        const formattedFees = fees.map(f => ({
            year_of_study: f.year_of_study,
            tuition: parseFloat(f.tuition),
            examination: parseFloat(f.examination),
            registration: parseFloat(f.registration),
            id_card: parseFloat(f.id_card),
            other: parseFloat(f.other),
            other_label: f.other_label,
            total: parseFloat(f.tuition) + parseFloat(f.examination) + 
                   parseFloat(f.registration) + parseFloat(f.id_card) + 
                   parseFloat(f.other)
        }));
        
        // Fetch intake dates
        const [intakes] = await db.execute(
            `SELECT intake_date, label
            FROM intake_dates 
            WHERE course_id = ? AND intake_date >= CURDATE()
            ORDER BY intake_date ASC`,
            [id]
        );
        
        const formattedIntakes = intakes.map(i => ({
            date: i.intake_date,
            label: i.label
        }));
        
        // Build response
        const response = {
            id: course.id,
            name: course.name,
            duration_years: course.duration_years,
            examining_body: course.examining_body,
            cbet_status: course.cbet_status === 1,
            entry_requirements: course.entry_requirements,
            description: course.description,
            department: {
                id: course.department_id,
                name: course.department_name,
                type: course.department_type,
                description: course.department_description
            },
            fees: formattedFees,
            intake_dates: formattedIntakes
        };
        
        res.json({
            success: true,
            data: response
        });
        
    } catch (error) {
        logger.error('Error fetching course', {
            error: error.message,
            courseId: req.params.id
        });
        
        res.status(500).json({
            success: false,
            message: 'Failed to fetch course details.',
            code: 'SERVER_ERROR'
        });
    }
});

module.exports = router;