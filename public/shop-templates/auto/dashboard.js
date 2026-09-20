// ========================================
// AUTO PRO DASHBOARD JS - WORLD CLASS v3.0 FINAL - NO LOCALSTORAGE
// ========================================
const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId') || urlParams.get('id');

if(!shopId) alert('Shop ID nahi mila. URL me ?shopId=xxx lagao');

window.shopId = shopId;

const shopIdDisplay = document.getElementById('shopIdDisplay');
if(shopIdDisplay) shopIdDisplay.innerText = shopId ? shopId.substring(0, 8) + '...' : 'NO-ID';

let globalShop = null;

document.addEventListener('DOMContentLoaded', () => {
    loadShopData();
    document.getElementById('newServiceBtn')?.addEventListener('click', () => {
        window.location.href = `/shop-templates/auto/book-service.html?shopId=${shopId}`;
    });
    document.getElementById('addPartBtn')?.addEventListener('click', () => {
        window.location.href = `/shop-templates/auto/product-form.html?shopId=${shopId}`;
    });
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
        window.location.href = `/shop-templates/auto/settings.html?shopId=${shopId}`;
    });
    document.getElementById('viewShopBtn')?.addEventListener('click', () => {
        window.open(`/shop-templates/auto/customer-view.html?shopId=${shopId}`, '_blank');
    });
});

async function loadShopData() {
    try {
        const res = await fetch(`/api/shops/auto/${shopId}`, {cache:'no-store'});
        const result = await res.json();
        if(!result.success) throw new Error(result.message);
        const shop = result.shop;
        globalShop = shop;
        document.getElementById('shopName').innerText = shop.shopName || 'Auto Parts & Service Hub';
        document.getElementById('partsCountText') && (document.getElementById('partsCountText').innerText = `${shop.parts?.length || 0} Parts`);
        document.getElementById('vehicles').innerText = shop.stats?.vehicles ?? shop.serviceJobs?.filter(s => s.status !== 'delivered').length ?? 0;
        document.getElementById('service').innerText = shop.stats?.service ?? shop.serviceJobs?.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString()).length ?? 0;
        document.getElementById('revenue').innerText = shop.stats?.revenue ?? 0;
        document.getElementById('parts').innerText = shop.parts?.length || 0;
        document.getElementById('jobCount') && (document.getElementById('jobCount').innerText = `${shop.serviceJobs?.length || 0} Jobs`);
        document.getElementById('lowStockCount') && (document.getElementById('lowStockCount').innerText = `${shop.lowStock?.length || 0} low stock`);
        
        const toggleSwitch = document.getElementById('toggleSwitch');
        const toggleText = document.getElementById('toggleText');
        if(toggleSwitch && toggleText){
            const isOpen = shop.settings?.isOpen ?? true;
            toggleSwitch.classList.toggle('on', isOpen);
            toggleSwitch.classList.toggle('off', !isOpen);
            toggleText.innerText = isOpen ? 'Open' : 'Closed';
        }

        loadServices(shop.serviceJobs || []);
        loadParts(shop.parts || []);
        loadLowStock(shop.lowStock || shop.parts?.filter(p => p.stock < (p.lowStockLimit || 5)) || []);
    } catch(e) {
        console.error("Dashboard Error:", e);
        document.getElementById('serviceList').innerHTML = `<p style="color:red">Error: ${e.message}</p>`;
    }
}

function loadServices(services) {
    const container = document.getElementById('serviceList');
    if(!container) return;
    if(!services.length) {
        container.innerHTML = `<div style="text-align:center; padding:30px; color:#94a3b8;"><i class="fa-solid fa-car-side" style="font-size:32px; margin-bottom:10px; display:block;"></i>No active jobs<br><small>New Job se start karo</small></div>`;
        return;
    }
    container.innerHTML = services.slice(0,10).reverse().map(s => `
        <div class="service-card">
            <div class="meta">
                <div class="avatar">${(s.customerName || 'C')[0].toUpperCase()}</div>
                <div>
                    <b style="font-size:14px;">${s.customerName || 'Customer'} • ${s.vehicleNo || '-'}</b>
                    <p style="font-size:12px; color:#64748b; margin-top:2px;">${s.problem || 'General Service'} • ₹${s.totalAmount || 0}</p>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <span class="status ${s.status || 'pending'}">${s.status || 'pending'}</span>
                <select onchange="updateStatus('${s._id}', this.value)" style="border:1px solid #e2e8f0; padding:6px 8px; border-radius:8px; font-size:12px; font-weight:700;">
                    <option value="">Change</option>
                    <option value="pending" ${s.status==='pending'?'selected':''}>Pending</option>
                    <option value="service" ${s.status==='service'?'selected':''}>In Service</option>
                    <option value="delivered" ${s.status==='delivered'?'selected':''}>Delivered</option>
                </select>
            </div>
        </div>
    `).join('');
}

function loadParts(parts) {
    const container = document.getElementById('partsList');
    if(!container) return;
    if(!parts.length) {
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:30px; color:#94a3b8;"><i class="fa-solid fa-boxes-stacked" style="font-size:32px; margin-bottom:10px; display:block;"></i>No parts yet<br><b style="color:#f97316">⚡ Quick Add</b> dabao</div>`;
        return;
    }
    container.innerHTML = parts.map(p => {
        const pid = p._id || p.id;
        return `
        <div class="part-box">
            <img src="${p.image || 'https://placehold.co/400/f97316/fff?text=Part'}" loading="lazy">
            <div class="p">
                <b>${p.name}</b>
                <small>${p.brand || ''} • ${p.partNumber || p.partNo || ''}</small>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                    <span style="font-weight:800; color:#0f172a;">₹${p.price}</span>
                    <span style="font-size:11px; color:${p.stock < 5 ? '#ef4444' : '#16a34a'}; font-weight:700;">${p.stock} in stock</span>
                </div>
                <div style="display:flex; gap:6px; margin-top:10px;">
                    <button onclick="editPart('${pid}')" style="flex:1; background:#0f172a; color:white; border:none; padding:7px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer;"><i class="fa fa-pen"></i> Edit</button>
                    <button onclick="deletePart('${pid}')" style="background:#fee2e2; color:#dc2626; border:none; padding:7px 10px; border-radius:8px; cursor:pointer;"><i class="fa fa-trash"></i></button>
                </div>
            </div>
        </div>`}).join('');
}

function loadLowStock(parts) {
    const container = document.getElementById('lowStock');
    if(!container) return;
    if(!parts.length) {
        container.innerHTML = `<p style="color:#16a34a; font-weight:700; font-size:13px;"><i class="fa-solid fa-check"></i> All stock OK ✓</p>`;
        return;
    }
    container.innerHTML = parts.slice(0,5).map(p => `
        <div style="background:#fef3c7; padding:12px; border-radius:12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; font-size:13px;">
            <div><b>${p.name}</b><br><small style="color:#92400e;">${p.brand || ''}</small></div>
            <span style="background:#92400e; color:white; padding:4px 8px; border-radius:20px; font-weight:800; font-size:11px;">${p.stock} LEFT</span>
        </div>
    `).join('');
}

async function updateStatus(jobId, newStatus) {
    if(!newStatus) return;
    try {
        const res = await fetch(`/api/shops/auto/${shopId}/service/${jobId}`, {
            method: 'PUT', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if(data.success) loadShopData(); else alert('Failed');
    } catch(e) { alert('Failed: ' + e.message); }
}

async function deletePart(id) {
    if(!confirm('Is part ko delete karna hai?')) return;
    try {
        const res = await fetch(`/api/shops/auto/${shopId}/item/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if(data.success) loadShopData(); else alert('Delete fail');
    } catch(e) { alert('Error: ' + e.message); }
}

function editPart(id) {
    window.location.href = `/shop-templates/auto/product-form.html?shopId=${shopId}&editId=${id}`;
}

window.reloadAutoParts = loadShopData;
window.loadShopData = loadShopData;