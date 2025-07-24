// src/services/AuthService.js
const { supabaseAdminClient } = require('../lib/supabaseAuth'); // Correctly import from its dedicated file
const config = require('../config'); // Correctly import config from its dedicated file
const { query } = require('../database/connection');
const CompanyRepository = require('../database/repositories/CompanyRepository');
const { AuthApiError } = require('@supabase/supabase-js');

class AuthService {
    /**
     * Handles user login, whether via email/password or social token (from frontend OAuth).
     * @param {string} [email] - User's email (for email/password login).
     * @param {string} [password] - User's password (for email/password login).
     * @param {string} [token] - Supabase access token (for social logins completed on frontend).
     * @param {string} [provider] - Social provider ('google', 'linkedin').
     * @returns {Promise<object>} Contains user and session data from Supabase.
     * @throws {Error} If login fails.
     */
    static async login(email, password, token, provider) {
        let authResponse;

        if (provider && token) {
            const { data, error } = await supabaseAdminClient.auth.getUser(token);
            if (error || !data.user) {
                throw new Error('Social login token invalid or user not found: ' + (error ? error.message : ''));
            }
            authResponse = { data: { user: data.user, session: { access_token: token } } };
        } else if (email && password) {
            const { data, error } = await supabaseAdminClient.auth.signInWithPassword({ email, password });
            if (error) {
                throw new Error(error.message);
            }
            authResponse = { data: { user: data.user, session: data.session } };
        } else {
            throw new Error('Invalid login credentials or missing social token/provider.');
        }

        if (!authResponse.data || !authResponse.data.user) {
            throw new Error('Login failed: No user data returned.');
        }

        return authResponse.data;
    }

    /**
     * Handles candidate sign-up. Creates a user in Supabase Auth.
     * @param {string} [email] - User's email (for email/password signup).
     * @param {string} [password] - User's password (for email/password signup).
     * @param {string} [token] - Supabase access token (for social signups completed on frontend).
     * @param {string} [provider] - Social provider ('google', 'linkedin').
     * @returns {Promise<object>} Contains new user's ID and email, and their initial role.
     * @throws {Error} If signup fails.
     */
    static async signupCandidate(email, password, token, provider) {
        let userId;
        let userEmail = email;

        if (provider && token) {
            const { data, error } = await supabaseAdminClient.auth.getUser(token);
            if (error || !data.user) {
                throw new Error('Social sign up failed or user not found: ' + (error ? error.message : ''));
            }
            userId = data.user.id;
            userEmail = data.user.email;
        } else if (email && password) {
            const { data, error } = await supabaseAdminClient.auth.signUp({ email, password });
            if (error) {
                if (error instanceof AuthApiError && error.status === 422) {
                    throw new Error('User with this email already exists.');
                }
                throw new Error(error.message);
            }
            if (!data.user) {
                 throw new Error('Email signup failed: No user data returned.');
            }
            userId = data.user.id;
        } else {
            throw new Error('Invalid signup credentials or social token.');
        }

        if (!userId) {
            throw new Error('Failed to get user ID during candidate signup.');
        }

        return { id: userId, email: userEmail, role: 'candidate' };
    }

    /**
     * Handles recruiter sign-up. Creates a user in Supabase Auth,
     * creates/links a company, and creates a recruiter entry.
     * @param {string} [email] - User's email.
     * @param {string} [password] - User's password.
     * @param {string} [token] - Supabase access token (for social signups).
     * @param {string} [provider] - Social provider.
     * @param {object} companyData - {name, website, description, logo_url}
     * @returns {Promise<object>} Contains new recruiter's data and their role/company_id.
     * @throws {Error} If signup fails.
     */
    static async signupRecruiter(email, password, token, provider, companyData) {
        let userId;
        let userEmail = email;
        let companyId;

        // 1. Authenticate / Register user in Supabase Auth (Unified logic)
        if (provider && token) {
            const { data, error } = await supabaseAdminClient.auth.getUser(token);
            if (error || !data.user) {
                throw new Error('Social sign up failed or user not found: ' + (error ? error.message : ''));
            }
            userId = data.user.id;
            userEmail = data.user.email;
        } else if (email && password) {
            const { data, error } = await supabaseAdminClient.auth.signUp({ email, password });
            if (error) {
                if (error instanceof AuthApiError && error.status === 422) {
                    throw new Error('User with this email already exists.');
                }
                throw new Error(error.message);
            }
            if (!data.user) {
                 throw new Error('Email signup failed: No user data returned.');
            }
            userId = data.user.id;
        } else {
            throw new Error('Invalid signup credentials or social token.');
        }

        if (!userId) {
            throw new Error('Failed to get user ID during recruiter signup.');
        }

        // 2. Create or Link Company
        if (!companyData || !companyData.name || !companyData.website) {
            throw new Error('Company name and website are required for recruiter signup.');
        }

        let existingCompany = await CompanyRepository.findByNameOrWebsite(companyData.name, companyData.website);

        if (existingCompany) {
            companyId = existingCompany.id;
        } else {
            const newCompany = await CompanyRepository.create(companyData);
            companyId = newCompany.id;
        }

        // 3. Create Recruiter Profile in your `recruiters` table
        try {
            const { rows } = await query(
                `INSERT INTO recruiters (user_id, company_id, role, full_name)
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [userId, companyId, 'recruiter', userEmail]
            );
            return { recruiter: rows[0], role: 'recruiter', company_id: companyId };
        } catch (dbError) {
            if (dbError.code === '23505') {
                throw new Error('This user is already registered as a recruiter.');
            }
            console.error('Error inserting into recruiters table:', dbError);
            throw new Error('Failed to create recruiter profile due to database error.');
        }
    }

    /**
     * Verifies a Supabase Access Token (JWT) on the backend using the JWT secret.
     * Used by authMiddleware.
     * @param {string} token - The Supabase access token.
     * @returns {Promise<object|null>} Decoded user payload or null.
     */
    static async verifyAccessToken(token) {
        if (!token) {
            return null;
        }
        try {
            const decoded = jwt.verify(token, config.supabase.jwtSecret);
            return decoded;
        } catch (error) {
            return null;
        }
    }
}

module.exports = AuthService;