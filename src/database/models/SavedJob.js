class SavedJob {
    constructor({ id, user_id, job_id, saved_at }) {
        this.id = id;
        this.user_id = user_id;
        this.job_id = job_id;
        this.saved_at = saved_at;
    }
}

module.exports = SavedJob;
