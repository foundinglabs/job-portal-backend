-- Create Users Table (for Supabase Auth integration, though Supabase manages it)
-- You'd typically link to Supabase's auth.users table using RLS,
-- but for a dedicated backend, you might manage roles/profiles here.
-- For now, let's assume `recruiters` and `candidate_profiles` link directly to Supabase's `auth.users.id`.

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    website TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recruiters (
    user_id UUID PRIMARY KEY, -- Links to Supabase auth.users.id
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'recruiter', -- 'admin', 'recruiter', 'viewer'
    full_name TEXT,
    phone TEXT,
    linkedin_profile_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    posted_by_recruiter_id UUID REFERENCES recruiters(user_id) ON DELETE SET NULL, -- Who posted it
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    skills_required TEXT[] DEFAULT '{}',
    experience_level TEXT, -- 'entry', 'junior', 'mid', 'senior', 'lead'
    location TEXT, -- e.g., "Remote", "Meerut, India"
    job_type TEXT NOT NULL, -- 'remote', 'onsite', 'hybrid', 'internship'
    salary_range_min NUMERIC,
    salary_range_max NUMERIC,
    external_apply_link TEXT,
    application_mode TEXT NOT NULL, -- 'internal' or 'external'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
    applicant_name TEXT NOT NULL,
    applicant_email TEXT NOT NULL,
    applicant_phone TEXT,
    applicant_linkedin_url TEXT,
    cover_letter_text TEXT,
    resume_file_path TEXT NOT NULL, -- Path in Google Cloud Storage
    application_status TEXT DEFAULT 'New', -- 'New', 'Shortlisted', 'Screened', 'Interview', 'Hired', 'Rejected'
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resume_parsed_data JSONB, -- JSON representation of parsed resume data
    match_percentage NUMERIC, -- Calculated match score
    internal_notes TEXT,
    internal_tags TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS candidate_profiles (
    user_id UUID PRIMARY KEY, -- Links to Supabase auth.users.id for logged-in candidates
    full_name TEXT,
    email TEXT,
    phone TEXT,
    linkedin_profile_url TEXT,
    resume_file_path TEXT, -- Path in Google Cloud Storage for their main resume
    parsed_data JSONB, -- Full parsed resume data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Links to Supabase auth.users.id
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, job_id)
);

-- Index for faster job search
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);
-- You might want to create a GIN index on skills_required for efficient search if PostgreSQL version supports it
-- CREATE EXTENSION IF NOT EXISTS pg_trgm; -- for fuzzy text search
-- CREATE INDEX IF NOT EXISTS idx_jobs_skills ON jobs USING GIN (skills_required);