class MatchCalculationService {
    /**
     * Calculates a match percentage between job skills and candidate resume skills.
     * This is a simplified example. A real-world scenario would involve more sophisticated NLP.
     * @param {Array<string>} jobSkills - Array of skills required for the job.
     * @param {Array<string>} resumeSkills - Array of skills extracted from the resume.
     * @returns {number} Match percentage (0-100).
     */
    static calculateMatch(jobSkills, resumeSkills) {
        // Ensure jobSkills and resumeSkills are arrays.
        // If resumeSkills is not an array (e.g., null or undefined), treat it as an empty array.
        const effectiveJobSkills = Array.isArray(jobSkills) ? jobSkills.map(skill => skill.toLowerCase()) : [];
        const effectiveResumeSkills = Array.isArray(resumeSkills) ? resumeSkills.map(skill => skill.toLowerCase()) : [];

        if (effectiveJobSkills.length === 0) {
            return 0; // Cannot calculate match without job skills
        }

        let matchedSkillsCount = 0;
        for (const jobSkill of effectiveJobSkills) {
            if (effectiveResumeSkills.includes(jobSkill)) {
                matchedSkillsCount++;
            }
        }

        const matchPercentage = (matchedSkillsCount / effectiveJobSkills.length) * 100;
        return parseFloat(matchPercentage.toFixed(2)); // Round to 2 decimal places
    }
}

module.exports = MatchCalculationService;
