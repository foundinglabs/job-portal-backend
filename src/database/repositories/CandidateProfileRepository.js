const { query } = require('../connection');
const CandidateProfile = require('../models/CandidateProfile'); // Assuming you have this model

class CandidateProfileRepository {
    async create(profileData) {
        const { user_id, full_name, email, phone, linkedin_profile_url, resume_file_path, parsed_data, match_percentage } = profileData;
        try {
            // Correctly access the 'rows' property from the query result
            const { rows } = await query(
                `INSERT INTO candidate_profiles (user_id, full_name, email, phone, linkedin_profile_url, resume_file_path, parsed_data, match_percentage, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *`,
                [user_id, full_name, email, phone, linkedin_profile_url, resume_file_path, parsed_data, match_percentage]
            );
            // Get the first (and only) row from the result
            const newProfile = rows[0];
            return new CandidateProfile(newProfile);
        } catch (error) {
            console.error('Error creating candidate profile:', error);
            throw new Error('Could not create candidate profile.');
        }
    }

    async findByUserId(userId) {
        try {
            const { rows } = await query('SELECT * FROM candidate_profiles WHERE user_id = $1', [userId]);
            return rows[0] ? new CandidateProfile(rows[0]) : null;
        } catch (error) {
            console.error('Error finding candidate profile by user ID:', error);
            throw new Error('Could not retrieve candidate profile.');
        }
    }

    async updateByUserId(userId, updateData) {
        const setClauses = [];
        const params = [];
        let paramIndex = 1;

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
            return null;
        }

        params.push(userId); // Add user_id for the WHERE clause

        const queryString = `UPDATE candidate_profiles SET ${setClauses.join(', ')}, updated_at = NOW() WHERE user_id = $${paramIndex} RETURNING *`;
        try {
            const { rows } = await query(queryString, params);
            return rows[0] ? new CandidateProfile(rows[0]) : null;
        } catch (error) {
            console.error('Error updating candidate profile by user ID:', error);
            throw new Error('Could not update candidate profile.');
        }
    }

    // You might add a delete method here if needed
}

module.exports = new CandidateProfileRepository();
