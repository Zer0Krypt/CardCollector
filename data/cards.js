const cards = {
    common: [
        {
            id: 1,
            name: "Forest Scout",
            faction: "Nature",
            type: "Warrior",
            base_power: 100,
            attack_type: "Physical",
            attack_pattern: "Single",
            element_type: "Earth",
            rarity: "Common",
            is_hero: false,
            image_url: "/images/cards/forest-scout.jpg",
            skills: [
                {
                    name: "Quick Strike",
                    description: "Deal 120% damage to a single target",
                    effect_type: "damage",
                    effect_value: 120
                }
            ]
        },
        // Add more common cards...
    ],
    rare: [
        {
            id: 101,
            name: "Flame Mage",
            faction: "Fire",
            type: "Mage",
            base_power: 150,
            attack_type: "Magical",
            attack_pattern: "AOE",
            element_type: "Fire",
            rarity: "Rare",
            is_hero: false,
            image_url: "/images/cards/flame-mage.jpg",
            skills: [
                {
                    name: "Fireball",
                    description: "Deal 140% damage to all enemies",
                    effect_type: "damage",
                    effect_value: 140
                }
            ]
        },
        // Add more rare cards...
    ],
    epic: [
        {
            id: 201,
            name: "Storm Dragon",
            faction: "Storm",
            type: "Dragon",
            base_power: 250,
            attack_type: "Magical",
            attack_pattern: "Row",
            element_type: "Air",
            rarity: "Epic",
            is_hero: false,
            special_ability: {
                name: "Storm Lord",
                description: "Gains 10% damage for each Storm unit in play",
                trigger: "passive",
                effect: {
                    type: "damage_scaling",
                    condition: "faction_count",
                    faction: "Storm",
                    value: 10
                }
            },
            image_url: "/images/cards/storm-dragon.jpg",
            skills: [
                {
                    name: "Lightning Breath",
                    description: "Deal 180% damage to a row of enemies",
                    effect_type: "damage",
                    effect_value: 180,
                    status_effect: {
                        type: "stun",
                        duration: 1,
                        chance: 30
                    }
                }
            ]
        },
        // Add more epic cards...
    ],
    legendary: [
        {
            id: 301,
            name: "Divine Guardian",
            faction: "Light",
            type: "Tank",
            base_power: 400,
            attack_type: "Physical",
            attack_pattern: "Single",
            element_type: "Light",
            rarity: "Legendary",
            is_hero: true,
            image_url: "/images/cards/divine-guardian.jpg",
            skills: [
                {
                    name: "Divine Shield",
                    description: "Protect all allies with a shield for 2 turns",
                    effect_type: "shield",
                    effect_value: 200
                }
            ]
        },
        // Add more legendary cards...
    ]
};

const dropRates = {
    common: 70,
    rare: 20,
    epic: 8,
    legendary: 2
};

module.exports = { cards, dropRates };
