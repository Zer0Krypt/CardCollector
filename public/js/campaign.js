class CampaignManager {
    constructor() {
        this.currentBattle = null;
        this.bindEvents();
    }

    bindEvents() {
        document.querySelectorAll('.stage-button').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const stageId = e.target.dataset.stageId;
                await this.startBattle(stageId);
            });
        });
    }

    async startBattle(stageId) {
        try {
            const response = await fetch('/campaign/battle/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stageId })
            });

            const data = await response.json();
            if (data.battleState) {
                this.currentBattle = data.battleState;
                window.location.href = `/battle?type=campaign&stageId=${stageId}`;
            }
        } catch (error) {
            console.error('Failed to start battle:', error);
        }
    }

    async completeBattle(stageId, stars) {
        try {
            const response = await fetch('/campaign/battle/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stageId, stars })
            });

            const data = await response.json();
            this.showRewards(data.rewards);
        } catch (error) {
            console.error('Failed to complete battle:', error);
        }
    }

    showRewards(rewards) {
        const modal = document.createElement('div');
        modal.className = 'rewards-modal';
        modal.innerHTML = `
            <div class="rewards-content">
                <h2>Stage Complete!</h2>
                <div class="rewards-list">
                    <p>Experience: ${rewards.exp}</p>
                    <p>Gold: ${rewards.gold}</p>
                    ${rewards.gems ? `<p>Gems: ${rewards.gems}</p>` : ''}
                    ${rewards.cards.length > 0 ? `
                        <h3>Cards Received:</h3>
                        <div class="cards-grid">
                            ${rewards.cards.map(card => `
                                <div class="card-reward">
                                    <img src="/images/cards/${card.id}.jpg" alt="Card">
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <button onclick="window.location.reload()">Continue</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

// Initialize campaign manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.campaignManager = new CampaignManager();
});