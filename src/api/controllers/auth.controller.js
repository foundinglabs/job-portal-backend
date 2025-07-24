const AuthService = require('../../services/AuthService');

class AuthController {
    static async login(req, res, next) {
        try {
            const { email, password, token, provider } = req.body;
            const result = await AuthService.login(email, password, token, provider);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async signupCandidate(req, res, next) {
        try {
            const { email, password, token, provider } = req.body;
            const newUser = await AuthService.signupCandidate(email, password, token, provider);
            res.status(201).json({ message: 'Candidate account created successfully!', user: newUser });
        } catch (error) {
            next(error);
        }
    }

    static async signupRecruiter(req, res, next) {
        try {
            const { email, password, token, provider, companyName, companyWebsite, companyDescription, companyLogoUrl } = req.body;
            const newRecruiter = await AuthService.signupRecruiter(email, password, token, provider, {
                name: companyName,
                website: companyWebsite,
                description: companyDescription,
                logo_url: companyLogoUrl
            });
            res.status(201).json({ message: 'Recruiter account created successfully!', recruiter: newRecruiter });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuthController;