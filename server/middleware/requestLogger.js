/**
 * HTTP Request Logging Middleware
 * 
 * Logs every incoming HTTP request with method, URL, status code,
 * response time, and client IP. Essential for debugging API issues
 * and monitoring system health.
 * 
 * @module middleware/requestLogger
 */

const logger = require('../utils/logger');

/**
 * Middleware that logs HTTP requests and responses.
 * Captures start time, then logs on response finish with duration.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function requestLogger(req, res, next) {
    // Record request start time for duration calculation
    const startTime = Date.now();
    
    // Log when response is finished (headers sent)
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        
        // Determine log level based on status code
        const logData = {
            method: req.method,
            url: req.originalUrl || req.url,
            status: statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent') || 'unknown'
        };
        
        // Add user info if authenticated
        if (req.session && req.session.user) {
            logData.userId = req.session.user.id;
            logData.userRole = req.session.user.role;
        }
        
        // Log at appropriate level
        if (statusCode >= 500) {
            logger.error(`${req.method} ${req.originalUrl} → ${statusCode} (${duration}ms)`, logData);
        } else if (statusCode >= 400) {
            logger.warn(`${req.method} ${req.originalUrl} → ${statusCode} (${duration}ms)`, logData);
        } else {
            logger.info(`${req.method} ${req.originalUrl} → ${statusCode} (${duration}ms)`, logData);
        }
    });
    
    next();
}

module.exports = requestLogger;