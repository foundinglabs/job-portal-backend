// src/database/repositories/RecruiterRepository.js

const { query } = require('../connection');

class RecruiterRepository {
    /**
     * Creates a new recruiter profile.
     * @param {object} recruiterData - The recruiter details.
     * @param {string} recruiterData.user_id - The Supabase user ID.
     * @param {string} recruiterData.company_id - The ID of the company they belong to.
     * @param {string} recruiterData.role - The recruiter's role (e.g., 'recruiter', 'admin').
     * @param {string} [recruiterData.full_name] - The recruiter's full name.
     * @param {string} [recruiterData.phone] - The recruiter's phone number.
     * @param {string} [recruiterData.linkedin_profile_url] - The recruiter's LinkedIn profile URL.
     * @returns {Promise<object>} The newly created recruiter profile.
     * @throws {Error} If creation fails (e.g., duplicate user_id).
     */
    static async create(recruiterData) {
        const { user_id, company_id, role, full_name, phone, linkedin_profile_url } = recruiterData;
        try {
            const { rows } = await query(
                `INSERT INTO recruiters (user_id, company_id, role, full_name, phone, linkedin_profile_url, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
                [user_id, company_id, role, full_name, phone, linkedin_profile_url]
            );
            return rows[0];
        } catch (error) {
            console.error('Error creating recruiter profile:', error);
            if (error.code === '23505') { // Unique violation for user_id (primary key)
                const conflictError = new Error('A recruiter profile already exists for this user ID.');
                conflictError.statusCode = 409;
                throw conflictError;
            }
            throw new Error('Could not create recruiter profile.');
        }
    }

    /**
     * Finds a recruiter profile by user ID.
     * @param {string} userId - The Supabase user ID.
     * @returns {Promise<object|null>} The recruiter profile if found, otherwise null.
     */
    static async findByUserId(userId) {
        try {
            const { rows } = await query('SELECT * FROM recruiters WHERE user_id = $1', [userId]);
            return rows[0];
        } catch (error) {
            console.error('Error finding recruiter by user ID:', error);
            throw new Error('Could not retrieve recruiter profile.');
        }
    }

    /**
     * Finds a recruiter's profile along with their company name and website.
     * @param {string} userId - The ID of the recruiter user.
     * @returns {Promise<object|null>} Recruiter profile object with company name and website.
     */
    static async findProfileWithCompany(userId) {
        try {
            const { rows } = await query(
                `SELECT
                    r.user_id,
                    r.full_name as recruiter_name,
                    c.id as company_id,
                    c.name as company_name,
                    c.website as company_website
                FROM
                    recruiters r
                JOIN
                    companies c ON r.company_id = c.id
                WHERE
                    r.user_id = $1`,
                [userId]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error fetching recruiter profile with company details:', error);
            throw new Error('Could not retrieve recruiter profile.');
        }
    }
    // Add other methods like update, delete, etc. as needed
}

module.exports = RecruiterRepository;