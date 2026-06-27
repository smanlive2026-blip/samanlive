// ========================================
// MY SHOPS - CREATE SHOP LOGIC - FIXED VERSION
// app.js se LocationManager + currentUser use karega
// ========================================

let selectedIcon = '🏪';
let newShopData = null;
let uploadedLogoBase64 = null;

const SPECIFIC_TEMPLATES = ['cloth', 'kirana', 'medical', 'restaurant', 'service', 'rental', 'common'];

// ========================================
// PAGE LOAD - Init
// ========================================
window.addEventListener('DOMContentLoaded', async () => {
    // Fallback user agar app.js se nahi mila
    if (!window.currentUser) {
        const token = localStorage.getItem('userToken');
        if (token) {
            await fetchUserData(token);
        } else {
            window.currentUser = {
                name: 'Shop Owner',
                email: 'owner@shop.com'
            };
        }
    }

    loadModules();
    await loadMyShops();
});

// Fetch user if needed
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
        window.currentUser = {
            name: 'Shop Owner',
            email: 'owner@shop.com'
        };
    }
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
// LOAD MODULES - Shop Types
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

    select.innerHTML = '<option value="">-- Select Shop Type --</option>';
    shopTypes.forEach(m => {
        select.innerHTML += `<option value="${m.id}">${m.icon} ${m.name}</option>`;
    });
}

// ========================================
// ICON PICKER
// ========================================
document.addEventListener('DOMContentLoaded', () => {
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
});

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
// LOCATION TYPE - Fixed vs Dynamic
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
        noteEl.innerHTML = '<strong>Fixed:</strong> Shop ek hi jagah rahegi. Customers ko exact location dikhegi.';
        titleEl.textContent = '📍 Shop GPS Location *';
    } else {
        noteEl.innerHTML = '<strong>Dynamic:</strong> Shop owner ke saath move karegi. Real-time location update hogi (30 sec).';
        titleEl.textContent = '📍 Current GPS Location *';
    }
}

// ========================================
// AUTO FILL LOCATION - app.js se ya direct GPS
// ========================================
function autoFillLocation() {
    const coordsEl = document.getElementById('locationCoords');

    if (window.currentUserLocation) {
        const lat = window.currentUserLocation.lat;
        const lng = window.currentUserLocation.lng;
        updateShopLocationUI(lat, lng, true);
    } else if (navigator.geolocation) {
        coordsEl.innerHTML = '⏳ Getting your location...';
        navigator.geolocation.getCurrentPosition(
            (position) => {
                window.currentUserLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                updateShopLocationUI(position.coords.latitude, position.coords.longitude, true);
            },
            (error) => {
                coordsEl.innerHTML = '❌ Location not available. Please enable GPS';
                console.log('Location error:', error.message);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        coordsEl.innerHTML = '❌ GPS not supported in this browser';
    }
}

function updateShopLocationUI(lat, lng, isAuto = false) {
    document.getElementById('shopLat').value = lat;
    document.getElementById('shopLng').value = lng;
    const status = document.getElementById('locationCoords');

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
     .then(r => r.json())
     .then(data => {
            const city = data.address.city || data.address.town || data.address.village || 'Surat';
            const state = data.address.state || 'Gujarat';
            const pincode = data.address.postcode || '';

            document.getElementById('shopCity').value = city;
            document.getElementById('shopState').value = state;
            document.getElementById('shopPincode').value = pincode;

            status.className = 'location-coords success';
            status.innerHTML = `✅ Location captured!<br><strong>City:</strong> ${city} | <strong>Lat:</strong> ${lat.toFixed(6)} | <strong>Lng:</strong> ${lng.toFixed(6)}${isAuto? '<br><small>Auto-updated from current location</small>' : ''}`;
        })
     .catch(() => {
            document.getElementById('shopCity').value = 'Surat';
            document.getElementById('shopState').value = 'Gujarat';
            status.className = 'location-coords success';
            status.innerHTML = `✅ Location captured!<br><strong>Lat:</strong> ${lat.toFixed(6)} | <strong>Lng:</strong> ${lng.toFixed(6)}${isAuto? '<br><small>Auto-updated</small>' : ''}`;
        });
}

// ========================================
// SUBMIT SHOP
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
        areaCode: city.toUpperCase().replace(/\s/g, '') + '01',
        bucket: 'GENERAL',
        area: city,
        areaName: city,
        serviceType: shopModule,
        shopType: shopTypeMap[shopModule] || 'product',
        description: document.getElementById('shopDesc').value.trim(),
        range: parseInt(document.getElementById('shopRange').value),
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
        }
    };

    if (!shopData.shopName ||!shopData.serviceType ||!shopData.phone ||!shopData.address.line1 ||!lat ||!lng) {
        alert('Please fill all required fields including location!');
        btn.textContent = 'Create My Shop - Go Live Now';
        btn.disabled = false;
        return;
    }

    try {
        const res = await fetch('/api/local-market/shops', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shopData)
        });

        const data = await res.json();

        if (res.ok && data._id) {
            localStorage.setItem('userToken', 'shop-owner-' + data._id);

            let myShops = JSON.parse(localStorage.getItem('myShopsList') || '[]');
            myShops.push({id: data._id, name: data.shopName, type: data.serviceType});
            localStorage.setItem('myShopsList', JSON.stringify(myShops));

            newShopData = data;
            document.getElementById('successBox').style.display = 'block';
            document.getElementById('successShopName').textContent = `"${data.shopName}" is now LIVE!`;
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
        list.innerHTML = '';
        list.appendChild(emptyState);
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    list.innerHTML = '';

    for (const shop of myShops) {
        try {
            const res = await fetch('/api/local-market/shops/' + shop.id);
            const shopData = await res.json();

            if (shopData._id) {
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
    document.getElementById('locationCoords').className = 'location-coords';
    document.getElementById('locationCoords').textContent = 'Loading your current location...';
    document.getElementById('formFields').style.display = 'block';
    document.getElementById('infoBanner').style.display = 'block';
    document.getElementById('submitBtn').style.display = 'block';
    document.getElementById('successBox').style.display = 'none';
    document.getElementById('submitBtn').textContent = 'Create My Shop - Go Live Now';
    document.getElementById('submitBtn').disabled = false;
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