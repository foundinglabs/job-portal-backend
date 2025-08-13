const { query } = require('../connection');
const SavedJob = require('../models/SavedJob');
const Job = require('../models/Job');

class SavedJobRepository {
    static async create(userId, jobId) {
        try {
            const { rows } = await query(
                `INSERT INTO saved_jobs (user_id, job_id, created_at)
                 VALUES ($1, $2, NOW()) RETURNING *`,
                [userId, jobId]
            );
            return new SavedJob(rows[0]);
        } catch (error) {
            console.error('Error creating saved job:', error);
            if (error.code === '23505') {
                const conflictError = new Error('Job is already saved by this candidate.');
                conflictError.statusCode = 409;
                throw conflictError;
            }
            throw new Error('Could not save job.');
        }
    }

    static async findByUserIdWithJobDetails(userId) {
        try {
            const { rows } = await query(
                `SELECT
                    sj.user_id,
                    sj.job_id,
                    sj.created_at as saved_at,
                    j.*
                FROM
                    saved_jobs sj
                JOIN
                    jobs j ON sj.job_id = j.id
                WHERE
                    sj.user_id = $1
                ORDER BY
                    sj.created_at DESC`,
                [userId]
            );
            return rows.map(row => ({
                job_id: row.job_id,
                user_id: row.user_id,
                created_at: row.saved_at,
                job: {
                    id: row.id,
                    title: row.title,
                    company_name: row.company_name,
                }
            }));
        } catch (error) {
            console.error('Error finding saved jobs by user ID with job details:', error);
            throw new Error('Could not retrieve saved jobs with details.');
        }
    }

    static async findByUserIdAndJobId(userId, jobId) {
        try {
            const { rows } = await query('SELECT * FROM saved_jobs WHERE user_id = $1 AND job_id = $2', [userId, jobId]);
            return rows[0] ? new SavedJob(rows[0]) : null;
        } catch (error) {
            console.error('Error finding saved job by user ID and job ID:', error);
            throw new Error('Could not retrieve saved job.');
        }
    }

    static async findByUserId(userId) {
        try {
            const { rows } = await query('SELECT * FROM saved_jobs WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
            return rows.map(row => new SavedJob(row));
        } catch (error) {
            console.error('Error finding saved jobs by user ID:', error);
            throw new Error('Could not retrieve saved jobs.');
        }
    }

    static async delete(userId, jobId) {
        try {
            const { rowCount } = await query('DELETE FROM saved_jobs WHERE user_id = $1 AND job_id = $2', [userId, jobId]);
            return rowCount > 0;
        } catch (error) {
            console.error('Error deleting saved job:', error);
            throw new Error('Could not unsave job.');
        }
    }
}

module.exports = SavedJobRepository;