// src/api/routes/auth.routes.js

const express = require('express');
const AuthController = require('../controllers/auth.controller');
const validateAuthInput = require('../validators/authValidator');
const { authMiddleware } = require('../middleware/authMiddleware'); // Make sure authMiddleware is imported

const router = express.Router();

router.post('/login', validateAuthInput('login'), AuthController.login);
router.post('/signup/candidate', validateAuthInput('signupCandidate'), AuthController.signupCandidate);
router.post('/signup/recruiter', validateAuthInput('recruiterSignup'), AuthController.signupRecruiter);

// CRITICAL ADDITION: Route for fetching authenticated user's details
router.get('/me', authMiddleware, AuthController.getMe); // <-- ADD THIS LINE

module.exports = router;