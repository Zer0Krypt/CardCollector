document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;
    let currentSort = 'rarity';
    let currentFilter = '';

    const loadInventory = async () => {
        try {
            const response = await fetch(
                `/inventory?page=${currentPage}&sort=${currentSort}&filter=${currentFilter}`
            );
            const data = await response.json();
            
            renderCards(data.cards);
            renderPagination(data.totalPages, data.currentPage);
            loadStats();
        } catch (error) {
            console.error('Error loading inventory:', error);
        }
    };

    const loadStats = async () => {
        try {
            const response = await fetch('/inventory/stats');
            const stats = await response.json();
            
            const statsHtml = stats.map(stat => `
                <div class="stat-card">
                    <h3>${stat.rarity}</h3>
                    <p>Count: ${stat.count}</p>
                    <p>Avg Level: ${(stat.total_levels / stat.count).toFixed(1)}</p>
                    <p>Evolved: ${stat.evolved_count}</p>
                </div>
            `).join('');
            
            document.querySelector('.inventory-stats').innerHTML = statsHtml;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const renderCards = (cards) => {
        const cardsGrid = document.querySelector('.cards-grid');
        cardsGrid.innerHTML = cards.map(card => `
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
                <div class="card-stats">
                    <div class="level">LV. ${card.level}</div>
                    <div class="evolution">${'★'.repeat(card.evolution)}</div>
                    <div class="exp-bar" style="width: ${card.experience % 100}%"></div>
                </div>
                <div class="card-actions">
                    <button class="level-up-btn" ${card.level >= 20 ? 'disabled' : ''}>
                        Level Up
                    </button>
                    <button class="evolve-btn" ${card.level < 20 ? 'disabled' : ''}>
                        Evolve
                    </button>
                </div>
            </div>
        `).join('');
    };

    const renderPagination = (totalPages, currentPage) => {
        const pagination = document.querySelector('.pagination');
        pagination.innerHTML = `
            <button ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">Previous</button>
            ${Array.from({ length: totalPages }, (_, i) => i + 1)
                .map(page => `
                    <button class="${page === currentPage ? 'active' : ''}" 
                            data-page="${page}">${page}</button>
                `).join('')}
            <button ${currentPage === totalPages ? 'disabled' : ''} 
                    data-page="${currentPage + 1}">Next</button>
        `;
    };

    // Event Listeners
    document.querySelector('#sortSelect').addEventListener('change', (e) => {
        currentSort = e.target.value;
        currentPage = 1;
        loadInventory();
    });

    document.querySelector('#filterSelect').addEventListener('change', (e) => {
        currentFilter = e.target.value;
        currentPage = 1;
        loadInventory();
    });

    document.querySelector('.pagination').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && !e.target.disabled) {
            currentPage = parseInt(e.target.dataset.page);
            loadInventory();
        }
    });

    // Initial load
    loadInventory();
});