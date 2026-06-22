let allCategories = [];
let allShops = [];
let currentCategory = null;

async function loadMarketData() {
    try {
        // Categories load karo LOCAL MARKET module ki
        const [categoriesData, shopsData] = await Promise.all([
            apiCall('/categories?moduleId=local-market'),
            apiCall('/shops?moduleId=local-market&status=active')
        ]);

        allCategories = categoriesData || [];
        allShops = shopsData || [];
        
        renderCategories();
    } catch (err) {
        console.error('Load market data error:', err);
        document.getElementById('categoriesGrid').innerHTML = '<div class="empty">❌ Failed to load categories</div>';
    }
}

function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    
    if (allCategories.length === 0) {
        grid.innerHTML = '<div class="empty">📦 No categories found</div>';
        return;
    }

    grid.innerHTML = allCategories.map(cat => {
        const shopsInCat = allShops.filter(s => s.categoryId === (cat._id || cat.id));
        return `
            <div class="category-card" onclick="showShops('${cat._id || cat.id}', '${escapeHtml(cat.name)}')">
                <div class="category-icon">${cat.icon || '📦'}</div>
                <div class="category-name">${escapeHtml(cat.name)}</div>
                <div class="category-count">${shopsInCat.length} shops</div>
            </div>
        `;
    }).join('');
}

function showShops(categoryId, categoryName) {
    currentCategory = categoryId;
    document.getElementById('categoriesView').style.display = 'none';
    document.getElementById('shopsView').style.display = 'block';
    document.getElementById('currentCategoryName').textContent = categoryName;
    document.getElementById('categoryTitle').textContent = categoryName;
    
    renderShops(categoryId);
}

function showCategories() {
    document.getElementById('categoriesView').style.display = 'block';
    document.getElementById('shopsView').style.display = 'none';
    currentCategory = null;
}

function renderShops(categoryId) {
    const grid = document.getElementById('shopsGrid');
    const shops = allShops.filter(s => s.categoryId === categoryId);
    
    if (shops.length === 0) {
        grid.innerHTML = '<div class="empty">🏪 No shops in this category yet</div>';
        return;
    }

    grid.innerHTML = shops.map(shop => {
        const banner = shop.banner || 'https://via.placeholder.com/400x120?text=Shop+Banner';
        const logo = shop.logo || 'https://via.placeholder.com/56x56?text=🏪';
        const itemsCount = shop.items? shop.items.length : 0;
        
        return `
            <div class="shop-card" onclick="openShop('${shop._id}')">
                <img src="${banner}" class="shop-banner" alt="Banner" onerror="this.style.display='none'">
                <div class="shop-body">
                    <div class="shop-header-row">
                        <img src="${logo}" class="shop-logo" alt="Logo" onerror="this.src='https://via.placeholder.com/56x56?text=🏪'">
                        <div class="shop-info">
                            <div class="shop-name">${escapeHtml(shop.shopName || shop.name)}</div>
                            <span class="shop-type ${shop.shopType}">${shop.shopType}</span>
                        </div>
                    </div>
                    <div class="shop-meta">
                        <span>⭐ ${shop.rating || '0.0'}</span>
                        <span>📦 ${itemsCount} items</span>
                        <span>📍 ${shop.areaCode || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function openShop(shopId) {
    window.location.href = `/shop.html?id=${shopId}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// Init
loadMarketData();