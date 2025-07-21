const CandidateProfileService = require('../../services/CandidateProfileService');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Initialize Google Cloud Storage
const storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    credentials: {
        client_email: process.env.GCS_CLIENT_EMAIL,
        private_key: process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
});
const bucketName = process.env.GCS_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

class CandidateProfileController {
    /**
     * Creates a new candidate profile.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     */
    async createProfile(req, res) {
        try {
            const userId = req.user.id; // Get user ID from authenticated token
            const { full_name, email, phone, linkedin_profile_url } = req.body;
            let resumeFilePath = null;

            // Handle resume upload if present
            if (req.file) {
                const file = req.file;
                const fileExtension = path.extname(file.originalname);
                const fileName = `candidate_profiles/${userId}/${uuidv4()}${fileExtension}`;
                const blob = bucket.file(fileName);
                const blobStream = blob.createWriteStream({
                    resumable: false,
                    metadata: {
                        contentType: file.mimetype
                    }
                });

                await new Promise((resolve, reject) => {
                    blobStream.on('error', (err) => {
                        console.error('GCS upload error:', err);
                        reject(new Error('Failed to upload resume to cloud storage.'));
                    });
                    blobStream.on('finish', () => {
                        console.log(`Resume uploaded to ${fileName}`);
                        resumeFilePath = `gs://${bucketName}/${fileName}`;
                        resolve();
                    });
                    blobStream.end(file.buffer);
                });
            }

            const profileData = {
                user_id: userId,
                full_name,
                email,
                phone,
                linkedin_profile_url,
                resume_file_path: resumeFilePath // Store GCS path
            };

            const newProfile = await CandidateProfileService.createProfile(profileData);

            res.status(201).json({
                message: 'Candidate profile created successfully!',
                profile: newProfile
            });

        } catch (error) {
            console.error('Error creating candidate profile:', error);
            // Handle the specific 409 Conflict error from the service
            if (error.statusCode === 409) {
                return res.status(409).json({ message: error.message });
            }
            res.status(500).json({ message: error.message || 'Could not create candidate profile.' });
        }
    }

    // You will add other methods like getProfile, updateProfile, getResume here
    async getProfile(req, res) {
        try {
            const userId = req.user.id;
            const profile = await CandidateProfileService.getProfileByUserId(userId);

            if (!profile) {
                return res.status(404).json({ message: 'Candidate profile not found.' });
            }
            res.status(200).json(profile);
        } catch (error) {
            console.error('Error fetching candidate profile:', error);
            res.status(500).json({ message: error.message || 'Could not retrieve candidate profile.' });
        }
    }

    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const { full_name, email, phone, linkedin_profile_url } = req.body;
            let resumeFilePath = null;

            // Handle resume upload if present
            if (req.file) {
                const file = req.file;
                const fileExtension = path.extname(file.originalname);
                const fileName = `candidate_profiles/${userId}/${uuidv4()}${fileExtension}`;
                const blob = bucket.file(fileName);
                const blobStream = blob.createWriteStream({
                    resumable: false,
                    metadata: {
                        contentType: file.mimetype
                    }
                });

                await new Promise((resolve, reject) => {
                    blobStream.on('error', (err) => {
                        console.error('GCS upload error:', err);
                        reject(new Error('Failed to upload resume to cloud storage.'));
                    });
                    blobStream.on('finish', () => {
                        console.log(`Resume uploaded to ${fileName}`);
                        resumeFilePath = `gs://${bucketName}/${fileName}`;
                        resolve();
                    });
                    blobStream.end(file.buffer);
                });
            }

            const updateData = {
                full_name,
                email,
                phone,
                linkedin_profile_url,
                resume_file_path: resumeFilePath // Update GCS path if new resume provided
            };

            const updatedProfile = await CandidateProfileService.updateProfile(userId, updateData);

            if (!updatedProfile) {
                return res.status(404).json({ message: 'Candidate profile not found for update.' });
            }

            res.status(200).json({
                message: 'Candidate profile updated successfully!',
                profile: updatedProfile
            });

        } catch (error) {
            console.error('Error updating candidate profile:', error);
            res.status(500).json({ message: error.message || 'Could not update candidate profile.' });
        }
    }

    async getResume(req, res) {
        try {
            const userId = req.user.id; // User requesting the resume
            const { profile, resumeUrl } = await CandidateProfileService.getResumeByUserId(userId);

            if (!profile || !resumeUrl) {
                return res.status(404).json({ message: 'Resume not found for this candidate.' });
            }

            res.status(200).json({ url: resumeUrl });

        } catch (error) {
            console.error('Error generating signed URL for candidate resume:', error);
            res.status(500).json({ message: error.message || 'Could not retrieve resume.' });
        }
    }
}

module.exports = new CandidateProfileController();
