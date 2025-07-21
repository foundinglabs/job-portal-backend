class CandidateProfile {
    constructor({ id, user_id, full_name, email, phone, linkedin_profile_url, resume_file_path, parsed_data, match_percentage, created_at, updated_at }) {
        this.id = id;
        this.user_id = user_id;
        this.full_name = full_name;
        this.email = email;
        this.phone = phone;
        this.linkedin_profile_url = linkedin_profile_url;
        this.resume_file_path = resume_file_path;
        this.parsed_data = parsed_data;
        this.match_percentage = match_percentage;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
}

module.exports = CandidateProfile;
