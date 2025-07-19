const app = require('./app');
const config = require('./config');
const { query, pool } = require('./database/connection'); // Import pool to test connection

const startServer = async () => {
    try {
        // Test database connection
        await pool.query('SELECT 1 + 1 AS solution;');
        console.log('Database connected successfully!');

        app.listen(config.port, () => {
            console.log(`Server running on port ${config.port}`);
            console.log(`Access health check at http://localhost:${config.port}/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        console.error('Ensure environment variables are set and database is accessible.');
        process.exit(1); // Exit with failure code
    }
};

startServer();