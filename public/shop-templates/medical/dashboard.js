const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
let currentShop = null;
let locationInterval = null;
let shopMap = null;
let shopMarker = null;
let rangeCircle = null;
let lastSentLocation = null;
let shopManagers = [];

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
        
        const statusEl = document.getElementById('shopStatus');
        statusEl.innerText = shop.status.toUpperCase();
        statusEl.className = 'badge ' + shop.status;

        const locationBadge = document.getElementById('locationTypeBadge');
        const rangeText = document.getElementById('rangeText');
        const locationUpdateText = document.getElementById('locationUpdateText');
        
        if (shop.locationType === 'dynamic') {
            locationBadge.innerHTML = `<span class="location-status"><span class="pulse-dot"></span>Dynamic Location</span>`;
            rangeText.textContent = `(${shop.range/1000} KM Radius)`;
            locationUpdateText.textContent = 'Updates every 50m movement';
        } else {
            locationBadge.innerHTML = `<span class="location-status inactive">Static Location</span>`;
            rangeText.textContent = `(${shop.range/1000} KM Radius)`;
            locationUpdateText.textContent = 'Fixed location';
        }

        const items = shop.items || shop.products || [];
        const today = new Date();
        const expiringSoon = items.filter(i => {
            if (!i.expiry) return false;
            const expDate = new Date(i.expiry);
            const diffDays = (expDate - today) / (1000 * 60 * 60 * 24);
            return diffDays > 0 && diffDays < 30;
        });
        
        document.getElementById('totalMedicines').innerText = items.length;
        document.getElementById('expiringSoon').innerText = expiringSoon.length;
        document.getElementById('todayOrders').innerText = shop.todayOrders || 0;
        document.getElementById('assignedManagerCount').innerText = shop.managerCodes?.length || 0;

        loadItems(items);
        document.getElementById('loader').style.display = 'none';
        initShopMap();
        startDynamicLocationTracking();
        loadShopManagers();

    } catch (err) {
        console.error(err);
        alert('Failed to load shop: ' + err.message);
        document.getElementById('loader').style.display = 'none';
    }
}

async function loadShopManagers() {
    try {
        const res = await fetch(`/api/local-market/shops/${shopId}/managers`);
        const data = await res.json();
        
        if (data.success) {
            shopManagers = data.managers;
            document.getElementById('assignedManagerCount').innerText = shopManagers.length;
            console.log('✅ Loaded managers:', shopManagers);
        }
    } catch (err) {
        console.error('Failed to load managers:', err);
    }
}

function openManagersModal() {
    document.getElementById('managersModal').style.display = 'flex';
    const container = document.getElementById('managersListContainer');
    
    if (shopManagers.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px;">
                <i class="fa fa-users" style="font-size:48px; color:#cbd5e1;"></i>
                <h4 style="color:#475569; margin:16px 0 8px 0;">No Managers Assigned</h4>
                <p style="color:#94a3b8; font-size:14px;">This shop doesn't have any area managers assigned yet.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = shopManagers.map(m => `
        <div class="manager-list-item" onclick='showManagerContact(${JSON.stringify(m).replace(/'/g, "&apos;")})'>
            <div class="manager-avatar">
                ${m.photo ? `<img src="${m.photo}" alt="${m.name}">` : m.name.charAt(0).toUpperCase()}
            </div>
            <div class="manager-info">
                <h4>${m.name}</h4>
                <p><i class="fa fa-id-badge"></i> ${m.managerCode}</p>
                <p><i class="fa fa-map-marker-alt"></i> ${m.areaCode}</p>
            </div>
            <i class="fa fa-chevron-right" style="color:#94a3b8; font-size:20px;"></i>
        </div>
    `).join('');
}

function closeManagersModal() {
    document.getElementById('managersModal').style.display = 'none';
}

function showManagerContact(manager) {
    closeManagersModal();
    document.getElementById('managerContactModal').style.display = 'flex';
    
    const phoneClean = manager.phone.replace(/[^0-9]/g, '');
    
    document.getElementById('managerContactBody').innerHTML = `
        <div style="text-align:center; margin-bottom:24px;">
            <div class="manager-avatar" style="width:80px; height:80px; margin:0 auto 16px; font-size:32px;">
                ${manager.photo ? `<img src="${manager.photo}" alt="${manager.name}">` : manager.name.charAt(0).toUpperCase()}
            </div>
            <h3 style="margin:0 0 4px 0; color:#1e293b; font-size:22px;">${manager.name}</h3>
            <p style="margin:0; color:#64748b; font-size:14px;">
                <i class="fa fa-id-badge"></i> ${manager.managerCode} • <i class="fa fa-map-marker-alt"></i> ${manager.areaCode}
            </p>
        </div>
        
        <a href="tel:${manager.phone}" class="contact-action-btn btn-call">
            <i class="fa fa-phone"></i>
            <div>
                <div style="font-size:14px; opacity:0.9;">Call Now</div>
                <div style="font-size:18px;">${manager.phone}</div>
            </div>
        </a>
        
        <a href="https://wa.me/${phoneClean}?text=Hi ${encodeURIComponent(manager.name)}, I want to place an order from my shop ${encodeURIComponent(currentShop.shopName)}" target="_blank" class="contact-action-btn btn-whatsapp">
            <i class="fab fa-whatsapp"></i>
            <div>
                <div style="font-size:14px; opacity:0.9;">WhatsApp</div>
                <div style="font-size:18px;">Send Message</div>
            </div>
        </a>
        
        <a href="mailto:${manager.email}?subject=Order Request from ${encodeURIComponent(currentShop.shopName)}" class="contact-action-btn btn-email">
            <i class="fa fa-envelope"></i>
            <div>
                <div style="font-size:14px; opacity:0.9;">Email</div>
                <div style="font-size:16px;">${manager.email}</div>
            </div>
        </a>
    `;
}

function closeContactModal() {
    document.getElementById('managerContactModal').style.display = 'none';
}

function initShopMap() {
    if (!currentShop.location ||!currentShop.location.coordinates) return;

    const [lng, lat] = currentShop.location.coordinates;
    const range = currentShop.range || 5000;

    shopMap = L.map('shopMapContainer').setView([lat, lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(shopMap);

    shopMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            html: `<div style="font-size: 24px;">${currentShop.icon || '💊'}</div>`,
            className: 'shop-map-icon',
            iconSize: [30, 30]
        })
    }).addTo(shopMap).bindPopup(`<b>${currentShop.shopName}</b><br>Range: ${range/1000} KM`);

    rangeCircle = L.circle([lat, lng], {
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.1,
        radius: range
    }).addTo(shopMap);
}

function expandMap() {
    if (!shopMap) return;

    const modal = document.createElement('div');
    modal.id = 'mapModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.9); z-index: 9999; display: flex;
        align-items: center; justify-content: center;
    `;
    modal.innerHTML = `
        <div style="position: relative; width: 95%; max-width: 1000px; height: 80%;">
            <button onclick="closeMapModal()" style="position: absolute; top: -40px; right: 0; background: white; border: none; font-size: 30px; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; z-index: 10000;">×</button>
            <div id="expandedMap" style="width: 100%; height: 100%; border-radius: 12px;"></div>
        </div>
    `;
    document.body.appendChild(modal);

    const [lng, lat] = currentShop.location.coordinates;
    const expandedMap = L.map('expandedMap').setView([lat, lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(expandedMap);
    L.marker([lat, lng], {
        icon: L.divIcon({
            html: `<div style="font-size: 32px;">${currentShop.icon || '💊'}</div>`,
            className: 'shop-map-icon',
            iconSize: [40, 40]
        })
    }).addTo(expandedMap).bindPopup(`<b>${currentShop.shopName}</b><br>Range: ${currentShop.range/1000} KM`).openPopup();
    L.circle([lat, lng], {
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.15,
        radius: currentShop.range || 5000
    }).addTo(expandedMap);

    modal.onclick = (e) => { if (e.target === modal) closeMapModal(); };
}

function closeMapModal() {
    const modal = document.getElementById('mapModal');
    if (modal) modal.remove();
}

function startDynamicLocationTracking() {
    if (!currentShop || currentShop.locationType!== 'dynamic') {
        console.log('📍 Shop is static, no location tracking needed');
        return;
    }

    if (locationInterval) clearInterval(locationInterval);

    console.log('🚶 Starting dynamic location tracking for shop:', currentShop.shopName);
    updateShopLocation();
    locationInterval = setInterval(updateShopLocation, 30000);
}

function updateShopLocation() {
    if (!navigator.geolocation) {
        console.error('Geolocation not supported');
        return;
    }

     navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const newLat = pos.coords.latitude;
            const newLng = pos.coords.longitude;

            if (lastSentLocation) {
                const distance = calculateDistance(
                    lastSentLocation.lat, lastSentLocation.lng,
                    newLat, newLng
                );
                if (distance < 50) return;
            }

            console.log('📍 Location changed:', newLat, newLng);
            lastSentLocation = { lat: newLat, lng: newLng };

            await updateShopLocationToServer(newLng, newLat);

            if (shopMap && shopMarker && rangeCircle) {
                shopMarker.setLatLng([newLat, newLng]);
                rangeCircle.setLatLng([newLat, newLng]);
                shopMap.setView([newLat, newLng]);
            }
        },
        (err) => {
            console.error('Geolocation error:', err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

async function updateShopLocationToServer(lng, lat) {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`/api/local-market/shops/${shopId}/update-location`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                coordinates: [lng, lat]
            })
        });

        if (res.ok) {
            console.log('✅ Location synced to server');
            currentShop.location.coordinates = [lng, lat];
        }
    } catch (err) {
        console.error('Location sync failed:', err);
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function loadItems(items) {
    const tbody = document.getElementById('productTableBody');
    
    if (!items || items.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="7">
                <div class="empty-state">
                    <i class="fa fa-pills"></i>
                    <h4>No Medicines Yet</h4>
                    <p>Start by adding your first medicine to the shop</p>
                    <button class="btn btn-primary" onclick="document.getElementById('addProductBtn').click()">
                        <i class="fa fa-plus"></i> Add First Medicine
                    </button>
                </div>
            </td>
        </tr>`;
        return;
    }

    const today = new Date();
    tbody.innerHTML = items.map(item => {
        let expiryClass = 'safe';
        let expiryText = item.expiry || '-';
        
        if (item.expiry) {
            const expDate = new Date(item.expiry);
            const diffDays = (expDate - today) / (1000 * 60 * 60 * 24);
            if (diffDays < 0) {
                expiryClass = 'expired';
                expiryText = 'EXPIRED';
            } else if (diffDays < 30) {
                expiryClass = 'warning';
                expiryText = `${Math.floor(diffDays)} days left`;
            }
        }
        
        return `
        <tr>
            <td><strong>${item.name}</strong></td>
            <td>${item.company || '-'}</td>
            <td>${item.batch || '-'}</td>
            <td><span class="expiry-badge ${expiryClass}">${expiryText}</span></td>
            <td>₹${item.price}</td>
            <td>${item.stock || 0}</td>
            <td>
                <button class="btn btn-secondary" onclick="editItem('${item._id}')" style="padding:6px 12px;font-size:12px;">
                    <i class="fa fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteItem('${item._id}')" style="padding:6px 12px;font-size:12px;">
                    <i class="fa fa-trash"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

document.getElementById('addProductBtn').onclick = function() {
    window.location.href = `/shop-templates/medical/product-form.html?shopId=${shopId}`;
};

function editShopInfo() {
    window.location.href = `/local-market/edit-shop.html?shopId=${shopId}`;
}

function loadOrders() {
    window.location.href = `/local-market/orders.html?shopId=${shopId}`;
}

function editItem(itemId) {
    window.location.href = `/shop-templates/medical/product-form.html?shopId=${shopId}&itemId=${itemId}`;
}

async function deleteItem(itemId) {
    if (!confirm('Delete this item?')) return;
    try {
        await fetch(`/api/local-market/products/${itemId}`, {
            method: 'DELETE'
        });
        alert('Item deleted!');
        loadShopData();
    } catch (err) {
        alert('Failed to delete: ' + err.message);
    }
}

window.addEventListener('beforeunload', () => {
    if (locationInterval) clearInterval(locationInterval);
});

loadShopData();