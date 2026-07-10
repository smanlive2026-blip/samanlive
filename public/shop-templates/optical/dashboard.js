const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const frames = shop.frames || [
        {name: 'Ray-Ban Aviator', price: 8500, stock: 12, type: 'Sunglasses', brand: 'Ray-Ban'},
        {name: 'Titan Metal Frame', price: 2200, stock: 20, type: 'Eyeglass', brand: 'Titan'},
        {name: 'Fastrack Sports', price: 1500, stock: 15, type: 'Sunglasses', brand: 'Fastrack'},
        {name: 'Kids Frame', price: 999, stock: 25, type: 'Eyeglass', brand: 'Local'}
    ];

    const orders = shop.orders || [
        {id: 'OP001', customer: 'Rahul', type: 'Progressive Lens', power: '-2.5', amount: 4500, status: 'Making'},
        {id: 'OP002', customer: 'Priya', type: 'Blue Cut Lens', power: '-1.0', amount: 2800, status: 'Ready'},
        {id: 'OP003', customer: 'Amit', type: 'Sunglasses', power: '0', amount: 3500, status: 'Ready'}
    ];

    const eyeTests = [
        {customer: 'Sita', power: 'SP: -3.0 CY: -0.5', date: 'Today', doctor: 'Dr. Sharma'},
        {customer: 'Vikram', power: 'SP: +2.0', date: 'Yesterday', doctor: 'Dr. Mehta'}
    ];

    document.getElementById('frames').innerText = frames.length;
    document.getElementById('patients').innerText = eyeTests.length;
    document.getElementById('ready').innerText = orders.filter(o => o.status === 'Ready').length;
    document.getElementById('revenue').innerText = orders.reduce((a,b) => a+b.amount, 0);

    loadOrders(orders);
    loadEyeTests(eyeTests);
    loadServices();
    loadReminder();
}

function loadOrders(orders) {
    const container = document.getElementById('ordersList');
    container.innerHTML = orders.map(o => `
        <div class="order-card">
            <div style="display:flex; justify-content:space-between;">
                <h4>${o.customer}</h4>
                <span class="prescription-badge">${o.status}</span>
            </div>
            <p style="color:#64748b; font-size:14px; margin-top:5px;">${o.type} | Power: ${o.power}</p>
            <strong style="color:#06b6d4;">₹${o.amount}</strong>
        </div>
    `).join('');
}

function loadEyeTests(tests) {
    const container = document.getElementById('eyeTestList');
    container.innerHTML = tests.map(t => `
        <div style="background:#cffafe; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${t.customer}</strong>
            <p style="font-size:12px; color:#64748b;">Power: ${t.power} | ${t.date} | ${t.doctor}</p>
        </div>
    `).join('');
}

function loadServices() {
    const services = ['Eye Test Free', 'Computer Lens', 'Blue Cut Lens', 'Progressive Lens', 'Contact Lens', 'Sunglasses', 'Frame Repair'];
    document.getElementById('services').innerHTML = services.map(s => `
        <div style="padding:8px; border-bottom:1px solid #cffafe;">✓ ${s}</div>
    `).join('');
}

function loadReminder() {
    const due = [
        {customer: 'Anita', pickup: 'Today 6 PM'},
        {customer: 'Rohan', pickup: 'Tomorrow 11 AM'}
    ];
    document.getElementById('reminder').innerHTML = due.map(r => `
        <div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${r.customer}</strong> - Pickup: ${r.pickup}
        </div>
    `).join('');
}

document.getElementById('eyeTestBtn').onclick = () => {
    window.location.href = `/shop-templates/optical/eye-test.html?shopId=${shopId}`;
};
document.getElementById('newOrderBtn').onclick = () => {
    window.location.href = `/shop-templates/optical/order-form.html?shopId=${shopId}`;
};

loadShopData();