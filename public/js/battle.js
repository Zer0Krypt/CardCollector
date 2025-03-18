class BattleManager {
    constructor() {
        this.battleState = null;
        this.selectedCard = null;
        this.selectedSkill = null;
        this.selectedTargets = [];
        this.validActions = null;
        
        this.initializeEventListeners();
    }

    async initializeBattle(deckId, battleType) {
        try {
            const response = await fetch('/battle/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deckId, battleType })
            });

            const data = await response.json();
            this.battleState = data.battleState;
            this.validActions = data.validActions;
            
            this.renderBattlefield();
            this.updateUI();
        } catch (error) {
            console.error('Failed to initialize battle:', error);
        }
    }

    async executeAction(unitId, skillId, targetIds) {
        try {
            const response = await fetch('/battle/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unitId, skillId, targetIds })
            });

            const data = await response.json();
            
            if (data.battleEnd) {
                this.handleBattleEnd(data.battleEnd);
                return;
            }

            await this.animateEffects(data.effects);
            this.battleState = data.battleState;
            this.validActions = data.validActions;
            
            this.resetSelection();
            this.updateUI();
        } catch (error) {
            console.error('Failed to execute action:', error);
        }
    }

    renderBattlefield() {
        this.renderField('enemy-field', this.battleState.enemyField);
        this.renderField('player-field', this.battleState.playerField);
    }

    renderField(containerId, cards) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        cards.forEach(card => {
            const cardElement = this.createCardElement(card);
            container.appendChild(cardElement);
        });
    }

    createCardElement(card) {
        const template = document.getElementById('card-template');
        const cardElement = template.content.cloneNode(true).querySelector('.battle-card');

        cardElement.dataset.cardId = card.id;
        cardElement.querySelector('.card-name').textContent = card.name;
        cardElement.querySelector('.card-type').textContent = card.type;
        cardElement.querySelector('img').src = card.image_url;

        const hpFill = cardElement.querySelector('.hp-fill');
        const hpText = cardElement.querySelector('.hp-text');
        const hpPercentage = (card.currentHp / card.maxHp) * 100;
        hpFill.style.width = `${hpPercentage}%`;
        hpText.textContent = `${card.currentHp}/${card.maxHp}`;

        if (card.shield) {
            const shieldIndicator = cardElement.querySelector('.shield-indicator');
            shieldIndicator.classList.remove('hidden');
            shieldIndicator.querySelector('.shield-value').textContent = card.shield;
        }

        this.renderBuffs(card, cardElement.querySelector('.buff-container'));

        // Add status effects
        if (card.statusEffects) {
            const statusContainer = cardElement.querySelector('.status-container');
            card.statusEffects.forEach(status => {
                const statusElement = document.createElement('div');
                statusElement.className = `status-icon ${status.type}`;
                statusElement.title = `${status.type}: ${status.duration} turns`;
                statusContainer.appendChild(statusElement);
            });
        }

        // Add synergy indicators
        if (card.synergies) {
            const synergyContainer = cardElement.querySelector('.synergy-container');
            card.synergies.forEach(synergy => {
                const synergyElement = document.createElement('div');
                synergyElement.className = `synergy-icon ${synergy.type}`;
                synergyElement.title = `${synergy.name} synergy: ${this.getSynergyDescription(synergy)}`;
                synergyContainer.appendChild(synergyElement);
            });
        }

        return cardElement;
    }

    renderBuffs(card, container) {
        container.innerHTML = '';
        if (!card.buffs) return;

        card.buffs.forEach(buff => {
            const buffElement = document.createElement('div');
            buffElement.className = 'buff-icon';
            buffElement.style.background = this.getBuffColor(buff.type);
            buffElement.textContent = buff.duration;
            container.appendChild(buffElement);
        });
    }

    getBuffColor(buffType) {
        const colors = {
            attack: '#e74c3c',
            defense: '#3498db',
            speed: '#2ecc71'
        };
        return colors[buffType] || '#95a5a6';
    }

    getSynergyDescription(synergy) {
        const effectDescriptions = {
            'damage_boost': `+${synergy.effect.value}% damage`,
            'heal': `${synergy.effect.value}% HP heal per turn`,
            'speed_boost': `+${synergy.effect.value}% speed`,
            'defense_boost': `+${synergy.effect.value}% defense`,
            'crit_chance': `+${synergy.effect.value}% critical hit chance`,
            'magic_penetration': `+${synergy.effect.value}% magic penetration`,
            'damage_reduction': `${synergy.effect.value}% damage reduction`,
            'all_stats': `+${synergy.effect.value}% all stats`
        };
        return effectDescriptions[synergy.effect.type] || '';
    }

    async animateEffects(effects) {
        for (const effect of effects) {
            const targetElement = document.querySelector(`[data-card-id="${effect.target}"]`);
            if (!targetElement) continue;

            switch (effect.type) {
                case 'damage':
                case 'poison_damage':
                case 'burn_damage':
                    targetElement.classList.add('damage-animation');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    targetElement.classList.remove('damage-animation');
                    break;
                case 'heal':
                    targetElement.classList.add('heal-animation');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    targetElement.classList.remove('heal-animation');
                    break;
                case 'stun':
                    targetElement.classList.add('stun-animation');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    targetElement.classList.remove('stun-animation');
                    break;
            }
        }
    }

    updateUI() {
        document.getElementById('turnCount').textContent = this.battleState.turn;
        this.updateActionPanel();
        this.renderBattlefield();
    }

    updateActionPanel() {
        const actionPanel = document.querySelector('.action-panel');
        const skillButtons = actionPanel.querySelector('.skill-buttons');
        skillButtons.innerHTML = '';

        if (this.selectedCard) {
            this.selectedCard.skills.forEach(skill => {
                const button = document.createElement('button');
                button.className = 'skill-btn';
                button.textContent = skill.name;
                button.addEventListener('click', () => this.handleSkillSelection(skill));
                skillButtons.appendChild(button);
            });
        }
    }

    handleSkillSelection(skill) {
        this.selectedSkill = skill;
        this.highlightValidTargets();
    }

    highlightValidTargets() {
        document.querySelectorAll('.battle-card').forEach(card => {
            card.classList.remove('selectable');
        });

        if (this.selectedSkill && this.validActions) {
            const validTargets = this.validActions
                .filter(action => action.skillId === this.selectedSkill.id)
                .map(action => action.validTargets)
                .flat();

            validTargets.forEach(targetId => {
                const card = document.querySelector(`[data-card-id="${targetId}"]`);
                if (card) card.classList.add('selectable');
            });
        }
    }

    resetSelection() {
        this.selectedCard = null;
        this.selectedSkill = null;
        this.selectedTargets = [];
        document.querySelectorAll('.battle-card').forEach(card => {
            card.classList.remove('selected', 'selectable');
        });
    }

    handleBattleEnd(battleEnd) {
        const message = battleEnd.winner === 'player' ? 'Victory!' : 'Defeat!';
        alert(message);
        // Redirect to results page or show modal
        window.location.href = '/battle/results';
    }

    initializeEventListeners() {
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.battle-card');
            if (!card) return;

            if (this.selectedSkill && card.classList.contains('selectable')) {
                this.selectedTargets.push(card.dataset.cardId);
                this.executeAction(
                    this.selectedCard.id,
                    this.selectedSkill.id,
                    this.selectedTargets
                );
            } else if (!this.selectedSkill) {
                this.selectedCard = this.battleState.playerField
                    .find(c => c.id === card.dataset.cardId);
                this.updateUI();
            }
        });

        document.getElementById('endTurnBtn').addEventListener('click', () => {
            this.resetSelection();
            this.executeAction(null, null, null);
        });
    }
}

// Initialize battle when page loads
document.addEventListener('DOMContentLoaded', () => {
    const battle = new BattleManager();
    const urlParams = new URLSearchParams(window.location.search);
    const deckId = urlParams.get('deckId');
    const battleType = urlParams.get('type');
    
    if (deckId && battleType) {
        battle.initializeBattle(deckId, battleType);
    }
});
