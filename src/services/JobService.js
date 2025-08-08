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

    // NEW: Dedicated service method to get jobs for a specific company
    static async getRecruiterDashboardJobs(user) {
        if (!user || !user.company_id) {
            const error = new Error('User not authorized or company ID is missing.');
            error.statusCode = 403; // Forbidden
            throw error;
        }
        return JobRepository.findByCompanyId(user.company_id);
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
     * Updates an existing job, ensuring the user is authorized.
     * @param {string} jobId - The ID of the job to update.
     * @param {object} updateData - An object containing the fields to update.
     * @param {object} user - The authenticated user object.
     * @returns {Promise<Job|null>} The updated Job object if authorized, otherwise null.
     * @throws {Error} If the job is not found or user is not authorized.
     */
    static async updateJob(jobId, updateData, user) {
        const existingJob = await JobRepository.findById(jobId);

        if (!existingJob) {
            throw new Error('Job not found or is inactive.');
        }

        // CORRECTED AUTHORIZATION: Check if the recruiter is from the same company that posted the job.
        if (existingJob.company_id !== user.company_id) {
            throw new Error('Unauthorized: You can only update jobs from your company.');
        }

        delete updateData.id;

        return JobRepository.update(jobId, updateData);
    }
    
    /**
     * Soft deletes a job, ensuring the user is authorized.
     * @param {string} jobId - The ID of the job to delete.
     * @param {object} user - The authenticated user object.
     * @returns {Promise<boolean>} True if the job was soft-deleted and authorized, false otherwise.
     * @throws {Error} If the job is not found or user is not authorized.
     */
    static async deleteJob(jobId, user) {
        const existingJob = await JobRepository.findById(jobId);

        if (!existingJob) {
            throw new Error('Job not found or already inactive.');
        }

        // CORRECTED AUTHORIZATION: Check if the recruiter is from the same company that posted the job.
        if (existingJob.company_id !== user.company_id) {
            throw new Error('Unauthorized: You can only delete jobs from your company.');
        }

        return JobRepository.delete(jobId);
    }
}

module.exports = JobService;