// 100 MODULES GENERATE
const moduleNames = ["Education", "Health", "Kids", "Games", "Music", "Books", "Shopping", "Food", "Travel", "Real Estate", "Jobs", "Automotive", "Finance", "Banking", "Stocks", "Payments", "Movies", "TV Shows", "Art", "Photography", "Writing", "Theater", "Fitness", "Yoga", "Sports", "Football", "Basketball", "Tennis", "Swimming", "Cycling", "Climbing", "Skiing", "Surfing", "Fishing", "Camping", "Gardening", "Pets", "Cats", "Birds", "Fish", "Butterfly", "Flowers", "Trees", "Night", "Weather", "Rainbow", "Stars", "Earth", "Space", "UFO", "Robots", "Target"];
const moduleIcons = ["📚", "🏥", "👶", "🎮", "🎵", "📖", "🛒", "🍕", "✈️", "🏠", "💼", "🚗", "💰", "🏦", "📈", "💳", "🎬", "📺", "🎨", "📷", "✍️", "🎭", "💪", "🧘", "⚽", "🏈", "🏀", "🎾", "🏊", "🚴", "🧗", "⛷️", "🏄", "🎣", "🏕️", "🌱", "🐾", "🐱", "🐦", "🐟", "🦋", "🌸", "🌳", "🌙", "☁️", "🌈", "⭐", "🌍", "🚀", "🛸", "🤖", "🎯"];
const allModules = [];
for(let i = 0; i < 100; i++) {
    const idx = i % moduleNames.length;
    allModules.push({
        icon: moduleIcons[idx],
        name: `${moduleNames[idx]}`,
        color: `hsl(${(i * 7) % 360}, 70%, 50%)`,
        link: `/modules/${moduleNames[idx].toLowerCase().replace(' ', '-')}-${i}`
    });
}

// ADS DATA - 200 ADS, 4 PER SLIDE
const allAds = [];
const adColors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#6366f1", "#14b8a6"];
for(let i = 0; i < 200; i++) {
    allAds.push({
        title: `Mega Offer ${i + 1}`,
        desc: `Up to 70% OFF`,
        btn: "Shop Now",
        color: adColors[i % adColors.length]
    });
}

// NEARBY SERVICES - 48 SERVICES, 6 PER SLIDE
const nearbyServices = [];
for(let i = 0; i < 48; i++) {
    const idx = i % moduleNames.length;
    nearbyServices.push({
        icon: moduleIcons[idx],
        name: `${moduleNames[idx]}`,
        color: `hsl(${(i * 11) % 360}, 70%, 50%)`
    });
}

// RENDER MODULES - CHAMAKDAR BADE ICON
document.getElementById('serviceGrid').innerHTML = allModules.map((module, idx) => `
    <div class="service-item" style="--delay: ${idx * 0.01}s">
        <a href="${module.link}">
            <div class="service-icon" style="background: linear-gradient(135deg, ${module.color}, ${module.color}dd); color: white;">${module.icon}</div>
            <p>${module.name}</p>
        </a>
    </div>
`).join('');

// RENDER TOP ADS - 4 PER SLIDE 2x2
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

// RENDER BOTTOM ADS - 4 PER SLIDE 2x2
const bottomAdChunks = topAdChunks.slice(0, 50);
document.getElementById('bottomAdsContainer').innerHTML = bottomAdChunks.map((chunk, idx) => `
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

// RENDER NEARBY - 6 PER SLIDE 3x2 GOL
const nearbyChunks = [];
for (let i = 0; i < nearbyServices.length; i += 6) {
    nearbyChunks.push(nearbyServices.slice(i, i + 6));
}
document.getElementById('nearbyContainer').innerHTML = nearbyChunks.map((chunk, idx) => `
    <div class="nearby-slide ${idx === 0? 'active' : ''}">
        <div class="nearby-shops-grid">
            ${chunk.map(service => `
                <div class="nearby-shop-card">
                    <div class="nearby-icon">${service.icon}</div>
                    <div class="nearby-info">
                        <h4>${service.name}</h4>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
`).join('');

// RENDER DOTS
document.getElementById('nearbyDots').innerHTML = nearbyChunks.map((_, idx) => `
    <span class="${idx === 0? 'active' : ''}" onclick="goToNearby(${idx})"></span>
`).join('');

// SLIDER LOGIC
let topAdIndex = 0;
let bottomAdIndex = 0;
let nearbyIndex = 0;

function showTopAd(idx) {
    const slides = document.querySelectorAll('#topAdsContainer.ad-slide');
    slides.forEach(s => s.classList.remove('active'));
    slides[idx].classList.add('active');
    topAdIndex = idx;
}
function nextTopAd() {
    const slides = document.querySelectorAll('#topAdsContainer.ad-slide');
    topAdIndex = (topAdIndex + 1) % slides.length;
    showTopAd(topAdIndex);
}
function prevTopAd() {
    const slides = document.querySelectorAll('#topAdsContainer.ad-slide');
    topAdIndex = (topAdIndex - 1 + slides.length) % slides.length;
    showTopAd(topAdIndex);
}

function showBottomAd(idx) {
    const slides = document.querySelectorAll('#bottomAdsContainer.ad-slide');
    slides.forEach(s => s.classList.remove('active'));
    slides[idx].classList.add('active');
    bottomAdIndex = idx;
}
function nextBottomAd() {
    const slides = document.querySelectorAll('#bottomAdsContainer.ad-slide');
    bottomAdIndex = (bottomAdIndex + 1) % slides.length;
    showBottomAd(bottomAdIndex);
}
function prevBottomAd() {
    const slides = document.querySelectorAll('#bottomAdsContainer.ad-slide');
    bottomAdIndex = (bottomAdIndex - 1 + slides.length) % slides.length;
    showBottomAd(bottomAdIndex);
}

function showNearby(idx) {
    const slides = document.querySelectorAll('#nearbyContainer.nearby-slide');
    const dots = document.querySelectorAll('#nearbyDots span');
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    slides[idx].classList.add('active');
    dots[idx].classList.add('active');
    nearbyIndex = idx;
}
function nextNearby() {
    const slides = document.querySelectorAll('#nearbyContainer.nearby-slide');
    nearbyIndex = (nearbyIndex + 1) % slides.length;
    showNearby(nearbyIndex);
}
function prevNearby() {
    const slides = document.querySelectorAll('#nearbyContainer.nearby-slide');
    nearbyIndex = (nearbyIndex - 1 + slides.length) % slides.length;
    showNearby(nearbyIndex);
}
function goToNearby(idx) { showNearby(idx); }

// AUTO SLIDE
setInterval(nextTopAd, 5000);
setInterval(nextBottomAd, 6000);
setInterval(nextNearby, 4000);