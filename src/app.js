const express = require('express');
const cors = require('cors'); // If your frontend is on a different domain
const morgan = require('morgan'); // For request logging

const jobsRoutes = require('./api/routes/jobs.routes');
const applicationsRoutes = require('./api/routes/applications.routes');

const app = express();

// Middleware
app.use(cors()); // Configure CORS as needed for production
app.use(morgan('dev')); // HTTP request logger
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// API Routes
app.use('/api/jobs', jobsRoutes);
app.use('/api/applications', applicationsRoutes);

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