const CardService = require('./cardService');

class BattleService {
    static calculateInitiativeOrder(playerDeck, enemyDeck) {
        const allUnits = [...playerDeck, ...enemyDeck].map(card => ({
            ...card,
            initiative: Math.random() * 100 // Can be enhanced with speed stats later
        }));
        return allUnits.sort((a, b) => b.initiative - a.initiative);
    }

    static calculateDamage(attacker, defender, skill) {
        let baseDamage = attacker.base_power * (skill.effect_value / 100);
        const elementMultiplier = this.getElementalMultiplier(attacker.element_type, defender.element_type);
        
        // Apply synergy effects
        if (attacker.synergies) {
            attacker.synergies.forEach(synergy => {
                if (synergy.effect.type === 'damage_boost') {
                    baseDamage *= (1 + synergy.effect.value / 100);
                }
            });
        }

        // Apply status effects
        if (defender.statusEffects) {
            const vulnerability = defender.statusEffects.find(s => s.type === 'vulnerability');
            if (vulnerability) {
                baseDamage *= (1 + vulnerability.value / 100);
            }
        }

        const defenseReduction = defender.type === 'Tank' ? 0.3 : 0;
        return Math.floor(baseDamage * elementMultiplier * (1 - defenseReduction));
    }

    static getElementalMultiplier(attackerElement, defenderElement) {
        const elementChart = {
            Fire: { Water: 0.8, Air: 1.2, Earth: 1 },
            Water: { Fire: 1.2, Air: 1, Earth: 0.8 },
            Earth: { Fire: 1, Water: 1.2, Air: 0.8 },
            Air: { Fire: 0.8, Water: 1, Earth: 1.2 },
            Light: { Dark: 1.2, Light: 1, Neutral: 1 },
            Dark: { Light: 1.2, Dark: 1, Neutral: 1 },
            Neutral: { Light: 1, Dark: 1, Neutral: 1 }
        };

        return elementChart[attackerElement]?.[defenderElement] || 1;
    }

    static applySkillEffect(skill, source, targets, battleState) {
        const effects = {
            damage: (target) => {
                const damage = this.calculateDamage(source, target, skill);
                target.currentHp -= damage;
                return { type: 'damage', value: damage, target: target.id };
            },
            heal: (target) => {
                const healing = Math.floor(source.base_power * (skill.effect_value / 100));
                target.currentHp = Math.min(target.maxHp, target.currentHp + healing);
                return { type: 'heal', value: healing, target: target.id };
            },
            shield: (target) => {
                const shieldAmount = Math.floor(source.base_power * (skill.effect_value / 100));
                target.shield = (target.shield || 0) + shieldAmount;
                return { type: 'shield', value: shieldAmount, target: target.id };
            },
            buff: (target) => {
                const buffAmount = skill.effect_value;
                target.buffs = target.buffs || [];
                target.buffs.push({ type: skill.buff_type, value: buffAmount, duration: 2 });
                return { type: 'buff', value: buffAmount, target: target.id };
            }
        };

        return targets.map(target => effects[skill.effect_type](target));
    }

    static getValidTargets(skill, source, battleState) {
        const { playerField, enemyField } = battleState;
        const isPlayerCard = playerField.includes(source);
        const allies = isPlayerCard ? playerField : enemyField;
        const enemies = isPlayerCard ? enemyField : playerField;

        switch (skill.attack_pattern) {
            case 'Single':
                return enemies.filter(unit => unit.currentHp > 0);
            case 'AOE':
                return enemies.filter(unit => unit.currentHp > 0);
            case 'Row':
                return enemies.filter(unit => unit.currentHp > 0);
            case 'Support':
                return allies.filter(unit => unit.currentHp > 0);
            default:
                return [];
        }
    }

    static processTurnEffects(unit) {
        if (!unit.buffs) return [];

        const effects = [];
        unit.buffs = unit.buffs.filter(buff => {
            buff.duration--;
            if (buff.duration <= 0) {
                effects.push({
                    type: 'buff_expire',
                    buff_type: buff.type,
                    target: unit.id
                });
                return false;
            }
            return true;
        });

        return effects;
    }

    static checkBattleEnd(battleState) {
        const playerAlive = battleState.playerField.some(unit => unit.currentHp > 0);
        const enemyAlive = battleState.enemyField.some(unit => unit.currentHp > 0);

        if (!playerAlive) return { ended: true, winner: 'enemy' };
        if (!enemyAlive) return { ended: true, winner: 'player' };
        return { ended: false };
    }

    static applyStatusEffect(target, effect) {
        if (!target.statusEffects) target.statusEffects = [];
        target.statusEffects.push({
            type: effect.type,
            duration: effect.duration,
            value: effect.value,
            source: effect.source
        });
    }

    static processStatusEffects(unit) {
        if (!unit.statusEffects) return [];

        const effects = [];
        unit.statusEffects = unit.statusEffects.filter(status => {
            // Apply status effect
            switch (status.type) {
                case 'poison':
                    const damage = Math.floor(unit.maxHp * (status.value / 100));
                    unit.currentHp -= damage;
                    effects.push({ type: 'poison_damage', value: damage, target: unit.id });
                    break;
                case 'burn':
                    const burnDamage = status.value;
                    unit.currentHp -= burnDamage;
                    effects.push({ type: 'burn_damage', value: burnDamage, target: unit.id });
                    break;
                case 'stun':
                    effects.push({ type: 'stun', target: unit.id });
                    break;
            }

            // Decrease duration
            status.duration--;
            return status.duration > 0;
        });

        return effects;
    }

    static getTeamSynergy(team) {
        const factionCount = {};
        const typeCount = {};
        const synergies = [];

        // Count factions and types
        team.forEach(unit => {
            factionCount[unit.faction] = (factionCount[unit.faction] || 0) + 1;
            typeCount[unit.type] = (typeCount[unit.type] || 0) + 1;
        });

        // Check faction synergies
        Object.entries(factionCount).forEach(([faction, count]) => {
            if (count >= 3) {
                synergies.push({
                    type: 'faction',
                    name: faction,
                    effect: this.getFactionSynergyEffect(faction)
                });
            }
        });

        // Check type synergies
        Object.entries(typeCount).forEach(([type, count]) => {
            if (count >= 2) {
                synergies.push({
                    type: 'class',
                    name: type,
                    effect: this.getTypeSynergyEffect(type)
                });
            }
        });

        return synergies;
    }

    static getFactionSynergyEffect(faction) {
        const synergies = {
            'Nature': { type: 'heal', value: 5 }, // 5% HP heal per turn
            'Fire': { type: 'damage_boost', value: 15 }, // 15% increased damage
            'Storm': { type: 'speed_boost', value: 20 }, // 20% increased speed
            'Light': { type: 'defense_boost', value: 25 } // 25% increased defense
        };
        return synergies[faction] || null;
    }

    static getTypeSynergyEffect(type) {
        const synergies = {
            'Warrior': { type: 'crit_chance', value: 15 }, // 15% crit chance
            'Mage': { type: 'magic_penetration', value: 20 }, // 20% magic penetration
            'Tank': { type: 'damage_reduction', value: 15 }, // 15% damage reduction
            'Dragon': { type: 'all_stats', value: 10 } // 10% all stats
        };
        return synergies[type] || null;
    }
}

module.exports = BattleService;
