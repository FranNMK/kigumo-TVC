/**
 * Database Query Logger
 * 
 * Wraps database pool to log all SQL queries with execution time.
 * Helps identify slow queries and debug database issues.
 * Only active when LOG_LEVEL=DEBUG or NODE_ENV=development.
 * 
 * @module utils/dbLogger
 */

const logger = require('./logger');

/**
 * Creates a logging wrapper around a database pool.
 * Intercepts execute() calls to log query and duration.
 * 
 * @param {Object} pool - MySQL2 promise pool instance
 * @returns {Object} Wrapped pool with logging
 */
function wrapPoolWithLogging(pool) {
    const originalExecute = pool.execute.bind(pool);
    
    pool.execute = async function(sql, params) {
        const startTime = Date.now();
        
        try {
            const result = await originalExecute(sql, params);
            const duration = Date.now() - startTime;
            
            // Truncate long SQL for readability
            const truncatedSql = sql.length > 200 
                ? sql.substring(0, 200).replace(/\s+/g, ' ') + '...' 
                : sql.replace(/\s+/g, ' ');
            
            logger.debug(`DB Query (${duration}ms): ${truncatedSql}`, {
                duration: `${duration}ms`,
                params: params ? (Array.isArray(params) ? params : [params]) : [],
                rowCount: Array.isArray(result) ? result[0]?.length : 'unknown'
            });
            
            // Warn on slow queries (> 1000ms)
            if (duration > 1000) {
                logger.warn(`SLOW QUERY (${duration}ms): ${truncatedSql}`, {
                    duration: `${duration}ms`,
                    params: params
                });
            }
            
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            
            logger.error(`DB Query Failed (${duration}ms): ${sql.substring(0, 200)}`, {
                error: error.message,
                code: error.code,
                params: params,
                duration: `${duration}ms`
            });
            
            throw error; // Re-throw for route handler to catch
        }
    };
    
    return pool;
}

module.exports = { wrapPoolWithLogging };