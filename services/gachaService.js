const { cards, dropRates } = require('../data/cards');

class GachaService {
    static rollRarity() {
        const rand = Math.random() * 100;
        let sum = 0;
        
        for (const [rarity, rate] of Object.entries(dropRates)) {
            sum += rate;
            if (rand <= sum) return rarity;
        }
        
        return 'common'; // fallback
    }

    static getRandomCard(rarity) {
        const poolCards = cards[rarity];
        const randomIndex = Math.floor(Math.random() * poolCards.length);
        return poolCards[randomIndex];
    }

    static async addCardToUser(db, userId, cardId) {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO player_cards (user_id, card_id, level, evolution, experience) VALUES (?, ?, 1, 1, 0)',
                [userId, cardId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }
}

module.exports = GachaService;