const { createClient } = require('@supabase/supabase-js');
const config = require('../config');
const jwt = require('jsonwebtoken');

// Initialize Supabase client for backend with Service Role Key
// This key allows bypassing RLS, so use it carefully and only for trusted backend operations.
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: {
        persistSession: false // No session persistence on backend
    }
});

/**
 * Verifies a Supabase Access Token (JWT) on the backend.
 * This is crucial for securing your API endpoints.
 * @param {string} token - The access token from the client.
 * @returns {Promise<object|null>} The decoded JWT payload if valid, null otherwise.
 */
async function verifySupabaseToken(token) {
    if (!token) {
        return null;
    }
    try {
        // Option 1: Directly verify the JWT with Supabase's JWT secret
        // This is generally preferred for performance as it doesn't make an external API call
        const decoded = jwt.verify(token, config.supabase.jwtSecret);

        // Optional: You can also use Supabase's built-in token verification if needed,
        // but it requires a network call and is more for testing/debugging.
        // const { data, error } = await supabase.auth.getUser(token);
        // if (error) {
        //     console.error('Supabase Auth token verification error:', error.message);
        //     return null;
        // }
        // return data.user; // Returns user object if valid

        return decoded; // Returns the payload (contains user ID, etc.)
    } catch (error) {
        console.error('JWT verification failed:', error.message);
        return null;
    }
}

/**
 * Retrieves user information from Supabase using the service role key.
 * Use with caution as this bypasses RLS.
 * @param {string} userId - The UUID of the user.
 * @returns {Promise<object|null>} The user object from Supabase auth.users table.
 */
async function getUserById(userId) {
    try {
        const { data: user, error } = await supabase.from('users').select('*').eq('id', userId).single(); // Assuming 'users' for simplicity, actual is 'auth.users'

        // Note: Direct access to auth.users from `supabase.from` might not work without `service_role_key`
        // or specific RLS. The `supabase.auth.admin` client might be needed for admin-level operations.
        // For JWT verification, `jwt.verify` is usually enough.

        if (error) {
            console.error('Error fetching user from Supabase:', error.message);
            return null;
        }
        return user;
    } catch (error) {
        console.error('Error in getUserById:', error.message);
        return null;
    }
}


module.exports = {
    verifySupabaseToken,
    // If you need to perform admin-level actions on Supabase Auth users:
    // supabaseAdmin: supabase.auth.admin, // Use with extreme caution
};