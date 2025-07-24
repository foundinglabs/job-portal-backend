const ApplicationService = require('../../services/ApplicationService');
const { validateApplication } = require('../validators/applicationValidator');
const JobRepository = require('../../database/repositories/JobRepository'); // Added import

class ApplicationsController {
    static async applyWithoutLogin(req, res, next) {
        try {
            const applicationData = req.body;
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
            const recruiterCompanyId = req.user.company_id; // From authMiddleware

            // Authorization check: Ensure recruiter can only see applications for their company's jobs
            const job = await JobRepository.findById(jobId);
            if (!job || job.company_id !== recruiterCompanyId) {
                return res.status(403).json({ message: 'Access denied. You can only view applications for your company\'s jobs.' });
            }

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
            const recruiterCompanyId = req.user.company_id; // From authMiddleware

            // Authorization check: Ensure recruiter can only update applications for their company's jobs
            const applicationCompanyId = await ApplicationService.getApplicationJobCompanyId(id); // Get company_id via service
            if (!applicationCompanyId || applicationCompanyId !== recruiterCompanyId) {
                return res.status(403).json({ message: 'Access denied. You can only update applications for your company\'s jobs.' });
            }

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
            const recruiterCompanyId = req.user.company_id; // From authMiddleware

            // Authorization check: Ensure recruiter can only view resumes for applications for their company's jobs
            const applicationCompanyId = await ApplicationService.getApplicationJobCompanyId(applicationId); // Get company_id via service
            if (!applicationCompanyId || applicationCompanyId !== recruiterCompanyId) {
                return res.status(403).json({ message: 'Access denied. You can only view resumes for your company\'s jobs.' });
            }

            const signedUrl = await ApplicationService.getResumeSignedUrl(applicationId); // Removed recruiterId param
            res.json({ url: signedUrl });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ApplicationsController;