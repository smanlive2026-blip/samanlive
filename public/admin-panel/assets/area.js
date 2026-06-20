let allAreas = [];
let allManagers = [];
let allUsers = [];
let allShops = [];
let allProducts = [];
let allModules = [];
let map, marker, circle;
let searchTimeout;
let currentRadius = 50;

const API = '/api';

async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) {
            opts.body = JSON.stringify(body);
        }
        const res = await fetch(API + endpoint, opts);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'API Error');
        return data;
    } catch (err) {
        console.error('API Error:', err);
        throw err;
    }
}

async function loadAreas() {
    try {
        const [areasData, managersData, usersData, shopsData, productsData, modulesData] = await Promise.all([
            apiCall('/areas'),
            apiCall('/managers'),
            apiCall('/users').catch(() => []),
            apiCall('/shops').catch(() => []),
            apiCall('/products').catch(() => []),
            apiCall('/modules').catch(() => ({ modules: [] }))
        ]);
        allAreas = areasData || [];
        allManagers = managersData || [];
        allUsers = usersData || [];
        allShops = shopsData || [];
        allProducts = productsData || [];
        allModules = modulesData.modules || modulesData || [];

        renderAreas(allAreas);
        updateStats();
    } catch (err) {
        console.error(err);
        showToast('Failed to load data: ' + err.message, 'error');
    }
}

function updateStats() {
    document.getElementById('totalAreas').textContent = allAreas.length;
    document.getElementById('activeAreas').textContent = allAreas.filter(a => a.status).length;
    document.getElementById('totalManagersAll').textContent = allManagers.length;

    const avgRadius = allAreas.length > 0? (allAreas.reduce((sum, a) => sum + (a.radius || 50), 0) / allAreas.length).toFixed(0) : 0;
    document.getElementById('coverageText').textContent = `${avgRadius}km Avg`;
    document.getElementById('areaTableTitle').textContent = `All Areas - ${avgRadius}km Avg Zone`;
}

function renderAreas(areas) {
    const tbody = document.getElementById('areasTable');
    tbody.innerHTML = areas.length === 0? '<tr><td colspan="10" class="loading">No areas created yet</td></tr>' :
        areas.map(a => {
            const managerCount = allManagers.filter(m => m.areaCode === a.areaCode).length;
            const totalBuckets = 15;
            const radius = a.radius || 50;

            const liveModules = allModules.filter(m => m.activeAreas && m.activeAreas.includes(a.areaCode));
            const moduleCount = liveModules.length;

            return `<tr class="area-row" onclick="showAreaStats('${a._id}')">
                <td><span class="area-code-text">${escapeHtml(a.areaCode)}</span></td>
                <td>${escapeHtml(a.areaName)}</td>
                <td>${escapeHtml(a.city)}</td>
                <td>${escapeHtml(a.state)}</td>
                <td style="font-family:monospace;font-size:12px;">${a.centerLat.toFixed(4)}, ${a.centerLng.toFixed(4)}</td>
                <td><span class="badge">${radius} km</span></td>
                <td><b>${managerCount}</b>/${totalBuckets}</td>
                <td><span class="badge ${moduleCount > 0? 'badge-success' : 'badge-warning'}">${moduleCount}</span></td>
                <td><span class="status-badge ${a.status? 'status-active' : 'status-hidden'}">${a.status? 'Active' : 'Inactive'}</span></td>
                <td class="actions" onclick="event.stopPropagation()">
                    <button class="btn btn-secondary btn-sm" onclick="editArea('${a._id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteArea('${a._id}', ${managerCount}, ${moduleCount})">Delete</button>
                </td>
            </tr>`;
        }).join('');
}

window.filterAreas = (query) => {
    const q = query.toLowerCase().trim();
    if (!q) {
        renderAreas(allAreas);
        return;
    }
    const filtered = allAreas.filter(a =>
        a.areaCode.toLowerCase().includes(q) ||
        a.areaName.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.state.toLowerCase().includes(q)
    );
    renderAreas(filtered);
};

window.showAreaStats = async (areaId) => {
    const area = allAreas.find(a => a._id === areaId);
    if (!area) return;

    document.getElementById('statsAreaName').textContent = `${area.areaName} (${area.areaCode})`;
    document.getElementById('areaStatsModal').style.display = 'flex';

    const managers = allManagers.filter(m => m.areaCode === area.areaCode);
    const shops = allShops.filter(s => s.areaCode === area.areaCode || s.area === area.city);
    const users = allUsers.filter(u => u.areaCode === area.areaCode);
    const products = allProducts.filter(p => {
        const shop = allShops.find(s => s._id === p.shopId);
        return shop && (shop.areaCode === area.areaCode || shop.area === area.city);
    });
    const liveModules = allModules.filter(m => m.activeAreas && m.activeAreas.includes(area.areaCode));

    const radius = area.radius || 50;

    document.getElementById('areaStatsBody').innerHTML = `
        <div class="stats-row">
            <div class="mini-stat">
                <div class="mini-stat-value">${managers.length}</div>
                <div class="mini-stat-label">Managers</div>
            </div>
            <div class="mini-stat">
                <div class="mini-stat-value">${shops.length}</div>
                <div class="mini-stat-label">Shops</div>
            </div>
            <div class="mini-stat">
                <div class="mini-stat-value">${users.length}</div>
                <div class="mini-stat-label">Users</div>
            </div>
            <div class="mini-stat">
                <div class="mini-stat-value">${products.length}</div>
                <div class="mini-stat-label">Products</div>
            </div>
            <div class="mini-stat">
                <div class="mini-stat-value">${liveModules.length}</div>
                <div class="mini-stat-label">Live Modules</div>
            </div>
        </div>
        <div style="margin-top:24px;">
            <h3 style="margin-bottom:16px;font-size:16px;font-weight:700;">📍 Location Details</h3>
            <div style="background:#f8fafc;padding:16px;border-radius:10px;">
                <p style="margin:8px 0;"><b>City:</b> ${escapeHtml(area.city)}</p>
                <p style="margin:8px 0;"><b>State:</b> ${escapeHtml(area.state)}</p>
                <p style="margin:8px 0;"><b>Center:</b> ${area.centerLat.toFixed(6)}, ${area.centerLng.toFixed(6)}</p>
                <p style="margin:8px 0;"><b>Coverage:</b> ${radius} km radius</p>
                <p style="margin:8px 0;"><b>Status:</b> <span class="status-badge ${area.status? 'status-active' : 'status-hidden'}">${area.status? 'Active' : 'Inactive'}</span></p>
            </div>
        </div>
        <div style="margin-top:24px;">
            <h3 style="margin-bottom:16px;font-size:16px;font-weight:700;">📦 Live Modules (${liveModules.length})</h3>
            ${liveModules.length > 0
           ? liveModules.map(m => `<div style="padding:12px;background:#f8fafc;border-radius:8px;margin-bottom:8px;border-left:3px solid #10b981;"><b>${m.icon || '📦'} ${escapeHtml(m.name)}</b><br><small style="color:#64748b;">${escapeHtml(m.desc || 'No description')}</small></div>`).join('')
            : '<p style="color:#94a3b8;padding:20px;text-align:center;background:#f8fafc;border-radius:8px;">No modules live in this area yet</p>'
        }
        </div>
        <div style="margin-top:24px;">
            <h3 style="margin-bottom:16px;font-size:16px;font-weight:700;">👥 Managers (${managers.length}/15)</h3>
            ${managers.length > 0? managers.map(m => `<div style="padding:12px;background:#f8fafc;border-radius:8px;margin-bottom:8px;border-left:3px solid #3b82f6;"><b>${escapeHtml(m.name)}</b><br><small style="color:#64748b;">${escapeHtml(m.email)}</small></div>`).join('') : '<p style="color:#94a3b8;padding:20px;text-align:center;background:#f8fafc;border-radius:8px;">No managers assigned yet</p>'}
        </div>
    `;
};

window.closeAreaStats = () => {
    document.getElementById('areaStatsModal').style.display = 'none';
};

function generateNextAreaCode(city, state) {
    const cityCode = city.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '');
    const stateCode = state.substring(0, 2).toUpperCase().replace(/[^A-Z]/g, '');
    const baseCode = `${cityCode}${stateCode}`;

    const existingAreas = allAreas.filter(a => a.areaCode.startsWith(baseCode));

    if (existingAreas.length === 0) {
        return `${baseCode}-1`;
    }

    let maxSeq = 0;
    existingAreas.forEach(a => {
        const match = a.areaCode.match(new RegExp(`^${baseCode}-(\\d+)$`));
        if (match) {
            const seq = parseInt(match[1]);
            if (seq > maxSeq) maxSeq = seq;
        }
    });

    return `${baseCode}-${maxSeq + 1}`;
}

window.openAddArea = () => {
    document.getElementById('areaId').value = '';
    document.getElementById('areaModalTitle').textContent = 'Create New Area';
    document.getElementById('areaForm').reset();
    document.getElementById('areaCode').value = '';
    document.getElementById('areaName').value = '';
    document.getElementById('areaRadius').value = '50';
    currentRadius = 50;
    document.getElementById('radiusDisplay').textContent = '50 km';
    document.getElementById('areaModal').style.display = 'flex';
    setTimeout(() => {
        initMap();
        setTimeout(() => map.invalidateSize(), 100);
    }, 300);
};

function initMap() {
    if (map) {
        map.remove();
        map = null;
    }

    const defaultCenter = [20.5937, 78.9629];
    map = L.map('map').setView(defaultCenter, 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    map.on('click', async (e) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`);
            const data = await res.json();

            const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Unknown';
            const state = data.address.state || data.address.region || '';

            const areaCode = generateNextAreaCode(city, state);
            const seqMatch = areaCode.match(/-(\d+)$/);
            const seq = seqMatch? seqMatch[1] : '1';

            document.getElementById('areaCode').value = areaCode;
            document.getElementById('areaName').value = `${city} Zone ${seq} - ${currentRadius}km`;
            document.getElementById('cityName').value = city;
            document.getElementById('stateName').value = state;
            document.getElementById('centerLat').value = lat.toFixed(6);
            document.getElementById('centerLng').value = lng.toFixed(6);
            document.getElementById('mapCenterText').textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

            updateMapMarker(lat, lng);
        } catch (err) {
            console.error('Geocoding error:', err);
            showToast('Failed to get location details', 'error');
        }
    });
}

document.getElementById('areaRadius').addEventListener('input', (e) => {
    currentRadius = parseInt(e.target.value) || 50;
    document.getElementById('radiusDisplay').textContent = `${currentRadius} km`;
    const cityName = document.getElementById('cityName').value;
    const areaCode = document.getElementById('areaCode').value;
    if (cityName && areaCode) {
        const seqMatch = areaCode.match(/-(\d+)$/);
        const seq = seqMatch? seqMatch[1] : '1';
        document.getElementById('areaName').value = `${cityName} Zone ${seq} - ${currentRadius}km`;
    }
    if (circle && map) {
        circle.setRadius(currentRadius * 1000);
    }
});

document.getElementById('citySearch').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();

    if (query.length < 3) {
        document.getElementById('cityResults').style.display = 'none';
        return;
    }

    searchTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1`);
            const results = await res.json();

            const resultsDiv = document.getElementById('cityResults');
            if (results.length === 0) {
                resultsDiv.innerHTML = '<div class="search-result-item">No results found</div>';
            } else {
                resultsDiv.innerHTML = results.map(r => `
                    <div class="search-result-item" onclick="selectCity(${r.lat}, ${r.lon}, '${escapeHtml(r.display_name)}')">
                        📍 ${escapeHtml(r.display_name)}
                    </div>
                `).join('');
            }
            resultsDiv.style.display = 'block';
        } catch (err) {
            console.error('Search error:', err);
        }
    }, 500);
});

window.selectCity = async (lat, lng, displayName) => {
    document.getElementById('cityResults').style.display = 'none';
    document.getElementById('citySearch').value = displayName.split(',')[0];
    map.setView([lat, lng], 10);
    const event = { latlng: L.latLng(lat, lng) };
    map.fire('click', event);
};

function updateMapMarker(lat, lng) {
    const position = [parseFloat(lat), parseFloat(lng)];
    map.setView(position, 10);

    if (marker) map.removeLayer(marker);
    if (circle) map.removeLayer(circle);

    marker = L.marker(position, {
        draggable: true,
        title: 'City Centre - Drag to adjust'
    }).addTo(map);

    circle = L.circle(position, {
        radius: currentRadius * 1000,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        weight: 2
    }).addTo(map);

    marker.on('dragend', async (e) => {
        const newPos = e.target.getLatLng();
        document.getElementById('centerLat').value = newPos.lat.toFixed(6);
        document.getElementById('centerLng').value = newPos.lng.toFixed(6);
        document.getElementById('mapCenterText').textContent = `${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)}`;
        circle.setLatLng(newPos);
    });
}

window.editArea = (id) => {
    const a = allAreas.find(x => x._id === id);
    document.getElementById('areaId').value = id;
    document.getElementById('areaModalTitle').textContent = 'Edit Area';
    document.getElementById('areaCode').value = a.areaCode;
    document.getElementById('areaCode').readOnly = true;
    document.getElementById('areaName').value = a.areaName;
    document.getElementById('cityName').value = a.city;
    document.getElementById('stateName').value = a.state;
    document.getElementById('centerLat').value = a.centerLat;
    document.getElementById('centerLng').value = a.centerLng;
    document.getElementById('areaRadius').value = a.radius || 50;
    currentRadius = a.radius || 50;
    document.getElementById('radiusDisplay').textContent = `${currentRadius} km`;
    document.getElementById('areaStatus').value = a.status;
    document.getElementById('mapCenterText').textContent = `${a.centerLat.toFixed(4)}, ${a.centerLng.toFixed(4)}`;
    document.getElementById('areaModal').style.display = 'flex';
    setTimeout(() => {
        initMap();
        updateMapMarker(a.centerLat, a.centerLng);
        setTimeout(() => map.invalidateSize(), 100);
    }, 300);
};

document.getElementById('areaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('areaId').value;
    const formData = {
        areaCode: document.getElementById('areaCode').value.toUpperCase(),
        areaName: document.getElementById('areaName').value,
        city: document.getElementById('cityName').value,
        state: document.getElementById('stateName').value,
        centerLat: parseFloat(document.getElementById('centerLat').value),
        centerLng: parseFloat(document.getElementById('centerLng').value),
        radius: parseInt(document.getElementById('areaRadius').value) || 50,
        status: document.getElementById('areaStatus').value === 'true'
    };

    if (!formData.centerLat ||!formData.centerLng) {
        return showToast('Please click on map to set location!', 'error');
    }

    if (!formData.areaCode) {
        return showToast('Area Code is required!', 'error');
    }

    if (formData.radius < 1 || formData.radius > 500) {
        return showToast('Radius must be between 1 and 500 km!', 'error');
    }

    try {
        if (id) {
            await apiCall('/areas/' + id, 'PUT', formData);
            showToast('Area updated successfully!');
        } else {
            await apiCall('/areas', 'POST', formData);
            showToast('Area created successfully!');
        }
        closeAreaModal();
        await loadAreas();
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
});

window.deleteArea = async (id, managerCount, moduleCount) => {
    if (managerCount > 0) {
        return showToast(`Cannot delete! ${managerCount} managers exist in this area. Delete them first.`, 'error');
    }
    if (moduleCount > 0) {
        return showToast(`Cannot delete! ${moduleCount} modules are live in this area. Remove from modules first.`, 'error');
    }
    if (!confirm('Delete this area? This cannot be undone.')) return;
    try {
        await apiCall('/areas/' + id, 'DELETE');
        showToast('Area deleted');
        await loadAreas();
    } catch (err) {
        showToast('Failed to delete: ' + err.message, 'error');
    }
};

window.closeAreaModal = () => {
    document.getElementById('areaModal').style.display = 'none';
    document.getElementById('areaCode').readOnly = false;
    document.getElementById('cityResults').style.display = 'none';
};

document.addEventListener('click', (e) => {
    if (!e.target.closest('.form-group')) {
        document.getElementById('cityResults').style.display = 'none';
    }
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

loadAreas();