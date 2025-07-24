const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { validateAuthInput } = require('../validators/authValidator');

const router = express.Router();

router.post('/login', validateAuthInput('login'), AuthController.login);
router.post('/signup/candidate', validateAuthInput('signup'), AuthController.signupCandidate);
router.post('/signup/recruiter', validateAuthInput('recruiterSignup'), AuthController.signupRecruiter);

module.exports = router;