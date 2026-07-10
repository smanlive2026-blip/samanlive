const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Teak Wood Door', price: 8500, stock: 15, size: '7x3 ft', type: 'Wooden', material: 'Teak', finish: 'Polish'},
        {name: 'Steel Safety Door', price: 12000, stock: 10, size: '7x3 ft', type: 'Steel', material: '16 Gauge', finish: 'Powder Coated'},
        {name: 'Flush Door', price: 3200, stock: 25, size: '7x3 ft', type: 'Flush', material: 'MDF', finish: 'Laminate'},
        {name: 'PVC Bathroom Door', price: 2800, stock: 20, size: '6.5x2.5 ft', type: 'PVC', material: 'PVC', finish: 'White'},
        {name: 'Designer Glass Door', price: 15000, stock: 8, size: '7x4 ft', type: 'Glass', material: 'Toughened', finish: 'Frosted'}
    ];

    const orders = shop.orders || [
        {id: 'DR001', customer: 'Ramesh', items: '3 Teak Door + Fitting', amount: 28000},
        {id: 'DR002', customer: 'Sita', items: '2 Steel Door', amount: 24000}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('orders').innerText = orders.length;
    document.getElementById('install').innerText = 3;
    document.getElementById('revenue').innerText = orders.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadOrders(orders);
    loadCategories();
    loadInstallation();
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div class="door-row">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.type} | ${p.material} | Stock: ${p.stock}</p>
                <span class="spec-badge">${p.size}</span>
                <span class="spec-badge">${p.finish}</span>
            </div>
            <strong style="color:#a16207;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadOrders(orders) {
    const container = document.getElementById('orderList');
    container.innerHTML = orders.map(o => `
        <div style="border:2px solid #fefce8; border-radius:12px; padding:15px; margin-bottom:12px;">
            <h4>${o.customer}</h4>
            <p style="color:#64748b; font-size:14px;">Order: ${o.id} | ${o.items}</p>
            <strong style="color:#a16207;">₹${o.amount}</strong>
        </div>
    `).join('');
}

function loadCategories() {
    const cats = ['Wooden Door', 'Steel Door', 'Flush Door', 'PVC Door', 'Glass Door', 'Folding Door', 'Hardware', 'Installation'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #fefce8;">✓ ${c}</div>
    `).join('');
}

function loadInstallation() {
    const installs = [
        {customer: 'Amit', work: '5 Door Installation', date: '14 Oct 2026'},
        {customer: 'Priya', work: 'Steel Door Fitting', date: '15 Oct 2026'}
    ];
    document.getElementById('installation').innerHTML = installs.map(i => `
        <div style="background:#fefce8; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${i.customer}</strong>
            <p style="font-size:12px; color:#64748b;">${i.work} | ${i.date}</p>
        </div>
    `).join('');
}

document.getElementById('addDoorBtn').onclick = () => {
    window.location.href = `/shop-templates/door-shop/door-form.html?shopId=${shopId}`;
};
document.getElementById('newOrderBtn').onclick = () => {
    window.location.href = `/shop-templates/door-shop/billing.html?shopId=${shopId}`;
};

loadShopData();