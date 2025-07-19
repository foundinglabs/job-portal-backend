const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool(config.database);

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

async function query(text, params) {
    const client = await pool.connect();
    try {
        const res = await client.query(text, params);
        return res;
    } finally {
        client.release();
    }
}

module.exports = {
    query,
    pool // Export pool if you need to run direct transactions or more advanced queries
};