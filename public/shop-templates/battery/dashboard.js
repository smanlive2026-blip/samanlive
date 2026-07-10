const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const batteries = shop.batteries || [
        {name: 'Exide Car Battery 60AH', price: 6500, stock: 12, type: 'Car', warranty: 36, exchange: 1500},
        {name: 'Amaron Bike Battery 12V', price: 2200, stock: 20, type: 'Bike', warranty: 24, exchange: 500},
        {name: 'Tata Inverter Battery 150AH', price: 18000, stock: 8, type: 'Inverter', warranty: 60, exchange: 4000},
        {name: 'Luminous Solar Battery 200AH', price: 25000, stock: 5, type: 'Solar', warranty: 60, exchange: 6000}
    ];

    const warrantyClaims = shop.warranty || [
        {customer: 'Rahul', battery: 'Exide 60AH', date: '2024-01-15', status: 'pending'},
        {customer: 'Aman', battery: 'Tata 150AH', date: '2023-12-20', status: 'approved'}
    ];

    document.getElementById('stock').innerText = batteries.reduce((a,b) => a+b.stock, 0);
    document.getElementById('sale').innerText = shop.todaySale || 0;
    document.getElementById('exchange').innerText = shop.todayExchange || 0;
    document.getElementById('revenue').innerText = shop.todayRevenue || 0;

    loadBatteries(batteries);
    loadWarranty(warrantyClaims);
    loadLowStock(batteries);
    loadTypes();
}

function loadBatteries(batteries) {
    const container = document.getElementById('batteryList');
    container.innerHTML = batteries.map(b => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #fef9c3;">
            <div>
                <strong>${b.name}</strong>
                <p style="color:#64748b; font-size:12px;">${b.type} | Stock: ${b.stock} | Warranty: ${b.warranty} months</p>
            </div>
            <div style="text-align:right;">
                <strong style="color:#eab308;">₹${b.price}</strong><br>
                <span class="exchange-badge">Exchange ₹${b.exchange}</span>
            </div>
        </div>
    `).join('');
}

function loadWarranty(claims) {
    const container = document.getElementById('warrantyList');
    if (claims.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#94a3b8;">No claims</p>`;
        return;
    }
    container.innerHTML = claims.map(w => `
        <div class="warranty-card">
            <h4>${w.customer}</h4>
            <p style="color:#64748b; font-size:14px;">${w.battery} | Date: ${w.date}</p>
            <span class="warranty-badge">${w.status}</span>
        </div>
    `).join('');
}

function loadLowStock(batteries) {
    const low = batteries.filter(b => b.stock < 5);
    const container = document.getElementById('lowStock');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">Stock OK ✓</p>' : 
        low.map(b => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${b.name}</strong> - Only ${b.stock} left
        </div>`).join('');
}

function loadTypes() {
    const types = ['Car Battery', 'Bike Battery', 'Inverter Battery', 'Solar Battery', 'UPS Battery', 'E-Rickshaw Battery'];
    document.getElementById('types').innerHTML = types.map(t => `
        <div style="padding:8px; border-bottom:1px solid #fef9c3;">✓ ${t}</div>
    `).join('');
}

document.getElementById('newSaleBtn').onclick = () => {
    window.location.href = `/shop-templates/battery/sale-form.html?shopId=${shopId}`;
};
document.getElementById('addBatteryBtn').onclick = () => {
    window.location.href = `/shop-templates/battery/battery-form.html?shopId=${shopId}`;
};

loadShopData();