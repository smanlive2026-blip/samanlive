const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const tiles = shop.tiles || [
        {name: 'Floor Tile 2x2', price: 80, stock: 200, size: '2x2 ft', type: 'Floor'},
        {name: 'Wall Tile 1x1', price: 90, stock: 150, size: '1x1 ft', type: 'Wall'},
        {name: 'Bathroom Tile', price: 100, stock: 100, size: '1x2 ft', type: 'Bathroom'},
        {name: 'Parking Tile', price: 70, stock: 300, size: '1x1 ft', type: 'Parking'}
    ];

    const orders = shop.orders || [
        {id: 'T001', customer: 'Rahul', area: '500 sqft', amount: 40000},
        {id: 'T002', customer: 'Priya', area: '300 sqft', amount: 25000}
    ];

    document.getElementById('designs').innerText = tiles.length;
    document.getElementById('sale').innerText = orders.length;
    document.getElementById('sqft').innerText = orders.reduce((a,b) => a+parseInt(b.area), 0);
    document.getElementById('revenue').innerText = orders.reduce((a,b) => a+b.amount, 0);

    loadTiles(tiles);
    loadOrders(orders);
    loadLowStock(tiles);
    loadCategories();
}

function loadTiles(tiles) {
    const container = document.getElementById('tileList');
    container.innerHTML = tiles.map(t => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #f3f4f6;">
            <div>
                <strong>${t.name}</strong>
                <p style="color:#64748b; font-size:12px;">${t.type} | Stock: ${t.stock} boxes</p>
                <span class="size-badge">${t.size}</span>
            </div>
            <strong style="color:#6b7280;">₹${t.price}/sqft</strong>
        </div>
    `).join('');
}

function loadOrders(orders) {
    const container = document.getElementById('orderList');
    container.innerHTML = orders.map(o => `
        <div class="tile-card">
            <h4>${o.customer} - ${o.area}</h4>
            <p style="color:#64748b; font-size:14px;">Bill: ${o.id} | ₹${o.amount}</p>
        </div>
    `).join('');
}

function loadLowStock(tiles) {
    const low = tiles.filter(t => t.stock < 50);
    const container = document.getElementById('lowStock');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">Stock OK ✓</p>' : 
        low.map(t => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${t.name}</strong> - Only ${t.stock} boxes left
        </div>`).join('');
}

function loadCategories() {
    const cats = ['Floor Tile', 'Wall Tile', 'Bathroom Tile', 'Parking Tile', 'Designer Tile', 'Marble', 'Granite', 'Mosaic'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #f3f4f6;">✓ ${c}</div>
    `).join('');
}

document.getElementById('addTileBtn').onclick = () => {
    window.location.href = `/shop-templates/tiles/tile-form.html?shopId=${shopId}`;
};
document.getElementById('newOrderBtn').onclick = () => {
    window.location.href = `/shop-templates/tiles/order-form.html?shopId=${shopId}`;
};

loadShopData();