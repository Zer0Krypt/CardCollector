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
        console.log('Register route hit:', req.body);
        
        const { username, password } = req.body;
        
        if (!username || !password) {
            console.log('Missing username or password');
            return res.status(400).json({ error: 'Username and password are required' });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // First check if user exists
            db.get('SELECT id FROM users WHERE username = ?', [username], (err, existingUser) => {
                if (err) {
                    console.error('Database error checking user:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                if (existingUser) {
                    console.log('Username already exists:', username);
                    return res.status(400).json({ error: 'Username already exists' });
                }

                // Create new user
                db.run('INSERT INTO users (username, password) VALUES (?, ?)',
                    [username, hashedPassword],
                    function(err) {
                        if (err) {
                            console.error('Database error creating user:', err);
                            return res.status(500).json({ error: 'Database error' });
                        }

                        console.log('User created successfully:', this.lastID);
                        
                        // Set session
                        req.session.userId = this.lastID;
                        req.session.username = username;
                        
                        // Send success response
                        res.json({ 
                            success: true,
                            userId: this.lastID,
                            username: username
                        });
                    }
                );
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    });

    // Logout route
    router.get('/logout', (req, res) => {
        req.session.destroy();
        res.redirect('/');
    });

    return router;
};
