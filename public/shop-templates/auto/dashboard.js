const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const services = shop.services || [
        {id: 'S001', customer: 'Rohit', vehicle: 'Honda City', issue: 'Oil Change + Brake', status: 'service', amount: 2500},
        {id: 'S002', customer: 'Aman', vehicle: 'Splendor Bike', issue: 'Engine Work', status: 'pending', amount: 3500},
        {id: 'S003', customer: 'Priya', vehicle: 'Swift', issue: 'AC Repair', status: 'delivered', amount: 4000}
    ];

    const parts = shop.parts || [
        {name: 'Engine Oil 1L', stock: 25, price: 400}, {name: 'Brake Pad', stock: 15, price: 800},
        {name: 'Car Battery', stock: 8, price: 6500}, {name: 'Bike Tyre', stock: 12, price: 1200},
        {name: 'Air Filter', stock: 20, price: 350}, {name: 'Spark Plug', stock: 30, price: 200}
    ];

    document.getElementById('vehicles').innerText = services.length;
    document.getElementById('service').innerText = services.filter(s => s.status === 'service').length;
    document.getElementById('parts').innerText = parts.length;
    document.getElementById('revenue').innerText = services.reduce((a,b) => a+b.amount, 0);

    loadServices(services);
    loadParts(parts);
    loadLowStock(parts);
    loadServiceList();
}

function loadServices(services) {
    const container = document.getElementById('serviceList');
    container.innerHTML = services.map(s => `
        <div class="service-card">
            <div style="display:flex; justify-content:space-between;">
                <div>
                    <h4>${s.customer} - ${s.vehicle}</h4>
                    <p style="color:#64748b; font-size:14px;">Issue: ${s.issue}</p>
                    <p style="color:#f97316; font-weight:700;">₹${s.amount}</p>
                </div>
                <span class="status ${s.status}">${s.status}</span>
            </div>
            <button onclick="updateStatus('${s.id}')" class="btn" style="margin-top:10px; width:100%;">Update</button>
        </div>
    `).join('');
}

function loadParts(parts) {
    const container = document.getElementById('partsList');
    container.innerHTML = parts.map(p => `
        <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid #ffedd5;">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">Stock: ${p.stock}</p>
            </div>
            <strong style="color:#f97316;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadLowStock(parts) {
    const low = parts.filter(p => p.stock < 10);
    const container = document.getElementById('lowStock');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">All stock OK ✓</p>' : 
        low.map(p => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${p.name}</strong> - Only ${p.stock} left
        </div>`).join('');
}

function loadServiceList() {
    const services = ['Engine Oil Change', 'Brake Service', 'AC Repair', 'Engine Work', 'Tyre Change', 'Battery Change', 'Car Wash', 'Denting Painting'];
    document.getElementById('services').innerHTML = services.map(s => `
        <div style="padding:8px; border-bottom:1px solid #ffedd5;">✓ ${s}</div>
    `).join('');
}

function updateStatus(id) {
    alert(`Service ${id} status updated`);
    loadShopData();
}

document.getElementById('newServiceBtn').onclick = () => {
    window.location.href = `/shop-templates/auto/service-form.html?shopId=${shopId}`;
};
document.getElementById('addPartBtn').onclick = () => {
    window.location.href = `/shop-templates/auto/part-form.html?shopId=${shopId}`;
};

loadShopData();