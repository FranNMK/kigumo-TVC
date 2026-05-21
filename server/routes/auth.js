/**
 * Authentication Routes
 * 
 * Handles user login, logout, and session management.
 * Implements rate limiting and secure session practices.
 * 
 * @module routes/auth
 * @requires express
 * @requires bcryptjs
 * @requires express-rate-limit
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const db = require('../db');
const logger = require('../utils/logger');

/**
 * Rate limiter for login attempts.
 * Allows maximum 5 attempts per IP address per 15-minute window.
 * Returns 429 Too Many Requests when exceeded.
 * 
 * Uses express-rate-limit's built-in IP detection which properly
 * handles both IPv4 and IPv6 addresses, including IPv6-mapped IPv4.
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per window
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 15 minutes.',
        code: 'RATE_LIMIT'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // No custom keyGenerator - library default handles IPv4/IPv6 securely
});
/**
 * POST /api/v1/auth/login
 * 
 * Authenticates a user with student registration number OR email,
 * and password (phone number).
 * 
 * Request body:
 *   - identifier: String (student reg_number OR staff email)
 *   - password: String (user's phone number)
 * 
 * Response (200):
 *   {
 *     success: true,
 *     role: "student"|"lecturer"|"hod"|"deputy_principal"|"chief_principal"|"admin",
 *     redirectUrl: "/portal/student-dashboard.html",
 *     user: { id, full_name, email, reg_number, role, photo_path }
 *   }
 * 
 * Response (401):
 *   { success: false, message: "Invalid credentials", code: "AUTH_FAILED" }
 * 
 * Security notes:
 *   - Password is never returned in response
 *   - Error message is intentionally vague to prevent user enumeration
 *   - Rate limited to 5 attempts per 15 minutes per IP
 */
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { identifier, password } = req.body;
        
        // Validate input presence
        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide your admission number/email and password.',
                code: 'MISSING_FIELDS'
            });
        }
        
        // Trim whitespace from inputs
        const trimmedIdentifier = identifier.trim();
        const trimmedPassword = password.trim();
        
        // Validate minimum lengths
        if (trimmedIdentifier.length < 3 || trimmedPassword.length < 4) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials format.',
                code: 'INVALID_FORMAT'
            });
        }
        
        let user = null;
        
        /**
         * Step 1: Determine if identifier is a student reg_number or email.
         * 
         * Student reg_number format: DICT/2501/1712 or similar
         * Pattern: uppercase letters, forward slash, 4 digits, forward slash, digits
         */
        const studentRegPattern = /^[A-Z]+\/\d{4}\/\d+$/i;
        const isStudentRegNumber = studentRegPattern.test(trimmedIdentifier);
        
        if (isStudentRegNumber) {
            // Query by student registration number
            const [rows] = await db.execute(
                `SELECT id, full_name, email, reg_number, password, role, 
                        primary_department_id, year_of_study, photo_path, is_active
                 FROM users 
                 WHERE reg_number = ? AND is_active = TRUE`,
                [trimmedIdentifier]
            );
            
            if (rows.length === 0) {
                // Log failed attempt (in production, use proper logging)
                logAuthAttempt(trimmedIdentifier, req.ip, false);
                
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials.',
                    code: 'AUTH_FAILED'
                });
            }
            
            user = rows[0];
        } else {
            // Query by email (for staff and admin users)
            const [rows] = await db.execute(
                `SELECT id, full_name, email, reg_number, password, role, 
                        primary_department_id, year_of_study, photo_path, is_active
                 FROM users 
                 WHERE email = ? AND is_active = TRUE`,
                [trimmedIdentifier]
            );
            
            if (rows.length === 0) {
                // Log failed attempt
                logAuthAttempt(trimmedIdentifier, req.ip, false);
                
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials.',
                    code: 'AUTH_FAILED'
                });
            }
            
            user = rows[0];
        }
        
        /**
         * Step 2: Verify password using bcrypt.
         * Password is the user's phone number, stored as bcrypt hash.
         * bcrypt.compare handles the comparison securely.
         */
        const isPasswordValid = await bcrypt.compare(trimmedPassword, user.password);
        
        if (!isPasswordValid) {
            // Log failed attempt
            logAuthAttempt(trimmedIdentifier, req.ip, false);
            
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.',
                code: 'AUTH_FAILED'
            });
        }
        
        /**
         * Step 3: Authentication successful - create session.
         * Store minimal user data in session for subsequent requests.
         * Never store password hash in session.
         */
        req.session.user = {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            reg_number: user.reg_number,
            role: user.role,
            primary_department_id: user.primary_department_id,
            year_of_study: user.year_of_study,
            photo_path: user.photo_path
        };
        
        // Log successful attempt
        logAuthAttempt(trimmedIdentifier, req.ip, true);
        
        /**
         * Step 4: Determine redirect URL based on user role.
         * Frontend uses this to navigate to appropriate dashboard.
         */
        let redirectUrl = '/portal/login.html'; // Default fallback
        
        switch (user.role) {
            case 'student':
                redirectUrl = '/portal/student-dashboard.html';
                break;
            case 'lecturer':
            case 'hod':
                redirectUrl = '/portal/lecturer-dashboard.html';
                break;
            case 'deputy_principal':
            case 'chief_principal':
                redirectUrl = '/portal/management-dashboard.html';
                break;
            case 'admin':
                redirectUrl = '/portal/admin/dashboard.html';
                break;
            default:
                redirectUrl = '/portal/login.html';
        }
        
        // Return success response with user info (excluding password)
        res.status(200).json({
            success: true,
            role: user.role,
            redirectUrl: redirectUrl,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                reg_number: user.reg_number,
                role: user.role,
                primary_department_id: user.primary_department_id,
                year_of_study: user.year_of_study,
                photo_path: user.photo_path
            }
        });
        
    } catch (error) {
        // Log the error internally but return generic message to client
        logger.error('Login error', { error: error.message, stack: error.stack });
        
        res.status(500).json({
            success: false,
            message: 'An internal error occurred. Please try again later.',
            code: 'SERVER_ERROR'
        });
    }
});

/**
 * POST /api/v1/auth/logout
 * 
 * Destroys the user session and clears session cookie.
 * No request body required.
 * 
 * Response (200):
 *   { success: true, message: "Logged out successfully" }
 */
router.post('/logout', (req, res) => {
    // Destroy session if it exists
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Error logging out. Please try again.',
                    code: 'LOGOUT_ERROR'
                });
            }
            
            // Clear the session cookie
            res.clearCookie('connect.sid', {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
            
            res.status(200).json({
                success: true,
                message: 'Logged out successfully.'
            });
        });
    } else {
        // No active session
        res.status(200).json({
            success: true,
            message: 'No active session to log out from.'
        });
    }
});

/**
 * GET /api/v1/auth/me
 * 
 * Returns current authenticated user's session data.
 * Requires authentication.
 * Useful for frontend to verify session is still valid after page refresh.
 * 
 * Response (200):
 *   { success: true, user: { id, full_name, email, role, ... } }
 * 
 * Response (401):
 *   { success: false, message: "Not authenticated" }
 */
router.get('/me', (req, res) => {
    if (req.session && req.session.user) {
        return res.status(200).json({
            success: true,
            user: req.session.user
        });
    }
    
    res.status(401).json({
        success: false,
        message: 'Not authenticated.',
        code: 'AUTH_REQUIRED'
    });
});


/**
 * Simple authentication attempt logger using centralized logger.
 * 
 * @param {string} identifier - The identifier used in login attempt
 * @param {string} ip - The IP address of the client
 * @param {boolean} success - Whether authentication was successful
 * @returns {void}
 */
function logAuthAttempt(identifier, ip, success) {
    if (success) {
        logger.info('Login successful', {
            identifier: identifier.substring(0, 3) + '***', // Partial masking
            ip: ip
        });
    } else {
        logger.warn('Login failed', {
            identifier: identifier.substring(0, 3) + '***', // Partial masking
            ip: ip
        });
    }
}
module.exports = router;