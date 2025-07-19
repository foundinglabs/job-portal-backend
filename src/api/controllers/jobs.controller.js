const JobService = require('../../services/JobService');

class JobsController {
    /**
     * Retrieves all active jobs based on query filters.
     * GET /api/jobs
     */
    static async getAllJobs(req, res, next) {
        try {
            const filters = req.query; // role, location, type, experience
            const jobs = await JobService.getAllJobs(filters);
            res.json(jobs);
        } catch (error) {
            next(error); // Pass error to Express error handling middleware
        }
    }

    /**
     * Retrieves a single job by its ID.
     * GET /api/jobs/:id
     */
    static async getJobById(req, res, next) {
        try {
            const { id } = req.params;
            const job = await JobService.getJobById(id);
            if (!job) {
                return res.status(404).json({ message: 'Job not found.' });
            }
            res.json(job);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Creates a new job.
     * POST /api/jobs
     * Requires recruiter authentication.
     */
    static async createJob(req, res, next) {
        try {
            // req.user.id is set by authMiddleware from the JWT payload (Supabase user ID)
            const recruiterId = req.user.id;

            // In a real application, company_id should ideally be derived from the recruiterId
            // (e.g., by looking up the recruiter's company_id in the 'recruiters' table)
            // For this MVP, we'll allow it in the body for simplicity, but a more secure
            // approach would be to fetch it based on `recruiterId`.
            const jobData = { ...req.body, posted_by_recruiter_id: recruiterId };

            const newJob = await JobService.createJob(jobData, recruiterId);
            res.status(201).json(newJob);
        } catch (error) {
            // Handle specific errors from service, if any (e.g., missing company_id)
            if (error.message.includes("Company ID is required")) {
                return res.status(400).json({ message: error.message });
            }
            next(error);
        }
    }

    /**
     * Updates an existing job.
     * PUT /api/jobs/:id
     * Requires recruiter authentication and ownership of the job.
     */
    static async updateJob(req, res, next) {
        try {
            const { id } = req.params; // Job ID
            const userId = req.user.id; // User ID from authenticated token (recruiter ID)
            const updateData = req.body; // Data to update

            const updatedJob = await JobService.updateJob(id, updateData, userId);

            // If updateJob returns null, it means job was not found (after auth check)
            if (!updatedJob) {
                return res.status(404).json({ message: 'Job not found or could not be updated.' });
            }

            res.json(updatedJob);
        } catch (error) {
            // Handle specific errors from service layer
            if (error.message.includes('Job not found')) {
                return res.status(404).json({ message: error.message });
            }
            if (error.message.includes('Unauthorized')) {
                return res.status(403).json({ message: error.message });
            }
            next(error); // Pass other errors to general error handler
        }
    }

    /**
     * Deletes (soft-deletes) a job.
     * DELETE /api/jobs/:id
     * Requires recruiter authentication and ownership of the job.
     */
    static async deleteJob(req, res, next) {
        try {
            const { id } = req.params; // Job ID
            const userId = req.user.id; // User ID from authenticated token (recruiter ID)

            const success = await JobService.deleteJob(id, userId);

            if (!success) {
                // If soft delete failed (e.g., job not found or already inactive, but service already throws for 'not found')
                return res.status(404).json({ message: 'Job not found or could not be deleted.' });
            }

            res.status(204).send(); // 204 No Content for successful deletion
        } catch (error) {
            // Handle specific errors from service layer
            if (error.message.includes('Job not found') || error.message.includes('already inactive')) {
                return res.status(404).json({ message: error.message });
            }
            if (error.message.includes('Unauthorized')) {
                return res.status(403).json({ message: error.message });
            }
            next(error);
        }
    }
}

module.exports = JobsController;
