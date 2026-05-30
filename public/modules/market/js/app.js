const API_BASE = window.location.origin;

// Load categories
async function loadMarketCategories() {
    try {
        const res = await fetch(`${API_BASE}/api/market/categories`);
        const categories = await res.json();
        
        const grid = document.getElementById('categoriesGrid');
        if(!grid) return;
        
        grid.innerHTML = categories.map(cat => `
            <div class="category-card" onclick="openCategory('${cat.id}')" style="border-left: 4px solid ${cat.color}">
                <div class="category-icon">${cat.icon}</div>
                <h3>${cat.name}</h3>
            </div>
        `).join('');
    } catch(err) {
        console.error('Error loading categories:', err);
    }
}

// Open category - show shops
async function openCategory(categoryId) {
    try {
        const res = await fetch(`${API_BASE}/api/market/shops/${categoryId}`);
        const shops = await res.json();
        
        const container = document.getElementById('mainContainer');
        container.innerHTML = `
            <button onclick="loadMarketCategories()" class="back-btn">← Back to Categories</button>
            <h2>Shops in Category</h2>
            <div class="shops-grid">
                ${shops.length ? shops.map(shop => `
                    <div class="shop-card">
                        <div class="shop-icon">${shop.icon}</div>
                        <h3>${shop.name}</h3>
                        <p style="color: #64748b; font-size: 14px;">${shop.address || 'Address not set'}</p>
                        <button class="view-btn" style="background: ${shop.color}">View Shop</button>
                    </div>
                `).join('') : '<p style="text-align:center; color:#64748b;">No shops in this category yet.</p>'}
            </div>
        `;
    } catch(err) {
        console.error('Error:', err);
    }
}

// Auto load on page open
document.addEventListener('DOMContentLoaded', loadMarketCategories);