const CandidateProfileService = require('../../services/CandidateProfileService');
const SavedJobService = require('../../services/SavedJobService');
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
    // --- Candidate Profile Methods ---

    static async createProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const { full_name, email, phone, linkedin_profile_url } = req.body;
            let resumeFilePath = null;

            if (req.file) {
                const file = req.file;
                const fileExtension = path.extname(file.originalname);
                const fileName = `candidate_profiles/${userId}/${uuidv4()}${fileExtension}`;
                const blob = bucket.file(fileName);
                const blobStream = blob.createWriteStream({
                    resumable: false,
                    metadata: { contentType: file.mimetype }
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
                resume_file_path: resumeFilePath
            };

            const newProfile = await CandidateProfileService.createProfile(profileData);

            res.status(201).json({
                message: 'Candidate profile created successfully!',
                profile: newProfile
            });

        } catch (error) {
            console.error('Error creating candidate profile:', error);
            if (error.statusCode === 409) {
                return res.status(409).json({ message: error.message });
            }
            res.status(500).json({ message: error.message || 'Could not create candidate profile.' });
        }
    }

    static async getProfile(req, res, next) {
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

    static async updateProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const { full_name, email, phone, linkedin_profile_url } = req.body;
            let resumeFilePath = null;

            if (req.file) {
                const file = req.file;
                const fileExtension = path.extname(file.originalname);
                const fileName = `candidate_profiles/${userId}/${uuidv4()}${fileExtension}`;
                const blob = bucket.file(fileName);
                const blobStream = blob.createWriteStream({
                    resumable: false,
                    metadata: { contentType: file.mimetype }
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
                resume_file_path: resumeFilePath
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

    static async getResume(req, res, next) {
        try {
            const userId = req.user.id;
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

    // --- Saved Jobs Methods ---

    static async saveJob(req, res, next) {
        try {
            const userId = req.user.id;
            const { jobId } = req.body;
            if (!jobId) {
                return res.status(400).json({ message: 'Job ID is required to save a job.' });
            }
            const savedJob = await SavedJobService.saveJob(userId, jobId);
            res.status(201).json({ message: 'Job saved successfully!', savedJob });
        } catch (error) {
            if (error.statusCode === 409) {
                return res.status(409).json({ message: error.message });
            }
            next(error);
        }
    }

    static async getSavedJobs(req, res, next) {
        try {
            const userId = req.user.id;
            const savedJobs = await SavedJobService.getSavedJobsByUserId(userId);
            res.status(200).json(savedJobs);
        } catch (error) {
            next(error);
        }
    }

    static async unsaveJob(req, res, next) {
        try {
            const userId = req.user.id;
            const { jobId } = req.params;
            const deleted = await SavedJobService.unsaveJob(userId, jobId);
            if (!deleted) {
                return res.status(404).json({ message: 'Saved job not found or already unsaved.' });
            }
            res.status(200).json({ message: 'Job unsaved successfully.' });
        } catch (error) {
            next(error);
        }
    }

    static async checkSavedStatus(req, res, next) {
        try {
            const { jobId } = req.params;
            const userId = req.user.id;
            const isSaved = await SavedJobService.isJobSaved(userId, jobId);
            res.status(200).json({ isSaved });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = CandidateProfileController;
