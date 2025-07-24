const JobService = require('../../services/JobService');

class JobsController {
    /**
     * Retrieves all active jobs based on query filters.
     * GET /api/jobs
     */
    static async getAllJobs(req, res, next) {
        try {
            const filters = req.query;
            const jobs = await JobService.getAllJobs(filters);
            res.json(jobs);
        } catch (error) {
            next(error);
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
            const recruiterId = req.user.id;
            const companyId = req.user.company_id; // <-- **Crucial**: Get company_id from authenticated user

            if (!companyId) {
                // This means the user is authenticated but not associated with a company in `recruiters` table.
                return res.status(403).json({ message: "You must be associated with a company to post a job. Please ensure your recruiter profile is complete." });
            }
            // `authorizeRoles` middleware (used in routes) should handle basic role check.
            // This explicit check adds redundancy, which is fine for security.
            if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
                 return res.status(403).json({ message: "Access denied. Only recruiters can post jobs." });
            }

            // The jobData from the request body should NOT contain company_id, we override/set it.
            const jobData = {
                ...req.body,
                company_id: companyId, // Override/set company_id from authenticated user's profile
                posted_by_recruiter_id: recruiterId
            };

            const newJob = await JobService.createJob(jobData); // Call service with complete jobData
            res.status(201).json(newJob);
        } catch (error) {
            // Handle specific errors from service, if any (e.g., missing fields)
            if (error.message.includes("Missing required job fields")) {
                return res.status(400).json({ message: error.message });
            }
            next(error); // Pass other errors to general error handler
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
            const recruiterCompanyId = req.user.company_id; // Company ID from authenticated recruiter

            const job = await JobService.getJobById(id);
            if (!job) {
                return res.status(404).json({ message: 'Job not found.' });
            }
            // Authorization: Ensure the recruiter can only update jobs belonging to their company
            if (job.company_id !== recruiterCompanyId) {
                return res.status(403).json({ message: "You are not authorized to update this job. It does not belong to your company." });
            }

            const updatedJob = await JobService.updateJob(id, req.body);

            if (!updatedJob) {
                return res.status(404).json({ message: 'Job not found or could not be updated.' }); // Should be caught by job not found above
            }

            res.json(updatedJob);
        } catch (error) {
            next(error);
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
            const recruiterCompanyId = req.user.company_id; // Company ID from authenticated recruiter

            const job = await JobService.getJobById(id);
            if (!job) {
                return res.status(404).json({ message: 'Job not found.' });
            }
            // Authorization: Ensure the recruiter can only delete jobs belonging to their company
            if (job.company_id !== recruiterCompanyId) {
                return res.status(403).json({ message: "You are not authorized to delete this job. It does not belong to your company." });
            }

            const deletedJob = await JobService.deleteJob(id); // Calls softDelete in repository

            if (!deletedJob) {
                return res.status(404).json({ message: 'Job not found or could not be deleted.' }); // Should be caught by job not found above
            }

            res.status(200).json({ message: 'Job soft-deleted successfully.', job: deletedJob }); // Changed to 200 with content
        } catch (error) {
            next(error);
        }
    }
}

module.exports = JobsController;