const express = require('express');
const multer = require('multer');
const ApplicationsController = require('../controllers/applications.controller');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer(); // Use multer for file uploads, handles multipart/form-data

// Candidate applying without login
router.post('/apply', upload.single('resume'), ApplicationsController.applyWithoutLogin);

// Recruiter-only routes
router.get('/job/:jobId', authMiddleware, authorizeRoles(['recruiter', 'admin']), ApplicationsController.getApplicationsForJob);
router.patch('/:id/status', authMiddleware, authorizeRoles(['recruiter', 'admin']), ApplicationsController.updateApplicationStatus);
router.get('/:applicationId/resume', authMiddleware, authorizeRoles(['recruiter', 'admin']), ApplicationsController.getResume);


module.exports = router;