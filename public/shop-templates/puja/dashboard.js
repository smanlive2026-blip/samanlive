const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Murti Ganesh Ji', price: 500, stock: 15, category: 'Murti'},
        {name: 'Agarbatti', price: 50, stock: 50, category: 'Pooja Item'},
        {name: 'Diya Set', price: 120, stock: 30, category: 'Diya'},
        {name: 'Pooja Thali', price: 350, stock: 20, category: 'Thali'}
    ];

    const festivals = shop.festivals || [
        {name: 'Diwali Combo', price: 1500, orders: 25},
        {name: 'Navratri Kit', price: 800, orders: 40}
    ];

    document.getElementById('items').innerText = products.length;
    document.getElementById('sale').innerText = shop.todaySale || 0;
    document.getElementById('festival').innerText = festivals.reduce((a,b) => a+b.orders, 0);
    document.getElementById('revenue').innerText = shop.todayRevenue || 0;

    loadInventory(products);
    loadFestivals(festivals);
    loadLowStock(products);
    loadBestSelling();
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #fef3c7;">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.category} | Stock: ${p.stock}</p>
            </div>
            <strong style="color:#f59e0b;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadFestivals(festivals) {
    const container = document.getElementById('festivalList');
    container.innerHTML = festivals.map(f => `
        <div class="festival-card">
            <h4>${f.name}</h4>
            <p style="color:#64748b; font-size:14px;">₹${f.price} | ${f.orders} orders</p>
        </div>
    `).join('');
}

function loadLowStock(products) {
    const low = products.filter(p => p.stock < 10);
    const container = document.getElementById('lowStock');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">Stock OK ✓</p>' : 
        low.map(p => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${p.name}</strong> - Only ${p.stock} left
        </div>`).join('');
}

function loadBestSelling() {
    const best = ['Agarbatti', 'Diya', 'Sindoor', 'Kumkum', 'Murti'];
    document.getElementById('bestSelling').innerHTML = best.map((b,i) => `
        <div style="display:flex; justify-content:space-between; padding:10px;">
            <span>${i+1}. ${b}</span>
        </div>
    `).join('');
}

document.getElementById('addItemBtn').onclick = () => {
    window.location.href = `/shop-templates/puja/item-form.html?shopId=${shopId}`;
};
document.getElementById('newOrderBtn').onclick = () => {
    window.location.href = `/shop-templates/puja/order-form.html?shopId=${shopId}`;
};

loadShopData();