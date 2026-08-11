let allServices = [];
let userLocation = null;

document.addEventListener('DOMContentLoaded', initNearby);

async function initNearby(){
    await getUserLocation();
    await loadNearbyShops();
    showUserLocationInHeader();
}

async function getUserLocation() {
    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (pos) => { userLocation = {lat: pos.coords.latitude, lng: pos.coords.longitude}; resolve(); },
            () => { resolve(); }
        );
    });
}

async function loadNearbyShops() {
    let shopsData = [];
    if(userLocation) {
        const res = await fetch(`/api/shop-view/nearby-shops?lat=${userLocation.lat}&lng=${userLocation.lng}`);
        if(res.ok) shopsData = (await res.json()).data || [];
    }
    if(shopsData.length === 0) {
        const res = await fetch(`/api/shop-view/nearby-shops`);
        if(res.ok) shopsData = (await res.json()).data || [];
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

    await ShopBannerExt.loadBannersForMainApp(allServices);
    renderNearbyShopsWithAds();
}

function renderNearbyShopsWithAds(){
    const container = document.getElementById('nearbyShopsGrid');
    if (!container) return;
    
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

        // HAR 2 ROW BAAD AD - 3 shop = 1 row, to har 6 shop baad ad
        if((index + 1) % 6 === 0){
            container.innerHTML += `
            <div class="ad-product-card" style="grid-column: 1 / -1; background: linear-gradient(135deg,#ff9900,#ff5500); color:#fff; text-align:center;">
                <h3>Advertisement</h3>
                <p>Apna ad yaha lagwaye</p>
                <button class="ad-btn">Contact Admin</button>
            </div>`;
        }
    });
}

function showUserLocationInHeader() {
    if (!userLocation) return;
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}`)
    .then(r => r.json())
    .then(data => {
        document.getElementById('userCity').textContent = data.address.city || 'Your Area';
    });
}