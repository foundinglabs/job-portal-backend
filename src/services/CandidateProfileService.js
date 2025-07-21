const CandidateProfileRepository = require('../database/repositories/CandidateProfileRepository');
const MatchCalculationService = require('./MatchCalculationService'); // Assuming this service exists
const { Storage } = require('@google-cloud/storage');
const bucketName = process.env.GCS_BUCKET_NAME;
const storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    credentials: {
        client_email: process.env.GCS_CLIENT_EMAIL,
        private_key: process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
});
const bucket = storage.bucket(bucketName);

class CandidateProfileService {
    async createProfile(profileData) {
        // 1. Check if a profile already exists for this user_id
        const existingProfile = await CandidateProfileRepository.findByUserId(profileData.user_id);
        if (existingProfile) {
            // If a profile already exists, throw an error to indicate conflict
            const error = new Error('Candidate profile already exists for this user.');
            error.statusCode = 409; // HTTP 409 Conflict
            throw error;
        }

        // 2. If no profile exists, proceed with creation
        return CandidateProfileRepository.create(profileData);
    }

    async getProfileByUserId(userId) {
        const profile = await CandidateProfileRepository.findByUserId(userId);
        return profile;
    }

    async updateProfile(userId, updateData) {
        return CandidateProfileRepository.updateByUserId(userId, updateData);
    }

    async getResumeByUserId(userId) {
        const profile = await CandidateProfileRepository.findByUserId(userId);
        if (!profile || !profile.resume_file_path) {
            return { profile: null, resumeUrl: null };
        }

        const filePath = profile.resume_file_path.replace(`gs://${bucketName}/`, '');
        const file = bucket.file(filePath);

        const [url] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        });

        return { profile, resumeUrl: url };
    }

    async processCandidateResume(profileId, resumeFilePath, jobSkills = []) {
        console.log(`Simulating resume parsing for: ${resumeFilePath}`);
        const simulatedParsedData = {
            skills: ['JavaScript', 'Node.js', 'React', 'SQL'],
            contact: { email: 'dummy@example.com', phone: '123-456-7890' },
            experience: 'Software Engineer at TechCorp (2020-Present)'
        };

        let matchPercentage = 0;
        if (jobSkills && jobSkills.length > 0) {
            matchPercentage = MatchCalculationService.calculateMatch(jobSkills, simulatedParsedData.skills);
        }

        await CandidateProfileRepository.update(profileId, {
            parsed_data: simulatedParsedData,
            match_percentage: matchPercentage
        });

        console.log(`Candidate profile ${profileId} processed. Match: ${matchPercentage}%`);
        return { parsedData: simulatedParsedData, matchPercentage };
    }
}

module.exports = new CandidateProfileService();
