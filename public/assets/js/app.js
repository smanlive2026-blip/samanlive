// ========================================
// SAMANLIVE - DYNAMIC JAVASCRIPT - FINAL MERGED
// ========================================

// Global variables
let allModules = [];
let allAds = [];
let allServices = [];
let nearbyVideos = [];
let allCampaigns = [];
let siteSettings = {};
let userLocation = null;
let locationIntervalId = null;
let lastFetchedLocation = null;
let currentUser = null;
let allProducts = [];

// Backup for search
let originalServices = [];
let originalProducts = [];

// ========================================
// LOCATION MANAGER - LIVE + SERVER SYNC
// ========================================
window.LocationManager = {
    updateInterval: 30000, // 30 sec
    isRequesting: false,
    minDistance: 100, // 100 meter

    getManual: function() {
        return new Promise((resolve) => {
            if(this.isRequesting) {
                resolve(window.currentUserLocation);
                return;
            }
            if(!navigator.geolocation) {
                resolve(null);
                return;
            }
            this.isRequesting = true;
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                    window.currentUserLocation = loc;
                    userLocation = loc;
                    lastFetchedLocation = {...loc};
                    this.isRequesting = false;
                    await this.sendLocationToServer(loc);
                    resolve(loc);
                },
                (error) => {
                    this.isRequesting = false;
                    resolve(null);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    },

    startAutoUpdate: function() {
        if (locationIntervalId!== null) return;
        this.fetchAndUpdate();
        locationIntervalId = setInterval(() => { this.fetchAndUpdate(); }, this.updateInterval);
    },

    stopAutoUpdate: function() {
        if (locationIntervalId!== null) {
            clearInterval(locationIntervalId);
            locationIntervalId = null;
        }
    },

    fetchAndUpdate: async function() {
        if(!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const newLoc = { lat: position.coords.latitude, lng: position.coords.longitude };

                // 100m check
                if(lastFetchedLocation && calculateDistance(lastFetchedLocation.lat, lastFetchedLocation.lng, newLoc.lat, newLoc.lng) < this.minDistance){
                    return;
                }

                window.currentUserLocation = newLoc;
                userLocation = newLoc;
                lastFetchedLocation = {...newLoc};
                showUserLocationInHeader();
                await this.sendLocationToServer(newLoc);
                reloadNearbyData(); // ✅ sirf nearby reload hoga
            },
            (error) => { console.error('Auto location error:', error.message); },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
    },

    sendLocationToServer: async function(loc) {
        const userId = localStorage.getItem('userId');
        if(!userId) return;
        try{
            await fetch('/api/location/user', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ userId, lat: loc.lat, lng: loc.lng })
            });
        }catch(e){ console.log('Location save error', e) }
    }
};

window.currentUserLocation = null;

async function getUserLocation() {
    const loc = await window.LocationManager.getManual();
    if (loc) window.LocationManager.startAutoUpdate();
    return loc;
}

// METER ME DISTANCE
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

window.addEventListener('beforeunload', () => {
    window.LocationManager.stopAutoUpdate();
});

// ✅ RELOAD NEARBY DATA - LOCATION KE HISAB SE
 async function reloadNearbyData() {
   let apiUrl = '/api/shops/nearby'; // default: sab shop
    
    if(userLocation) {
        // agar location hai to nearby wali
        apiUrl += `?lat=${userLocation.lat}&lng=${userLocation.lng}`;
        console.log("📍 Loading Nearby Shops");
    } else {
        console.log("🌍 Loading All Shops - Location nahi mili");
    }

    try {
        const shopsRes = await fetch(apiUrl); // ✅ yaha lat-lng optional ho gaya
        if(shopsRes.ok) {
            const res = await shopsRes.json();
            const shopsData = res.data || res || []; // ✅ koi bhi format ho
            console.log("SHOPS COUNT:", shopsData.length);

            allServices = shopsData.map(shop => ({
                _id: String(shop.shopId || shop._id || shop.id),
                shopName: shop.shopName || shop.name || 'Shop',
                distance: shop.distance || 0,
                shopType: shop.shopType || 'general',
                logo: shop.logo || '/assets/default-shop.png',
                icon: '🏪'
            }));
            originalServices = [...allServices];
            renderSixLineShops();
        }

        const productsRes = await fetch(`/api/products/top-rated?limit=24`);
        if(productsRes.ok) {
            allProducts = await productsRes.json();
            originalProducts = [...allProducts];
            renderSixLineProducts();
        }
    } catch(e) {
        console.error('Failed to reload:', e);
    }
}
// ========================================
// LOAD DATA FROM SERVER
// ========================================
async function loadAllData() {
    try {
        await getUserLocation();

        const [adsRes, videosRes, campaignsRes, settingsRes, modulesRes] = await Promise.all([
            fetch('/api/ads').catch(()=>({ok:false})),
            fetch('/api/videos').catch(()=>({ok:false})),
            fetch('/api/campaigns').catch(()=>({ok:false})),
            fetch('/api/settings').catch(()=>({ok:false})),
            fetch('/api/modules').catch(()=>({ok:false}))
        ]);

        if(adsRes.ok) allAds = await adsRes.json();
        if(videosRes.ok) nearbyVideos = await videosRes.json();
        if(campaignsRes.ok) allCampaigns = await campaignsRes.json();
        if(settingsRes.ok) siteSettings = await settingsRes.json();
        if(modulesRes.ok) allModules = (await modulesRes.json()).modules || [];

        // INITIAL NEARBY LOAD
        await reloadNearbyData(); // ✅ location ho ya na ho, ye chala dega

        if(!userLocation) showLocationPopup();
        showUserLocationInHeader();

        renderServices();
        renderTopAds();
        renderCampaigns();
        renderSixLineShops();
        renderSixLineProducts();
        renderVideos();
        updateLogo();

    } catch(e) {
        console.error('Failed to load data:', e);
    }
}

function showLocationPopup() {
    if(document.getElementById('locPopup')) return;
    const popup = document.createElement('div');
    popup.id = 'locPopup';
    popup.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#1e40af;color:white;padding:12px 20px;border-radius:8px;z-index:9999;`;
    popup.innerHTML = `📍 Location enable karein <button onclick="this.parentElement.remove()" style="margin-left:10px;background:white;color:#1e40af;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">OK</button>`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 6000);
}

function showUserLocationInHeader() {
    if (!userLocation) return;
    let headerLocation = document.querySelector('.location-display');
    if (!headerLocation) {
        const header = document.querySelector('.header-container');
        const locDiv = document.createElement('div');
        locDiv.className = 'location-display';
        locDiv.style.cssText = 'font-size:12px;color:#e0e7ff;display:flex;align-items:center;gap:4px;margin-left:10px;';
        locDiv.innerHTML = `📍 <span id="userCity">Detecting...</span>`;
        header.querySelector('.search-box-modern')?.insertAdjacentElement('afterend', locDiv);
    }
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}`)
   .then(r => r.json())
   .then(data => {
        document.getElementById('userCity').textContent = data.address.city || data.address.town || 'Your Area';
    }).catch(() => {
        document.getElementById('userCity').textContent = 'Your Area';
    });
}

function updateLogo() {
    const logoContainer = document.querySelector('.logo');
    const header = document.querySelector('.header');
    const footerLogo = document.querySelector('.footer-logo');

    if(header) header.style.background = `linear-gradient(135deg, ${siteSettings.headerColor || '#667eea'}, #764ba2)`;

    if(logoContainer) {
        const logoImg = siteSettings.logoImage;
        const logoText = siteSettings.logoText || 'SAMANLIVE';
        const logoFirstChar = logoText.charAt(0);
        logoContainer.innerHTML = `
            ${logoImg? `<img src="${logoImg}" class="logo-img" style="width:40px;height:40px;border-radius:8px;object-fit:cover;margin-right:10px;">` : `<div class="logo-icon">${logoFirstChar}</div>`}
            <div class="logo-text">${logoText}</div>
        `;
    }
    if(footerLogo) footerLogo.textContent = siteSettings.logoText || 'SAMANLIVE';
}

// SMART SORT
function getModuleClicks() { return JSON.parse(localStorage.getItem('samanlive_module_clicks') || '{}'); }
function saveModuleClick(moduleId) {
    const clicks = getModuleClicks();
    clicks[moduleId] = (clicks[moduleId] || 0) + 1;
    localStorage.setItem('samanlive_module_clicks', JSON.stringify(clicks));
    renderServices();
}
function sortModulesByUsage(modules) {
    const clicks = getModuleClicks();
    return [...modules].sort((a, b) => (clicks[b.id] || 0) - (clicks[a.id] || 0) || (a.priority || 0) - (b.priority || 0));
}

// RENDER SERVICES
function renderServices(filteredModules = null) {
    const modulesToRender = filteredModules || allModules;
    const sortedModules = sortModulesByUsage(modulesToRender);
    const gridEl = document.getElementById('serviceGrid');
    if(!gridEl) return;
    gridEl.innerHTML = sortedModules.map(module => `
        <div class="service-item" data-module-id="${module.id}">
            <a href="${module.link}" onclick="saveModuleClick('${module.id}')">
                <div class="service-icon" style="background: linear-gradient(135deg, ${module.color}, ${module.color}dd);">${module.icon}</div>
                <p>${module.name}</p>
            </a>
        </div>
    `).join('');
}

// RENDER ADS & CAMPAIGNS
function renderTopAds() {
    const topAdChunks = [];
    for (let i = 0; i < allAds.length; i += 4) topAdChunks.push(allAds.slice(i, i + 4));
    const topAdsEl = document.getElementById('topAdsContainer');
    if(topAdsEl) topAdsEl.innerHTML = topAdChunks.map((chunk, idx) => `
        <div class="ad-slide ${idx === 0? 'active' : ''}">
            <div class="ads-grid">${chunk.map(ad => `
                <div class="ad-card" style="background: linear-gradient(135deg, ${ad.color}, ${ad.color}cc)">
                    <h3>${ad.title}</h3><p>${ad.desc}</p><button class="ad-btn">${ad.btn}</button>
                </div>`).join('')}
            </div>
        </div>`).join('');
}

function renderCampaigns() {
    const campaignChunks = [];
    for (let i = 0; i < allCampaigns.length; i += 4) campaignChunks.push(allCampaigns.slice(i, i + 4));
    const campaignEl = document.getElementById('campaignContainer');
    if(campaignEl) campaignEl.innerHTML = campaignChunks.map((chunk, idx) => `
        <div class="ad-slide ${idx === 0? 'active' : ''}">
            <div class="ads-grid">${chunk.map(campaign => `
                <div class="campaign-card" style="background: linear-gradient(135deg, ${campaign.color}, ${campaign.color}cc)">
                    <h3>${campaign.title}</h3><p>${campaign.desc}</p><button class="campaign-btn">${campaign.btn}</button>
                </div>`).join('')}
            </div>
        </div>`).join('');
}

// RENDER SHOPS - 6 LINE
function renderSixLineShops() {
    const container = document.getElementById('shopsContent');
    if (!container) return;
    if (!allServices || allServices.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🏪</div><p>No shops available in your area</p></div>`;
        return;
    }
    container.innerHTML = '';
    const shopsPerLine = 4;
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('div');
        row.className = 'carousel-item';
        const lineShops = allServices.slice(i * shopsPerLine, (i + 1) * shopsPerLine);
        if (lineShops.length === 0) continue;
        lineShops.forEach(shop => {
            const shopType = ['cloth','kirana','medical','restaurant'].includes(shop.shopType)? shop.shopType : 'general';
            row.innerHTML += `
                <div class="shop-card-mini" onclick="window.location.href='/shop-templates/${shopType}/user-view.html?shopId=${shop._id}'">
                    <img src="${shop.logo || '/assets/default-shop.png'}" onerror="this.src='/assets/default-shop.png'">
                    <p>${shop.shopName}</p>
                    ${shop.distance? `<small style="color:#10b981;font-size:11px;">📍 ${(shop.distance/1000).toFixed(1)}Km</small>` : ''}
                </div>
            `;
        });
        container.appendChild(row);
    }
}

// RENDER TOP PRODUCTS - 6 LINE
function renderSixLineProducts() {
    const container = document.getElementById('topProductsContent');
    if (!container) return;
    if (!allProducts || allProducts.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📦</div><p>No top rated products yet</p></div>`;
        return;
    }
    container.innerHTML = '';
    const productsPerLine = 4;
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('div');
        row.className = 'carousel-item';
        const lineProducts = allProducts.slice(i * productsPerLine, (i + 1) * productsPerLine);
        if (lineProducts.length === 0) continue;
        lineProducts.forEach(product => {
            row.innerHTML += `
                <div class="shop-card-mini" onclick="openProduct('${product._id}')">
                    <img src="${product.image || '/assets/default-product.png'}" onerror="this.src='/assets/default-product.png'">
                    <p>${product.name}</p>
                    <small>₹${product.price} ⭐${product.rating || 0}</small>
                </div>
            `;
        });
        container.appendChild(row);
    }
}

function openProduct(productId) {
    window.location.href = `/product.html?id=${productId}`;
}

// RENDER VIDEOS
function renderVideos() {
    const doubleVideos = [...nearbyVideos,...nearbyVideos];
    const videosEl = document.getElementById('videosContent');
    if(videosEl) videosEl.innerHTML = `
        <div class="videos-grid">${doubleVideos.map(video => `
            <div class="video-card" data-video-url="${video.url}" data-shop-id="${video.shopId || ''}">
                <video muted loop playsinline autoplay><source src="${video.url}" type="video/mp4"></video>
                <div class="video-shop-name">${video.shopName || 'Shop'}</div>
                <div class="video-label">${video.title}</div>
            </div>`).join('')}
        </div>`;
}

// SLIDER LOGIC
let topAdIndex = 0, campaignIndex = 0;
function showTopAd(idx) { document.querySelectorAll('#topAdsContainer .ad-slide').forEach((s,i)=>s.classList.toggle('active', i===idx)); topAdIndex=idx; }
function nextTopAd() { const slides=document.querySelectorAll('#topAdsContainer.ad-slide'); if(slides.length) {topAdIndex=(topAdIndex+1)%slides.length; showTopAd(topAdIndex);} }
function showCampaign(idx) { document.querySelectorAll('#campaignContainer .ad-slide').forEach((s,i)=>s.classList.toggle('active', i===idx)); campaignIndex=idx; }
function nextCampaign() { const slides=document.querySelectorAll('#campaignContainer.ad-slide'); if(slides.length) {campaignIndex=(campaignIndex+1)%slides.length; showCampaign(campaignIndex);} }
setInterval(nextTopAd, 5000); setInterval(nextCampaign, 6000);

// VIDEO MODAL
document.addEventListener('click', function(e) {
    const videoCard = e.target.closest('.video-card');
    if (videoCard) openVideoModal(videoCard.dataset.videoUrl, videoCard.dataset.shopId);
});
function openVideoModal(url, shopId) {
    const shop = allServices.find(s => s._id === shopId);
    document.getElementById('videoModal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'videoModal';
    modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 9999; display: flex; align-items: center; justify-content: center;`;
    modal.innerHTML = `<div style="position:relative;width:90%;max-width:900px;">
        <button onclick="closeVideoModal()" style="position:absolute;top:-40px;right:0;background:#fff;border:none;font-size:30px;width:40px;height:40px;border-radius:50%;cursor:pointer;">×</button>
        <video controls autoplay style="width:100%;border-radius:10px;"><source src="${url}" type="video/mp4"></video>
        ${shop? `<div style="background:white;padding:12px;border-radius:0 0 10px 10px;display:flex;justify-content:space-between;align-items:center;">
            <div><div style="font-weight:700;color:#1e40af;">${shop.shopName}</div></div>
            <button onclick="window.location.href='/shop-templates/${shop.shopType}/user-view.html?shopId=${shop._id}'" style="background:#1e40af;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;">Visit Shop</button>
        </div>` : ''}
    </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) { if(e.target === modal) closeVideoModal(); });
}
function closeVideoModal() { document.getElementById('videoModal')?.remove(); }

// SEARCH
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    if(searchTerm === '') {
        allServices = [...originalServices]; allProducts = [...originalProducts];
        renderServices(); renderSixLineShops(); renderSixLineProducts();
    } else {
        const filteredModules = allModules.filter(m => m.name.toLowerCase().includes(searchTerm));
        allServices = originalServices.filter(s => (s.shopName || s.name || '').toLowerCase().includes(searchTerm));
        allProducts = originalProducts.filter(p => p.name.toLowerCase().includes(searchTerm));
        renderServices(filteredModules); renderSixLineShops(); renderSixLineProducts();
    }
}
document.getElementById('searchInput')?.addEventListener('input', performSearch);

// AUTH
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('userToken');
    if (token) fetchUserData(token);
    updateProfileAvatar();
});

async function fetchUserData(token) {
    try {
        const res = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } });
        const data = await res.json();
        if (data.success) {
            currentUser = data.user; window.currentUser = data.user;
            localStorage.setItem('userId', data.user._id); // ✅ location ke liye
            updateProfileAvatar();
        }
        else localStorage.removeItem('userToken');
    } catch (err) { localStorage.removeItem('userToken'); }
}

function updateProfileAvatar() {
    const avatar = document.getElementById('headerProfilePic');
    if (!avatar) return;
    avatar.src = (currentUser?.profilePic || '/assets/default-avatar.png') + '?t=' + Date.now();
    avatar.onclick = currentUser? goToProfilePage : openLoginModal;
}

function openLoginModal() { document.getElementById('loginModal').style.display = 'flex'; }
function closeLoginModal() { document.getElementById('loginModal').style.display = 'none'; }

async function loginWithPhone() {
    const phone = document.getElementById('loginPhone').value.trim();
    const name = document.getElementById('loginName').value.trim();
    if (!phone || phone.length!== 10) return alert('Valid 10 digit phone dalo');
    if (!name) return alert('Name dalo');
    try {
        const res = await fetch('/api/auth/login-phone', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, name }) });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('userToken', data.token);
            localStorage.setItem('userId', data.user._id);
            currentUser = data.user; window.currentUser = data.user;
            closeLoginModal(); updateProfileAvatar(); alert('Login Success! 🎉');
            window.location.reload();
        } else alert('Login failed: ' + data.error);
    } catch (err) { alert('Login failed. Server check karo.'); }
}
function openProfileModal() { if (!currentUser) return openLoginModal(); document.getElementById('profileName').textContent = currentUser.name; document.getElementById('userUniqueId').textContent = currentUser.userId; document.getElementById('profilePic').src = currentUser.profilePic || '/assets/default-avatar.png'; document.getElementById('profileModal').style.display = 'flex'; }
function closeProfileModal() { document.getElementById('profileModal').style.display = 'none'; }
function goToProfilePage() { if (!currentUser) openLoginModal(); else window.location.href = '/profile.html'; }

// DRAG SUPPORT + TOUCH
function startTrainSliding() {
    [document.getElementById('shopsContent'), document.getElementById('videosContent'), document.getElementById('topProductsContent')].forEach(container => {
        if (!container) return;
        let isDown = false, startX, scrollLeft;
        const start = (e) => {isDown=true; container.classList.add('dragging'); startX=(e.pageX||e.touches[0].pageX)-container.offsetLeft; scrollLeft=container.scrollLeft;}
        const end = () => {isDown=false; container.classList.remove('dragging');}
        const move = (e) => {if(!isDown)return; e.preventDefault(); const x=(e.pageX||e.touches[0].pageX)-container.offsetLeft; container.scrollLeft=scrollLeft-(x-startX)*2;}
        container.addEventListener('mousedown', start); container.addEventListener('mouseup', end); container.addEventListener('mouseleave', end); container.addEventListener('mousemove', move);
        container.addEventListener('touchstart', start); container.addEventListener('touchend', end); container.addEventListener('touchmove', move);
    });
}
setTimeout(startTrainSliding, 2000);

// INIT
loadAllData();