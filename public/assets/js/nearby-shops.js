let allServices = [];
let userLocation = null;
let lastFetchedLocation = null;

// TERA PURANA LOCATION MANAGER - COPY KIYA
window.LocationManager = {
    updateInterval: 30000,
    isRequesting: false,
    minDistance: 100,

    getManual: function() {
        return new Promise((resolve) => {
            if(!navigator.geolocation) { resolve(null); return; }
            this.isRequesting = true;
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                    userLocation = loc;
                    lastFetchedLocation = {...loc};
                    this.isRequesting = false;
                    await this.sendLocationToServer(loc);
                    resolve(loc);
                },
                (error) => {
                    console.log('Location Error:', error.message);
                    this.isRequesting = false;
                    resolve(null);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    },

    sendLocationToServer: async function(loc) {
        const userId = localStorage.getItem('userId');
        if(!userId) return;
        try{
            await fetch('/api/location/user', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ userId, lat: loc.lat, lng: loc.lng })
            });
        }catch(e){ console.log('Location save error', e) }
    }
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

document.addEventListener('DOMContentLoaded', initNearby);

async function initNearby(){
    await window.LocationManager.getManual(); // YAHI SE LOCATION AAYEGI
    await loadNearbyShops();
    showUserLocationInHeader();
}

async function loadNearbyShops() {
    let shopsData = [];
    console.log("📍 Current Location:", userLocation);

    if(userLocation) {
        const res = await fetch(`/api/shop-view/nearby-shops?lat=${userLocation.lat}&lng=${userLocation.lng}`).catch(()=>({ok:false}));
        if(res.ok) {
            const data = await res.json();
            shopsData = data.data || data || [];
        }
        
        // NA MILE TO SAB DIKHA DE - TERE PURANE WALA LOGIC
        if(shopsData.length === 0) {
            console.log("⚠️ Nearby 0. Loading ALL Shops");
            const allRes = await fetch(`/api/shop-view/nearby-shops`).catch(()=>({ok:false}));
            if(allRes.ok) shopsData = (await allRes.json()).data || [];
        }
    } else {
        console.log("🌍 Location nahi mili. Loading ALL Shops");
        const allRes = await fetch(`/api/shop-view/nearby-shops`).catch(()=>({ok:false}));
        if(allRes.ok) shopsData = (await allRes.json()).data || [];
    }

    console.log("SHOPS COUNT:", shopsData.length);
    
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
        container.innerHTML = `<div style="text-align:center;padding:40px;"><h3>😔 Aas paas koi shop nahi mili</h3></div>`;
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

        // HAR 2 ROW = 6 SHOP BAAD AD
        if((index + 1) % 6 === 0){
            container.innerHTML += `
            <div class="ad-product-card" style="grid-column: 1 / -1; background: linear-gradient(135deg,#ff9900,#ff5500); color:#fff; text-align:center; padding:20px; border-radius:12px;">
                <h3>📢 Advertisement</h3>
                <p>Apna ad yaha lagwaye - Contact Admin</p>
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
        document.getElementById('userCity').textContent = data.address.city || data.address.town || 'Your Area';
    }).catch(()=>{
        document.getElementById('userCity').textContent = 'Your Area';
    });
}