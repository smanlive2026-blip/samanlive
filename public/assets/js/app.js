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
// LOAD DATA FROM SERVER - WITH LOCATION - UPDATED
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

        // MODULES KO GPS KE SAATH LOAD KARO - YAHI CHANGE HAI
        if(userLocation) {
            // Naya route: /api/modules/nearby - Area-wise modules
            const modulesRes = await fetch('/api/modules/nearby', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: userLocation.lat, lng: userLocation.lng })
            });
            const modulesData = await modulesRes.json();
            allModules = modulesData.modules || [];

            // Shops bhi GPS ke saath load karo - CHANGE KIYA
            const shopsRes = await fetch(`/api/public-shops?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=5000`);
            const shopsData = await shopsRes.json();
            nearbyServices = shopsData.data || shopsData;
        } else {
            // Location nahi mili to purana tarika - CHANGE KIYA
            const [modulesRes, shopsRes] = await Promise.all([
                fetch('/api/modules'),
                fetch('/api/public-shops')
            ]);
            const modulesData = await modulesRes.json();
            const shopsData = await shopsRes.json();
            allModules = modulesData.modules || modulesData;
            nearbyServices = shopsData.data || shopsData;
        }

        console.log('SAMANLIVE Loaded! Modules:', allModules.length, 'Shops:', nearbyServices.length);

        // Render everything
        renderServices();
        renderTopAds();
        renderCampaigns();
        renderShops();
        renderFamousShops(); // NAYA ADD KIYA - Famous shops render
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
function renderServices(filteredModules = null) { /* ADDED BY AI - SEARCH FIX: filteredModules parameter add kiya */
    const modulesToRender = filteredModules || allModules; /* ADDED BY AI - SEARCH FIX */
    const sortedModules = sortModulesByUsage(modulesToRender);
    const gridEl = document.getElementById('serviceGrid');

    if(modulesToRender.length === 0) { /* ADDED BY AI - SEARCH FIX: allModules ki jagah modulesToRender */
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
// RENDER SHOPS - TRAIN SCROLL + DISTANCE - FIXED BY AI
// ========================================
function renderShops() {
    // FIXED BY AI - Train effect ke liye double kar diya + slide hata diya
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
// RENDER FAMOUS SHOPS - NAYA FUNCTION - AREA KI APPROVED SHOPS
// ========================================
function renderFamousShops() {
    // User ke area ki shops filter karo - jo approved hain aur active hain
    const areaShops = nearbyServices.filter(shop =>
        shop.status === 'approved' &&
        shop.isActive!== false // false nahi hai to active maan lo
    ).sort((a, b) => {
        // Distance se sort - najdeek wali pehle
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
// RENDER VIDEOS - TRAIN SCROLL + SHOP LINK - MODIFIED BY AI
// ========================================
function renderVideos() {
    // MODIFIED BY AI - Train effect ke liye double kar diya
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
// SLIDER LOGIC - TOP ADS - FIXED BY AI
// ========================================
let topAdIndex = 0;
function showTopAd(idx) {
    const slides = document.querySelectorAll('#topAdsContainer.ad-slide'); // FIXED BY AI - space add kiya
    slides.forEach(s => s.classList.remove('active'));
    if(slides[idx]) slides[idx].classList.add('active');
    topAdIndex = idx;
}
function nextTopAd() {
    const slides = document.querySelectorAll('#topAdsContainer.ad-slide'); // FIXED BY AI
    if(slides.length === 0) return;
    topAdIndex = (topAdIndex + 1) % slides.length;
    showTopAd(topAdIndex);
}
function prevTopAd() {
    const slides = document.querySelectorAll('#topAdsContainer.ad-slide'); // FIXED BY AI
    if(slides.length === 0) return;
    topAdIndex = (topAdIndex - 1 + slides.length) % slides.length;
    showTopAd(topAdIndex);
}

// ========================================
// SLIDER LOGIC - CAMPAIGNS - FIXED BY AI
// ========================================
let campaignIndex = 0;
function showCampaign(idx) {
    const slides = document.querySelectorAll('#campaignContainer.ad-slide'); // FIXED BY AI - space add kiya
    slides.forEach(s => s.classList.remove('active'));
    if(slides[idx]) slides[idx].classList.add('active');
    campaignIndex = idx;
}
function nextCampaign() {
    const slides = document.querySelectorAll('#campaignContainer.ad-slide'); // FIXED BY AI
    if(slides.length === 0) return;
    campaignIndex = (campaignIndex + 1) % slides.length;
    showCampaign(campaignIndex);
}
function prevCampaign() {
    const slides = document.querySelectorAll('#campaignContainer.ad-slide'); // FIXED BY AI
    if(slides.length === 0) return;
    campaignIndex = (campaignIndex - 1 + slides.length) % slides.length;
    showCampaign(campaignIndex);
}

// ========================================
// SLIDER LOGIC - SHOPS - ABHI BHI RAKHA HAI BUT USE NAHI HOGA
// ========================================
let shopIndex = 0;
function showShop(idx) {
    const slides = document.querySelectorAll('#shopsContent.nearby-slide');
    slides.forEach(s => s.classList.remove('active'));
    if(slides[idx]) slides[idx].classList.add('active');
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
// SLIDER LOGIC - VIDEOS - ABHI BHI RAKHA HAI BUT USE NAHI HOGA
// ========================================
let videoIndex = 0;
function showVideo(idx) {
    const slides = document.querySelectorAll('#videosContent.nearby-slide');
    slides.forEach(s => s.classList.remove('active'));
    if(slides[idx]) slides[idx].classList.add('active');
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
// AUTO SLIDE - SHOPS/VIDEOS HATA DIYA AB TRAIN HAI - FIXED BY AI
// ========================================
setInterval(nextTopAd, 5000);
setInterval(nextCampaign, 6000);

// ========================================
// VIDEO CLICK - FULLSCREEN MODAL + SHOP LINK - MODIFIED BY AI
// ========================================
document.addEventListener('click', function(e) {
    const videoCard = e.target.closest('.video-card');
    if (videoCard) {
        const videoUrl = videoCard.dataset.videoUrl;
        const shopId = videoCard.dataset.shopId; // MODIFIED BY AI
        openVideoModal(videoUrl, shopId); // MODIFIED BY AI
    }
});

function openVideoModal(url, shopId) { // MODIFIED BY AI - shopId parameter add
    const shop = nearbyServices.find(s => s._id === shopId); // ADDED BY AI - _id use kiya
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
    `; // MODIFIED BY AI - Shop info + button add kiya
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
// SEARCH FUNCTIONALITY - ADDED BY AI
// ========================================
const searchInput = document.getElementById('searchInput');
if(searchInput) {
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();

        if(searchTerm === '') {
            // Search khali hai to sab modules dikhao
            renderServices();
        } else {
            // Filter modules by name
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
// USER AUTH + PROFILE SYSTEM - NAYA ADD KIYA
// ========================================
let currentUser = null;
let scannedUserData = null;
let html5QrcodeScanner = null;

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
    if (currentUser) {
        avatar.innerHTML = `<img src="${currentUser.profilePic || '/assets/default-avatar.png'}" alt="Profile">`;
        avatar.onclick = goToProfilePage; // CHANGE 1: YAHAN BADLA
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

// PHONE LOGIN
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

// GOOGLE LOGIN - Baad me Firebase add karenge
function loginWithGoogle() {
    alert('Google Login setup ho raha hai. Abhi phone se login karo 🙏');
}

// PROFILE MODAL
function openProfileModal() {
    if (!currentUser) return openLoginModal();

    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('userUniqueId').textContent = currentUser.userId;
    document.getElementById('profilePic').src = currentUser.profilePic || '/assets/default-avatar.png';
    document.getElementById('profileModal').style.display = 'flex';
}
function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
    document.getElementById('qrCodeBox').style.display = 'none';
    document.getElementById('detailsForm').style.display = 'none';
}

// SHOW QR CODE
function showUserQR() {
    const qrBox = document.getElementById('qrCodeBox');
    if (qrBox.style.display === 'none') {
        qrBox.style.display = 'block';
        generateQRCode(currentUser.qrCodeData);
    } else {
        qrBox.style.display = 'none';
    }
}

// GENERATE QR
function generateQRCode(text) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js';
    script.onload = () => {
        const canvas = document.getElementById('qrCanvas');
        QRCode.toCanvas(canvas, text, { width: 200, margin: 2 });
    };
    document.head.appendChild(script);
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
            alert('Details Updated! ✅');
            closeProfileModal();
            updateProfileAvatar();
        }
    } catch (err) {
        alert('Update failed');
    }
}

// QR SCANNER
function openQRScanner() {
    if (!currentUser) return alert('Pehle login karo bhai');
    document.getElementById('qrScannerModal').style.display = 'flex';

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/html5-qrcode';
    script.onload = () => {
        if (html5QrcodeScanner) html5QrcodeScanner.clear();
        html5QrcodeScanner = new Html5QrcodeScanner("qrReader", { fps: 10, qrbox: 250 });
        html5QrcodeScanner.render(onScanSuccess);
    };
    document.head.appendChild(script);
}

function onScanSuccess(decodedText) {
    try {
        scannedUserData = JSON.parse(decodedText);
        document.getElementById('scannedUserName').textContent = `${scannedUserData.name} - ${scannedUserData.userId}`;
        document.getElementById('scanResult').style.display = 'block';
    } catch (err) {
        alert('Invalid QR Code');
    }
}

function closeQRScanner() {
    document.getElementById('qrScannerModal').style.display = 'none';
    document.getElementById('scanResult').style.display = 'none';
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear();
    }
}

function handleBuy() {
    alert(`BUY: ${scannedUserData.name} se kharidna hai 🛒\nUser ID: ${scannedUserData.userId}`);
    closeQRScanner();
}

function handleSell() {
    alert(`SELL: ${scannedUserData.name} ko bechna hai 📦\nUser ID: ${scannedUserData.userId}`);
    closeQRScanner();
}

// LOGOUT
function logout() {
    localStorage.removeItem('userToken');
    currentUser = null;
    updateProfileAvatar();
    closeProfileModal();
    alert('Logged out successfully!');
}

// ========================================
// SHOP CREATION SYSTEM - NAYA ADD KIYA
// ========================================
function showCreateShop() {
    if (!currentUser) return alert('Pehle login karo bhai');
    if (currentUser.hasShop) return alert('Tumhari shop already hai!');

    // Modules dropdown fill kar
    const select = document.getElementById('shopModuleSelect');
    select.innerHTML = '<option value="">Select Service Type</option>';
    allModules.forEach(m => {
        select.innerHTML += `<option value="${m.id}">${m.icon} ${m.name}</option>`;
    });

    document.getElementById('createShopModal').style.display = 'flex';
}

function closeCreateShopModal() {
    document.getElementById('createShopModal').style.display = 'none';
}

async function submitCreateShop() {
    const token = localStorage.getItem('userToken');
    const shopData = {
        name: document.getElementById('shopNameInput').value.trim(),
        moduleId: document.getElementById('shopModuleSelect').value,
        phone: document.getElementById('shopPhoneInput').value.trim(),
        address: document.getElementById('shopAddressInput').value.trim(),
        range: parseInt(document.getElementById('shopRangeInput').value) || 5000,
        icon: document.getElementById('shopIconInput').value || '🏪',
        color: '#10b981',
        priority: 1
    };

    if (!shopData.name ||!shopData.moduleId ||!shopData.phone ||!shopData.address) {
        return alert('Sab fields bharo bhai!');
    }

    try {
        const res = await fetch('/api/shop/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(shopData)
        });
        const data = await res.json();

        if (data.success) {
            alert('✅ Shop ban gayi! Ab admin se approval milega.\n\nAbhi status: Pending');
            currentUser.hasShop = true;
            closeCreateShopModal();
            closeProfileModal();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (err) {
        alert('Shop create failed. Server check karo.');
    }
}

// ========================================
// AUTO TRAIN SLIDING + DRAG SUPPORT - UPDATED BY AI
// ========================================
function startTrainSliding() {
    const containers = [
        document.getElementById('shopsContent'),
        document.getElementById('videosContent'),
        document.getElementById('famousShopsContent') // NAYA ADD KIYA
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
            const walk = (x - startX) * 2; // scroll speed 2x
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

// ========================================
// PROFILE PAGE REDIRECT - ADDED FOR NEW PROFILE SYSTEM
// ========================================
function goToProfilePage() {
    if (!currentUser) {
        openLoginModal();
        return;
    }
    window.location.href = '/profile.html'; // public/profile.html khulega
}