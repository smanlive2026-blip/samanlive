// ========================================
// SAMANLIVE - HOMEPAGE JAVASCRIPT - LOCATION BASED
// ========================================

// Global variables
let allModules = [];
let allAds = [];
let nearbyServices = [];
let nearbyVideos = [];
let allCampaigns = [];
let siteSettings = {};
let userLocation = null;

// ========================================
// GET USER LOCATION
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
                console.log('User Location:', userLocation);
                resolve(userLocation);
            },
            (error) => {
                console.log('Location access denied or failed:', error);
                resolve(null);
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
// LOAD DATA FROM SERVER - WITH LOCATION
// ========================================
async function loadAllData() {
    try {
        // Pehle location try karo
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

        // MODULES + SHOPS GPS KE SAATH LOAD KARO
        if(userLocation) {
            // Modules nearby
            const modulesRes = await fetch('/api/modules/nearby', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: userLocation.lat, lng: userLocation.lng })
            });
            const modulesData = await modulesRes.json();
            allModules = modulesData.modules || [];

            // Shops nearby - 5km radius
            const shopsRes = await fetch(`/api/local-market/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=5000`);
            nearbyServices = await shopsRes.json();
            
            showUserLocationInHeader();
        } else {
            // Location nahi mili to sab dikha de
            const [modulesRes, shopsRes] = await Promise.all([
                fetch('/api/modules'),
                fetch('/api/local-market/nearby?lat=0&lng=0&radius=999999')
            ]);
            const modulesData = await modulesRes.json();
            allModules = modulesData.modules || modulesData;
            nearbyServices = await shopsRes.json();
        }

        console.log('SAMANLIVE Loaded! Modules:', allModules.length, 'Shops:', nearbyServices.length);

        // Render everything
        renderServices();
        renderTopAds();
        renderCampaigns();
        renderShops();
        renderVideos();
        updateLogo();

    } catch(e) {
        console.error('Failed to load data:', e);
    }
}

// Header me location dikhane ke liye
function showUserLocationInHeader() {
    const headerLocation = document.querySelector('.location-display');
    if (!headerLocation && userLocation) {
        const header = document.querySelector('.header');
        const locDiv = document.createElement('div');
        locDiv.className = 'location-display';
        locDiv.style.cssText = 'font-size:12px;color:#64748b;display:flex;align-items:center;gap:4px;';
        locDiv.innerHTML = `📍 <span id="userCity">Detecting...</span>`;
        header.querySelector('.header-left')?.appendChild(locDiv);
        
        // Reverse geocode kar ke city name nikal le
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
                        <div class="shop-icon">${service.icon || '🏪'}</div>
                        <div class="shop-name">${service.shopName || service.name}</div>
                        ${service.distance? `<small style="color:#10b981;font-size:11px;">${service.distance}m</small>` : ''}
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

        // Mouse events - Desktop ke liye
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

        // Touch events - Mobile ke liye
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

// Page load ke baad train chalu karo
setTimeout(startTrainSliding, 2000);