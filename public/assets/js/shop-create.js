// ========================================
// SHOP CREATE MODULE - CATEGORY BASED
// File: /public/assets/js/shop-create.js
// Match with old create-shop.html
// ========================================

let createShopSelectedIcon = '🏪';
let createShopUploadedLogoBase64 = null;
let createShopSelectedManagerCodes = [];
let createShopAllManagers = [];
let createShopAllAreas = [];
let createShopDetectedCity = null;
let createShopCategories = [];

// ========================================
// INIT - Called from area-manager.js
// ========================================
function initShopCreateModule(managers, areas, categories, currentManager) {
    createShopAllManagers = managers || [];
    createShopAllAreas = areas || [];
    createShopCategories = categories || [];
    window.createShopCurrentManager = currentManager;
    
    console.log('✅ Shop Create Module Initialized', currentManager);
    initCreateShopIconPicker();
    initCreateShopForm();
}

// ========================================
// OPEN MODAL
// ========================================
window.openCreateShopModal = function() {
    if (window.createShopCurrentManager.currentShopCount >= window.createShopCurrentManager.maxShops) {
        alert(`Shop limit reached! Max allowed: ${window.createShopCurrentManager.maxShops}\n\nContact admin to increase limit.`);
        return;
    }
    document.getElementById('createShopModal').classList.add('active');
    resetCreateShopForm();
    loadCreateShopModules();
    autoFillCreateShopArea();
    initCreateShopIconPicker();
}

window.closeCreateShopModal = function() {
    document.getElementById('createShopModal').classList.remove('active');
    const form = document.getElementById('createShopForm');
    if (form) form.reset();
    removeCreateShopLogo();
}

// ========================================
// ICON PICKER
// ========================================
function initCreateShopIconPicker() {
    const iconPicker = document.getElementById('createShopIconPicker');
    if (iconPicker) {
        const newPicker = iconPicker.cloneNode(true);
        iconPicker.parentNode.replaceChild(newPicker, iconPicker);
        
        newPicker.addEventListener('click', (e) => {
            if (e.target.classList.contains('icon-option')) {
                newPicker.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
                e.target.classList.add('selected');
                createShopSelectedIcon = e.target.dataset.icon;
                console.log('✅ Icon selected:', createShopSelectedIcon);
            }
        });
    }
}

// ========================================
// LOGO UPLOAD
// ========================================
window.previewCreateShopLogo = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        createShopUploadedLogoBase64 = e.target.result;
        document.getElementById('createShopLogoPreview').innerHTML = `<img src="${createShopUploadedLogoBase64}" alt="Shop Logo">`;
        document.getElementById('createShopRemoveLogoBtn').style.display = 'inline-block';
        const iconPicker = document.getElementById('createShopIconPicker');
        iconPicker.style.opacity = '0.3';
        iconPicker.style.pointerEvents = 'none';
    };
    reader.readAsDataURL(file);
}

window.removeCreateShopLogo = function() {
    createShopUploadedLogoBase64 = null;
    const logoInput = document.getElementById('createShopLogoInput');
    if (logoInput) logoInput.value = '';
    document.getElementById('createShopLogoPreview').innerHTML = `
        <i class="fa fa-camera"></i>
        <p>Upload Shop Photo</p>
        <span style="font-size: 12px; color: #64748b;">JPG, PNG • Max 2MB</span>
    `;
    document.getElementById('createShopRemoveLogoBtn').style.display = 'none';
    const iconPicker = document.getElementById('createShopIconPicker');
    iconPicker.style.opacity = '1';
    iconPicker.style.pointerEvents = 'auto';
}

// ========================================
// LOAD SHOP MODULES
// ========================================
function loadCreateShopModules() {
    const moduleSelect = document.getElementById('createShopModule');
    if (!moduleSelect) return;

    moduleSelect.innerHTML = '<option value="">Select Shop Category</option>';

    const shopTemplates = [
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
    
    shopTemplates.forEach(m => {
        const option = document.createElement('option');
        option.value = m.id;
        option.textContent = `${m.icon} ${m.name}`;
        moduleSelect.appendChild(option);
    });
    
    console.log('✅ Loaded Shop Templates:', shopTemplates.length);
}

// ========================================
// AUTO FILL AREA DATA
// ========================================
function autoFillCreateShopArea() {
    const manager = window.createShopCurrentManager;
    if (!manager) {
        console.error('❌ Manager data not found!');
        alert('⚠️ Manager data not found! Please reload page.');
        return;
    }

    document.getElementById('createShopCity').value = manager.city || 'Surat';
    document.getElementById('createShopState').value = manager.state || 'Gujarat';
    document.getElementById('createShopPincode').value = manager.pincode || '';
    
    createShopSelectedManagerCodes = [manager.managerCode];
    document.getElementById('createShopManagerCodes').value = JSON.stringify(createShopSelectedManagerCodes);
    
    const cityBox = document.getElementById('createShopCityBox');
    if (cityBox) {
        cityBox.style.display = 'flex';
        document.getElementById('createShopDetectedCityName').textContent = `📍 ${manager.city}`;
        document.getElementById('createShopDetectedCityMeta').textContent = `${manager.name} • ${manager.managerCode} (Auto-connected)`;
    }
    
    const managerList = document.getElementById('createShopManagerList');
    const countText = document.getElementById('createShopManagerCountText');
    const selectAllBtn = document.querySelector('.select-all-btn');
    
    if (managerList) {
        managerList.innerHTML = `
            <div class="manager-item selected" style="cursor: default; background: #eef2ff; border-color: #667eea; pointer-events: none;">
                <input type="checkbox" checked disabled>
                <div class="manager-item-info">
                    <div class="manager-item-name">
                        ${escapeHtml(manager.name)} 
                        <span style="color:#10b981;font-size:11px;font-weight:700;">(You)</span>
                    </div>
                    <div class="manager-item-meta">
                        Code: <b>${manager.managerCode}</b> • City: ${escapeHtml(manager.city)} • ${manager.radius || 50}KM • Auto-connected
                    </div>
                </div>
            </div>
        `;
    }
    if (countText) {
        countText.textContent = `1 Manager Auto-connected`;
    }
    if (selectAllBtn) {
        selectAllBtn.style.display = 'none';
    }
    
    console.log('✅ Auto-connected to:', manager.managerCode, manager.name);
}

// ========================================
// DISABLED FUNCTIONS
// ========================================
function loadCreateShopCityManagers(city) {
    console.log('✅ Skipped: Auto-connected to current manager only');
    return;
}

window.toggleCreateShopManager = function(managerCode) {
    console.log('⚠️ Manager selection disabled. Auto-connected to current manager.');
    alert('Shop will be auto-connected to your account.\n\nManager: ' + window.createShopCurrentManager.name);
    return;
}

window.toggleSelectAllCreateShopManagers = function() {
    console.log('⚠️ Manager selection disabled. Auto-connected to current manager.');
    return;
}

function updateCreateShopManagerCountText() {
    const count = createShopSelectedManagerCodes.length;
    const countEl = document.getElementById('createShopManagerCountText');
    if (countEl) {
        countEl.textContent = count === 0 ? 'No managers selected' : `1 Manager Auto-connected`;
    }
}

// ========================================
// SUBMIT SHOP - ✅ FIXED: Proper Validation
// ========================================
function initCreateShopForm() {
    const createForm = document.getElementById('createShopForm');
    if (!createForm) return;
    
    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = document.getElementById('createShopSaveBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

        const shopModule = document.getElementById('createShopModule').value;
        const range = parseInt(document.getElementById('createShopRange').value);
        const phoneNumber = document.getElementById('createShopPhone').value.trim();
        const shopAddress = document.getElementById('createShopAddress').value.trim();
        const ownerName = document.getElementById('createShopOwnerName').value.trim();
        const shopName = document.getElementById('createShopName').value.trim();
        const manager = window.createShopCurrentManager;

        // ✅ VALIDATION - Pehle check karo
        if (!shopName) {
            alert('❌ Please enter Shop Name');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-plus"></i> Create Shop';
            return;
        }
        if (!ownerName) {
            alert('❌ Please enter Owner Name');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-plus"></i> Create Shop';
            return;
        }
        if (!phoneNumber || phoneNumber.length !== 10) {
            alert('❌ Please enter valid 10-digit Phone Number');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-plus"></i> Create Shop';
            return;
        }
        if (!shopModule) {
            alert('❌ Please select Shop Category');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-plus"></i> Create Shop';
            return;
        }
        if (!shopAddress) {
            alert('❌ Please enter Shop Address');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-plus"></i> Create Shop';
            return;
        }

        const shopTypeMap = {
            'kirana': 'product', 'cloth': 'fashion', 'medical': 'product',
            'restaurant': 'food', 'electronics': 'product', 'hardware': 'product',
            'salon': 'service', 'stationery': 'product', 'service': 'service',
            'rental': 'rental', 'common': 'product'
        };

        const validManagers = [manager.managerCode];
        const areaCode = manager.areaCode || manager.managerCode.replace('-DEFAULT', '').trim();
        const areaData = createShopAllAreas.find(a => a.areaCode === areaCode);
        const areaName = areaData?.areaName || manager.name || manager.city;
        const bucket = manager.bucket || 'DEFAULT'; // ✅ Fallback to DEFAULT

        const shopData = {
            shopName: shopName,
            ownerName: ownerName, // ✅ Required
            phone: phoneNumber, // ✅ Required
            email: document.getElementById('createShopEmail').value.trim() || '',
            address: shopAddress,
            city: manager.city || 'Surat',
            state: manager.state || 'Gujarat',
            pincode: manager.pincode || '',
            areaCode: areaCode,
            bucket: bucket, // ✅ Required
            area: areaCode,
            areaName: areaName,
            serviceType: shopModule, // ✅ Required
            shopType: shopTypeMap[shopModule] || 'product',
            description: document.getElementById('createShopDesc').value.trim() || `Shop created by Area Manager: ${manager.name}`,
            range: range,
            icon: createShopSelectedIcon,
            logo: createShopUploadedLogoBase64 || '',
            banner: '',
            status: 'approved',
            isVerified: true,
            isActive: true,
            locationType: 'fixed',
            location: {
                type: 'Point',
                coordinates: [manager.centerLng || 72.8311, manager.centerLat || 21.1702]
            },
            managerCodes: validManagers
        };

        console.log('📤 Creating Shop:', shopData);

        try {
            const res = await window.apiCall('/manager/create-shop', {
                method: 'POST',
                body: JSON.stringify(shopData)
            });

            if (res.success) {
                alert(`✅ Shop created successfully!\n\nShop "${shopData.shopName}" is now LIVE in ${areaName}!`);
                closeCreateShopModal();
                window.loadDashboard();
            } else {
                alert('❌ Error: ' + (res.error || 'Failed to create shop'));
            }
        } catch (err) {
            console.error('Submit Error:', err);
            alert('❌ Failed to create shop: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-plus"></i> Create Shop';
        }
    });
}

// ========================================
// RESET FORM
// ========================================
function resetCreateShopForm() {
    document.getElementById('createShopName').value = '';
    document.getElementById('createShopOwnerName').value = '';
    document.getElementById('createShopModule').value = '';
    document.getElementById('createShopPhone').value = '';
    document.getElementById('createShopEmail').value = '';
    document.getElementById('createShopAddress').value = '';
    document.getElementById('createShopDesc').value = '';
    document.getElementById('createShopRange').value = '5000';

    createShopSelectedIcon = '🏪';
    document.querySelectorAll('#createShopIconPicker .icon-option').forEach(el => el.classList.remove('selected'));
    const defaultIcon = document.querySelector('#createShopIconPicker .icon-option[data-icon="🏪"]');
    if (defaultIcon) defaultIcon.classList.add('selected');
    removeCreateShopLogo();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

console.log('✅ shop-create.js loaded - Auto-connected to Current Manager Only');