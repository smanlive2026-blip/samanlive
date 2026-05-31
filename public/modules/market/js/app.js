let currentCategories = [];

async function loadCategories() {
    try {
        const res = await fetch('/api/market/categories');
        if (!res.ok) throw new Error('API Error');
        
        const categories = await res.json();
        currentCategories = categories;
        const box = document.getElementById('categoriesBox');
        
        if (categories.length === 0) {
            box.innerHTML = '<div class="loading">Koi category nahi mili</div>';
            return;
        }

        box.innerHTML = categories.map(cat => `
            <div class="category-card" style="--cat-color: ${cat.color}" onclick="openCategory('${cat.id}', '${cat.name}', '${cat.icon}')">
                <div class="category-icon">${cat.icon}</div>
                <div class="category-name">${cat.name}</div>
            </div>
        `).join('');
        
    } catch(err) {
        console.error(err);
        document.getElementById('categoriesBox').innerHTML = 
            '<div class="error">Error loading categories 😢<br><small>Server chalu hai?</small></div>';
    }
}

async function openCategory(id, name, icon) {
    const container = document.getElementById('mainContainer');
    container.innerHTML = `
        <div class="market-header">
            <button class="back-btn" onclick="backToCategories()">← Back to Categories</button>
            <h1>${icon} ${name}</h1>
            <p>Is category ki sabhi dukaanen</p>
        </div>
        <div id="shopsBox" class="loading">Loading shops...</div>
    `;

    try {
        let url = `/api/market/shops/${id}`;
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                url += `?lat=${lat}&lng=${lng}`;
                await fetchShops(url);
            }, async () => {
                await fetchShops(url);
            });
        } else {
            await fetchShops(url);
        }
    } catch(err) {
        console.error(err);
        document.getElementById('shopsBox').innerHTML = 
            '<div class="error">Error loading shops 😢</div>';
    }
}

async function fetchShops(url) {
    const res = await fetch(url);
    const shops = await res.json();
    const box = document.getElementById('shopsBox');
    
    if (shops.length === 0) {
        box.innerHTML = '<div class="loading">Is category me abhi koi shop nahi hai 😔</div>';
        return;
    }

    // Banner list - yahan apne banner add kar
    const banners = [
        { img: '/assets/banners/banner1.jpg', link: '#' },
        { img: '/assets/banners/banner2.jpg', link: '#' },
        { img: '/assets/banners/banner3.jpg', link: '#' },
        { img: '/assets/banners/banner4.jpg', link: '#' }
    ];
    
    let html = '<div class="shops-grid">';
    let bannerIndex = 0;

    shops.forEach((shop, index) => {
        // 1. Shop card
        html += `
            <div class="shop-card">
                <div class="shop-header">
                    <div class="shop-icon">${shop.icon}</div>
                    <div class="shop-info">
                        <h3>${shop.name}</h3>
                        <div class="shop-address">📍 ${shop.address || 'Address not available'}</div>
                    </div>
                </div>
                ${shop.distance ? `<div class="shop-distance">${shop.distance}m door</div>` : ''}
            </div>
        `;

        // 2. Har 8 shops = 2 lines ke baad banner - UNLIMITED
        if ((index + 1) % 8 === 0) {
            const banner = banners[bannerIndex % banners.length];
            html += `
                <div class="shop-banner" onclick="window.open('${banner.link}', '_blank')">
                    <img src="${banner.img}" alt="Promo Banner">
                </div>
            `;
            bannerIndex++;
        }
    });

    html += '</div>';
    box.innerHTML = html;
}

function backToCategories() {
    location.reload();
}

loadCategories();