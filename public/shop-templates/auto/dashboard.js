// ========================================
// AUTO PARTS DASHBOARD JS - FULL v1.1
// ========================================

const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');

if(!shopId) {
    alert('Shop ID nahi mila. URL me ?shopId=xxx add karo');
}

document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

let globalShopData = {};

document.addEventListener('DOMContentLoaded', () => {
    loadShopData();

    document.getElementById('newServiceBtn').onclick = () => {
        window.location.href = `/shop-templates/auto-parts/service-form.html?shopId=${shopId}`;
    };
    document.getElementById('addPartBtn').onclick = () => {
        window.open(`/shop-templates/auto-parts/part-form.html?shopId=${shopId}`, '_blank');
    };
});

async function loadShopData() {
    try {
        const res = await fetch(`/api/shops/auto/${shopId}`);
        const result = await res.json();
        if (!result.success) { alert('Shop not found'); return; }

        const shop = result.shop;
        globalShopData = shop;

        document.getElementById('shopName').innerText = shop.shopName || shop.name || 'Auto Parts & Service';

        const services = shop.serviceJobs || [];
        const parts = shop.parts || [];
        const serviceList = shop.services || ['Engine Oil Change', 'Brake Service', 'AC Repair', 'Engine Work', 'Tyre Change', 'Battery Change', 'Car Wash', 'Denting Painting'];

        // STATS
        document.getElementById('vehicles').innerText = shop.stats?.vehicles || services.filter(s => s.status !== 'delivered').length;
        document.getElementById('service').innerText = shop.stats?.service || services.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString()).length;
        document.getElementById('parts').innerText = shop.stats?.parts || parts.length;
        document.getElementById('revenue').innerText = shop.stats?.revenue || services.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString()).reduce((sum, s) => sum + (s.totalAmount || 0), 0);

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
        container.innerHTML = '<p style="color:#64748b; text-align:center; padding:20px;">No active jobs</p>';
        return;
    }
    container.innerHTML = services.map(s => `
        <div class="service-card">
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div style="flex:1;">
                    <h4>${s.customerName} - ${s.vehicleNo}</h4>
                    <p style="color:#64748b; font-size:14px;">Issue: ${s.problem}</p>
                    <p style="color:#f97316; font-weight:700; margin-top:5px;">₹${s.totalAmount}</p>
                </div>
                <span class="status ${s.status}">${s.status}</span>
            </div>
            <select onchange="updateStatus('${s._id}', this.value)" class="btn" style="margin-top:10px; width:100%; background:#1f2937; border:none;">
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
        container.innerHTML = '<p style="color:#64748b; text-align:center; padding:20px;">No parts added yet</p>';
        return;
    }
    container.innerHTML = parts.map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #ffedd5;">
            <div style="display:flex; gap:10px; align-items:center;">
                <img src="${p.image || 'https://placehold.co/40/f97316/fff?text=P'}" style="width:40px; height:40px; border-radius:8px; object-fit:cover;">
                <div>
                    <strong>${p.name}</strong>
                    <p style="color:#64748b; font-size:12px;">Stock: ${p.stock} | SKU: ${p.sku || '-'}</p>
                </div>
            </div>
            <div style="text-align:right;">
                <strong style="color:#f97316;">₹${p.price}</strong>
                <div style="display:flex; gap:5px; margin-top:5px;">
                    <button onclick="editPart('${p._id}')" style="background:#2563eb; color:white; border:none; padding:4px 8px; border-radius:6px; cursor:pointer;"><i class="fa fa-pen"></i></button>
                    <button onclick="deletePart('${p._id}')" style="background:#dc2626; color:white; border:none; padding:4px 8px; border-radius:6px; cursor:pointer;"><i class="fa fa-trash"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

function loadLowStock(parts) {
    const low = globalShopData.lowStock || parts.filter(p => p.stock < (p.lowStockLimit || 5));
    const container = document.getElementById('lowStock');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">All stock OK ✓</p>' : 
        low.map(p => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px; display:flex; justify-content:space-between;">
            <strong>${p.name}</strong> <span style="color:#78350f;">Only ${p.stock} left</span>
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
        } else {
            alert('Update failed: ' + data.message);
        }
    } catch(e) {
        alert('Failed to update');
    }
}

// DELETE PART
async function deletePart(id) {
    if(!confirm('Part delete karein?')) return;
    try {
        const res = await fetch(`/api/shops/auto/${shopId}/item/${id}`, {method: 'DELETE'});
        const data = await res.json();
        if(data.success) {
            alert('Deleted');
            loadShopData();
        }
    } catch(e) { alert('Delete failed'); }
}

// EDIT PART
function editPart(id) {
    window.open(`/shop-templates/auto-parts/part-form.html?shopId=${shopId}&editId=${id}`, '_blank');
}