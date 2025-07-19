// Basic validation function (can be replaced with a library like Joi or Zod)
const validateApplication = (data) => {
    const errors = [];
    if (!data.applicant_name) errors.push('Applicant name is required.');
    if (!data.applicant_email) errors.push('Applicant email is required.');
    // Basic email regex
    if (data.applicant_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.applicant_email)) errors.push('Invalid email format.');
    if (!data.job_id) errors.push('Job ID is required.');
    // Resume file path will be handled by multer and GCS upload

    return {
        isValid: errors.length === 0,
        errors: errors
    };
};

module.exports = {
    validateApplication
};