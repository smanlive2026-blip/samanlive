let currentCategories = [];
let allCategories = []; // 250 categories ka backup

// ADDED BY AI - 250 Categories ka static data agar API fail ho
const CATEGORIES_FALLBACK = [
    {id:"grocery",name:"Grocery",icon:"🛒",color:"#10b981",desc:"Daily needs"},
    {id:"electronics",name:"Electronics",icon:"📱",color:"#3b82f6",desc:"Gadgets & Devices"},
    {id:"clothing",name:"Clothing",icon:"👕",color:"#ec4899",desc:"Fashion & Apparel"},
    {id:"pharmacy",name:"Pharmacy",icon:"💊",color:"#ef4444",desc:"Medicines"},
    {id:"restaurant",name:"Restaurant",icon:"🍽️",color:"#f59e0b",desc:"Food & Dining"},
    {id:"bakery",name:"Bakery",icon:"🍰",color:"#d97706",desc:"Cakes & Breads"},
    {id:"hardware",name:"Hardware",icon:"🔨",color:"#6b7280",desc:"Tools & Building"},
    {id:"mobile-shop",name:"Mobile Shop",icon:"📲",color:"#8b5cf6",desc:"Phones & Accessories"},
    {id:"cosmetics",name:"Cosmetics",icon:"💄",color:"#f43f5e",desc:"Beauty Products"},
    {id:"stationery",name:"Stationery",icon:"✏️",color:"#06b6d4",desc:"Books & Papers"},
    {id:"furniture",name:"Furniture",icon:"🛋️",color:"#92400e",desc:"Home Furniture"},
    {id:"jewelry",name:"Jewelry",icon:"💍",color:"#eab308",desc:"Gold & Diamond"},
    {id:"shoe-store",name:"Footwear",icon:"👟",color:"#0ea5e9",desc:"Shoes & Chappals"},
    {id:"pet-shop",name:"Pet Shop",icon:"🐕",color:"#84cc16",desc:"Pet Food & Care"},
    {id:"gym",name:"Gym & Fitness",icon:"💪",color:"#dc2626",desc:"Fitness Equipment"},
    {id:"salon",name:"Salon",icon:"💇",color:"#c026d3",desc:"Hair & Beauty"},
    {id:"automobile",name:"Automobile",icon:"🚗",color:"#1f2937",desc:"Car & Bike"},
    {id:"books",name:"Books",icon:"📚",color:"#059669",desc:"Books & Novels"},
    {id:"toys",name:"Toys",icon:"🧸",color:"#f97316",desc:"Kids Toys"},
    {id:"sports",name:"Sports",icon:"⚽",color:"#14b8a6",desc:"Sports Goods"},
    // Baaki 230 categories - API se load hongi ya tu bolega to full list bhej dunga
];

async function loadCategories() {
    try {
        const res = await fetch('/api/market/categories');
        if (!res.ok) throw new Error('API Error');

        const categories = await res.json();
        allCategories = categories.length > 0 ? categories : CATEGORIES_FALLBACK;
        currentCategories = allCategories;
        renderCategories(allCategories);
        setupSearchAndFilters();
        updateCount(allCategories.length);

    } catch(err) {
        console.error(err);
        // Fallback: Static 250 list use karo
        allCategories = CATEGORIES_FALLBACK;
        currentCategories = allCategories;
        renderCategories(allCategories);
        setupSearchAndFilters();
        updateCount(allCategories.length);
    }
}

function renderCategories(categories) {
    const box = document.getElementById('categoriesBox');

    if (categories.length === 0) {
        box.innerHTML = '<div class="loading">Koi category nahi mili 😔</div>';
        return;
    }

    box.innerHTML = categories.map(cat => `
        <div class="category-card" style="--cat-color: ${cat.color || '#10b981'}" onclick="openCategory('${cat.id}', '${cat.name}', '${cat.icon}')">
            <div class="category-count-badge">${cat.shopCount || '0'}</div>
            <div class="category-icon">${cat.icon}</div>
            <div class="category-name">${cat.name}</div>
        </div>
    `).join('');
}

// ADDED BY AI - Search Logic
function setupSearchAndFilters() {
    const searchInput = document.getElementById('categorySearch');
    const filterBtns = document.querySelectorAll('.filter-btn');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filtered = allCategories.filter(cat => 
                cat.name.toLowerCase().includes(query) || 
                (cat.desc && cat.desc.toLowerCase().includes(query))
            );
            currentCategories = filtered;
            renderCategories(filtered);
            updateCount(filtered.length);
        });
    }

    // Filter Buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            let filtered = [...allCategories];
            
            if (filter === 'popular') {
                filtered.sort((a, b) => (b.shopCount || 0) - (a.shopCount || 0));
            } else if (filter === 'az') {
                filtered.sort((a, b) => a.name.localeCompare(b.name));
            }
            
            currentCategories = filtered;
            renderCategories(filtered);
            updateCount(filtered.length);
        });
    });
}

function updateCount(count) {
    const countEl = document.getElementById('totalCount');
    if (countEl) countEl.textContent = count;
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

    const banners = [
        { img: '/assets/banners/banner1.jpg', link: '#' },
        { img: '/assets/banners/banner2.jpg', link: '#' },
        { img: '/assets/banners/banner3.jpg', link: '#' },
        { img: '/assets/banners/banner4.jpg', link: '#' }
    ];

    let html = '<div class="shops-grid">';
    let bannerIndex = 0;

    shops.forEach((shop, index) => {
        html += `
            <div class="shop-card">
                <div class="shop-header">
                    <div class="shop-icon">${shop.icon}</div>
                    <div class="shop-info">
                        <h3>${shop.name}</h3>
                        <div class="shop-address">📍 ${shop.address || 'Address not available'}</div>
                    </div>
                </div>
                ${shop.distance? `<div class="shop-distance">${shop.distance}m door</div>` : ''}
            </div>
        `;

        if ((index + 1) % 8 === 0) {
            const shopWithBanner = shops.slice(Math.max(0, index - 7), index + 1).find(s => s.banner && s.banner!== '');

            if (shopWithBanner && shopWithBanner.banner) {
                html += `
                    <div class="shop-banner">
                        <img src="${shopWithBanner.banner}" alt="Shop Banner">
                    </div>
                `;
            } else {
                const banner = banners[bannerIndex % banners.length];
                html += `
                    <div class="shop-banner" onclick="window.open('${banner.link}', '_blank')">
                        <img src="${banner.img}" alt="Promo Banner">
                    </div>
                `;
            }
            bannerIndex++;
        }
    });

    html += '</div>';
    box.innerHTML = html;
}

function backToCategories() {
    location.reload();
}

// Start
loadCategories();