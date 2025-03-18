class CardService {
    // Calculate fusion costs and requirements
    static getFusionRequirements(card) {
        return {
            shards: card.rarity === 'common' ? 20 :
                   card.rarity === 'rare' ? 40 :
                   card.rarity === 'epic' ? 80 : 120,
            gold: card.rarity === 'common' ? 1000 :
                  card.rarity === 'rare' ? 2000 :
                  card.rarity === 'epic' ? 4000 : 8000
        };
    }

    // Calculate dismantling rewards
    static getDismantleRewards(card) {
        return {
            shards: card.rarity === 'common' ? 10 :
                   card.rarity === 'rare' ? 20 :
                   card.rarity === 'epic' ? 40 : 60,
            gold: card.rarity === 'common' ? 500 :
                  card.rarity === 'rare' ? 1000 :
                  card.rarity === 'epic' ? 2000 : 4000
        };
    }

    // Get skill upgrade costs
    static getSkillUpgradeCost(skill, currentLevel) {
        return {
            gold: 1000 * (currentLevel + 1),
            skillPoints: currentLevel + 1
        };
    }

    // Calculate skill effect at specific level
    static calculateSkillEffect(skill, level) {
        const baseEffect = skill.effect_value;
        const multiplier = 1 + (level - 1) * 0.1; // 10% increase per level
        return Math.floor(baseEffect * multiplier);
    }
}

module.exports = CardService;