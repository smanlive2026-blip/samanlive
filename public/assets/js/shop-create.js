// ========================================
// SHOP CREATE MODULE - CATEGORY BASED
// File: /public/assets/js/shop-create.js
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
    if (!window.createShopCurrentManager) {
        alert('Session expired! Please reload page.');
        return;
    }
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
// LOGO UPLOAD - ✅ FIXED: 2MB check
// ========================================
window.previewCreateShopLogo = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // ✅ 2MB = 2097152 bytes
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
// AUTO FILL AREA DATA - ✅ UNDEFINED FIX
// ========================================
function autoFillCreateShopArea() {
    const manager = window.createShopCurrentManager;

    if (!manager ||!manager.managerCode) {
        console.error('❌ Manager data not found!', manager);
        alert('⚠️ Session expired! Please reload page.');
        return;
    }

    // ✅ HARD FALLBACKS - Undefined kabhi nahi jayega
    const city = manager.city || 'Surat';
    const state = manager.state || 'Gujarat';
    const pincode = manager.pincode || '395007';
    const bucket = manager.bucket || 'DEFAULT';
    const managerCode = manager.managerCode || 'SURAGU-3-DEFAULT';
    const name = manager.name || 'Area Manager';
    const radius = manager.radius || 50;

    document.getElementById('createShopCity').value = city;
    document.getElementById('createShopState').value = state;
    document.getElementById('createShopPincode').value = pincode;

    createShopSelectedManagerCodes = [managerCode];
    document.getElementById('createShopManagerCodes').value = JSON.stringify(createShopSelectedManagerCodes);

    // ✅ Fix undefined issue
    const cityBox = document.getElementById('createShopCityBox');
    if (cityBox) {
        cityBox.style.display = 'flex';
        document.getElementById('createShopDetectedCityName').textContent = `📍 ${city}`;
        document.getElementById('createShopDetectedCityMeta').textContent = `${name} • ${managerCode} (Auto-connected)`;
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
                        ${escapeHtml(name)}
                        <span style="color:#10b981;font-size:11px;font-weight:700;">(You)</span>
                    </div>
                    <div class="manager-item-meta">
                        Code: <b>${managerCode}</b> • City: ${escapeHtml(city)} • ${radius}KM • Auto-connected
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

    console.log('✅ Auto-connected with fallbacks:', { city, state, pincode, bucket, managerCode, name });
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
        countEl.textContent = count === 0? 'No managers selected' : `1 Manager Auto-connected`;
    }
}

// ========================================
// SUBMIT SHOP - ✅ FIXED: shopId wala dashboard link
// ========================================
function initCreateShopForm() {
    const createForm = document.getElementById('createShopForm');
    if (!createForm) return;

    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = document.getElementById('createShopSaveBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

        // ✅ GET VALUES + SANITIZE PHONE
        const shopName = document.getElementById('createShopName').value.trim();
        const ownerName = document.getElementById('createShopOwnerName').value.trim();
        const phoneNumber = document.getElementById('createShopPhone').value.trim().replace(/\D/g, '');
        const shopModule = document.getElementById('createShopModule').value;
        const shopAddress = document.getElementById('createShopAddress').value.trim();
        const range = parseInt(document.getElementById('createShopRange').value);
        const manager = window.createShopCurrentManager;

        console.log('🔍 RAW Values:', { shopName, ownerName, phoneNumber, shopModule, shopAddress, range });

        // ✅ STRICT VALIDATION
        if (!shopName) return showError('Shop Name dalna zaroori hai!', 'createShopName', btn);
        if (!ownerName) return showError('Owner Name dalna zaroori hai!', 'createShopOwnerName', btn);
        if (!phoneNumber || phoneNumber.length!== 10) {
            return showError('10 digit Phone Number dalna zaroori hai!', 'createShopPhone', btn);
        }
        if (!shopModule) return showError('Shop Category select karna zaroori hai!', 'createShopModule', btn);
        if (!shopAddress) return showError('Shop Address dalna zaroori hai!', 'createShopAddress', btn);
        if (!manager?.managerCode) return showError('Session expired! Page reload karo.', null, btn);

        // ✅ BACKEND /manager/create-shop-v2 YEHI 7 FIELDS EXPECT KARTA HAI
        const shopData = {
            shopName: shopName,
            ownerName: ownerName,       // ✅ 
            serviceType: shopModule,    // ✅ 
            shopType: shopModule,
            contact: phoneNumber,
            email: document.getElementById('createShopEmail').value.trim() || '',
            address: shopAddress,
            icon: createShopSelectedIcon,
            range: range
        };

        console.log('📤 FINAL PAYLOAD for /manager/create-shop-v2:', shopData);

        try {
            const res = await window.apiCall('/manager/create-shop-v2', {
                method: 'POST',
                body: shopData
            });

            console.log('📥 Backend Response:', res);

            // ✅ Backend {success: true, shop: newShop, currentCount, maxShops} bhejta hai
            if (res.success && res.shop) {
                const shopId = res.shop._id; // ✅ shopId nikala
                const shopType = res.shop.serviceType || res.shop.shopType || shopModule || 'common';
                const shopLink = `${window.location.origin}/shop-templates/${shopType}/dashboard.html?shopId=${shopId}`; // ✅ shopId ke saath link

                // ✅ Clipboard me copy
                navigator.clipboard.writeText(shopLink).then(() => {
                    console.log('✅ Shop link copied:', shopLink);
                }).catch(err => {
                    console.log('⚠️ Clipboard copy failed:', err);
                });

                const msg = `✅ Shop created successfully!\n\nShop: "${res.shop.shopName}"\nShops: ${res.currentCount}/${res.maxShops}\n\nDashboard Link:\n${shopLink}\n\n(Link copied to clipboard)`;

                alert(msg);
                closeCreateShopModal();
                window.loadDashboard();
            } else {
                console.error('❌ Backend Error:', res);
                alert('❌ Error: ' + (res.error || res.message || 'Failed to create shop'));
            }
        } catch (err) {
            console.error('❌ Submit Error:', err);
            alert('❌ Failed: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-plus"></i> Create Shop';
        }
    });
}

function showError(msg, focusId, btn) {
    alert('❌ ' + msg);
    if (focusId) document.getElementById(focusId).focus();
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-plus"></i> Create Shop';
    return false;
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
    document.querySelectorAll('#createShopIconPicker.icon-option').forEach(el => el.classList.remove('selected'));
    const defaultIcon = document.querySelector('#createShopIconPicker.icon-option[data-icon="🏪"]');
    if (defaultIcon) defaultIcon.classList.add('selected');
    removeCreateShopLogo();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

console.log('✅ shop-create.js loaded - Auto-connected to Current Manager Only');