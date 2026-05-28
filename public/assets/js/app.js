// ==========================================
// 1. DATA INITIALIZATION (MOCK DATA)
// ==========================================

// --- TOTAL 50 ADS/OFFERS DATA ---
// Mobile maps 4 items per slide, Laptop maps 10 items per slide natively
const allAds = [];
const adColors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#6366f1", "#14b8a6"];
const adImages = [
    "https://unsplash.com",
    "https://unsplash.com",
    "https://unsplash.com",
    "https://unsplash.com"
];

for (let i = 0; i < 50; i++) {
    allAds.push({
        title: `Mega Offer ${i + 1}`,
        desc: `${40 + (i % 6) * 10}% Upto OFF`,
        btn: "Grab Now",
        color: adColors[i % adColors.length],
        image: adImages[i % adImages.length]
    });
}

// --- TOTAL 52 SERVICES / MODULES DATA ---
const rawModuleNames = [
    "Education", "Health", "Kids Area", "Gaming", "Music Lounge", "Books Store", "Shopping", "Food Delivery", 
    "Travel Hub", "Real Estate", "Job Search", "Automotive", "Finance", "Net Banking", "Stock Market", "Online Payments", 
    "Movies", "TV Shows", "Art Gallery", "Photography", "Creative Writing", "Theater", "Fitness Gym", "Yoga Center", 
    "Sports Club", "Football", "Basketball", "Tennis Court", "Swimming", "Cycling Track", "Mountain Climbing", "Skiing Resort", 
    "Surfing Club", "Fishing Spot", "Camping Site", "Gardening", "Pet Shop", "Cat Care", "Bird Sanctuary", "Aquarium Fish", 
    "Butterfly Park", "Flower Nursery", "Tree Plantation", "Night Life", "Weather Forecast", "Rainbow Events", "Star Gazing", 
    "Earth Explorer", "Space Research", "UFO Tracking", "Robot Tech", "Target Agency"
];

const moduleImageKeywords = [
    "education", "healthcare", "kids", "gaming", "music", "books", "fashion", "food",
    "travel", "house", "office", "car", "money", "bank", "chart", "wallet",
    "cinema", "tv", "art", "camera", "pen", "theater", "gym", "yoga",
    "stadium", "football", "basketball", "tennis", "swim", "bicycle", "mountain", "ski",
    "surf", "fish", "camp", "garden", "pets", "cat", "bird", "aquarium",
    "butterfly", "flower", "tree", "bar", "weather", "rainbow", "stars",
    "earth", "space", "robot", "cyberpunk", "target"
];

const allModules = [];
for (let i = 0; i < 52; i++) {
    const idx = i % rawModuleNames.length;
    allModules.push({
        name: rawModuleNames[idx],
        image: `https://unsplash.com` || `https://unsplash.com{moduleImageKeywords[idx]}`,
        link: `/modules/${rawModuleNames[idx].toLowerCase().replace(/\s+/g, '-')}-${i}`
    });
}

// --- NEARBY SHOPS DATA (8 items for loop array) ---
const shopNames = ["Star Bakery", "Apex Pharmacy", "Kids Joy", "Pixel Gaming", "Tune Music", "Novel Books", "Trend Mart", "Desi Food"];
const shopKeywords = ["bakery", "pharmacy", "toys", "arcade", "instruments", "bookstore", "boutique", "restaurant"];
const nearbyShops = [];
for (let i = 0; i < 24; i++) {
    const idx = i % shopNames.length;
    nearbyShops.push({
        name: shopNames[idx],
        image: `https://unsplash.com` // Premium generic retail store UI
    });
}

// --- 3 REAL HIGH-QUALITY VIDEO LINKS (REPLACING ANIMATION) ---
const nearbyVideos = [
    { title: "SamanLive Shop Tour", url: "https://mixkit.co" },
    { title: "Best Festive Deals", url: "https://mixkit.co" },
    { title: "Exclusive New Arrivals", url: "https://mixkit.co" }
];

// --- CAMPAIGN OFFERS (GOL MODULES WITH BACKGROUNDS) ---
const allCampaigns = [];
for (let i = 0; i < 20; i++) {
    allCampaigns.push({
        title: `Campaign ${i + 1}`,
        desc: `Join Now`,
        btn: "Enter",
        image: `https://unsplash.com`
    });
}


// ==========================================
// 2. RENDERING CORE ENGINE
// ==========================================

function getItemsPerSlide() {
    return window.innerWidth <= 768 ? { ads: 4, nearby: 4, campaigns: 4 } : { ads: 10, nearby: 8, campaigns: 6 };
}

// --- 52 MODULES ENGINE ---
function renderModules() {
    const grid = document.getElementById('serviceGrid');
    if (!grid) return;
    grid.innerHTML = allModules.map((module, idx) => `
        <div class="service-item" style="animation-delay: ${idx * 0.01}s">
            <a href="${module.link}">
                <div class="service-icon" style="background-image: url('${module.image}'); background-size: cover; background-position: center;"></div>
                <p>${module.name}</p>
            </a>
        </div>
    `).join('');
}

// --- DYNAMIC AD SLIDER ---
function renderAds() {
    const container = document.getElementById('topAdsContainer');
    if (!container) return;
    const itemsPerSlide = getItemsPerSlide().ads;
    const chunks = [];
    
    for (let i = 0; i < allAds.length; i += itemsPerSlide) {
        chunks.push(allAds.slice(i, i + itemsPerSlide));
    }

    container.innerHTML = chunks.map((chunk, idx) => `
        <div class="ad-slide ${idx === 0 ? 'active' : ''}">
            <div class="ads-grid" style="grid-template-columns: repeat(${chunk.length}, 1fr);">
                ${chunk.map(ad => `
                    <div class="ad-card" style="background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('${ad.image}'); background-size: cover;">
                        <h3>${ad.title}</h3>
                        <p>${ad.desc}</p>
                        <button class="ad-btn">${ad.btn}</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// --- NEARBY SHOPS SLIDER (WITHOUT DOT SIGN) ---
function renderNearby() {
    const container = document.getElementById('nearbyContent');
    if (!container) return;
    const itemsPerSlide = getItemsPerSlide().nearby;
    const chunks = [];

    for (let i = 0; i < nearbyShops.length; i += itemsPerSlide) {
        chunks.push(nearbyShops.slice(i, i + itemsPerSlide));
    }

    container.innerHTML = chunks.map((chunk, idx) => `
        <div class="nearby-slide ${idx === 0 ? 'active' : ''}">
            <div class="nearby-shops-grid" style="grid-template-columns: repeat(${chunk.length}, 1fr);">
                ${chunk.map(shop => `
                    <div class="nearby-shop-card">
                        <div class="nearby-icon" style="background-image: url('${shop.image}'); background-size: cover; background-position: center; border-radius: 50%;"></div>
                        <div class="nearby-info">
                            <h4>${shop.name}</h4>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- LINE 2: REAL INTERNET STREAMING VIDEOS -->
            <div class="nearby-videos">
                ${nearbyVideos.map(video => `
                    <div class="video-card">
                        <video muted loop autoplay playsinline>
                            <source src="${video.url}" type="video/mp4">
                        </video>
                        <div class="video-label">${video.title}</div>
                        <div class="video-play">▶</div>
                    </div>
                `).join('')}
            </div>

            <!-- LINE 3 ACTIONS SYSTEM -->
            <div class="nearby-actions-row">
                <button class="nearby-action-btn">Track Your Child</button>
                <button class="nearby-action-btn">Track Your Family</button>
                <button class="nearby-action-btn">Track Your Delivery</button>
                <button class="nearby-action-btn add-location-btn">Add Location</button>
            </div>
        </div>
    `).join('');
}

// --- LIVE CAMPAIGN RENDERING ENGINE (ROUND/GOL LOOK) ---
function renderCampaigns() {
    const container = document.getElementById('campaignContainer');
    if (!container) return;
    const itemsPerSlide = window.innerWidth <= 768 ? 4 : 6;
    const chunks = [];

    for (let i = 0; i < allCampaigns.length; i += itemsPerSlide) {
        chunks.push(allCampaigns.slice(i, i + itemsPerSlide));
    }

    container.innerHTML = chunks.map((chunk, idx) => `
        <div class="ad-slide ${idx === 0 ? 'active' : ''}">
            <div class="ads-grid" style="grid-template-columns: repeat(${chunk.length}, 1fr);">
                ${chunk.map(camp => `
                    <div class="campaign-card" style="border-radius: 50%; aspect-ratio: 1; overflow: hidden; position: relative; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('${camp.image}') no-repeat center/cover; padding: 10px; border: 3px solid #ff9900;">
                        <h3 style="font-size: 11px; color: white; margin-bottom: 2px;">${camp.title}</h3>
                        <p style="font-size: 9px; color: #ff9900; font-weight: bold; margin-bottom: 4px;">${camp.desc}</p>
                        <button class="campaign-btn" style="padding: 3px 8px; font-size: 8px; border-radius: 10px; background: #fff; color:#111; border:none; cursor:pointer; font-weight:bold;">${camp.btn}</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}


// ==========================================
// 3. EVENT LISTENERS & CAROUSEL NAVIGATION LOGIC
// ==========================================

let topAdIndex = 0;
let campaignIndex = 0;
