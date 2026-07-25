const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

let globalShopData = {};

async function loadShopData() {
    try {
        const res = await fetch(`/api/shops/auto/${shopId}`); // ✅ naya route
        const result = await res.json();
        if (!result.success) { alert('Shop not found'); return; }

        const shop = result.shop;
        globalShopData = shop;

        document.getElementById('shopName').innerText = shop.shopName;

        const services = shop.serviceJobs || [];
        const parts = shop.parts || [];
        const serviceList = shop.services || ['Engine Oil Change', 'Brake Service', 'AC Repair', 'Engine Work', 'Tyre Change', 'Battery Change', 'Car Wash', 'Denting Painting'];

        document.getElementById('vehicles').innerText = shop.stats.vehicles || 0;
        document.getElementById('service').innerText = shop.stats.service || 0;
        document.getElementById('parts').innerText = shop.stats.parts || 0;
        document.getElementById('revenue').innerText = shop.stats.revenue || 0;

        loadServices(services);
        loadParts(parts);
        loadLowStock(parts);
        loadServiceList(serviceList);

    } catch(e) {
        console.error("Dashboard Load Error:", e);
        alert("Failed to load shop data");
    }
}

function loadServices(services) {
    const container = document.getElementById('serviceList');
    if(services.length === 0) {
        container.innerHTML = '<p style="color:#64748b;">No active jobs</p>';
        return;
    }
    container.innerHTML = services.map(s => `
        <div class="service-card">
            <div style="display:flex; justify-content:space-between;">
                <div>
                    <h4>${s.customerName} - ${s.vehicleNo}</h4>
                    <p style="color:#64748b; font-size:14px;">Issue: ${s.problem}</p>
                    <p style="color:#f97316; font-weight:700;">₹${s.totalAmount}</p>
                </div>
                <span class="status ${s.status}">${s.status}</span>
            </div>
            <select onchange="updateStatus('${s._id}', this.value)" class="btn" style="margin-top:10px; width:100%; background:#1f2937;">
                <option value="">Update Status</option>
                <option value="pending" ${s.status==='pending'?'selected':''}>Pending</option>
                <option value="service" ${s.status==='service'?'selected':''}>In Service</option>
                <option value="delivered" ${s.status==='delivered'?'selected':''}>Delivered</option>
            </select>
        </div>
    `).join('');
}

function loadParts(parts) {
    const container = document.getElementById('partsList');
    if(parts.length === 0) {
        container.innerHTML = '<p style="color:#64748b;">No parts added yet</p>';
        return;
    }
    container.innerHTML = parts.map(p => `
        <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid #ffedd5;">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">Stock: ${p.stock} | SKU: ${p.sku || '-'}</p>
            </div>
            <strong style="color:#f97316;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadLowStock(parts) {
    const low = globalShopData.lowStock || parts.filter(p => p.stock < p.lowStockLimit);
    const container = document.getElementById('lowStock');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">All stock OK ✓</p>' : 
        low.map(p => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${p.name}</strong> - Only ${p.stock} left
        </div>`).join('');
}

function loadServiceList(services) {
    document.getElementById('services').innerHTML = services.map(s => `
        <div style="padding:8px; border-bottom:1px solid #ffedd5;">✓ ${s.name || s}</div>
    `).join('');
}

// STATUS UPDATE API CALL
async function updateStatus(jobId, newStatus) {
    if(!newStatus) return;
    try {
        const res = await fetch(`/api/shops/auto/${shopId}/service/${jobId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if(data.success) {
            alert('Status Updated!');
            loadShopData(); // reload
        }
    } catch(e) {
        alert('Failed to update');
    }
}

document.getElementById('newServiceBtn').onclick = () => {
    window.location.href = `/shop-templates/auto/service-form.html?shopId=${shopId}`;
};
document.getElementById('addPartBtn').onclick = () => {
    window.location.href = `/shop-templates/auto/part-form.html?shopId=${shopId}`;
};

// INIT
loadShopData();
setInterval(loadShopData, 30000); // 30 sec me auto refresh