// src/lib/supabaseAuth.js
const { createClient } = require('@supabase/supabase-js');
const config = require('../config');
const jwt = require('jsonwebtoken'); // Needed for verifySupabaseToken

// Initialize Supabase client for backend with Service Role Key
// This client is primarily used for general operations and to get the admin client.
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
        const decoded = jwt.verify(token, config.supabase.jwtSecret);
        return decoded;
    } catch (error) {
        console.error('JWT verification failed:', error.message);
        return null;
    }
}

// Correctly export the Supabase client's admin object for admin-level operations
// This grants access to methods like auth.admin.updateUserById
module.exports = {
    verifySupabaseToken,
    // CHANGED: Export supabase.auth.admin to access admin functions directly
    supabaseAdminClient: supabase.auth.admin
};