// ========================================
// SAMANLIVE - BLACKBOARD LAYOUT V4 - FINAL
// ========================================
let allModules = [], allAds = [], allServices = [], nearbyVideos = [], allCampaigns = [];
let siteSettings = {}, userLocation = null, allProducts = [];
let originalServices = [], originalProducts = [];

document.addEventListener('DOMContentLoaded', initApp);

// ========== LOCATION MANAGER - CODE1 WALA SYSTEM ==========
window.LocationManager = {
    getManual: function() {
        return new Promise((resolve) => {
            if(!navigator.geolocation) { resolve(null); return; }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                    resolve(userLocation);
                },
                () => { resolve(null); },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    },
    onLocationUpdate: null
};

async function initApp() {
    await loadSettings(); // 1. PEHLE BANNER + LOGO LOAD - ISE KUCH NA ROKE
    
    // LOCATION OR CITY KO ALAG TRY-CATCH ME DAAL DIYA
    try {
        await window.LocationManager.getManual(); 
        await showUserLocationInHeader(); 
    } catch(e) {
        console.log("Location/City error, skipping", e);
    }
    
    await loadAllData(); // 2. BAQI SAB LOAD - YE PAKKA CHALEGA
}

// 1. BANNER + LOGO ADMIN SE
async function loadSettings() {
    const res = await fetch('/api/settings').catch(()=>({ok:false}));
    if(res.ok){ 
        siteSettings = await res.json();
        
        // LOGO LOAD - NAYA
        const logoImg = document.getElementById('headerLogoImg');
        if(logoImg) {
            logoImg.src = siteSettings.headerLogoUrl + '?v=' + Date.now() || '/assets/images/samanlive-logo.png';
        }
        
        const bannerImg = document.getElementById('headerBannerImg');
        const bannerHeader = document.getElementById('mainHeaderBanner');
        
        // YEHI CHANGE - ELSE HATA DIYA
        if(bannerImg && siteSettings.headerBannerUrl && siteSettings.headerBannerUrl !== '') {
            bannerImg.src = siteSettings.headerBannerUrl + '?v=' + Date.now(); // SIRF ADMIN WALA
        }
        // ELSE HATA DIYA - KHALI RAHEGA AGAR UPLOAD NA HO
        
        if(bannerHeader) bannerHeader.style.display = 'block';
        
        if(bannerHeader && siteSettings.headerBannerHeight) {
            bannerHeader.style.height = siteSettings.headerBannerHeight + 'px';
        }
         renderFooter();
    }
}

// 2. CITY NAME SET KARO
async function showUserLocationInHeader() {
    if (!userLocation) {
        document.getElementById('userCity').textContent = 'Location Off';
        return;
    }
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}`);
        const d = await res.json();
        document.getElementById('userCity').textContent = d.address.city || d.address.town || d.address.district || 'Your Area';
    } catch(e){ 
        document.getElementById('userCity').textContent = 'Your Area'; 
    }
}

// 3. LOCATION KE BAAD SAB LOAD
async function loadAllData() {
    renderCategoryChips();
    renderHistoryProducts();
    await renderAdminAds();
    await reloadNearbyData();
    await renderNearbyProductsRepeat();
    loadUserProfilePic();

    if(window.LocationManager.onLocationUpdate){
        window.LocationManager.onLocationUpdate(userLocation);
    }
}

// 4. CATEGORY CHIPS
function renderCategoryChips() {
    const container = document.getElementById('categoryChips'); if(!container) return;
    container.innerHTML = '';
    if(!window.SHOP_TEMPLATES) return;
    window.SHOP_TEMPLATES.forEach((shop, i) => {
        container.innerHTML += `
        <div class="category-chip" onclick="filterShopsByType('${shop.id}')">
            <span class="chip-icon">${shop.icon}</span>
            <span class="chip-name">${i+1}</span>
        </div>`;
    });
}

async function filterShopsByType(shopId) {
    if(!userLocation) return alert('Pehle location on karo');
    const folder = window.getShopTemplateFolder(shopId);
    const res = await fetch(`/api/shop-view/nearby-shops?type=${folder}&lat=${userLocation.lat}&lng=${userLocation.lng}`);
    const data = await res.json();
    allServices = data.data || []; 
    alert(folder + ' ki shops load ho gayi');
}

// 5. HISTORY PRODUCT
function renderHistoryProducts() {
    const container = document.getElementById('historyProducts'); if(!container) return;
    let history = JSON.parse(localStorage.getItem('productHistory') || '[]');
    container.innerHTML = history.slice(0,10).map(p => `
        <div class="history-card" onclick="window.open('${p.url}')">
            <img src="${p.image}" onerror="this.src='/assets/default-product.png'">
            <p>${p.name}</p><span>₹${p.price}</span>
        </div>`).join('') || '<p style="opacity:0.6">No History</p>';
}

window.addToHistory = function(product){
    let history = JSON.parse(localStorage.getItem('productHistory') || '[]');
    history = history.filter(p => p.id !== product.id);
    history.unshift(product); history = history.slice(0,20);
    localStorage.setItem('productHistory', JSON.stringify(history));
    renderHistoryProducts();
}

// 6. ADMIN ADVERTISEMENT - LOCATION NA HO TO BHI CHALEGA
async function renderAdminAds() {
    const container = document.getElementById('adminAdContainer'); if(!container) return;
    let url = '/api/admin/ads/active';
    if(userLocation) url += `?lat=${userLocation.lat}&lng=${userLocation.lng}`; // <-- FIX
    
    const res = await fetch(url).catch(()=>({ok:false}));
    if(!res.ok){ container.innerHTML='<p>No Ads</p>'; return; }
    const data = await res.json();
    container.innerHTML = (data.ads||[]).map(ad => `
        <div class="ad-product-card" onclick="window.open('${ad.link}')">
            <img src="${ad.image}" onerror="this.style.display='none'"><div class="ad-info"><h4>${ad.title}</h4><p>${ad.shopName}</p></div>
        </div>`).join('') || '<p>No Ads</p>';
}

// 7. NEARBY PRODUCTS REPEAT - LOCATION NA HO TO BHI CHALEGA
async function renderNearbyProductsRepeat() {
    const container = document.getElementById('nearbyProductsRepeat'); 
    if(!container) return;

    let url = `/api/products/admin/all?limit=20`;
    if(userLocation) url += `&lat=${userLocation.lat}&lng=${userLocation.lng}`;

    const res = await fetch(url).catch(()=>({ok:false}));
    if(!res.ok){ container.innerHTML = '<p>Products load nahi hue</p>'; return; }
    const data = await res.json(); 
    allProducts = data.products || [];
    
    if(allProducts.length === 0) {
        container.innerHTML = '<p>Aas paas koi product nahi</p>';
        return;
    }

    let html = '';
    for(let i=0; i<10; i++){
        const doubleData = [...allProducts, ...allProducts];
        html += `<div class="nearby-row">` + 
        doubleData.map(p => `
            <div class="nearby-product-card" onclick="openProduct('${p._id}')">
                <img src="${p.image}" onerror="this.src='/assets/default-product.png'">
                <p>${p.name}</p>
                <span>₹${p.price}</span>
            </div>`).join('') + `</div>`;
    }
    container.innerHTML = html;
}

// PURANE FUNCTION - BILKUL SAFE
async function reloadNearbyData() {}
function renderSixLineShops(){}
function renderSixLineProducts(){}
function renderServices(){}
function renderTopAds(){}
function renderCampaigns(){}
function renderVideos(){}

// BOTTOM NAV 5 BUTTON
function goToProfilePage() { window.location.href = '/profile.html'; }
function goToDelivery() { window.location.href = '/delivery-boy.html'; }
function scrollToNearbyShops() { document.querySelector('.nearby-product-section')?.scrollIntoView({behavior:'smooth'}); }
function scrollToServices() { document.querySelector('.category-row')?.scrollIntoView({behavior:'smooth'}); }
function trackChild() { alert('Track Child - Coming Soon'); }

// SEARCH + SCANNER + PROFILE PIC
function performSearch() {
    const q = document.getElementById('searchInput').value;
    if(q) window.location.href = `/shop.html?search=${encodeURIComponent(q)}`;
}
function openQRScanner() { alert('QR Scanner Open'); }
async function loadUserProfilePic() {
    const pic = localStorage.getItem('userPic') || '/assets/images/samanlive-logo.png';
    const el = document.getElementById('navProfilePic');
    if(el) el.src = pic;
}

// PRODUCT CLICK
function openProduct(productId) {
    const prod = allProducts.find(p => p._id === productId);
    if(prod) {
        addToHistory({
            id: prod._id, 
            name: prod.name, 
            image: prod.image, 
            price: prod.price, 
            url: `/product.html?id=${productId}`
        });
    }
    window.location.href = `/product.html?id=${productId}`;
}

// ========================================
// RENDER FOOTER - ADMIN CONTROL
// ========================================
function renderFooter() {
    // Logo + About
    document.getElementById('footerLogo').textContent = siteSettings.appName || 'SAMAN LIVE';
    document.getElementById('footerAbout').textContent = siteSettings.footerAbout || '';
    document.getElementById('footerText').textContent = siteSettings.footerText || `© ${new Date().getFullYear()} SAMAN LIVE`;

    // Footer Color
    const footer = document.getElementById('dynamicFooter');
    if(footer) footer.style.background = siteSettings.footerColor || '#1f2937';

    // Footer Links
    const linksContainer = document.getElementById('footerLinksList');
    if(linksContainer && siteSettings.footerLinks) {
        linksContainer.innerHTML = siteSettings.footerLinks.map(link => 
            `<li><a href="${link.url}" target="_blank">${link.text}</a></li>`
        ).join('');
    }

    // Social Links
    const socialContainer = document.getElementById('footerSocial');
    if(socialContainer) {
        const socials = [
            {key: 'facebook', icon: '📘'},
            {key: 'instagram', icon: '📷'},
            {key: 'twitter', icon: '🐦'},
            {key: 'youtube', icon: '▶️'},
            {key: 'whatsapp', icon: '💬'}
        ];
        socialContainer.innerHTML = socials.map(s => 
            siteSettings[s.key] ? `<a href="${siteSettings[s.key]}" target="_blank">${s.icon}</a>` : ''
        ).join('');
    }
}