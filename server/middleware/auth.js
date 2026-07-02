/**
 * Authentication and Authorization Middleware
 * 
 * Handles session-based authentication and role-based access control.
 * Must be applied to all protected routes BEFORE any business logic.
 * 
 * @module middleware/auth
 * @requires express-session
 */

/**
 * Checks if user is authenticated via session.
 * Must be called BEFORE hasRole middleware.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void} - Calls next() if authenticated, returns 401 JSON if not
 */
const isAuthenticated = (req, res, next) => {
    // Check if session exists and contains user object
    if (req.session && req.session.user) {
        // User is authenticated, proceed to next middleware/route
        return next();
    }

    // Authentication failed - return 401 Unauthorized
    // Never redirect here; frontend handles navigation based on response
    res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to continue.',
        code: 'AUTH_REQUIRED'
    });
};

/**
 * Checks if authenticated user has one of the allowed roles.
 * MUST be called AFTER isAuthenticated middleware.
 * Uses currying to accept allowed roles and return middleware function.
 * 
 * @param {...string} roles - Variable number of allowed role names
 * @returns {Function} Middleware function that checks user role
 * 
 * @example
 * // Allow only admin access
 * router.get('/admin/users', isAuthenticated, hasRole('admin'), handler);
 * 
 * @example
 * // Allow multiple roles
 * router.get('/materials', isAuthenticated, hasRole('lecturer', 'hod', 'admin'), handler);
 */
const hasRole = (...roles) => {
    return (req, res, next) => {
        // This middleware assumes isAuthenticated has already run
        // and req.session.user exists
        const userRole = req.session.user.role;

        // Check if user's role is in the allowed roles list
        if (roles.includes(userRole)) {
            // Role is authorized, proceed
            return next();
        }

        // Role not authorized - return 403 Forbidden
        // Do NOT reveal which roles are allowed (security best practice)
        res.status(403).json({
            success: false,
            message: 'You do not have permission to access this resource.',
            code: 'FORBIDDEN'
        });
    };
};

/**
 * Middleware to extract and attach user's department ID for scoped queries.
 * Must be called AFTER isAuthenticated.
 * Useful for routes where users should only see their own department data.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const withDepartment = (req, res, next) => {
    if (req.session.user.primary_department_id) {
        req.userDepartmentId = req.session.user.primary_department_id;
        return next();
    }

    // If user has no department (shouldn't happen with proper data)
    res.status(400).json({
        success: false,
        message: 'User department not found.',
        code: 'DEPT_REQUIRED'
    });
};

/**
 * Middleware to check if HOD is assigned to the department they're managing.
 * Must be called AFTER isAuthenticated and withDepartment.
 * Only allows HOD role; returns 403 for others.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const isHodOfDepartment = (req, res, next) => {
    // This middleware expects req.userDepartmentId to be set
    // and req.session.user to exist with role 'hod'
    if (req.session.user.role !== 'hod') {
        return res.status(403).json({
            success: false,
            message: 'Only Heads of Departments can perform this action.',
            code: 'HOD_REQUIRED'
        });
    }

    // HOD is authorized for their department
    next();
};

// === Innovation Portal Guards ===

const isInnovationAuthenticated = (req, res, next) => {
    if (req.session && req.session.innovationUser) {
        req.innovationUser = req.session.innovationUser;
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized - Please log in to the Innovation Portal' });
};

const isInnovationAdmin = (req, res, next) => {
    if (req.innovationUser && req.innovationUser.role === 'admin') {
        return next();
    }
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
};

const isInnovationCoordinator = (req, res, next) => {
    if (req.innovationUser && req.innovationUser.role === 'coordinator') {
        return next();
    }
    return res.status(403).json({ error: 'Forbidden - Coordinator access required' });
};

module.exports = {
    // ... existing exports
    isInnovationAuthenticated,
    isInnovationAdmin,
    isInnovationCoordinator
};

module.exports = {
    isAuthenticated,
    hasRole,
    withDepartment,
    isHodOfDepartment,
    // ADD THESE NEW ONES:
    isInnovationAuthenticated,
    isInnovationAdmin,
    isInnovationCoordinator
};