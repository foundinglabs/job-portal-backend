const validateAuthInput = (type) => (req, res, next) => {
    const { email, password, confirmPassword, companyName, companyWebsite } = req.body;
    const errors = [];

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Invalid email format.');
    }
    
    if (type !== 'login' && (!email || !password)) {
        errors.push('Email and password are required.');
    }

    if (type === 'signup' || type === 'recruiterSignup') {
        if (password && password.length < 6) {
            errors.push('Password must be at least 6 characters long.');
        }
        if (password !== confirmPassword) {
            errors.push('Passwords do not match.');
        }
    }

    if (type === 'recruiterSignup') {
        if (!companyName) errors.push('Company Name is required for recruiter sign up.');
        if (!companyWebsite) errors.push('Company Website is required for recruiter sign up.');
        if (companyWebsite && !/^https?:\/\/.+\..+/.test(companyWebsite)) {
            errors.push('Invalid Company Website URL format.');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }
    next();
};

module.exports = { validateAuthInput };