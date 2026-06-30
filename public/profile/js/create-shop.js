// ========================================
// MY SHOPS - CREATE SHOP LOGIC - FINAL FIXED
// ========================================

let selectedIcon = '🏪';
let newShopData = null;
let uploadedLogoBase64 = null;
let selectedManagerCodes = []; // ← GLOBAL ARRAY: submitShop() me use hoga
let allManagers = [];
let allAreas = [];
let locationWatchId = null;
let detectedCity = null;

const SPECIFIC_TEMPLATES = ['cloth', 'kirana', 'medical', 'restaurant', 'service', 'rental', 'common'];

if (!window.currentUser) {
    window.currentUser = {
        name: 'Shop Owner',
        email: 'owner@shop.com',
        role: 'user'
    };
}

window.currentUserLocation = null;

// ========================================
// ✅ GLOBAL FUNCTION: toggleManager()
// ========================================
window.toggleManager = function(managerCode) {
    console.log('🔄 Toggle Manager Called:', managerCode);
    const idx = selectedManagerCodes.indexOf(managerCode);
    const checkbox = document.getElementById(`mgr_${managerCode}`);
    const item = checkbox?.closest('.manager-item');

    if (idx > -1) {
        selectedManagerCodes.splice(idx, 1);
        if (checkbox) checkbox.checked = false;
        if (item) item.classList.remove('selected');
    } else {
        selectedManagerCodes.push(managerCode);
        if (checkbox) checkbox.checked = true;
        if (item) item.classList.add('selected');
    }

    console.log('✅ Selected Managers:', selectedManagerCodes);
    updateManagerCountText();
    document.getElementById('shopManagerCodes').value = JSON.stringify(selectedManagerCodes);
}

// ========================================
// PAGE LOAD
// ========================================
window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('userToken');
    if (token &&!window.currentUser._id) {
        await fetchUserData(token);
    }
    loadModules();
    await loadAreaManagers();
    await loadMyShops();
    startLocationTracking();
    checkAdminAccess();
    initIconPicker();
});

async function fetchUserData(token) {
    try {
        const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (data.success) {
            window.currentUser = data.user;
        }
    } catch (err) {
        console.log('User fetch failed');
    }
}

// ========================================
// LOAD MANAGERS & AREAS
// ========================================
async function loadAreaManagers() {
    try {
        const [areasRes, managersRes] = await Promise.all([
            fetch('/api/areas'),
            fetch('/api/managers')
        ]);
        allAreas = await areasRes.json();
        allManagers = await managersRes.json();
        console.log('✅ Loaded:', allAreas.length, 'areas,', allManagers.length, 'managers');
    } catch (err) {
        console.error('Failed to load managers:', err);
    }
}

// ========================================
// ADMIN CHECK
// ========================================
function checkAdminAccess() {
    const userRole = window.currentUser?.role || 'user';
    const rangeSelect = document.getElementById('shopRange');
    const rangeNote = document.getElementById('rangeNote');

    if (userRole!== 'admin' && userRole!== 'area_manager') {
        rangeSelect.value = '5000';
        Array.from(rangeSelect.options).forEach(opt => {
            if (parseInt(opt.value) > 5000) {
                opt.disabled = true;
                opt.text = opt.text + ' (Admin Only)';
            }
        });
        rangeNote.style.display = 'block';
    } else {
        rangeNote.style.display = 'none';
    }
}

// ========================================
// LOCATION TRACKING
// ========================================
function startLocationTracking() {
    if (!navigator.geolocation) {
        document.getElementById('locationCoords').innerHTML = '❌ GPS not supported';
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            window.currentUserLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            console.log('📍 Location captured:', window.currentUserLocation);
        },
        (error) => {
            console.log('Location error:', error.message);
            document.getElementById('locationCoords').innerHTML = '❌ Please enable GPS';
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    locationWatchId = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                window.currentUserLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
            },
            (error) => console.log('Auto location error:', error.message),
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
    }, 30000);
}

// ========================================
// FORM TOGGLE
// ========================================
function toggleCreateForm() {
    const formSection = document.getElementById('createFormSection');
    const btn = document.getElementById('newShopBtn');
    if (formSection.style.display === 'none') {
        formSection.style.display = 'block';
        btn.innerHTML = '<i class="fa fa-times"></i> Close';
        resetForm();
        window.scrollTo(0, 0);
        autoFillLocation();
    } else {
        hideCreateForm();
    }
}

function hideCreateForm() {
    document.getElementById('createFormSection').style.display = 'none';
    document.getElementById('newShopBtn').innerHTML = '<i class="fa fa-plus"></i> New Shop';
}

// ========================================
// LOAD MODULES
// ========================================
function loadModules() {
    const select = document.getElementById('shopModule');
    const shopTypes = [
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

    shopTypes.forEach(m => {
        select.innerHTML += `<option value="${m.id}">${m.icon} ${m.name}</option>`;
    });
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
    document.getElementById('shopLogoInput').value = '';
    document.getElementById('logoPreview').innerHTML = `
        <i class="fa fa-camera"></i>
        <p>Upload Shop Photo</p>
        <span style="font-size: 12px; color: #64748b;">JPG, PNG • Max 2MB</span>
    `;
    document.getElementById('removeLogoBtn').style.display = 'none';
    document.getElementById('iconPicker').style.opacity = '1';
}

// ========================================
// LOCATION TYPE
// ========================================
function selectLocationType(type) {
    document.getElementById('shopLocationType').value = type;
    document.querySelectorAll('.location-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.location-type-btn[data-type="${type}"]`).classList.add('active');

    const noteEl = document.getElementById('locationTypeNote');
    const titleEl = document.getElementById('locationTitle');

    if (type === 'fixed') {
        noteEl.innerHTML = '<strong>Fixed:</strong> Shop ek hi jagah rahegi. 5KM circle me sabko dikhegi by default.';
        titleEl.textContent = '📍 Shop GPS Location *';
    } else {
        noteEl.innerHTML = '<strong>Dynamic:</strong> Shop owner ke saath move karegi. Real-time location update hogi (30 sec).';
        titleEl.textContent = '📍 Current GPS Location *';
    }
}

// ========================================
// AUTO FILL LOCATION + CITY DETECT
// ========================================
function autoFillLocation() {
    const coordsEl = document.getElementById('locationCoords');
    const cityBox = document.getElementById('cityDetectedBox');

    if (window.currentUserLocation) {
        const lat = window.currentUserLocation.lat;
        const lng = window.currentUserLocation.lng;
        updateShopLocationUI(lat, lng, true);
    } else {
        coordsEl.innerHTML = '⏳ Waiting for location... Make sure GPS is enabled';
        cityBox.style.display = 'flex';
        document.getElementById('detectedCityName').textContent = 'Detecting your city...';
        document.getElementById('detectedCityMeta').textContent = 'GPS se location fetch ho rahi hai';

        setTimeout(() => {
            if (window.currentUserLocation) {
                autoFillLocation();
            } else {
                coordsEl.innerHTML = '❌ Location not available. Please enable GPS';
                document.getElementById('detectedCityName').textContent = 'Location Not Found';
                document.getElementById('detectedCityMeta').textContent = 'Please enable GPS and refresh';
            }
        }, 2000);
    }
}

function updateShopLocationUI(lat, lng, isAuto = false) {
    document.getElementById('shopLat').value = lat;
    document.getElementById('shopLng').value = lng;
    const status = document.getElementById('locationCoords');

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
    .then(r => r.json())
    .then(data => {
            let city = data.address.city || data.address.town || data.address.village || 'Surat';
            if (city === 'सूरत' || city === 'सुरत') {
                city = 'Surat';
            }

            const state = data.address.state || 'Gujarat';
            const pincode = data.address.postcode || '';

            document.getElementById('shopCity').value = city;
            document.getElementById('shopState').value = state;
            document.getElementById('shopPincode').value = pincode;

            status.className = 'location-coords success';
            status.innerHTML = `✅ Location captured!<br><strong>City:</strong> ${city} | <strong>Lat:</strong> ${lat.toFixed(6)} | <strong>Lng:</strong> ${lng.toFixed(6)}${isAuto? '<br><small>Auto-updated</small>' : ''}`;

            detectedCity = city;
            document.getElementById('cityDetectedBox').style.display = 'flex';
            document.getElementById('detectedCityName').textContent = `📍 ${city}`;
            document.getElementById('detectedCityMeta').textContent = `${state} • Loading managers...`;

            loadCityManagers(city);
        })
    .catch(() => {
            const city = 'Surat';
            document.getElementById('shopCity').value = city;
            document.getElementById('shopState').value = 'Gujarat';
            status.className = 'location-coords success';
            status.innerHTML = `✅ Location captured!<br><strong>Lat:</strong> ${lat.toFixed(6)} | <strong>Lng:</strong> ${lng.toFixed(6)}`;

            detectedCity = city;
            loadCityManagers(city);
        });
}

// ========================================
// LOAD CITY MANAGERS - ✅ FIXED: undefined filter
// ========================================
function loadCityManagers(city) {
    const managerList = document.getElementById('managerList');
    const countText = document.getElementById('managerCountText');

    console.log('🔍 Searching managers for city:', city);
    console.log('📊 Total managers loaded:', allManagers.length);

    const cityLower = city.toLowerCase().trim();
    const cityHindi = 'सूरत';
    const cityEnglish = 'surat';

    // ✅ FIX: undefined wale managers skip karo
    const cityManagers = allManagers.filter(m => {
        // Skip invalid areaCode
        if (!m.areaCode || m.areaCode === 'undefined' || m.areaCode.trim() === '') {
            return false;
        }

        const area = allAreas.find(a => a.areaCode === m.areaCode);
        const managerCity = (m.city || area?.city || area?.areaName || '').toLowerCase().trim();

        const isMatch = managerCity === cityLower ||
                       managerCity === cityHindi ||
                       managerCity === cityEnglish ||
                       managerCity.includes(cityLower) ||
                       cityLower.includes(managerCity);

        if (isMatch) {
            console.log('✅ Manager matched:', m.name, 'City:', managerCity, 'AreaCode:', m.areaCode);
        }
        return isMatch;
    });

    console.log('✅ Found managers:', cityManagers.length, cityManagers);

    if (cityManagers.length === 0) {
        managerList.innerHTML = `
            <p style="text-align:center;color:#f59e0b;padding:20px;">
                ⚠️ No area managers found in ${city}.<br>
                <small>DB Check: ${allManagers.length} total managers exist. Check console for details.</small>
            </p>
        `;
        countText.textContent = 'No managers available';
        document.getElementById('detectedCityMeta').textContent = 'No managers found in this city';
        return;
    }

    document.getElementById('detectedCityMeta').textContent = `${cityManagers.length} Area Managers available`;
    countText.textContent = `${cityManagers.length} Managers Found - Select multiple`;

    managerList.innerHTML = cityManagers.map(m => {
        const area = allAreas.find(a => a.areaCode === m.areaCode);
        const managerCode = m.managerCode || m.areaCode + '-DEFAULT';
        const managerCity = m.city || area?.city || area?.areaName || city;

        return `
            <div class="manager-item" onclick="toggleManager('${managerCode}')">
                <input type="checkbox"
                       id="mgr_${managerCode}"
                       value="${managerCode}"
                       onclick="event.stopPropagation(); toggleManager('${managerCode}')">
                <div class="manager-item-info">
                    <div class="manager-item-name">${escapeHtml(m.name)}</div>
                    <div class="manager-item-meta">
                        Code: <b>${managerCode}</b> • City: ${escapeHtml(managerCity)} • ${area?.radius || 50}KM
                    </div>
                </div>
            </div>
        `;
    }).join('');

    selectedManagerCodes = [];
}

// ========================================
// TOGGLE SELECT ALL MANAGERS
// ========================================
function toggleSelectAllManagers() {
    const checkboxes = document.querySelectorAll('.manager-item input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);

    checkboxes.forEach(cb => {
        const managerCode = cb.value;
        const item = cb.closest('.manager-item');

        if (!allChecked) {
            cb.checked = true;
            item.classList.add('selected');
            if (!selectedManagerCodes.includes(managerCode)) {
                selectedManagerCodes.push(managerCode);
            }
        } else {
            cb.checked = false;
            item.classList.remove('selected');
        }
    });

    if (allChecked) {
        selectedManagerCodes = [];
    }

    document.getElementById('shopManagerCodes').value = JSON.stringify(selectedManagerCodes);
    updateManagerCountText();
    console.log('✅ Selected Managers:', selectedManagerCodes);
}

function updateManagerCountText() {
    const count = selectedManagerCodes.length;
    document.getElementById('managerCountText').textContent =
        count === 0? 'No managers selected' : `${count} Manager${count > 1? 's' : ''} Selected`;
}

// ========================================
// SUBMIT SHOP - ✅ 100% FIXED
// ========================================
async function submitShop() {
    const btn = document.getElementById('submitBtn');
    btn.textContent = 'Creating...';
    btn.disabled = true;

    const lat = document.getElementById('shopLat').value;
    const lng = document.getElementById('shopLng').value;
    const city = document.getElementById('shopCity').value || 'Surat';
    const state = document.getElementById('shopState').value || 'Gujarat';
    const pincode = document.getElementById('shopPincode').value || '';
    const shopModule = document.getElementById('shopModule').value;
    const locationType = document.getElementById('shopLocationType').value;
    const range = parseInt(document.getElementById('shopRange').value);

    // ✅ STEP 1: Filter undefined/empty managers
    const validManagers = selectedManagerCodes.filter(code =>
        code &&!code.includes('undefined') && code.trim()!== ''
    );

    console.log('🔍 Valid Managers:', validManagers);

    if (validManagers.length === 0) {
        alert('⚠️ Please select at least one valid Area Manager!');
        btn.textContent = 'Create My Shop - Go Live Now';
        btn.disabled = false;
        return;
    }

    // ✅ STEP 2: Manager code se areaCode nikalo - AREA.HTML LOGIC
    // "SURAGU-2-DEFAULT" → "SURAGU-2"
    const firstManagerCode = validManagers[0];
    const areaCode = firstManagerCode.replace('-DEFAULT', '').trim();

    // ✅ STEP 3: Area aur Manager details nikalo
    const selectedManagerData = allManagers.find(m =>
        (m.managerCode || m.areaCode + '-DEFAULT') === firstManagerCode
    );
    const areaData = allAreas.find(a => a.areaCode === areaCode);

    const areaName = areaData?.areaName || selectedManagerData?.name || `${city} Zone`;
    const bucket = selectedManagerData?.bucket || 'DEFAULT';

    console.log('✅ Extracted areaCode:', areaCode);
    console.log('✅ Extracted areaName:', areaName);
    console.log('✅ Extracted bucket:', bucket);

    const shopTypeMap = {
        'kirana': 'product', 'cloth': 'fashion', 'medical': 'product',
        'restaurant': 'food', 'electronics': 'product', 'hardware': 'product',
        'salon': 'service', 'stationery': 'product', 'service': 'service',
        'rental': 'rental', 'common': 'product'
    };

    const shopData = {
        shopName: document.getElementById('shopName').value.trim(),
        ownerName: window.currentUser.name,
        phone: document.getElementById('shopPhone').value.trim(),
        email: window.currentUser.email || '',
        address: {
            line1: document.getElementById('shopAddress').value.trim(),
            line2: '',
            city: city,
            state: state,
            pincode: pincode
        },
        // ✅ FIXED: Manager se nikala hua exact areaCode
        areaCode: areaCode,
        bucket: bucket,
        area: areaCode,
        areaName: areaName,
        serviceType: shopModule,
        shopType: shopTypeMap[shopModule] || 'product',
        description: document.getElementById('shopDesc').value.trim(),
        range: range,
        icon: selectedIcon,
        logo: uploadedLogoBase64 || '',
        banner: '',
        status: 'approved',
        isVerified: true,
        isActive: true,
        locationType: locationType,
        location: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        managerCodes: validManagers
    };

    console.log('📤 Final Shop Data:', shopData);

    if (!shopData.shopName ||!shopData.serviceType ||!shopData.phone ||!shopData.address.line1 ||!lat ||!lng) {
        alert('Please fill all required fields including location!');
        btn.textContent = 'Create My Shop - Go Live Now';
        btn.disabled = false;
        return;
    }

    try {
        const res = await fetch('/api/local-market/shops', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('userToken')
            },
            body: JSON.stringify(shopData)
        });

        const data = await res.json();
        console.log('📥 Server Response:', data);

        if (res.ok && data._id) {
            localStorage.setItem('userToken', 'shop-owner-' + data._id);

            let myShops = JSON.parse(localStorage.getItem('myShopsList') || '[]');
            myShops.push({id: data._id, name: data.shopName, type: data.serviceType});
            localStorage.setItem('myShopsList', JSON.stringify(myShops));

            newShopData = data;
            document.getElementById('successBox').style.display = 'block';
            document.getElementById('successShopName').textContent = `"${data.shopName}" is now LIVE in ${areaName}!`;
            document.getElementById('formFields').style.display = 'none';
            document.getElementById('infoBanner').style.display = 'none';
            document.getElementById('submitBtn').style.display = 'none';
            document.getElementById('successBox').scrollIntoView({ behavior: 'smooth' });
        } else {
            alert('Error: ' + (data.error || data.details || data.msg || 'Failed to create shop'));
            btn.textContent = 'Create My Shop - Go Live Now';
            btn.disabled = false;
        }
    } catch (err) {
        console.error(err);
        alert('Failed to create shop. Check your connection and try again.');
        btn.textContent = 'Create My Shop - Go Live Now';
        btn.disabled = false;
    }
}

// ========================================
// LOAD MY SHOPS
// ========================================
async function loadMyShops() {
    const list = document.getElementById('shopsList');
    const emptyState = document.getElementById('emptyState');

    let myShops = JSON.parse(localStorage.getItem('myShopsList') || '[]');

    if (myShops.length === 0) {
        if (list) list.innerHTML = '';
        if (emptyState) {
            if (list) list.appendChild(emptyState);
            emptyState.style.display = 'block';
        }
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (list) list.innerHTML = '';

    for (const shop of myShops) {
        try {
            const res = await fetch('/api/local-market/shops/' + shop.id);
            const shopData = await res.json();

            if (shopData._id && list) {
                const shopType = shopData.serviceType || shopData.shopType;
                const dashboardUrl = `/shop-templates/${shopType}/dashboard.html?shopId=${shopData._id}`;

                const card = document.createElement('div');
                card.className = 'shop-card';
                card.onclick = () => window.location.href = dashboardUrl;
                card.innerHTML = `
                    <div class="shop-icon">
                        ${shopData.logo?
                            `<img src="${shopData.logo}" alt="${shopData.shopName}">` :
                            shopData.icon || '🏪'
                        }
                    </div>
                    <div class="shop-details">
                        <h3>${shopData.shopName}</h3>
                        <p>${shopData.address?.city || 'Surat'} • ${shopData.serviceType}</p>
                        <span class="shop-badge">${shopData.status} ${shopData.locationType === 'dynamic'? '• 🚶 Moving' : ''}</span>
                    </div>
                    <i class="fa fa-chevron-right" style="color: #94a3b8; margin-left: auto;"></i>
                `;
                list.appendChild(card);
            }
        } catch(e) {
            console.log('Shop not found:', shop.id);
        }
    }
}

// ========================================
// RESET FORM
// ========================================
function resetForm() {
    document.getElementById('shopName').value = '';
    document.getElementById('shopModule').value = '';
    document.getElementById('shopPhone').value = '';
    document.getElementById('shopAddress').value = '';
    document.getElementById('shopDesc').value = '';
    document.getElementById('shopLat').value = '';
    document.getElementById('shopLng').value = '';
    document.getElementById('shopRange').value = '5000';
    document.getElementById('shopCity').value = '';
    document.getElementById('shopState').value = '';
    document.getElementById('shopPincode').value = '';
    document.getElementById('shopManagerCodes').value = '';
    document.getElementById('locationCoords').className = 'location-coords';
    document.getElementById('locationCoords').textContent = 'Loading your current location...';
    document.getElementById('formFields').style.display = 'block';
    document.getElementById('infoBanner').style.display = 'block';
    document.getElementById('submitBtn').style.display = 'block';
    document.getElementById('successBox').style.display = 'none';
    document.getElementById('submitBtn').textContent = 'Create My Shop - Go Live Now';
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('cityDetectedBox').style.display = 'none';
    document.getElementById('managerList').innerHTML = '<p style="text-align:center;color:#94a3b8;padding:20px;">Detecting your city first...</p>';
    document.getElementById('managerCountText').textContent = 'Loading managers...';
    selectedManagerCodes = [];
    selectedIcon = '🏪';
    document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
    document.querySelector('.icon-option[data-icon="🏪"]').classList.add('selected');
    removeLogo();
    selectLocationType('fixed');
    autoFillLocation();
}

// ========================================
// COPY SHOP LINK
// ========================================
function copyShopLink() {
    if (newShopData) {
        const shopType = newShopData.serviceType || newShopData.shopType;
        const link = `${window.location.origin}/shop-templates/${shopType}/user-view.html?shopId=${newShopData._id}`;
        navigator.clipboard.writeText(link).then(() => {
            alert('✅ Customer link copied!\n\n' + link + '\n\nShare this with your customers.');
        }).catch(() => {
            prompt('Copy this link:', link);
        });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}