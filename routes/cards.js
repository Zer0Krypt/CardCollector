const express = require('express');
const router = express.Router();
const CardService = require('../services/cardService');

module.exports = (db) => {
    // Get all cards
    router.get('/', (req, res) => {
        db.all('SELECT * FROM cards', [], (err, cards) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(cards);
        });
    });

    // Get user's cards (inventory)
    router.get('/inventory', (req, res) => {
        const userId = req.session.userId;
        const query = `
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
        
        db.all(query, [userId], (err, cards) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(cards);
        });
    });

    // Level up a card
    router.post('/level-up', (req, res) => {
        const { cardId, experienceGained } = req.body;
        const userId = req.session.userId;

        db.get(
            'SELECT pc.*, c.rarity FROM player_cards pc JOIN cards c ON pc.card_id = c.id WHERE pc.id = ? AND user_id = ?',
            [cardId, userId],
            (err, card) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                if (!card) {
                    return res.status(404).json({ error: 'Card not found' });
                }

                // Calculate exp requirements based on rarity
                const expMultiplier = {
                    'common': 1,
                    'rare': 1.2,
                    'epic': 1.5,
                    'legendary': 2
                }[card.rarity];

                const newExp = card.experience + experienceGained;
                const baseExpNeeded = 100; // Base exp needed per level
                const newLevel = Math.min(
                    20,
                    Math.floor(Math.sqrt(newExp / (baseExpNeeded * expMultiplier))) + 1
                );

                db.run(
                    'UPDATE player_cards SET experience = ?, level = ? WHERE id = ?',
                    [newExp, newLevel, cardId],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ error: 'Database error' });
                        }
                        res.json({ 
                            success: true, 
                            newLevel, 
                            newExp,
                            maxLevel: newLevel >= 20,
                            expToNextLevel: newLevel < 20 ? 
                                Math.pow(newLevel, 2) * baseExpNeeded * expMultiplier - newExp : 
                                0
                        });
                    }
                );
            }
        );
    });

    // Evolve a card
    router.post('/evolve', async (req, res) => {
        const { cardId } = req.body;
        const userId = req.session.userId;

        try {
            const card = await db.get(
                'SELECT pc.*, c.rarity FROM player_cards pc JOIN cards c ON pc.card_id = c.id WHERE pc.id = ? AND user_id = ?',
                [cardId, userId]
            );

            if (!card) {
                return res.status(404).json({ error: 'Card not found' });
            }

            if (card.level < 20) {
                return res.status(400).json({ error: 'Card must be level 20 to evolve' });
            }

            // Check evolution requirements
            const maxEvolution = {
                'common': 3,
                'rare': 4,
                'epic': 5,
                'legendary': 6
            }[card.rarity];

            if (card.evolution >= maxEvolution) {
                return res.status(400).json({ error: 'Maximum evolution reached' });
            }

            // Calculate material costs
            const materialCosts = {
                shards: card.evolution * 50,
                gold: card.evolution * 1000
            };

            // Check if player has enough materials
            const materials = await db.get(
                'SELECT amount FROM player_materials WHERE user_id = ? AND material_type = ? AND rarity = ?',
                [userId, 'card_shard', card.rarity]
            );

            const userGold = await db.get('SELECT gold FROM users WHERE id = ?', [userId]);

            if (!materials || materials.amount < materialCosts.shards) {
                return res.status(400).json({ error: 'Not enough card shards' });
            }

            if (!userGold || userGold.gold < materialCosts.gold) {
                return res.status(400).json({ error: 'Not enough gold' });
            }

            // Perform evolution
            await db.run('BEGIN TRANSACTION');

            await db.run(
                'UPDATE player_cards SET evolution = ?, level = 1, experience = 0 WHERE id = ?',
                [card.evolution + 1, cardId]
            );

            await db.run(
                'UPDATE player_materials SET amount = amount - ? WHERE user_id = ? AND material_type = ? AND rarity = ?',
                [materialCosts.shards, userId, 'card_shard', card.rarity]
            );

            await db.run(
                'UPDATE users SET gold = gold - ? WHERE id = ?',
                [materialCosts.gold, userId]
            );

            await db.run('COMMIT');

            res.json({ 
                success: true, 
                newEvolution: card.evolution + 1,
                remainingShards: materials.amount - materialCosts.shards,
                remainingGold: userGold.gold - materialCosts.gold,
                maxEvolution: card.evolution + 1 >= maxEvolution
            });
        } catch (error) {
            await db.run('ROLLBACK');
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Fuse cards
    router.post('/fuse', async (req, res) => {
        const { targetCardId, materialCardIds } = req.body;
        const userId = req.session.userId;

        try {
            // Check ownership and get card details
            const targetCard = await db.get(
                'SELECT pc.*, c.rarity FROM player_cards pc JOIN cards c ON pc.card_id = c.id WHERE pc.id = ? AND pc.user_id = ?',
                [targetCardId, userId]
            );

            if (!targetCard) {
                return res.status(404).json({ error: 'Target card not found' });
            }

            // Verify material cards
            const materials = await Promise.all(materialCardIds.map(id =>
                db.get('SELECT * FROM player_cards WHERE id = ? AND user_id = ?', [id, userId])
            ));

            if (materials.some(m => !m)) {
                return res.status(400).json({ error: 'Invalid material cards' });
            }

            // Calculate fusion boost
            const fusionBoost = materials.length * 50; // 50 exp per material card

            // Update target card
            await db.run(
                'UPDATE player_cards SET experience = experience + ?, fusion_count = fusion_count + 1 WHERE id = ?',
                [fusionBoost, targetCardId]
            );

            // Remove material cards
            await Promise.all(materialCardIds.map(id =>
                db.run('DELETE FROM player_cards WHERE id = ?', [id])
            ));

            res.json({ 
                success: true, 
                experienceGained: fusionBoost,
                newExperience: targetCard.experience + fusionBoost
            });
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Dismantle card
    router.post('/dismantle', async (req, res) => {
        const { cardId } = req.body;
        const userId = req.session.userId;

        try {
            const card = await db.get(
                'SELECT pc.*, c.rarity FROM player_cards pc JOIN cards c ON pc.card_id = c.id WHERE pc.id = ? AND pc.user_id = ?',
                [cardId, userId]
            );

            if (!card) {
                return res.status(404).json({ error: 'Card not found' });
            }

            const rewards = CardService.getDismantleRewards(card);

            // Add rewards to player
            await db.run(
                'UPDATE player_materials SET amount = amount + ? WHERE user_id = ? AND material_type = ? AND rarity = ?',
                [rewards.shards, userId, 'card_shard', card.rarity]
            );

            await db.run(
                'UPDATE users SET gold = gold + ? WHERE id = ?',
                [rewards.gold, userId]
            );

            // Remove card
            await db.run('DELETE FROM player_cards WHERE id = ?', [cardId]);

            res.json({ success: true, rewards });
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Upgrade skill
    router.post('/upgrade-skill', async (req, res) => {
        const { cardId, skillId } = req.body;
        const userId = req.session.userId;

        try {
            const card = await db.get(
                'SELECT pc.*, c.* FROM player_cards pc JOIN cards c ON pc.card_id = c.id WHERE pc.id = ? AND pc.user_id = ?',
                [cardId, userId]
            );

            if (!card) {
                return res.status(404).json({ error: 'Card not found' });
            }

            const skillLevels = JSON.parse(card.skill_levels);
            const currentLevel = skillLevels[skillId] || 1;
            const upgradeCost = CardService.getSkillUpgradeCost(skillId, currentLevel);

            if (card.skill_points < upgradeCost.skillPoints) {
                return res.status(400).json({ error: 'Not enough skill points' });
            }

            // Update skill level
            skillLevels[skillId] = currentLevel + 1;
            await db.run(
                'UPDATE player_cards SET skill_levels = ?, skill_points = skill_points - ? WHERE id = ?',
                [JSON.stringify(skillLevels), upgradeCost.skillPoints, cardId]
            );

            res.json({ 
                success: true, 
                newLevel: currentLevel + 1,
                newEffect: CardService.calculateSkillEffect(card.skills[skillId], currentLevel + 1)
            });
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    return router;
};


