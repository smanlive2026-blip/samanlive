// LOCATION: public/assets/js/app.js - V8 WORLD CLASS - ADMIN CONTROLLED - PRODUCT SIZE SCROLL FOOTER EVERYTHING FROM ADMIN
let allModules = [], allAds = [], allServices = [], nearbyVideos = [], allCampaigns = [];
let siteSettings = {}, userLocation = null, allProducts = [];
let originalServices = [], originalProducts = [];
let currentUser = null;

// ===== ADMIN SETTINGS APPLY - WORLD CLASS =====
function applyAdminSettings(settings){
    if(!settings) return;
    
    // Header
    const header = document.querySelector('.top-header');
    if(header){
        if(settings.headerHeight) header.style.height = settings.headerHeight + 'px';
        if(settings.headerColor) header.style.background = settings.headerColor;
        if(settings.headerTextColor) header.style.color = settings.headerTextColor;
        if(settings.headerSticky===false) { header.style.position='relative'; } else { header.style.position='sticky'; }
        const logoImg = document.getElementById('headerLogoImg');
        if(logoImg){
            if(settings.headerLogoSize) { logoImg.style.width=settings.headerLogoSize+'px'; logoImg.style.height=settings.headerLogoSize+'px'; }
            if(settings.headerShowLogo===false) logoImg.style.display='none'; else logoImg.style.display='block';
        }
        const searchBox = document.querySelector('.search-box-modern');
        if(searchBox && settings.headerShowSearch===false) searchBox.style.display='none';
        const cartBtn = document.querySelector('[onclick*="cart.html"]');
        if(cartBtn && settings.headerShowCart===false) cartBtn.style.display='none';
        const scannerBtn = document.querySelector('.scanner-btn-inline');
        if(scannerBtn && settings.headerShowScanner===false) scannerBtn.style.display='none';
    }

    // Banner
    const bannerHeader = document.getElementById('mainHeaderBanner');
    if(bannerHeader){
        if(settings.bannerShow===false || settings.headerBannerType==='none'){ bannerHeader.style.display='none'; }
        else {
            bannerHeader.style.display='block';
            if(settings.headerBannerHeight) bannerHeader.style.height=settings.headerBannerHeight+'px';
            if(settings.bannerRounded) bannerHeader.style.borderRadius=settings.bannerRounded+'px';
        }
    }

    // Product - Apply via CSS variables
    const root = document.documentElement;
    if(settings.productGap!==undefined) root.style.setProperty('--product-gap', settings.productGap+'px');
    if(settings.productBorderRadius!==undefined) root.style.setProperty('--product-radius', settings.productBorderRadius+'px');
    if(settings.productPerRow) root.style.setProperty('--product-per-row', settings.productPerRow);
    if(settings.primaryColor) root.style.setProperty('--primary-color', settings.primaryColor);
    if(settings.secondaryColor) root.style.setProperty('--secondary-color', settings.secondaryColor);
    if(settings.accentColor) root.style.setProperty('--accent-color', settings.accentColor);
    if(settings.backgroundColor) document.body.style.background=settings.backgroundColor;
    if(settings.fontFamily) document.body.style.fontFamily=settings.fontFamily+', sans-serif';
    
    // Category
    const catRow = document.querySelector('.category-row');
    if(catRow && settings.categoryShow===false) catRow.style.display='none';
    
    // History
    const histSection = document.querySelector('.history-section');
    if(histSection){
        if(settings.historyShow===false) histSection.style.display='none';
        const hTitle = histSection.querySelector('h3');
        if(hTitle && settings.historyTitle) hTitle.textContent=settings.historyTitle;
    }
    
    // Ad
    const adSection = document.querySelector('.ad-product-section');
    if(adSection){
        if(settings.adShow===false) adSection.style.display='none';
        const adTitle = adSection.querySelector('h3');
        if(adTitle && settings.adTitle) adTitle.textContent=settings.adTitle;
    }
    
    // Nearby
    const nearbySection = document.querySelector('.nearby-product-section');
    if(nearbySection){
        if(settings.nearbyShow===false) nearbySection.style.display='none';
        const nTitle = nearbySection.querySelector('h3');
        if(nTitle && settings.nearbyTitle) nTitle.textContent=settings.nearbyTitle;
    }

    // Bottom Nav
    const bottomNav = document.querySelector('.bottom-nav');
    if(bottomNav){
        if(settings.bottomNavShow===false) bottomNav.style.display='none';
        else {
            bottomNav.style.display='flex';
            if(settings.bottomNavColor) bottomNav.style.background=settings.bottomNavColor;
            if(settings.bottomNavHeight) bottomNav.style.height=settings.bottomNavHeight+'px';
            if(settings.bottomNavTextColor) bottomNav.style.color=settings.bottomNavTextColor;
            if(settings.bottomNavRounded) { bottomNav.style.borderRadius='20px 20px 0 0'; }
        }
        // Center button style
        const centerHex = bottomNav.querySelector('.nav-center-hex');
        if(centerHex){
            if(settings.bottomNavCenterStyle==='circle') { centerHex.style.borderRadius='50%'; }
            else if(settings.bottomNavCenterStyle==='square') { centerHex.style.borderRadius='8px'; }
            else if(settings.bottomNavCenterStyle==='hex') { centerHex.style.borderRadius='16px'; }
        }
        // Buttons visibility
        if(settings.bottomNavButtons && Array.isArray(settings.bottomNavButtons)){
            settings.bottomNavButtons.forEach(btn=>{
                // Find button by label
                const allBtns = bottomNav.querySelectorAll('.nav-btn');
                // Simple hide/show based on order
                if(btn.visible===false){
                    const idx = btn.order-1;
                    if(allBtns[idx]) allBtns[idx].style.display='none';
                }
            });
        }
    }

    // Footer
    const footer = document.getElementById('dynamicFooter') || document.querySelector('.footer');
    if(footer){
        if(settings.footerShow===false) footer.style.display='none';
        else {
            footer.style.display='block';
            if(settings.footerColor) footer.style.background=settings.footerColor;
            if(settings.footerTextColor) footer.style.color=settings.footerTextColor;
            if(settings.footerHeight) footer.style.minHeight=settings.footerHeight+'px';
            if(settings.footerStyle==='minimal'){ footer.querySelector('.footer-container').style.display='none'; }
            else if(settings.footerStyle==='compact'){ footer.style.padding='20px'; }
            if(settings.footerAboutShow===false){ const aboutCol = footer.querySelector('.footer-col'); if(aboutCol) aboutCol.style.display='none'; }
        }
    }
}

// ===== ROLE HIERARCHY =====
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

// ===== PRODUCT CARD - ADMIN CONTROLLED SIZE & STYLE =====
function renderProductCard(product){
  const showCart = canShowAddToCartButton(product) && siteSettings.productShowAddCart!==false;
  const price = product.price || product.sellingPrice || 0;
  const mrp = product.mrp || product.originalPrice || 0;
  const off = mrp>price ? Math.round((1-price/mrp)*100) : 0;
  const name = product.name || product.title || 'Product';
  const img = product.thumbnail || product.image || (Array.isArray(product.images)?(product.images[0]?.url||product.images[0]):null) || '/assets/default-product.png';
  const shopName = product.shopName || product.shopType || '';
  if (!product.ownerRole) product.ownerRole = 'shop_owner';
  if (!product.ownerId) product.ownerId = product.shopId || product._id;
  if(!window._productMap) window._productMap = {};
  window._productMap[product._id] = product;
  const safeId = String(product._id).replace(/'/g,'');

  // Size from admin
  const sizeMap = { small: '70px', medium: '90px', large: '120px', xl: '160px' };
  const cardSize = sizeMap[siteSettings.productCardSize] || '90px';
  const borderRadius = (siteSettings.productBorderRadius||12) + 'px';
  const shadowMap = { none: 'none', small: '0 1px 3px rgba(0,0,0,0.1)', medium: '0 2px 8px rgba(0,0,0,0.08)', large: '0 8px 20px rgba(0,0,0,0.12)' };
  const shadow = shadowMap[siteSettings.productShadow] || shadowMap.medium;
  const showDiscount = siteSettings.productShowDiscount!==false;
  const showShop = siteSettings.productShowShopName!==false;

  // Style variations
  if(siteSettings.productCardStyle==='list'){
    return `
    <div class="nearby-product-card" data-product-id="${product._id}" onclick="openProduct('${safeId}')" style="display:flex;gap:12px;min-width:100%;background:#fff;border-radius:${borderRadius};padding:10px;box-shadow:${shadow};cursor:pointer">
      <img src="${img}" style="width:${cardSize};height:${cardSize};border-radius:8px;object-fit:cover">
      <div style="flex:1"><p style="font-size:14px;font-weight:800">${name}</p>${showShop?`<span style="font-size:11px;color:#888">${shopName}</span>`:''}<div style="display:flex;gap:6px;margin-top:4px"><span style="font-weight:900">₹${price}</span>${mrp>price?`<span style="font-size:11px;text-decoration:line-through;color:#94a3b8">₹${mrp}</span>`:''}</div>${showCart?`<button onclick="event.stopPropagation(); addToCartById('${safeId}')" style="margin-top:6px;padding:6px 12px;background:#0f172a;color:#fff;border:0;border-radius:8px;font-size:11px;font-weight:800">Add to Cart</button>`:''}</div>
      ${showDiscount&&off>0?`<span style="background:#16a34a;color:#fff;font-size:10px;font-weight:900;padding:3px 6px;border-radius:6px;height:fit-content">${off}%</span>`:''}
    </div>`;
  }

  // Default card
  return `
    <div class="nearby-product-card" data-product-id="${product._id}" onclick="openProduct('${safeId}')" style="min-width:${cardSize};background:#fff;border-radius:${borderRadius};padding:8px;box-shadow:${shadow};cursor:pointer;position:relative;flex-shrink:0">
      ${showDiscount&&off>0? `<span style="position:absolute;top:6px;left:6px;background:#16a34a;color:#fff;font-size:9px;font-weight:900;padding:2px 6px;border-radius:6px;z-index:2">${off}% OFF</span>`:''}
      <img src="${img}" loading="lazy" onerror="this.src='/assets/default-product.png'" style="width:100%;height:${cardSize};object-fit:contain;background:#fff;border-radius:8px">
      <p style="font-size:12px;font-weight:800;margin-top:6px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</p>
      ${showShop?`<span style="font-size:10px;color:#888;font-weight:700;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${shopName}</span>`:''}
      <div style="display:flex;align-items:center;gap:6px;margin-top:2px"><span style="font-size:13px;font-weight:900">₹${price}</span>${mrp>price? `<span style="font-size:10px;color:#94a3b8;text-decoration:line-through">₹${mrp}</span>`:''}</div>
      ${showCart?`<button onclick="event.stopPropagation(); addToCartById('${safeId}')" style="width:100%;margin-top:6px;padding:7px;background:#0f172a;color:#fff;border:0;border-radius:8px;font-size:11px;font-weight:800">Add to Cart</button>`:`<div style="margin-top:6px;padding:5px;background:#f1f5f9;border-radius:8px;font-size:9px;text-align:center;color:#64748b;font-weight:700">View Only</div>`}
    </div>`;
}

// ===== CART =====
window._productMap = window._productMap || {};
window.addToCartById = async function(productId){
  const product = window._productMap[productId] || allProducts.find(p=>p._id===productId);
  if(!product){ alert('Product not found - refresh karo'); return; }
  try{
    if(product.shopId){ localStorage.setItem('last_shopId', product.shopId); localStorage.setItem('last_supplierId', product.shopId); }
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
    } else { addToCartFallback(productId); }
  }catch(e){ console.error(e); alert('Cart error: '+e.message); }
};
window.addToCartFallback = function(id){ 
  const p = window._productMap[id] || allProducts.find(x=>x._id===id);
  if(p && window.CartCore){ localStorage.setItem('last_shopId', p.shopId||''); window.CartCore.add(p,1); }
  else { alert('Cart loading... dobara try karo'); }
};

document.addEventListener('DOMContentLoaded', initApp);

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

async function loadCurrentUser(){
  const token = localStorage.getItem('userToken') || localStorage.getItem('TOKEN') || localStorage.getItem('token');
  if(!token) return null;
  try{
    let res = await fetch('/api/common/profile/me', { headers: { 'Authorization': 'Bearer ' + token, 'x-buyer-id': localStorage.getItem('USER_ID')||'' } });
    let data = await res.json().catch(()=>({}));
    if(!data.success){
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
    try { await window.LocationManager.getManual(); await showUserLocationInHeader(); } catch(e) { console.log("Location/City error", e); }
    await loadAllData();
    if(window.CartCount) window.CartCount.update();
    loadUserProfilePic();
    
    // Listen for admin settings update
    window.addEventListener('storage', (e)=>{
        if(e.key==='settings_updated'){
            console.log('🔄 Admin settings updated - reloading');
            loadSettings();
        }
    });
}

async function loadSettings() {
    const res = await fetch('/api/settings/public?v='+Date.now()).catch(()=>({ok:false}));
    if(res.ok){
        siteSettings = await res.json();
        window.siteSettings = siteSettings;
        const logoImg = document.getElementById('headerLogoImg');
        if(logoImg) { logoImg.src = (siteSettings.headerLogoUrl || '/assets/images/samanlive-logo.png') + '?v=' + Date.now(); }
        const bannerHeader = document.getElementById('mainHeaderBanner');
        if(bannerHeader) {
            let finalUrl = ''; let isVideo = false;
            if(siteSettings.headerBannerActive === 'video' && siteSettings.headerBannerVideoUrl){ finalUrl = siteSettings.headerBannerVideoUrl; isVideo = true; }
            else if(siteSettings.headerBannerActive === 'image' && siteSettings.headerBannerImageUrl){ finalUrl = siteSettings.headerBannerImageUrl; isVideo = false; }
            else if(siteSettings.headerBannerActive==='none' || siteSettings.headerBannerType==='none'){ finalUrl=''; }
            else { finalUrl = siteSettings.headerBannerUrl || ''; isVideo = siteSettings.headerBannerType === 'video' || finalUrl.toLowerCase().includes('.mp4'); }
            if(finalUrl && finalUrl!== ''){
                if(isVideo){ bannerHeader.innerHTML = `<video src="${finalUrl}" autoplay ${siteSettings.bannerAutoPlay!==false?'muted loop':''} playsinline preload="auto" style="width:100%;height:100%;object-fit:cover;display:block"></video>`; }
                else { bannerHeader.innerHTML = `<img src="${finalUrl}?v=${Date.now()}" style="width:100%;height:100%;object-fit:cover;display:block">`; }
                bannerHeader.style.display = 'block';
                if(siteSettings.headerBannerHeight) bannerHeader.style.height = siteSettings.headerBannerHeight + 'px';
                if(siteSettings.bannerShowOverlay===false){ const ov = bannerHeader.querySelector('.banner-overlay'); if(ov) ov.style.display='none'; }
            } else {
                if(siteSettings.bannerShow===false || siteSettings.headerBannerActive==='none') bannerHeader.style.display='none';
            }
        }
        applyAdminSettings(siteSettings);
        renderFooter();
    } else {
        // Fallback to old /api/settings
        const res2 = await fetch('/api/settings').catch(()=>({ok:false}));
        if(res2.ok){ siteSettings = await res2.json(); applyAdminSettings(siteSettings); renderFooter(); }
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
    if(siteSettings.categoryShow===false){ container.parentElement.style.display='none'; return; }
    container.innerHTML = '';
    if(!window.SHOP_TEMPLATES) return;
    const size = siteSettings.categorySize||70;
    const style = siteSettings.categoryStyle||'chip';
    window.SHOP_TEMPLATES.forEach((shop, i) => {
        if(style==='circle'){
            container.innerHTML += `<div class="category-chip" style="min-width:${size}px;width:${size}px;height:${size}px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);padding:10px;display:flex;flex-direction:column;align-items:center;justify-content:center" onclick="filterShopsByType('${shop.id}')"><span style="font-size:26px">${shop.icon}</span></div>`;
        } else {
            container.innerHTML += `<div class="category-chip" style="min-width:${size}px" onclick="filterShopsByType('${shop.id}')"><span class="chip-icon">${shop.icon}</span><span class="chip-name">${i+1}</span></div>`;
        }
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
    if(siteSettings.historyShow===false){ container.parentElement.style.display='none'; return; }
    let history = JSON.parse(localStorage.getItem('productHistory') || '[]');
    const max = siteSettings.historyMaxItems||10;
    container.innerHTML = history.slice(0,max).map(p => `<div class="history-card" onclick="window.open('${p.url}')"><img src="${p.image}" onerror="this.src='/assets/default-product.png'"><p>${p.name}</p><span>₹${p.price}</span></div>`).join('') || '<p style="opacity:0.6">No History</p>';
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
    if(siteSettings.adShow===false){ container.parentElement.style.display='none'; return; }
    let url = '/api/admin/ads/active';
    if(userLocation) url += `?lat=${userLocation.lat}&lng=${userLocation.lng}`;
    const res = await fetch(url).catch(()=>({ok:false}));
    if(!res.ok){ container.innerHTML='<p>No Ads</p>'; return; }
    const data = await res.json();
    container.innerHTML = (data.ads||[]).map(ad => `<div class="ad-product-card" onclick="window.open('${ad.link}')"><img src="${ad.image}" onerror="this.style.display='none'"><div class="ad-info"><h4>${ad.title}</h4><p>${ad.shopName}</p></div></div>`).join('') || '<p>No Ads</p>';
}

async function reloadNearbyData(){ /* keep existing logic */ }

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
    
    if(!filteredProducts || filteredProducts.length === 0) { container.innerHTML = `<p>No products found</p>`; return; }

    // Apply admin scroll type
    const scrollType = siteSettings.productScrollType||'horizontal';
    const perRow = siteSettings.productPerRow||2;
    const gap = siteSettings.productGap||10;

    if(scrollType==='grid'){
        container.style.display='grid';
        container.style.gridTemplateColumns=`repeat(${perRow}, 1fr)`;
        container.style.gap=gap+'px';
        container.style.overflow='visible';
    } else if(scrollType==='vertical'){
        container.style.display='flex';
        container.style.flexDirection='column';
        container.style.gap=gap+'px';
    } else if(scrollType==='train'){
        container.style.display='flex';
        container.style.gap=gap+'px';
        container.style.overflowX='auto';
        container.style.animation=`trainMove ${siteSettings.productScrollSpeed||20}s linear infinite`;
    } else {
        // horizontal
        container.style.display='flex';
        container.style.gap=gap+'px';
        container.style.overflowX='auto';
    }

    container.innerHTML = filteredProducts.map(p=>renderProductCard(p)).join('');
}

function renderFooter(){
    if(!siteSettings.footerShow && siteSettings.footerShow!==undefined) return;
    const footerLogo = document.getElementById('footerLogo');
    if(footerLogo) footerLogo.textContent=siteSettings.appName||'SAMAN LIVE';
    const footerText = document.getElementById('footerText');
    if(footerText) footerText.textContent=siteSettings.footerText||'';
    const footerAbout = document.getElementById('footerAbout');
    if(footerAbout) footerAbout.textContent=siteSettings.footerAbout||'';
    const footerLinksList = document.getElementById('footerLinksList');
    if(footerLinksList && siteSettings.footerLinks){
        if(siteSettings.footerLinksShow===false) footerLinksList.parentElement.style.display='none';
        else footerLinksList.innerHTML=(siteSettings.footerLinks||[]).filter(l=>l.visible!==false).map(l=>`<li><a href="${l.url}">${l.text}</a></li>`).join('');
    }
    const footerSocial = document.getElementById('footerSocial');
    if(footerSocial){
        if(siteSettings.footerSocialShow===false) footerSocial.parentElement.style.display='none';
        else {
            let html='';
            if(siteSettings.facebook) html+=`<a href="${siteSettings.facebook}" target="_blank">📘</a>`;
            if(siteSettings.instagram) html+=`<a href="${siteSettings.instagram}" target="_blank">📸</a>`;
            if(siteSettings.twitter) html+=`<a href="${siteSettings.twitter}" target="_blank">🐦</a>`;
            if(siteSettings.youtube) html+=`<a href="${siteSettings.youtube}" target="_blank">▶️</a>`;
            if(siteSettings.whatsapp) html+=`<a href="https://wa.me/${siteSettings.whatsapp}" target="_blank">💬</a>`;
            footerSocial.innerHTML=html;
        }
    }
}

function loadUserProfilePic(){
    try{
        const pic = localStorage.getItem('userPic') || localStorage.getItem('USER_PIC') || '';
        const navPic = document.getElementById('navProfilePic');
        if(navPic && pic && pic.startsWith('http')) navPic.src=pic;
    }catch(e){}
}

window.openProduct = function(id){
    const p = window._productMap[id];
    if(p){ addToHistory({id:p._id,name:p.name,image:p.thumbnail||p.image,price:p.price,url:location.href}); }
    location.href='/shop-templates/common/products/product-detail.html?id='+id;
};
window.performSearch = function(){
    const q = document.getElementById('searchInput')?.value||'';
    if(!q.trim()) return;
    location.href='/nearby-shops.html?q='+encodeURIComponent(q);
};
window.goToProfilePage = function(){
    const token = localStorage.getItem('userToken');
    if(!token){ window._redirectAfterLogin='/profile.html'; if(window.openLoginModal) openLoginModal(); else location.href='/profile.html'; return; }
    location.href='/profile.html';
};
window.goToDelivery = function(){ location.href='/delivery-boy.html'; };
window.scrollToServices = function(){ document.querySelector('.category-row')?.scrollIntoView({behavior:'smooth'}); };
window.trackChild = function(){ alert('Track feature - coming soon'); };
window.openQRScanner = function(){ alert('Scanner - coming soon'); };