const express = require('express');
const router = express.Router();
const RecruiterController = require('../controllers/recruiter.controller');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/profile', authorizeRoles(['recruiter', 'admin']), RecruiterController.getRecruiterProfile);

module.exports = router;