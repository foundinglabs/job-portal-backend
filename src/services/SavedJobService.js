const SavedJobRepository = require('../database/repositories/SavedJobRepository');
const JobRepository = require('../database/repositories/JobRepository'); // To check if job exists

class SavedJobService {
    /**
     * Saves a job for a specific candidate.
     * @param {string} userId - The ID of the candidate user.
     * @param {string} jobId - The ID of the job to save.
     * @returns {Promise<object>} The newly created saved job entry.
     * @throws {Error} If job is already saved or job does not exist.
     */
    static async saveJob(userId, jobId) {
        // Optional: Check if the job actually exists before saving
        const jobExists = await JobRepository.findById(jobId);
        if (!jobExists) {
            const error = new Error('Job not found.');
            error.statusCode = 404;
            throw error;
        }

        // Check if the job is already saved by this user
        const existingSavedJob = await SavedJobRepository.findByUserIdAndJobId(userId, jobId);
        if (existingSavedJob) {
            const error = new Error('Job is already saved by this candidate.');
            error.statusCode = 409; // Conflict
            throw error;
        }

        return SavedJobRepository.create(userId, jobId);
    }

    /**
     * Retrieves all jobs saved by a specific candidate.
     * @param {string} userId - The ID of the candidate user.
     * @returns {Promise<Array<object>>} An array of saved job entries.
     */
    static async getSavedJobsByUserId(userId) {
        // This method could also fetch full job details by joining with the jobs table
        return SavedJobRepository.findByUserId(userId);
    }

    /**
     * Unsaves a job for a specific candidate.
     * @param {string} userId - The ID of the candidate user.
     * @param {string} jobId - The ID of the job to unsave.
     * @returns {Promise<boolean>} True if unsaved, false otherwise.
     */
    static async unsaveJob(userId, jobId) {
        return SavedJobRepository.delete(userId, jobId);
    }
}

module.exports = SavedJobService;
