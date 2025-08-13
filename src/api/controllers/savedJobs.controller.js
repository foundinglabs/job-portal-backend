const SavedJobService = require('../../services/SavedJobService');
const JobRepository = require('../../database/repositories/JobRepository');

class SavedJobsController {
    /**
     * Get all saved jobs for the authenticated user
     */
    static async getSavedJobs(req, res) {
        try {
            const userId = req.user.id;
            
            // Get saved job entries
            const savedJobs = await SavedJobService.getSavedJobsByUserId(userId);
            
            // Get full job details for each saved job
            const jobsWithDetails = await Promise.all(
                savedJobs.map(async (savedJob) => {
                    const jobDetails = await JobRepository.findById(savedJob.job_id);
                    return {
                        ...savedJob,
                        job: jobDetails
                    };
                })
            );
            
            res.status(200).json({
                success: true,
                data: jobsWithDetails
            });
        } catch (error) {
            console.error('Error fetching saved jobs:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch saved jobs',
                error: error.message
            });
        }
    }

    /**
     * Save a job for the authenticated user
     */
    static async saveJob(req, res) {
        try {
            const userId = req.user.id;
            const { jobId } = req.body;

            if (!jobId) {
                return res.status(400).json({
                    success: false,
                    message: 'Job ID is required'
                });
            }

            const savedJob = await SavedJobService.saveJob(userId, jobId);
            
            res.status(201).json({
                success: true,
                message: 'Job saved successfully',
                data: savedJob
            });
        } catch (error) {
            console.error('Error saving job:', error);
            
            if (error.statusCode === 404) {
                return res.status(404).json({
                    success: false,
                    message: 'Job not found'
                });
            }
            
            if (error.statusCode === 409) {
                return res.status(409).json({
                    success: false,
                    message: 'Job is already saved'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to save job',
                error: error.message
            });
        }
    }

    /**
     * Unsave a job for the authenticated user
     */
    static async unsaveJob(req, res) {
        try {
            const userId = req.user.id;
            const { jobId } = req.params;

            if (!jobId) {
                return res.status(400).json({
                    success: false,
                    message: 'Job ID is required'
                });
            }

            const result = await SavedJobService.unsaveJob(userId, jobId);
            
            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: 'Saved job not found'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Job unsaved successfully'
            });
        } catch (error) {
            console.error('Error unsaving job:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to unsave job',
                error: error.message
            });
        }
    }

    /**
     * Check if a job is saved by the authenticated user
     */
    static async isJobSaved(req, res) {
        try {
            const userId = req.user.id;
            const { jobId } = req.params;

            if (!jobId) {
                return res.status(400).json({
                    success: false,
                    message: 'Job ID is required'
                });
            }

            const isSaved = await SavedJobService.isJobSaved(userId, jobId);
            
            res.status(200).json({
                success: true,
                data: { isSaved }
            });
        } catch (error) {
            console.error('Error checking if job is saved:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check saved status',
                error: error.message
            });
        }
    }
}

module.exports = SavedJobsController;

