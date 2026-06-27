// ========================================
// SAMANLIVE - HOMEPAGE JAVASCRIPT - ALL SHOPS LIVE
// ========================================

// Global variables
let allModules = [];
let allAds = [];
let allServices = []; // ← nearbyServices se naam badla
let nearbyVideos = [];
let allCampaigns = [];
let siteSettings = {};
let userLocation = null; // ← Ab sirf tracking ke liye

// ========================================
// GET USER LOCATION - AB SIRF INFO KE LIYE
// ========================================
function getUserLocation() {
    return new Promise((resolve) => {
        if(!navigator.geolocation) {
            console.log('Geolocation not supported');
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                window.currentUserLocation = userLocation;
                console.log('User Location:', userLocation);
                localStorage.setItem('lastUserLat', userLocation.lat);
                localStorage.setItem('lastUserLng', userLocation.lng);
                resolve(userLocation);
            },
            (error) => {
                console.log('Location access denied or failed:', error);
                const lastLat = localStorage.getItem('lastUserLat');
                const lastLng = localStorage.getItem('lastUserLng');
                if(lastLat && lastLng) {
                    userLocation = { lat: parseFloat(lastLat), lng: parseFloat(lastLng) };
                    console.log('Using last location:', userLocation);
                }
                resolve(userLocation);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    });
}

// ========================================
// LOAD DATA FROM SERVER - SAB SHOPS LIVE
// ========================================
async function loadAllData() {
    try {
        // Location optional hai ab
        await getUserLocation();

        // Baaki APIs normal load karo
        const [adsRes, videosRes, campaignsRes, settingsRes] = await Promise.all([
            fetch('/api/ads'),
            fetch('/api/videos'),
            fetch('/api/campaigns'),
            fetch('/api/settings')
        ]);

        allAds = await adsRes.json();
        nearbyVideos = await videosRes.json();
        allCampaigns = await campaignsRes.json();
        siteSettings = await settingsRes.json();

        // ✅ MODULES - Hamesha sab load honge, location filter nahi
        const modulesRes = await fetch('/api/modules');
        const modulesData = await modulesRes.json();
        allModules = modulesData.modules || modulesData;

        // ✅ SHOPS - LOCATION FILTER HATA DIYA, SAB SHOPS LOAD HONGI
        const shopsRes = await fetch('/api/local-market/public');
        const shopsData = await shopsRes.json();
        allServices = shopsData.data || shopsData;

        // Location mili to header me dikha do, par shops filter nahi karni
        if(userLocation) {
            showUserLocationInHeader();
            document.querySelector('.nearby-header h2').textContent = '⭐ All Shops';
        } else {
            showLocationPopup();
            document.querySelector('.nearby-header h2').textContent = '⭐ All Shops';
        }

        console.log('SAMANLIVE Loaded! Modules:', allModules.length, 'Shops:', allServices.length);

        // Render everything
        renderServices();
        renderTopAds();
        renderCampaigns();
        renderShops();
        renderVideos();
        updateLogo();

    } catch(e) {
        console.error('Failed to load data:', e);
        document.getElementById('shopsContent').innerHTML = '<p style="text-align:center;color:#64748b;padding:40px;">Error loading shops</p>';
    }
}

// ✅ Location Popup - Sirf info ke liye
function showLocationPopup() {
    if(document.getElementById('locPopup')) return;

    const popup = document.createElement('div');
    popup.id = 'locPopup';
    popup.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#1e40af;color:white;padding:12px 20px;border-radius:8px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.2);font-size:14px;`;
    popup.innerHTML = `📍 Location enable karein for better experience <button onclick="this.parentElement.remove()" style="margin-left:10px;background:white;color:#1e40af;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-weight:600;">OK</button>`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 6000);
}

// Header me location dikhane ke liye
function showUserLocationInHeader() {
    const headerLocation = document.querySelector('.location-display');
    if (!headerLocation && userLocation) {
        const header = document.querySelector('.header-container');
        const locDiv = document.createElement('div');
        locDiv.className = 'location-display';
        locDiv.style.cssText = 'font-size:12px;color:#e0e7ff;display:flex;align-items:center;gap:4px;margin-left:10px;';
        locDiv.innerHTML = `📍 <span id="userCity">Detecting...</span>`;
        header.querySelector('.search-box')?.insertAdjacentElement('afterend', locDiv);

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
        return (a.priority || 0) - (b.priority || 0);
    });
}

// ========================================
// RENDER SERVICES - 54 MODULES - SMART SORTED
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
// RENDER SHOPS - SAB SHOPS LIVE
// ========================================
function renderShops() {
    const doubleShops = [...allServices,...allServices];
    const shopsEl = document.getElementById('shopsContent');

    if(allServices.length === 0) {
        if(shopsEl) shopsEl.innerHTML = '<p style="text-align:center;color:#64748b;padding:40px;">📍 Abhi koi shop nahi hai</p>';
        return;
    }

    if(shopsEl) {
        shopsEl.innerHTML = `
            <div class="shops-grid">
                ${doubleShops.map(service => `
                    <div class="shop-card" onclick="window.location.href='/local-market/dashboard.html?shopId=${service._id}&type=${service.shopType}'">
                        <div class="shop-icon">${service.icon || '🏪'}</div>
                        <div class="shop-name">${service.shopName || service.name}</div>
                        ${service.address? `<small style="color:#64748b;font-size:11px;">${service.address}</small>` : ''}
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
// AUTO SLIDE
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
    const shop = allServices.find(s => s._id === shopId);
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
// AUTO TRAIN SLIDING + DRAG SUPPORT
// ========================================
function startTrainSliding() {
    const containers = [
        document.getElementById('shopsContent'),
        document.getElementById('videosContent')
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

setTimeout(startTrainSliding, 2000);