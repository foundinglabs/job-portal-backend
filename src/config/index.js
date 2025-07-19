require('dotenv').config();

module.exports = {
    port: process.env.PORT || 5000,
    database: {
        host: process.env.SUPABASE_DB_HOST,
        port: process.env.SUPABASE_DB_PORT,
        user: process.env.SUPABASE_DB_USER,
        password: process.env.SUPABASE_DB_PASSWORD,
        database: process.env.SUPABASE_DB_NAME,
        ssl: {
            rejectUnauthorized: false, // Required for Supabase production DB connection
            host: process.env.SUPABASE_DB_HOST // Keep this for SSL certificate validation
        },
    },
    supabase: {
        url: process.env.SUPABASE_URL,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        jwtSecret: process.env.SUPABASE_JWT_SECRET
    },
    googleCloud: {
        bucketName: process.env.GCS_BUCKET_NAME,
        projectId: process.env.GCS_PROJECT_ID,
        clientEmail: process.env.GCS_CLIENT_EMAIL,
        privateKey: process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n') // Replace escaped newlines
    }
};
