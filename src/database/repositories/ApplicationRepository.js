const { query } = require('../connection');
const Application = require('../models/Application');

class ApplicationRepository {
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

        queryString += ` ORDER BY created_at DESC`;

        const { rows } = await query(queryString, params);
        return rows.map(row => new Application(row));
    }

    static async findById(id) {
        const { rows } = await query('SELECT * FROM public_applications WHERE id = $1', [id]);
        return rows[0] ? new Application(rows[0]) : null;
    }

    static async findByJobId(jobId) {
        try {
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

        const status = application_status || 'New';

        const { rows } = await query(
            `INSERT INTO public_applications (
                job_id, applicant_name, applicant_email, applicant_phone,
                applicant_linkedin_url, cover_letter_text, resume_file_path,
                application_status, resume_parsed_data, match_percentage,
                internal_notes, internal_tags
            )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
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

    static async update(id, updateData) {
        const setClauses = [];
        const params = [];
        let paramIndex = 1;

        const filteredUpdateData = Object.entries(updateData).reduce((acc, [key, value]) => {
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
            return null;
        }

        params.push(id);

        const queryString = `UPDATE public_applications SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;
        const { rows } = await query(queryString, params);
        return rows[0] ? new Application(rows[0]) : null;
    }

    static async getApplicationJobCompanyId(applicationId) {
        try {
            const { rows } = await query(
                `SELECT j.company_id FROM public_applications AS a
                 JOIN jobs AS j ON a.job_id = j.id
                 WHERE a.id = $1`,
                [applicationId]
            );
            return rows[0] ? rows[0].company_id : null;
        } catch (error) {
            console.error('Error fetching company ID for application:', error);
            throw new Error('Could not retrieve application company ID.');
        }
    }
}

module.exports = ApplicationRepository;