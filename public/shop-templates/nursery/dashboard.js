const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const plants = shop.plants || [
        {name: 'Money Plant', price: 150, stock: 30, type: 'Indoor', care: 'Easy'},
        {name: 'Rose Plant', price: 200, stock: 15, type: 'Flowering', care: 'Medium'},
        {name: 'Mango Tree', price: 500, stock: 8, type: 'Fruit', care: 'Hard'},
        {name: 'Aloe Vera', price: 120, stock: 25, type: 'Medicinal', care: 'Easy'}
    ];

    const items = shop.items || [
        {name: 'Clay Pot 10inch', price: 80, stock: 50},
        {name: 'Fertilizer 1kg', price: 150, stock: 20},
        {name: 'Garden Soil', price: 100, stock: 30}
    ];

    document.getElementById('plants').innerText = plants.length;
    document.getElementById('sale').innerText = shop.todaySale || 0;
    document.getElementById('delivery').innerText = shop.todayDelivery || 0;
    document.getElementById('revenue').innerText = shop.todayRevenue || 0;

    loadPlants(plants);
    loadGardenItems(items);
    loadLowStock(plants);
    loadCategories();
}

function loadPlants(plants) {
    const container = document.getElementById('plantList');
    container.innerHTML = plants.map(p => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #dcfce7;">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.type} | Stock: ${p.stock}</p>
                <span class="care-badge">Care: ${p.care}</span>
            </div>
            <strong style="color:#22c55e;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadGardenItems(items) {
    const container = document.getElementById('gardenList');
    container.innerHTML = items.map(i => `
        <div style="display:flex; justify-content:space-between; padding:12px;">
            <span>${i.name}</span>
            <strong style="color:#22c55e;">₹${i.price}</strong>
        </div>
    `).join('');
}

function loadLowStock(plants) {
    const low = plants.filter(p => p.stock < 10);
    const container = document.getElementById('lowStock');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">Stock OK ✓</p>' : 
        low.map(p => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${p.name}</strong> - Only ${p.stock} left
        </div>`).join('');
}

function loadCategories() {
    const cats = ['Indoor Plants', 'Outdoor Plants', 'Flowering', 'Fruit Trees', 'Medicinal', 'Pots', 'Seeds', 'Fertilizer'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #dcfce7;">✓ ${c}</div>
    `).join('');
}

document.getElementById('addPlantBtn').onclick = () => {
    window.location.href = `/shop-templates/nursery/plant-form.html?shopId=${shopId}`;
};
document.getElementById('newOrderBtn').onclick = () => {
    window.location.href = `/shop-templates/nursery/order-form.html?shopId=${shopId}`;
};

loadShopData();