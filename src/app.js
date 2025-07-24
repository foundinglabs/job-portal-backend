const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./api/routes/auth.routes'); // <-- NEW IMPORT
const jobsRoutes = require('./api/routes/jobs.routes');
const applicationsRoutes = require('./api/routes/applications.routes');
// const candidateRoutes = require('./api/routes/candidate.Routes'); // Removed as per discussion

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes); // <-- NEW: Use auth routes
app.use('/api/jobs', jobsRoutes);
app.use('/api/applications', applicationsRoutes);
// app.use('/api/candidates', candidateRoutes); // Removed

// Basic Health Check Route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend is running!' });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        message: err.message || 'An unexpected error occurred.',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

module.exports = app;