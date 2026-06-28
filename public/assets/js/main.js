// ========================================
// SAMANLIVE - HOMEPAGE JAVASCRIPT - UPDATED 6 LINE SYSTEM
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
let allProducts = []; // ✅ Top products ke liye

// ========================================
// LOCATION MANAGER - SAB SAME
// ========================================
window.LocationManager = {
    updateInterval: 30000,
    isRequesting: false,

    getManual: function() {
        return new Promise((resolve) => {
            if(this.isRequesting) {
                console.log('⚠️ Location request already in progress');
                resolve(window.currentUserLocation);
                return;
            }

            if(!navigator.geolocation) {
                console.log('Geolocation not supported');
                resolve(null);
                return;
            }

            this.isRequesting = true;
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    window.currentUserLocation = loc;
                    userLocation = loc;
                    lastFetchedLocation = {...loc};
                    console.log('📍 Manual Location:', loc);
                    this.isRequesting = false;
                    resolve(loc);
                },
                (error) => {
                    console.log('Location access denied:', error.message);
                    this.isRequesting = false;
                    resolve(null);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    },

    startAutoUpdate: function() {
        if (locationIntervalId!== null) return;
        console.log('🚀 Location auto-update started - every 30 sec');
        this.fetchAndUpdate();
        locationIntervalId = setInterval(() => {
            this.fetchAndUpdate();
        }, this.updateInterval);
    },

    stopAutoUpdate: function() {
        if (locationIntervalId!== null) {
            clearInterval(locationIntervalId);
            locationIntervalId = null;
            console.log('⏹️ Location auto-update stopped');
        }
    },

    fetchAndUpdate: function() {
        if(!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newLoc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                window.currentUserLocation = newLoc;
                userLocation = newLoc;
                lastFetchedLocation = {...newLoc};
                console.log('📍 Auto Location Updated:', newLoc);
            },
            (error) => {
                console.error('Auto location error:', error.message);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
    },

    checkPermission: async function() {
        if (!navigator.permissions) return 'unknown';
        try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            return result.state;
        } catch (e) {
            return 'unknown';
        }
    }
};

window.currentUserLocation = null;

// ========================================
// GET USER LOCATION
// ========================================
function getUserLocation() {
    return new Promise(async (resolve) => {
        const loc = await window.LocationManager.getManual();
        if (loc) {
            window.LocationManager.startAutoUpdate();
        }
        resolve(loc);
    });
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

// ✅ RELOAD NEARBY DATA - AB PRODUCTS BHI
async function reloadNearbyData() {
    console.log('🔄 Reloading all shops & products...');

    try {
        const shopsRes = await fetch(`/api/local-market/public`);
        if(shopsRes.ok) {
            const shopsData = await shopsRes.json();
            allServices = shopsData.data || shopsData;
            renderSixLineShops();
            console.log('✅ All Shops updated:', allServices.length);
        }

       const productsRes = await fetch(`/api/local-market/top-rated-products?limit=24`);
        if(productsRes.ok) {
            allProducts = await productsRes.json();
            renderSixLineProducts();
            console.log('✅ Top Products updated:', allProducts.length);
        }
    } catch(e) {
        console.error('Failed to reload:', e);
    }
}

window.addEventListener('beforeunload', () => {
    window.LocationManager.stopAutoUpdate();
});

// ========================================
// LOAD DATA FROM SERVER
// ========================================
async function loadAllData() {
    try {
        await getUserLocation();

        const [adsRes, videosRes, campaignsRes, settingsRes] = await Promise.all([
            fetch('/api/ads').catch(() => ({ok: false})),
            fetch('/api/videos').catch(() => ({ok: false})),
            fetch('/api/campaigns').catch(() => ({ok: false})),
            fetch('/api/settings').catch(() => ({ok: false}))
        ]);

        allAds = adsRes.ok? await adsRes.json() : [];
        nearbyVideos = videosRes.ok? await videosRes.json() : [];
        allCampaigns = campaignsRes.ok? await campaignsRes.json() : [];
        siteSettings = settingsRes.ok? await settingsRes.json() : {};

        // MODULES
        try {
            const modulesRes = await fetch('/api/modules');
            if(modulesRes.ok) {
                const modulesData = await modulesRes.json();
                allModules = modulesData.modules || modulesData;
            }
        } catch(e) {
            console.log('Modules API failed:', e);
            allModules = [];
        }

        // SHOPS
        try {
            const shopsRes = await fetch('/api/local-market/public');
            if(shopsRes.ok) {
                const shopsData = await shopsRes.json();
                allServices = shopsData.data || shopsData;
            }
        } catch(e) {
            console.log('Public shops API failed:', e);
            allServices = [];
        }

        // ✅ TOP PRODUCTS - NAYA
        try {
            const productsRes = await fetch('/api/products/top-rated?limit=24');
            if(productsRes.ok) {
                allProducts = await productsRes.json();
            }
        } catch(e) {
            console.log('Top products API failed:', e);
            allProducts = [];
        }

        if(userLocation) {
            showUserLocationInHeader();
        } else {
            showLocationPopup();
        }

        console.log('SAMANLIVE Loaded! Modules:', allModules.length, 'Shops:', allServices.length, 'Products:', allProducts.length);

        renderServices();
        renderTopAds();
        renderCampaigns();
        renderSixLineShops(); // ✅ 6 LINE
        renderSixLineProducts(); // ✅ 6 LINE NAYA
        renderVideos();
        updateLogo();

    } catch(e) {
        console.error('Failed to load data:', e);
        renderSixLineShops();
        renderSixLineProducts();
        renderServices();
    }
}

function showLocationPopup() {
    if(document.getElementById('locPopup')) return;
    const popup = document.createElement('div');
    popup.id = 'locPopup';
    popup.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#1e40af;color:white;padding:12px 20px;border-radius:8px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.2);font-size:14px;`;
    popup.innerHTML = `📍 Location enable karein for better experience <button onclick="this.parentElement.remove()" style="margin-left:10px;background:white;color:#1e40af;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-weight:600;">OK</button>`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 6000);
}

function showUserLocationInHeader() {
    const headerLocation = document.querySelector('.location-display');
    if (!headerLocation && userLocation) {
        const header = document.querySelector('.header-container');
        const locDiv = document.createElement('div');
        locDiv.className = 'location-display';
        locDiv.style.cssText = 'font-size:12px;color:#e0e7ff;display:flex;align-items:center;gap:4px;margin-left:10px;';
        locDiv.innerHTML = `📍 <span id="userCity">Detecting...</span>`;
        header.querySelector('.search-box-modern')?.insertAdjacentElement('afterend', locDiv);

        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}`)
     .then(r => r.json())
     .then(data => {
                document.getElementById('userCity').textContent = data.address.city || data.address.town || data.address.village || 'Your Area';
            })
     .catch(() => {
                document.getElementById('userCity').textContent = 'Your Area';
            });
    }
}

function updateLogo() {
    const logoContainer = document.querySelector('.logo');
    const header = document.querySelector('.header');
    const footerLogo = document.querySelector('.footer-logo');
    const footerText = document.querySelector('.footer-bottom p');

    if(header) header.style.background = `linear-gradient(135deg, ${siteSettings.headerColor || '#667eea'}, #764ba2)`;

    if(logoContainer) {
        const logoImg = siteSettings.logoImage;
        const logoText = siteSettings.logoText || 'SAMANLIVE';
        const logoFirstChar = logoText.charAt(0);

        logoContainer.innerHTML = `
            ${logoImg?
                `<img src="${logoImg}" class="logo-img" style="width:40px;height:40px;border-radius:8px;object-fit:cover;margin-right:10px;">` :
                `<div class="logo-icon">${logoFirstChar}</div>`
            }
            <div class="logo-text">${logoText}</div>
        `;
    }

    if(footerLogo) footerLogo.textContent = siteSettings.logoText || 'SAMANLIVE';
    if(footerText) footerText.textContent = siteSettings.footerText || '© 2026 SAMANLIVE. All rights reserved.';

    const footer = document.querySelector('.footer');
    if(footer && siteSettings.footerColor) {
        footer.style.background = siteSettings.footerColor;
    }
}

// ========================================
// SMART SORT
// ========================================
function getModuleClicks() {
    const clicks = localStorage.getItem('samanlive_module_clicks');
    return clicks? JSON.parse(clicks) : {};
}

function saveModuleClick(moduleId) {
    const clicks = getModuleClicks();
    clicks[moduleId] = (clicks[moduleId] || 0) + 1;
    localStorage.setItem('samanlive_module_clicks', JSON.stringify(clicks));
    renderServices();
}

function sortModulesByUsage(modules) {
    const clicks = getModuleClicks();
    return [...modules].sort((a, b) => {
        const clicksA = clicks[a.id] || 0;
        const clicksB = clicks[b.id] || 0;
        if(clicksB!== clicksA) return clicksB - clicksA;
        return (a.priority || 0) - (b.priority || 0);
    });
}

// ========================================
// RENDER SERVICES
// ========================================
function renderServices(filteredModules = null) {
    const modulesToRender = filteredModules || allModules;
    const sortedModules = sortModulesByUsage(modulesToRender);
    const gridEl = document.getElementById('serviceGrid');

    if(modulesToRender.length === 0) {
        if(gridEl) gridEl.innerHTML = '<p style="text-align:center;color:#64748b;padding:40px;">📍 Koi service nahi mili</p>';
        return;
    }

    if(gridEl) {
        gridEl.innerHTML = sortedModules.map((module) => `
            <div class="service-item" data-module-id="${module.id}">
                <a href="${module.link}" onclick="saveModuleClick('${module.id}')">
                    <div class="service-icon" style="background: linear-gradient(135deg, ${module.color}, ${module.color}dd);">${module.icon}</div>
                    <p>${module.name}</p>
                </a>
            </div>
        `).join('');
    }
}

// ========================================
// RENDER TOP ADS
// ========================================
function renderTopAds() {
    const topAdChunks = [];
    for (let i = 0; i < allAds.length; i += 4) {
        topAdChunks.push(allAds.slice(i, i + 4));
    }
    const topAdsEl = document.getElementById('topAdsContainer');
    if(topAdsEl) {
        topAdsEl.innerHTML = topAdChunks.map((chunk, idx) => `
            <div class="ad-slide ${idx === 0? 'active' : ''}">
                <div class="ads-grid">
                    ${chunk.map(ad => `
                        <div class="ad-card" style="background: linear-gradient(135deg, ${ad.color}, ${ad.color}cc)">
                            <h3>${ad.title}</h3>
                            <p>${ad.desc}</p>
                            <button class="ad-btn">${ad.btn}</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
}

// ========================================
// RENDER CAMPAIGNS
// ========================================
function renderCampaigns() {
    const campaignChunks = [];
    for (let i = 0; i < allCampaigns.length; i += 4) {
        campaignChunks.push(allCampaigns.slice(i, i + 4));
    }
    const campaignEl = document.getElementById('campaignContainer');
    if(campaignEl) {
        campaignEl.innerHTML = campaignChunks.map((chunk, idx) => `
            <div class="ad-slide ${idx === 0? 'active' : ''}">
                <div class="ads-grid">
                    ${chunk.map(campaign => `
                        <div class="campaign-card" style="background: linear-gradient(135deg, ${campaign.color}, ${campaign.color}cc)">
                            <h3>${campaign.title}</h3>
                            <p>${campaign.desc}</p>
                            <button class="campaign-btn">${campaign.btn}</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
}

// ========================================
// ✅ RENDER SHOPS - 6 LINE CAROUSEL + EMPTY STATE
// ========================================
function renderSixLineShops() {
    const container = document.getElementById('shopsContent');
    if (!container) return;

    if (!allServices || allServices.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏪</div>
                <p>No shops available in your area</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    const shopsPerLine = 4;
    const totalLines = 6;

    for (let i = 0; i < totalLines; i++) {
        const row = document.createElement('div');
        row.className = 'carousel-item';
        const startIdx = i * shopsPerLine;
        const lineShops = allServices.slice(startIdx, startIdx + shopsPerLine);

        if (lineShops.length === 0) continue;

        lineShops.forEach(shop => {
            const shopType = ['cloth','kirana','medical','restaurant'].includes(shop.shopType)? shop.shopType : 'general';
            row.innerHTML += `
                <div class="shop-card" onclick="window.location.href='/shop-templates/${shopType}/user-view.html?shopId=${shop._id}'">
                    <div class="shop-icon">${shop.icon || '🏪'}</div>
                    <div class="shop-name">${shop.shopName || shop.name}</div>
                    ${shop.distance? `<small style="color:#10b981;font-size:11px;font-weight:600;">📍 ${shop.distance}m</small>` : ''}
                </div>
            `;
        });
        container.appendChild(row);
    }
}

// ========================================
// ✅ RENDER TOP PRODUCTS - 6 LINE CAROUSEL + EMPTY STATE - NAYA
// ========================================
function renderSixLineProducts() {
    const container = document.getElementById('topProductsContent');
    if (!container) return;

    if (!allProducts || allProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <p>No top rated products yet</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    const productsPerLine = 4;
    const totalLines = 6;

    for (let i = 0; i < totalLines; i++) {
        const row = document.createElement('div');
        row.className = 'carousel-item';
        const startIdx = i * productsPerLine;
        const lineProducts = allProducts.slice(startIdx, startIdx + productsPerLine);

        if (lineProducts.length === 0) continue;

        lineProducts.forEach(product => {
            row.innerHTML += `
                <div class="product-card" onclick="openProduct('${product._id}')">
                    <img src="${product.image || '/assets/default-product.png'}" alt="${product.name}">
                    <h4>${product.name}</h4>
                    <p class="product-price">₹${product.price}</p>
                    <p class="product-rating">⭐ ${product.rating || 0}</p>
                </div>
            `;
        });
        container.appendChild(row);
    }
}

function openProduct(productId) {
    window.location.href = `/product.html?id=${productId}`;
}

// ========================================
// RENDER VIDEOS
// ========================================
function renderVideos() {
    const doubleVideos = [...nearbyVideos,...nearbyVideos];
    const videosEl = document.getElementById('videosContent');
    if(videosEl) {
        videosEl.innerHTML = `
            <div class="videos-grid">
                ${doubleVideos.map(video => `
                    <div class="video-card" data-video-url="${video.url}" data-shop-id="${video.shopId || ''}">
                        <video muted loop playsinline autoplay>
                            <source src="${video.url}" type="video/mp4">
                        </video>
                        <div class="video-shop-name">${video.shopName || 'Shop'}</div>
                        <div class="video-label">${video.title}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// ========================================
// SLIDER LOGIC
// ========================================
let topAdIndex = 0;
function showTopAd(idx) {
    const slides = document.querySelectorAll('#topAdsContainer.ad-slide');
    slides.forEach(s => s.classList.remove('active'));
    if(slides[idx]) slides[idx].classList.add('active');
    topAdIndex = idx;
}
function nextTopAd() {
    const slides = document.querySelectorAll('#topAdsContainer.ad-slide');
    if(slides.length === 0) return;
    topAdIndex = (topAdIndex + 1) % slides.length;
    showTopAd(topAdIndex);
}

let campaignIndex = 0;
function showCampaign(idx) {
    const slides = document.querySelectorAll('#campaignContainer.ad-slide');
    slides.forEach(s => s.classList.remove('active'));
    if(slides[idx]) slides[idx].classList.add('active');
    campaignIndex = idx;
}
function nextCampaign() {
    const slides = document.querySelectorAll('#campaignContainer.ad-slide');
    if(slides.length === 0) return;
    campaignIndex = (campaignIndex + 1) % slides.length;
    showCampaign(campaignIndex);
}

setInterval(nextTopAd, 5000);
setInterval(nextCampaign, 6000);

// ========================================
// VIDEO MODAL
// ========================================
document.addEventListener('click', function(e) {
    const videoCard = e.target.closest('.video-card');
    if (videoCard) {
        const videoUrl = videoCard.dataset.videoUrl;
        const shopId = videoCard.dataset.shopId;
        openVideoModal(videoUrl, shopId);
    }
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
            <button onclick="closeVideoModal()" style="position:absolute;top:-40px;right:0;background:#fff;border:none;font-size:30px;width:40px;height:40px;border-radius:50%;cursor:pointer;z-index:10000;">×</button>
            <video controls autoplay style="width:100%;border-radius:10px;">
                <source src="${url}" type="video/mp4">
            </video>
            ${shop? `
            <div style="background:white;padding:12px;border-radius:0 0 10px 10px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <div style="font-weight:700;color:#1e40af;">${shop.shopName || shop.name}</div>
                    <div style="font-size:12px;color:#64748b;">${shop.address || 'Location'}</div>
                </div>
                <button onclick="window.location.href='/local-market/dashboard.html?shopId=${shop._id}&type=${shop.shopType}'" style="background:#1e40af;color:white;border:none;padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer;">Visit Shop</button>
            </div>
            ` : ''}
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) {
        if(e.target === modal) closeVideoModal();
    });
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    if(modal) modal.remove();
}

// ========================================
// ✅ MODERN SEARCH FUNCTIONALITY
// ========================================
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    if(searchTerm === '') {
        renderServices();
        renderSixLineShops();
        renderSixLineProducts();
    } else {
        const filteredModules = allModules.filter(module =>
            module.name.toLowerCase().includes(searchTerm)
        );
        const filteredShops = allServices.filter(shop =>
            (shop.shopName || shop.name).toLowerCase().includes(searchTerm)
        );
        const filteredProducts = allProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm)
        );

        // Temporarily update arrays for search results
        const originalServices = allServices;
        const originalProducts = allProducts;

        allServices = filteredShops;
        allProducts = filteredProducts;

        renderServices(filteredModules);
        renderSixLineShops();
        renderSixLineProducts();

        // Restore original arrays after 3 seconds or on next search
        setTimeout(() => {
            allServices = originalServices;
            allProducts = originalProducts;
        }, 3000);
    }
}

const searchInput = document.getElementById('searchInput');
if(searchInput) {
    searchInput.addEventListener('input', function(e) {
        performSearch();
    });
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });
}

// ========================================
// NOTIFICATION CLICK
// ========================================
const notifIcon = document.querySelector('.notification-icon');
if(notifIcon) {
    notifIcon.addEventListener('click', function() {
        alert('3 New Notifications!');
    });
}

// ========================================
// PREVENT ZOOM
// ========================================
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});

// ========================================
// USER AUTH
// ========================================
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('userToken');
    if (token) {
        fetchUserData(token);
    }
    updateProfileAvatar();
});

async function fetchUserData(token) {
    try {
        const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (data.success) {
            currentUser = data.user;
            window.currentUser = data.user;
            updateProfileAvatar();
        } else {
            localStorage.removeItem('userToken');
        }
    } catch (err) {
        localStorage.removeItem('userToken');
    }
}

function updateProfileAvatar() {
    const avatar = document.querySelector('.profile-avatar');
    if (!avatar) return;
    if (currentUser) {
        avatar.innerHTML = `<img src="${currentUser.profilePic || '/assets/default-avatar.png'}" alt="Profile">`;
        avatar.onclick = goToProfilePage;
    } else {
        avatar.innerHTML = 'P';
        avatar.onclick = openLoginModal;
    }
}

function openLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
}
function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

async function loginWithPhone() {
    const phone = document.getElementById('loginPhone').value.trim();
    const name = document.getElementById('loginName').value.trim();
    if (!phone || phone.length!== 10) return alert('Valid 10 digit phone dalo');
    if (!name) return alert('Name dalo');

    try {
        const res = await fetch('/api/auth/login-phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, name })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('userToken', data.token);
            currentUser = data.user;
            window.currentUser = data.user;
            closeLoginModal();
            updateProfileAvatar();
            alert('Login Success! 🎉');
        } else {
            alert('Login failed: ' + data.error);
        }
    } catch (err) {
        alert('Login failed. Server check karo.');
    }
}

function loginWithGoogle() {
    alert('Google Login setup ho raha hai. Abhi phone se login karo 🙏');
}

function openProfileModal() {
    if (!currentUser) return openLoginModal();
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('userUniqueId').textContent = currentUser.userId;
    document.getElementById('profilePic').src = currentUser.profilePic || '/assets/default-avatar.png';
    document.getElementById('profileModal').style.display = 'flex';
}
function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
    document.getElementById('detailsForm').style.display = 'none';
}

function goToProfilePage() {
    if (!currentUser) {
        openLoginModal();
        return;
    }
    window.location.href = '/profile.html';
}

// ========================================
// AUTO TRAIN SLIDING + DRAG - ✅ PRODUCTS BHI ADD
// ========================================
function startTrainSliding() {
    const containers = [
        document.getElementById('shopsContent'),
        document.getElementById('videosContent'),
        document.getElementById('topProductsContent') // ✅ NAYA
    ];

    containers.forEach(container => {
        if (!container) return;
        container.classList.add('auto-train');

        let isDown = false;
        let startX;
        let scrollLeft;

        container.addEventListener('mousedown', (e) => {
            isDown = true;
            container.classList.add('dragging');
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
        });

        container.addEventListener('mouseleave', () => {
            isDown = false;
            container.classList.remove('dragging');
        });

        container.addEventListener('mouseup', () => {
            isDown = false;
            container.classList.remove('dragging');
        });

        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        });

        container.addEventListener('touchstart', (e) => {
            isDown = true;
            container.classList.add('dragging');
            startX = e.touches[0].pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
        });

        container.addEventListener('touchend', () => {
            isDown = false;
            container.classList.remove('dragging');
        });

        container.addEventListener('touchmove', (e) => {
            if (!isDown) return;
            const x = e.touches[0].pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        });
    });
}

window.getCurrentUser = () => currentUser;
window.currentUser = currentUser;

setTimeout(startTrainSliding, 2000);

// ========================================
// INIT
// ========================================
loadAllData();