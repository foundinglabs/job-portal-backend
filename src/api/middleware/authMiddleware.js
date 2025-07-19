const { verifySupabaseToken } = require('../../lib/supabaseAuth');
const { query } = require('../../database/connection');

/**
 * Middleware to authenticate and authorize requests.
 * Attaches user information to `req.user`.
 * Checks for specific roles if `requiredRole` is provided.
 */
async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await verifySupabaseToken(token);

    if (!decodedToken || !decodedToken.sub) { // 'sub' is the user ID in JWT payload
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    req.user = { id: decodedToken.sub }; // Store the Supabase user ID

    // Optional: Fetch user's role from your `recruiters` table if needed for authorization
    // and attach to req.user.role
    try {
        const { rows } = await query('SELECT role FROM recruiters WHERE user_id = $1', [req.user.id]);
        if (rows.length > 0) {
            req.user.role = rows[0].role;
        } else {
            // If not a recruiter, they are a regular candidate or unprivileged user
            req.user.role = 'candidate';
        }
    } catch (error) {
        console.error('Error fetching user role:', error);
        req.user.role = 'unknown'; // Default if DB error
    }

    next();
}

/**
 * Middleware to check if the authenticated user has a specific role.
 * @param {string[]} allowedRoles - An array of roles that are allowed to access the route.
 */
function authorizeRoles(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Access denied. User role not determined.' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: `Access denied. Requires one of: ${allowedRoles.join(', ')} roles.` });
        }
        next();
    };
}


module.exports = {
    authMiddleware,
    authorizeRoles
};