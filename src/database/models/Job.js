// This is a simple representation, not an ORM model.
// An ORM (like Sequelize or Prisma) would generate these from your DB schema.
class Job {
    constructor({ id, company_id, posted_by_recruiter_id, title, description, skills_required, experience_level, location, job_type, salary_range_min, salary_range_max, external_apply_link, application_mode, created_at, updated_at, is_active }) {
        this.id = id;
        this.company_id = company_id;
        this.posted_by_recruiter_id = posted_by_recruiter_id;
        this.title = title;
        this.description = description;
        this.skills_required = skills_required;
        this.experience_level = experience_level;
        this.location = location;
        this.job_type = job_type;
        this.salary_range_min = salary_range_min;
        this.salary_range_max = salary_range_max;
        this.external_apply_link = external_apply_link;
        this.application_mode = application_mode;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.is_active = is_active;
    }
}

module.exports = Job;