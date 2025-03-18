const express = require('express');
const router = express.Router();
const CampaignService = require('../services/campaignService');

module.exports = (db) => {
    // Get campaign overview
    router.get('/', async (req, res) => {
        try {
            const chapters = await CampaignService.getAvailableChapters(db, req.session.userId);
            const progress = await CampaignService.getPlayerProgress(db, req.session.userId);
            
            res.render('campaign/overview', { 
                chapters,
                progress,
                currentUser: req.session.userId
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to load campaign' });
        }
    });

    // Get chapter details
    router.get('/chapter/:chapterId', async (req, res) => {
        try {
            const progress = await CampaignService.getPlayerProgress(db, req.session.userId);
            const chapter = campaign.chapters.find(c => c.id === parseInt(req.params.chapterId));
            
            if (!chapter) {
                return res.status(404).json({ error: 'Chapter not found' });
            }

            res.render('campaign/chapter', { 
                chapter,
                progress,
                currentUser: req.session.userId
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to load chapter' });
        }
    });

    // Start campaign battle
    router.post('/battle/start', async (req, res) => {
        const { stageId } = req.body;
        const userId = req.session.userId;

        try {
            const [chapterId, stageNum] = stageId.split('-');
            const chapter = campaign.chapters.find(c => c.id === parseInt(chapterId));
            const stage = chapter.stages.find(s => s.id === stageId);

            if (!stage) {
                return res.status(404).json({ error: 'Stage not found' });
            }

            // Initialize battle state with campaign-specific settings
            const battleState = {
                type: 'campaign',
                stageId,
                enemyField: stage.enemies.map(enemy => ({
                    ...cards[enemy.cardId],
                    level: enemy.level
                })),
                playerField: [], // Will be filled with player's deck
                turn: 1,
                energy: stage.energy
            };

            req.session.battleState = battleState;
            res.json({ battleState });
        } catch (error) {
            res.status(500).json({ error: 'Failed to start battle' });
        }
    });

    // Complete campaign battle
    router.post('/battle/complete', async (req, res) => {
        const { stageId, stars } = req.body;
        const userId = req.session.userId;

        try {
            // Update progress
            const progress = await CampaignService.updateProgress(db, userId, stageId, stars);
            
            // Calculate and grant rewards
            const rewards = await CampaignService.getStageRewards(db, userId, stageId, stars);

            // Update player's resources and inventory
            await db.run(
                'UPDATE users SET exp = exp + ?, gold = gold + ?, gems = gems + ? WHERE id = ?',
                [rewards.exp, rewards.gold, rewards.gems || 0, userId]
            );

            // Add card rewards to player's inventory
            for (const card of rewards.cards) {
                await db.run(
                    'INSERT INTO player_cards (user_id, card_id, level, evolution, experience) VALUES (?, ?, 1, 1, 0)',
                    [userId, card.id]
                );
            }

            res.json({ progress, rewards });
        } catch (error) {
            res.status(500).json({ error: 'Failed to complete battle' });
        }
    });

    return router;
};