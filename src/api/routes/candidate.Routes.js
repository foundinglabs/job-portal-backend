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

// Route to create a new candidate profile
// Requires candidate authentication and allows resume upload
router.post(
    '/profile',
    authMiddleware, // Ensure user is authenticated
    authorizeRoles(['candidate']), // Ensure user has 'candidate' role
    upload.single('resume'), // 'resume' is the field name for the file
    CandidateProfileController.createProfile
);


// Route to get candidate profile by logged-in user
router.get(
    '/profile',
    authMiddleware,
    authorizeRoles(['candidate']),
    CandidateProfileController.getProfile
);

// Route to update candidate profile by logged-in user
router.put(
    '/profile',
    authMiddleware,
    authorizeRoles(['candidate']),
    upload.single('resume'), // Allow updating resume
    CandidateProfileController.updateProfile
);

// Route to get candidate resume (signed URL)
router.get(
    '/profile/resume',
    authMiddleware,
    authorizeRoles(['candidate', 'recruiter', 'admin']), // Recruiters/Admins should also be able to view candidate resumes
    CandidateProfileController.getResume
);

// You might also have routes for saved jobs here or in a separate file
// router.post('/saved-jobs', authMiddleware, authorizeRoles(['candidate']), CandidateProfileController.saveJob);
// router.get('/saved-jobs', authMiddleware, authorizeRoles(['candidate']), CandidateProfileController.getSavedJobs);
// router.delete('/saved-jobs/:jobId', authMiddleware, authorizeRoles(['candidate']), CandidateProfileController.unsaveJob);


module.exports = router;
