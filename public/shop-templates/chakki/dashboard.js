const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const orders = shop.orders || [
        {id: 'C001', customer: 'Rahul Sharma', item: 'Gehu Aata', weight: 10, amount: 50, status: 'ready'},
        {id: 'C002', customer: 'Priya', item: 'Besan', weight: 5, amount: 40, status: 'pending'}
    ];

    const products = shop.products || [
        {name: 'Gehu Aata Pisai', rate: 5, unit: 'kg'},
        {name: 'Bajra Aata', rate: 6, unit: 'kg'},
        {name: 'Besan', rate: 8, unit: 'kg'},
        {name: 'Masala Pisai', rate: 20, unit: 'kg'}
    ];

    document.getElementById('customers').innerText = 120;
    document.getElementById('pisai').innerText = orders.reduce((a,b) => a+b.weight, 0);
    document.getElementById('delivery').innerText = orders.filter(o => o.status === 'pending').length;
    document.getElementById('revenue').innerText = orders.reduce((a,b) => a+b.amount, 0);

    loadOrders(orders);
    loadProducts(products);
    loadPickup(orders);
    loadServices();
}

function loadOrders(orders) {
    const container = document.getElementById('orderList');
    container.innerHTML = orders.map(o => `
        <div class="order-card">
            <div style="display:flex; justify-content:space-between;">
                <div>
                    <h4>${o.customer}</h4>
                    <p style="color:#64748b; font-size:14px;">${o.item} - ${o.weight} KG</p>
                </div>
                <div style="text-align:right;">
                    <strong style="color:#f59e0b;">₹${o.amount}</strong>
                    <br><span class="status-badge">${o.status}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function loadProducts(products) {
    const container = document.getElementById('productList');
    container.innerHTML = products.map(p => `
        <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid #fef3c7;">
            <strong>${p.name}</strong>
            <strong style="color:#f59e0b;">₹${p.rate}/${p.unit}</strong>
        </div>
    `).join('');
}

function loadPickup(orders) {
    const pending = orders.filter(o => o.status === 'pending');
    const container = document.getElementById('pickupList');
    container.innerHTML = pending.length === 0 ? '<p style="color:#16a34a;">No Pickup ✓</p>' : 
        pending.map(o => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${o.customer}</strong> - ${o.item} ${o.weight}KG
        </div>`).join('');
}

function loadServices() {
    const services = ['Gehu Pisai', 'Bajra Pisai', 'Besan', 'Masala Pisai', 'Home Pickup', 'Home Delivery'];
    document.getElementById('services').innerHTML = services.map(s => `
        <div style="padding:8px; border-bottom:1px solid #fef3c7;">✓ ${s}</div>
    `).join('');
}

document.getElementById('newOrderBtn').onclick = () => {
    window.location.href = `/shop-templates/chakki/order-form.html?shopId=${shopId}`;
};
document.getElementById('pickupBtn').onclick = () => {
    window.location.href = `/shop-templates/chakki/pickup.html?shopId=${shopId}`;
};

loadShopData();