const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // Arena overview page
    router.get('/', (req, res) => {
        try {
            if (!req.session || !req.session.userId) {
                console.log('No user session found, redirecting to login');
                return res.redirect('/login');
            }

            // Get user's arena stats and current rankings
            db.get(
                `SELECT 
                    username,
                    arena_rank,
                    arena_wins,
                    arena_losses
                FROM users 
                WHERE id = ?`,
                [req.session.userId],
                (err, user) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).render('error', {
                            message: 'Database error occurred',
                            error: { status: 500, stack: err.stack }
                        });
                    }

                    if (!user) {
                        console.error('User not found:', req.session.userId);
                        return res.status(404).render('error', {
                            message: 'User not found',
                            error: { status: 404 }
                        });
                    }

                    res.render('arena/overview', {
                        username: user.username,
                        arenaRank: user.arena_rank || 1000,
                        arenaWins: user.arena_wins || 0,
                        arenaLosses: user.arena_losses || 0
                    });
                }
            );
        } catch (error) {
            console.error('Unexpected error in arena route:', error);
            res.status(500).render('error', {
                message: 'An unexpected error occurred',
                error: { status: 500, stack: error.stack }
            });
        }
    });

    return router;
};
