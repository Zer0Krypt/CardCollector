const express = require('express');
const router = express.Router();
const GachaService = require('../services/gachaService');

module.exports = (db) => {
    // Single pull
    router.post('/pull', async (req, res) => {
        const userId = req.session.userId;
        
        try {
            // Check if user has enough currency
            const user = await new Promise((resolve, reject) => {
                db.get('SELECT gems FROM users WHERE id = ?', [userId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (user.gems < 100) {
                return res.status(400).json({ error: 'Not enough gems' });
            }

            // Perform gacha pull
            const rarity = GachaService.rollRarity();
            const card = GachaService.getRandomCard(rarity);
            
            // Add card to user's inventory
            await GachaService.addCardToUser(db, userId, card.id);
            
            // Deduct gems
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE users SET gems = gems - 100 WHERE id = ?',
                    [userId],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            res.json({ success: true, card });
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Multi pull (10+1 with guaranteed rare or better)
    router.post('/multi-pull', async (req, res) => {
        const userId = req.session.userId;
        
        try {
            // Check if user has enough currency
            const user = await new Promise((resolve, reject) => {
                db.get('SELECT gems FROM users WHERE id = ?', [userId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (user.gems < 1000) {
                return res.status(400).json({ error: 'Not enough gems' });
            }

            // Perform 11 pulls with guaranteed rare+
            const pulls = [];
            for (let i = 0; i < 11; i++) {
                let rarity = GachaService.rollRarity();
                // Guarantee at least rare for the last pull
                if (i === 10 && rarity === 'common') {
                    rarity = 'rare';
                }
                
                const card = GachaService.getRandomCard(rarity);
                await GachaService.addCardToUser(db, userId, card.id);
                pulls.push(card);
            }

            // Deduct gems
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE users SET gems = gems - 1000 WHERE id = ?',
                    [userId],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            res.json({ success: true, pulls });
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    return router;
};