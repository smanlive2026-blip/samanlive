// ========================================
// AREA MANAGER DASHBOARD - CLEAN VERSION
// File: /public/assets/js/area-manager.js
// Only Dashboard + Profile + Shop List + Edit
// Shop Create logic moved to shop-create.js
// ========================================

let currentManager = null;
let managerShops = [];
let categories = [];
let allManagers = [];
let allAreas = [];

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token') || localStorage.getItem('managerToken');

if (!token) {
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:20px;"><i class="fas fa-exclamation-triangle" style="font-size:64px;color:#ef4444;"></i><h1 style="color:#ef4444;">Invalid Access Link</h1><p style="color:#64748b;">Contact Admin for valid link</p></div>';
    throw new Error('No token');
}

const API = '/api';

// ========================================
// API CALL HELPER - ✅ FIXED: Auto stringify + Content-Type
// ========================================
async function apiCall(endpoint, options = {}) {
    try {
        const opts = {
            method: options.method || 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                ...options.headers 
            }
        };

        if (options.body) {
            if (options.body instanceof FormData) {
                opts.body = options.body;
            } else {
                opts.headers['Content-Type'] = 'application/json';
                opts.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
            }
        }

        const res = await fetch(API + endpoint, opts);
        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Server Response:', text);
            throw new Error('Server error: Invalid JSON response');
        }
        if (!res.ok) throw new Error(data.error || data.message || 'API Error');
        return data;
    } catch (err) {
        console.error('API Error:', err);
        throw err;
    }
}

window.apiCall = apiCall;

// ========================================
// PAGE LOAD
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Area Manager Dashboard Loading...');
    await loadDashboard();
});

async function loadDashboard() {
    try {
        console.log('Loading dashboard with token:', token);

        const dashboardRes = await apiCall(`/manager/dashboard`);
        if (!dashboardRes.success) throw new Error(dashboardRes.error || 'Invalid token');

        currentManager = dashboardRes.manager;
        const stats = dashboardRes.stats || { totalShops: 0, activeShops: 0 };
        currentManager.currentShopCount = stats.totalShops;
        currentManager.maxShops = dashboardRes.manager.maxShops || 10;

        const [shopsData, modulesData, areasRes, managersRes] = await Promise.all([
            apiCall(`/manager/shops`).catch(err => ({ shops: [] })),
            apiCall('/modules').catch(err => ({ modules: [] })),
            fetch('/api/areas').then(r => r.json()).catch(() => []),
            fetch('/api/managers').then(r => r.json()).catch(() => [])
        ]);

        managerShops = shopsData.shops || shopsData || [];
        categories = modulesData.modules || modulesData || [];
        allAreas = areasRes || [];
        allManagers = managersRes || [];

        renderProfile();
        renderStats(stats);
        renderShops(managerShops);
        renderServiceCards(categories);
        updateShopLimitUI();

        if (typeof initShopCreateModule === 'function') {
            initShopCreateModule(allManagers, allAreas, categories, currentManager);
        }

    } catch (err) {
        console.error('❌ Dashboard Error:', err);
        const errorMsg = err.message.includes('Manager not found') || err.message.includes('Invalid token')
  ? 'Session expired. Please login again.'
            : err.message;

        document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:20px;padding:20px;text-align:center;">
            <i class="fas fa-exclamation-triangle" style="font-size:64px;color:#ef4444;"></i>
            <h1 style="color:#ef4444;">Error Loading Dashboard</h1>
            <p style="color:#64748b;max-width:600px;">${errorMsg}</p>
            <button onclick="location.reload()" class="btn" style="margin-top:20px;">Retry</button>
        </div>`;
    }
}

window.loadDashboard = loadDashboard;

// ========================================
// UPDATE SHOP LIMIT UI
// ========================================
function updateShopLimitUI() {
    const limitText = `${currentManager.currentShopCount} / ${currentManager.maxShops}`;
    const limitEl = document.getElementById('shopLimitText');
    if (limitEl) limitEl.textContent = limitText;

    const createBtn = document.getElementById('createShopBtn');
    if (createBtn && currentManager.currentShopCount >= currentManager.maxShops) {
        createBtn.disabled = true;
        createBtn.innerHTML = '<i class="fas fa-ban"></i> Limit Reached';
        const badge = document.getElementById('shopLimitBadge');
        if (badge) badge.classList.add('limit-reached');
    }
}

// ========================================
// RENDER PROFILE
// ========================================
function renderProfile() {
    if (!currentManager) return;

    document.getElementById('managerName').textContent = currentManager.name || 'Manager';
    document.getElementById('managerBadge').textContent = currentManager.bucket || 'DEFAULT';
    document.getElementById('managerFullName').textContent = currentManager.name || 'Manager Name';
    document.getElementById('managerRole').textContent = 'Area Manager';
    document.getElementById('managerAreaName').textContent = currentManager.areaName || currentManager.areaCode || '-';
    document.getElementById('managerPhone').textContent = currentManager.phone || 'Not Set';
    document.getElementById('managerEmail').textContent = currentManager.email || 'Not Set';
    document.getElementById('managerLocation').textContent = `${currentManager.city || '-'}, ${currentManager.state || '-'}`;
    document.getElementById('managerRadius').textContent = currentManager.radius || '50';
    document.getElementById('areaCodeText').textContent = currentManager.areaCode || '-';
    document.getElementById('managerCodeText').textContent = currentManager.managerCode || '-';

    const avatarEl = document.getElementById('managerAvatar');
    if (currentManager.photo) {
        avatarEl.innerHTML = `<img src="${currentManager.photo}" alt="${currentManager.name}"><div class="profile-avatar-edit"><i class="fas fa-camera"></i></div>`;
    } else {
        const firstLetter = (currentManager.name || 'A').charAt(0).toUpperCase();
        avatarEl.innerHTML = `${firstLetter}<div class="profile-avatar-edit"><i class="fas fa-camera"></i></div>`;
    }
}

// ========================================
// RENDER STATS
// ========================================
function renderStats(stats) {
    const totalShops = stats?.totalShops || managerShops.length;
    const activeShops = stats?.activeShops || managerShops.filter(s => s.isActive).length;

    const totalEl = document.getElementById('totalShops');
    const activeEl = document.getElementById('activeShops');

    if (totalEl) totalEl.textContent = totalShops;
    if (activeEl) activeEl.textContent = activeShops;
}

// ========================================
// RENDER SHOPS TABLE - ✅ OPEN BUTTON ADDED
// ========================================
function renderShops(shops) {
    const tbody = document.getElementById('shopsTable');
    if (!tbody) return;

    if (shops.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 60px;"><div class="empty-state"><i class="fas fa-store-slash"></i><p>No shops created yet. Click "Create New Shop" to add one.</p></div></td></tr>';
        return;
    }
    tbody.innerHTML = shops.map(shop => {
        const shopType = shop.serviceType || shop.shopType || 'common';
        const dashboardUrl = `${window.location.origin}/shop-templates/${shopType}/dashboard.html?shopId=${shop._id}`;
        
        return `
            <tr>
                <td style="font-size: 28px;">${shop.logo? `<img src="${shop.logo}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;">` : shop.icon || '🏪'}</td>
                <td><strong>${escapeHtml(shop.shopName)}</strong></td>
                <td>${getCategoryName(shop.serviceType || shop.categoryId)}</td>
                <td>${escapeHtml(shop.ownerName || 'N/A')}</td>
                <td>${(shop.range / 1000).toFixed(0)} KM</td>
                <td><span class="badge ${shop.isActive? 'badge-success' : 'badge-danger'}">
                    <i class="fas fa-circle" style="font-size:8px;"></i> ${shop.isActive? 'Active' : 'Inactive'}
                </span></td>
                <td>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <!-- ✅ NAYA BUTTON: DIRECT OPEN -->
                        <a href="${dashboardUrl}" target="_blank" class="btn btn-small btn-primary" title="Open Dashboard">
                            <i class="fas fa-external-link-alt"></i> Open
                        </a>
                        
                        <button class="btn btn-small btn-link" onclick="copyShopLink('${shop._id}', '${shopType}', '${escapeHtml(shop.shopName)}')" title="Copy Dashboard Link">
                            <i class="fas fa-link"></i> Link
                        </button>
                        <button class="btn btn-small" onclick='editShop(${JSON.stringify(shop).replace(/'/g, "&apos;")})' title="Edit Shop">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.copyShopLink = function(shopId, shopType, shopName) {
    const finalShopType = shopType || 'common';
    const shopLink = `${window.location.origin}/shop-templates/${finalShopType}/dashboard.html?shopId=${shopId}`;
    
    navigator.clipboard.writeText(shopLink).then(() => {
        alert(`✅ Dashboard link copied!\n\nShop: ${shopName}\n\nLink: ${shopLink}\n\nAb ye link shop owner ko bhej do.`);
    }).catch(err => {
        prompt('Copy this link:', shopLink);
    });
}

// ========================================
// RENDER SERVICE CARDS
// ========================================
function renderServiceCards(cats) {
    const container = document.getElementById('serviceCards');
    if (!container) return;

    if (!cats || cats.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No services assigned yet. Contact admin.</p></div>';
        return;
    }
    container.innerHTML = cats.map(c => `
        <div class="service-card">
            <div class="icon">${c.icon || '📦'}</div>
            <div class="name">${escapeHtml(c.name)}</div>
        </div>
    `).join('');
}

// ========================================
// PROFILE MODAL
// ========================================
function openProfileModal() {
    document.getElementById('profileModal').classList.add('active');
    document.getElementById('profileName').value = currentManager.name || '';
    document.getElementById('profilePhone').value = currentManager.phone || '';
    document.getElementById('profileEmail').value = currentManager.email || '';
    document.getElementById('profileAreaName').value = currentManager.areaName || currentManager.areaCode || '';

    const photoPreview = document.getElementById('photoPreview');
    if (currentManager.photo) {
        photoPreview.innerHTML = `<img src="${currentManager.photo}" alt="Profile">`;
        document.getElementById('profilePhotoBase64').value = currentManager.photo;
    } else {
        photoPreview.innerHTML = `<i class="fas fa-user" style="font-size:48px;"></i>`;
        document.getElementById('profilePhotoBase64').value = '';
    }
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('active');
}

function previewProfilePhoto(event) {
    event.preventDefault();
    event.stopPropagation();
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
        alert('Image size should be less than 500KB. Please compress it.');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('photoPreview').innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        document.getElementById('profilePhotoBase64').value = e.target.result;
    };
    reader.readAsDataURL(file);
}

document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('profileSaveBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            const profileData = {
                name: document.getElementById('profileName').value,
                phone: document.getElementById('profilePhone').value,
                email: document.getElementById('profileEmail').value,
                photo: document.getElementById('profilePhotoBase64').value || currentManager.photo
            };

            try {
                const data = await apiCall(`/manager/update-profile`, {
                    method: 'PUT',
                    body: profileData
                });
                if (data.success) {
                    alert('✅ Profile updated successfully!');
                    currentManager = data.manager;
                    renderProfile();
                    closeProfileModal();
                } else {
                    alert(data.error || 'Error updating profile');
                }
            } catch (err) {
                alert('Error: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-save"></i> Save Profile';
            }
        });
    }
});

// ========================================
// SHOP EDIT MODAL
// ========================================
function openShopModal(shop = null) {
    document.getElementById('shopModal').classList.add('active');
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Shop Details';

    const catSelect = document.getElementById('shopCategory');
    if (catSelect) {
        catSelect.innerHTML = categories.map(c => `<option value="${c.id || c._id}">${c.icon} ${c.name}</option>`).join('');
    }

    if (shop) {
        document.getElementById('shopId').value = shop._id;
        document.getElementById('shopName').value = shop.shopName;
        document.getElementById('shopIcon').value = shop.icon || '🏪';
        document.getElementById('shopCategory').value = shop.serviceType || shop.categoryId;
        document.getElementById('shopPhone').value = shop.phone || '';
        document.getElementById('shopAddress').value = shop.address?.line1 || shop.address || '';
        document.getElementById('shopRange').value = shop.range || 5000;
        document.getElementById('shopStatus').value = shop.isActive? 'true' : 'false';
        document.getElementById('shopDesc').value = shop.description || '';
        document.getElementById('shopLat').value = shop.location?.coordinates[1] || shop.lat || '';
        document.getElementById('shopLng').value = shop.location?.coordinates[0] || shop.lng || '';
    }
}

function closeShopModal() {
    document.getElementById('shopModal').classList.remove('active');
}

function editShop(shop) {
    openShopModal(shop);
}

document.addEventListener('DOMContentLoaded', () => {
    const shopForm = document.getElementById('shopForm');
    if (shopForm) {
        shopForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('shopSaveBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

            const shopId = document.getElementById('shopId').value;

            const shopData = {
                shopName: document.getElementById('shopName').value,
                icon: document.getElementById('shopIcon').value || '🏪',
                serviceType: document.getElementById('shopCategory').value,
                categoryId: document.getElementById('shopCategory').value,
                phone: document.getElementById('shopPhone').value,
                address: {
                    line1: document.getElementById('shopAddress').value
                },
                range: parseInt(document.getElementById('shopRange').value),
                isActive: document.getElementById('shopStatus').value === 'true',
                description: document.getElementById('shopDesc').value
            };

            try {
                const data = await apiCall(`/manager/shops/${shopId}`, {
                    method: 'PUT',
                    body: shopData
                });
                if (data.success) {
                    alert('✅ Shop updated successfully!');
                    closeShopModal();
                    loadDashboard();
                } else {
                    alert(data.error || 'Error updating shop');
                }
            } catch (err) {
                alert('Error: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-save"></i> Update Shop';
            }
        });
    }
});

// ========================================
// UTILITIES
// ========================================
function getCategoryName(id) {
    const cat = categories.find(c => c.id === id || c._id === id || c.name === id);
    return cat? cat.name : id || '-';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// ========== NAYE 4 FUNCTION YAHI ADD KIYE ==========
function openProductLibrary() {
    document.getElementById('libraryPopup').classList.add('active');
}
function closeProductLibrary() {
    document.getElementById('libraryPopup').classList.remove('active');
}
function openOrderView() { alert('Order View - Coming Soon'); }
function openManagerPanel() { alert('Manager Panel - Coming Soon'); }

window.addEventListener('message', (event) => {
    if(event.data.type === 'ADD_FROM_LIBRARY') {
        console.log('Product Selected:', event.data);
        alert(`Selected: ${event.data.name}`);
        closeProductLibrary();
    }
});
// ========== END NAYE FUNCTION ==========

// Export functions to window for onclick handlers
window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.previewProfilePhoto = previewProfilePhoto;
window.editShop = editShop;
window.closeShopModal = closeShopModal;
window.openProductLibrary = openProductLibrary;
window.closeProductLibrary = closeProductLibrary;
window.openOrderView = openOrderView;
window.openManagerPanel = openManagerPanel;

console.log('✅ area-manager.js loaded - Shop create logic moved to shop-create.js');