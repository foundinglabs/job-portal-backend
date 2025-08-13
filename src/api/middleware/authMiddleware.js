const { verifySupabaseToken } = require('../../lib/supabaseAuth');
const { query } = require('../../database/connection');

/**
 * Middleware to authenticate and authorize requests.
 * Attaches user information to `req.user`.
 */
async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await verifySupabaseToken(token);

    if (!decodedToken || !decodedToken.sub) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    req.user = { id: decodedToken.sub };

    try {
        // Fetch user email from the Supabase auth.users table
        const userEmailQuery = await query('SELECT email FROM auth.users WHERE id = $1', [req.user.id]);
        if (userEmailQuery.rows.length > 0) {
            req.user.email = userEmailQuery.rows[0].email;
        } else {
            console.error('User not found in auth.users table:', req.user.id);
            return res.status(401).json({ message: 'User not found.' });
        }

        // Fetch user's role from your `recruiters` table
        const roleQuery = await query('SELECT role FROM recruiters WHERE user_id = $1', [req.user.id]);
        if (roleQuery.rows.length > 0) {
            req.user.role = roleQuery.rows[0].role;
        } else {
            req.user.role = 'candidate';
        }
    } catch (error) {
        console.error('Error fetching user details in authMiddleware:', error);
        return res.status(500).json({ message: 'Failed to authenticate user.' });
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