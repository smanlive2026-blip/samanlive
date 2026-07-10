const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const repairs = shop.repairs || [
        {id: 'R001', customer: 'Rahul', model: 'Samsung A52', issue: 'Screen Broken', status: 'working', amount: 3500, token: 1},
        {id: 'R002', customer: 'Priya', model: 'iPhone 12', issue: 'Battery Change', status: 'pending', amount: 2500, token: 2},
        {id: 'R003', customer: 'Aman', model: 'OnePlus 9', issue: 'Camera Not Working', status: 'ready', amount: 1800, token: 3}
    ];

    const parts = shop.parts || [
        {name: 'iPhone Screen', stock: 5}, {name: 'Samsung Screen', stock: 8},
        {name: 'Battery', stock: 15}, {name: 'Charging Port', stock: 20},
        {name: 'Camera', stock: 10}, {name: 'Back Glass', stock: 12}
    ];

    document.getElementById('active').innerText = repairs.filter(r => r.status !== 'delivered').length;
    document.getElementById('delivered').innerText = repairs.filter(r => r.status === 'delivered').length;
    document.getElementById('waiting').innerText = repairs.filter(r => r.status === 'pending').length;
    document.getElementById('revenue').innerText = repairs.reduce((a,b) => a+b.amount, 0);

    loadRepairs(repairs);
    loadParts(parts);
    loadReady(repairs);
    loadServices();
}

function loadRepairs(repairs) {
    const container = document.getElementById('repairList');
    container.innerHTML = repairs.map(r => `
        <div class="repair-card">
            <div style="display:flex; justify-content:space-between;">
                <div>
                    <h4>Token #${r.token} - ${r.customer}</h4>
                    <p style="color:#64748b; font-size:14px;">${r.model} | ${r.issue}</p>
                    <p style="color:#2563eb; font-weight:700;">₹${r.amount}</p>
                </div>
                <span class="status ${r.status}">${r.status}</span>
            </div>
            <button onclick="updateStatus('${r.id}')" class="btn" style="margin-top:10px; width:100%;">Update Status</button>
        </div>
    `).join('');
}

function loadParts(parts) {
    const container = document.getElementById('partsList');
    container.innerHTML = parts.map(p => `
        <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid #dbeafe;">
            <span>${p.name}</span>
            <span style="font-weight:700; color:${p.stock<5?'red':'#2563eb'};">${p.stock} pcs</span>
        </div>
    `).join('');
}

function loadReady(repairs) {
    const ready = repairs.filter(r => r.status === 'ready');
    const container = document.getElementById('readyList');
    container.innerHTML = ready.length === 0 ? '<p style="color:#94a3b8;">No phones ready</p>' : 
        ready.map(r => `<div style="padding:10px; background:#dcfce7; border-radius:10px; margin-bottom:10px;">
            <strong>${r.customer}</strong> - ${r.model}<br>
            <span style="font-size:12px;">Token #${r.token} | ₹${r.amount}</span>
        </div>`).join('');
}

function loadServices() {
    const services = [
        'Screen Replacement', 'Battery Change', 'Charging Port', 
        'Camera Repair', 'Software Flash', 'Water Damage',
        'Speaker/Mic Repair', 'Back Glass Change'
    ];
    document.getElementById('services').innerHTML = services.map(s => `
        <div style="padding:8px; border-bottom:1px solid #dbeafe;">✓ ${s}</div>
    `).join('');
}

function updateStatus(id) {
    alert(`Status updated for ${id}`);
    loadShopData();
}

document.getElementById('newRepairBtn').onclick = () => {
    window.location.href = `/shop-templates/mobile/repair-form.html?shopId=${shopId}`;
};

loadShopData();