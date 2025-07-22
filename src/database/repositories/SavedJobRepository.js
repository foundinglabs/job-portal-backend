const { query } = require('../connection');
const SavedJob = require('../models/SavedJob'); // Assuming you have this model

class SavedJobRepository {
    /**
     * Creates a new saved job entry.
     * @param {string} userId - The ID of the candidate user.
     * @param {string} jobId - The ID of the job to save.
     * @returns {Promise<SavedJob>} The newly created SavedJob object.
     */
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
            // Check for unique constraint violation if job is already saved
            if (error.code === '23505') { // PostgreSQL unique_violation error code
                const conflictError = new Error('Job is already saved by this candidate.');
                conflictError.statusCode = 409;
                throw conflictError;
            }
            throw new Error('Could not save job.');
        }
    }

    /**
     * Finds a saved job entry by user ID and job ID.
     * @param {string} userId - The ID of the candidate user.
     * @param {string} jobId - The ID of the job.
     * @returns {Promise<SavedJob|null>} The SavedJob object if found, otherwise null.
     */
    static async findByUserIdAndJobId(userId, jobId) {
        try {
            const { rows } = await query('SELECT * FROM saved_jobs WHERE user_id = $1 AND job_id = $2', [userId, jobId]);
            return rows[0] ? new SavedJob(rows[0]) : null;
        } catch (error) {
            console.error('Error finding saved job by user ID and job ID:', error);
            throw new Error('Could not retrieve saved job.');
        }
    }

    /**
     * Finds all jobs saved by a specific user.
     * @param {string} userId - The ID of the candidate user.
     * @returns {Promise<SavedJob[]>} An array of SavedJob objects.
     */
    static async findByUserId(userId) {
        try {
            // This query could be enhanced to join with the 'jobs' table to get full job details
            const { rows } = await query('SELECT * FROM saved_jobs WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
            return rows.map(row => new SavedJob(row));
        } catch (error) {
            console.error('Error finding saved jobs by user ID:', error);
            throw new Error('Could not retrieve saved jobs.');
        }
    }

    /**
     * Deletes a saved job entry.
     * @param {string} userId - The ID of the candidate user.
     * @param {string} jobId - The ID of the job to delete.
     * @returns {Promise<boolean>} True if the entry was deleted, false otherwise.
     */
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
