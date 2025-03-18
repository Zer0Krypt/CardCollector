document.addEventListener('DOMContentLoaded', () => {
    const singlePullBtn = document.querySelector('.single-pull');
    const multiPullBtn = document.querySelector('.multi-pull');
    const resultsContainer = document.querySelector('.pull-results');
    const resultsContent = document.querySelector('.results-container');
    const closeResultsBtn = document.querySelector('.close-results');

    async function performPull(type) {
        try {
            const response = await fetch(`/gacha/${type}-pull`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.success) {
                displayResults(type === 'multi' ? data.pulls : [data.card]);
                // Update gems count
                const gemsCount = document.querySelector('.gems-count');
                const currentGems = parseInt(gemsCount.textContent);
                const cost = type === 'multi' ? 1000 : 100;
                gemsCount.textContent = `${currentGems - cost} Gems`;
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error performing pull:', error);
            alert('Failed to perform pull');
        }
    }

    function displayResults(cards) {
        resultsContent.innerHTML = cards.map(card => `
            <div class="card ${card.rarity.toLowerCase()}" data-card-id="${card.id}">
                <div class="card-header">
                    <span class="card-name">${card.name}</span>
                    <span class="card-type">${card.type}</span>
                </div>
                <div class="card-image">
                    <img src="${card.image_url}" alt="${card.name}">
                    <div class="card-power">${card.base_power}</div>
                    <div class="card-element ${card.element_type.toLowerCase()}">
                        <i class="element-icon"></i>
                    </div>
                </div>
            </div>
        `).join('');

        resultsContainer.style.display = 'block';
    }

    singlePullBtn.addEventListener('click', () => performPull('single'));
    multiPullBtn.addEventListener('click', () => performPull('multi'));
    closeResultsBtn.addEventListener('click', () => {
        resultsContainer.style.display = 'none';
    });
});