// src/lib/supabaseAuth.js
const { createClient } = require('@supabase/supabase-js');
const config = require('../config'); // Correctly import config from its dedicated file
const jwt = require('jsonwebtoken');

// Initialize Supabase client for backend with Service Role Key
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: {
        persistSession: false
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

// Correctly export the Supabase client and the verify function
module.exports = {
    verifySupabaseToken,
    supabaseAdminClient: supabase // Export the initialized client as supabaseAdminClient
};