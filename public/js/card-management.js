document.addEventListener('DOMContentLoaded', () => {
    // Skill upgrade handling
    document.querySelectorAll('.upgrade-skill-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const cardId = e.target.dataset.cardId;
            const skillId = e.target.dataset.skillId;

            try {
                const response = await fetch('/cards/upgrade-skill', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cardId, skillId })
                });

                const data = await response.json();
                if (data.success) {
                    const skillElement = e.target.closest('.skill');
                    skillElement.querySelector('.skill-level').textContent = `Lv. ${data.newLevel}`;
                    skillElement.querySelector('.skill-effect').textContent = 
                        `Current Effect: ${data.newEffect}%`;
                    
                    // Update button cost and state
                    e.target.textContent = `Upgrade (Cost: ${data.newLevel + 1} SP)`;
                    if (data.newLevel >= 10) {
                        e.target.disabled = true;
                        e.target.textContent = 'Max Level';
                    }
                }
            } catch (error) {
                console.error('Error upgrading skill:', error);
            }
        });
    });

    // Fusion handling
    document.querySelectorAll('.fuse-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const cardId = e.target.dataset.cardId;
            const materialCards = await selectMaterialCards();

            if (!materialCards.length) return;

            try {
                const response = await fetch('/cards/fuse', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        targetCardId: cardId,
                        materialCardIds: materialCards
                    })
                });

                const data = await response.json();
                if (data.success) {
                    const fusionStats = e.target.closest('.card-fusion')
                        .querySelector('.fusion-stats');
                    fusionStats.querySelector('.experience').textContent = 
                        `Experience: ${data.newExperience}`;
                }
            } catch (error) {
                console.error('Error fusing cards:', error);
            }
        });
    });

    // Dismantling handling
    document.querySelectorAll('.dismantle-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!confirm('Are you sure you want to dismantle this card?')) return;

            const cardId = e.target.dataset.cardId;

            try {
                const response = await fetch('/cards/dismantle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cardId })
                });

                const data = await response.json();
                if (data.success) {
                    // Remove card element from DOM
                    e.target.closest('.card').remove();
                    // Update materials display
                    updateMaterialsDisplay(data.rewards);
                }
            } catch (error) {
                console.error('Error dismantling card:', error);
            }
        });
    });
});

// Helper function to select material cards
async function selectMaterialCards() {
    return new Promise(resolve => {
        const modal = document.createElement('div');
        modal.className = 'material-selection-modal';
        // ... Modal content for selecting cards ...
        // This would show available cards and allow multiple selection
        // Return array of selected card IDs
    });
}

function updateMaterialsDisplay(rewards) {
    const materialsContainer = document.querySelector('.materials-container');
    if (materialsContainer) {
        // Update shards and gold display
        const shardsElement = materialsContainer.querySelector('.shards-amount');
        const goldElement = materialsContainer.querySelector('.gold-amount');
        if (shardsElement) shardsElement.textContent = 
            parseInt(shardsElement.textContent) + rewards.shards;
        if (goldElement) goldElement.textContent = 
            parseInt(goldElement.textContent) + rewards.gold;
    }
}