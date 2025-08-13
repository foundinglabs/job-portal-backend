const express = require('express');
const SavedJobsController = require('../controllers/savedJobs.controller');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// All saved jobs routes require authentication
router.use(authMiddleware);

// Get all saved jobs for the authenticated user
router.get('/', SavedJobsController.getSavedJobs);

// Save a job for the authenticated user
router.post('/', SavedJobsController.saveJob);

// Unsave a job for the authenticated user
router.delete('/:jobId', SavedJobsController.unsaveJob);

// Check if a job is saved by the authenticated user
router.get('/check/:jobId', SavedJobsController.isJobSaved);

module.exports = router;

