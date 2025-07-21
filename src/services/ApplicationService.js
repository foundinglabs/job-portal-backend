const ApplicationRepository = require('../database/repositories/ApplicationRepository');
const JobRepository = require('../database/repositories/JobRepository'); // Assuming you have this
const MatchCalculationService = require('./MatchCalculationService');
const { Storage } = require('@google-cloud/storage'); // Import Storage
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Initialize Google Cloud Storage with explicit credentials from .env
const storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    credentials: {
        client_email: process.env.GCS_CLIENT_EMAIL,
        // Replace escaped newlines in private key if necessary
        private_key: process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
});
const bucketName = process.env.GCS_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

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
        const { job_id, applicant_name, applicant_email } = applicationData;

        try {
            // Upload resume to GCS
            const fileExtension = path.extname(resumeFile.originalname);
            // Store public applications in a 'public_applications' subfolder
            const fileName = `public_applications/${job_id}/${uuidv4()}${fileExtension}`;
            const blob = bucket.file(fileName);
            const blobStream = blob.createWriteStream({
                resumable: false,
                metadata: {
                    contentType: resumeFile.mimetype
                }
            });

            await new Promise((resolve, reject) => {
                blobStream.on('error', (err) => {
                    console.error('GCS upload error (ApplicationService):', err);
                    reject(new Error('Failed to upload resume to cloud storage.'));
                });
                blobStream.on('finish', () => {
                    console.log(`Resume uploaded to ${fileName}`);
                    resumeFilePath = `gs://${bucketName}/${fileName}`;
                    resolve();
                });
                blobStream.end(resumeFile.buffer);
            });

            // Prepare application data for repository
            const newApplicationData = {
                ...applicationData,
                resume_file_path: resumeFilePath,
                application_status: applicationData.application_status || 'New', // Ensure default status
                // parsed_data and match_percentage will be updated asynchronously
            };

            const newApplication = await ApplicationRepository.create(newApplicationData);

            // Asynchronously process resume for parsing and match calculation
            // This prevents the API call from being blocked by a potentially long process
            this.processApplicationAsync(newApplication.id, newApplication.resume_file_path, newApplication.job_id)
                .catch(err => console.error(`Error processing application ${newApplication.id}:`, err));

            return newApplication;

        } catch (error) {
            console.error('Error in ApplicationService.applyWithoutLogin:', error);
            throw error; // Re-throw to be caught by controller's error handling
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
            // 1. Simulate Resume Parsing
            // In a real application, you'd integrate with a resume parsing API or library here.
            // For now, we'll simulate.
            console.log(`Simulating resume parsing for: ${resumeFilePath}`);
            const simulatedParsedData = {
                skills: ['SQL', 'JavaScript', 'Node.js'], // Ensure this is an array for MatchCalculationService
                contact: { email: 'dummy@example.com', phone: '123-456-7890' },
                experience: 'Intern at StartupX (2019)'
            };

            // 2. Get Job Skills for Match Calculation
            const job = await JobRepository.findById(jobId);
            const jobSkills = job ? (Array.isArray(job.required_skills) ? job.required_skills : []) : [];

            // 3. Calculate Match Percentage
            const matchPercentage = MatchCalculationService.calculateMatch(jobSkills, simulatedParsedData.skills);

            // 4. Update Application with Parsed Data and Match Percentage
            await ApplicationRepository.update(applicationId, {
                resume_parsed_data: simulatedParsedData,
                match_percentage: matchPercentage.toString(), // Store as string if DB column is TEXT/VARCHAR
                updated_at: new Date() // Explicitly update timestamp
            });

            console.log(`Application ${applicationId} processed. Match: ${matchPercentage}%`);

        } catch (error) {
            console.error(`Error processing application ${applicationId}:`, error);
            // Log the error but don't re-throw, as this is an async background process
        }
    }

    /**
     * Retrieves all applications for a specific job.
     * @param {string} jobId - The ID of the job.
     * @returns {Promise<Array<object>>} An array of application objects.
     */
    static async getApplicationsForJob(jobId) {
        return ApplicationRepository.findByJobId(jobId);
    }

    /**
     * Updates the status, notes, or tags of an application.
     * @param {string} applicationId - The ID of the application.
     * @param {string} status - New application status.
     * @param {string} internalNotes - Internal notes for the application.
     * @param {Array<string>} internalTags - Internal tags for the application.
     * @returns {Promise<object>} The updated application object.
     */
    static async updateApplicationStatus(applicationId, status, internalNotes, internalTags) {
        const updateData = {
            application_status: status,
            internal_notes: internalNotes,
            internal_tags: internalTags
        };
        return ApplicationRepository.update(applicationId, updateData);
    }

    /**
     * Generates a signed URL for a resume file stored in GCS.
     * @param {string} applicationId - The ID of the application.
     * @param {string} recruiterId - The ID of the recruiter requesting the resume (for authorization).
     * @returns {Promise<string>} The signed URL.
     */
    static async getResumeSignedUrl(applicationId, recruiterId) {
        const application = await ApplicationRepository.findById(applicationId);

        if (!application || !application.resume_file_path) {
            throw new Error('Resume not found for this application.');
        }

        // Add authorization check here:
        // Ensure the recruiterId is authorized to view this application's resume
        // (e.g., check if the job associated with the application belongs to the recruiter's company)
        // For now, we'll assume authorization is handled at the controller/middleware level
        // or that any recruiter can view any resume for testing.

        const filePath = application.resume_file_path.replace(`gs://${bucketName}/`, '');
        const file = bucket.file(filePath);

        // Generate a signed URL that expires in 15 minutes (900 seconds)
        const [url] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        });

        return url;
    }
}

module.exports = ApplicationService;
