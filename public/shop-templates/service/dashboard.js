const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
let currentShop = null;

document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); window.location.href = '/local-market/create-shop.html'; return; }

    currentShop = shop;
    document.getElementById('shopName').innerText = shop.shopName;
    
    const requests = shop.serviceRequests || [];
    document.getElementById('newRequests').innerText = requests.filter(r => r.status === 'pending').length;
    document.getElementById('completedToday').innerText = requests.filter(r => r.status === 'completed').length;
    document.getElementById('activeTechs').innerText = shop.technicians?.length || 0;
    
    loadRequests(requests);
    loadTechnicians(shop.technicians || []);
}

function loadRequests(requests) {
    const container = document.getElementById('requestList');
    if (requests.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#94a3b8; padding:40px;">No service requests yet</p>`;
        return;
    }
    container.innerHTML = requests.map(req => `
        <div class="request-card">
            <div class="request-header">
                <h4>${req.serviceType} - ${req.customerName}</h4>
                <span class="status-badge ${req.status}">${req.status.toUpperCase()}</span>
            </div>
            <p><i class="fa fa-map-marker-alt"></i> ${req.address}</p>
            <p><i class="fa fa-phone"></i> ${req.phone}</p>
            <p><i class="fa fa-clock"></i> ${new Date(req.date).toLocaleString()}</p>
        </div>
    `).join('');
}

function loadTechnicians(techs) {
    const grid = document.getElementById('technicianGrid');
    if (techs.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#94a3b8;">No technicians added</p>`;
        return;
    }
    grid.innerHTML = techs.map(t => `
        <div class="tech-card">
            <div class="tech-avatar">${t.name.charAt(0)}</div>
            <h4>${t.name}</h4>
            <p style="font-size:12px; color:#64748b;">${t.skill}</p>
        </div>
    `).join('');
}

document.getElementById('addServiceBtn').onclick = () => {
    window.location.href = `/shop-templates/service-form.html?shopId=${shopId}`;
};

loadShopData();