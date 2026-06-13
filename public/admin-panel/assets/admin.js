// ==================== GLOBAL CONFIG ====================
const API_BASE = '/api'; // Tera backend URL. Render pe ye hi rahega

// ==================== GLOBAL STATE ====================
let allStats = {};
let allModules = [];
let allShops = [];
let allManagers = [];
let allContent = [];
let pendingShops = [];
let allCategories = [];
let selectedModuleIds = [];
let areaChart, statusChart;
let moduleMap, shopMap, drawnItems, drawControl;
let currentModuleId = null, currentDrawnLayer = null;
let shopMarker, shopCircle, currentShopLocation = null;
let currentSettings = {};
let marketStats = { totalCategories: 0 };

// ==================== UTILITY FUNCTIONS ====================

/**
 * API Call karne ka main function
 */
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {}
        };

        if (data) {
            if (data instanceof FormData) {
                // FormData ke liye Content-Type browser khud set karega
                options.body = data;
            } else {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(data);
            }
        }

        const response = await fetch(API_BASE + endpoint, options);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        }

        // Agar response empty hai to
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        return { success: true };

    } catch (err) {
        console.error('API Error:', err);
        showToast(err.message || 'Something went wrong', 'error');
        throw err;
    }
}

/**
 * Toast notification dikhane ke liye
 */
function showToast(message, type = 'success') {
    // Purana toast hatao
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 14px 20px;
        background: ${type === 'error'? '#ef4444' : type === 'warning'? '#f59e0b' : '#10b981'};
        color: white;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
        max-width: 350px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * HTML escape karne ke liye - XSS se bachne ke liye
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Table me loading dikhane ke liye
 */
function showLoading(tableId) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (tbody) {
        const colCount = tbody.closest('table').querySelectorAll('thead th').length;
        tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center;padding:40px;color:#64748b;">Loading...</td></tr>`;
    }
}

/**
 * Table search/filter karne ke liye
 */
function filterTable(tableId, query) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    const searchTerm = query.toLowerCase().trim();

    rows.forEach(row => {
        // Agar "No data" wala row hai to skip karo
        if (row.cells.length === 1 && row.cells[0].colSpan > 1) return;

        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm)? '' : 'none';
    });
}

/**
 * Clipboard me copy karne ke liye
 */
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!');
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const input = document.createElement('input');
    input.value = text;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    try {
        document.execCommand('copy');
        showToast('Copied to clipboard!');
    } catch (err) {
        showToast('Failed to copy', 'error');
    }
    document.body.removeChild(input);
}

/**
 * Date format karne ke liye
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Number format karne ke liye
 */
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

/**
 * Debounce function - search ke liye
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==================== TAB SYSTEM ====================
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');

    // Load data for tab
    if (tabName === 'dashboard') loadDashboard();
    if (tabName === 'modules') loadModules();
    if (tabName === 'shops') loadShops();
    if (tabName === 'managers') loadManagers();
    if (tabName === 'content') loadContent();
    if (tabName === 'settings') loadSettings();
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
    try {
        const [stats, shops, marketData] = await Promise.all([
            apiCall('/stats'),
            apiCall('/shops'),
            apiCall('/admin/local-market-stats').catch(() => ({ totalCategories: 0 }))
        ]);

        allStats = stats;
        marketStats = marketData;

        document.getElementById('totalUsersCount').textContent = formatNumber(stats.users || 0);
        document.getElementById('totalShopsCount').textContent = formatNumber(stats.shops || 0);
        document.getElementById('totalModulesCount').textContent = formatNumber(stats.modules || 0);
        document.getElementById('totalContentCount').textContent = formatNumber(stats.content || 0);
        document.getElementById('totalManagersCount').textContent = formatNumber(stats.managers || 0);
        document.getElementById('pendingShopsCount').textContent = formatNumber(shops.filter(s => s.status === 'pending').length);

        // Categories count add karo agar element exist karta hai
        const catCountEl = document.getElementById('totalCategoriesCount');
        if (catCountEl) catCountEl.textContent = formatNumber(marketStats.totalCategories || 0);

        renderCharts(shops);
    } catch (err) {
        console.error('Dashboard Error:', err);
    }
}

function renderCharts(shops) {
    const areaCounts = {};
    shops.forEach(s => {
        if (s.area) areaCounts[s.area] = (areaCounts[s.area] || 0) + 1;
    });
    if (areaChart) areaChart.destroy();
    if (Object.keys(areaCounts).length > 0) {
        areaChart = new Chart(document.getElementById('areaChart'), {
            type: 'bar',
            data: {
                labels: Object.keys(areaCounts),
                datasets: [{
                    label: 'Shops',
                    data: Object.values(areaCounts),
                    backgroundColor: '#3b82f6',
                    borderRadius: 6
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }
    const statusCounts = { active: 0, pending: 0, hidden: 0 };
    shops.forEach(s => {
        if (statusCounts[s.status]!== undefined) statusCounts[s.status]++;
    });
    if (statusChart) statusChart.destroy();
    statusChart = new Chart(document.getElementById('statusChart'), {
        type: 'doughnut',
        data: {
            labels: ['Active', 'Pending', 'Hidden'],
            datasets: [{
                data: [statusCounts.active, statusCounts.pending, statusCounts.hidden],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// ==================== MODULES ====================
async function loadModules() {
    showLoading('modulesTable');
    try {
        const result = await apiCall('/modules');
        allModules = Array.isArray(result)? result : [];
        document.getElementById('moduleCount').textContent = allModules.length;
        renderModules();
        populateModuleDropdown();
        initModuleMap();
    } catch (err) {
        document.querySelector('#modulesTable tbody').innerHTML = `<tr><td colspan="10" style="text-align:center;color:#ef4444;padding:40px;">Error: ${escapeHtml(err.message)}</td></tr>`;
    }
}

function renderModules() {
    const tbody = document.querySelector('#modulesTable tbody');
    if (allModules.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#6b7280;padding:40px;">No modules found. Click "Add New Module" to create one.</td></tr>';
        return;
    }

    tbody.innerHTML = allModules.map(m => {
        const moduleStatus = m.status === true || m.status === 'active'? 'active' : 'hidden';
        const moduleId = m.id || m._id;
        const categoriesText = m.categories && m.categories.length > 0? m.categories.slice(0,2).join(', ') + (m.categories.length > 2? '...' : '') : '-';

        return `
        <tr class="module-row" onclick="toggleModuleAreas('${moduleId}')">
            <td><span class="expand-icon" id="icon-${moduleId}">▶</span></td>
            <td class="module-icon">${m.icon || '📦'}</td>
            <td><b>${escapeHtml(m.name)}</b></td>
            <td><span class="color-badge" style="background:${m.color}">${escapeHtml(m.color)}</span></td>
            <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(m.link)}</td>
            <td><span class="badge badge-info">${m.areas?.length || 0} areas</span></td>
            <td style="font-size:12px;">${escapeHtml(categoriesText)}</td>
            <td>${m.priority || 0}</td>
            <td><span class="status-badge status-${moduleStatus}">${moduleStatus}</span></td>
            <td onclick="event.stopPropagation()" class="actions">
                <button class="btn-primary btn-sm" onclick="editModule('${moduleId}')">Edit</button>
                <button class="btn-danger btn-sm" onclick="deleteModule('${moduleId}')">Delete</button>
            </td>
        </tr>
        <tr id="areas-${moduleId}" style="display:none;">
            <td colspan="10">
                <div class="area-expand">
                    <h4>📍 Areas for ${escapeHtml(m.name)}</h4>
                    ${renderModuleAreas(m)}
                    <h4 style="margin-top:16px;">📂 Categories</h4>
                    ${renderModuleCategories(m)}
                </div>
            </td>
        </tr>
    `}).join('');
}

function renderModuleAreas(module) {
    if (!module.areas || module.areas.length === 0) {
        return '<p style="color:#6b7280;margin:0;">No areas mapped yet. Use the map below to add one.</p>';
    }
    const moduleId = module.id || module._id;
    return module.areas.map((area, idx) => `
        <div class="area-row">
            <div>
                <strong>Area ${idx + 1}:</strong> ${area.type === 'circle'? `Circle - Radius: ${Math.round(area.radius)}m` : `Polygon - ${area.coordinates?.length || 0} points`}
            </div>
            <button class="btn-danger btn-sm" onclick="removeArea('${moduleId}', ${idx})">Remove</button>
        </div>
    `).join('');
}

function renderModuleCategories(module) {
    if (!module.categories || module.categories.length === 0) {
        return '<p style="color:#6b7280;margin:0;">No categories added yet.</p>';
    }
    return `<div style="display:flex;flex-wrap:wrap;gap:8px;">${module.categories.map(cat => `<span class="badge badge-info">${escapeHtml(cat)}</span>`).join('')}</div>`;
}

window.toggleModuleAreas = (id) => {
    const row = document.getElementById(`areas-${id}`);
    const icon = document.getElementById(`icon-${id}`);
    if (!row ||!icon) return;
    if (row.style.display === 'none') {
        row.style.display = '';
        icon.classList.add('open');
    } else {
        row.style.display = 'none';
        icon.classList.remove('open');
    }
};

function populateModuleDropdown() {
    const select = document.getElementById('moduleSelectArea');
    if (!select) return;
    select.innerHTML = '<option value="">-- Select Module --</option>' +
        allModules.map(m => `<option value="${m.id || m._id}">${m.icon} ${escapeHtml(m.name)}</option>`).join('');
}

window.openAddModule = () => {
    document.getElementById('moduleEditId').value = '';
    document.getElementById('moduleModalTitle').textContent = 'Add New Module';
    document.getElementById('moduleModalFields').innerHTML = `
        <div class="form-grid">
            <div class="form-group"><label>Name *</label><input type="text" id="field_name" required></div>
            <div class="form-group"><label>Icon *</label><input type="text" id="field_icon" placeholder="📦" required></div>
            <div class="form-group"><label>Color *</label><input type="color" id="field_color" value="#3b82f6" required></div>
            <div class="form-group"><label>Link *</label><input type="text" id="field_link" placeholder="/module-name" required></div>
            <div class="form-group"><label>Priority</label><input type="number" id="field_priority" value="0" min="0"></div>
            <div class="form-group"><label>Status</label><select id="field_status"><option value="active">Active</option><option value="hidden">Hidden</option></select></div>
            <div class="form-group full">
                <label>Categories (comma separated)</label>
                <input type="text" id="field_categories" placeholder="Fruits, Vegetables, Dairy">
                <p class="help-text">Ye categories user app me dikhengi</p>
            </div>
        </div>
    `;
    document.getElementById('moduleModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
};

window.editModule = (id) => {
    const m = allModules.find(x => x.id === id || x._id === id);
    if (!m) return;
    document.getElementById('moduleEditId').value = id;
    document.getElementById('moduleModalTitle').textContent = 'Edit Module';
    document.getElementById('moduleModalFields').innerHTML = `
        <div class="form-grid">
            <div class="form-group"><label>Name *</label><input type="text" id="field_name" value="${escapeHtml(m.name)}" required></div>
            <div class="form-group"><label>Icon *</label><input type="text" id="field_icon" value="${escapeHtml(m.icon)}" required></div>
            <div class="form-group"><label>Color *</label><input type="color" id="field_color" value="${m.color || '#3b82f6'}" required></div>
            <div class="form-group"><label>Link *</label><input type="text" id="field_link" value="${escapeHtml(m.link)}" required></div>
            <div class="form-group"><label>Priority</label><input type="number" id="field_priority" value="${m.priority || 0}" min="0"></div>
            <div class="form-group"><label>Status</label><select id="field_status"><option value="active" ${m.status === 'active' || m.status === true? 'selected' : ''}>Active</option><option value="hidden" ${m.status === 'hidden' || m.status === false? 'selected' : ''}>Hidden</option></select></div>
            <div class="form-group full">
                <label>Categories (comma separated)</label>
                <input type="text" id="field_categories" value="${(m.categories || []).join(', ')}" placeholder="Fruits, Vegetables, Dairy">
            </div>
        </div>
    `;
    document.getElementById('moduleModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
};

window.saveModule = async () => {
    const btn = document.getElementById('saveModuleBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    const id = document.getElementById('moduleEditId').value;
    const categories = document.getElementById('field_categories').value.split(',').map(c => c.trim()).filter(c => c);

    const data = {
        name: document.getElementById('field_name').value.trim(),
        icon: document.getElementById('field_icon').value.trim(),
        color: document.getElementById('field_color').value,
        link: document.getElementById('field_link').value.trim(),
        priority: parseInt(document.getElementById('field_priority').value || 0),
        status: document.getElementById('field_status').value,
        categories: categories
    };

    if (!data.name ||!data.icon ||!data.link) {
        showToast('Name, Icon and Link are required', 'error');
        btn.disabled = false;
        btn.textContent = '💾 Save Changes';
        return;
    }

    try {
        if (id) {
            await apiCall('/modules/' + id, 'PUT', data);
            showToast('Module updated successfully');
        } else {
            await apiCall('/modules', 'POST', data);
            showToast('Module created successfully');
        }
        closeModuleModal();
        await loadModules();
        await loadDashboard(); // Refresh dashboard stats
    } catch (err) {} finally {
        btn.disabled = false;
        btn.textContent = '💾 Save Changes';
    }
};

window.deleteModule = async (id) => {
    if (!confirm('Delete this module? This will affect all linked shops and content.')) return;
    try {
        await apiCall('/modules/' + id, 'DELETE');
        showToast('Module deleted');
        await loadModules();
        await loadDashboard();
    } catch (err) {}
};

window.removeArea = async (moduleId, areaIdx) => {
    if (!confirm('Remove this area?')) return;
    try {
        const module = allModules.find(m => m.id === moduleId || m._id === moduleId);
        module.areas.splice(areaIdx, 1);
        await apiCall('/modules/' + moduleId, 'PUT', { areas: module.areas });
        showToast('Area removed');
        await loadModules();
    } catch (err) {}
};

function initModuleMap() {
    if (moduleMap ||!document.getElementById('moduleMap')) return;
    moduleMap = L.map('moduleMap').setView([28.6139, 77.2090], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(moduleMap);
    drawnItems = new L.FeatureGroup();
    moduleMap.addLayer(drawnItems);
    drawControl = new L.Control.Draw({
        draw: { polygon: true, circle: true, rectangle: false, polyline: false, marker: false, circlemarker: false },
        edit: { featureGroup: drawnItems }
    });
    moduleMap.addControl(drawControl);
    moduleMap.on(L.Draw.Event.CREATED, (e) => {
        drawnItems.clearLayers();
        currentDrawnLayer = e.layer;
        drawnItems.addLayer(currentDrawnLayer);
        showAreaInfo(e.layer);
    });
    setTimeout(() => moduleMap.invalidateSize(), 200);
}

function showAreaInfo(layer) {
    const info = document.getElementById('areaInfo');
    const details = document.getElementById('areaDetails');
    if (!info ||!details) return;
    info.style.display = 'block';
    if (layer instanceof L.Circle) {
        details.textContent = `Circle - Radius: ${Math.round(layer.getRadius())}m`;
    } else if (layer instanceof L.Polygon) {
        details.textContent = `Polygon - ${layer.getLatLngs()[0].length} points`;
    }
}

window.loadModuleArea = () => {
    const moduleId = document.getElementById('moduleSelectArea').value;
    currentModuleId = moduleId;
    drawnItems.clearLayers();
    currentDrawnLayer = null;
    const info = document.getElementById('areaInfo');
    if (info) info.style.display = 'none';
    if (!moduleId) return;
    const module = allModules.find(m => m.id === moduleId || m._id === moduleId);
    if (module.areas && module.areas.length > 0) {
        const area = module.areas[0];
        if (area.type === 'circle') {
            currentDrawnLayer = L.circle([area.center.lat, area.center.lng], { radius: area.radius });
            moduleMap.setView([area.center.lat, area.center.lng], 13);
        } else if (area.type === 'polygon') {
            currentDrawnLayer = L.polygon(area.coordinates);
            moduleMap.fitBounds(currentDrawnLayer.getBounds());
        }
        drawnItems.addLayer(currentDrawnLayer);
        showAreaInfo(currentDrawnLayer);
    }
};

window.saveModuleArea = async () => {
    const btn = document.getElementById('saveAreaBtn');
    if (!currentModuleId) return showToast('Select module first', 'error');
    if (!currentDrawnLayer) return showToast('Draw area first', 'error');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    let areaData = {};
    if (currentDrawnLayer instanceof L.Circle) {
        const center = currentDrawnLayer.getLatLng();
        areaData = { type: 'circle', center: { lat: center.lat, lng: center.lng }, radius: currentDrawnLayer.getRadius() };
    } else if (currentDrawnLayer instanceof L.Polygon) {
        areaData = { type: 'polygon', coordinates: currentDrawnLayer.getLatLngs()[0].map(p => ({ lat: p.lat, lng: p.lng })) };
    }
    try {
        await apiCall('/modules/' + currentModuleId, 'PUT', { areas: [areaData] });
        showToast('Area saved successfully');
        await loadModules();
    } catch (err) {} finally {
        btn.disabled = false;
        btn.textContent = '💾 Save Area';
    }
};

window.clearModuleDrawing = () => {
    drawnItems.clearLayers();
    currentDrawnLayer = null;
    const info = document.getElementById('areaInfo');
    if (info) info.style.display = 'none';
};

window.deleteModuleArea = async () => {
    if (!currentModuleId) return showToast('Select module first', 'error');
    if (!confirm('Remove all areas from this module?')) return;
    try {
        await apiCall('/modules/' + currentModuleId, 'PUT', { areas: [] });
        showToast('Areas removed');
        clearModuleDrawing();
        await loadModules();
    } catch (err) {}
};

window.closeModuleModal = () => {
    document.getElementById('moduleModal').style.display = 'none';
    document.body.style.overflow = 'auto';
};

// ==================== SHOPS ====================
async function loadShops() {
    try {
        [allShops, allModules, allManagers] = await Promise.all([
            apiCall('/shops'),
            apiCall('/modules'),
            apiCall('/managers')
        ]);
        renderShops();
        renderPendingShops();
        populateShopDropdowns();
        initShopMap();
    } catch (err) {
        console.error('Load shops error:', err);
    }
}

function renderShops() {
    const shops = allShops.filter(s => s.status!== 'pending');
    const tbody = document.querySelector('#shopsTable tbody');
    const countEl = document.getElementById('activeShopsCount');
    if (countEl) countEl.textContent = shops.length;

    if (shops.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#6b7280;padding:40px;">No active shops found</td></tr>';
        return;
    }

    tbody.innerHTML = shops.map(s => {
        const module = allModules.find(m => m._id === s.moduleId || m.id === s.moduleId);
        const manager = allManagers.find(m => m._id === s.managerId);
        return `
            <tr>
                <td><img src="${s.logo || s.image || '/assets/logo.png'}" class="shop-logo" onerror="this.src='/assets/logo.png'"></td>
                <td><b>${escapeHtml(s.name)}</b></td>
                <td>${module? module.icon + ' ' + escapeHtml(module.name) : '-'}</td>
                <td>${manager? escapeHtml(manager.name) : '<span class="help-text">Unassigned</span>'}</td>
                <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(s.address || '-')}</td>
                <td>${s.range || 0}m</td>
                <td>${s.priority || 0}</td>
                <td><span class="status-badge status-${s.status}">${s.status}</span></td>
                <td class="actions">
                    <button class="btn-primary btn-sm" onclick="editShop('${s._id}')">Edit</button>
                    <button class="btn-danger btn-sm" onclick="deleteShop('${s._id}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPendingShops() {
    const pending = allShops.filter(s => s.status === 'pending');
    const tbody = document.querySelector('#pendingShopsTable tbody');
    const countEl = document.getElementById('pendingShopsCountTab');
    if (countEl) countEl.textContent = pending.length;

    if (pending.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#6b7280;padding:40px;">No pending shops</td></tr>';
        return;
    }

    tbody.innerHTML = pending.map(s => {
        const module = allModules.find(m => m._id === s.moduleId || m.id === s.moduleId);
        return `
            <tr>
                <td>${escapeHtml(s.createdBy?.name || s.createdBy || 'User')}</td>
                <td><b>${escapeHtml(s.name)}</b></td>
                <td>${module? module.icon + ' ' + escapeHtml(module.name) : '-'}</td>
                <td>${escapeHtml(s.phone || '-')}</td>
                <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(s.address || '-')}</td>
                <td>${escapeHtml(s.area || '-')}</td>
                <td class="actions">
                    <button class="btn-success btn-sm" onclick="approveShop('${s._id}')">✅ Approve</button>
                    <button class="btn-danger btn-sm" onclick="rejectShop('${s._id}')">❌ Reject</button>
                </td>
            </tr>
        `;
    }).join('');
}

function populateShopDropdowns() {
    const shopSelect = document.getElementById('shopSelectLocation');
    if (shopSelect) {
        shopSelect.innerHTML = '<option value="">-- Select Shop --</option>' +
            allShops.filter(s => s.status!== 'pending').map(s => `<option value="${s._id}">${escapeHtml(s.name)}</option>`).join('');
    }

    const moduleSelect = document.getElementById('shopModuleLink');
    if (moduleSelect) {
        moduleSelect.innerHTML = '<option value="">-- Select Module --</option>' +
            allModules.map(m => `<option value="${m._id || m.id}">${m.icon} ${escapeHtml(m.name)}</option>`).join('');
    }
}

window.editShop = (id) => {
    const s = allShops.find(x => x._id === id);
    if (!s) return;
    document.getElementById('shopEditId').value = id;
    document.getElementById('shopModalTitle').textContent = 'Edit Shop';
    document.getElementById('shopModalFields').innerHTML = `
        <div class="form-grid">
            <div class="form-group"><label>Shop Name *</label><input type="text" id="field_shop_name" value="${escapeHtml(s.name)}" required></div>
            <div class="form-group">
                <label>Module *</label>
                <select id="field_shop_moduleId" required>
                    <option value="">-- Select Module --</option>
                    ${allModules.map(m => `<option value="${m._id || m.id}" ${s.moduleId === (m._id || m.id)? 'selected' : ''}>${m.icon} ${escapeHtml(m.name)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Manager</label>
                <select id="field_shop_managerId">
                    <option value="">-- Unassigned --</option>
                    ${allManagers.map(m => `<option value="${m._id}" ${s.managerId === m._id? 'selected' : ''}>${escapeHtml(m.name)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group"><label>Phone</label><input type="text" id="field_shop_phone" value="${escapeHtml(s.phone || '')}" pattern="[0-9]{10}"></div>
            <div class="form-group"><label>Range (meters)</label><input type="number" id="field_shop_range" value="${s.range || 5000}" min="100" max="50000"></div>
            <div class="form-group"><label>Priority</label><input type="number" id="field_shop_priority" value="${s.priority || 0}" min="0"></div>
            <div class="form-group full"><label>Address</label><input type="text" id="field_shop_address" value="${escapeHtml(s.address || '')}"></div>
            <div class="form-group"><label>Status</label><select id="field_shop_status"><option value="active" ${s.status === 'active'? 'selected' : ''}>Active</option><option value="hidden" ${s.status === 'hidden'? 'selected' : ''}>Hidden</option></select></div>
        </div>
    `;
    document.getElementById('shopModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
};

window.saveShop = async () => {
    const btn = document.getElementById('saveShopBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    const id = document.getElementById('shopEditId').value;

    const data = {
        name: document.getElementById('field_shop_name').value.trim(),
        moduleId: document.getElementById('field_shop_moduleId').value,
        managerId: document.getElementById('field_shop_managerId').value || null,
        phone: document.getElementById('field_shop_phone').value.trim(),
        range: parseInt(document.getElementById('field_shop_range').value || 5000),
        priority: parseInt(document.getElementById('field_shop_priority').value || 0),
        address: document.getElementById('field_shop_address').value.trim(),
        status: document.getElementById('field_shop_status').value
    };

    if (!data.name ||!data.moduleId) {
        showToast('Name and Module are required', 'error');
        btn.disabled = false;
        btn.textContent = '💾 Save Changes';
        return;
    }

    try {
        await apiCall('/shops/' + id, 'PUT', data);
        showToast('Shop updated successfully');
        closeShopModal();
        await loadShops();
    } catch (err) {} finally {
        btn.disabled = false;
        btn.textContent = '💾 Save Changes';
    }
};

window.deleteShop = async (id) => {
    if (!confirm('Delete this shop? This action cannot be undone.')) return;
    try {
        await apiCall('/shops/' + id, 'DELETE');
        showToast('Shop deleted');
        await loadShops();
    } catch (err) {}
};

window.approveShop = async (id) => {
    if (!confirm('Approve this shop? It will become active.')) return;
    try {
        await apiCall('/shops/' + id, 'PUT', { status: 'active' });
        showToast('Shop approved successfully');
        await loadShops();
    } catch (err) {}
};

window.rejectShop = async (id) => {
    if (!confirm('Reject this shop? It will be deleted permanently.')) return;
    try {
        await apiCall('/shops/' + id, 'DELETE');
        showToast('Shop rejected');
        await loadShops();
    } catch (err) {}
};

function initShopMap() {
    if (shopMap ||!document.getElementById('shopMap')) return;
    shopMap = L.map('shopMap').setView([28.6139, 77.2090], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(shopMap);

    shopMap.on('click', (e) => {
        if (shopMarker) shopMap.removeLayer(shopMarker);
        if (shopCircle) shopMap.removeLayer(shopCircle);
        currentShopLocation = e.latlng;
        shopMarker = L.marker(e.latlng).addTo(shopMap);
        const range = parseInt(document.getElementById('shopRange').value || 5000);
        shopCircle = L.circle(e.latlng, { radius: range, color: '#3b82f6', fillOpacity: 0.1 }).addTo(shopMap);
        const info = document.getElementById('shopLocationInfo');
        const details = document.getElementById('shopLocationDetails');
        if (info && details) {
            info.style.display = 'block';
            details.textContent = `Lat: ${e.latlng.lat.toFixed(6)}, Lng: ${e.latlng.lng.toFixed(6)} | Range: ${range}m`;
        }
    });
    setTimeout(() => shopMap.invalidateSize(), 200);
}

window.loadShopLocation = () => {
    const shopId = document.getElementById('shopSelectLocation').value;
    if (!shopId) return;
    const shop = allShops.find(s => s._id === shopId);
    if (!shop) return;
    document.getElementById('shopName').value = shop.name || '';
    document.getElementById('shopPhone').value = shop.phone || '';
    document.getElementById('shopRange').value = shop.range || 5000;
    document.getElementById('shopAddress').value = shop.address || '';
    document.getElementById('shopModuleLink').value = shop.moduleId || '';
    if (shop.location && shop.location.lat && shop.location.lng) {
        if (shopMarker) shopMap.removeLayer(shopMarker);
        if (shopCircle) shopMap.removeLayer(shopCircle);
        currentShopLocation = shop.location;
        shopMarker = L.marker(shop.location).addTo(shopMap);
        shopCircle = L.circle(shop.location, { radius: shop.range || 5000, color: '#3b82f6', fillOpacity: 0.1 }).addTo(shopMap);
        shopMap.setView(shop.location, 14);
        document.getElementById('shopLocationInfo').style.display = 'block';
        document.getElementById('shopLocationDetails').textContent = `Lat: ${shop.location.lat.toFixed(6)}, Lng: ${shop.location.lng.toFixed(6)} | Range: ${shop.range}m`;
    }
};

window.saveShopLocation = async () => {
    const btn = document.getElementById('saveLocationBtn');
    const shopId = document.getElementById('shopSelectLocation').value;
    if (!shopId) return showToast('Please select a shop first', 'error');
    if (!currentShopLocation) return showToast('Please click on map to set location', 'error');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const data = {
        name: document.getElementById('shopName').value.trim(),
        phone: document.getElementById('shopPhone').value.trim(),
        range: parseInt(document.getElementById('shopRange').value || 5000),
        address: document.getElementById('shopAddress').value.trim(),
        moduleId: document.getElementById('shopModuleLink').value,
        location: { lat: currentShopLocation.lat, lng: currentShopLocation.lng }
    };

    if (data.phone &&!/^[0-9]{10}$/.test(data.phone)) {
        showToast('Phone must be 10 digits', 'error');
        btn.disabled = false;
        btn.textContent = '💾 Save Shop Location';
        return;
    }

    try {
        await apiCall('/shops/' + shopId, 'PUT', data);
        showToast('Shop location saved successfully');
        await loadShops();
    } catch (err) {} finally {
        btn.disabled = false;
        btn.textContent = '💾 Save Shop Location';
    }
};

window.clearShopMarker = () => {
    if (shopMarker) shopMap.removeLayer(shopMarker);
    if (shopCircle) shopMap.removeLayer(shopCircle);
    currentShopLocation = null;
    shopMarker = null;
    shopCircle = null;
    document.getElementById('shopLocationInfo').style.display = 'none';
};

window.closeShopModal = () => {
    document.getElementById('shopModal').style.display = 'none';
    document.body.style.overflow = 'auto';
};

// ==================== MANAGERS ====================
async function loadManagers() {
    const btn = document.getElementById('refreshBannerBtn');
    if (btn) btn.disabled = true;
    try {
        const [managersData, categoriesData] = await Promise.all([
            apiCall('/managers'),
            apiCall('/admin/data')
        ]);
        allManagers = Array.isArray(managersData)? managersData : [];
        allCategories = categoriesData.modules || [];

        try {
            const bannerData = await apiCall('/admin/pending-banners');
            pendingShops = bannerData.shops || [];
        } catch(e) {
            pendingShops = [];
        }

        renderManagers();
        renderBanners();
        renderModuleCheckboxes();

        document.getElementById('totalManagers').textContent = allManagers.length;
        document.getElementById('activeManagers').textContent = allManagers.filter(m => m.status).length;
        document.getElementById('pendingBanners').textContent = pendingShops.length;

        const filterSelect = document.getElementById('historyManagerFilter');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">All Managers</option>' + allManagers.map(m =>
                `<option value="${m._id}">${escapeHtml(m.name)} - ${escapeHtml(m.area)}</option>`
            ).join('');
        }
    } catch (err) {
        console.error('Load managers error:', err);
        document.getElementById('managersTable').innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 40px; color:#ef4444;">Failed to load data</td></tr>';
    } finally {
        if (btn) btn.disabled = false;
    }
}

function renderManagers() {
    const tbody = document.getElementById('managersTable');
    if (!tbody) return;
    if (allManagers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 40px;">No managers found</td></tr>';
        return;
    }

    tbody.innerHTML = allManagers.map(m => `
        <tr>
            <td><img src="${m.documents?.photo || '/assets/avatar.png'}" class="manager-photo" onerror="this.src='/assets/avatar.png'"></td>
            <td><b>${escapeHtml(m.name)}</b></td>
            <td>${escapeHtml(m.area)}</td>
            <td>${m.moduleAccess?.length || 0} modules</td>
            <td>${escapeHtml(m.email)}</td>
            <td>${escapeHtml(m.phone)}</td>
            <td>${m.serviceCharge}%</td>
            <td><span class="status-badge status-${m.status?'active':'inactive'}">${m.status?'Active':'Inactive'}</span></td>
            <td><button class="btn-secondary btn-sm" onclick="copyToClipboard('${window.location.origin}/area-manager.html?token=${m.loginToken}')">Copy</button></td>
            <td class="actions">
                <button class="btn-primary btn-sm" onclick="editManager('${m._id}')">Edit</button>
                <button class="btn-danger btn-sm" onclick="deleteManager('${m._id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function renderBanners() {
    const tbody = document.getElementById('bannerTable');
    if (!tbody) return;
    if (pendingShops.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px;">No pending banners</td></tr>';
        return;
    }

    tbody.innerHTML = pendingShops.map(s => `
        <tr>
            <td>${escapeHtml(s.name)}</td>
            <td>${escapeHtml(s.managerId?.name || '-')}</td>
            <td>${escapeHtml(s.area || '-')}</td>
            <td><img src="${s.banner}" class="banner-thumb" onclick="previewBanner('${s.banner}')"></td>
            <td><span class="status-badge status-pending">Pending</span></td>
            <td>${formatDate(s.updatedAt)}</td>
            <td class="actions">
                <button class="btn-success btn-sm" onclick="approveBanner('${s._id}')">✅ Approve</button>
                <button class="btn-danger btn-sm" onclick="rejectBanner('${s._id}')">❌ Reject</button>
            </td>
        </tr>
    `).join('');
}

function renderModuleCheckboxes() {
    const box = document.getElementById('moduleSelectBox');
    if (!box) return;
    if (allCategories.length === 0) {
        box.innerHTML = '<div style="text-align:center; color:#64748b; padding:10px;">No modules available</div>';
        return;
    }
    box.innerHTML = allCategories.map(m => `
        <div class="module-checkbox">
            <input type="checkbox" id="mod_${m.id}" value="${m.id}" onchange="toggleModule('${m.id}', '${escapeHtml(m.name)}')">
            <label for="mod_${m.id}">${m.icon} ${escapeHtml(m.name)}</label>
        </div>
    `).join('');
}

window.toggleModule = (id, name) => {
    const idx = selectedModuleIds.indexOf(id);
    if (idx > -1) {
        selectedModuleIds.splice(idx, 1);
    } else {
        selectedModuleIds.push(id);
    }
    renderSelectedModules();
};

function renderSelectedModules() {
    const box = document.getElementById('selectedModules');
    if (!box) return;
    box.innerHTML = selectedModuleIds.map(id => {
        const mod = allCategories.find(m => m.id === id);
        return `<div class="module-tag">${mod.icon} ${escapeHtml(mod.name)} <span onclick="toggleModule('${id}')">×</span></div>`;
    }).join('');
}

window.filterModules = () => {
    const query = document.getElementById('moduleSearch').value.toLowerCase();
    const checkboxes = document.querySelectorAll('.module-checkbox');
    checkboxes.forEach(cb => {
        const text = cb.textContent.toLowerCase();
        cb.style.display = text.includes(query)? '' : 'none';
    });
};

window.openAddManager = () => {
    document.getElementById('managerId').value = '';
    document.getElementById('managerModalTitle').textContent = 'Add New Area Manager';
    document.getElementById('managerForm').reset();
    selectedModuleIds = [];
    renderSelectedModules();
    document.getElementById('loginLinkBox').style.display = 'none';
    document.getElementById('managerModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
};

window.editManager = (id) => {
    const m = allManagers.find(x => x._id === id);
    if (!m) return;
    document.getElementById('managerId').value = id;
    document.getElementById('managerModalTitle').textContent = 'Edit Area Manager';
    document.getElementById('managerName').value = m.name;
    document.getElementById('managerArea').value = m.area;
    document.getElementById('managerEmail').value = m.email;
    document.getElementById('managerPhone').value = m.phone;
    document.getElementById('managerServiceCharge').value = m.serviceCharge;
    document.getElementById('managerStatus').value = m.status;
    selectedModuleIds = m.moduleAccess || [];
    renderSelectedModules();

    // Check boxes
    setTimeout(() => {
        selectedModuleIds.forEach(id => {
            const cb = document.getElementById('mod_' + id);
            if (cb) cb.checked = true;
        });
    }, 100);

    document.getElementById('loginLinkBox').style.display = 'none';
    document.getElementById('managerModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
};

window.deleteManager = async (id) => {
    if (!confirm('Delete this manager?')) return;
    try {
        await apiCall('/managers/' + id, 'DELETE');
        showToast('Manager deleted');
        await loadManagers();
    } catch (err) {}
};

window.approveBanner = async (id) => {
    try {
        await apiCall('/admin/approve-banner/' + id, 'POST');
        showToast('Banner approved');
        await loadManagers();
    } catch (err) {}
};

window.rejectBanner = async (id) => {
    if (!confirm('Reject this banner?')) return;
    try {
        await apiCall('/admin/reject-banner/' + id, 'POST');
        showToast('Banner rejected');
        await loadManagers();
    } catch (err) {}
};

window.previewBanner = (url) => {
    document.getElementById('bannerModalImg').src = url;
    document.getElementById('bannerModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
};

window.closeBannerModal = () => {
    document.getElementById('bannerModal').style.display = 'none';
    document.body.style.overflow = 'auto';
};

window.closeManagerModal = () => {
    document.getElementById('managerModal').style.display = 'none';
    document.body.style.overflow = 'auto';
};

window.previewImage = (input, previewId) => {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById(previewId);
            img.src = e.target.result;
            img.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
};

document.getElementById('managerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('saveManagerBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const id = document.getElementById('managerId').value;
    const formData = new FormData();
    formData.append('name', document.getElementById('managerName').value);
    formData.append('area', document.getElementById('managerArea').value);
    formData.append('email', document.getElementById('managerEmail').value);
    formData.append('phone', document.getElementById('managerPhone').value);
    formData.append('serviceCharge', document.getElementById('managerServiceCharge').value);
    formData.append('status', document.getElementById('managerStatus').value);
    formData.append('moduleAccess', JSON.stringify(selectedModuleIds));

    const photo = document.getElementById('photoInput').files[0];
    const aadhar = document.getElementById('aadharInput').files[0];
    const pan = document.getElementById('panInput').files[0];
    const addressProof = document.getElementById('addressProofInput').files[0];

    if (photo) formData.append('photo', photo);
    if (aadhar) formData.append('aadhar', aadhar);
    if (pan) formData.append('pan', pan);
    if (addressProof) formData.append('addressProof', addressProof);

    try {
        if (id) {
            await apiCall('/managers/' + id, 'PUT', formData);
            showToast('Manager updated successfully');
            closeManagerModal();
        } else {
            const result = await apiCall('/admin/create-manager', 'POST', formData);
            showToast('Manager created successfully');
            document.getElementById('loginLinkBox').style.display = 'block';
            document.getElementById('loginLink').value = result.loginLink;
            document.getElementById('tempPassword').textContent = result.tempPassword;
        }
        await loadManagers();
    } catch (err) {} finally {
        btn.disabled = false;
        btn.textContent = 'Save Manager';
    }
});

window.loadHistory = async () => {
    try {
        const result = await apiCall('/admin/shop-history');
        const tbody = document.getElementById('historyTable');
        if (!tbody) return;
        if (!result.history || result.history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px;">No activity found</td></tr>';
            return;
        }
        tbody.innerHTML = result.history.map(h => `
            <tr>
                <td>${escapeHtml(h.managerId?.name || '-')}</td>
                <td><span class="badge badge-info">${h.action}</span></td>
                <td>${escapeHtml(h.shopName)}</td>
                <td>${escapeHtml(h.area || '-')}</td>
                <td>-</td>
                <td>${formatDate(h.timestamp)}</td>
                <td><button class="btn-secondary btn-sm" onclick='alert(JSON.stringify(${JSON.stringify(h.newData)}))'>View</button></td>
            </tr>
        `).join('');
    } catch (err) {}
};

// ==================== CONTENT ====================
async function loadContent() {
    try {
        const content = await apiCall('/content');
        allContent = content;
        renderContent();
    } catch (err) {}
}

function renderContent() {
    const ads = allContent.filter(c => c.type === 'ad');
    const videos = allContent.filter(c => c.type === 'video');
    const campaigns = allContent.filter(c => c.type === 'campaign');

    document.getElementById('adsCount').textContent = ads.length;
    document.getElementById('videosCount').textContent = videos.length;
    document.getElementById('campaignsCount').textContent = campaigns.length;

    const adsTable = document.querySelector('#adsTable tbody');
    if (adsTable) {
        adsTable.innerHTML = ads.length === 0? '<tr><td colspan="7" style="text-align:center;padding:40px;">No ads found</td></tr>' :
            ads.map(a => `
                <tr>
                    <td>${escapeHtml(a.title)}</td>
                    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(a.description || '-')}</td>
                    <td>${escapeHtml(a.buttonText || '-')}</td>
                    <td><span class="color-badge" style="background:${a.color}">${escapeHtml(a.color)}</span></td>
                    <td>${a.priority || 0}</td>
                    <td><span class="status-badge status-${a.status}">${a.status}</span></td>
                    <td class="actions">
                        <button class="btn-primary btn-sm" onclick="editContent('${a._id}')">Edit</button>
                        <button class="btn-danger btn-sm" onclick="deleteContent('${a._id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
    }

    const videosTable = document.querySelector('#videosTable tbody');
    if (videosTable) {
        videosTable.innerHTML = videos.length === 0? '<tr><td colspan="6" style="text-align:center;padding:40px;">No videos found</td></tr>' :
            videos.map(v => `
                <tr>
                    <td>${escapeHtml(v.title)}</td>
                    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(v.url)}</td>
                    <td><video src="${v.url}" class="video-preview" controls></video></td>
                    <td>${v.priority || 0}</td>
                    <td><span class="status-badge status-${v.status}">${v.status}</span></td>
                    <td class="actions">
                        <button class="btn-primary btn-sm" onclick="editContent('${v._id}')">Edit</button>
                        <button class="btn-danger btn-sm" onclick="deleteContent('${v._id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
    }

    const campaignsTable = document.querySelector('#campaignsTable tbody');
    if (campaignsTable) {
        campaignsTable.innerHTML = campaigns.length === 0? '<tr><td colspan="7" style="text-align:center;padding:40px;">No campaigns found</td></tr>' :
            campaigns.map(c => `
                <tr>
                    <td>${escapeHtml(c.title)}</td>
                    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(c.description || '-')}</td>
                    <td>${escapeHtml(c.buttonText || '-')}</td>
                    <td><span class="color-badge" style="background:${c.color}">${escapeHtml(c.color)}</span></td>
                    <td>${c.priority || 0}</td>
                    <td><span class="status-badge status-${c.status}">${c.status}</span></td>
                    <td class="actions">
                        <button class="btn-primary btn-sm" onclick="editContent('${c._id}')">Edit</button>
                        <button class="btn-danger btn-sm" onclick="deleteContent('${c._id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
    }
}

window.openAddContent = (type) => {
    document.getElementById('contentEditId').value = '';
    document.getElementById('contentEditType').value = type;
    document.getElementById('contentModalTitle').textContent = `Add New ${type.charAt(0).toUpperCase() + type.slice(1)}`;

    let fields = `
        <div class="form-grid">
            <div class="form-group"><label>Title *</label><input type="text" id="field_content_title" required></div>
            <div class="form-group"><label>Priority</label><input type="number" id="field_content_priority" value="0" min="0"></div>
            <div class="form-group"><label>Status</label><select id="field_content_status"><option value="active">Active</option><option value="hidden">Hidden</option></select></div>
    `;

    if (type === 'ad' || type === 'campaign') {
        fields += `
            <div class="form-group full"><label>Description</label><textarea id="field_content_description" rows="3"></textarea></div>
            <div class="form-group"><label>Button Text</label><input type="text" id="field_content_buttonText" placeholder="Learn More"></div>
            <div class="form-group"><label>Button Link</label><input type="text" id="field_content_buttonLink" placeholder="/page"></div>
            <div class="form-group"><label>Color</label><input type="color" id="field_content_color" value="#3b82f6"></div>
        `;
    }

    if (type === 'video') {
        fields += `
            <div class="form-group full"><label>Video URL *</label><input type="text" id="field_content_url" required placeholder="https://..."></div>
        `;
    }

    fields += `</div>`;
    document.getElementById('contentModalFields').innerHTML = fields;
    document.getElementById('contentModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
};

window.editContent = (id) => {
    const item = allContent.find(x => x._id === id);
    if (!item) return;
    document.getElementById('contentEditId').value = id;
    document.getElementById('contentEditType').value = item.type;
    document.getElementById('contentModalTitle').textContent = `Edit ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`;

    let fields = `
        <div class="form-grid">
            <div class="form-group"><label>Title *</label><input type="text" id="field_content_title" value="${escapeHtml(item.title)}" required></div>
            <div class="form-group"><label>Priority</label><input type="number" id="field_content_priority" value="${item.priority || 0}" min="0"></div>
            <div class="form-group"><label>Status</label><select id="field_content_status"><option value="active" ${item.status === 'active'?'selected':''}>Active</option><option value="hidden" ${item.status === 'hidden'?'selected':''}>Hidden</option></select></div>
    `;

    if (item.type === 'ad' || item.type === 'campaign') {
        fields += `
            <div class="form-group full"><label>Description</label><textarea id="field_content_description" rows="3">${escapeHtml(item.description || '')}</textarea></div>
            <div class="form-group"><label>Button Text</label><input type="text" id="field_content_buttonText" value="${escapeHtml(item.buttonText || '')}"></div>
            <div class="form-group"><label>Button Link</label><input type="text" id="field_content_buttonLink" value="${escapeHtml(item.buttonLink || '')}"></div>
            <div class="form-group"><label>Color</label><input type="color" id="field_content_color" value="${item.color || '#3b82f6'}"></div>
        `;
    }

    if (item.type === 'video') {
        fields += `
            <div class="form-group full"><label>Video URL *</label><input type="text" id="field_content_url" value="${escapeHtml(item.url)}" required></div>
        `;
    }

    fields += `</div>`;
    document.getElementById('contentModalFields').innerHTML = fields;
    document.getElementById('contentModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
};

window.saveContent = async () => {
    const btn = document.getElementById('saveContentBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    const id = document.getElementById('contentEditId').value;
    const type = document.getElementById('contentEditType').value;

    const data = {
        type: type,
        title: document.getElementById('field_content_title').value.trim(),
        priority: parseInt(document.getElementById('field_content_priority').value || 0),
        status: document.getElementById('field_content_status').value
    };

    if (type === 'ad' || type === 'campaign') {
        data.description = document.getElementById('field_content_description').value.trim();
        data.buttonText = document.getElementById('field_content_buttonText').value.trim();
        data.buttonLink = document.getElementById('field_content_buttonLink').value.trim();
        data.color = document.getElementById('field_content_color').value;
    }

    if (type === 'video') {
        data.url = document.getElementById('field_content_url').value.trim();
    }

    if (!data.title) {
        showToast('Title is required', 'error');
        btn.disabled = false;
        btn.textContent = '💾 Save Changes';
        return;
    }

    try {
        if (id) {
            await apiCall('/content/' + id, 'PUT', data);
            showToast('Content updated successfully');
        } else {
            await apiCall('/content', 'POST', data);
            showToast('Content created successfully');
        }
        closeContentModal();
        await loadContent();
        await loadDashboard();
    } catch (err) {} finally {
        btn.disabled = false;
        btn.textContent = '💾 Save Changes';
    }
};

window.deleteContent = async (id) => {
    if (!confirm('Delete this content?')) return;
    try {
        await apiCall('/content/' + id, 'DELETE');
        showToast('Content deleted');
        await loadContent();
        await loadDashboard();
    } catch (err) {}
};

window.uploadVideoFile = async () => {
    const btn = document.getElementById('uploadVideoBtn');
    const fileInput = document.getElementById('videoUploadFile');
    const status = document.getElementById('uploadStatus');

    if (!fileInput.files[0]) return showToast('Please select a video', 'error');

    btn.disabled = true;
    btn.textContent = 'Uploading...';
    status.textContent = 'Uploading...';

    const formData = new FormData();
    formData.append('video', fileInput.files[0]);

    try {
        const result = await apiCall('/upload/video', 'POST', formData);
        await apiCall('/content', 'POST', {
            type: 'video',
            title: fileInput.files[0].name,
            url: result.url,
            priority: 0,
            status: 'active'
        });
        showToast('Video uploaded successfully');
        status.textContent = 'Uploaded!';
        fileInput.value = '';
        await loadContent();
    } catch (err) {
        status.textContent = 'Upload failed';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Upload Video';
        setTimeout(() => status.textContent = '', 3000);
    }
};

window.closeContentModal = () => {
    document.getElementById('contentModal').style.display = 'none';
    document.body.style.overflow = 'auto';
};

// ==================== SETTINGS ====================
async function loadSettings() {
    try {
        const settings = await apiCall('/settings');
        currentSettings = settings;
        document.getElementById('settingLogoText').value = settings.logoText || 'SAMANLIVE';
        document.getElementById('settingHeaderColor').value = settings.headerColor || '#10b981';
        document.getElementById('settingFooterColor').value = settings.footerColor || '#1f2937';
        document.getElementById('settingFooterText').value = settings.footerText || '';
        document.getElementById('settingFooterAbout').value = settings.footerAbout || '';
        document.getElementById('settingFacebook').value = settings.facebook || '';
        document.getElementById('settingInstagram').value = settings.instagram || '';
        document.getElementById('settingTwitter').value = settings.twitter || '';
        document.getElementById('settingYoutube').value = settings.youtube || '';

        if (settings.logoUrl) {
            document.getElementById('logoPreview').src = settings.logoUrl;
            document.getElementById('logoPreview').style.display = 'block';
        }

        renderFooterLinks(settings.footerLinks || []);
    } catch (err) {}
}

function renderFooterLinks(links) {
    const container = document.getElementById('footerLinksContainer');
    if (!container) return;
    container.innerHTML = links.map((link, idx) => `
        <div class="form-grid" style="margin-bottom:10px;">
            <div class="form-group"><input type="text" value="${escapeHtml(link.text)}" placeholder="Link Text" onchange="updateFooterLink(${idx}, 'text', this.value)"></div>
            <div class="form-group"><input type="text" value="${escapeHtml(link.url)}" placeholder="Link URL" onchange="updateFooterLink(${idx}, 'url', this.value)"></div>
            <div class="form-group"><button class="btn-danger btn-sm" onclick="removeFooterLink(${idx})">Remove</button></div>
        </div>
    `).join('');
}

window.addFooterLink = () => {
    currentSettings.footerLinks = currentSettings.footerLinks || [];
    currentSettings.footerLinks.push({ text: '', url: '' });
    renderFooterLinks(currentSettings.footerLinks);
};

window.updateFooterLink = (idx, field, value) => {
    if (currentSettings.footerLinks[idx]) {
        currentSettings.footerLinks[idx][field] = value;
    }
};

window.removeFooterLink = (idx) => {
    currentSettings.footerLinks.splice(idx, 1);
    renderFooterLinks(currentSettings.footerLinks);
};

window.previewLogo = (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('logoPreview').src = e.target.result;
            document.getElementById('logoPreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
};

window.uploadLogoFile = async () => {
    const btn = document.getElementById('uploadLogoBtn');
    const fileInput = document.getElementById('logoUploadFile');
    const status = document.getElementById('logoUploadStatus');

    if (!fileInput.files[0]) return showToast('Please select a logo', 'error');

    btn.disabled = true;
    btn.textContent = 'Uploading...';
    status.textContent = 'Uploading...';

    const formData = new FormData();
    formData.append('logo', fileInput.files[0]);

    try {
        const result = await apiCall('/upload/logo', 'POST', formData);
        currentSettings.logoUrl = result.url;
        showToast('Logo uploaded successfully');
        status.textContent = 'Uploaded!';
    } catch (err) {
        status.textContent = 'Upload failed';
    } finally {
        btn.disabled = false;
        btn.textContent = '📤 Upload Logo';
        setTimeout(() => status.textContent = '', 3000);
    }
};

window.saveSettings = async () => {
    const btn = document.getElementById('saveSettingsBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const data = {
        logoText: document.getElementById('settingLogoText').value,
        logoUrl: currentSettings.logoUrl,
        headerColor: document.getElementById('settingHeaderColor').value,
        footerColor: document.getElementById('settingFooterColor').value,
        footerText: document.getElementById('settingFooterText').value,
        footerAbout: document.getElementById('settingFooterAbout').value,
        facebook: document.getElementById('settingFacebook').value,
        instagram: document.getElementById('settingInstagram').value,
        twitter: document.getElementById('settingTwitter').value,
        youtube: document.getElementById('settingYoutube').value,
        footerLinks: currentSettings.footerLinks || []
    };

    try {
        await apiCall('/settings', 'PUT', data);
        showToast('Settings saved successfully');
        await loadSettings();
    } catch (err) {} finally {
        btn.disabled = false;
        btn.textContent = '💾 Save All Settings';
    }
};

// ==================== ADD ANIMATIONS ====================
if (!document.getElementById('toastStyles')) {
    const style = document.createElement('style');
    style.id = 'toastStyles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ==================== GLOBAL ERROR HANDLER ====================
window.addEventListener('error', function(e) {
    console.error('Global Error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled Promise Rejection:', e.reason);
});

// ==================== EXPORT FOR USE ====================
// Ye functions global scope me available hain
window.apiCall = apiCall;
window.showToast = showToast;
window.escapeHtml = escapeHtml;
window.showLoading = showLoading;
window.filterTable = filterTable;
window.copyToClipboard = copyToClipboard;
window.formatDate = formatDate;
window.formatNumber = formatNumber;
window.debounce = debounce;

// ==================== INIT ON LOAD ====================
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});