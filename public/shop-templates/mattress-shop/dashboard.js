const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Orthopedic Spring Mattress', price: 12000, stock: 15, size: '6x6 ft', type: 'Spring', warranty: '10 Year', brand: 'Sleepwell'},
        {name: 'Memory Foam Mattress', price: 18000, stock: 10, size: '5x6 ft', type: 'Foam', warranty: '8 Year', brand: 'Kurlon'},
        {name: 'Coir Mattress', price: 8500, stock: 20, size: '6x6 ft', type: 'Coir', warranty: '5 Year', brand: 'Peps'},
        {name: 'Rebond Mattress', price: 9500, stock: 18, size: '4x6 ft', type: 'Rebond', warranty: '5 Year', brand: 'Duroflex'},
        {name: 'Latex Mattress', price: 22000, stock: 8, size: '6x6 ft', type: 'Latex', warranty: '12 Year', brand: 'Wakefit'}
    ];

    const orders = shop.orders || [
        {id: 'MT001', customer: 'Ramesh', items: '2 Orthopedic 6x6', amount: 24000},
        {id: 'MT002', customer: 'Sita', items: 'Memory Foam 5x6', amount: 18000}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('orders').innerText = orders.length;
    document.getElementById('delivery').innerText = 3;
    document.getElementById('revenue').innerText = orders.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadOrders(orders);
    loadCategories();
    loadTrial();
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div class="mattress-row">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.type} | ${p.brand} | Stock: ${p.stock}</p>
                <span class="size-badge">${p.size}</span>
                <span class="size-badge">${p.warranty}</span>
            </div>
            <strong style="color:#6366f1;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadOrders(orders) {
    const container = document.getElementById('orderList');
    container.innerHTML = orders.map(o => `
        <div style="border:2px solid #e0e7ff; border-radius:12px; padding:15px; margin-bottom:12px;">
            <h4>${o.customer}</h4>
            <p style="color:#64748b; font-size:14px;">Order: ${o.id} | ${o.items}</p>
            <strong style="color:#6366f1;">₹${o.amount}</strong>
        </div>
    `).join('');
}

function loadCategories() {
    const cats = ['Spring Mattress', 'Memory Foam', 'Orthopedic', 'Coir', 'Rebond', 'Latex', 'Hotel Mattress', 'Pillows'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #e0e7ff;">✓ ${c}</div>
    `).join('');
}

function loadTrial() {
    const trials = [
        {customer: 'Amit', product: 'Memory Foam 6x6', date: '15 Oct 2026'},
        {customer: 'Priya', product: 'Orthopedic 5x6', date: '16 Oct 2026'}
    ];
    document.getElementById('trial').innerHTML = trials.map(t => `
        <div style="background:#e0e7ff; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${t.customer}</strong>
            <p style="font-size:12px; color:#64748b;">${t.product} | Trial: ${t.date}</p>
        </div>
    `).join('');
}

document.getElementById('addMattressBtn').onclick = () => {
    window.location.href = `/shop-templates/mattress-shop/mattress-form.html?shopId=${shopId}`;
};
document.getElementById('newOrderBtn').onclick = () => {
    window.location.href = `/shop-templates/mattress-shop/billing.html?shopId=${shopId}`;
};

loadShopData();