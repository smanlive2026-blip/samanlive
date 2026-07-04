const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
let currentShop = null;
let locationInterval = null;
let shopMap = null;
let shopMarker = null;
let rangeCircle = null;
let lastSentLocation = null;
let shopManagers = [];
let pickerMap = null;
let pickerMarker = null;
let locationType = 'fixed';
let liveWatchId = null;

if (!shopId) {
    alert('Invalid shop link');
    window.location.href = '/local-market/create-shop.html';
}

async function loadShopData() {
    try {
        const res = await fetch(`/api/local-market/shops/${shopId}`);
        const shop = await res.json();

        if (!shop._id) {
            alert('Shop not found');
            window.location.href = '/local-market/create-shop.html';
            return;
        }

        currentShop = shop;
        document.getElementById('shopName').innerText = shop.shopName;
        document.getElementById('ownerName').innerText = shop.ownerName || 'Owner';
        
        // Profile + Cover set
        if(shop.logo) document.getElementById('shopLogo').src = shop.logo;
        if(shop.coverPhoto) document.getElementById('shopCover').src = shop.coverPhoto;

        const statusEl = document.getElementById('shopStatus');
        statusEl.innerText = shop.status.toUpperCase();
        statusEl.className = 'badge ' + shop.status;

        locationType = shop.locationType || 'fixed';
        const locationBadge = document.getElementById('locationTypeBadge');
        const rangeText = document.getElementById('rangeText');
        const locationUpdateText = document.getElementById('locationUpdateText');
        
        if (locationType === 'dynamic') {
            locationBadge.innerText = 'Mobile';
            rangeText.textContent = `Delivery Range: ${shop.range/1000} KM`;
            locationUpdateText.textContent = 'Live Tracking ON';
        } else {
            locationBadge.innerText = 'Fixed';
            rangeText.textContent = `Delivery Range: ${shop.range/1000} KM`;
            locationUpdateText.textContent = 'Fixed Location';
        }

        document.getElementById('deliveryRange').value = shop.range ? shop.range/1000 : 5;
        document.getElementById('shopAddress').value = shop.address || '';

        const items = shop.items || shop.products || [];
        const totalStock = items.reduce((sum, i) => sum + (i.stock || 0), 0);
        
        document.getElementById('totalItems').innerText = items.length;
        document.getElementById('totalStock').innerText = totalStock;
        document.getElementById('todayOrders').innerText = shop.todayOrders || 0;
        document.getElementById('assignedManagerCount').innerText = shop.managerCodes?.length || 0;
        document.getElementById('shopRating').innerText = shop.rating || 4.5;

        loadItems(items);
        document.getElementById('loader').style.display = 'none';
        initShopMap();
        startDynamicLocationTracking();
        loadShopManagers();
        initUploads(); // Photo upload init

    } catch (err) {
        console.error(err);
        alert('Failed to load shop: ' + err.message);
        document.getElementById('loader').style.display = 'none';
    }
}

// ===== PHOTO UPLOAD =====
function initUploads(){
    document.getElementById('logoUpload').onchange = e => uploadPhoto(e, 'logo');
    document.getElementById('coverUpload').onchange = e => uploadPhoto(e, 'coverPhoto');
}

async function uploadPhoto(e, field){
    const file = e.target.files[0];
    if(!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('field', field);
    
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/local-market/shops/${shopId}/upload`, {
            method: 'POST',
            headers: {'Authorization': 'Bearer ' + token},
            body: formData
        });
        const data = await res.json();
        if(data.success){
            if(field == 'logo') document.getElementById('shopLogo').src = data.url;
            if(field == 'coverPhoto') document.getElementById('shopCover').src = data.url;
            alert('Photo Updated!');
        }
    } catch(err){ alert('Upload failed: ' + err.message); }
}

// ===== LOCATION MODAL FUNCTIONS =====
function openLocationModal(){
    document.getElementById('locationModal').style.display = 'flex';
    setLocationType(locationType);
    // Modal khulte hi current location le
    navigator.geolocation.getCurrentPosition(pos => {
        let lat = pos.coords.latitude, lng = pos.coords.longitude;
        initPickerMap(lat, lng); 
    }, ()=> {
        let [lng, lat] = currentShop.location?.coordinates || [72.8311, 21.1702];
        initPickerMap(lat, lng);
    });
}
function closeLocationModal(){
    document.getElementById('locationModal').style.display = 'none';
    if(liveWatchId) navigator.geolocation.clearWatch(liveWatchId);
}

function setLocationType(type){
    locationType = type;
    document.querySelectorAll('.type-btn').forEach(b=>b.classList.remove('active'));
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
    document.getElementById('fixedFields').style.display = type=='fixed' ? 'block' : 'none';
    document.getElementById('dynamicFields').style.display = type=='dynamic' ? 'block' : 'none';
}

function initPickerMap(lat, lng){
    if(pickerMap) pickerMap.remove();
    pickerMap = L.map('locationPickerMap').setView([lat, lng], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(pickerMap);
    pickerMarker = L.marker([lat, lng], {draggable: true}).addTo(pickerMap);
}

function startLiveLocation(){
    if(!navigator.geolocation) return alert("GPS not supported");
    document.getElementById('currentLatLng').innerText = 'Starting...';
    liveWatchId = navigator.geolocation.watchPosition(pos=>{
        let lat = pos.coords.latitude, lng = pos.coords.longitude;
        document.getElementById('currentLatLng').innerText = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }, err=>alert("Location permission denied"), {enableHighAccuracy: true});
}

function stopLiveLocation(){
    if(liveWatchId) navigator.geolocation.clearWatch(liveWatchId);
    document.getElementById('currentLatLng').innerText = 'Stopped';
}

async function saveLocation(){
    let range = document.getElementById('deliveryRange').value * 1000;
    let address = document.getElementById('shopAddress').value;
    let coords = currentShop.location.coordinates;

    if(locationType === 'fixed' && pickerMarker){
        let latlng = pickerMarker.getLatLng();
        coords = [latlng.lng, latlng.lat];
    }
    
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/local-market/shops/${shopId}/update-location`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token},
            body: JSON.stringify({locationType, range, address, coordinates: coords})
        });
        if(res.ok){
            alert("Location Updated Successfully!");
            loadShopData();
            closeLocationModal();
        }
    } catch(err){ alert("Failed to save: " + err.message); }
}
// ===== LOCATION MODAL END =====

async function loadShopManagers() {
    try {
        const res = await fetch(`/api/local-market/shops/${shopId}/managers`);
        const data = await res.json();
        if (data.success) {
            shopManagers = data.managers;
            document.getElementById('assignedManagerCount').innerText = shopManagers.length;
        }
    } catch (err) { console.error('Failed to load managers:', err); }
}

function openManagersModal() {
    document.getElementById('managersModal').style.display = 'flex';
    const container = document.getElementById('managersListContainer');
    if (shopManagers.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:40px;"><i class="fa fa-users" style="font-size:48px; color:#cbd5e1;"></i><h4 style="color:#475569;">No Managers Assigned</h4></div>`;
        return;
    }
    container.innerHTML = shopManagers.map(m => `
        <div class="manager-list-item" onclick='showManagerContact(${JSON.stringify(m).replace(/'/g, "&apos;")})'>
            <div class="manager-avatar">${m.photo ? `<img src="${m.photo}">` : m.name.charAt(0).toUpperCase()}</div>
            <div class="manager-info"><h4>${m.name}</h4><p><i class="fa fa-id-badge"></i> ${m.managerCode}</p></div>
            <i class="fa fa-chevron-right" style="color:#94a3b8;"></i>
        </div>
    `).join('');
}
function closeManagersModal() { document.getElementById('managersModal').style.display = 'none'; }

function showManagerContact(manager) {
    closeManagersModal();
    document.getElementById('managerContactModal').style.display = 'flex';
    const phoneClean = manager.phone.replace(/[^0-9]/g, '');
    document.getElementById('managerContactBody').innerHTML = `
        <div style="text-align:center; margin-bottom:24px;">
            <div class="manager-avatar" style="width:80px; height:80px; margin:0 auto 16px; font-size:32px;">
                ${manager.photo ? `<img src="${manager.photo}">` : manager.name.charAt(0).toUpperCase()}
            </div>
            <h3 style="margin:0; color:#1e293b;">${manager.name}</h3>
        </div>
        <a href="tel:${manager.phone}" class="contact-action-btn btn-call"><i class="fa fa-phone"></i><div><div>Call Now</div><div>${manager.phone}</div></div></a>
        <a href="https://wa.me/${phoneClean}" target="_blank" class="contact-action-btn btn-whatsapp"><i class="fab fa-whatsapp"></i><div><div>WhatsApp</div><div>Send Message</div></div></a>
    `;
}
function closeContactModal() { document.getElementById('managerContactModal').style.display = 'none'; }

function initShopMap() {
    if (!currentShop.location || !currentShop.location.coordinates) return;
    const [lng, lat] = currentShop.location.coordinates;
    const range = currentShop.range || 5000;

    if(shopMap) shopMap.remove();
    shopMap = L.map('shopMapContainer').setView([lat, lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(shopMap);

    shopMarker = L.marker([lat, lng], {
        icon: L.divIcon({html: `<div style="font-size: 24px;">${currentShop.icon || '👗'}</div>`, className: 'shop-map-icon', iconSize: [30, 30]})
    }).addTo(shopMap).bindPopup(`<b>${currentShop.shopName}</b><br>Range: ${range/1000} KM`);

    rangeCircle = L.circle([lat, lng], {color: '#10b981', fillColor: '#10b981', fillOpacity: 0.1, radius: range}).addTo(shopMap);
}

function startDynamicLocationTracking() {
    if (locationInterval) clearInterval(locationInterval);
    if (currentShop.locationType !== 'dynamic') return;
    updateShopLocation();
    locationInterval = setInterval(updateShopLocation, 30000);
}

function updateShopLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        if (lastSentLocation) {
            const distance = calculateDistance(lastSentLocation.lat, lastSentLocation.lng, newLat, newLng);
            if (distance < 50) return;
        }
        lastSentLocation = { lat: newLat, lng: newLng };
        await updateShopLocationToServer(newLng, newLat);
        if (shopMap && shopMarker) {
            shopMarker.setLatLng([newLat, newLng]);
            rangeCircle.setLatLng([newLat, newLng]);
            shopMap.setView([newLat, newLng]);
        }
    }, (err) => console.error('Geolocation error:', err), { enableHighAccuracy: true });
}

async function updateShopLocationToServer(lng, lat) {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        await fetch(`/api/local-market/shops/${shopId}/update-location`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token},
            body: JSON.stringify({coordinates: [lng, lat], locationType: 'dynamic'})
        });
        currentShop.location.coordinates = [lng, lat];
    } catch (err) { console.error('Location sync failed:', err); }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; const φ1 = lat1 * Math.PI / 180; const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180; const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function loadItems(items) {
    const tbody = document.getElementById('productTableBody');
    if (!items || items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i class="fa fa-tshirt"></i><h4>No Garments Yet</h4><button class="btn btn-primary" onclick="document.getElementById('addProductBtn').click()"><i class="fa fa-plus"></i> Add First Garment</button></div></td></tr>`;
        return;
    }
    tbody.innerHTML = items.map(item => {
        const sizes = (item.sizes || [item.size]).filter(Boolean);
        const colors = (item.colors || [item.color]).filter(Boolean);
        return `<tr><td><strong>${item.name}</strong></td><td>${item.category}</td><td>${sizes.map(s => `<span class="size-badge">${s}</span>`).join('')}</td><td>${colors.map(c => `<span class="color-dot" style="background:${c.toLowerCase()}"></span>`).join('')}</td><td>${item.fabric}</td><td><strong>₹${item.price}</strong></td><td>${item.stock}</td><td><button class="btn btn-secondary" onclick="editItem('${item._id}')" style="padding:6px 12px;"><i class="fa fa-edit"></i></button><button class="btn btn-danger" onclick="deleteItem('${item._id}')" style="padding:6px 12px;"><i class="fa fa-trash"></i></button></td></tr>`;
    }).join('');
}

document.getElementById('addProductBtn').onclick = function() { window.location.href = `/shop-templates/cloth/product-form.html?shopId=${shopId}`; };
function editShopInfo() { window.location.href = `/local-market/edit-shop.html?shopId=${shopId}`; }
function loadOrders() { window.location.href = `/local-market/orders.html?shopId=${shopId}`; }
function editItem(itemId) { window.location.href = `/shop-templates/cloth/product-form.html?shopId=${shopId}&itemId=${itemId}`; }

async function deleteItem(itemId) {
    if (!confirm('Delete this item?')) return;
    try { await fetch(`/api/local-market/products/${itemId}`, {method: 'DELETE'}); alert('Item deleted!'); loadShopData(); } 
    catch (err) { alert('Failed to delete: ' + err.message); }
}

window.addEventListener('beforeunload', () => { if (locationInterval) clearInterval(locationInterval); if(liveWatchId) navigator.geolocation.clearWatch(liveWatchId); });

loadShopData();