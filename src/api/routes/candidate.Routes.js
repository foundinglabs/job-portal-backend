const express = require('express');
const router = express.Router();
const CandidateProfileController = require('../controllers/candidateProfile.controller');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, and DOCX files are allowed for resumes!'));
        }
    }
});

// Candidate Profile Routes
router.post(
    '/profile',
    authMiddleware,
    authorizeRoles(['candidate']),
    upload.single('resume'),
    CandidateProfileController.createProfile
);

router.get(
    '/profile',
    authMiddleware,
    authorizeRoles(['candidate']),
    CandidateProfileController.getProfile
);

router.put(
    '/profile',
    authMiddleware,
    authorizeRoles(['candidate']),
    upload.single('resume'),
    CandidateProfileController.updateProfile
);

router.get(
    '/profile/resume',
    authMiddleware,
    authorizeRoles(['candidate', 'recruiter', 'admin']),
    CandidateProfileController.getResume
);

// Saved Jobs Routes
router.post(
    '/saved-jobs',
    authMiddleware,
    authorizeRoles(['candidate']),
    CandidateProfileController.saveJob
);

router.get(
    '/saved-jobs',
    authMiddleware,
    authorizeRoles(['candidate']),
    CandidateProfileController.getSavedJobs
);

router.delete(
    '/saved-jobs/:jobId',
    authMiddleware,
    authorizeRoles(['candidate']),
    CandidateProfileController.unsaveJob
);

// NEW: Check if a job is saved by the logged-in candidate
router.get(
    '/saved-jobs/:jobId/status',
    authMiddleware,
    authorizeRoles(['candidate']),
    CandidateProfileController.checkSavedStatus
);

module.exports = router;