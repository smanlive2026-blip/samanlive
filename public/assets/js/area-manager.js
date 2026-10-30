// ========================================
// AREA MANAGER DASHBOARD - WORLD CLASS CLEAN + V13 HIERARCHY + V14 PRODUCT MANAGER DEMAND
// File: /public/assets/js/area-manager.js
// Dashboard + Profile + Shop List + Edit + Delivery + WALLET + BULK BUY FROM ADMIN + AREA DEMAND TO EXECUTIVE
// Shop Create logic shop-create.js me hai
// LOCATION: /public/assets/js/area-manager.js - V14 FINAL - NO EXISTING LOGIC BROKEN - ONLY ADDED DEMAND LOGIC AT END
// ========================================

let currentManager = null;
let managerShops = [];
let categories = [];
let allManagers = [];
let allAreas = [];
let managerAreaMapInstance = null;
let isMapHidden = false;
let managerWallet = null;
let adminProducts = [];

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
    initHierarchyForManager();
    // LOCATION: NEW V14 - Init demand after everything loaded - does not break old init
    setTimeout(()=>{ if(typeof initDemandSystem==='function') initDemandSystem(); }, 2000);
});

function initHierarchyForManager(){
    // RoleHierarchy set for this page
    if(window.RoleHierarchy){
        window.USER_ROLE = 'area_manager';
        window.USER_ID = currentManager? currentManager._id || currentManager.managerCode : 'manager';
        window.MY_SHOP_ID = null;
    }
    // Socket live order - area manager ko bhi notification
    if(window.io || window.socket){
        try {
            const socket = window.socket || window.io();
            if(currentManager){
                socket.emit('join-shop', currentManager.managerCode);
                socket.emit('join-shop', currentManager._id);
                socket.on('new-order', (order)=>{
                    console.log('🔔 New order for manager:', order);
                    if(window.Toast) Toast.success(`New Order: ${order.orderId}`);
                    // Badge
                    const badge = document.getElementById('newOrderBadge');
                    if(badge){ badge.style.display='block'; badge.textContent='NEW'; }
                    // Refresh stats
                    loadDashboard();
                });
            }
        } catch(e){ console.log('Socket init skip', e.message); }
    }
}

async function loadDashboard() {
    try {
        const dashboardRes = await apiCall('/manager/dashboard');
        if (!dashboardRes.success) throw new Error(dashboardRes.error || 'Invalid token');

        currentManager = dashboardRes.manager;
        const stats = dashboardRes.stats || { totalShops: 0, activeShops: 0 };
        currentManager.currentShopCount = stats.totalShops;
        currentManager.maxShops = currentManager.maxShops || dashboardRes.manager.maxShops || 10;

        // Set role hierarchy globals after manager loaded
        window.USER_ROLE = 'area_manager';
        window.USER_ID = currentManager._id || currentManager.managerCode;
        window.AreaId = currentManager.areaCode;

        const [shopsData, modulesData, areasRes, managersRes, walletRes] = await Promise.all([
            apiCall('/manager/shops').catch(() => ({ shops: [] })),
            apiCall('/modules').catch(() => ({ modules: [] })),
            fetch('/api/areas').then(r => r.json()).catch(() => []),
            fetch('/api/managers').then(r => r.json()).catch(() => []),
            fetch(`/api/common/wallet/balance?userId=${currentManager._id || currentManager.managerCode}&role=area_manager`).then(r=>r.json()).catch(()=>({balance:0}))
        ]);

        managerShops = shopsData.shops || shopsData || [];
        categories = modulesData.modules || modulesData || [];
        allAreas = Array.isArray(areasRes)? areasRes : (areasRes.areas || []);
        allManagers = Array.isArray(managersRes)? managersRes : (managersRes.managers || []);
        managerWallet = walletRes.wallet || walletRes || { balance:0, totalEarning:0 };

        renderProfile();
        renderStats(stats);
        renderShops(managerShops);
        renderServiceCards(categories);
        updateShopLimitUI();
        renderAreaMapBlock();
        loadDeliveryBoys();
        renderWallet(managerWallet);
        loadAdminProductsForManager();
        // LOCATION: V14 - Also refresh demands after dashboard load - isolated
        if(typeof loadMyDemandsV14==='function') loadMyDemandsV14();

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

// ========== WALLET RENDER - NEW HIERARCHY ==========
function renderWallet(wallet){
    const el = document.getElementById('managerWalletBalance');
    if(el) el.textContent = `₹${wallet.balance || 0}`;
    const el2 = document.getElementById('managerTotalEarning');
    if(el2) el2.textContent = `₹${wallet.totalEarning || 0}`;
    const el3 = document.getElementById('walletSection');
    if(el3 && wallet.balance!== undefined){
        el3.style.display = 'block';
    }
}

// ========== ADMIN PRODUCTS - AREA MANAGER CAN BUY FROM ADMIN - NEW ==========
async function loadAdminProductsForManager(){
    const container = document.getElementById('adminProductsForManager');
    if(!container) return;
    container.innerHTML = '<p style="opacity:0.6">Loading admin products...</p>';
    try {
        const res = await fetch(`/api/world-products?role=area_manager&supplierRole=admin`).then(r=>r.json()).catch(()=>({data:[]}));
        let products = res.data || res.products || [];
        // Filter - only admin products
        products = products.filter(p=> (p.ownerRole||p.supplierRole||'admin')==='admin');
        // Fallback - agar filter empty toh sab dikhao for buying
        if(products.length===0){
            const res2 = await fetch(`/api/world-products?role=admin`).then(r=>r.json()).catch(()=>({data:[]}));
            products = res2.data || [];
        }
        adminProducts = products.slice(0,20);
        if(adminProducts.length===0){
            container.innerHTML = '<p style="opacity:0.6">No admin products to buy. Admin se stock lo.</p>';
            return;
        }
        container.innerHTML = adminProducts.map(p=> `
            <div style="border:1px solid #eee;border-radius:10px;padding:10px;display:flex;gap:10px;align-items:center">
                <img src="${p.thumbnail||p.image||'/assets/default-product.png'}" style="width:50px;height:50px;object-fit:cover;border-radius:8px">
                <div style="flex:1">
                    <div style="font-weight:600;font-size:13px">${escapeHtml(p.name||'Product')}</div>
                    <div style="font-size:11px;color:#666">₹${p.price} • Admin</div>
                </div>
                <button onclick='buyFromAdmin(${JSON.stringify(p).replace(/'/g,"&#39;")})' style="padding:6px 12px;background:#000;color:#fff;border:0;border-radius:6px;font-size:12px">Buy Bulk</button>
            </div>
        `).join('');
    } catch(e){
        container.innerHTML = `<p style="color:red">Load fail: ${e.message}</p>`;
    }
}

window.buyFromAdmin = async function(product){
    if(!window.RoleHierarchy ||!window.CartCore){
        alert('CartCore load nahi hua, refresh karo');
        return;
    }
    // Force supplier admin
    product.ownerRole = 'admin';
    product.ownerId = 'admin_default';
    product.shopId = product.shopId || 'admin_shop';
    product.supplierRole = 'admin';
    const ok = await window.CartCore.add(product, 10); // bulk 10 qty
    if(ok){
        if(confirm(`Added ${product.name} x10 to cart. Checkout par jana hai?`)){
            window.location.href = `/shop-templates/common/checkout/checkout.html?supplierId=admin_default&supplierRole=admin&shopId=admin_shop&supplierName=Admin`;
        }
    }
};

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
    // Hierarchy earning stats
    if(stats.totalOrders!== undefined) setText('totalOrders', stats.totalOrders);
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
    const link = shop? shopDashboardUrl(shop) : `${window.location.origin}/shop-templates/${shop.shopType || 'kirana'}/dashboard.html?shopId=${shopId}`;
    navigator.clipboard.writeText(link).then(() => alert(`✅ Dashboard link copied!\n\n${link}`)).catch(() => prompt('Copy this link:', link));
};

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

function openProductLibrary() { document.getElementById('libraryPopup')?.classList.add('active'); }
function closeProductLibrary() { document.getElementById('libraryPopup')?.classList.remove('active'); }
function openOrderView() {
    // Hierarchy: area manager apne shops ke orders dekhega + bulk orders jo usne admin se kiye
    window.location.href = '/shop-templates/common/orders/orders.html?role=area_manager&managerId=' + (currentManager?._id || '');
}
function escapeHtml(text) { const d = document.createElement('div'); d.textContent = text == null? '' : String(text); return d.innerHTML; }

window.onclick = e => { if (e.target.classList?.contains('modal')) e.target.classList.remove('active'); };
window.addEventListener('message', e => { if (e.data?.type === 'ADD_FROM_LIBRARY') { alert(`Selected: ${e.data.name}`); closeProductLibrary(); } });

window.openProfileModal = openProfileModal; window.closeProfileModal = closeProfileModal;
window.previewProfilePhoto = previewProfilePhoto; window.editShop = editShop;
window.openShopModal = openShopModal; window.closeShopModal = closeShopModal;
window.openProductLibrary = openProductLibrary; window.closeProductLibrary = closeProductLibrary;
window.openOrderView = openOrderView; window.openCreateDeliveryModal = openCreateDeliveryModal;
window.closeCreateDeliveryModal = closeCreateDeliveryModal; window.openDeliveryManagerPanel = openDeliveryManagerPanel;
window.toggleAreaMap = toggleAreaMap; window.loadDeliveryBoys = loadDeliveryBoys;

console.log('✅ area-manager.js loaded - World Class + V13 Hierarchy + Wallet + Bulk Buy');

// ========================================
// V14 PRODUCT MANAGER SYSTEM - AREA DEMAND TO EXECUTIVE - NEW - ISOLATED - DOES NOT BREAK OLD LOGIC
// LOCATION: /public/assets/js/area-manager.js - DEMAND SYSTEM - ADDED AT END - 100% ISOLATED
// ========================================
let myDemandsCacheV14 = [];

async function loadMyDemandsV14(){
  try{
    const managerId = currentManager?._id || currentManager?.managerCode || localStorage.getItem('managerId') || new URLSearchParams(location.search).get('id');
    if(!managerId) return;
    const res = await fetch(`/api/area-demand/my/${managerId}`).then(r=>r.json()).catch(()=>({data:[]}));
    const data = res.data || [];
    myDemandsCacheV14 = data;
    const badge = document.getElementById('demandCountBadge');
    if(badge) badge.textContent = `${data.filter(d=>d.status==='open').length} Pending`;
    const list = document.getElementById('myDemandsList');
    if(!list) return;
    if(!data.length){ list.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8"><i class="fas fa-inbox"></i><p>No demands sent yet<br><small>Executive will assign Product Manager product to you</small></p></div>'; return; }
    list.innerHTML = data.map(d=>`
      <div style="border:1px solid #e2e8f0;border-radius:8px;padding:8px;margin-bottom:6px;background:#fff">
        <div style="display:flex;justify-content:space-between;align-items:center"><b>${escapeHtml(d.productName)}</b><span style="font-size:10px;padding:3px 8px;border-radius:12px;background:${d.priority==='high'?'#fee2e2':d.priority==='medium'?'#fef3c7':'#dcfce7'};color:${d.priority==='high'?'#991b1b':d.priority==='medium'?'#92400e':'#166534'};font-weight:800">${(d.priority||'medium').toUpperCase()} | ${(d.status||'open').toUpperCase()}</span></div>
        <small style="color:#64748b">${escapeHtml(d.productCategory||'General')} | Qty: ${d.quantity} | ${new Date(d.createdAt).toLocaleDateString()}</small><br><small style="color:#475569">${escapeHtml(d.notes||'')}</small>
        ${d.fulfilledBy?'<br><small style="color:#16a34a"><i class="fas fa-check"></i> Fulfilled by Executive</small>':''}
      </div>`).join('');
  }catch(e){ console.error('V14 Demand load error', e); }
}

async function handleDemandSubmitV14(e){
  e.preventDefault();
  const managerId = currentManager?._id || currentManager?.managerCode || localStorage.getItem('managerId');
  const areaNameEl = document.getElementById('managerAreaName') || document.getElementById('areaMapName');
  const areaName = areaNameEl?.textContent?.trim() || currentManager?.areaName || currentManager?.areaCode || 'Unknown';
  const body = {
    areaManagerId: managerId,
    areaName: areaName,
    productName: document.getElementById('demandProductName')?.value?.trim(),
    productCategory: document.getElementById('demandCategory')?.value,
    quantity: Number(document.getElementById('demandQty')?.value),
    priority: document.getElementById('demandPriority')?.value || 'medium',
    notes: document.getElementById('demandNotes')?.value?.trim(),
  };
  const msgEl = document.getElementById('demandMsg');
  if(!body.productName || !body.quantity || !managerId){
    if(msgEl){ msgEl.textContent='Product Name, Qty, Manager ID required'; msgEl.style.color='red'; }
    return;
  }
  if(msgEl) msgEl.textContent='Sending demand to Executive...';
  try{
    const res = await fetch('/api/area-demand/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json());
    if(res.success){
      if(msgEl){ msgEl.textContent='✅ Demand sent to Executive! Executive will assign Product Manager product'; msgEl.style.color='green'; }
      e.target.reset();
      loadMyDemandsV14();
    } else {
      if(msgEl){ msgEl.textContent='Error: '+(res.error||'failed'); msgEl.style.color='red'; }
    }
  }catch(err){
    if(msgEl){ msgEl.textContent='Error: '+err.message; msgEl.style.color='red'; }
  }
}

function initDemandSystem(){
  const form = document.getElementById('areaDemandForm');
  if(form && !form.dataset.v14bound){
    form.dataset.v14bound='1';
    form.addEventListener('submit', handleDemandSubmitV14);
    console.log('✅ V14 Demand system bound - isolated, does not break old forms');
  }
  loadMyDemandsV14();
  // Refresh every 30 sec - isolated interval
  if(!window._demandIntervalV14){
    window._demandIntervalV14 = setInterval(loadMyDemandsV14, 30000);
  }
}

// Expose for HTML inline script fallback
window.loadMyDemandsV14 = loadMyDemandsV14;
window.initDemandSystem = initDemandSystem;
window.handleDemandSubmitV14 = handleDemandSubmitV14;

console.log('✅ V14 Product Manager Demand system loaded - 100% isolated - old logic intact');