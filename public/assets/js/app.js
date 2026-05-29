// ========================================
// SAMANLIVE - DYNAMIC JAVASCRIPT
// ========================================

// Global variables
let allModules = [];
let allAds = [];
let nearbyServices = [];
let nearbyVideos = [];
let allCampaigns = [];
let siteSettings = {};

// ========================================
// LOAD DATA FROM SERVER
// ========================================
async function loadAllData() {
    try {
        const [modulesRes, adsRes, videosRes, campaignsRes, shopsRes, settingsRes] = await Promise.all([
            fetch('/api/modules'),
            fetch('/api/ads'),
            fetch('/api/videos'),
            fetch('/api/campaigns'),
            fetch('/api/shops'),
            fetch('/api/settings')
        ]);

        allModules = await modulesRes.json();
        allAds = await adsRes.json();
        nearbyVideos = await videosRes.json();
        allCampaigns = await campaignsRes.json();
        nearbyServices = await shopsRes.json();
        siteSettings = await settingsRes.json();

        console.log('SAMANLIVE Loaded Successfully!');
        console.log('Total Services:', allModules.length);
        console.log('Total Offers:', allAds.length);
        console.log('Total Campaigns:', allCampaigns.length);
        console.log('Total Shops:', nearbyServices.length);

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

function updateLogo() {
    const logoIcon = document.querySelector('.logo-icon');
    const logoText = document.querySelector('.logo-text');
    const header = document.querySelector('.header');
    const footerLogo = document.querySelector('.footer-logo');
    const footerText = document.querySelector('.footer-bottom p');

    if(logoIcon) logoIcon.textContent = siteSettings.logoIcon || 'S';
    if(logoText) logoText.textContent = siteSettings.logoText || 'SAMANLIVE';
    if(header) header.style.background = `linear-gradient(135deg, ${siteSettings.headerColor || '#667eea'}, #764ba2)`;
    if(footerLogo) footerLogo.textContent = siteSettings.logoText || 'SAMANLIVE';
    if(footerText) footerText.textContent = siteSettings.footerText || '© 2026 SAMANLIVE. All rights reserved.';
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
// RENDER SERVICES - SMART SORTED
// ========================================
function renderServices() {
    const sortedModules = sortModulesByUsage(allModules);
    const gridEl = document.getElementById('serviceGrid');
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
// RENDER TOP ADS - DYNAMIC
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
// RENDER CAMPAIGNS - DYNAMIC
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
// RENDER SHOPS SLIDER - DYNAMIC
// ========================================
function renderShops() {
    const shopChunks = [];
    for (let i = 0; i < nearbyServices.length; i += 6) {
        shopChunks.push(nearbyServices.slice(i, i + 6));
    }
    const shopsEl = document.getElementById('shopsContent');
    if(shopsEl) {
        shopsEl.innerHTML = shopChunks.map((chunk, idx) => `
            <div class="nearby-slide ${idx === 0? 'active' : ''}">
                <div class="shops-grid">
                    ${chunk.map(service => `
                        <div class="shop-card">
                            <div class="shop-icon">${service.icon}</div>
                            <div class="shop-name">${service.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
    const shopsDotsEl = document.getElementById('shopsDots');
    if(shopsDotsEl) {
        shopsDotsEl.innerHTML = shopChunks.map((_, idx) => `
            <span class="${idx === 0? 'active' : ''}" onclick="goToShop(${idx})"></span>
        `).join('');
    }
}

// ========================================
// RENDER VIDEOS SLIDER - DYNAMIC
// ========================================
function renderVideos() {
    const videoChunks = [];
    for (let i = 0; i < nearbyVideos.length; i += 3) {
        videoChunks.push(nearbyVideos.slice(i, i + 3));
    }
    const videosEl = document.getElementById('videosContent');
    if(videosEl) {
        videosEl.innerHTML = videoChunks.map((chunk, idx) => `
            <div class="nearby-slide ${idx === 0? 'active' : ''}">
                <div class="videos-grid">
                    ${chunk.map(video => `
                        <div class="video-card">
                            <video muted loop autoplay playsinline>
                                <source src="${video.url}#t=0,5" type="video/mp4">
                            </video>
                            <div class="video-label">${video.title}</div>
                            <div class="video-play">▶</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
    const videosDotsEl = document.getElementById('videosDots');
    if(videosDotsEl) {
        videosDotsEl.innerHTML = videoChunks.map((_, idx) => `
            <span class="${idx === 0? 'active' : ''}" onclick="goToVideo(${idx})"></span>
        `).join('');
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
// SLIDER LOGIC - SHOPS
// ========================================
let shopIndex = 0;
function showShop(idx) {
    const slides = document.querySelectorAll('#shopsContent.nearby-slide');
    const dots = document.querySelectorAll('#shopsDots span');
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    if(slides[idx]) slides[idx].classList.add('active');
    if(dots[idx]) dots[idx].classList.add('active');
    shopIndex = idx;
}
function nextShop() {
    const slides = document.querySelectorAll('#shopsContent.nearby-slide');
    if(slides.length === 0) return;
    shopIndex = (shopIndex + 1) % slides.length;
    showShop(shopIndex);
}
function prevShop() {
    const slides = document.querySelectorAll('#shopsContent.nearby-slide');
    if(slides.length === 0) return;
    shopIndex = (shopIndex - 1 + slides.length) % slides.length;
    showShop(shopIndex);
}
function goToShop(idx) { showShop(idx); }

// ========================================
// SLIDER LOGIC - VIDEOS
// ========================================
let videoIndex = 0;
function showVideo(idx) {
    const slides = document.querySelectorAll('#videosContent.nearby-slide');
    const dots = document.querySelectorAll('#videosDots span');
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    if(slides[idx]) slides[idx].classList.add('active');
    if(dots[idx]) dots[idx].classList.add('active');
    videoIndex = idx;
}
function nextVideo() {
    const slides = document.querySelectorAll('#videosContent.nearby-slide');
    if(slides.length === 0) return;
    videoIndex = (videoIndex + 1) % slides.length;
    showVideo(videoIndex);
}
function prevVideo() {
    const slides = document.querySelectorAll('#videosContent.nearby-slide');
    if(slides.length === 0) return;
    videoIndex = (videoIndex - 1 + slides.length) % slides.length;
    showVideo(videoIndex);
}
function goToVideo(idx) { showVideo(idx); }

// ========================================
// AUTO SLIDE - 5 SECONDS
// ========================================
setInterval(nextTopAd, 5000);
setInterval(nextCampaign, 6000);
setInterval(nextShop, 4000);
setInterval(nextVideo, 5000);

// ========================================
// SEARCH FUNCTIONALITY
// ========================================
const searchInput = document.getElementById('searchInput');
if(searchInput) {
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        console.log('Searching for:', searchTerm);
    });
}

// ========================================
// VIDEO CLICK TO PLAY/PAUSE
// ========================================
document.addEventListener('click', function(e) {
    if (e.target.closest('.video-card')) {
        const video = e.target.closest('.video-card').querySelector('video');
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    }
});

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
// PROFILE CLICK - ADMIN PANEL KHOLO
// ========================================
const profileAvatar = document.querySelector('.profile-avatar');
if(profileAvatar) {
    profileAvatar.addEventListener('click', function() {
        window.location.href = '/admin';
    });
}

// ========================================
// TRACK BUTTONS CLICK
// ========================================
document.querySelectorAll('.nearby-action-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const text = this.textContent.trim();
        alert(`${text} feature coming soon!`);
    });
});

// ========================================
// PREVENT ZOOM
// ========================================
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});
document.addEventListener('gesturechange', function(e) {
    e.preventDefault();
});
document.addEventListener('gestureend', function(e) {
    e.preventDefault();
});

// ========================================
// INIT - Page load pe sab load karo
// ========================================
loadAllData();