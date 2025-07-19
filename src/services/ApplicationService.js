const ApplicationRepository = require('../database/repositories/ApplicationRepository');
const JobRepository = require('../database/repositories/JobRepository');
const { uploadFile } = require('../lib/googleCloudStorage');
const ResumeParsingService = require('./ResumeParsingService');
const MatchCalculationService = require('./MatchCalculationService');

class ApplicationService {
    static async applyWithoutLogin(applicationData, resumeFile) {
        // 1. Validate application data (handled by controller or validator)
        // 2. Upload resume to Google Cloud Storage
        const resumeFileName = `${Date.now()}-${resumeFile.originalname}`;
        const destinationPath = `public_applications/${applicationData.job_id}/${resumeFileName}`;
        const resumeFilePath = await uploadFile(resumeFile.buffer, destinationPath, resumeFile.mimetype);

        // 3. Save application details to DB
        const newApplication = await ApplicationRepository.create({
            job_id: applicationData.job_id,
            applicant_name: applicationData.applicant_name,
            applicant_email: applicationData.applicant_email,
            applicant_phone: applicationData.applicant_phone,
            applicant_linkedin_url: applicationData.applicant_linkedin_url,
            cover_letter_text: applicationData.cover_letter_text,
            resume_file_path: resumeFilePath,
            application_status: 'New'
        });

        // 4. Asynchronously trigger resume parsing and match calculation
        //    (Can be done via a separate queue/worker if truly async is needed)
        this.processApplicationAsync(newApplication.id, applicationData.job_id, resumeFilePath);

        return newApplication;
    }

    // This method can be called in the background or via a message queue
    static async processApplicationAsync(applicationId, jobId, resumeFilePath) {
        try {
            console.log(`Processing application ${applicationId}: Parsing resume and calculating match.`);
            const parsedData = await ResumeParsingService.parseResume(resumeFilePath);

            // Get job required skills
            const job = await JobRepository.findById(jobId);
            const jobRequiredSkills = job ? job.skills_required : [];

            const matchPercentage = MatchCalculationService.calculateMatch(
                parsedData.skills,
                jobRequiredSkills
            );

            // Update application in DB
            await ApplicationRepository.update(applicationId, {
                resume_parsed_data: parsedData,
                match_percentage: matchPercentage
            });

            console.log(`Application ${applicationId} processed. Match: ${matchPercentage}%`);
        } catch (error) {
            console.error(`Error processing application ${applicationId}:`, error);
            // Log error, potentially update application status to 'Error'
        }
    }

    static async getApplicationsForJob(jobId) {
        return ApplicationRepository.findByJobId(jobId);
    }

    static async updateApplicationStatus(applicationId, status, notes, tags) {
        return ApplicationRepository.update(applicationId, {
            application_status: status,
            internal_notes: notes,
            internal_tags: tags
        });
    }

    static async getResumeSignedUrl(applicationId, userId) {
        const application = await ApplicationRepository.findById(applicationId);
        if (!application) {
            throw new Error('Application not found.');
        }

        // IMPORTANT: Implement proper authorization here.
        // E.g., check if the userId (recruiter) is authorized to view this application
        // (i.e., belongs to the company that posted the job).
        const job = await JobRepository.findById(application.job_id);
        // Placeholder check: Assume user is authorized if job exists and they are a recruiter
        // You'd check `req.user.company_id` against `job.company_id`
        if (!job /* || !isRecruiterAuthorizedForCompany(userId, job.company_id) */) {
             throw new Error('Unauthorized to view this resume.');
        }

        return require('../lib/googleCloudStorage').getSignedUrl(application.resume_file_path);
    }
}

module.exports = ApplicationService;