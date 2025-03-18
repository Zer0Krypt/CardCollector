const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // Get inventory overview with filters and sorting
    router.get('/', async (req, res) => {
        const userId = req.session.userId;
        const { sort = 'rarity', filter, page = 1 } = req.query;
        const limit = 20;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                pc.*,
                c.name,
                c.faction,
                c.type,
                c.base_power,
                c.attack_type,
                c.attack_pattern,
                c.element_type,
                c.rarity,
                c.is_hero,
                c.image_url
            FROM player_cards pc
            JOIN cards c ON pc.card_id = c.id
            WHERE pc.user_id = ?
        `;

        const params = [userId];

        if (filter) {
            query += ` AND (c.type = ? OR c.faction = ? OR c.rarity = ?)`;
            params.push(filter, filter, filter);
        }

        query += ` ORDER BY c.${sort} DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        try {
            const cards = await new Promise((resolve, reject) => {
                db.all(query, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            // Get total count for pagination
            const countResult = await new Promise((resolve, reject) => {
                db.get('SELECT COUNT(*) as total FROM player_cards WHERE user_id = ?', 
                    [userId], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
            });

            res.json({
                cards,
                totalPages: Math.ceil(countResult.total / limit),
                currentPage: page
            });
        } catch (error) {
            res.status(500).json({ error: 'Database error' });
        }
    });

    // Get inventory statistics
    router.get('/stats', async (req, res) => {
        const userId = req.session.userId;
        
        try {
            const stats = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT 
                        c.rarity,
                        COUNT(*) as count,
                        SUM(pc.level) as total_levels,
                        COUNT(CASE WHEN pc.level = 20 AND pc.evolution > 1 THEN 1 END) as evolved_count
                    FROM player_cards pc
                    JOIN cards c ON pc.card_id = c.id
                    WHERE pc.user_id = ?
                    GROUP BY c.rarity
                `, [userId], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: 'Database error' });
        }
    });

    return router;
};