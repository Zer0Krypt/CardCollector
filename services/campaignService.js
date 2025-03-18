const { campaign } = require('../data/campaign');

class CampaignService {
    static async getPlayerProgress(db, userId) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT progress FROM campaign_progress WHERE user_id = ?',
                [userId],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row ? JSON.parse(row.progress) : { 
                        lastCompletedChapter: 0,
                        completedStages: {},
                        stars: {}
                    });
                }
            );
        });
    }

    static async updateProgress(db, userId, stageId, stars) {
        const progress = await this.getPlayerProgress(db, userId);
        progress.completedStages[stageId] = true;
        progress.stars[stageId] = stars;

        // Update last completed chapter if needed
        const chapterId = parseInt(stageId.split('-')[0]);
        if (chapterId > progress.lastCompletedChapter) {
            progress.lastCompletedChapter = chapterId;
        }

        return new Promise((resolve, reject) => {
            db.run(
                'INSERT OR REPLACE INTO campaign_progress (user_id, progress) VALUES (?, ?)',
                [userId, JSON.stringify(progress)],
                (err) => {
                    if (err) reject(err);
                    else resolve(progress);
                }
            );
        });
    }

    static async getAvailableChapters(db, userId) {
        const progress = await this.getPlayerProgress(db, userId);
        const playerLevel = await this.getPlayerLevel(db, userId);

        return campaign.chapters.filter(chapter => 
            chapter.requirements.playerLevel <= playerLevel &&
            (!chapter.requirements.previousChapter || 
             progress.lastCompletedChapter >= chapter.requirements.previousChapter)
        );
    }

    static async getStageRewards(db, userId, stageId, stars) {
        const [chapterId, stageNum] = stageId.split('-');
        const chapter = campaign.chapters.find(c => c.id === parseInt(chapterId));
        const stage = chapter.stages.find(s => s.id === stageId);
        const progress = await this.getPlayerProgress(db, userId);

        const rewards = {
            exp: stage.rewards.exp,
            gold: stage.rewards.gold,
            cards: []
        };

        // Add first time rewards if not completed before
        if (!progress.completedStages[stageId]) {
            rewards.gems = stage.rewards.firstTimeRewards.gems;
            rewards.cards.push(...stage.rewards.firstTimeRewards.cards);
        }

        // Add random card rewards based on chance
        stage.rewards.cards.forEach(cardReward => {
            if (Math.random() * 100 <= cardReward.chance) {
                rewards.cards.push({ id: cardReward.id });
            }
        });

        return rewards;
    }

    static async getPlayerLevel(db, userId) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT level FROM users WHERE id = ?',
                [userId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row ? row.level : 1);
                }
            );
        });
    }
}

module.exports = CampaignService;