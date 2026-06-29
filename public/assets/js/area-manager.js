// ========================================
// AREA MANAGER DASHBOARD - COMPLETE JS
// Matches area-manager.html IDs
// ========================================

let currentManager = null;
let managerShops = [];
let categories = [];

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (!token) {
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:20px;"><i class="fas fa-exclamation-triangle" style="font-size:64px;color:#ef4444;"></i><h1 style="color:#ef4444;">Invalid Access Link</h1><p style="color:#64748b;">Contact Admin for valid link</p></div>';
    throw new Error('No token');
}

const API = '/api';

// ========================================
// API CALL HELPER
// ========================================
async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const opts = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        if (body &&!(body instanceof FormData)) {
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(body);
        } else if (body) {
            opts.body = body;
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
});

async function loadDashboard() {
    try {
        console.log('Loading dashboard with token:', token);

        // 1. Load manager data
        const managerRes = await apiCall(`/manager-by-token/${token}`);
        console.log('Manager response:', managerRes);

        if (!managerRes.success) throw new Error(managerRes.error || 'Invalid token');
        currentManager = managerRes.manager;

        console.log('👤 Manager Data:', currentManager);
        console.log('🏷️ Manager Code:', currentManager.managerCode);

        // 2. Load shops & categories parallel - ✅ YAHI LINE CHANGE KI HAI
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

        // 3. Render everything
        renderProfile();
        renderStats();
        renderShops(managerShops);
        renderServiceCards(categories);

    } catch (err) {
        console.error('Dashboard Error:', err);
        document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:20px;padding:20px;text-align:center;"><i class="fas fa-exclamation-triangle" style="font-size:64px;color:#ef4444;"></i><h1 style="color:#ef4444;">Error Loading Dashboard</h1><p style="color:#64748b;max-width:600px;">${err.message}</p><p style="color:#64748b;font-size:14px;">Check console (F12) for details.</p><button onclick="location.reload()" class="btn" style="margin-top:20px;">Retry</button></div>`;
    }
}

// ========================================
// RENDER PROFILE
// ========================================
function renderProfile() {
    // Header
    document.getElementById('managerName').textContent = currentManager.name || 'Manager';
    document.getElementById('managerBadge').textContent = currentManager.bucket || 'DEFAULT';

    // Profile Card
    document.getElementById('managerFullName').textContent = currentManager.name || 'Manager Name';
    document.getElementById('managerRole').textContent = 'Area Manager';
    document.getElementById('managerAreaName').textContent = currentManager.areaName || currentManager.areaCode || '-';
    document.getElementById('managerPhone').textContent = currentManager.phone || 'Not Set';
    document.getElementById('managerEmail').textContent = currentManager.email || 'Not Set';
    document.getElementById('managerLocation').textContent = `${currentManager.city || '-'}, ${currentManager.state || '-'}`;
    document.getElementById('managerRadius').textContent = currentManager.radius || '50';

    // Stats
    document.getElementById('areaCodeText').textContent = currentManager.areaCode || '-';
    document.getElementById('managerCodeText').textContent = currentManager.managerCode || '-';

    // Avatar
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
function renderStats() {
    const totalShops = managerShops.length;
    const activeShops = managerShops.filter(s => s.isActive).length;

    document.getElementById('totalShops').textContent = totalShops;
    document.getElementById('activeShops').textContent = activeShops;

    console.log('📊 Stats:', { totalShops, activeShops });
}

// ========================================
// RENDER SHOPS TABLE
// ========================================
function renderShops(shops) {
    const tbody = document.getElementById('shopsTable');

    if (shops.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 60px;"><div class="empty-state"><i class="fas fa-store-slash"></i><p>Aapke circle me koi shop nahi hai.</p><p style="font-size:12px;color:#64748b;margin-top:8px;">Manager Code: <b>' + currentManager.managerCode + '</b></p></div></td></tr>';
        return;
    }

    tbody.innerHTML = shops.map(shop => {
        const distance = shop.distance || calculateDistance(
            currentManager.location?.coordinates[1] || currentManager.lat,
            currentManager.location?.coordinates[0] || currentManager.lng,
            shop.location?.coordinates[1] || shop.lat,
            shop.location?.coordinates[0] || shop.lng
        ).toFixed(1);

        return `
            <tr>
                <td style="font-size: 28px;">${shop.icon || '🏪'}</td>
                <td><strong>${escapeHtml(shop.shopName)}</strong></td>
                <td>${getCategoryName(shop.serviceType || shop.categoryId)}</td>
                <td><span class="distance-badge"><i class="fas fa-map-marker-alt"></i> ${distance} km</span></td>
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

document.getElementById('profileForm').addEventListener('submit', async (e) => {
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
        const data = await apiCall(`/manager/update-profile`, 'PUT', profileData);
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

// ========================================
// SHOP EDIT MODAL
// ========================================
function openShopModal(shop = null) {
    document.getElementById('shopModal').classList.add('active');
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Shop Details';

    const catSelect = document.getElementById('shopCategory');
    catSelect.innerHTML = categories.map(c => `<option value="${c.id || c._id}">${c.icon} ${c.name}</option>`).join('');

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

document.getElementById('shopForm').addEventListener('submit', async (e) => {
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
        const data = await apiCall(`/manager/shops/${shopId}`, 'PUT', shopData);
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

// ========================================
// UTILITIES
// ========================================
function getCategoryName(id) {
    const cat = categories.find(c => c.id === id || c._id === id || c.name === id);
    return cat? cat.name : id || '-';
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 ||!lon1 ||!lat2 ||!lon2) return 0;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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