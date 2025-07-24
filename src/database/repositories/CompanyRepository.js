const { query } = require('../connection');

class CompanyRepository {
    static async create(companyData) {
        const { name, description, website, logo_url } = companyData;
        const { rows } = await query(
            `INSERT INTO companies (name, description, website, logo_url)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, description, website, logo_url]
        );
        return rows[0];
    }

    static async findById(id) {
        const { rows } = await query('SELECT * FROM companies WHERE id = $1', [id]);
        return rows[0];
    }

    static async findByNameOrWebsite(name, website) {
        const { rows } = await query(
            `SELECT * FROM companies WHERE LOWER(name) = LOWER($1) OR LOWER(website) = LOWER($2)`,
            [name, website]
        );
        return rows[0];
    }

    static async update(id, updateData) {
        const setClauses = [];
        const params = [];
        let paramIndex = 1;

        for (const key in updateData) {
            if (Object.hasOwnProperty.call(updateData, key)) {
                setClauses.push(`${key} = $${paramIndex++}`);
                params.push(updateData[key]);
            }
        }
        params.push(id);

        const queryString = `UPDATE companies SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;
        const { rows } = await query(queryString, params);
        return rows[0];
    }
}

module.exports = CompanyRepository;