const express = require('express');
const router = express.Router();
const BattleService = require('../services/battleService');

module.exports = (db) => {
    // Initialize battle
    router.post('/start', async (req, res) => {
        const { deckId, battleType } = req.body;
        const userId = req.session.userId;

        try {
            // Get player's deck
            const deck = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT * FROM decks WHERE id = ? AND user_id = ?`,
                    [deckId, userId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (!deck) {
                return res.status(404).json({ error: 'Deck not found' });
            }

            // Get enemy deck based on battle type
            const enemyDeck = await generateEnemyDeck(battleType);

            // Initialize battle state
            const battleState = {
                playerField: await loadDeckCards(deck),
                enemyField: enemyDeck,
                turn: 1,
                activeUnit: null,
                battleLog: [],
                battleType
            };

            // Store battle state in session
            req.session.battleState = battleState;

            res.json({
                battleState: sanitizeBattleState(battleState),
                validActions: getValidActions(battleState)
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to start battle' });
        }
    });

    // Execute turn
    router.post('/action', async (req, res) => {
        const { unitId, skillId, targetIds } = req.body;
        const battleState = req.session.battleState;

        if (!battleState) {
            return res.status(400).json({ error: 'No active battle' });
        }

        try {
            // Find acting unit and skill
            const unit = findUnit(battleState, unitId);
            const skill = unit.skills.find(s => s.id === skillId);

            if (!unit || !skill) {
                return res.status(400).json({ error: 'Invalid unit or skill' });
            }

            // Execute action
            const targets = targetIds.map(id => findUnit(battleState, id));
            const effects = BattleService.applySkillEffect(skill, unit, targets, battleState);

            // Process turn effects
            const turnEffects = [];
            battleState.playerField.concat(battleState.enemyField).forEach(unit => {
                turnEffects.push(...BattleService.processTurnEffects(unit));
            });

            // Check battle end
            const battleEnd = BattleService.checkBattleEnd(battleState);
            if (battleEnd.ended) {
                await handleBattleEnd(req.session.userId, battleEnd, battleState);
                delete req.session.battleState;
                return res.json({
                    battleEnd,
                    effects: [...effects, ...turnEffects]
                });
            }

            // Update battle state
            battleState.turn++;
            battleState.battleLog.push({
                turn: battleState.turn,
                unit: unit.id,
                skill: skill.id,
                effects
            });

            res.json({
                effects: [...effects, ...turnEffects],
                battleState: sanitizeBattleState(battleState),
                validActions: getValidActions(battleState)
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to process action' });
        }
    });

    return router;
};

// Helper functions
async function loadDeckCards(deck) {
    // Implementation to load full card data from deck
}

function generateEnemyDeck(battleType) {
    // Implementation to generate appropriate enemy deck
}

function findUnit(battleState, unitId) {
    return [...battleState.playerField, ...battleState.enemyField]
        .find(unit => unit.id === unitId);
}

function sanitizeBattleState(battleState) {
    // Remove sensitive data before sending to client
    return {
        playerField: battleState.playerField.map(sanitizeUnit),
        enemyField: battleState.enemyField.map(sanitizeUnit),
        turn: battleState.turn,
        battleType: battleState.battleType
    };
}

function sanitizeUnit(unit) {
    return {
        id: unit.id,
        name: unit.name,
        currentHp: unit.currentHp,
        maxHp: unit.maxHp,
        skills: unit.skills,
        buffs: unit.buffs,
        shield: unit.shield
    };
}

function getValidActions(battleState) {
    // Implementation to determine valid actions for current state
}

async function handleBattleEnd(userId, battleEnd, battleState) {
    // Implementation to handle rewards and updates after battle
}