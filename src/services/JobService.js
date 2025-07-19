const JobRepository = require('../database/repositories/JobRepository');

class JobService {
    /**
     * Retrieves all active jobs based on provided filters.
     * @param {object} filters - An object containing filters (e.g., { role, location, type, experience }).
     * @returns {Promise<Job[]>} An array of Job objects.
     */
    static async getAllJobs(filters) {
        return JobRepository.findAll(filters);
    }

    /**
     * Retrieves a single active job by its ID.
     * @param {string} jobId - The ID of the job.
     * @returns {Promise<Job|null>} The Job object if found and active, otherwise null.
     */
    static async getJobById(jobId) {
        return JobRepository.findById(jobId);
    }

    /**
     * Creates a new job.
     * @param {object} jobData - An object containing job details.
     * @param {string} recruiterId - The user ID of the recruiter posting the job (from authenticated token).
     * @returns {Promise<Job>} The newly created Job object.
     * @throws {Error} If company ID is missing.
     */
    static async createJob(jobData, recruiterId) {
        // Basic validation: Ensure company_id is present. More complex validation
        // should happen in a validator middleware or dedicated validation service.
        if (!jobData.company_id) {
            throw new Error("Company ID is required to post a job.");
        }
        jobData.posted_by_recruiter_id = recruiterId; // Assign the recruiter who posted
        return JobRepository.create(jobData);
    }

    /**
     * Updates an existing job.
     * @param {string} jobId - The ID of the job to update.
     * @param {object} updateData - An object containing the fields to update.
     * @param {string} userId - The ID of the user attempting the update (for authorization).
     * @returns {Promise<Job|null>} The updated Job object if found and authorized, otherwise null.
     * @throws {Error} If the job is not found or user is not authorized.
     */
    static async updateJob(jobId, updateData, userId) {
        const existingJob = await JobRepository.findById(jobId);

        if (!existingJob) {
            throw new Error('Job not found or is inactive.');
        }

        // Authorization check: Only the recruiter who posted the job can update it.
        // Or, you could add logic here to allow 'admin' roles to update any job.
        if (existingJob.posted_by_recruiter_id !== userId) {
            // In a real app, you might fetch the user's role and check if they are an 'admin'
            // For now, assuming only the poster can update.
            throw new Error('Unauthorized: You can only update jobs you have posted.');
        }

        // Remove ID from updateData to prevent accidental ID modification
        delete updateData.id;

        return JobRepository.update(jobId, updateData);
    }

    /**
     * Soft deletes a job (sets is_active to FALSE).
     * @param {string} jobId - The ID of the job to delete.
     * @param {string} userId - The ID of the user attempting the deletion (for authorization).
     * @returns {Promise<boolean>} True if the job was soft-deleted and authorized, false otherwise.
     * @throws {Error} If the job is not found or user is not authorized.
     */
    static async deleteJob(jobId, userId) {
        const existingJob = await JobRepository.findById(jobId);

        if (!existingJob) {
            throw new Error('Job not found or already inactive.');
        }

        // Authorization check: Only the recruiter who posted the job can delete it.
        // Similar to update, you might extend this for 'admin' roles.
        if (existingJob.posted_by_recruiter_id !== userId) {
            throw new Error('Unauthorized: You can only delete jobs you have posted.');
        }

        return JobRepository.delete(jobId);
    }
}

module.exports = JobService;
