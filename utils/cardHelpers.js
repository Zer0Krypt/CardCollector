const getMaxEvolution = (rarity) => {
    const maxEvolutions = {
        'common': 3,
        'rare': 4,
        'epic': 5,
        'legendary': 6
    };
    return maxEvolutions[rarity.toLowerCase()] || 3;
};

const calculatePower = (basePower, evolution) => {
    return Math.floor(basePower * (1 + (evolution - 1) * 0.2));
};

const getRequiredExp = (level) => {
    return Math.pow(level, 2) * 100;
};

module.exports = {
    getMaxEvolution,
    calculatePower,
    getRequiredExp
};