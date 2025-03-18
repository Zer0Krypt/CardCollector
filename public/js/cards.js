document.addEventListener('DOMContentLoaded', () => {
    // Level up card
    document.querySelectorAll('.level-up-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const cardId = e.target.closest('.card').dataset.cardId;
            try {
                const response = await fetch('/cards/level-up', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        cardId,
                        experienceGained: 100
                    })
                });
                
                const data = await response.json();
                if (data.success) {
                    // Update card display
                    const card = e.target.closest('.card');
                    card.querySelector('.level').textContent = `LV. ${data.newLevel}`;
                    
                    // Calculate exp bar percentage
                    const expPercentage = (data.newExp % 100) / 100 * 100;
                    card.querySelector('.exp-bar').style.width = `${expPercentage}%`;
                    
                    // Update exp tooltip
                    if (data.expToNextLevel > 0) {
                        card.querySelector('.exp-bar').setAttribute(
                            'title', 
                            `${data.expToNextLevel} EXP to next level`
                        );
                    }
                    
                    // Enable/disable buttons based on level
                    if (data.maxLevel) {
                        btn.disabled = true;
                        card.querySelector('.evolve-btn').disabled = false;
                    }
                }
            } catch (error) {
                console.error('Error leveling up card:', error);
            }
        });
    });

    // Evolve card
    document.querySelectorAll('.evolve-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const cardId = e.target.closest('.card').dataset.cardId;
            try {
                const response = await fetch('/cards/evolve', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ cardId })
                });
                
                const data = await response.json();
                if (data.success) {
                    // Update card display
                    const card = e.target.closest('.card');
                    card.querySelector('.level').textContent = 'LV. 1';
                    card.querySelector('.exp-bar').style.width = '0%';
                    card.querySelector('.evolution').textContent = '★'.repeat(data.newEvolution);
                    
                    // Update materials display
                    document.querySelector('.player-shards').textContent = data.remainingShards;
                    document.querySelector('.player-gold').textContent = data.remainingGold;
                    
                    // Reset buttons
                    btn.disabled = data.maxEvolution;
                    card.querySelector('.level-up-btn').disabled = false;
                    
                    // Update power display (if applicable)
                    if (card.querySelector('.card-power')) {
                        const basePower = parseInt(card.querySelector('.card-power').dataset.basePower);
                        const newPower = Math.floor(basePower * (1 + (data.newEvolution - 1) * 0.2));
                        card.querySelector('.card-power').textContent = newPower;
                    }
                }
            } catch (error) {
                console.error('Error evolving card:', error);
            }
        });
    });
});
