const express = require('express');
const router = express.Router();
const CandidateProfileController = require('../controllers/candidateProfile.controller');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure Multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory as buffers
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
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

// Saved Jobs Routes (NEW)
router.post(
    '/saved-jobs',
    authMiddleware,
    authorizeRoles(['candidate']),
    CandidateProfileController.saveJob // Assuming controller handles this
);

router.get(
    '/saved-jobs',
    authMiddleware,
    authorizeRoles(['candidate']),
    CandidateProfileController.getSavedJobs // Assuming controller handles this
);

router.delete(
    '/saved-jobs/:jobId',
    authMiddleware,
    authorizeRoles(['candidate']),
    CandidateProfileController.unsaveJob // Assuming controller handles this
);

module.exports = router;
