// ========================================
// SHOP CREATE MODULE - PROFESSIONAL FORM
// File: /public/assets/js/shop-create.js
// Used by: area-manager.html
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
    
    console.log('✅ Shop Create Module Initialized');
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
        iconPicker.addEventListener('click', (e) => {
            if (e.target.classList.contains('icon-option')) {
                document.querySelectorAll('#createShopIconPicker .icon-option').forEach(el => el.classList.remove('selected'));
                e.target.classList.add('selected');
                createShopSelectedIcon = e.target.dataset.icon;
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
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        createShopUploadedLogoBase64 = e.target.result;
        document.getElementById('createShopLogoPreview').innerHTML = `<img src="${createShopUploadedLogoBase64}" alt="Shop Logo">`;
        document.getElementById('createShopRemoveLogoBtn').style.display = 'inline-block';
        document.getElementById('createShopIconPicker').style.opacity = '0.3';
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
    document.getElementById('createShopIconPicker').style.opacity = '1';
}

// ========================================
// LOAD SHOP MODULES
// ========================================
function loadCreateShopModules() {
    const moduleSelect = document.getElementById('createShopType');
    if (!moduleSelect) return;

    moduleSelect.innerHTML = '<option value="">Select Shop Type</option>';

    if (createShopCategories && createShopCategories.length > 0) {
        createShopCategories.forEach(cat => {
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
// AUTO FILL AREA DATA
// ========================================
function autoFillCreateShopArea() {
    const manager = window.createShopCurrentManager;
    if (!manager) return;

    document.getElementById('createShopCity').value = manager.city || 'Surat';
    document.getElementById('createShopState').value = manager.state || 'Gujarat';
    document.getElementById('createShopPincode').value = manager.pincode || '';
    
    // Auto select manager
    createShopSelectedManagerCodes = [manager.managerCode];
    document.getElementById('createShopManagerCodes').value = JSON.stringify(createShopSelectedManagerCodes);
    
    // Show city box
    const cityBox = document.getElementById('createShopCityBox');
    if (cityBox) {
        cityBox.style.display = 'flex';
        document.getElementById('createShopDetectedCityName').textContent = `📍 ${manager.city}`;
        document.getElementById('createShopDetectedCityMeta').textContent = `${manager.state} • Auto-selected Manager`;
    }
    
    loadCreateShopCityManagers(manager.city);
}

// ========================================
// LOAD CITY MANAGERS
// ========================================
function loadCreateShopCityManagers(city) {
    const managerList = document.getElementById('createShopManagerList');
    const countText = document.getElementById('createShopManagerCountText');
    
    if (!managerList) return;

    const cityLower = city.toLowerCase().trim();
    const cityManagers = createShopAllManagers.filter(m => {
        if (!m.areaCode || m.areaCode === 'undefined') return false;
        const area = createShopAllAreas.find(a => a.areaCode === m.areaCode);
        const managerCity = (m.city || area?.city || area?.areaName || '').toLowerCase().trim();
        return managerCity === cityLower || managerCity.includes(cityLower) || cityLower.includes(managerCity);
    });

    if (cityManagers.length === 0) {
        managerList.innerHTML = `<p style="text-align:center;color:#f59e0b;padding:20px;">⚠️ No managers found in ${city}</p>`;
        countText.textContent = 'No managers available';
        return;
    }

    countText.textContent = `${cityManagers.length} Managers Found - Select multiple`;

    managerList.innerHTML = cityManagers.map(m => {
        const area = createShopAllAreas.find(a => a.areaCode === m.areaCode);
        const managerCode = m.managerCode || m.areaCode + '-DEFAULT';
        const isSelected = createShopSelectedManagerCodes.includes(managerCode);
        
        return `
            <div class="manager-item ${isSelected ? 'selected' : ''}" onclick="toggleCreateShopManager('${managerCode}')">
                <input type="checkbox" 
                       id="createShopMgr_${managerCode}" 
                       value="${managerCode}"
                       ${isSelected ? 'checked' : ''}
                       onclick="event.stopPropagation(); toggleCreateShopManager('${managerCode}')">
                <div class="manager-item-info">
                    <div class="manager-item-name">${escapeHtml(m.name)}</div>
                    <div class="manager-item-meta">
                        Code: <b>${managerCode}</b> • City: ${escapeHtml(m.city || area?.city)} • ${area?.radius || 50}KM
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// TOGGLE MANAGER
// ========================================
window.toggleCreateShopManager = function(managerCode) {
    const idx = createShopSelectedManagerCodes.indexOf(managerCode);
    const checkbox = document.getElementById(`createShopMgr_${managerCode}`);
    const item = checkbox?.closest('.manager-item');

    if (idx > -1) {
        createShopSelectedManagerCodes.splice(idx, 1);
        if (checkbox) checkbox.checked = false;
        if (item) item.classList.remove('selected');
    } else {
        createShopSelectedManagerCodes.push(managerCode);
        if (checkbox) checkbox.checked = true;
        if (item) item.classList.add('selected');
    }

    updateCreateShopManagerCountText();
    document.getElementById('createShopManagerCodes').value = JSON.stringify(createShopSelectedManagerCodes);
}

window.toggleSelectAllCreateShopManagers = function() {
    const checkboxes = document.querySelectorAll('#createShopManagerList .manager-item input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);

    checkboxes.forEach(cb => {
        const managerCode = cb.value;
        const item = cb.closest('.manager-item');

        if (!allChecked) {
            cb.checked = true;
            item.classList.add('selected');
            if (!createShopSelectedManagerCodes.includes(managerCode)) {
                createShopSelectedManagerCodes.push(managerCode);
            }
        } else {
            cb.checked = false;
            item.classList.remove('selected');
        }
    });

    if (allChecked) {
        createShopSelectedManagerCodes = [];
    }

    document.getElementById('createShopManagerCodes').value = JSON.stringify(createShopSelectedManagerCodes);
    updateCreateShopManagerCountText();
}

function updateCreateShopManagerCountText() {
    const count = createShopSelectedManagerCodes.length;
    const countEl = document.getElementById('createShopManagerCountText');
    if (countEl) {
        countEl.textContent = count === 0 ? 'No managers selected' : `${count} Manager${count > 1 ? 's' : ''} Selected`;
    }
}

// ========================================
// SUBMIT SHOP - FINAL
// ========================================
function initCreateShopForm() {
    const createForm = document.getElementById('createShopForm');
    if (!createForm) return;
    
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

        const phoneNumber = document.getElementById('createShopPhone').value.trim();
        const shopAddress = document.getElementById('createShopAddress').value.trim();
        const ownerName = document.getElementById('createShopOwnerName').value.trim();
        const manager = window.createShopCurrentManager;

        // Validate managers
        const validManagers = createShopSelectedManagerCodes.filter(code => 
            code && !code.includes('undefined') && code.trim() !== ''
        );

        if (validManagers.length === 0) {
            alert('⚠️ Please select at least one valid Area Manager!');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-plus"></i> Create Shop';
            return;
        }

        // Extract area details from first manager
        const firstManagerCode = validManagers[0];
        const areaCode = firstManagerCode.replace('-DEFAULT', '').trim();
        const selectedManagerData = createShopAllManagers.find(m => 
            (m.managerCode || m.areaCode + '-DEFAULT') === firstManagerCode
        );
        const areaData = createShopAllAreas.find(a => a.areaCode === areaCode);
        const areaName = areaData?.areaName || selectedManagerData?.name || manager.city;
        const bucket = selectedManagerData?.bucket || 'DEFAULT';

        const shopData = {
            shopName: document.getElementById('createShopName').value.trim(),
            ownerName: ownerName,
            phone: phoneNumber,
            email: document.getElementById('createShopEmail').value.trim() || '',
            address: shopAddress, // ✅ String, not object
            city: manager.city,
            state: manager.state,
            pincode: manager.pincode || '',
            areaCode: areaCode,
            bucket: bucket,
            area: areaCode,
            areaName: areaName,
            serviceType: shopTypeMap[shopModule] || 'product',
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
                coordinates: [manager.centerLng, manager.centerLat]
            },
            managerCodes: validManagers
        };

        console.log('📤 Creating Shop:', shopData);

        if (!shopData.shopName || !shopData.phone || !shopModule || !ownerName || !shopAddress) {
            alert('Please fill Shop Name, Owner Name, Phone Number, Shop Type and Address!');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-plus"></i> Create Shop';
            return;
        }

        try {
            const res = await window.apiCall('/manager/create-shop', {
                method: 'POST',
                body: JSON.stringify(shopData)
            });

            if (res.success) {
                alert(`✅ Shop created successfully!\n\nShop "${shopData.shopName}" is now LIVE in ${areaName}!\n\nLocation can be updated from shop dashboard.`);
                closeCreateShopModal();
                window.loadDashboard(); // Reload dashboard
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
    document.getElementById('createShopType').value = '';
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

console.log('✅ shop-create.js loaded');