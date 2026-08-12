let allServices = [];
let userLocation = null;

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
    }
};

document.addEventListener('DOMContentLoaded', initNearby);

async function initNearby(){
    await window.LocationManager.getManual();
    await loadNearbyShops();
    showUserLocationInHeader();
}

async function loadNearbyShops() {
    let shopsData = [];
    if(userLocation) {
        const res = await fetch(`/api/shop-view/nearby-shops?lat=${userLocation.lat}&lng=${userLocation.lng}`).catch(()=>({ok:false}));
        if(res.ok) shopsData = (await res.json()).data || [];
    }
    if(shopsData.length === 0) {
        const allRes = await fetch(`/api/shop-view/nearby-shops`).catch(()=>({ok:false}));
        if(allRes.ok) shopsData = (await allRes.json()).data || [];
    }

    allServices = shopsData.map(shop => ({
        _id: String(shop.shopId || shop._id || shop.id),
        shopName: shop.shopName || shop.name || 'Shop',
        distance: shop.distance || 0,
        shopType: shop.shopType || 'general',
        template: shop.template || null,
        logo: shop.logo || '/assets/default-shop.png',
        banner: null
    }));

    if(typeof ShopBannerExt !== 'undefined'){
        await ShopBannerExt.loadBannersForMainApp(allServices);
    }
    renderNearbyShopsWithAds();
}

function renderNearbyShopsWithAds(){
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

        container.innerHTML += `
        <div class="shop-circle" onclick="window.location.href='${customerUrl}'">
            <div class="status-dot"></div>
            ${shop.banner? `<img src="${shop.banner}" class="shop-banner-top" onerror="this.style.display='none'">` : ''}
            <img src="${shop.logo}" class="shop-logo-circle" onerror="this.src='/assets/default-shop.png'">
            <p>${shop.shopName}</p>
            ${distanceKm? `<small>${distanceKm}Km</small>` : ''}
        </div>`;

        // HAR 6 SHOP = 2 ROW BAAD AD
        if((index + 1) % 6 === 0){
            container.innerHTML += `
            <div class="ad-full-width">
                <h3>📢 Advertisement</h3>
                <p>Apna ad yaha lagwaye</p>
                <button class="ad-btn" onclick="alert('Contact Admin')">Contact Now</button>
            </div>`;
        }
    });
}

function showUserLocationInHeader() {
    if (!userLocation) {
        document.getElementById('userCity').textContent = 'Location Off';
        return;
    }
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}`)
    .then(r => r.json())
    .then(data => {
        document.getElementById('userCity').textContent = data.address.city || 'Your Area';
    }).catch(()=>{ document.getElementById('userCity').textContent = 'Your Area'; });
}