const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

module.exports = (db) => {
    // Login route
    router.post('/login', async (req, res) => {
        const { username, password } = req.body;
        console.log('Login attempt for username:', username);
        
        // First, let's verify we're getting the credentials
        if (!username || !password) {
            console.log('Missing credentials');
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Let's log the query we're about to make
        console.log('Querying database for user:', username);
        
        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
            if (err) {
                console.error('Database error during login:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            console.log('Database response:', user ? 'User found' : 'User not found');
            
            if (!user) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            try {
                console.log('Comparing passwords...');
                const validPassword = await bcrypt.compare(password, user.password);
                console.log('Password validation result:', validPassword);
                
                if (!validPassword) {
                    return res.status(401).json({ error: 'Invalid username or password' });
                }

                // Set session data
                req.session.userId = user.id;
                req.session.username = user.username;
                
                // Save session explicitly
                req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                        return res.status(500).json({ error: 'Session error' });
                    }
                    
                    console.log('Login successful. Session data:', {
                        userId: req.session.userId,
                        username: req.session.username
                    });
                    
                    res.json({ 
                        success: true,
                        userId: user.id,
                        username: user.username
                    });
                });
            } catch (error) {
                console.error('Password comparison error:', error);
                res.status(500).json({ error: 'Login failed' });
            }
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

                        const userId = this.lastID;
                        console.log('User created successfully:', userId);
                        
                        // Set session
                        req.session.userId = userId;
                        req.session.username = username;
                        
                        // Save session explicitly
                        req.session.save((err) => {
                            if (err) {
                                console.error('Session save error:', err);
                                return res.status(500).json({ error: 'Session error' });
                            }
                            
                            // Send success response
                            res.json({ 
                                success: true,
                                userId: userId,
                                username: username
                            });
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
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
            }
            res.redirect('/');
        });
    });

    return router;
};


