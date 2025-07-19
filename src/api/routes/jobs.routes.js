const express = require('express');
const JobsController = require('../controllers/jobs.controller');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Publicly accessible routes to get jobs
router.get('/', JobsController.getAllJobs);
router.get('/:id', JobsController.getJobById);

// Recruiter-only routes (require authentication and specific roles)
// These routes allow recruiters (or admins) to create, update, and delete job listings.
router.post('/', authMiddleware, authorizeRoles(['recruiter', 'admin']), JobsController.createJob);
router.put('/:id', authMiddleware, authorizeRoles(['recruiter', 'admin']), JobsController.updateJob);
router.delete('/:id', authMiddleware, authorizeRoles(['recruiter', 'admin']), JobsController.deleteJob);

module.exports = router;
