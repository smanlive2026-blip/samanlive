// ========================================
// AREA MANAGER DASHBOARD - WORLD CLASS CLEAN
// File: /public/assets/js/area-manager.js
// Dashboard + Profile + Shop List + Edit + Delivery
// Shop Create logic shop-create.js me hai
// ========================================

let currentManager = null;
let managerShops = [];
let categories = [];
let allManagers = [];
let allAreas = [];
let managerAreaMapInstance = null;
let isMapHidden = false;

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token') || localStorage.getItem('managerToken');

if (!token) {
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:20px;padding:20px;text-align:center"><i class="fas fa-exclamation-triangle" style="font-size:64px;color:#ef4444"></i><h1 style="color:#ef4444">Invalid Access Link</h1><p style="color:#64748b">Contact Admin for valid link</p></div>';
    throw new Error('No token');
}
localStorage.setItem('managerToken', token);

const API = '/api';

// ========== API HELPER ==========
async function apiCall(endpoint, options = {}) {
    const opts = {
        method: options.method || 'GET',
        headers: { 'Authorization': `Bearer ${token}`,...(options.headers || {}) }
    };
    if (options.body) {
        if (options.body instanceof FormData) {
            opts.body = options.body;
        } else {
            opts.headers['Content-Type'] = 'application/json';
            opts.body = typeof options.body === 'string'? options.body : JSON.stringify(options.body);
        }
    }
    const res = await fetch(API + endpoint, opts);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch (e) { console.error('Server Response:', text); throw new Error('Server error: Invalid JSON response'); }
    if (!res.ok) throw new Error(data.error || data.message || 'API Error');
    return data;
}
window.apiCall = apiCall;
window.getManagerToken = () => token;

// ========== HEADER - ADMIN CONTROLLED ==========
// Admin Settings se aayega: GET /api/public/header-settings
// Fields: logo, brandMain, brandAccent, dashboardTitle, themeColor
async function loadHeaderSettings() {
    try {
        const res = await fetch('/api/public/header-settings').then(r => r.json()).catch(() => null);
        const s = res?.settings || res || {};
        if (s.logo) document.getElementById('headerLogo').src = s.logo;
        if (s.brandMain) document.getElementById('headerBrandMain').textContent = s.brandMain;
        if (s.brandAccent) document.getElementById('headerBrandAccent').textContent = s.brandAccent;
        if (s.dashboardTitle) document.getElementById('headerDashboardTitle').textContent = s.dashboardTitle;
        if (s.themeColor) document.querySelector('.topbar').style.background = s.themeColor;
    } catch (e) { console.log('Header settings default use hoga'); }
}

// ========== PAGE LOAD ==========
document.addEventListener('DOMContentLoaded', async () => {
    await loadHeaderSettings();
    await loadDashboard();
    bindProfileForm();
    bindShopEditForm();
    bindDeliveryForm();
});

async function loadDashboard() {
    try {
        const dashboardRes = await apiCall('/manager/dashboard');
        if (!dashboardRes.success) throw new Error(dashboardRes.error || 'Invalid token');

        currentManager = dashboardRes.manager;
        const stats = dashboardRes.stats || { totalShops: 0, activeShops: 0 };
        currentManager.currentShopCount = stats.totalShops;
        currentManager.maxShops = currentManager.maxShops || dashboardRes.manager.maxShops || 10;

        const [shopsData, modulesData, areasRes, managersRes] = await Promise.all([
            apiCall('/manager/shops').catch(() => ({ shops: [] })),
            apiCall('/modules').catch(() => ({ modules: [] })),
            fetch('/api/areas').then(r => r.json()).catch(() => []),
            fetch('/api/managers').then(r => r.json()).catch(() => [])
        ]);

        managerShops = shopsData.shops || shopsData || [];
        categories = modulesData.modules || modulesData || [];
        allAreas = Array.isArray(areasRes)? areasRes : (areasRes.areas || []);
        allManagers = Array.isArray(managersRes)? managersRes : (managersRes.managers || []);

        renderProfile();
        renderStats(stats);
        renderShops(managerShops);
        renderServiceCards(categories);
        updateShopLimitUI();
        renderAreaMapBlock();
        loadDeliveryBoys();

        if (typeof window.initShopCreateModule === 'function') {
            window.initShopCreateModule(allManagers, allAreas, categories, currentManager);
        }
    } catch (err) {
        console.error('Dashboard Error:', err);
        const msg = (err.message.includes('Manager not found') || err.message.includes('Invalid token'))
           ? 'Session expired. Please login again.' : err.message;
        document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:20px;padding:20px;text-align:center"><i class="fas fa-exclamation-triangle" style="font-size:64px;color:#ef4444"></i><h1 style="color:#ef4444">Error Loading Dashboard</h1><p style="color:#64748b;max-width:600px">${escapeHtml(msg)}</p><button onclick="location.reload()" class="btn btn-primary">Retry</button></div>`;
    }
}
window.loadDashboard = loadDashboard;

// ========== PROFILE RENDER ==========
function renderProfile() {
    if (!currentManager) return;
    const myArea = allAreas.find(a => a.areaCode === currentManager.areaCode) || {};

    setText('managerName', currentManager.name || 'Manager');
    setText('managerBadge', currentManager.bucket || currentManager.managerCode || 'Area Manager');
    setText('managerFullName', currentManager.name || 'Manager Name');
    setText('managerRole', currentManager.role === 'delivery-manager'? 'Delivery Manager' : 'Area Manager');
    setText('managerAreaName', currentManager.areaName || currentManager.areaCode || '-');
    setText('managerPhone', currentManager.phone || 'Not Set');
    setText('managerEmail', currentManager.email || 'Not Set');
    setText('managerLocation', `${myArea.city || currentManager.city || '-'}, ${myArea.state || currentManager.state || '-'}`);
    setText('managerRadius', myArea.radius || currentManager.radius || 50);
    setText('areaCodeText', currentManager.areaCode || '-');
    setText('managerCodeText', currentManager.managerCode || '-');
    setText('areaCodeText2', currentManager.areaCode || '-');
    setText('managerCodeText2', currentManager.managerCode || '-');

    const avatarHtml = currentManager.photo
       ? `<img src="${currentManager.photo}" alt=""><div class="profile-avatar-edit"><i class="fas fa-camera"></i></div>`
        : `${(currentManager.name || 'A').charAt(0).toUpperCase()}<div class="profile-avatar-edit"><i class="fas fa-camera"></i></div>`;
    const avatarEl = document.getElementById('managerAvatar');
    if (avatarEl) avatarEl.innerHTML = avatarHtml;

    const chip = document.getElementById('headerManagerAvatar');
    if (chip) chip.innerHTML = currentManager.photo? `<img src="${currentManager.photo}" alt="">` : (currentManager.name || 'A').charAt(0).toUpperCase();
}
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

// ========== STATS + LIMIT ==========
function renderStats(stats) {
    setText('totalShops', stats?.totalShops?? managerShops.length);
    setText('activeShops', stats?.activeShops?? managerShops.filter(s => s.isActive).length);
}
function updateShopLimitUI() {
    if (!currentManager) return;
    const txt = `${currentManager.currentShopCount || 0} / ${currentManager.maxShops || 10}`;
    setText('shopLimitText', txt); setText('shopLimitTextMain', txt);
    const btn = document.getElementById('createShopBtn');
    if (btn && (currentManager.currentShopCount || 0) >= (currentManager.maxShops || 10)) {
        btn.disabled = true; btn.innerHTML = '<i class="fas fa-ban"></i> Limit Reached';
        document.getElementById('shopLimitBadge')?.classList.add('limit-reached');
    }
}

// ========== AREA MAP ==========
function renderAreaMapBlock() {
    const myArea = allAreas.find(a => a.areaCode === currentManager?.areaCode);
    if (!myArea) return;
    setText('areaMapName', myArea.areaName || myArea.areaCode);
    setText('areaCoverageBadge', `${myArea.radius || 50} km Radius`);
    setText('detailCity', myArea.city || '-'); setText('detailState', myArea.state || '-');
    setText('detailCenter', `${(myArea.centerLat || 0).toFixed(4)}, ${(myArea.centerLng || 0).toFixed(4)}`);
    setText('detailRadius', myArea.radius || 50);
    if (!myArea.centerLat ||!myArea.centerLng) return;
    if (managerAreaMapInstance) { managerAreaMapInstance.remove(); managerAreaMapInstance = null; }
    setTimeout(() => {
        const div = document.getElementById('managerAreaMap'); if (!div || typeof L === 'undefined') return;
        managerAreaMapInstance = L.map('managerAreaMap').setView([myArea.centerLat, myArea.centerLng], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(managerAreaMapInstance);
        L.marker([myArea.centerLat, myArea.centerLng]).addTo(managerAreaMapInstance).bindPopup(`<b>${escapeHtml(myArea.areaName || '')}</b><br>${escapeHtml(myArea.city || '')}, ${escapeHtml(myArea.state || '')}`).openPopup();
        L.circle([myArea.centerLat, myArea.centerLng], { radius: (myArea.radius || 50) * 1000, color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.15, weight: 2 }).addTo(managerAreaMapInstance);
        setTimeout(() => managerAreaMapInstance && managerAreaMapInstance.invalidateSize(), 300);
    }, 400);
}
function toggleAreaMap() {
    const wrap = document.getElementById('areaMapWrapper'); const btn = document.getElementById('toggleMapBtn');
    if (!wrap ||!btn) return;
    isMapHidden =!isMapHidden;
    wrap.style.display = isMapHidden? 'none' : 'block';
    btn.innerHTML = isMapHidden? '<i class="fas fa-eye"></i> Show Map' : '<i class="fas fa-eye-slash"></i> Hide Map';
    if (!isMapHidden) setTimeout(() => managerAreaMapInstance && managerAreaMapInstance.invalidateSize(), 200);
}

// ========== SHOPS LIST - TEMPLATE DASHBOARD HIT ==========
function getShopFolder(shop) {
    //const id = shop.template || shop.serviceType || shop.categoryId || shop.shopType || 'common';
    //if (typeof window.getShopTemplateFolder === 'function') return window.getShopTemplateFolder(id);
    //return 'common';
    if (shop.templateFolder || shop.folder) return shop.templateFolder || shop.folder;
    const id = shop.template || shop.serviceType || shop.categoryId || shop.shopType || 'common';
    if (typeof window.getShopTemplateFolder === 'function') return window.getShopTemplateFolder(id);
    return 'common';
}
function shopDashboardUrl(shop) {
    return `${window.location.origin}/shop-templates/${getShopFolder(shop)}/dashboard.html?shopId=${shop._id}`;
}
function renderShops(shops) {
    const tbody = document.getElementById('shopsTable'); if (!tbody) return;
    if (!shops || shops.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><i class="fas fa-store-slash"></i><p>No shops created yet. Click "Create New Shop" to add one.</p></div></td></tr>'; return;
    }
    tbody.innerHTML = shops.map(shop => {
        const url = shopDashboardUrl(shop);
        const iconHtml = shop.logo? `<img src="${shop.logo}" style="width:40px;height:40px;border-radius:8px;object-fit:cover">` : `<span style="font-size:26px">${shop.icon || '🏪'}</span>`;
        return `<tr>
            <td>${iconHtml}</td>
            <td><strong>${escapeHtml(shop.shopName)}</strong><br><small style="color:#64748b">${escapeHtml(getShopFolder(shop))}</small></td>
            <td>${escapeHtml(getCategoryName(shop.serviceType || shop.categoryId || shop.template))}</td>
            <td>${escapeHtml(shop.ownerName || 'N/A')}</td>
            <td>${((shop.range || 5000) / 1000).toFixed(0)} KM</td>
            <td><span class="badge ${shop.isActive? 'badge-success' : 'badge-danger'}">${shop.isActive? 'Active' : 'Inactive'}</span></td>
            <td><div style="display:flex;gap:8px;flex-wrap:wrap">
                <a href="${url}" target="_blank" class="btn btn-small btn-primary"><i class="fas fa-external-link-alt"></i> Open</a>
                <button class="btn btn-small btn-link" onclick="copyShopLink('${shop._id}')"><i class="fas fa-link"></i> Link</button>
                <button class="btn btn-small" onclick='editShop(${JSON.stringify(shop).replace(/'/g, "&apos;")})'><i class="fas fa-edit"></i> Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteShop('${shop._id}')"><i class="fas fa-trash"></i> Delete</button>
            </div></td></tr>`;
    }).join('');
}
window.copyShopLink = function(shopId) {
    const shop = managerShops.find(s => s._id === shopId);
    const link = shop? shopDashboardUrl(shop) : `${window.location.origin}/shop-templates/common/dashboard.html?shopId=${shopId}`;
    navigator.clipboard.writeText(link).then(() => alert(`✅ Dashboard link copied!\n\n${link}`)).catch(() => prompt('Copy this link:', link));
};

// ========== SHOP DELETE ==========
async function deleteShop(shopId) {
    const shop = managerShops.find(s => s._id === shopId);
    const shopName = shop? shop.shopName : 'this shop';
    if (!confirm(`⚠️ Pakka delete karna hai?\n\nShop: ${shopName}\n\nYe shop band ho jayegi, list se hat jayegi aur dashboard nahi khulega.`)) return;
    try {
        const data = await apiCall(`/manager/shops/${shopId}`, { method: 'DELETE' });
        if (data.success) { alert('✅ Shop delete ho gayi'); loadDashboard(); }
        else alert(data.error || data.message || 'Delete nahi hui');
    } catch (err) { alert('Error: ' + err.message); }
}
window.deleteShop = deleteShop;

// ========== SERVICES ==========
function renderServiceCards(cats) {
    const box = document.getElementById('serviceCards'); if (!box) return;
    if (!cats || cats.length === 0) { box.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No services assigned yet. Contact admin.</p></div>'; return; }
    box.innerHTML = cats.map(c => `<div class="service-card"><div class="icon">${c.icon || '📦'}</div><div class="name">${escapeHtml(c.name)}</div></div>`).join('');
}
function getCategoryName(id) {
    if (typeof window.getAllShopTemplates === 'function') {
        const t = window.getAllShopTemplates().find(c => c.id === id || c._id === id || c.name === id);
        if (t) return t.name;
    }
    const cat = categories.find(c => c.id === id || c._id === id || c.name === id);
    return cat? cat.name : (id || '-');
}

// ========== PROFILE MODAL ==========
function openProfileModal() {
    document.getElementById('profileModal')?.classList.add('active');
    document.getElementById('profileName').value = currentManager?.name || '';
    document.getElementById('profilePhone').value = currentManager?.phone || '';
    document.getElementById('profileEmail').value = currentManager?.email || '';
    document.getElementById('profileAreaName').value = currentManager?.areaName || currentManager?.areaCode || '';
    const prev = document.getElementById('photoPreview');
    prev.innerHTML = currentManager?.photo? `<img src="${currentManager.photo}" alt="Profile">` : '<i class="fas fa-user" style="font-size:42px"></i>';
    document.getElementById('profilePhotoBase64').value = currentManager?.photo || '';
}
function closeProfileModal() { document.getElementById('profileModal')?.classList.remove('active'); }
function previewProfilePhoto(event) {
    const file = event.target.files[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Image size should be less than 2MB.'); event.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = e => { document.getElementById('photoPreview').innerHTML = `<img src="${e.target.result}" alt="Preview">`; document.getElementById('profilePhotoBase64').value = e.target.result; };
    reader.readAsDataURL(file);
}
function bindProfileForm() {
    const form = document.getElementById('profileForm'); if (!form || form.dataset.bound) return; form.dataset.bound = '1';
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('profileSaveBtn'); btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        try {
            const data = await apiCall('/manager/update-profile', { method: 'PUT', body: {
                name: document.getElementById('profileName').value.trim(),
                phone: document.getElementById('profilePhone').value.trim(),
                email: document.getElementById('profileEmail').value.trim(),
                photo: document.getElementById('profilePhotoBase64').value || currentManager.photo || ''
            }});
            if (data.success) { alert('✅ Profile updated successfully!'); currentManager = data.manager || {...currentManager,...data }; renderProfile(); closeProfileModal(); }
            else alert(data.error || 'Error updating profile');
        } catch (err) { alert('Error: ' + err.message); }
        finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save Profile'; }
    });
}

// ========== SHOP EDIT ==========
function openShopModal(shop = null) {
    document.getElementById('shopModal')?.classList.add('active');
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Shop Details';
    const sel = document.getElementById('shopCategory');
    if (sel && typeof window.getAllShopTemplates === 'function') {
        sel.innerHTML = window.getAllShopTemplates().map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
    }
    if (!shop) return;
    document.getElementById('shopId').value = shop._id;
    document.getElementById('shopName').value = shop.shopName || '';
    document.getElementById('shopIcon').value = shop.icon || '🏪';
    document.getElementById('shopCategory').value = shop.serviceType || shop.categoryId || shop.template || 'common';
    document.getElementById('shopPhone').value = shop.phone || shop.contact || '';
    document.getElementById('shopAddress').value = shop.address?.line1 || shop.address || '';
    document.getElementById('shopRange').value = shop.range || 5000;
    document.getElementById('shopStatus').value = shop.isActive? 'true' : 'false';
    document.getElementById('shopDesc').value = shop.description || '';
    document.getElementById('shopLat').value = shop.location?.coordinates?.[1] || '';
    document.getElementById('shopLng').value = shop.location?.coordinates?.[0] || '';
}
function closeShopModal() { document.getElementById('shopModal')?.classList.remove('active'); }
function editShop(shop) { openShopModal(shop); }
function bindShopEditForm() {
    const form = document.getElementById('shopForm'); if (!form || form.dataset.bound) return; form.dataset.bound = '1';
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('shopSaveBtn'); btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        const shopId = document.getElementById('shopId').value;
        const catId = document.getElementById('shopCategory').value;
        try {
            const data = await apiCall(`/manager/shops/${shopId}`, { method: 'PUT', body: {
                shopName: document.getElementById('shopName').value.trim(),
                icon: document.getElementById('shopIcon').value || '🏪',
                serviceType: catId, categoryId: catId, template: catId,
                shopType: typeof window.mapShopType === 'function'? window.mapShopType(catId) : 'common',
                phone: document.getElementById('shopPhone').value.trim(),
                address: { line1: document.getElementById('shopAddress').value.trim() },
                range: parseInt(document.getElementById('shopRange').value),
                isActive: document.getElementById('shopStatus').value === 'true',
                description: document.getElementById('shopDesc').value.trim()
            }});
            if (data.success) { alert('✅ Shop updated successfully!'); closeShopModal(); loadDashboard(); }
            else alert(data.error || 'Error updating shop');
        } catch (err) { alert('Error: ' + err.message); }
        finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Update Shop'; }
    });
}

// ========== DELIVERY BOYS ==========
async function loadDeliveryBoys() {
    const tbody = document.getElementById('deliveryBoysTable'); if (!tbody) return;
    try {
        const data = await apiCall('/manager/delivery-managers');
        const list = data.managers || [];
        if (!data.success || list.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Abhi koi Delivery Boy nahi hai</td></tr>'; return; }
        tbody.innerHTML = list.map(dm => {
            const link = `${window.location.origin}/delivery-boy.html?token=${dm.loginToken || ''}`;
            return `<tr><td>${escapeHtml(dm.name)}</td><td>${escapeHtml(dm.phone)}</td><td>${escapeHtml(dm.vehicleType || 'bike')}</td><td>${escapeHtml(dm.managerCode)}</td><td><span class="badge ${dm.status? 'badge-success' : 'badge-danger'}">${dm.status? 'Active' : 'Inactive'}</span></td><td><button class="btn btn-small btn-primary" onclick="window.open('${link}')">Open</button> <button class="btn btn-small btn-link" onclick="navigator.clipboard.writeText('${link}');alert('Link Copied')">Copy</button></td></tr>`;
        }).join('');
    } catch (err) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Delivery list load nahi hui</td></tr>'; }
}
function bindDeliveryForm() {
    const form = document.getElementById('createDeliveryForm'); if (!form || form.dataset.bound) return; form.dataset.bound = '1';
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]'); btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        try {
            const data = await apiCall('/manager/create-delivery-manager', { method: 'POST', body: {
                name: document.getElementById('dmName').value.trim(),
                phone: document.getElementById('dmPhone').value.trim(),
                email: document.getElementById('dmEmail').value.trim(),
                vehicleType: document.getElementById('dmVehicle').value
            }});
            alert(data.message || 'Done');
            if (data.success) { closeCreateDeliveryModal(); form.reset(); loadDeliveryBoys(); }
        } catch (err) { alert('Error: ' + err.message); }
        finally { btn.disabled = false; btn.innerHTML = 'Create'; }
    });
}
function openCreateDeliveryModal() { document.getElementById('createDeliveryModal')?.classList.add('active'); }
function closeCreateDeliveryModal() { document.getElementById('createDeliveryModal')?.classList.remove('active'); }
function openDeliveryManagerPanel() { document.getElementById('deliverySection')?.scrollIntoView({ behavior: 'smooth' }); }

// ========== OTHER ==========
function openProductLibrary() { document.getElementById('libraryPopup')?.classList.add('active'); }
function closeProductLibrary() { document.getElementById('libraryPopup')?.classList.remove('active'); }
function openOrderView() { alert('Order View - Coming Soon'); }
function escapeHtml(text) { const d = document.createElement('div'); d.textContent = text == null? '' : String(text); return d.innerHTML; }

window.onclick = e => { if (e.target.classList?.contains('modal')) e.target.classList.remove('active'); };
window.addEventListener('message', e => { if (e.data?.type === 'ADD_FROM_LIBRARY') { alert(`Selected: ${e.data.name}`); closeProductLibrary(); } });

// Export for onclick
window.openProfileModal = openProfileModal; window.closeProfileModal = closeProfileModal;
window.previewProfilePhoto = previewProfilePhoto; window.editShop = editShop;
window.openShopModal = openShopModal; window.closeShopModal = closeShopModal;
window.openProductLibrary = openProductLibrary; window.closeProductLibrary = closeProductLibrary;
window.openOrderView = openOrderView; window.openCreateDeliveryModal = openCreateDeliveryModal;
window.closeCreateDeliveryModal = closeCreateDeliveryModal; window.openDeliveryManagerPanel = openDeliveryManagerPanel;
window.toggleAreaMap = toggleAreaMap; window.loadDeliveryBoys = loadDeliveryBoys;

console.log('✅ area-manager.js loaded - World Class Dashboard + Template Mapping');