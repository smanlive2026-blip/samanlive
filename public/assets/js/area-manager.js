// ========================================
// AREA MANAGER DASHBOARD - FINAL JS
// File: /public/assets/js/area-manager.js
// No Claim System - Direct Shop Create Only
// ========================================

let currentManager = null;
let managerShops = [];
let categories = [];

// CREATE SHOP VARIABLES
let selectedIcon = '🏪';
let uploadedLogoBase64 = null;

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token') || localStorage.getItem('managerToken');

if (!token) {
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:20px;"><i class="fas fa-exclamation-triangle" style="font-size:64px;color:#ef4444;"></i><h1 style="color:#ef4444;">Invalid Access Link</h1><p style="color:#64748b;">Contact Admin for valid link</p></div>';
    throw new Error('No token');
}

const API = '/api';

// ========================================
// API CALL HELPER
// ========================================
async function apiCall(endpoint, options = {}) {
    try {
        const opts = {
            method: options.method || 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        };

        if (options.body &&!(options.body instanceof FormData)) {
            opts.headers['Content-Type'] = 'application/json';
            opts.body = options.body;
        } else if (options.body) {
            opts.body = options.body;
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
        if (!res.ok) throw new Error(data.error || 'API Error');
        return data;
    } catch (err) {
        console.error('API Error:', err);
        throw err;
    }
}

// ========================================
// PAGE LOAD
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Area Manager Dashboard Loading...');
    await loadDashboard();
    initIconPicker();
});

async function loadDashboard() {
    try {
        console.log('Loading dashboard with token:', token);

        const dashboardRes = await apiCall(`/manager/dashboard`);
        console.log('📦 Dashboard API Response:', dashboardRes);

        if (!dashboardRes.success) throw new Error(dashboardRes.error || 'Invalid token');

        currentManager = dashboardRes.manager;
        const stats = dashboardRes.stats || { totalShops: 0, activeShops: 0 };
        currentManager.currentShopCount = stats.totalShops;
        currentManager.maxShops = dashboardRes.manager.maxShops || 10;

        console.log('👤 Manager Data:', currentManager);

        const [shopsData, modulesData] = await Promise.all([
            apiCall(`/manager/shops`).catch(err => {
                console.error('Shops API Error:', err);
                return { shops: [] };
            }),
            apiCall('/modules').catch(err => {
                console.error('Modules API Error:', err);
                return { modules: [] };
            })
        ]);

        console.log('📦 Shops API Response:', shopsData);

        managerShops = shopsData.shops || shopsData || [];
        categories = modulesData.modules || modulesData || [];

        renderProfile();
        renderStats(stats);
        renderShops(managerShops);
        renderServiceCards(categories);
        updateShopLimitUI();

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
// CREATE SHOP FUNCTIONS - SIMPLIFIED
// ========================================
function openCreateShopModal() {
    if (currentManager.currentShopCount >= currentManager.maxShops) {
        alert(`Shop limit reached! Max allowed: ${currentManager.maxShops}\n\nContact admin to increase limit.`);
        return;
    }
    document.getElementById('createShopModal').classList.add('active');
    resetCreateShopForm();
    loadShopModules();
}

function closeCreateShopModal() {
    document.getElementById('createShopModal').classList.remove('active');
    const form = document.getElementById('createShopForm');
    if (form) form.reset();
    removeLogo();
}

// ========================================
// ICON PICKER
// ========================================
function initIconPicker() {
    const iconPicker = document.getElementById('iconPicker');
    if (iconPicker) {
        iconPicker.addEventListener('click', (e) => {
            if (e.target.classList.contains('icon-option')) {
                document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
                e.target.classList.add('selected');
                selectedIcon = e.target.dataset.icon;
            }
        });
    }
}

// ========================================
// LOGO UPLOAD
// ========================================
function previewLogo(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        uploadedLogoBase64 = e.target.result;
        document.getElementById('logoPreview').innerHTML = `<img src="${uploadedLogoBase64}" alt="Shop Logo">`;
        document.getElementById('removeLogoBtn').style.display = 'inline-block';
        document.getElementById('iconPicker').style.opacity = '0.3';
    };
    reader.readAsDataURL(file);
}

function removeLogo() {
    uploadedLogoBase64 = null;
    const logoInput = document.getElementById('shopLogoInput');
    if (logoInput) logoInput.value = '';
    document.getElementById('logoPreview').innerHTML = `
        <i class="fa fa-camera"></i>
        <p>Upload Shop Photo</p>
        <span style="font-size: 12px; color: #64748b;">JPG, PNG • Max 2MB</span>
    `;
    document.getElementById('removeLogoBtn').style.display = 'none';
    document.getElementById('iconPicker').style.opacity = '1';
}

// ========================================
// LOAD SHOP MODULES
// ========================================
function loadShopModules() {
    const moduleSelect = document.getElementById('createShopType');
    if (!moduleSelect) return;

    moduleSelect.innerHTML = '<option value="">Select Shop Type</option>';

    if (categories && categories.length > 0) {
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name || cat.id;
            option.textContent = `${cat.icon || '📦'} ${cat.name}`;
            moduleSelect.appendChild(option);
        });
    } else {
        const fallback = [
            {id: 'kirana', name: 'Kirana/Grocery Store', icon: '🛒'},
            {id: 'cloth', name: 'Cloth/Garment Shop', icon: '👗'},
            {id: 'medical', name: 'Medical Store', icon: '💊'},
            {id: 'restaurant', name: 'Restaurant/Cafe', icon: '🍕'},
            {id: 'electronics', name: 'Electronics Shop', icon: '📱'},
            {id: 'hardware', name: 'Hardware Store', icon: '🔧'},
            {id: 'salon', name: 'Salon/Beauty Parlour', icon: '💇'},
            {id: 'stationery', name: 'Stationery Shop', icon: '🎓'},
            {id: 'service', name: 'Service Provider', icon: '🔧'},
            {id: 'rental', name: 'Rental Shop', icon: '🚗'},
            {id: 'common', name: 'Common Shop - General', icon: '🏪'}
        ];
        fallback.forEach(m => {
            const option = document.createElement('option');
            option.value = m.id;
            option.textContent = `${m.icon} ${m.name}`;
            moduleSelect.appendChild(option);
        });
    }
}

// ========================================
// SUBMIT SHOP - SIMPLE VERSION NO GPS
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const createForm = document.getElementById('createShopForm');
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('createShopSaveBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

            const shopModule = document.getElementById('createShopType').value;
            const range = parseInt(document.getElementById('createShopRange').value);

            const shopTypeMap = {
                'kirana': 'product', 'cloth': 'fashion', 'medical': 'product',
                'restaurant': 'food', 'electronics': 'product', 'hardware': 'product',
                'salon': 'service', 'stationery': 'product', 'service': 'service',
                'rental': 'rental', 'common': 'product'
            };

            // ✅ SIMPLE SHOP DATA - No location needed
            const shopData = {
                shopName: document.getElementById('createShopName').value.trim(),
                ownerName: document.getElementById('createShopOwnerName').value.trim(),
                phone: document.getElementById('createShopPhone').value.trim(),
                email: document.getElementById('createShopEmail').value.trim() || '',
                address: {
                    line1: document.getElementById('createShopAddress').value.trim() || currentManager.areaName,
                    line2: '',
                    city: currentManager.city,
                    state: currentManager.state,
                    pincode: currentManager.pincode || ''
                },
                areaCode: currentManager.areaCode,
                bucket: currentManager.bucket,
                area: currentManager.areaCode,
                areaName: currentManager.areaName,
                serviceType: shopTypeMap[shopModule] || 'product',
                shopType: shopTypeMap[shopModule] || 'product',
                description: document.getElementById('createShopDesc').value.trim() || `Shop created by Area Manager: ${currentManager.name}`,
                range: range,
                icon: selectedIcon,
                logo: uploadedLogoBase64 || '',
                banner: '',
                status: 'approved',
                isVerified: true,
                isActive: true,
                locationType: 'fixed',
                // ✅ Default location from manager - update later from shop dashboard
                location: {
                    type: 'Point',
                    coordinates: [currentManager.centerLng, currentManager.centerLat]
                },
                managerCodes: [currentManager.managerCode]
            };

            console.log('📤 Creating Shop:', shopData);

            if (!shopData.shopName ||!shopData.phone ||!shopModule ||!shopData.ownerName) {
                alert('Please fill Shop Name, Owner Name, Phone Number and Shop Type!');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-plus"></i> Create Shop';
                return;
            }

            try {
                const res = await apiCall('/manager/create-shop', {
                    method: 'POST',
                    body: JSON.stringify(shopData)
                });

                if (res.success) {
                    alert('✅ Shop created successfully!\n\nShop is now active. Location can be updated from shop dashboard.');
                    closeCreateShopModal();
                    loadDashboard();
                } else {
                    alert('❌ Error: ' + res.error);
                }
            } catch (err) {
                alert('❌ Failed to create shop: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-plus"></i> Create Shop';
            }
        });
    }
});

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
// RENDER SHOPS TABLE
// ========================================
function renderShops(shops) {
    const tbody = document.getElementById('shopsTable');
    if (!tbody) return;

    if (shops.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 60px;"><div class="empty-state"><i class="fas fa-store-slash"></i><p>No shops created yet. Click "Create New Shop" to add one.</p></div></td></tr>';
        return;
    }
    tbody.innerHTML = shops.map(shop => {
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
                    <button class="btn btn-small" onclick='editShop(${JSON.stringify(shop).replace(/'/g, "&apos;")})'>
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </td>
            </tr>
        `;
    }).join('');
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
                    body: JSON.stringify(profileData)
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
                    body: JSON.stringify(shopData)
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
// RESET FORM
// ========================================
function resetCreateShopForm() {
    document.getElementById('createShopName').value = '';
    document.getElementById('createShopOwnerName').value = '';
    document.getElementById('createShopType').value = '';
    document.getElementById('createShopPhone').value = '';
    document.getElementById('createShopEmail').value = '';
    document.getElementById('createShopAddress').value = '';
    document.getElementById('createShopDesc').value = '';
    document.getElementById('createShopRange').value = '5000';

    selectedIcon = '🏪';
    document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
    const defaultIcon = document.querySelector('.icon-option[data-icon="🏪"]');
    if (defaultIcon) defaultIcon.classList.add('selected');
    removeLogo();
}

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

// Export functions to window for onclick handlers
window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.previewProfilePhoto = previewProfilePhoto;
window.openCreateShopModal = openCreateShopModal;
window.closeCreateShopModal = closeCreateShopModal;
window.previewLogo = previewLogo;
window.removeLogo = removeLogo;
window.editShop = editShop;
window.closeShopModal = closeShopModal;