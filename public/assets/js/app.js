// ========================================
// SAMANLIVE - BLACKBOARD LAYOUT V4 - FINAL
// ========================================
let allModules = [], allAds = [], allServices = [], nearbyVideos = [], allCampaigns = [];
let siteSettings = {}, userLocation = null, allProducts = [];
let originalServices = [], originalProducts = [];

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    await loadSettings(); // 1. PEHLE SETTINGS LOAD
    await getUserLocation(); // 2. FIR LOCATION LE
}

// 1. BANNER ADMIN SE
async function loadSettings() {
    const res = await fetch('/api/settings').catch(()=>({ok:false}));
    if(res.ok){ 
        siteSettings = await res.json();
        
        const bannerImg = document.getElementById('headerBannerImg');
        const bannerHeader = document.getElementById('mainHeaderBanner');
        
        if(bannerImg && siteSettings.headerBannerUrl && siteSettings.headerBannerUrl !== '') {
            bannerImg.src = siteSettings.headerBannerUrl; // ADMIN WALA BANNER
            if(bannerHeader) bannerHeader.style.display = 'block';
        } else {
            if(bannerHeader) bannerHeader.style.display = 'none'; // NA HO TO CHUPA DE
        }
        if(bannerHeader && siteSettings.headerBannerHeight) {
            bannerHeader.style.height = siteSettings.headerBannerHeight + 'px';
        }
    }
}

// 2. LOCATION MANAGER - PURA DEFINE KIYA HUA
window.LocationManager = {
    onLocationUpdate: null
};

async function getUserLocation() {
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(async (pos) => {
            userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            
            // CITY NAME SET KARO
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}`);
                const d = await res.json();
                document.getElementById('userCity').textContent = d.address.city || d.address.town || d.address.district || 'Your Area';
            } catch(e){}

            // LOCATION MILNE KE BAAD HI YE SAB CHALAO
            renderCategoryChips();
            renderHistoryProducts();
            renderAdminAds();
            await reloadNearbyData();
            renderNearbyProductsRepeat();
            loadUserProfilePic();

            // AGAR KOI AUR JAGAH LOCATION UPDATE CHAHIYE
            if(window.LocationManager.onLocationUpdate){
                window.LocationManager.onLocationUpdate(userLocation);
            }

        }, (err) => {
            console.log("Location Error", err);
            document.getElementById('userCity').textContent = 'Location Off';
            // LOCATION NA MILE TO BHI BAQI LOAD KAR DO
            renderCategoryChips();
            renderHistoryProducts();
            loadUserProfilePic();
        });
    } else {
        document.getElementById('userCity').textContent = 'Location Not Supported';
        renderCategoryChips();
        renderHistoryProducts();
        loadUserProfilePic();
    }
}

// 3. CATEGORY CHIPS - SHOP_TEMPLATE_MAP SE SABHI SHOP
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

// 4. HISTORY PRODUCT
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

// 5. ADMIN ADVERTISEMENT
async function renderAdminAds() {
    const container = document.getElementById('adminAdContainer'); if(!container) return;
    if(!userLocation) { container.innerHTML='<p>Location on karo</p>'; return; }
    const res = await fetch('/api/admin/ads/active?area='+userLocation.city).catch(()=>({ok:false}));
    if(!res.ok){ container.innerHTML='<p>No Ads</p>'; return; }
    const data = await res.json();
    container.innerHTML = (data.ads||[]).map(ad => `
        <div class="ad-product-card" onclick="window.open('${ad.link}')">
            <img src="${ad.image}" onerror="this.style.display='none'"><div class="ad-info"><h4>${ad.title}</h4><p>${ad.shopName}</p></div>
        </div>`).join('') || '<p>No Ads</p>';
}

// 6. NEARBY PRODUCTS REPEAT
async function renderNearbyProductsRepeat() {
    const container = document.getElementById('nearbyProductsRepeat'); 
    if(!container) return;
    if(!userLocation){
        container.innerHTML = '<p>Location on karo products dikhane ke liye</p>';
        return;
    }

    const res = await fetch(`/api/products/admin/all?limit=20&lat=${userLocation.lat}&lng=${userLocation.lng}`).catch(()=>({ok:false}));
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