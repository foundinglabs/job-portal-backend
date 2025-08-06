// src/api/validators/authValidator.js

const validateAuthInput = (type) => {
    // Define the actual middleware function
    const middleware = (req, res, next) => {
        const { email, password, confirmPassword, companyName, companyWebsite } = req.body;
        const errors = [];

        // Basic email format validation
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('Invalid email format.');
        }

        // Email and password required for non-login types
        if (type !== 'login' && (!email || !password)) {
            errors.push('Email and password are required.');
        }

        // Password length and match validation for signup types
        if (type === 'signupCandidate' || type === 'recruiterSignup') {
            if (password && password.length < 6) {
                errors.push('Password must be at least 6 characters long.');
            }
            if (password && confirmPassword && password !== confirmPassword) {
                errors.push('Passwords do not match.');
            } else if (!confirmPassword && (type === 'signupCandidate' || type === 'recruiterSignup')) {
                errors.push('Confirm password is required.');
            }
        }

        // Recruiter specific validations
        if (type === 'recruiterSignup') {
            if (!companyName) errors.push('Company Name is required for recruiter sign up.');
            if (!companyWebsite) errors.push('Company Website is required for recruiter sign up.');
            if (companyWebsite && !/^https?:\/\/.+\..+/.test(companyWebsite)) {
                errors.push('Invalid Company Website URL format.');
            }
        }

        // If there are any validation errors, send a 400 Bad Request response
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }
        
        // If no errors, proceed to the next middleware or route handler
        next();
    };

    // CRUCIAL CHANGE: Return an array containing the middleware function.
    // Express is designed to handle an array of middlewares.
    return [middleware];
};

module.exports = validateAuthInput;