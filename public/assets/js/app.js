// ========================================
// SAMANLIVE - DYNAMIC JAVASCRIPT - LOCATION BASED
// ========================================

// Global variables
let allModules = [];
let allAds = [];
let nearbyServices = [];
let nearbyVideos = [];
let allCampaigns = [];
let siteSettings = {};
let userLocation = null;
let locationIntervalId = null;
let lastFetchedLocation = null;
let currentUser = null; // ← Sirf yahi ek baar rahega

// ========================================
// LOCATION MANAGER - GLOBAL SINGLETON
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
                reloadNearbyData();
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
// GET USER LOCATION - NAYA VERSION
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

async function reloadNearbyData() {
    if (!userLocation) return;

    console.log('🔄 Reloading nearby data for new location...');

    try {
        const shopsRes = await fetch(`/api/local-market/public?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=5000`);
        if(shopsRes.ok) {
            const shopsData = await shopsRes.json();
            nearbyServices = shopsData.data || shopsData;
            renderShops();
            renderFamousShops();
            console.log('✅ Shops updated:', nearbyServices.length);
        }

        const modulesRes = await fetch('/api/modules/nearby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: userLocation.lat, lng: userLocation.lng })
        });
        if(modulesRes.ok) {
            const modulesData = await modulesRes.json();
            allModules = modulesData.modules || [];
            renderServices();
            console.log('✅ Modules updated:', allModules.length);
        }
    } catch(e) {
        console.error('Failed to reload nearby data:', e);
    }
}

window.addEventListener('beforeunload', () => {
    window.LocationManager.stopAutoUpdate();
});

// ========================================
// LOAD DATA FROM SERVER - WITH LOCATION
// ========================================
async function loadAllData() {
    try {
        await getUserLocation();

        try {
            const adsRes = await fetch('/api/ads');
            if(adsRes.ok) allAds = await adsRes.json();
            else allAds = [];
        } catch(e) {
            console.log('Ads API failed:', e);
            allAds = [];
        }

        try {
            const videosRes = await fetch('/api/videos');
            if(videosRes.ok) nearbyVideos = await videosRes.json();
            else nearbyVideos = [];
        } catch(e) {
            console.log('Videos API failed:', e);
            nearbyVideos = [];
        }

        try {
            const campaignsRes = await fetch('/api/campaigns');
            if(campaignsRes.ok) allCampaigns = await campaignsRes.json();
            else allCampaigns = [];
        } catch(e) {
            console.log('Campaigns API failed:', e);
            allCampaigns = [];
        }

        try {
            const settingsRes = await fetch('/api/settings');
            if(settingsRes.ok) siteSettings = await settingsRes.json();
            else siteSettings = {};
        } catch(e) {
            console.log('Settings API failed:', e);
            siteSettings = {};
        }

        if(userLocation) {
            try {
                const modulesRes = await fetch('/api/modules/nearby', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lat: userLocation.lat, lng: userLocation.lng })
                });
                if(modulesRes.ok) {
                    const modulesData = await modulesRes.json();
                    allModules = modulesData.modules || [];
                } else {
                    allModules = [];
                }
            } catch(e) {
                console.log('Modules nearby API failed:', e);
                allModules = [];
            }

            try {
                const shopsRes = await fetch(`/api/local-market/public?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=5000`);
                if(shopsRes.ok) {
                    const shopsData = await shopsRes.json();
                    nearbyServices = shopsData.data || shopsData;
                } else {
                    nearbyServices = [];
                }
            } catch(e) {
                console.log('Shops API failed:', e);
                nearbyServices = [];
            }
        } else {
            try {
                const modulesRes = await fetch('/api/modules');
                if(modulesRes.ok) {
                    const modulesData = await modulesRes.json();
                    allModules = modulesData.modules || modulesData;
                } else {
                    allModules = [];
                }
            } catch(e) {
                console.log('Modules API failed:', e);
                allModules = [];
            }

            try {
                const shopsRes = await fetch('/api/local-market/public');
                if(shopsRes.ok) {
                    const shopsData = await shopsRes.json();
                    nearbyServices = shopsData.data || shopsData;
                } else {
                    nearbyServices = [];
                }
            } catch(e) {
                console.log('Public shops API failed:', e);
                nearbyServices = [];
            }
        }

        console.log('SAMANLIVE Loaded! Modules:', allModules.length, 'Shops:', nearbyServices.length);

        renderServices();
        renderTopAds();
        renderCampaigns();
        renderShops();
        renderFamousShops();
        renderVideos();
        updateLogo();

    } catch(e) {
        console.error('Failed to load data:', e);
        renderShops();
        renderFamousShops();
        renderServices();
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

    const footerAbout = document.querySelector('.footer-about p');
    if(footerAbout && siteSettings.footerAbout) {
        footerAbout.textContent = siteSettings.footerAbout;
    }
}

// ========================================
// SMART SORT - USER JISKO JYADA TOUCH KARE VO UPAR
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
        return a.priority - b.priority;
    });
}

// ========================================
// RENDER SERVICES - 54 MODULES - SMART SORTED + DISTANCE
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
                    ${module.distance? `<small style="color:#10b981;font-size:11px;">${module.distance} km</small>` : ''}
                </a>
            </div>
        `).join('');
    }
}

// ========================================
// RENDER TOP ADS - 54 OFFERS, 4 PER SLIDE
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
// RENDER CAMPAIGNS - 52 CAMPAIGNS, 4 PER SLIDE
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
// RENDER SHOPS - TRAIN SCROLL + DISTANCE
// ========================================
function renderShops() {
    const doubleShops = [...nearbyServices,...nearbyServices];
    const shopsEl = document.getElementById('shopsContent');

    if(nearbyServices.length === 0) {
        if(shopsEl) shopsEl.innerHTML = '<p style="text-align:center;color:#64748b;padding:40px;">📍 Aapke aas-paas koi shop nahi mili</p>';
        return;
    }

    if(shopsEl) {
        shopsEl.innerHTML = `
            <div class="shops-grid">
                ${doubleShops.map(service => `
                    <div class="shop-card" onclick="window.location.href='/local-market/dashboard.html?shopId=${service._id}&type=${service.shopType}'">
                        <div class="shop-icon">${service.icon}</div>
                        <div class="shop-name">${service.shopName || service.name}</div>
                        ${service.distance? `<small style="color:#10b981;font-size:11px;">${service.distance}m</small>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// ========================================
// RENDER FAMOUS SHOPS - AREA KI APPROVED SHOPS
// ========================================
function renderFamousShops() {
    const areaShops = nearbyServices.filter(shop =>
        shop.status === 'approved' &&
        shop.isActive!== false
    ).sort((a, b) => {
        return (a.distance || 9999) - (b.distance || 9999);
    });

    const doubleShops = [...areaShops,...areaShops];
    const famousShopsEl = document.getElementById('famousShopsContent');

    if(areaShops.length === 0) {
        if(famousShopsEl) famousShopsEl.innerHTML = '<p style="text-align:center;color:#64748b;padding:40px;">⭐ Aapke area me abhi koi famous shop nahi hai</p>';
        return;
    }

    if(famousShopsEl) {
        famousShopsEl.innerHTML = `
            <div class="shops-grid">
                ${doubleShops.map(service => `
                    <div class="shop-card" onclick="window.location.href='/local-market/dashboard.html?shopId=${service._id}&type=${service.shopType}'">
                        <div class="shop-icon">${service.icon}</div>
                        <div class="shop-name">${service.shopName || service.name}</div>
                        ${service.distance? `<small style="color:#f59e0b;font-size:11px;">⭐ ${service.distance}m</small>` : '<small style="color:#f59e0b;font-size:11px;">⭐ Famous</small>'}
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// ========================================
// RENDER VIDEOS - TRAIN SCROLL + SHOP LINK
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
// SLIDER LOGIC - TOP ADS
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
function prevTopAd() {
    const slides = document.querySelectorAll('#topAdsContainer.ad-slide');
    if(slides.length === 0) return;
    topAdIndex = (topAdIndex - 1 + slides.length) % slides.length;
    showTopAd(topAdIndex);
}

// ========================================
// SLIDER LOGIC - CAMPAIGNS
// ========================================
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
function prevCampaign() {
    const slides = document.querySelectorAll('#campaignContainer.ad-slide');
    if(slides.length === 0) return;
    campaignIndex = (campaignIndex - 1 + slides.length) % slides.length;
    showCampaign(campaignIndex);
}

// ========================================
// AUTO SLIDE - SHOPS/VIDEOS HATA DIYA AB TRAIN HAI
// ========================================
setInterval(nextTopAd, 5000);
setInterval(nextCampaign, 6000);

// ========================================
// VIDEO CLICK - FULLSCREEN MODAL + SHOP LINK
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
    const shop = nearbyServices.find(s => s._id === shopId);
    const oldModal = document.getElementById('videoModal');
    if(oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'videoModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.95);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
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
// SEARCH FUNCTIONALITY
// ========================================
const searchInput = document.getElementById('searchInput');
if(searchInput) {
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();

        if(searchTerm === '') {
            renderServices();
        } else {
            const filtered = allModules.filter(module =>
                module.name.toLowerCase().includes(searchTerm)
            );
            renderServices(filtered);
        }
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
// INIT - Page load pe sab load karo
// ========================================
loadAllData();

// ========================================
// USER AUTH + PROFILE SYSTEM - PERMANENT LOGIN
// ========================================

// CHECK IF LOGGED IN ON PAGE LOAD
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('userToken');
    if (token) {
        fetchUserData(token);
    }
    updateProfileAvatar();
});

// FETCH USER DATA
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

// UPDATE PROFILE AVATAR
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

// LOGIN MODAL
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
}
function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

// PHONE LOGIN - PERMANENT
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
            alert('Login Success! 🎉 Ab permanent login hai.');
        } else {
            alert('Login failed: ' + data.error);
        }
    } catch (err) {
        alert('Login failed. Server check karo.');
    }
}

// GOOGLE LOGIN - Baad me Firebase add karenge
function loginWithGoogle() {
    alert('Google Login setup ho raha hai. Abhi phone se login karo 🙏');
}

// PROFILE MODAL - SIMPLIFIED
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

// SHOW DETAILS FORM
function showDetailsForm() {
    const form = document.getElementById('detailsForm');
    if (form.style.display === 'none') {
        form.style.display = 'block';
        document.getElementById('detailName').value = currentUser.name || '';
        document.getElementById('detailEmail').value = currentUser.email || '';
        document.getElementById('detailPhone').value = currentUser.phone || '';
        document.getElementById('detailAddress').value = currentUser.address?.street || '';
        document.getElementById('detailLang').value = currentUser.language || 'hi';
    } else {
        form.style.display = 'none';
    }
}

// UPDATE DETAILS
async function updateUserDetails() {
    const token = localStorage.getItem('userToken');
    const data = {
        name: document.getElementById('detailName').value,
        email: document.getElementById('detailEmail').value,
        phone: document.getElementById('detailPhone').value,
        address: { street: document.getElementById('detailAddress').value },
        language: document.getElementById('detailLang').value
    };

    try {
        const res = await fetch('/api/user/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            currentUser = result.user;
            window.currentUser = result.user;
            alert('Details Updated! ✅');
            closeProfileModal();
            updateProfileAvatar();
        }
    } catch (err) {
        alert('Update failed');
    }
}

// ========================================
// AUTO TRAIN SLIDING + DRAG SUPPORT
// ========================================
function startTrainSliding() {
    const containers = [
        document.getElementById('shopsContent'),
        document.getElementById('videosContent'),
        document.getElementById('famousShopsContent')
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
// Export for other pages
window.getCurrentUser = () => currentUser;
window.currentUser = currentUser;

setTimeout(startTrainSliding, 2000);

// ========================================
// PROFILE PAGE REDIRECT
// ========================================
function goToProfilePage() {
    if (!currentUser) {
        openLoginModal();
        return;
    }
    window.location.href = '/profile.html';
}