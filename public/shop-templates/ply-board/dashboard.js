const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: '18mm BWR Plywood', price: 3200, stock: 40, size: '8x4 ft', type: 'Plywood', grade: 'BWR', brand: 'Greenply'},
        {name: '12mm MR Plywood', price: 1800, stock: 35, size: '8x4 ft', type: 'Plywood', grade: 'MR', brand: 'Century'},
        {name: 'MDF Board', price: 1200, stock: 50, size: '8x4 ft', type: 'MDF', grade: 'Plain', brand: 'Action Tesa'},
        {name: 'Laminate Sheet', price: 800, stock: 60, size: '8x4 ft', type: 'Laminate', grade: '1mm', brand: 'Merino'},
        {name: 'Veneer Sheet', price: 1500, stock: 25, size: '8x4 ft', type: 'Veneer', grade: 'Teak', brand: 'DURO'},
        {name: 'Flush Door', price: 2800, stock: 20, size: '7x3 ft', type: 'Door', grade: 'Commercial', brand: 'Duro'}
    ];

    const orders = shop.orders || [
        {id: 'PLY001', customer: 'Ramesh Carpenter', items: '10 Ply + 5 Laminate', amount: 36000},
        {id: 'PLY002', customer: 'Sita Interiors', items: 'MDF + Hardware', amount: 15000}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('orders').innerText = orders.length;
    document.getElementById('cutting').innerText = 4;
    document.getElementById('revenue').innerText = orders.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadOrders(orders);
    loadCategories();
    loadStockAlert(products);
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div class="ply-row">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.type} | ${p.brand} | Stock: ${p.stock}</p>
                <span class="spec-badge">${p.size}</span>
                <span class="spec-badge">${p.grade}</span>
            </div>
            <strong style="color:#8b5cf6;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadOrders(orders) {
    const container = document.getElementById('orderList');
    container.innerHTML = orders.map(o => `
        <div style="border:2px solid #ede9fe; border-radius:12px; padding:15px; margin-bottom:12px;">
            <h4>${o.customer}</h4>
            <p style="color:#64748b; font-size:14px;">Order: ${o.id} | ${o.items}</p>
            <strong style="color:#8b5cf6;">₹${o.amount}</strong>
        </div>
    `).join('');
}

function loadCategories() {
    const cats = ['Plywood BWR', 'Plywood MR', 'MDF Board', 'Laminate', 'Veneer', 'Flush Door', 'Block Board', 'Hardware'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #ede9fe;">✓ ${c}</div>
    `).join('');
}

function loadStockAlert(products) {
    const low = products.filter(p => p.stock < 30);
    const container = document.getElementById('stockAlert');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">Stock OK ✓</p>' : 
        low.map(p => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${p.name}</strong> - Only ${p.stock} left
        </div>`).join('');
}

document.getElementById('addItemBtn').onclick = () => {
    window.location.href = `/shop-templates/ply-board/item-form.html?shopId=${shopId}`;
};
document.getElementById('newOrderBtn').onclick = () => {
    window.location.href = `/shop-templates/ply-board/billing.html?shopId=${shopId}`;
};

loadShopData();