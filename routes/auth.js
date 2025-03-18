const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

module.exports = (db) => {
    // Login route
    router.post('/login', async (req, res) => {
        const { username, password } = req.body;
        
        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid password' });
            }

            req.session.userId = user.id;
            req.session.username = user.username;
            res.json({ success: true });
        });
    });

    // Register route
    router.post('/register', async (req, res) => {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run('INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(400).json({ error: 'Username already exists' });
                    }
                    return res.status(500).json({ error: 'Database error' });
                }

                req.session.userId = this.lastID;
                req.session.username = username;
                res.json({ success: true });
            }
        );
    });

    // Logout route
    router.get('/logout', (req, res) => {
        req.session.destroy();
        res.redirect('/');
    });

    return router;
};