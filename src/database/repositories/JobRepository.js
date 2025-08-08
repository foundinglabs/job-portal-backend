const { query } = require('../connection');
const Job = require('../models/Job');

class JobRepository {
    /**
     * Finds all active jobs, optionally filtered by role (title), location, type, or experience level.
     * @param {object} filters - An object containing filters (e.g., { role, location, type, experience }).
     * @returns {Promise<Job[]>} An array of Job objects.
     */
    static async findAll(filters = {}) {
        let queryString = `SELECT * FROM jobs WHERE is_active = TRUE`;
        const params = [];
        let paramIndex = 1;

        if (filters.role) {
            queryString += ` AND title ILIKE $${paramIndex++}`;
            params.push(`%${filters.role}%`);
        }
        if (filters.location) {
            queryString += ` AND location ILIKE $${paramIndex++}`;
            params.push(`%${filters.location}%`);
        }
        if (filters.type) {
            queryString += ` AND job_type = $${paramIndex++}`;
            params.push(filters.type);
        }
        if (filters.experience) {
            queryString += ` AND experience_level = $${paramIndex++}`;
            params.push(filters.experience);
        }

        queryString += ` ORDER BY created_at DESC`;

        const { rows } = await query(queryString, params);
        return rows.map(row => new Job(row));
    }

     /**
     * Finds all active jobs for a specific company ID.
     * @param {string} companyId - The UUID of the company.
     * @returns {Promise<Job[]>} An array of Job objects for the given company.
     */
    static async findByCompanyId(companyId) {
        try {
            const { rows } = await query('SELECT * FROM jobs WHERE company_id = $1 AND is_active = TRUE ORDER BY created_at DESC', [companyId]);
            return rows.map(row => new Job(row));
        } catch (error) {
            console.error('Error finding jobs by company ID:', error);
            throw new Error('Could not retrieve jobs for this company.');
        }
    }
    

    /**
     * Finds an active job by its ID.
     * @param {string} id - The ID of the job.
     * @returns {Promise<Job|null>} The Job object if found and active, otherwise null.
     */
    static async findById(id) {
        const { rows } = await query('SELECT * FROM jobs WHERE id = $1 AND is_active = TRUE', [id]);
        return rows[0] ? new Job(rows[0]) : null;
    }

    /**
     * Creates a new job in the database.
     * @param {object} jobData - An object containing job details.
     * @returns {Promise<Job>} The newly created Job object.
     */
    static async create(jobData) {
        const { company_id, posted_by_recruiter_id, title, description, skills_required, experience_level, location, job_type, salary_range_min, salary_range_max, external_apply_link, application_mode } = jobData;
        const { rows } = await query(
            `INSERT INTO jobs (company_id, posted_by_recruiter_id, title, description, skills_required, experience_level, location, job_type, salary_range_min, salary_range_max, external_apply_link, application_mode)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [company_id, posted_by_recruiter_id, title, description, skills_required, experience_level, location, job_type, salary_range_min, salary_range_max, external_apply_link, application_mode]
        );
        return new Job(rows[0]);
    }

    /**
     * Updates an existing job.
     * @param {string} id - The ID of the job to update.
     * @param {object} updateData - An object containing the fields to update.
     * @returns {Promise<Job|null>} The updated Job object if found, otherwise null.
     */
    static async update(id, updateData) {
        const setClauses = [];
        const params = [];
        let paramIndex = 1;

        // Iterate over updateData to build dynamic SET clauses and parameters
        for (const key in updateData) {
            if (updateData.hasOwnProperty(key)) {
                // Add the column to the SET clause and its value to params
                setClauses.push(`${key} = $${paramIndex++}`);
                params.push(updateData[key]);
            }
        }

        // If no fields are provided for update, return null
        if (setClauses.length === 0) {
            console.warn('JobRepository.update: No fields provided for update.');
            return null;
        }

        // Add the ID to the parameters for the WHERE clause
        params.push(id);

        // Construct the full UPDATE query
        const queryString = `UPDATE jobs SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;

        const { rows } = await query(queryString, params);
        return rows[0] ? new Job(rows[0]) : null;
    }

    /**
     * Deletes a job by its ID (sets is_active to FALSE, a soft delete).
     * @param {string} id - The ID of the job to delete.
     * @returns {Promise<boolean>} True if the job was soft-deleted, false otherwise.
     */
    static async delete(id) {
        // Soft delete: set is_active to FALSE instead of physically removing the record
        const { rowCount } = await query('UPDATE jobs SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [id]);
        return rowCount > 0;
    }
}

module.exports = JobRepository;
