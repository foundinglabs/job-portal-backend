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
     * Dedicated controller method to get jobs for the logged-in recruiter.
     */
    static async getRecruiterDashboardJobs(req, res, next) {
        try {
            const user = req.user; // User object attached by authMiddleware
            const jobs = await JobService.getRecruiterDashboardJobs(user);
            res.json(jobs);
        } catch (error) {
            console.error('Error in getRecruiterDashboardJobs controller:', error);
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
            const companyId = req.user.company_id; // Get company_id from authenticated user

            if (!companyId) {
                return res.status(403).json({ message: "You must be associated with a company to post a job." });
            }

            const jobData = {
                ...req.body,
                company_id: companyId,
                posted_by_recruiter_id: recruiterId
            };

            const newJob = await JobService.createJob(jobData);
            res.status(201).json(newJob);
        } catch (error) {
            if (error.message.includes("Missing required job fields")) {
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
            const user = req.user; // Pass the user object for authorization
            const updateData = req.body;
            const updatedJob = await JobService.updateJob(id, updateData, user); // Pass user to the service
            if (!updatedJob) {
                return res.status(404).json({ message: 'Job not found or could not be updated.' });
            }
            res.json(updatedJob);
        } catch (error) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({ message: error.message });
            }
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
            const user = req.user; // Pass the user object for authorization
            const success = await JobService.deleteJob(id, user); // Pass user to the service
            if (!success) {
                return res.status(404).json({ message: 'Job not found or could not be deleted.' });
            }
            res.status(204).send();
        } catch (error) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            next(error);
        }
    }
}

module.exports = JobsController;