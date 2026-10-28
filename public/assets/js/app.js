// LOCATION: public/assets/js/app.js - V6 WORLD CLASS - PRODUCT DETAIL + CART FIX + PROFILE + V13 HIERARCHY - FINAL
let allModules = [], allAds = [], allServices = [], nearbyVideos = [], allCampaigns = [];
let siteSettings = {}, userLocation = null, allProducts = [];
let originalServices = [], originalProducts = [];
let currentUser = null;

// ===== V13 HIERARCHY HELPER - WORLD CLASS =====
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

// ===== PRODUCT CARD - WORLD CLASS - AMAZON STYLE =====
function renderProductCard(product){
  const showCart = canShowAddToCartButton(product);
  const price = product.price || product.sellingPrice || 0;
  const mrp = product.mrp || product.originalPrice || 0;
  const off = mrp>price ? Math.round((1-price/mrp)*100) : 0;
  const name = product.name || product.title || 'Product';
  const img = product.thumbnail || product.image || (Array.isArray(product.images)?(product.images[0]?.url||product.images[0]):null) || '/assets/default-product.png';
  const shopName = product.shopName || product.shopType || product.ownerRole || 'Shop';
  if (!product.ownerRole) product.ownerRole = 'shop_owner';
  if (!product.ownerId) product.ownerId = product.shopId || product._id;
  if(!window._productMap) window._productMap = {};
  window._productMap[product._id] = product;
  const safeId = String(product._id).replace(/'/g,'');
  return `
    <div class="nearby-product-card" data-product-id="${product._id}" data-owner-role="${product.ownerRole}" onclick="openProduct('${safeId}')" style="cursor:pointer;position:relative">
      ${off>0? `<span style="position:absolute;top:6px;left:6px;background:#16a34a;color:#fff;font-size:9px;font-weight:900;padding:2px 6px;border-radius:6px;z-index:2">${off}% OFF</span>`:''}
      <img src="${img}" loading="lazy" onerror="this.src='/assets/default-product.png'" style="width:100%;height:110px;object-fit:contain;background:#fff;border-radius:10px">
      <p style="font-size:12px;font-weight:800;margin-top:6px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</p>
      <span style="font-size:10px;color:#888;font-weight:700">${shopName}</span>
      <div style="display:flex;align-items:center;gap:6px;margin-top:2px"><span style="font-size:13px;font-weight:900">₹${price}</span>${mrp>price? `<span style="font-size:10px;color:#94a3b8;text-decoration:line-through">₹${mrp}</span>`:''}</div>
      ${showCart?
        `<button onclick="event.stopPropagation(); addToCartById('${safeId}')" style="width:100%;margin-top:6px;padding:7px;background:#0f172a;color:#fff;border:0;border-radius:8px;font-size:11px;font-weight:800">Add to Cart</button>`
        : `<div style="margin-top:6px;padding:5px;background:#f1f5f9;border-radius:8px;font-size:9px;text-align:center;color:#64748b;font-weight:700">View Only</div>`
      }
    </div>`;
}

// ===== CART - WORLD CLASS - last_shopId FIX =====
window._productMap = window._productMap || {};
window.addToCartById = async function(productId){
  const product = window._productMap[productId] || allProducts.find(p=>p._id===productId);
  if(!product){ alert('Product not found - refresh karo'); return; }
  try{
    // FIX 1: last_shopId set karo - cart page ke liye sabse jaruri
    if(product.shopId){
      localStorage.setItem('last_shopId', product.shopId);
      localStorage.setItem('last_supplierId', product.shopId);
    }
    if(product.ownerId) localStorage.setItem('last_supplierId', product.ownerId);
    if(product.ownerRole) localStorage.setItem('last_supplierRole', product.ownerRole);
    else localStorage.setItem('last_supplierRole', 'shop_owner');
    try{ localStorage.setItem('last_product', JSON.stringify(product)); }catch(e){}

    if(window.CartCore && window.CartCore.ready){ try{ await window.CartCore.ready; }catch(e){} }
    if(window.CartCore){
      const ok = await window.CartCore.add(product, 1);
      if(ok!==false){
        const t=document.createElement('div'); 
        t.textContent=`${product.name||'Product'} added ✅`;
        t.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#0f172a;color:#fff;padding:12px 18px;border-radius:12px;z-index:9999;font-size:13px;font-weight:800;box-shadow:0 8px 20px rgba(0,0,0,.2)';
        document.body.appendChild(t); 
        setTimeout(()=>t.remove(),1500);
        if(window.CartCount) window.CartCount.update();
      }
    } else {
      addToCartFallback(productId);
    }
  }catch(e){ console.error(e); alert('Cart error: '+e.message); }
};

window.addToCartFallback = function(id){ 
  const p = window._productMap[id] || allProducts.find(x=>x._id===id);
  if(p && window.CartCore){ 
    localStorage.setItem('last_shopId', p.shopId||'');
    window.CartCore.add(p,1); 
  }
  else { alert('Cart loading... dobara try karo'); }
};

document.addEventListener('DOMContentLoaded', initApp);

// ========== LOCATION MANAGER ==========
window.LocationManager = {
    getManual: function() {
        return new Promise((resolve) => {
            if(!navigator.geolocation) { resolve(null); return; }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                    window.currentUserLocation = userLocation;
                    resolve(userLocation);
                },
                () => { resolve(null); },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    },
    onLocationUpdate: null
};

// ========== PROFILE ACTIVATION - COMMON PROFILE SE ==========
async function loadCurrentUser(){
  const token = localStorage.getItem('userToken') || localStorage.getItem('TOKEN') || localStorage.getItem('token');
  if(!token) return null;
  try{
    // Pehle common profile try
    let res = await fetch('/api/common/profile/me', { headers: { 'Authorization': 'Bearer ' + token, 'x-buyer-id': localStorage.getItem('USER_ID')||'' } });
    let data = await res.json().catch(()=>({}));
    if(!data.success){
      // Fallback old auth/me
      res = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } });
      data = await res.json();
    }
    if(data.success && (data.user || data.data)){
      const u = data.user || data.data || data;
      currentUser = u;
      window.currentUser = u;
      window.USER_ID = u._id;
      window.USER_ROLE = u.role || 'customer';
      try{
        localStorage.setItem('USER_ID', u._id);
        localStorage.setItem('USER_NAME', u.name||'');
        localStorage.setItem('USER_PHONE', u.phone||'');
        localStorage.setItem('USER_ROLE', u.role||'customer');
        localStorage.setItem('userPic', u.profilePic||u.avatar||'');
      }catch(e){}
      return u;
    }else{
      if(res.status===401){ localStorage.removeItem('userToken'); localStorage.removeItem('TOKEN'); }
    }
  }catch(e){ console.log('loadCurrentUser fail', e); }
  return null;
}

async function initApp() {
    await loadCurrentUser();
    await loadSettings();
    try {
        await window.LocationManager.getManual();
        await showUserLocationInHeader();
    } catch(e) { console.log("Location/City error, skipping", e); }
    await loadAllData();
    if(window.CartCount) window.CartCount.update();
    loadUserProfilePic();
}

async function loadSettings() {
    const res = await fetch('/api/settings').catch(()=>({ok:false}));
    if(res.ok){
        siteSettings = await res.json();
        const logoImg = document.getElementById('headerLogoImg');
        if(logoImg) { logoImg.src = (siteSettings.headerLogoUrl || '/assets/images/samanlive-logo.png') + '?v=' + Date.now(); }
        const bannerHeader = document.getElementById('mainHeaderBanner');
        if(bannerHeader) {
            let finalUrl = ''; let isVideo = false;
            if(siteSettings.headerBannerActive === 'video' && siteSettings.headerBannerVideoUrl){ finalUrl = siteSettings.headerBannerVideoUrl; isVideo = true; }
            else if(siteSettings.headerBannerActive === 'image' && siteSettings.headerBannerImageUrl){ finalUrl = siteSettings.headerBannerImageUrl; isVideo = false; }
            else { finalUrl = siteSettings.headerBannerUrl || ''; isVideo = siteSettings.headerBannerType === 'video' || finalUrl.toLowerCase().includes('.mp4') || finalUrl.toLowerCase().includes('.webm') || finalUrl.includes('/video/'); }
            if(finalUrl && finalUrl!== ''){
                if(isVideo){ bannerHeader.innerHTML = `<video src="${finalUrl}" autoplay muted loop playsinline preload="auto" style="width:100%;height:100%;object-fit:cover;display:block;"></video>`; }
                else { bannerHeader.innerHTML = `<img src="${finalUrl}?v=${Date.now()}" style="width:100%;height:100%;object-fit:cover;display:block;">`; }
                bannerHeader.style.display = 'block';
                if(siteSettings.headerBannerHeight) bannerHeader.style.height = siteSettings.headerBannerHeight + 'px';
            }
        }
         renderFooter();
    }
}

async function showUserLocationInHeader() {
    if (!userLocation) { const uc = document.getElementById('userCity'); if(uc) uc.textContent = 'Location Off'; return; }
    try { const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}`); const d = await res.json(); const uc = document.getElementById('userCity'); if(uc) uc.textContent = d.address.city || d.address.town || d.address.district || 'Your Area'; }
    catch(e){ const uc = document.getElementById('userCity'); if(uc) uc.textContent = 'Your Area'; }
}

async function loadAllData() {
    renderCategoryChips();
    renderHistoryProducts();
    await renderAdminAds();
    await reloadNearbyData();
    await renderNearbyProductsRepeat();
    if(window.LocationManager.onLocationUpdate){ window.LocationManager.onLocationUpdate(userLocation); }
}

function renderCategoryChips() {
    const container = document.getElementById('categoryChips'); if(!container) return;
    container.innerHTML = '';
    if(!window.SHOP_TEMPLATES) return;
    window.SHOP_TEMPLATES.forEach((shop, i) => {
        container.innerHTML += `<div class="category-chip" onclick="filterShopsByType('${shop.id}')"><span class="chip-icon">${shop.icon}</span><span class="chip-name">${i+1}</span></div>`;
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
    container.innerHTML = history.slice(0,10).map(p => `<div class="history-card" onclick="window.open('${p.url}')"><img src="${p.image}" onerror="this.src='/assets/default-product.png'"><p>${p.name}</p><span>₹${p.price}</span></div>`).join('') || '<p style="opacity:0.6">No History</p>';
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
    container.innerHTML = (data.ads||[]).map(ad => `<div class="ad-product-card" onclick="window.open('${ad.link}')"><img src="${ad.image}" onerror="this.style.display='none'"><div class="ad-info"><h4>${ad.title}</h4><p>${ad.shopName}</p></div></div>`).join('') || '<p>No Ads</p>';
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
            const res = await fetch(`/api/world-products?role=${role}&limit=100`).then(r=>r.json()).catch(()=>({data:[]}));
            allProducts = res.data || res.products || [];
        }
    }catch(e){ console.log('World products load fail', e); allProducts = []; }
    let filteredProducts = filterProductsByRole(allProducts);
    filteredProducts = filteredProducts.map(p=> ({ ...p, ownerRole: p.ownerRole || p.shopOwnerRole || 'shop_owner', ownerId: p.ownerId || p.shopId, shopId: p.shopId }));
    if(!filteredProducts || filteredProducts.length === 0) { container.innerHTML = `<p>No products for role ${getMyRoleSafe()} - Aas paas koi product nahi</p>`; return; }
    if(!window._productMap) window._productMap = {};
    filteredProducts.forEach(p=>{ window._productMap[p._id]=p; });
    let html = '';
    for(let i=0; i<10; i++){
        const doubleData = [...filteredProducts,...filteredProducts];
        html += `<div class="nearby-row">` + doubleData.map(p => renderProductCard(p)).join('') + `</div>`;
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
  const token = localStorage.getItem('userToken') || localStorage.getItem('TOKEN');
  if(!token){ if(window.openLoginModal) window.openLoginModal(); else alert('Pehle login karo'); return; }
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

async function loadUserProfilePic() {
    let pic = '/assets/images/samanlive-logo.png';
    if(currentUser && currentUser.profilePic) pic = currentUser.profilePic;
    else if(currentUser && currentUser.avatar) pic = currentUser.avatar;
    else pic = localStorage.getItem('userPic') || localStorage.getItem('USER_PIC') || pic;
    const el = document.getElementById('navProfilePic');
    if(el) el.src = pic;
    const el2 = document.getElementById('profileUserPic');
    if(el2 && currentUser && currentUser.profilePic) el2.src = currentUser.profilePic;
}

// ===== PRODUCT DETAIL NAVIGATION - WORLD CLASS - AMAZON STYLE =====
function openProduct(productId) {
    const prod = window._productMap[productId] || allProducts.find(p => p._id === productId);
    if(!prod) return;
    try{ 
      localStorage.setItem('last_product', JSON.stringify(prod));
      localStorage.setItem('last_shopId', prod.shopId||'');
      localStorage.setItem('last_supplierId', prod.shopId||'');
      localStorage.setItem('last_supplierRole', prod.ownerRole||'shop_owner');
    }catch(e){}
    addToHistory({ 
      id: prod._id, 
      name: prod.name, 
      image: prod.thumbnail || prod.image || (prod.images && prod.images[0]?.url) || '', 
      price: prod.price, 
      url: `/shop-templates/common/product/product-detail.html?productId=${prod._id}&shopId=${prod.shopId}&shopType=${prod.shopType||'general'}` 
    });
    // AMAZON STYLE - PRODUCT DETAIL PAGE PE BHEJO, DIRECT SHOP NAHI
    window.location.href = `/shop-templates/common/product/product-detail.html?productId=${encodeURIComponent(prod._id)}&shopId=${encodeURIComponent(prod.shopId||'')}&shopType=${encodeURIComponent(prod.shopType||'general')}&shopName=${encodeURIComponent(prod.shopName||'')}`;
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
    if(linksContainer && siteSettings.footerLinks) { linksContainer.innerHTML = siteSettings.footerLinks.map(link => `<li><a href="${link.url}" target="_blank">${link.text}</a></li>`).join(''); }
    const socialContainer = document.getElementById('footerSocial');
    if(socialContainer) {
        const socials = [ {key: 'facebook', icon: '📘'}, {key: 'instagram', icon: '📷'}, {key: 'twitter', icon: '🐦'}, {key: 'youtube', icon: '▶️'}, {key: 'whatsapp', icon: '💬'} ];
        socialContainer.innerHTML = socials.map(s => siteSettings[s.key]? `<a href="${siteSettings[s.key]}" target="_blank">${s.icon}</a>` : '').join('');
    }
}

window.AppRoleFilter = { filterProductsByRole, canShowAddToCartButton, renderProductCard };
window.currentUser = currentUser;
console.log('✅ app.js V6 WORLD CLASS - Product Detail + Cart Fix + Common Profile - Role:', getMyRoleSafe());