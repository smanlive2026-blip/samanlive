// ========================================
// SAMANLIVE - DYNAMIC JAVASCRIPT - FIXED
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
    const logoContainer = document.querySelector('.logo');
    const header = document.querySelector('.header');
    const footerLogo = document.querySelector('.footer-logo');
    const footerText = document.querySelector('.footer-bottom p');

    if(header) header.style.background = `linear-gradient(135deg, ${siteSettings.headerColor || '#667eea'}, #764ba2)`;
    
    // Logo Image ya Text Icon
    if(logoContainer) {
        const logoImg = siteSettings.logoImage;
        const logoText = siteSettings.logoText || 'SAMANLIVE';
        const logoFirstChar = logoText.charAt(0);
        
        logoContainer.innerHTML = `
            ${logoImg ? 
                `<img src="${logoImg}" class="logo-img" style="width:40px;height:40px;border-radius:8px;object-fit:cover;margin-right:10px;">` : 
                `<div class="logo-icon">${logoFirstChar}</div>`
            }
            <div class="logo-text">${logoText}</div>
        `;
    }
    
    if(footerLogo) footerLogo.textContent = siteSettings.logoText || 'SAMANLIVE';
    if(footerText) footerText.textContent = siteSettings.footerText || '© 2026 SAMANLIVE. All rights reserved.';
    
    // Footer color aur about bhi update kar
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
// RENDER SERVICES - 54 MODULES - SMART SORTED
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
// RENDER TOP ADS - 54 OFFERS, 4 PER SLIDE - DYNAMIC AUTO SLIDE
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
// RENDER CAMPAIGNS - 52 CAMPAIGNS, 4 PER SLIDE - DYNAMIC AUTO SLIDE
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
// RENDER SHOPS - 54 SHOPS, 6 PER SLIDE = 9 SLIDES - DYNAMIC AUTO SLIDE
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
// RENDER VIDEOS - 3 PER SLIDE - DYNAMIC AUTO SLIDE
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
                        <div class="video-card" data-video-url="${video.url}">
                            <video muted loop playsinline>
                                <source src="${video.url}" type="video/mp4">
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
// SLIDER LOGIC - TOP ADS - FIXED SELECTOR
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
function prevTopAd() {
    const slides = document.querySelectorAll('#topAdsContainer .ad-slide');
    if(slides.length === 0) return;
    topAdIndex = (topAdIndex - 1 + slides.length) % slides.length;
    showTopAd(topAdIndex);
}

// ========================================
// SLIDER LOGIC - CAMPAIGNS - FIXED SELECTOR
// ========================================
let campaignIndex = 0;
function showCampaign(idx) {
    const slides = document.querySelectorAll('#campaignContainer .ad-slide');
    slides.forEach(s => s.classList.remove('active'));
    if(slides[idx]) slides[idx].classList.add('active');
    campaignIndex = idx;
}
function nextCampaign() {
    const slides = document.querySelectorAll('#campaignContainer .ad-slide');
    if(slides.length === 0) return;
    campaignIndex = (campaignIndex + 1) % slides.length;
    showCampaign(campaignIndex);
}
function prevCampaign() {
    const slides = document.querySelectorAll('#campaignContainer .ad-slide');
    if(slides.length === 0) return;
    campaignIndex = (campaignIndex - 1 + slides.length) % slides.length;
    showCampaign(campaignIndex);
}

// ========================================
// SLIDER LOGIC - SHOPS - FIXED SELECTOR
// ========================================
let shopIndex = 0;
function showShop(idx) {
    const slides = document.querySelectorAll('#shopsContent .nearby-slide');
    const dots = document.querySelectorAll('#shopsDots span');
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    if(slides[idx]) slides[idx].classList.add('active');
    if(dots[idx]) dots[idx].classList.add('active');
    shopIndex = idx;
}
function nextShop() {
    const slides = document.querySelectorAll('#shopsContent .nearby-slide');
    if(slides.length === 0) return;
    shopIndex = (shopIndex + 1) % slides.length;
    showShop(shopIndex);
}
function prevShop() {
    const slides = document.querySelectorAll('#shopsContent .nearby-slide');
    if(slides.length === 0) return;
    shopIndex = (shopIndex - 1 + slides.length) % slides.length;
    showShop(shopIndex);
}
function goToShop(idx) { showShop(idx); }

// ========================================
// SLIDER LOGIC - VIDEOS - FIXED SELECTOR
// ========================================
let videoIndex = 0;
function showVideo(idx) {
    const slides = document.querySelectorAll('#videosContent .nearby-slide');
    const dots = document.querySelectorAll('#videosDots span');
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    if(slides[idx]) slides[idx].classList.add('active');
    if(dots[idx]) dots[idx].classList.add('active');
    videoIndex = idx;
}
function nextVideo() {
    const slides = document.querySelectorAll('#videosContent .nearby-slide');
    if(slides.length === 0) return;
    videoIndex = (videoIndex + 1) % slides.length;
    showVideo(videoIndex);
}
function prevVideo() {
    const slides = document.querySelectorAll('#videosContent .nearby-slide');
    if(slides.length === 0) return;
    videoIndex = (videoIndex - 1 + slides.length) % slides.length;
    showVideo(videoIndex);
}
function goToVideo(idx) { showVideo(idx); }

// ========================================
// AUTO SLIDE - SAB DHIRE DHIRE SIDE ME SARKEGA
// ========================================
setInterval(nextTopAd, 5000);
setInterval(nextCampaign, 6000);
setInterval(nextShop, 4000);
setInterval(nextVideo, 5000);

// ========================================
// VIDEO CLICK - FULLSCREEN MODAL
// ========================================
document.addEventListener('click', function(e) {
    const videoCard = e.target.closest('.video-card');
    if (videoCard) {
        const videoUrl = videoCard.dataset.videoUrl;
        openVideoModal(videoUrl);
    }
});

function openVideoModal(url) {
    // Purana modal hatao
    const oldModal = document.getElementById('videoModal');
    if(oldModal) oldModal.remove();

    // Naya modal banao
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
        </div>
    `;
    document.body.appendChild(modal);
    
    // Background click pe close
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
        const searchTerm = e.target.value.toLowerCase();
        console.log('Searching for:', searchTerm);
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
// PROFILE CLICK - ADMIN PANEL KHOLO
// ========================================
const profileAvatar = document.querySelector('.profile-avatar');
if(profileAvatar) {
    profileAvatar.addEventListener('click', function() {
        window.location.href = '/admin';
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