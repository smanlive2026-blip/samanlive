// LOCATION: public/assets/js/app.js - V5 PROFILE ACTIVATED + BLACKBOARD V4 + V13 HIERARCHY - FINAL
let allModules = [], allAds = [], allServices = [], nearbyVideos = [], allCampaigns = [];
let siteSettings = {}, userLocation = null, allProducts = [];
let originalServices = [], originalProducts = [];
let currentUser = null; // MAIN APP PROFILE KE LIYE

// ===== V13 HIERARCHY HELPER =====
function getMyRoleSafe(){
  if(window.RoleHierarchy && window.RoleHierarchy.getMyRole) return window.RoleHierarchy.getMyRole();
  try { return localStorage.getItem('USER_ROLE') || 'customer'; } catch(e){ return 'customer'; }
}
function getMyIdSafe(){
  if(window.RoleHierarchy && window.RoleHierarchy.getMyId) return window.RoleHierarchy.getMyId();
  try { return localStorage.getItem('USER_ID') || currentUser?._id || null; } catch(e){ return null; }
}
function getMyShopIdSafe(){
  if(window.RoleHierarchy && window.RoleHierarchy.getMyShopId) return window.RoleHierarchy.getMyShopId();
  const url = new URLSearchParams(window.location.search);
  return url.get('shopId') || null;
}

function canShowAddToCartButton(product){
  if (!window.RoleHierarchy) return true;
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
  if (!product.ownerRole) product.ownerRole = 'shop_owner';
  if (!product.ownerId) product.ownerId = product.shopId || product._id;
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

window.addToCartFallback = function(id){ alert('Cart loading... dobara try karo'); };

document.addEventListener('DOMContentLoaded', initApp);

// ========== LOCATION MANAGER ==========
window.LocationManager = {
    getManual: function() {
        return new Promise((resolve) => {
            if(!navigator.geolocation) { resolve(null); return; }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                    window.currentUserLocation = userLocation; // PROFILE ADDRESSES KE LIYE
                    resolve(userLocation);
                },
                () => { resolve(null); },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    },
    onLocationUpdate: null
};

// ========== PROFILE ACTIVATION - YEHI MISSING THA ==========
async function loadCurrentUser(){
  const token = localStorage.getItem('userToken');
  if(!token) return null;
  try{
    const res = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await res.json();
    if(data.success){
      currentUser = data.user;
      window.currentUser = data.user;
      // RoleHierarchy ko bhi bata do
      try{
        localStorage.setItem('USER_ID', data.user._id);
        localStorage.setItem('USER_NAME', data.user.name);
        localStorage.setItem('USER_PHONE', data.user.phone);
        localStorage.setItem('userPic', data.user.profilePic || '');
      }catch(e){}
      return data.user;
    }else{
      if(res.status===401){
        localStorage.removeItem('userToken');
      }
    }
  }catch(e){ console.log('loadCurrentUser fail', e); }
  return null;
}

async function initApp() {
    // 1. Pehle user load karo - PROFILE KE LIYE SABSE JARURI
    await loadCurrentUser();
    
    await loadSettings();
    try {
        await window.LocationManager.getManual();
        await showUserLocationInHeader();
    } catch(e) {
        console.log("Location/City error, skipping", e);
    }
    await loadAllData();
    if(window.CartCount) window.CartCount.update();
    loadUserProfilePic();
}

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
    let filteredProducts = filterProductsByRole(allProducts);
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

function goToProfilePage() { 
  const token = localStorage.getItem('userToken');
  if(!token){
    // Login nahi hai toh login popup
    if(window.openLoginModal) window.openLoginModal();
    else alert('Pehle login karo');
    return;
  }
  window.location.href = '/profile.html'; 
}
function goToDelivery() { window.location.href = '/delivery-boy.html'; }
function scrollToNearbyShops() { document.querySelector('.nearby-product-section')?.scrollIntoView({behavior:'smooth'}); }
function scrollToServices() { document.querySelector('.category-row')?.scrollIntoView({behavior:'smooth'}); }
function trackChild() { alert('Track Child - Coming Soon'); }

function performSearch() {
    const q = document.getElementById('searchInput').value;
    if(q) window.location.href = `/nearby-shops.html?search=${encodeURIComponent(q)}`;
}
function openQRScanner() { alert('QR Scanner Open'); }

// PROFILE PIC - AB currentUser SE LEGA, localStorage SE NAHI
async function loadUserProfilePic() {
    let pic = '/assets/images/samanlive-logo.png';
    if(currentUser && currentUser.profilePic){
      pic = currentUser.profilePic;
    }else{
      pic = localStorage.getItem('userPic') || localStorage.getItem('USER_PIC') || pic;
    }
    const el = document.getElementById('navProfilePic');
    if(el) el.src = pic;
    const el2 = document.getElementById('profileUserPic');
    if(el2 && currentUser && currentUser.profilePic) el2.src = currentUser.profilePic;
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

window.AppRoleFilter = { filterProductsByRole, canShowAddToCartButton, renderProductCard };
window.currentUser = currentUser; // PROFILE JS FILES KE LIYE EXPOSE
console.log('✅ app.js V5 PROFILE ACTIVATED + V13 Hierarchy loaded - Role:', getMyRoleSafe(), 'User:', currentUser?.name||'Guest');