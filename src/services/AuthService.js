// This service primarily encapsulates interactions with Supabase Auth or token handling.
// For dedicated backend, most login/signup happens on frontend via Supabase SDK.
// Backend's role is to verify the token sent from frontend.
const { verifySupabaseToken } = require('../lib/supabaseAuth');

class AuthService {
    /**
     * Verifies if the provided access token is valid and returns user info.
     * This is used by the authMiddleware.
     * @param {string} token - The Supabase access token.
     * @returns {Promise<object|null>} Decoded user payload or null.
     */
    static async verifyAccessToken(token) {
        return verifySupabaseToken(token);
    }

    // You might add functions here if your backend needs to interact with
    // Supabase Auth Admin API (e.g., creating users directly, managing roles).
    // For MVP, relying on frontend + token verification is sufficient.
}

module.exports = AuthService;