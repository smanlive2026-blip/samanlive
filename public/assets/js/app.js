// ========================================
// SAMANLIVE - COMPLETE JAVASCRIPT
// ========================================

// 50 OFFERS - TOP WALE
const allAds = [];
const adColors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#6366f1", "#14b8a6"];
for(let i = 0; i < 50; i++) {
    allAds.push({
        title: `Offer ${i + 1}`,
        desc: `70% OFF`,
        btn: "Buy",
        color: adColors[i % adColors.length]
    });
}

// 54 SERVICES - EDUCATION, HEALTH, KIDS TOP PE
const allModules = [
    { icon: "📚", name: "EDUCATION", color: "#3b82f6", link: "/education" },
    { icon: "🏥", name: "HEALTH", color: "#ef4444", link: "/health" },
    { icon: "👶", name: "KIDS", color: "#f59e0b", link: "/kids" },
    { icon: "🎮", name: "GAMES", color: "#8b5cf6", link: "/games" },
    { icon: "🎵", name: "MUSIC", color: "#ec4899", link: "/music" },
    { icon: "📖", name: "BOOKS", color: "#10b981", link: "/books" },
    { icon: "🛒", name: "SHOPPING", color: "#6366f1", link: "/shopping" },
    { icon: "🍕", name: "FOOD", color: "#f59e0b", link: "/food" },
    { icon: "✈️", name: "TRAVEL", color: "#06b6d4", link: "/travel" },
    { icon: "🏠", name: "REAL ESTATE", color: "#84cc16", link: "/real-estate" },
    { icon: "💼", name: "JOBS", color: "#3b82f6", link: "/jobs" },
    { icon: "🚗", name: "AUTOMOTIVE", color: "#6b7280", link: "/automotive" },
    { icon: "💰", name: "FINANCE", color: "#10b981", link: "/finance" },
    { icon: "🏦", name: "BANKING", color: "#1e40af", link: "/banking" },
    { icon: "📈", name: "STOCKS", color: "#ef4444", link: "/stocks" },
    { icon: "💳", name: "PAYMENTS", color: "#8b5cf6", link: "/payments" },
    { icon: "🎬", name: "MOVIES", color: "#ec4899", link: "/movies" },
    { icon: "📺", name: "TV SHOWS", color: "#6366f1", link: "/tv" },
    { icon: "🎨", name: "ART", color: "#f59e0b", link: "/art" },
    { icon: "📷", name: "PHOTOGRAPHY", color: "#6b7280", link: "/photography" },
    { icon: "✍️", name: "WRITING", color: "#3b82f6", link: "/writing" },
    { icon: "🎭", name: "THEATER", color: "#8b5cf6", link: "/theater" },
    { icon: "💪", name: "FITNESS", color: "#ef4444", link: "/fitness" },
    { icon: "🧘", name: "YOGA", color: "#10b981", link: "/yoga" },
    { icon: "⚽", name: "SPORTS", color: "#f59e0b", link: "/sports" },
    { icon: "🏈", name: "FOOTBALL", color: "#92400e", link: "/football" },
    { icon: "🏀", name: "BASKETBALL", color: "#f97316", link: "/basketball" },
    { icon: "🎾", name: "TENNIS", color: "#84cc16", link: "/tennis" },
    { icon: "🏊", name: "SWIMMING", color: "#06b6d4", link: "/swimming" },
    { icon: "🚴", name: "CYCLING", color: "#6b7280", link: "/cycling" },
    { icon: "🧗", name: "CLIMBING", color: "#92400e", link: "/climbing" },
    { icon: "⛷️", name: "SKIING", color: "#60a5fa", link: "/skiing" },
    { icon: "🏄", name: "SURFING", color: "#06b6d4", link: "/surfing" },
    { icon: "🎣", name: "FISHING", color: "#3b82f6", link: "/fishing" },
    { icon: "🏕️", name: "CAMPING", color: "#84cc16", link: "/camping" },
    { icon: "🌱", name: "GARDENING", color: "#10b981", link: "/gardening" },
    { icon: "🐾", name: "PETS", color: "#f59e0b", link: "/pets" },
    { icon: "🐱", name: "CATS", color: "#6b7280", link: "/cats" },
    { icon: "🐦", name: "BIRDS", color: "#60a5fa", link: "/birds" },
    { icon: "🐟", name: "FISH", color: "#06b6d4", link: "/fish" },
    { icon: "🦋", name: "BUTTERFLY", color: "#ec4899", link: "/butterfly" },
    { icon: "🌸", name: "FLOWERS", color: "#f472b6", link: "/flowers" },
    { icon: "🌳", name: "TREES", color: "#10b981", link: "/trees" },
    { icon: "🌙", name: "NIGHT", color: "#1e293b", link: "/night" },
    { icon: "☁️", name: "WEATHER", color: "#60a5fa", link: "/weather" },
    { icon: "🌈", name: "RAINBOW", color: "#f59e0b", link: "/rainbow" },
    { icon: "⭐", name: "STARS", color: "#fbbf24", link: "/stars" },
    { icon: "🌍", name: "EARTH", color: "#10b981", link: "/earth" },
    { icon: "🚀", name: "SPACE", color: "#6366f1", link: "/space" },
    { icon: "🛸", name: "UFO", color: "#8b5cf6", link: "/ufo" },
    { icon: "🤖", name: "ROBOTS", color: "#6b7280", link: "/robots" },
    { icon: "🎯", name: "TARGET", color: "#ef4444", link: "/target" },
    { icon: "💃", name: "DANCE", color: "#ec4899", link: "/dance" },
    { icon: "💄", name: "BEAUTY", color: "#f472b6", link: "/beauty" }
];

// 54 NEARBY SHOPS - BAS YE BADLA HAI
const nearbyServices = [];
const shopIcons = ["📚", "🏥", "👶", "🎮", "🎵", "🛒", "🍕", "✈️", "🏠", "💼", "🚗", "💰", "🏦", "📈", "💳"];
for(let i = 0; i < 54; i++) {
    nearbyServices.push({
        icon: shopIcons[i % 15],
        name: `Shop ${i + 1}`,
        color: `hsl(${(i * 11) % 360}, 70%, 55%)`
    });
}

// 3 VIDEOS
const nearbyVideos = [
    { title: "Shop Tour", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
    { title: "Best Deals", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
    { title: "New Arrivals", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" }
];

// 48 CAMPAIGNS
const allCampaigns = [];
for(let i = 0; i < 48; i++) {
    allCampaigns.push({
        title: `Campaign ${i + 1}`,
        desc: `Join Now`,
        btn: "Join",
        color: adColors[i % adColors.length]
    });
}

// ========================================
// RENDER SERVICES - 54 ITEMS
// ========================================
document.getElementById('serviceGrid').innerHTML = allModules.map((module) => `
    <div class="service-item">
        <a href="${module.link}">
            <div class="service-icon" style="background: linear-gradient(135deg, ${module.color}, ${module.color}dd);">${module.icon}</div>
            <p>${module.name}</p>
        </a>
    </div>
`).join('');

// ========================================
// RENDER TOP ADS - 50 ITEMS, 4 PER SLIDE
// ========================================
const topAdChunks = [];
for (let i = 0; i < allAds.length; i += 4) {
    topAdChunks.push(allAds.slice(i, i + 4));
}
document.getElementById('topAdsContainer').innerHTML = topAdChunks.map((chunk, idx) => `
    <div class="ad-slide ${idx === 0? 'active' : ''}">
        <div class="ads-grid">
            ${chunk.map(ad => `
                <div class="ad-card" style="background: linear-gradient(135deg, ${ad.color}, ${ad.color}cc)">
                    <h3>${ad.title}</h3>
                    <p>${ad.desc}</p>
                    <button class="ad-btn">${ad.btn}</button>
                </div>
            `).join('')}
        </div>
    </div>
`).join('');

// ========================================
// RENDER CAMPAIGNS - 48 ITEMS, 4 PER SLIDE
// ========================================
const campaignChunks = [];
for (let i = 0; i < allCampaigns.length; i += 4) {
    campaignChunks.push(allCampaigns.slice(i, i + 4));
}
document.getElementById('campaignContainer').innerHTML = campaignChunks.map((chunk, idx) => `
    <div class="ad-slide ${idx === 0? 'active' : ''}">
        <div class="ads-grid">
            ${chunk.map(campaign => `
                <div class="campaign-card" style="background: linear-gradient(135deg, ${campaign.color}, ${campaign.color}cc)">
                    <h3>${campaign.title}</h3>
                    <p>${campaign.desc}</p>
                    <button class="campaign-btn">${campaign.btn}</button>
                </div>
            `).join('')}
        </div>
    </div>
`).join('');

// ========================================
// RENDER SHOPS SLIDER - 6 PER SLIDE
// ========================================
const shopChunks = [];
for (let i = 0; i < nearbyServices.length; i += 6) {
    shopChunks.push(nearbyServices.slice(i, i + 6));
}
document.getElementById('shopsContent').innerHTML = shopChunks.map((chunk, idx) => `
    <div class="nearby-slide ${idx === 0? 'active' : ''}">
        <div class="shops-grid">
            ${chunk.map(service => `
                <div class="shop-card">
                    <div class="shop-icon">${service.icon}</div>
                    <div class="shop-name">${service.name}</div>
                </div>
            `).join('')}
        </div>
    </div>
`).join('');
document.getElementById('shopsDots').innerHTML = shopChunks.map((_, idx) => `
    <span class="${idx === 0? 'active' : ''}" onclick="goToShop(${idx})"></span>
`).join('');

// ========================================
// RENDER VIDEOS SLIDER - 3 PER SLIDE
// ========================================
const videoChunks = [];
for (let i = 0; i < nearbyVideos.length; i += 3) {
    videoChunks.push(nearbyVideos.slice(i, i + 3));
}
document.getElementById('videosContent').innerHTML = videoChunks.map((chunk, idx) => `
    <div class="nearby-slide ${idx === 0? 'active' : ''}">
        <div class="videos-grid">
            ${chunk.map(video => `
                <div class="video-card">
                    <video muted loop autoplay playsinline>
                        <source src="${video.url}#t=0,5" type="video/mp4">
                    </video>
                    <div class="video-label">${video.title}</div>
                    <div class="video-play">▶</div>
                </div>
            `).join('')}
        </div>
    </div>
`).join('');
document.getElementById('videosDots').innerHTML = videoChunks.map((_, idx) => `
    <span class="${idx === 0? 'active' : ''}" onclick="goToVideo(${idx})"></span>
`).join('');

// ========================================
// SLIDER LOGIC - TOP ADS
// ========================================
let topAdIndex = 0;
function showTopAd(idx) {
    const slides = document.querySelectorAll('#topAdsContainer .ad-slide');
    slides.forEach(s => s.classList.remove('active'));
    if(slides[idx]) slides[idx].classList.add('active');
    topAdIndex = idx;
}
function nextTopAd() {
    const slides = document.querySelectorAll('#topAdsContainer .ad-slide');
    topAdIndex = (topAdIndex + 1) % slides.length;
    showTopAd(topAdIndex);
}
function prevTopAd() {
    const slides = document.querySelectorAll('#topAdsContainer .ad-slide');
    topAdIndex = (topAdIndex - 1 + slides.length) % slides.length;
    showTopAd(topAdIndex);
}

// ========================================
// SLIDER LOGIC - CAMPAIGNS
// ========================================
let campaignIndex = 0;
function showCampaign(idx) {
    const slides = document.querySelectorAll('#campaignContainer .ad-slide');
    slides.forEach(s => s.classList.remove('active'));
    if(slides[idx]) slides[idx].classList.add('active');
    campaignIndex = idx;
}
function nextCampaign() {
    const slides = document.querySelectorAll('#campaignContainer .ad-slide');
    campaignIndex = (campaignIndex + 1) % slides.length;
    showCampaign(campaignIndex);
}
function prevCampaign() {
    const slides = document.querySelectorAll('#campaignContainer .ad-slide');
    campaignIndex = (campaignIndex - 1 + slides.length) % slides.length;
    showCampaign(campaignIndex);
}

// ========================================
// SLIDER LOGIC - SHOPS
// ========================================
let shopIndex = 0;
function showShop(idx) {
    const slides = document.querySelectorAll('#shopsContent .nearby-slide');
    const dots = document.querySelectorAll('#shopsDots span');
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    if(slides[idx]) slides[idx].classList.add('active');
    if(dots[idx]) dots[idx].classList.add('active');
    shopIndex = idx;
}
function nextShop() {
    const slides = document.querySelectorAll('#shopsContent .nearby-slide');
    shopIndex = (shopIndex + 1) % slides.length;
    showShop(shopIndex);
}
function prevShop() {
    const slides = document.querySelectorAll('#shopsContent .nearby-slide');
    shopIndex = (shopIndex - 1 + slides.length) % slides.length;
    showShop(shopIndex);
}
function goToShop(idx) { showShop(idx); }

// ========================================
// SLIDER LOGIC - VIDEOS
// ========================================
let videoIndex = 0;
function showVideo(idx) {
    const slides = document.querySelectorAll('#videosContent .nearby-slide');
    const dots = document.querySelectorAll('#videosDots span');
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    if(slides[idx]) slides[idx].classList.add('active');
    if(dots[idx]) dots[idx].classList.add('active');
    videoIndex = idx;
}
function nextVideo() {
    const slides = document.querySelectorAll('#videosContent .nearby-slide');
    videoIndex = (videoIndex + 1) % slides.length;
    showVideo(videoIndex);
}
function prevVideo() {
    const slides = document.querySelectorAll('#videosContent .nearby-slide');
    videoIndex = (videoIndex - 1 + slides.length) % slides.length;
    showVideo(videoIndex);
}
function goToVideo(idx) { showVideo(idx); }

// ========================================
// AUTO SLIDE - 5 SECONDS
// ========================================
setInterval(nextTopAd, 5000);
setInterval(nextCampaign, 6000);
setInterval(nextShop, 4000);
setInterval(nextVideo, 5000);

// ========================================
// SEARCH FUNCTIONALITY
// ========================================
document.getElementById('searchInput').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    console.log('Searching for:', searchTerm);
});

// ========================================
// VIDEO CLICK TO PLAY/PAUSE
// ========================================
document.addEventListener('click', function(e) {
    if (e.target.closest('.video-card')) {
        const video = e.target.closest('.video-card').querySelector('video');
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    }
});

// ========================================
// NOTIFICATION CLICK
// ========================================
document.querySelector('.notification-icon').addEventListener('click', function() {
    alert('3 New Notifications!');
});

// ========================================
// PROFILE CLICK
// ========================================
document.querySelector('.profile-avatar').addEventListener('click', function() {
    alert('Profile Menu Coming Soon!');
});

// ========================================
// TRACK BUTTONS CLICK
// ========================================
document.querySelectorAll('.nearby-action-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const text = this.textContent.trim();
        alert(`${text} feature coming soon!`);
    });
});

// ========================================
// PREVENT ZOOM
// ========================================
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});
document.addEventListener('gesturechange', function(e) {
    e.preventDefault();
});
document.addEventListener('gestureend', function(e) {
    e.preventDefault();
});

// ========================================
// CONSOLE LOG ON LOAD
// ========================================
console.log('SAMANLIVE Loaded Successfully!');
console.log('Total Services:', allModules.length);
console.log('Total Offers:', allAds.length);
console.log('Total Campaigns:', allCampaigns.length);
console.log('Total Shops:', nearbyServices.length);