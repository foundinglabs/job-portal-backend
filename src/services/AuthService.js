// src/services/AuthService.js
const { supabaseAdminClient } = require('../lib/supabaseAuth'); // Correctly import the admin client
const config = require('../config');
const { query } = require('../database/connection');
const CompanyRepository = require('../database/repositories/CompanyRepository');
const RecruiterRepository = require('../database/repositories/RecruiterRepository');
const CandidateProfileRepository = require('../database/repositories/CandidateProfileRepository');
const { AuthApiError } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

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
     * @param {object} signupDetails - Object containing all signup details.
     * @param {string} signupDetails.email - User's email.
     * @param {string} signupDetails.password - User's password.
     * @param {string} signupDetails.confirmPassword - Confirmation of user's password.
     * @param {string} signupDetails.userId - Supabase user ID from frontend signup.
     * @param {string} [signupDetails.token] - Supabase access token (for social signups completed on frontend).
     * @param {string} [signupDetails.provider] - Social provider ('google', 'linkedin').
     * @returns {Promise<object>} Contains new user's ID and email, and their initial role.
     * @throws {Error} If signup fails.
     */
    static async signupCandidate({ email, password, confirmPassword, userId, token, provider }) {
        // 1. Password and confirmPassword validation
        if (password !== confirmPassword) {
            const error = new Error('Password and confirm password do not match.');
            error.statusCode = 400; // Bad Request
            throw error;
        }

        // 2. Confirm user's email via service role key (bypasses email confirmation)
        try {
            // CRITICAL CHANGE: Access getUserByEmail via .users
            const { data: userByEmailData, error: userByEmailError } = await supabaseAdminClient.users.getUserByEmail(email);
            if (userByEmailError || !userByEmailData.user) {
                console.error('Error fetching user by email for confirmation:', userByEmailError?.message);
                throw new Error('Failed to retrieve user for email confirmation.');
            }
            const actualUserId = userByEmailData.user.id; // Use the ID from this reliable source

            // CRITICAL CHANGE: Access updateUserById via .users
            const { data: updateData, error: updateError } = await supabaseAdminClient.users.updateUserById(
                actualUserId, // Use the actual UUID from getUserByEmail
                { email_confirm: true } // This marks the email as confirmed
            );
            if (updateError) {
                console.error('Error confirming candidate email via backend service role:', updateError.message);
                throw new Error('Failed to confirm candidate email after signup.');
            }
            console.log(`Candidate user ${actualUserId} email confirmed by backend service role.`);
            
            // Update userId to the actualUserId for subsequent operations
            userId = actualUserId;

        } catch (updateUserError) {
            console.error('Exception during candidate email confirmation:', updateUserError.message);
            throw updateUserError;
        }

        // 3. Create Candidate Profile in your `candidate_profiles` table
        try {
            const newCandidateProfile = await CandidateProfileRepository.create({
                user_id: userId,
                email: email,
                full_name: email.split('@')[0]
            });
            return { candidate: newCandidateProfile, role: 'candidate' };
        } catch (dbError) {
            if (dbError.code === '23505') {
                throw new Error('A candidate profile with this email or user ID already exists.');
            }
            console.error('Error inserting into candidate_profiles table:', dbError);
            throw new Error('Failed to create candidate profile due to database error.');
        }
    }

    /**
     * Handles recruiter sign-up. Creates a user in Supabase Auth,
     * creates/links a company, and creates a recruiter entry.
     * @param {object} signupDetails - Object containing all signup details.
     * @param {string} signupDetails.email - User's email.
     * @param {string} signupDetails.password - User's password.
     * @param {string} signupDetails.confirmPassword - Confirmation of user's password.
     * @param {string} signupDetails.userId - Supabase user ID from frontend signup.
     * @param {string} [signupDetails.token] - Supabase access token (for social signups).
     * @param {string} [signupDetails.provider] - Social provider.
     * @param {string} signupDetails.companyName - Company name.
     * @param {string} [signupDetails.companyWebsite] - Company website.
     * @param {string} [signupDetails.companyDescription] - Company description.
     * @param {string} [signupDetails.companyLogoUrl] - Company logo URL.
     * @returns {Promise<object>} Contains new recruiter's data and their role/company_id.
     * @throws {Error} If signup fails.
     */
    static async signupRecruiter({ email, password, confirmPassword, userId, token, provider, companyName, companyWebsite, companyDescription, companyLogoUrl }) {
        let userEmail = email;
        let companyId;

        // 1. Password and confirmPassword validation
        if (password !== confirmPassword) {
            const error = new Error('Password and confirm password do not match.');
            error.statusCode = 400;
            throw error;
        }

        // 2. Confirm user's email via service role key (bypasses email confirmation)
        try {
            // CRITICAL CHANGE: Access getUserByEmail via .users
            const { data: userByEmailData, error: userByEmailError } = await supabaseAdminClient.users.getUserByEmail(email);
            if (userByEmailError || !userByEmailData.user) {
                console.error('Error fetching user by email for confirmation:', userByEmailError?.message);
                throw new Error('Failed to retrieve user for email confirmation.');
            }
            const actualUserId = userByEmailData.user.id; // Use the ID from this reliable source

            // CRITICAL CHANGE: Access updateUserById via .users
            const { data: updateData, error: updateError } = await supabaseAdminClient.users.updateUserById(
                actualUserId, // Use the actual UUID from getUserByEmail
                { email_confirm: true } // This marks the email as confirmed
            );
            if (updateError) {
                console.error('Error confirming recruiter email via backend service role:', updateError.message);
                throw new Error('Failed to confirm recruiter email after signup.');
            }
            console.log(`Recruiter user ${actualUserId} email confirmed by backend service role.`);

            // Update userId to the actualUserId for subsequent operations
            userId = actualUserId;

        } catch (updateUserError) {
            console.error('Exception during recruiter email confirmation:', updateUserError.message);
            throw updateUserError;
        }

        // 3. Create or Link Company
        if (!companyName) {
            throw new Error('Company name is required for recruiter signup.');
        }

        let existingCompany = await CompanyRepository.findByName(companyName);

        if (existingCompany) {
            companyId = existingCompany.id;
        } else {
            const newCompany = await CompanyRepository.create({
                name: companyName,
                website: companyWebsite,
                description: companyDescription,
                logo_url: companyLogoUrl
            });
            companyId = newCompany.id;
        }

        // 4. Create Recruiter Profile in your `recruiters` table
        try {
            const newRecruiterProfile = await RecruiterRepository.create({
                user_id: userId,
                company_id: companyId,
                role: 'recruiter',
                full_name: userEmail // userEmail as full_name for simplicity
            });
            return { recruiter: newRecruiterProfile, role: 'recruiter', company_id: companyId };
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
            console.error('JWT verification failed:', error.message);
            return null;
        }
    }

    /**
     * Retrieves user role and company ID from your database.
     * @param {string} userId - The Supabase user ID.
     * @returns {Promise<object|null>} Object with role and company_id, or null.
     */
    static async getUserRoleAndCompanyId(userId) {
        try {
            const recruiterQuery = await query('SELECT role, company_id FROM recruiters WHERE user_id = $1', [userId]);
            if (recruiterQuery.rows.length > 0) {
                return { role: recruiterQuery.rows[0].role, company_id: recruiterQuery.rows[0].company_id };
            }

            const candidateQuery = await query('SELECT user_id FROM candidate_profiles WHERE user_id = $1', [userId]);
            if (candidateQuery.rows.length > 0) {
                return { role: 'candidate', company_id: null };
            }

            return { role: 'authenticated', company_id: null };

        } catch (error) {
            console.error('Error fetching user role and company ID:', error);
            throw new Error('Failed to retrieve user role information.');
        }
    }
}

module.exports = AuthService;