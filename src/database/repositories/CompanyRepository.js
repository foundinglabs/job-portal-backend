const { query } = require('../connection');

class CompanyRepository {
    /**
     * Creates a new company record.
     * @param {object} companyData - The company details.
     * @param {string} companyData.name - The name of the company.
     * @param {string} [companyData.description] - The description of the company.
     * @param {string} [companyData.website] - The website of the company.
     * @param {string} [companyData.logo_url] - The logo URL of the company.
     * @returns {Promise<object>} The newly created company object.
     * @throws {Error} If company creation fails (e.g., unique constraint violation).
     */
    static async create(companyData) {
        const { name, description, website, logo_url } = companyData;
        try {
            const { rows } = await query(
                `INSERT INTO companies (name, description, website, logo_url, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
                [name, description, website, logo_url]
            );
            return rows[0];
        } catch (error) {
            console.error('Error creating company:', error);
            if (error.code === '23505') { // PostgreSQL unique_violation error code
                // Check if the unique constraint is on 'name' or 'website'
                if (error.detail && (error.detail.includes('Key (name)') || error.detail.includes('Key (website)'))) {
                    const conflictError = new Error('Company with this name or website already exists.');
                    conflictError.statusCode = 409; // HTTP 409 Conflict
                    throw conflictError;
                }
            }
            throw new Error('Could not create company.');
        }
    }

    /**
     * Finds a company by its ID.
     * @param {string} id - The UUID of the company.
     * @returns {Promise<object|null>} The company object if found, otherwise null.
     */
    static async findById(id) {
        try {
            const { rows } = await query('SELECT * FROM companies WHERE id = $1', [id]);
            return rows[0];
        } catch (error) {
            console.error('Error finding company by ID:', error);
            throw new Error('Could not retrieve company by ID.');
        }
    }

    /**
     * Finds a company by its name (case-insensitive).
     * This method is specifically added to resolve the 'findByName is not a function' error.
     * @param {string} name - The name of the company.
     * @returns {Promise<object|null>} The company object if found, otherwise null.
     */
    static async findByName(name) {
        try {
            const { rows } = await query('SELECT * FROM companies WHERE LOWER(name) = LOWER($1)', [name]);
            return rows[0];
        } catch (error) {
            console.error('Error finding company by name:', error);
            throw new Error('Could not retrieve company by name.');
        }
    }

    /**
     * Finds a company by its name or website (case-insensitive).
     * Used to prevent duplicate companies during signup.
     * @param {string} name - The name of the company.
     * @param {string} website - The website of the company.
     * @returns {Promise<object|null>} The company object if found, otherwise null.
     */
    static async findByNameOrWebsite(name, website) {
        try {
            const { rows } = await query(
                `SELECT * FROM companies WHERE LOWER(name) = LOWER($1) OR LOWER(website) = LOWER($2)`,
                [name, website]
            );
            return rows[0];
        } catch (error) {
            console.error('Error finding company by name or website:', error);
            throw new Error('Could not retrieve company by name or website.');
        }
    }

    /**
     * Updates an existing company record.
     * @param {string} id - The UUID of the company to update.
     * @param {object} updateData - An object containing the fields to update.
     * @returns {Promise<object|null>} The updated company object if found, otherwise null.
     */
    static async update(id, updateData) {
        const setClauses = [];
        const params = [];
        let paramIndex = 1;

        // Filter out undefined values
        const filteredUpdateData = Object.entries(updateData).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {});

        for (const key in filteredUpdateData) {
            if (filteredUpdateData.hasOwnProperty(key)) {
                setClauses.push(`${key} = $${paramIndex++}`);
                params.push(filteredUpdateData[key]);
            }
        }
        
        if (setClauses.length === 0) {
            return null; // No fields to update
        }

        params.push(id); // Add ID for the WHERE clause

        const queryString = `UPDATE companies SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;
        try {
            const { rows } = await query(queryString, params);
            return rows[0];
        } catch (error) {
            console.error('Error updating company:', error);
            if (error.code === '23505') { // Unique violation
                const conflictError = new Error('Company with this name or website already exists.');
                conflictError.statusCode = 409;
                throw conflictError;
            }
            throw new Error('Could not update company.');
        }
    }

    /**
     * Deletes a company record.
     * @param {string} id - The UUID of the company to delete.
     * @returns {Promise<boolean>} True if the company was deleted, false otherwise.
     */
    static async delete(id) {
        try {
            const { rowCount } = await query('DELETE FROM companies WHERE id = $1', [id]);
            return rowCount > 0;
        } catch (error) {
            console.error('Error deleting company:', error);
            throw new Error('Could not delete company.');
        }
    }
}

module.exports = CompanyRepository;