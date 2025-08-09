const ApplicationRepository = require('../database/repositories/ApplicationRepository');
const JobRepository = require('../database/repositories/JobRepository');
const { uploadFile, getSignedUrl } = require('../lib/googleCloudStorage');
const ResumeParsingService = require('./ResumeParsingService');
const MatchCalculationService = require('./MatchCalculationService');

class ApplicationService {
    /**
     * Handles the application submission without requiring a login.
     * Uploads resume to GCS and creates application record.
     * @param {object} applicationData - Data for the application (applicant_name, email, job_id, etc.).
     * @param {object} resumeFile - The file object from Multer.
     * @returns {Promise<object>} The newly created application object.
     */
    static async applyWithoutLogin(applicationData, resumeFile) {
        let resumeFilePath = null;

        try {
            const resumeFileName = `${Date.now()}-${resumeFile.originalname}`;
            const destinationPath = `public_applications/${applicationData.job_id}/${resumeFileName}`;
            resumeFilePath = await uploadFile(resumeFile.buffer, destinationPath, resumeFile.mimetype);

            const newApplicationData = {
                ...applicationData,
                resume_file_path: resumeFilePath,
                application_status: applicationData.application_status || 'New',
            };

            const newApplication = await ApplicationRepository.create(newApplicationData);

            this.processApplicationAsync(newApplication.id, newApplication.resume_file_path, newApplication.job_id)
                .catch(err => console.error(`Error processing application ${newApplication.id}:`, err));

            return newApplication;

        } catch (error) {
            console.error('Error in ApplicationService.applyWithoutLogin:', error);
            throw error;
        }
    }

    /**
     * Asynchronously processes an application for resume parsing and match calculation.
     * @param {string} applicationId - The ID of the application.
     * @param {string} resumeFilePath - The GCS path to the resume file.
     * @param {string} jobId - The ID of the job associated with the application.
     */
    static async processApplicationAsync(applicationId, resumeFilePath, jobId) {
        console.log(`Processing application ${applicationId}: Parsing resume and calculating match.`);
        try {
            const parsedData = await ResumeParsingService.parseResume(resumeFilePath);

            const job = await JobRepository.findById(jobId);
            const jobSkills = job ? (Array.isArray(job.skills_required) ? job.skills_required : []) : [];

            const matchPercentage = MatchCalculationService.calculateMatch(parsedData.skills || [], jobSkills);

            await ApplicationRepository.update(applicationId, {
                resume_parsed_data: parsedData,
                match_percentage: matchPercentage,
            });

            console.log(`Application ${applicationId} processed. Match: ${matchPercentage}%`);

        } catch (error) {
            console.error(`Error processing application ${applicationId}:`, error);
        }
    }

    /**
     * Retrieves all applications for a specific job.
     * @param {string} jobId - The ID of the job.
     * @returns {Promise<Array<object>>} An array of application objects.
     */
    static async getApplicationsForJob(jobId) {
        const applications = await ApplicationRepository.findByJobId(jobId);
        return applications.map(app => ({
            ...app,
            match_percentage: app.match_percentage !== null ? Number(app.match_percentage) : null
        }));
    }

    /**
     * Updates the status, notes, or tags of an application.
     * @param {string} applicationId - The ID of the application.
     * @param {object} updateData - An object containing the fields to update.
     * @returns {Promise<object>} The updated application object.
     */
    static async updateApplicationStatus(applicationId, updateData) {
        const updatedApp = await ApplicationRepository.update(applicationId, updateData);
        return {
            ...updatedApp,
            match_percentage: updatedApp.match_percentage !== null ? Number(updatedApp.match_percentage) : null
        };
    }

    /**
     * Retrieves the company ID associated with a given application's job.
     * Used for authorization checks in controllers.
     * @param {string} applicationId - The ID of the application.
     * @returns {Promise<string|null>} The company_id or null if not found.
     */
    static async getApplicationJobCompanyId(applicationId) {
        return ApplicationRepository.getApplicationJobCompanyId(applicationId);
    }

    /**
     * Generates a signed URL for a resume file stored in GCS.
     * @param {string} applicationId - The ID of the application.
     * @param {object} user - The authenticated user object.
     * @returns {Promise<string>} The signed URL.
     * @throws {Error} If application not found or resume path is missing.
     */
    static async getResumeSignedUrl(applicationId, user) {
        const application = await ApplicationRepository.findById(applicationId);

        if (!application || !application.resume_file_path) {
            throw new Error('Resume not found for this application.');
        }

        // Authorization check: Ensure the recruiter can only view resumes for their company's jobs
        const job = await JobRepository.findById(application.job_id);
        if (!job || job.company_id !== user.company_id) {
            const error = new Error('Unauthorized: You are not authorized to view this resume.');
            error.statusCode = 403;
            throw error;
        }

        const filePath = application.resume_file_path.replace(`gs://${process.env.GCS_BUCKET_NAME}/`, '');
        return getSignedUrl(filePath);
    }
}

module.exports = ApplicationService;