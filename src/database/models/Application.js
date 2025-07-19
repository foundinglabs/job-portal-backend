// This is a simple representation, not an ORM model.
// An ORM (like Sequelize or Prisma) would generate these from your DB schema.
class Application {
    constructor({ id, job_id, applicant_name, applicant_email, applicant_phone, applicant_linkedin_url, cover_letter_text, resume_file_path, application_status, applied_at, resume_parsed_data, match_percentage, internal_notes, internal_tags }) {
        this.id = id;
        this.job_id = job_id;
        this.applicant_name = applicant_name;
        this.applicant_email = applicant_email;
        this.applicant_phone = applicant_phone;
        this.applicant_linkedin_url = applicant_linkedin_url;
        this.cover_letter_text = cover_letter_text;
        this.resume_file_path = resume_file_path; // Path in Google Cloud Storage
        this.application_status = application_status; // 'New', 'Shortlisted', 'Screened', 'Interview', 'Hired', 'Rejected'
        this.applied_at = applied_at;
        this.resume_parsed_data = resume_parsed_data; // JSON representation of parsed resume data
        this.match_percentage = match_percentage; // Calculated match score
        this.internal_notes = internal_notes;
        this.internal_tags = internal_tags;
    }
}

module.exports = Application;