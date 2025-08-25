const { verifySupabaseToken } = require('../../lib/supabaseAuth');
const { query } = require('../../database/connection');

/**
 * Middleware to authenticate and authorize requests.
 * Attaches user information (id, email, role, company_id) to `req.user`.
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

    // Store basic Supabase user info from the token
    req.user = { id: decodedToken.sub, email: decodedToken.email };

    try {
        // Attempt to find user in recruiters table to determine role and company_id
        const { rows } = await query('SELECT role, company_id FROM recruiters WHERE user_id = $1', [req.user.id]);
        if (rows.length > 0) {
            req.user.role = rows[0].role;
            req.user.company_id = rows[0].company_id; // <-- CRITICAL ADDITION
        } else {
            // If not found in recruiters, they are a candidate by default
            req.user.role = 'candidate';
            req.user.company_id = undefined; // Ensure it's explicitly undefined for candidates
        }
    } catch (error) {
        console.error('Error fetching user role and company ID from DB:', error);
        req.user.role = 'unknown'; // Fallback role if DB error
        req.user.company_id = undefined;
    }

    next();
}

/**
 * Middleware to check if the authenticated user has one of the required roles.
 * @param {string[]} allowedRoles - An array of roles that are allowed to access the route.
 */
function authorizeRoles(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Access denied. User role not determined or not authenticated.' });
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