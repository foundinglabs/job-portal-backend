// src/api/controllers/auth.controller.js

const AuthService = require('../../services/AuthService');

class AuthController {
    /**
     * Handles recruiter sign-up requests from the frontend.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @param {function} next - Express next middleware function.
     */
    static async signupRecruiter(req, res, next) {
        try {
            // Destructure all expected fields from the request body
            const { email, password, confirmPassword, companyName, companyWebsite, companyDescription, companyLogoUrl, token, provider } = req.body;

            // Basic validation (more comprehensive validation is in authValidator.js middleware)
            if (!email || !password || !confirmPassword || !companyName) {
                const error = new Error('Missing required signup fields: email, password, confirmPassword, companyName.');
                error.statusCode = 400;
                throw error;
            }

            // Call the AuthService to handle the signup logic
            const newRecruiter = await AuthService.signupRecruiter({
                email,
                password,
                confirmPassword,
                companyName,
                companyWebsite,
                companyDescription,
                companyLogoUrl,
                token, // Pass token and provider if it's a social signup flow
                provider
            });

            res.status(201).json({ message: 'Recruiter account created successfully!', recruiter: newRecruiter });
        } catch (error) {
            console.error('Error in signupRecruiter controller:', error);
            // Pass the error to the global error handling middleware
            next(error);
        }
    }

    /**
     * Handles candidate sign-up requests from the frontend.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @param {function} next - Express next middleware function.
     */
    static async signupCandidate(req, res, next) {
        try {
            // Destructure all expected fields from the request body
            const { email, password, confirmPassword, token, provider } = req.body;

            // Basic validation (more comprehensive validation is in authValidator.js middleware)
            if (!email || !password || !confirmPassword) {
                const error = new Error('Missing required signup fields: email, password, confirmPassword.');
                error.statusCode = 400;
                throw error;
            }

            // Call the AuthService to handle the signup logic
            const newCandidate = await AuthService.signupCandidate({
                email,
                password,
                token,
                provider
            });

            res.status(201).json({ message: 'Candidate account created successfully!', candidate: newCandidate });
        } catch (error) {
            console.error('Error in signupCandidate controller:', error);
            // Pass the error to the global error handling middleware
            next(error);
        }
    }

    /**
     * Handles user login requests.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @param {function} next - Express next middleware function.
     */
    static async login(req, res, next) {
        try {
            const { email, password, token, provider } = req.body;

            // Basic validation
            if ((!email || !password) && (!token || !provider)) {
                const error = new Error('Email/password or social token/provider are required for login.');
                error.statusCode = 400;
                throw error;
            }

            // Call the AuthService to handle login
            const loginData = await AuthService.login(email, password, token, provider);
            res.status(200).json(loginData);
        } catch (error) {
            console.error('Error in login controller:', error);
            next(error);
        }
    }

    /**
     * Retrieves authenticated user's basic information (role, company_id).
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @param {function} next - Express next middleware function.
     */
    static async getMe(req, res, next) {
        try {
            // req.user is set by authMiddleware (contains id, role, company_id)
            if (!req.user || !req.user.id) {
                const error = new Error('User not authenticated.');
                error.statusCode = 401;
                throw error;
            }

            // The authMiddleware already fetches and attaches role and company_id to req.user
            res.status(200).json({
                user_id: req.user.id,
                role: req.user.role,
                company_id: req.user.company_id // Ensure this is consistently named
            });
        } catch (error) {
            console.error('Error in getMe controller:', error);
            next(error);
        }
    }
}

module.exports = AuthController;