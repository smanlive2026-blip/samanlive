// LOCATION: public/assets/js/app.js - BLACKBOARD LAYOUT V4 + V13 HIERARCHY - FINAL FULL CODE
// ========================================
// SAMANLIVE - BLACKBOARD LAYOUT V4 + ROLE HIERARCHY
// ========================================
let allModules = [], allAds = [], allServices = [], nearbyVideos = [], allCampaigns = [];
let siteSettings = {}, userLocation = null, allProducts = [];
let originalServices = [], originalProducts = [];

// ===== V13 HIERARCHY HELPER - MINIMAL localStorage =====
function getMyRoleSafe(){
  if(window.RoleHierarchy && window.RoleHierarchy.getMyRole) return window.RoleHierarchy.getMyRole();
  try { return localStorage.getItem('USER_ROLE') || 'customer'; } catch(e){ return 'customer'; }
}
function getMyIdSafe(){
  if(window.RoleHierarchy && window.RoleHierarchy.getMyId) return window.RoleHierarchy.getMyId();
  try { return localStorage.getItem('USER_ID') || null; } catch(e){ return null; }
}
function getMyShopIdSafe(){
  if(window.RoleHierarchy && window.RoleHierarchy.getMyShopId) return window.RoleHierarchy.getMyShopId();
  const url = new URLSearchParams(window.location.search);
  return url.get('shopId') || null;
}

function canShowAddToCartButton(product){
  if (!window.RoleHierarchy) return true;
  // Inject owner info if missing
  if (!product.ownerRole) product.ownerRole = product.shopOwnerRole || product.ownerRole || 'shop_owner';
  if (!product.ownerId) product.ownerId = product.shopId || product.shop_id || product.ownerId || product.shopId;
  return window.RoleHierarchy.shouldShowAddButton(product);
}

function filterProductsByRole(products){
  if (!window.RoleHierarchy) return products;
  const myRole = getMyRoleSafe();
  const myId = getMyIdSafe();
  const myShopId = getMyShopIdSafe();
  return products.filter(p=>{
    const ownerId = p.ownerId || p.shopId || p.shop_id || p.shopId;
    const shopId = p.shopId || p.shop_id;
    // Self-buy block
    if (myShopId && shopId && myShopId === shopId) return false;
    if (myId && ownerId && myId === ownerId) return false;
    const supplierRole = p.ownerRole || p.shopOwnerRole || p.supplierRole || 'shop_owner';
    return window.RoleHierarchy.canBuy(myRole, supplierRole, myId || myShopId, ownerId);
  });
}

function renderProductCard(product){
  const showCart = canShowAddToCartButton(product);
  const price = product.price || product.sellingPrice || 0;
  const name = product.name || product.title || 'Product';
  const img = product.thumbnail || product.image || product.images?.[0] || '/assets/default-product.png';
  const shopName = product.shopName || product.shopType || product.ownerRole || 'Shop';

  // Ensure owner fields for CartCore
  if (!product.ownerRole) product.ownerRole = 'shop_owner';
  if (!product.ownerId) product.ownerId = product.shopId || product._id;
  // Safe string for onclick
  const productStr = JSON.stringify(product).replace(/'/g, "&#39;").replace(/"/g, '&quot;');

  return `
    <div class="nearby-product-card" data-product-id="${product._id}" data-owner-role="${product.ownerRole}">
      <img src="${img}" onerror="this.src='/assets/default-product.png'">
      <p>${name}</p>
      <span style="font-size:10px;color:#888">${shopName}</span>
      <span>₹${price}</span>
      ${showCart?
        `<button onclick="event.stopPropagation(); window.CartCore?window.CartCore.add(${productStr.replace(/&quot;/g,'"')},1):addToCartFallback('${product._id}')" style="width:100%;margin-top:6px;padding:6px;background:#000;color:#fff;border:0;border-radius:6px;font-size:12px">Add</button>`
        : `<div style="margin-top:6px;padding:4px;background:#f3f3f3;border-radius:6px;font-size:10px;text-align:center;color:#999">Not allowed (${getMyRoleSafe()}→${product.ownerRole})</div>`
      }
    </div>`;
}

// Fallback if CartCore not loaded
window.addToCartFallback = function(id){
  alert('Cart loading... dobara try karo');
};

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
    await loadSettings();
    try {
        await window.LocationManager.getManual();
        await showUserLocationInHeader();
    } catch(e) {
        console.log("Location/City error, skipping", e);
    }
    await loadAllData();
    // Cart count update after load
    if(window.CartCount) window.CartCount.update();
}

// 1. BANNER + LOGO ADMIN SE - FINAL VIDEO SUPPORT
async function loadSettings() {
    const res = await fetch('/api/settings').catch(()=>({ok:false}));
    if(res.ok){
        siteSettings = await res.json();
        const logoImg = document.getElementById('headerLogoImg');
        if(logoImg) {
            logoImg.src = (siteSettings.headerLogoUrl || '/assets/images/samanlive-logo.png') + '?v=' + Date.now();
        }
        const bannerHeader = document.getElementById('mainHeaderBanner');
        if(bannerHeader) {
            let finalUrl = '';
            let isVideo = false;
            if(siteSettings.headerBannerActive === 'video' && siteSettings.headerBannerVideoUrl){
                finalUrl = siteSettings.headerBannerVideoUrl;
                isVideo = true;
            } else if(siteSettings.headerBannerActive === 'image' && siteSettings.headerBannerImageUrl){
                finalUrl = siteSettings.headerBannerImageUrl;
                isVideo = false;
            } else {
                finalUrl = siteSettings.headerBannerUrl || '';
                isVideo = siteSettings.headerBannerType === 'video' || finalUrl.toLowerCase().includes('.mp4') || finalUrl.toLowerCase().includes('.webm') || finalUrl.includes('/video/');
            }
            if(finalUrl && finalUrl!== ''){
                if(isVideo){
                bannerHeader.innerHTML = `<video src="${finalUrl}" autoplay muted loop playsinline preload="auto" style="width:100%;height:100%;object-fit:cover;display:block;"></video>`;
            } else {
                bannerHeader.innerHTML = `<img src="${finalUrl}?v=${Date.now()}" style="width:100%;height:100%;object-fit:cover;display:block;">`;
            }
                bannerHeader.style.display = 'block';
                if(siteSettings.headerBannerHeight) bannerHeader.style.height = siteSettings.headerBannerHeight + 'px';
            }
        }
         renderFooter();
    }
}

async function showUserLocationInHeader() {
    if (!userLocation) {
        const uc = document.getElementById('userCity'); if(uc) uc.textContent = 'Location Off';
        return;
    }
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}`);
        const d = await res.json();
        const uc = document.getElementById('userCity'); if(uc) uc.textContent = d.address.city || d.address.town || d.address.district || 'Your Area';
    } catch(e){
        const uc = document.getElementById('userCity'); if(uc) uc.textContent = 'Your Area';
    }
}

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
    history = history.filter(p => p.id!== product.id);
    history.unshift(product); history = history.slice(0,20);
    localStorage.setItem('productHistory', JSON.stringify(history));
    renderHistoryProducts();
}

async function renderAdminAds() {
    const container = document.getElementById('adminAdContainer'); if(!container) return;
    let url = '/api/admin/ads/active';
    if(userLocation) url += `?lat=${userLocation.lat}&lng=${userLocation.lng}`;
    const res = await fetch(url).catch(()=>({ok:false}));
    if(!res.ok){ container.innerHTML='<p>No Ads</p>'; return; }
    const data = await res.json();
    container.innerHTML = (data.ads||[]).map(ad => `
        <div class="ad-product-card" onclick="window.open('${ad.link}')">
            <img src="${ad.image}" onerror="this.style.display='none'"><div class="ad-info"><h4>${ad.title}</h4><p>${ad.shopName}</p></div>
        </div>`).join('') || '<p>No Ads</p>';
}

// 7. NEARBY PRODUCTS REPEAT - WORLD MODEL SE + ROLE FILTER - FINAL
async function renderNearbyProductsRepeat() {
    const container = document.getElementById('nearbyProductsRepeat');
    if(!container) return;
    container.innerHTML = '<p style="opacity:0.6">Loading products...</p>';
    try{
        if(window.WorldProductManager){
            window.WorldProductManager.role = getMyRoleSafe();
            allProducts = await window.WorldProductManager.getAllShopsProducts();
        }else{
            const role = getMyRoleSafe();
            const res = await fetch(`/api/world-products?role=${role}`).then(r=>r.json()).catch(()=>({data:[]}));
            allProducts = res.data || res.products || [];
        }
    }catch(e){
        console.log('World products load fail', e);
        allProducts = [];
    }

    // === ROLE FILTER LAGAO - YAHI MAIN FIX HAI ===
    let filteredProducts = filterProductsByRole(allProducts);
    // Inject ownerRole if missing
    filteredProducts = filteredProducts.map(p=> ({
       ...p,
        ownerRole: p.ownerRole || p.shopOwnerRole || 'shop_owner',
        ownerId: p.ownerId || p.shopId,
        shopId: p.shopId
    }));

    if(!filteredProducts || filteredProducts.length === 0) {
        container.innerHTML = `<p>No products for role ${getMyRoleSafe()} - Aas paas koi product nahi</p>`;
        return;
    }

    let html = '';
    for(let i=0; i<10; i++){
        const doubleData = [...filteredProducts,...filteredProducts];
        html += `<div class="nearby-row">` +
        doubleData.map(p => renderProductCard(p)).join('') + `</div>`;
    }
    container.innerHTML = html;
    console.log(`Products: ${allProducts.length} -> ${filteredProducts.length} after role filter [${getMyRoleSafe()}]`);
}

async function reloadNearbyData() {}
function renderSixLineShops(){}
function renderSixLineProducts(){}
function renderServices(){}
function renderTopAds(){}
function renderCampaigns(){}
function renderVideos(){}

function goToProfilePage() { window.location.href = '/profile.html'; }
function goToDelivery() { window.location.href = '/delivery-boy.html'; }
function scrollToNearbyShops() { document.querySelector('.nearby-product-section')?.scrollIntoView({behavior:'smooth'}); }
function scrollToServices() { document.querySelector('.category-row')?.scrollIntoView({behavior:'smooth'}); }
function trackChild() { alert('Track Child - Coming Soon'); }

function performSearch() {
    const q = document.getElementById('searchInput').value;
    if(q) window.location.href = `/nearby-shops.html?search=${encodeURIComponent(q)}`;
}
function openQRScanner() { alert('QR Scanner Open'); }
async function loadUserProfilePic() {
    const pic = localStorage.getItem('userPic') || '/assets/images/samanlive-logo.png';
    const el = document.getElementById('navProfilePic');
    if(el) el.src = pic;
}

function openProduct(productId) {
    const prod = allProducts.find(p => p._id === productId);
    if(prod) {
        const shopUrl = `/shop-templates/${prod.shopType}/customer-view.html?shopId=${prod.shopId}&supplierId=${prod.shopId}&supplierRole=${prod.ownerRole || 'shop_owner'}`;
        addToHistory({
            id: prod._id,
            name: prod.name,
            image: prod.thumbnail || prod.image,
            price: prod.price,
            url: shopUrl
        });
        window.location.href = shopUrl;
    }
}

function renderFooter() {
    const footerLogo = document.getElementById('footerLogo');
    if(footerLogo) footerLogo.textContent = siteSettings.appName || 'SAMAN LIVE';
    const footerAbout = document.getElementById('footerAbout');
    if(footerAbout) footerAbout.textContent = siteSettings.footerAbout || '';
    const footerText = document.getElementById('footerText');
    if(footerText) footerText.textContent = siteSettings.footerText || `© ${new Date().getFullYear()} SAMAN LIVE`;
    const footer = document.getElementById('dynamicFooter');
    if(footer) footer.style.background = siteSettings.footerColor || '#1f2937';
    const linksContainer = document.getElementById('footerLinksList');
    if(linksContainer && siteSettings.footerLinks) {
        linksContainer.innerHTML = siteSettings.footerLinks.map(link =>
            `<li><a href="${link.url}" target="_blank">${link.text}</a></li>`
        ).join('');
    }
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
            siteSettings[s.key]? `<a href="${siteSettings[s.key]}" target="_blank">${s.icon}</a>` : ''
        ).join('');
    }
}

// Expose for other files
window.AppRoleFilter = { filterProductsByRole, canShowAddToCartButton, renderProductCard };
console.log('✅ app.js BLACKBOARD V4 + V13 Hierarchy loaded - Role:', getMyRoleSafe());