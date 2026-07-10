const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const orders = shop.orders || [
        {id: 'PH001', customer: 'Rahul', service: 'Wedding Album 30 Page', qty: 1, amount: 4500, status: 'Printing'},
        {id: 'PH002', customer: 'Priya', service: 'ID Photo 12pcs', qty: 12, amount: 200, status: 'Ready'},
        {id: 'PH003', customer: 'Amit', service: '4x6 Photo Print', qty: 50, amount: 750, status: 'Printing'}
    ];

    const bookings = [
        {customer: 'Sharma Family', type: 'Birthday Shoot', date: '12 Oct 2026', time: '4 PM'},
        {customer: 'College Group', type: 'Pre-Wedding', date: '15 Oct 2026', time: '6 AM'}
    ];

    document.getElementById('prints').innerText = 230;
    document.getElementById('customers').innerText = orders.length;
    document.getElementById('pending').innerText = orders.filter(o => o.status === 'Printing').length;
    document.getElementById('revenue').innerText = orders.reduce((a,b) => a+b.amount, 0);

    loadOrders(orders);
    loadBookings(bookings);
    loadServices();
    loadStockAlert();
}

function loadOrders(orders) {
    const container = document.getElementById('ordersList');
    container.innerHTML = orders.map(o => `
        <div class="order-card">
            <div style="display:flex; justify-content:space-between;">
                <h4>${o.customer}</h4>
                <span class="status-badge ${o.status==='Ready'?'status-ready':'status-printing'}">${o.status}</span>
            </div>
            <p style="color:#64748b; font-size:14px; margin-top:5px;">Order: ${o.id} | ${o.service} | Qty: ${o.qty}</p>
            <strong style="color:#0ea5e9;">₹${o.amount}</strong>
        </div>
    `).join('');
}

function loadBookings(bookings) {
    const container = document.getElementById('bookingsList');
    container.innerHTML = bookings.map(b => `
        <div style="background:#e0f2fe; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${b.customer}</strong>
            <p style="font-size:12px; color:#64748b;">${b.type} | ${b.date} | ${b.time}</p>
        </div>
    `).join('');
}

function loadServices() {
    const services = ['Photo Print', 'ID Photo', 'Wedding Album', 'Photo Framing', 'Photo Shoot', 'Drone Video', 'Video Editing'];
    document.getElementById('services').innerHTML = services.map(s => `
        <div style="padding:8px; border-bottom:1px solid #e0f2fe;">✓ ${s}</div>
    `).join('');
}

function loadStockAlert() {
    const stock = [
        {item: 'Photo Paper 4x6', stock: 2},
        {item: 'Ink Cartridge', stock: 1}
    ];
    document.getElementById('stockAlert').innerHTML = stock.map(s => `
        <div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${s.item}</strong> - Only ${s.stock} left
        </div>
    `).join('');
}

document.getElementById('newOrderBtn').onclick = () => {
    window.location.href = `/shop-templates/photo-studio/order-form.html?shopId=${shopId}`;
};
document.getElementById('uploadBtn').onclick = () => {
    window.location.href = `/shop-templates/photo-studio/upload.html?shopId=${shopId}`;
};

loadShopData();