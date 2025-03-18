const campaign = {
    chapters: [
        {
            id: 1,
            name: "The Forest Awakening",
            description: "Strange creatures have appeared in the Mystic Forest...",
            requirements: {
                playerLevel: 1,
                previousChapter: null
            },
            stages: [
                {
                    id: "1-1",
                    name: "Forest Path",
                    description: "Clear the path of hostile creatures",
                    energy: 10,
                    enemies: [
                        { cardId: 1, level: 5 },  // Forest Scout
                        { cardId: 2, level: 5 }   // Forest Wolf
                    ],
                    rewards: {
                        exp: 100,
                        gold: 500,
                        cards: [{ id: 1, chance: 30 }],
                        firstTimeRewards: {
                            gems: 50,
                            cards: [{ id: 101, chance: 100 }] // Guaranteed Flame Mage
                        }
                    }
                },
                // More stages...
            ]
        },
        {
            id: 2,
            name: "Volcanic Trials",
            description: "Journey through the dangerous volcanic region...",
            requirements: {
                playerLevel: 5,
                previousChapter: 1
            },
            stages: [
                // ... stages
            ]
        }
    ]
};

module.exports = { campaign };