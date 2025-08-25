const express = require('express');
const multer = require('multer');
const ApplicationsController = require('../controllers/applications.controller');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer(); // Use multer for file uploads, handles multipart/form-data

// Middleware to block recruiters from applying
const blockRecruiters = (req, res, next) => {
    // If the request has an authenticated user and their role is 'recruiter', deny access.
    // This assumes authMiddleware runs before this check.
    if (req.user && req.user.role === 'recruiter') {
        return res.status(403).json({ message: 'Recruiters cannot apply for jobs.' });
    }
    next();
};

// Candidate applying without login
// The authMiddleware is optional here, as applyWithoutLogin is designed for unauthenticated users.
// However, if an authenticated user (like a recruiter) tries to access it, they will be blocked by blockRecruiters.
// router.post('/apply', upload.single('resume'), authMiddleware, blockRecruiters, ApplicationsController.applyWithoutLogin);
router.post('/apply', upload.single('resume'), blockRecruiters, ApplicationsController.applyWithoutLogin);

// Recruiter-only routes
router.get('/job/:jobId', authMiddleware, authorizeRoles(['recruiter', 'admin']), ApplicationsController.getApplicationsForJob);
router.patch('/:id/status', authMiddleware, authorizeRoles(['recruiter', 'admin']), ApplicationsController.updateApplicationStatus);
router.get('/:applicationId/resume', authMiddleware, authorizeRoles(['recruiter', 'admin']), ApplicationsController.getResume);

module.exports = router;