const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // Get inventory overview with filters and sorting
    router.get('/', async (req, res) => {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { sort = 'rarity', filter = '', page = 1 } = req.query;
        const limit = 20;
        const offset = (page - 1) * limit;

        try {
            // First, check if the sort column is valid to prevent SQL injection
            const validSortColumns = ['rarity', 'level', 'base_power', 'name'];
            if (!validSortColumns.includes(sort)) {
                return res.status(400).json({ error: 'Invalid sort parameter' });
            }

            // Render the inventory page instead of returning JSON
            return res.render('inventory', {
                username: req.session.username
            });
            
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Database error' });
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
