const ApplicationService = require('../../services/ApplicationService');
const { validateApplication } = require('../validators/applicationValidator');

class ApplicationsController {
    static async applyWithoutLogin(req, res, next) {
        try {
            // Data from form fields
            const applicationData = req.body;
            // File from multer
            const resumeFile = req.file;

            if (!resumeFile) {
                return res.status(400).json({ message: 'Resume file is required.' });
            }

            const validationResult = validateApplication(applicationData);
            if (!validationResult.isValid) {
                return res.status(400).json({ errors: validationResult.errors });
            }

            const newApplication = await ApplicationService.applyWithoutLogin(applicationData, resumeFile);
            res.status(201).json({ message: 'Application submitted successfully!', application: newApplication });
        } catch (error) {
            console.error("Error submitting application:", error);
            next(error);
        }
    }

    static async getApplicationsForJob(req, res, next) {
        try {
            const { jobId } = req.params;
            // Ensure this is only accessible by recruiters authorized for this job's company
            // `req.user.id` and `req.user.role` are available from authMiddleware
            // Add authorization check: e.g., recruiter's company_id must match job's company_id
            const applications = await ApplicationService.getApplicationsForJob(jobId);
            res.json(applications);
        } catch (error) {
            next(error);
        }
    }

    static async updateApplicationStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status, internal_notes, internal_tags } = req.body;
            // Ensure this is only accessible by authorized recruiters
            // Add authorization check
            const updatedApplication = await ApplicationService.updateApplicationStatus(id, status, internal_notes, internal_tags);
            if (!updatedApplication) {
                return res.status(404).json({ message: 'Application not found.' });
            }
            res.json(updatedApplication);
        } catch (error) {
            next(error);
        }
    }

    static async getResume(req, res, next) {
        try {
            const { applicationId } = req.params;
            // Ensure this is only accessible by authorized recruiters
            // `req.user.id` (recruiterId) from authMiddleware
            const signedUrl = await ApplicationService.getResumeSignedUrl(applicationId, req.user.id);
            res.json({ url: signedUrl });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ApplicationsController;