// LOCATION: public/assets/js/nearby-shops.js - FINAL WITH REAL-TIME AREA ADS + LAST SHOP CACHE + FACILITIES
let allServices = [];
let filteredServices = [];
let userLocation = null;
let currentAreaCode = null;
let areaAdsCache = [];
let currentFilter = 'all';

const LAST_SHOP_CACHE_KEY = 'last_nearby_shops_cache';
const FAV_KEY = 'fav_shops';

// LOCATION
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
    watch: function(callback){
        if(!navigator.geolocation) return;
        navigator.geolocation.watchPosition(
            (pos) => {
                const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                if(!userLocation || getDistance(userLocation.lat, userLocation.lng, newLoc.lat, newLoc.lng) > 0.1){
                    userLocation = newLoc;
                    callback(newLoc);
                }
            },
            ()=>{},
            { enableHighAccuracy: true, maximumAge: 10000 }
        );
    }
};

function getDistance(lat1, lon1, lat2, lon2){
    const R = 6371;
    const dLat = (lat2-lat1) * Math.PI/180;
    const dLon = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function getWalkingTime(distKm){
    if(!distKm) return '';
    const mins = Math.round(distKm * 12); // 5km/h avg
    if(mins < 1) return '1 min walk';
    return `${mins} min walk`;
}

document.addEventListener('DOMContentLoaded', initNearby);

async function initNearby(){
    // 1. LAST TIME KI SHOP TURANT DIKHA DO
    try {
        const cached = JSON.parse(localStorage.getItem(LAST_SHOP_CACHE_KEY) || 'null');
        if(cached && cached.shops && cached.shops.length > 0){
            allServices = cached.shops;
            filteredServices = [...allServices];
            currentAreaCode = cached.areaCode || null;
            areaAdsCache = cached.ads || [];
            console.log('⚡ Last shops cache se');
            renderNearbyShopsWithAds(areaAdsCache);
            if(currentAreaCode){
                const cityEl = document.getElementById('userCity');
                if(cityEl) cityEl.textContent = cached.cityText || currentAreaCode;
            }
        }
    } catch(e){}

    // 2. Background me location
    await window.LocationManager.getManual();
    await loadNearbyShops();
    showUserLocationInHeader();

    window.LocationManager.watch(async (loc) => {
        console.log('📍 100m hila, update:', loc);
        await checkAreaAndUpdateAds(loc);
        await loadNearbyShops(true);
    });
}

async function loadNearbyShops(isBackground = false) {
    let shopsData = [];
    if(userLocation) {
        const res = await fetch(`/api/shop-view/nearby-shops?lat=${userLocation.lat}&lng=${userLocation.lng}`, {cache: 'no-store'}).catch(()=>({ok:false}));
        if(res.ok) shopsData = (await res.json()).data || [];
    }
    if(shopsData.length === 0 &&!isBackground) {
        const allRes = await fetch(`/api/shop-view/nearby-shops`, {cache: 'no-store'}).catch(()=>({ok:false}));
        if(allRes.ok) shopsData = (await allRes.json()).data || [];
    }
    if(shopsData.length === 0 && isBackground) return;

    allServices = shopsData.map(shop => ({
        _id: String(shop.shopId || shop._id || shop.id),
        shopName: shop.shopName || shop.name || 'Shop',
        distance: shop.distance || 0,
        shopType: shop.shopType || 'general',
        template: shop.template || null,
        logo: shop.logo || '/assets/default-shop.png',
        banner: shop.banner || null,
        isOpen: shop.isOpen?? true,
        phone: shop.phone || shop.mobile || '',
        lat: shop.lat || shop.latitude || null,
        lng: shop.lng || shop.longitude || null,
        hasOffer: shop.hasOffer || shop.offer || false,
        offerText: shop.offerText || '🔥 Offer',
        productCount: shop.productCount || 0
    }));

    filteredServices = [...allServices];

    if(typeof ShopBannerExt!== 'undefined'){
        await ShopBannerExt.loadBannersForMainApp(allServices);
    }
    await checkAreaAndUpdateAds(userLocation);

    try {
        localStorage.setItem(LAST_SHOP_CACHE_KEY, JSON.stringify({
            shops: allServices,
            ads: areaAdsCache,
            areaCode: currentAreaCode,
            cityText: document.getElementById('userCity')?.textContent || '',
            time: Date.now()
        }));
    } catch(e){}

    applyFilter();
}

async function checkAreaAndUpdateAds(loc){
    if(!loc) {
        if(allServices.length === 0) renderNearbyShopsWithAds([]);
        return;
    }
    try {
        const areasRes = await fetch(`/api/areas`, {cache: 'no-store'}).then(r=>r.json()).catch(()=>[]);
        let foundArea = null;
        let minDist = Infinity;
        areasRes.forEach(area => {
            if(!area.centerLat ||!area.centerLng) return;
            const dist = getDistance(loc.lat, loc.lng, area.centerLat, area.centerLng);
            if(dist <= (area.radius || 50) && dist < minDist){
                minDist = dist;
                foundArea = area;
            }
        });

        if(foundArea){
            if(currentAreaCode!== foundArea.areaCode){
                console.log(`📍 Area Changed: ${currentAreaCode} -> ${foundArea.areaCode}`);
                currentAreaCode = foundArea.areaCode;
                const contentRes = await fetch(`/api/content?areaCode=${foundArea.areaCode}`, {cache: 'no-store'}).then(r=>r.json()).catch(()=>[]);
                areaAdsCache = contentRes.filter(c => c.type === 'ad' && c.status === 'active');
                const cityEl = document.getElementById('userCity');
                if(cityEl) cityEl.textContent = `${foundArea.city} (${foundArea.areaCode})`;
            }
        }
        renderNearbyShopsWithAds(areaAdsCache);
    } catch(err){
        console.error(err);
        if(allServices.length > 0) renderNearbyShopsWithAds(areaAdsCache);
        else renderNearbyShopsWithAds([]);
    }
}

// ========== NEW FACILITY: FILTERS ==========
function setFilter(type){
    currentFilter = type;
    document.querySelectorAll('.filter-chips.chip').forEach(b=>b.classList.remove('active'));
    const activeBtn = document.querySelector(`.filter-chips.chip[onclick="setFilter('${type}')"]`);
    if(activeBtn) activeBtn.classList.add('active');
    applyFilter();
}

function applyFilter(){
    const favs = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
    if(currentFilter === 'open'){
        filteredServices = allServices.filter(s=>s.isOpen);
    } else if(currentFilter === 'near'){
        filteredServices = allServices.filter(s=> (s.distance/1000) <= 1);
    } else if(currentFilter === 'offer'){
        filteredServices = allServices.filter(s=>s.hasOffer);
    } else if(currentFilter === 'fav'){
        filteredServices = allServices.filter(s=>favs.includes(s._id));
    } else {
        filteredServices = [...allServices];
    }
    renderNearbyShopsWithAds(areaAdsCache);
}

// ========== NEW FACILITY: FAV, CALL, DIRECTION ==========
function toggleWishlist(shopId){
    let favs = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
    if(favs.includes(shopId)){
        favs = favs.filter(id=>id!==shopId);
        alert('❌ Fav se hataya');
    } else {
        favs.push(shopId);
        alert('❤️ Fav me joda');
    }
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    renderNearbyShopsWithAds(areaAdsCache);
}

function callShop(phone){
    if(!phone) return alert('Number nahi hai');
    window.open(`tel:${phone}`, '_self');
}

function openMap(lat,lng){
    if(!lat ||!lng) return alert('Location nahi hai');
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
}

function renderNearbyShopsWithAds(areaAds = areaAdsCache){
    const container = document.getElementById('nearbyShopsGrid');
    if (!container) return;

    const list = filteredServices.length? filteredServices : allServices;

    if(list.length === 0){
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🏪</div><h3>Aas paas koi shop nahi mili</h3><p>Filter: ${currentFilter}</p></div>`;
        return;
    }

    container.innerHTML = '';
    const userViewTemplates = ['kirana', 'medical', 'restaurant'];
    const favs = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');

    list.forEach((shop, index) => {
        const template = (shop.template || shop.shopType || 'common').toLowerCase().trim();
        const fileName = userViewTemplates.includes(template)? 'user-view.html' : 'customer-view.html';
        const customerUrl = `/shop-templates/${template}/${fileName}?shopId=${shop._id}`;
        const distanceKm = shop.distance? (shop.distance/1000).toFixed(1) : null;
        const isOpen = shop.isOpen;
        const statusClass = isOpen? '' : 'closed';
        const shopCardClass = isOpen? '' : 'closed-shop';
        const statusText = isOpen? '🟢 Open' : '🔴 Closed';
        const clickAction = isOpen? `window.location.href='${customerUrl}'` : `alert('${shop.shopName} abhi band hai 🔴')`;
        const isFav = favs.includes(shop._id);

        container.innerHTML += `
        <div class="shop-circle ${shopCardClass}" onclick="${clickAction}">
            <div class="status-dot ${statusClass}"></div>
            ${shop.hasOffer? `<div class="offer-badge">${shop.offerText}</div>` : ''}
            ${shop.banner? `<img src="${shop.banner}" class="shop-banner-top" onerror="this.style.display='none'">` : ''}
            <img src="${shop.logo}" class="shop-logo-circle" onerror="this.src='/assets/default-shop.png'">
            <p>${shop.shopName}</p>
            <small style="font-weight:700; color:${isOpen? '#16a34a' : '#dc2626'}">${statusText}</small>
            ${distanceKm? `<small>${distanceKm}Km • ${getWalkingTime(parseFloat(distanceKm))}</small>` : ''}
            ${shop.productCount? `<small style="opacity:0.7">${shop.productCount} items</small>` : ''}

            <!-- NEW QUICK ACTIONS -->
            <div class="quick-actions" style="display:flex;gap:6px;margin-top:6px;justify-content:center" onclick="event.stopPropagation()">
                <button style="padding:4px 8px;border-radius:12px;border:1px solid #ddd;background:white" onclick="callShop('${shop.phone}')">📞</button>
                <button style="padding:4px 8px;border-radius:12px;border:1px solid #ddd;background:white" onclick="openMap(${shop.lat},${shop.lng})">📍</button>
                <button style="padding:4px 8px;border-radius:12px;border:1px solid #ddd;background:${isFav?'#fee2e2':'white'}" onclick="toggleWishlist('${shop._id}')">${isFav?'❤️':'🤍'}</button>
            </div>
        </div>`;

        if((index + 1) % 6 === 0){
            const adIndex = Math.floor(index/6) % (areaAds.length || 1);
            const ad = areaAds[adIndex];
            if(ad){
                container.innerHTML += `
                <div class="ad-full-width" style="background:${ad.color || '#3b82f6'}; color:white; padding:16px; border-radius:12px; text-align:center; grid-column:1/-1;">
                    <h3 style="margin:0;">${ad.title}</h3>
                    <p style="margin:8px 0; opacity:0.9;">${ad.description || ''}</p>
                    ${ad.buttonText? `<button class="ad-btn" onclick="window.open('${ad.buttonLink || '#'}','_blank')" style="background:white;color:${ad.color};border:none;padding:8px 16px;border-radius:20px;font-weight:700;">${ad.buttonText}</button>` : ''}
                    <small style="display:block;margin-top:6px;opacity:0.7;">📍 ${currentAreaCode}</small>
                </div>`;
            } else {
                container.innerHTML += `
                <div class="ad-full-width">
                    <h3>📢 ${currentAreaCode? currentAreaCode+' me Ad nahi hai' : 'Advertisement'}</h3>
                    <p>Apna ad yaha lagwaye</p>
                    <button class="ad-btn" onclick="alert('Contact Admin')">Contact Now</button>
                </div>`;
            }
        }
    });
}

function showUserLocationInHeader() {
    if (!userLocation) {
        const el = document.getElementById('userCity');
        if(el &&!currentAreaCode) el.textContent = 'Location Off';
        return;
    }
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}`)
   .then(r => r.json())
   .then(data => {
        const el = document.getElementById('userCity');
        if(el &&!currentAreaCode) el.textContent = data.address.city || 'Your Area';
    }).catch(()=>{
        const el = document.getElementById('userCity');
        if(el &&!currentAreaCode) el.textContent = 'Your Area';
    });
}