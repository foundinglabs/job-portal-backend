const RecruiterRepository = require('../../database/repositories/RecruiterRepository');
const ApplicationRepository = require('../../database/repositories/ApplicationRepository');
const JobRepository = require('../../database/repositories/JobRepository');

class RecruiterController {
    static async getRecruiterProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const profile = await RecruiterRepository.findProfileWithCompany(userId);
            if (!profile) {
                return res.status(404).json({ message: 'Recruiter profile not found.' });
            }
            res.status(200).json(profile);
        } catch (error) {
            console.error('Error fetching recruiter profile:', error);
            res.status(500).json({ message: 'Failed to fetch recruiter profile.' });
        }
    }
}

module.exports = RecruiterController;