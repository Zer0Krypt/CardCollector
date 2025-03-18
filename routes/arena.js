const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // Arena overview page
    router.get('/', (req, res) => {
        if (!req.session.userId) {
            res.redirect('/');
            return;
        }

        // Get user's arena stats and current rankings
        db.get(
            `SELECT 
                u.arena_rank,
                u.arena_wins,
                u.arena_losses
            FROM users u 
            WHERE u.id = ?`,
            [req.session.userId],
            (err, stats) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).send('Server error');
                }

                res.render('arena/overview', {
                    username: req.session.username,
                    arenaRank: stats ? stats.arena_rank : 1000,
                    arenaWins: stats ? stats.arena_wins : 0,
                    arenaLosses: stats ? stats.arena_losses : 0
                });
            }
        );
    });

    return router;
};