// ========================================
// SAMANLIVE - DYNAMIC JAVASCRIPT - FINAL    public/assets/js/app.js 
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
// LOCATION MANAGER
// ========================================
window.LocationManager = {
    updateInterval: 30000,
    isRequesting: false,

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
                (position) => {
                    const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                    window.currentUserLocation = loc;
                    userLocation = loc;
                    lastFetchedLocation = {...loc};
                    this.isRequesting = false;
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

    fetchAndUpdate: function() {
        if(!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newLoc = { lat: position.coords.latitude, lng: position.coords.longitude };
                window.currentUserLocation = newLoc;
                userLocation = newLoc;
                lastFetchedLocation = {...newLoc};
            },
            (error) => { console.error('Auto location error:', error.message); },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
    }
};

window.currentUserLocation = null;

async function getUserLocation() {
    const loc = await window.LocationManager.getManual();
    if (loc) window.LocationManager.startAutoUpdate();
    return loc;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
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

// ========================================
// LOCATION ADD - 1. USER LIVE LOCATION KO SERVER PE BHEJNE KA FUNCTION
// ========================================
let userWatchId = null; // location.user.js ke liye global variable
function startUserLiveLocation() {
    if(!navigator.geolocation) return;
    if(!localStorage.getItem('userId')) return; // login nahi hai to skip

    // har 100 meter pe location update hogi
    userWatchId = LocationCore.startWatch((lat, lng) => {
        // Server ko bhejo
        fetch('/api/location/user', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ userId: localStorage.getItem('userId'), lat, lng })
        }).catch(err => console.log('User location update failed', err));

        // Nearby shops reload karne ke liye
        if(typeof loadAllData === 'function') loadAllData();
        
    }, 100);
}

// ========================================
// LOAD DATA FROM SERVER - EK HI FUNCTION
// ========================================
async function loadAllData() {
    try {
        await getUserLocation();

        // LOCATION ADD - 2. Shops API me lat lng bhejna hai taaki nearby mile
        let shopApiUrl = '/api/shop/public';
        if(userLocation) {
            shopApiUrl += `?lat=${userLocation.lat}&lng=${userLocation.lng}`;
        }

        const [adsRes, videosRes, campaignsRes, settingsRes, modulesRes, shopsRes, productsRes] = await Promise.all([
            fetch('/api/ads').catch(()=>({ok:false})),
            fetch('/api/videos').catch(()=>({ok:false})),
            fetch('/api/campaigns').catch(()=>({ok:false})),
            fetch('/api/settings').catch(()=>({ok:false})),
            fetch('/api/modules').catch(()=>({ok:false})),
            fetch(shopApiUrl).catch(()=>({ok:false})), // <- YAHI PE UPDATE KIYA
            fetch('/api/products/top-rated?limit=24').catch(()=>({ok:false}))
        ]);

        if(adsRes.ok) allAds = await adsRes.json();
        if(videosRes.ok) nearbyVideos = await videosRes.json();
        if(campaignsRes.ok) allCampaigns = await campaignsRes.json();
        if(settingsRes.ok) siteSettings = await settingsRes.json();
        if(modulesRes.ok) allModules = (await modulesRes.json()).modules || [];
        if(shopsRes.ok) {
            const shopsData = await shopsRes.json();
            allServices = shopsData.data || shopsData;
            originalServices = [...allServices];
        }
        if(productsRes.ok) {
            allProducts = await productsRes.json();
            originalProducts = [...allProducts];
        }

        renderServices();
        renderTopAds();
        renderCampaigns();
        renderSixLineShops();
        renderSixLineProducts();
        renderVideos();
        updateLogo();

    } catch(e) {
        console.error('Failed to load data:', e);
        renderSixLineShops();
        renderSixLineProducts();
        renderServices();
    }
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

// ========================================
// RENDER SERVICES
// ========================================
function getModuleClicks() { return JSON.parse(localStorage.getItem('samanlive_module_clicks') || '{}'); }
function saveModuleClick(moduleId) {
    const clicks = getModuleClicks();
    clicks[moduleId] = (clicks[moduleId] || 0) + 1;
    localStorage.setItem('samanlive_module_clicks', JSON.stringify(clicks));
    renderServices();
}
function sortModulesByUsage(modules) {
    const clicks = getModuleClicks();
    return [...modules].sort((a, b) => (clicks[b.id] || 0) - (clicks[a.id] || 0) || a.priority - b.priority);
}

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

// ========================================
// RENDER ADS & CAMPAIGNS
// ========================================
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

// ========================================
// RENDER SHOPS - 6 LINE
// ========================================
function openShopView(shopId) {
    window.open(`/api/shop/view/${shopId}`, '_blank');
}

function renderSixLineShops() {
    const container = document.getElementById('shopsContent');
    if (!container) return;
    if (!allServices || allServices.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🏪</div><p>No shops available</p></div>`;
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
            row.innerHTML += `
                <div class="shop-card-mini" onclick="openShopView('${shop._id}')">
                    <img src="${shop.logo || '/assets/default-shop.png'}" onerror="this.src='/assets/default-shop.png'">
                    <p>${shop.shopName || shop.name}</p>
                </div>
            `;
        });
        container.appendChild(row);
    }
}

// ========================================
// RENDER TOP PRODUCTS - 6 LINE
// ========================================
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
                <div class="shop-card-mini" onclick="openShopView('${product.shopId}')">
                    <img src="${product.image || '/assets/default-product.png'}" onerror="this.src='/assets/default-product.png'">
                    <p>${product.name}</p>
                </div>
            `;
        });
        container.appendChild(row);
    }
}

// ========================================
// RENDER VIDEOS
// ========================================
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

// ========================================
// SLIDER LOGIC
// ========================================
let topAdIndex = 0;
function showTopAd(idx) {
    const slides = document.querySelectorAll('#topAdsContainer .ad-slide');
    slides.forEach(s => s.classList.remove('active'));
    if(slides[idx]) slides[idx].classList.add('active');
    topAdIndex = idx;
}
function nextTopAd() {
    const slides = document.querySelectorAll('#topAdsContainer .ad-slide');
    if(slides.length === 0) return;
    topAdIndex = (topAdIndex + 1) % slides.length;
    showTopAd(topAdIndex);
}
setInterval(nextTopAd, 5000);

// ========================================
// VIDEO MODAL
// ========================================
document.addEventListener('click', function(e) {
    const videoCard = e.target.closest('.video-card');
    if (videoCard) openVideoModal(videoCard.dataset.videoUrl, videoCard.dataset.shopId);
});

function openVideoModal(url, shopId) {
    const shop = allServices.find(s => s._id === shopId);
    const oldModal = document.getElementById('videoModal');
    if(oldModal) oldModal.remove();
    const modal = document.createElement('div');
    modal.id = 'videoModal';
    modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 9999; display: flex; align-items: center; justify-content: center;`;
    modal.innerHTML = `
        <div style="position:relative;width:90%;max-width:900px;">
            <button onclick="closeVideoModal()" style="position:absolute;top:-40px;right:0;background:#fff;border:none;font-size:30px;width:40px;height:40px;border-radius:50%;cursor:pointer;">×</button>
            <video controls autoplay style="width:100%;border-radius:10px;"><source src="${url}" type="video/mp4"></video>
            ${shop? `
            <div style="background:white;padding:12px;border-radius:0 0 10px 10px;display:flex;justify-content:space-between;align-items:center;">
                <div><div style="font-weight:700;color:#1e40af;">${shop.shopName}</div><div style="font-size:12px;color:#64748b;">${shop.address || 'Location'}</div></div>
                <button onclick="openShopView('${shop._id}')" style="background:#1e40af;color:white;border:none;padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer;">Visit Shop</button>
            </div>` : ''}
        </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) { if(e.target === modal) closeVideoModal(); });
}
function closeVideoModal() { document.getElementById('videoModal')?.remove(); }

// ========================================
// SEARCH
// ========================================
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    if(searchTerm === '') {
        allServices = [...originalServices];
        allProducts = [...originalProducts];
        renderServices(); renderSixLineShops(); renderSixLineProducts();
    } else {
        const filteredModules = allModules.filter(m => m.name.toLowerCase().includes(searchTerm));
        const filteredShops = originalServices.filter(s => (s.shopName || s.name).toLowerCase().includes(searchTerm));
        const filteredProducts = originalProducts.filter(p => p.name.toLowerCase().includes(searchTerm));
        renderServices(filteredModules);
        allServices = filteredShops; renderSixLineShops();
        allProducts = filteredProducts; renderSixLineProducts();
    }
}
document.getElementById('searchInput')?.addEventListener('input', performSearch);
document.getElementById('searchInput')?.addEventListener('keypress', e => { if(e.key === 'Enter') performSearch(); });

// ========================================
// AUTH
// ========================================
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('userToken');
    if (token) fetchUserData(token);
    updateProfileAvatar();
    
    // LOCATION ADD - 3. Login ke baad live location start karo
    startUserLiveLocation();
});

async function fetchUserData(token) {
    try {
        const res = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } });
        const data = await res.json();
        if (data.success) { 
            currentUser = data.user; 
            window.currentUser = data.user; 
            // LOCATION ADD - 4. userId localStorage me save karo taaki location bheje
            localStorage.setItem('userId', data.user._id);
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
        const res = await fetch('/api/auth/login-phone', { // ✅ YE SAHI HAI
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ phone, name }) 
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('userToken', data.token); // ✅ TOKEN SAVE KAR, ID NAHI
            localStorage.setItem('userId', data.user._id);
            currentUser = data.user; window.currentUser = data.user;
            closeLoginModal(); updateProfileAvatar(); alert('Login Success! 🎉'); 
            startUserLiveLocation();
            window.location.reload();
        } else alert('Login failed: ' + data.error);
    } catch (err) { alert('Login failed. Server check karo.'); }
}

function openProfileModal() {
    if (!currentUser) return openLoginModal();
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('userUniqueId').textContent = currentUser.userId;
    document.getElementById('profilePic').src = currentUser.profilePic || '/assets/default-avatar.png';
    document.getElementById('profileModal').style.display = 'flex';
}
function closeProfileModal() { document.getElementById('profileModal').style.display = 'none'; }
function goToProfilePage() { if (!currentUser) openLoginModal(); else window.location.href = '/profile.html'; }

// ========================================
// DRAG SUPPORT
// ========================================
function startTrainSliding() {
    [document.getElementById('shopsContent'), document.getElementById('videosContent'), document.getElementById('topProductsContent')].forEach(container => {
        if (!container) return;
        let isDown = false, startX, scrollLeft;
        container.addEventListener('mousedown', e => { isDown = true; container.classList.add('dragging'); startX = e.pageX - container.offsetLeft; scrollLeft = container.scrollLeft; });
        container.addEventListener('mouseleave', () => { isDown = false; container.classList.remove('dragging'); });
        container.addEventListener('mouseup', () => { isDown = false; container.classList.remove('dragging'); });
        container.addEventListener('mousemove', e => { if (!isDown) return; e.preventDefault(); container.scrollLeft = scrollLeft - (e.pageX - container.offsetLeft - startX) * 2; });
    });
}
setTimeout(startTrainSliding, 2000);

// ========================================
// INIT
// ========================================
loadAllData();