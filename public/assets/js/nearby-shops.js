// LOCATION: public/assets/js/nearby-shops.js - FINAL WITH REAL-TIME AREA ADS + LAST SHOP CACHE
let allServices = [];
let userLocation = null;
let currentAreaCode = null;
let areaAdsCache = [];

const LAST_SHOP_CACHE_KEY = 'last_nearby_shops_cache';

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
                // Agar 100 meter se zyada hila toh hi area check karo - SAME FEATURE
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

document.addEventListener('DOMContentLoaded', initNearby);

async function initNearby(){
    // 1. LAST TIME KI SHOP TURANT DIKHA DO - location ka wait mat karo
    try {
        const cached = JSON.parse(localStorage.getItem(LAST_SHOP_CACHE_KEY) || 'null');
        if(cached && cached.shops && cached.shops.length > 0){
            allServices = cached.shops;
            currentAreaCode = cached.areaCode || null;
            areaAdsCache = cached.ads || [];
            console.log('⚡ Last shops dikha diye cache se');
            renderNearbyShopsWithAds(areaAdsCache);
            if(currentAreaCode){
                const cityEl = document.getElementById('userCity');
                if(cityEl) cityEl.textContent = cached.cityText || currentAreaCode;
            }
        }
    } catch(e){}

    // 2. Background me location detect karo
    await window.LocationManager.getManual();
    await loadNearbyShops();
    showUserLocationInHeader();
    
    // REAL-TIME TRACKING START - CONTINUE DETECT
    window.LocationManager.watch(async (loc) => {
        console.log('📍 100m hila, background me update:', loc);
        await checkAreaAndUpdateAds(loc);
        // shop list ko bhi background me refresh karo par UI pehle se dikh raha hai
        await loadNearbyShops(true); 
    });
}

async function loadNearbyShops(isBackground = false) {
    let shopsData = [];
    if(userLocation) {
        const res = await fetch(`/api/shop-view/nearby-shops?lat=${userLocation.lat}&lng=${userLocation.lng}`, {cache: 'no-store'}).catch(()=>({ok:false}));
        if(res.ok) shopsData = (await res.json()).data || [];
    }
    if(shopsData.length === 0 && !isBackground) {
        const allRes = await fetch(`/api/shop-view/nearby-shops`, {cache: 'no-store'}).catch(()=>({ok:false}));
        if(allRes.ok) shopsData = (await allRes.json()).data || [];
    }
    if(shopsData.length === 0 && isBackground) return; // background me empty aaye to purani hi rehne do

    allServices = shopsData.map(shop => ({
        _id: String(shop.shopId || shop._id || shop.id),
        shopName: shop.shopName || shop.name || 'Shop',
        distance: shop.distance || 0,
        shopType: shop.shopType || 'general',
        template: shop.template || null,
        logo: shop.logo || '/assets/default-shop.png',
        banner: null,
        isOpen: shop.isOpen ?? true
    }));

    if(typeof ShopBannerExt !== 'undefined'){
        await ShopBannerExt.loadBannersForMainApp(allServices);
    }
    await checkAreaAndUpdateAds(userLocation);

    // Cache me save kar do agli baar turant dikhane ke liye
    try {
        localStorage.setItem(LAST_SHOP_CACHE_KEY, JSON.stringify({
            shops: allServices,
            ads: areaAdsCache,
            areaCode: currentAreaCode,
            cityText: document.getElementById('userCity')?.textContent || '',
            time: Date.now()
        }));
    } catch(e){}
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
            if(!area.centerLat || !area.centerLng) return;
            const dist = getDistance(loc.lat, loc.lng, area.centerLat, area.centerLng);
            if(dist <= (area.radius || 50) && dist < minDist){
                minDist = dist;
                foundArea = area;
            }
        });

        if(foundArea){
            if(currentAreaCode !== foundArea.areaCode){
                console.log(`📍 Area Changed: ${currentAreaCode} -> ${foundArea.areaCode}`);
                currentAreaCode = foundArea.areaCode;
                const contentRes = await fetch(`/api/content?areaCode=${foundArea.areaCode}`, {cache: 'no-store'}).then(r=>r.json()).catch(()=>[]);
                areaAdsCache = contentRes.filter(c => c.type === 'ad' && c.status === 'active');
                const cityEl = document.getElementById('userCity');
                if(cityEl) cityEl.textContent = `${foundArea.city} (${foundArea.areaCode})`;
            }
        } else {
            // Area nahi mila to purana wala hi rehne do, clear mat karo
            // currentAreaCode = null;
            // areaAdsCache = [];
        }
        renderNearbyShopsWithAds(areaAdsCache);
    } catch(err){
        console.error(err);
        if(allServices.length > 0) renderNearbyShopsWithAds(areaAdsCache);
        else renderNearbyShopsWithAds([]);
    }
}

function renderNearbyShopsWithAds(areaAds = areaAdsCache){
    const container = document.getElementById('nearbyShopsGrid');
    if (!container) return;
    
    if(allServices.length === 0){
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🏪</div><h3>Aas paas koi shop nahi mili</h3></div>`;
        return;
    }

    container.innerHTML = '';
    const userViewTemplates = ['kirana', 'medical', 'restaurant'];

    allServices.forEach((shop, index) => {
        const template = (shop.template || shop.shopType || 'common').toLowerCase().trim();
        const fileName = userViewTemplates.includes(template)? 'user-view.html' : 'customer-view.html';
        const customerUrl = `/shop-templates/${template}/${fileName}?shopId=${shop._id}`;
        const distanceKm = shop.distance? (shop.distance/1000).toFixed(1) : null;
        const isOpen = shop.isOpen;
        const statusClass = isOpen ? '' : 'closed';
        const shopCardClass = isOpen ? '' : 'closed-shop';
        const statusText = isOpen ? '🟢 Open' : '🔴 Closed';
        const clickAction = isOpen ? `window.location.href='${customerUrl}'` : `alert('${shop.shopName} abhi band hai 🔴')`;

        container.innerHTML += `
        <div class="shop-circle ${shopCardClass}" onclick="${clickAction}">
            <div class="status-dot ${statusClass}"></div>
            ${shop.banner? `<img src="${shop.banner}" class="shop-banner-top" onerror="this.style.display='none'">` : ''}
            <img src="${shop.logo}" class="shop-logo-circle" onerror="this.src='/assets/default-shop.png'">
            <p>${shop.shopName}</p>
            <small style="font-weight:700; color:${isOpen ? '#16a34a' : '#dc2626'}">${statusText}</small>
            ${distanceKm? `<small>${distanceKm}Km</small>` : ''}
        </div>`;

        if((index + 1) % 6 === 0){
            const adIndex = Math.floor(index/6) % (areaAds.length || 1);
            const ad = areaAds[adIndex];
            if(ad){
                container.innerHTML += `
                <div class="ad-full-width" style="background:${ad.color || '#3b82f6'}; color:white; padding:16px; border-radius:12px; text-align:center; grid-column:1/-1;">
                    <h3 style="margin:0;">${ad.title}</h3>
                    <p style="margin:8px 0; opacity:0.9;">${ad.description || ''}</p>
                    ${ad.buttonText ? `<button class="ad-btn" onclick="window.open('${ad.buttonLink || '#'}','_blank')" style="background:white;color:${ad.color};border:none;padding:8px 16px;border-radius:20px;font-weight:700;">${ad.buttonText}</button>` : ''}
                    <small style="display:block;margin-top:6px;opacity:0.7;">📍 ${currentAreaCode}</small>
                </div>`;
            } else {
                container.innerHTML += `
                <div class="ad-full-width">
                    <h3>📢 ${currentAreaCode ? currentAreaCode+' me Ad nahi hai' : 'Advertisement'}</h3>
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
        if(el && !currentAreaCode) el.textContent = 'Location Off';
        return;
    }
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}`)
    .then(r => r.json())
    .then(data => {
        const el = document.getElementById('userCity');
        if(el && !currentAreaCode) el.textContent = data.address.city || 'Your Area';
    }).catch(()=>{
        const el = document.getElementById('userCity');
        if(el && !currentAreaCode) el.textContent = 'Your Area';
    });
}