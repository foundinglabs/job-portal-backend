const ApplicationService = require('../../services/ApplicationService');
const { validateApplication } = require('../validators/applicationValidator');
const JobRepository = require('../../database/repositories/JobRepository');

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
            const recruiterCompanyId = req.user.company_id;

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
            const recruiterCompanyId = req.user.company_id;
            const updateData = req.body;

            const applicationCompanyId = await ApplicationService.getApplicationJobCompanyId(id);
            if (!applicationCompanyId || applicationCompanyId !== recruiterCompanyId) {
                return res.status(403).json({ message: 'Access denied. You can only update applications for your company\'s jobs.' });
            }

            const updatedApplication = await ApplicationService.updateApplicationStatus(id, updateData);
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
            const user = req.user;
            const signedUrl = await ApplicationService.getResumeSignedUrl(applicationId, user);
            res.json({ url: signedUrl });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ApplicationsController;