const { query } = require('../connection');
const Application = require('../models/Application');

class ApplicationRepository {
    /**
     * Finds all applications, optionally filtered by job_id or applicant_email.
     * @param {object} filters - An object containing filters (e.g., { job_id, applicant_email }).
     * @returns {Promise<Application[]>} An array of Application objects.
     */
    static async findAll(filters = {}) {
        let queryString = `SELECT * FROM public_applications`;
        const params = [];
        const conditions = [];
        let paramIndex = 1;

        if (filters.job_id) {
            conditions.push(`job_id = $${paramIndex++}`);
            params.push(filters.job_id);
        }
        if (filters.applicant_email) {
            conditions.push(`applicant_email ILIKE $${paramIndex++}`);
            params.push(`%${filters.applicant_email}%`);
        }
        if (filters.application_status) {
            conditions.push(`application_status = $${paramIndex++}`);
            params.push(filters.application_status);
        }

        if (conditions.length > 0) {
            queryString += ` WHERE ${conditions.join(' AND ')}`;
        }

        // Ordering by 'created_at' - this column MUST exist in your DB table
        queryString += ` ORDER BY created_at DESC`; 

        const { rows } = await query(queryString, params);
        return rows.map(row => new Application(row));
    }

    /**
     * Finds an application by its ID.
     * @param {string} id - The ID of the application.
     * @returns {Promise<Application|null>} The Application object if found, otherwise null.
     */
    static async findById(id) {
        const { rows } = await query('SELECT * FROM public_applications WHERE id = $1', [id]);
        return rows[0] ? new Application(rows[0]) : null;
    }

    /**
     * Finds all applications for a specific job ID.
     * @param {string} jobId - The ID of the job to find applications for.
     * @returns {Promise<Application[]>} An array of Application objects.
     */
    static async findByJobId(jobId) {
        try {
            // Using parameterized query to prevent SQL injection
            // Ordering by 'created_at' - this column MUST exist in your DB table
            const { rows } = await query(
                'SELECT * FROM public_applications WHERE job_id = $1 ORDER BY created_at DESC',
                [jobId]
            );
            return rows.map(row => new Application(row));
        } catch (error) {
            console.error(`Error finding applications for job ID ${jobId}:`, error);
            throw new Error('Could not retrieve applications for this job.');
        }
    }

    /**
     * Creates a new application in the database.
     * @param {object} applicationData - An object containing application details.
     * @returns {Promise<Application>} The newly created Application object.
     */
    static async create(applicationData) {
        const {
            job_id,
            applicant_name,
            applicant_email,
            applicant_phone,
            applicant_linkedin_url,
            cover_letter_text,
            resume_file_path,
            application_status,
            resume_parsed_data,
            match_percentage,
            internal_notes,
            internal_tags
        } = applicationData;

        const status = application_status || 'New'; // Default to 'New' if not explicitly set

        const { rows } = await query(
            `INSERT INTO public_applications (
                job_id, applicant_name, applicant_email, applicant_phone,
                applicant_linkedin_url, cover_letter_text, resume_file_path,
                application_status, resume_parsed_data, match_percentage,
                internal_notes, internal_tags, created_at, updated_at
            )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()) RETURNING *`,
            [
                job_id,
                applicant_name,
                applicant_email,
                applicant_phone,
                applicant_linkedin_url,
                cover_letter_text,
                resume_file_path,
                status,
                resume_parsed_data,
                match_percentage,
                internal_notes,
                internal_tags
            ]
        );
        return new Application(rows[0]);
    }

    /**
     * Updates an existing application.
     * @param {string} id - The ID of the application to update.
     * @param {object} updateData - An object containing the fields to update.
     * @returns {Promise<Application|null>} The updated Application object if found, otherwise null.
     */
    static async update(id, updateData) {
        const setClauses = [];
        const params = [];
        let paramIndex = 1;

        // Ensure only defined values are used for updates
        // This time, we explicitly check for 'null' as well for fields that can be set to null
        const filteredUpdateData = Object.entries(updateData).reduce((acc, [key, value]) => {
            // Only include the key if the value is not undefined.
            // This allows explicitly setting a value to null if desired.
            if (value !== undefined) { 
                acc[key] = value;
            }
            return acc;
        }, {});

        for (const key in filteredUpdateData) {
            if (filteredUpdateData.hasOwnProperty(key)) {
                setClauses.push(`${key} = $${paramIndex++}`);
                params.push(filteredUpdateData[key]);
            }
        }

        if (setClauses.length === 0) {
            return null; // No fields to update
        }

        params.push(id); // Add ID for the WHERE clause

        // Explicitly set updated_at on update
        const queryString = `UPDATE public_applications SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;
        const { rows } = await query(queryString, params);
        return rows[0] ? new Application(rows[0]) : null;
    }

    /**
     * Deletes an application by its ID.
     * @param {string} id - The ID of the application to delete.
     * @returns {Promise<boolean>} True if the application was deleted, false otherwise.
     */
    static async delete(id) {
        const { rowCount } = await query('DELETE FROM public_applications WHERE id = $1', [id]);
        return rowCount > 0;
    }
}

module.exports = ApplicationRepository;
