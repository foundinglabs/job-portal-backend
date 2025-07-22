class SavedJob {
    constructor({ id, user_id, job_id, created_at }) {
        this.id = id;
        this.user_id = user_id;
        this.job_id = job_id;
        this.created_at = created_at;
    }
}

module.exports = SavedJob;
