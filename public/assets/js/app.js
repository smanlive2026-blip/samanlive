// 100 MODULES GENERATE
const allModules = [];
const moduleNames = ["Education", "Health", "Kids", "Games", "Music", "Books", "Shopping", "Food", "Travel", "Real Estate", "Jobs", "Automotive", "Finance", "Banking", "Stocks", "Payments", "Movies", "TV Shows", "Art", "Photography", "Writing", "Theater", "Fitness", "Yoga", "Sports", "Football", "Basketball", "Tennis", "Swimming", "Cycling", "Climbing", "Skiing", "Surfing", "Fishing", "Camping", "Gardening", "Pets", "Cats", "Birds", "Fish", "Butterfly", "Flowers", "Trees", "Night", "Weather", "Rainbow", "Stars", "Earth", "Space", "UFO", "Robots", "Target"];
const moduleIcons = ["🎓", "🏥", "👶", "🎮", "🎵", "📚", "🛒", "🍕", "✈️", "🏠", "💼", "🚗", "💰", "🏦", "📈", "💳", "🎬", "📺", "🎨", "📷", "✍️", "🎭", "🏋️", "🧘", "🏃", "⚽", "🏀", "🎾", "🏊", "🚴", "🧗", "🎿", "🏄", "🎣", "🏕️", "🌱", "🐕", "🐱", "🐦", "🐠", "🦋", "🌸", "🌳", "🌙", "☀️", "🌈", "⭐", "🌍", "🚀", "🛸", "🤖", "🎯"];

for(let i = 0; i < 100; i++) {
    const idx = i % moduleNames.length;
    allModules.push({
        icon: moduleIcons[idx],
        name: `${moduleNames[idx]} ${Math.floor(i/moduleNames.length) + 1}`,
        color: `hsl(${(i * 7) % 360}, 70%, 50%)`,
        link: `/modules/${moduleNames[idx].toLowerCase().replace(' ', '-')}-${i}`
    });
}

// 250 ADS - 5 PER SLIDE = 50 SLIDE
const allAds = [];
for(let i = 1; i <= 250; i++) {
    allAds.push({
        title: `Special Offer #${i}`,
        desc: `Save up to ${20 + (i % 80)}% on premium services!`,
        btn: "Shop Now",
        color: `hsl(${(i * 7) % 360}, 70%, 50%)`
    });
}

// 50 NEARBY SHOPS - 10 PER SLIDE = 5 SLIDE
const nearbyServices = [];
const shopTypes = ["Shops", "Hospitals", "Hotels", "Restaurants", "Pharmacy", "Petrol", "ATMs", "Taxi", "Grocery", "Theatres", "Salon", "Mechanic", "Mobile Shop", "Clothing", "Bakery"];
const shopIcons = ["🏪", "🏥", "🏨", "🍽️", "💊", "⛽", "🏧", "🚕", "🛒", "🎬", "💇", "🔧", "📱", "👕", "🥖"];

for(let i = 1; i <= 50; i++) {
    const idx = i % shopTypes.length;
    const km = (Math.random() * 5 + 0.5).toFixed(1);
    nearbyServices.push({
        icon: shopIcons[idx],
        name: `${shopTypes[idx]} ${i}`,
        desc: `${km} km away • Open Now`,
        btn: "Visit",
        color: `hsl(${(i * 15) % 360}, 70%, 50%)`
    });
}

// LOAD 100 MODULES
document.getElementById('serviceGrid').innerHTML = allModules.map((module, i) => `
    <div class="service-item" style="--delay: ${i * 0.02}s">
        <a href="${module.link}">
            <div class="service-icon" style="background: ${module.color}">${module.icon}</div>
            <p>${module.name}</p>
        </a>
    </div>
`).join('');

// TOP ADS - 5 PER SLIDE
const topAdChunks = [];
for (let i = 0; i < allAds.length; i += 5) {
    topAdChunks.push(allAds.slice(i, i + 5));
}
document.getElementById('topAdsContainer').innerHTML = topAdChunks.map((chunk, idx) => `
    <div class="ad-slide ${idx === 0? 'active' : ''}">
        <div class="ads-grid">
            ${chunk.map(ad => `
                <div class="ad-card" style="background: ${ad.color}">
                    <h3>${ad.title}</h3>
                    <p>${ad.desc}</p>
                    <button class="ad-btn">${ad.btn}</button>
                </div>
            `).join('')}
        </div>
    </div>
`).join('');

// BOTTOM ADS - 5 PER SLIDE, 50 SLIDES
const bottomAdChunks = topAdChunks.slice(0, 50);
document.getElementById('bottomAdsContainer').innerHTML = bottomAdChunks.map((chunk, idx) => `
    <div class="ad-slide ${idx === 0? 'active' : ''}">
        <div class="ads-grid">
            ${chunk.map(ad => `
                <div class="ad-card" style="background: ${ad.color}">
                    <h3>${ad.title}</h3>
                    <p>${ad.desc}</p>
                    <button class="ad-btn">${ad.btn}</button>
                </div>
            `).join('')}
        </div>
    </div>
`).join('');

// NEARBY - 10 PER SLIDE, 5 SLIDES
const nearbyChunks = [];
for (let i = 0; i < nearbyServices.length; i += 10) {
    nearbyChunks.push(nearbyServices.slice(i, i + 10));
}
document.getElementById('nearbyContainer').innerHTML = nearbyChunks.map((chunk, idx) => `
    <div class="nearby-slide ${idx === 0? 'active' : ''}">
        <div class="nearby-shops-grid">
            ${chunk.map(service => `
                <div class="nearby-shop-card">
                    <div class="nearby-icon" style="background: ${service.color}33">${service.icon}</div>
                    <div class="nearby-info">
                        <h4>${service.name}</h4>
                        <p>${service.desc}</p>
                        <button style="color: ${service.color}">${service.btn}</button>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
`).join('');
document.getElementById('nearbyDots').innerHTML = nearbyChunks.map((_, idx) => `
    <span class="${idx === 0? 'active' : ''}" onclick="goToNearby(${idx})"></span>
`).join('');

// SLIDER FUNCTIONS - 5 SEC
let currentTopAd = 0, currentBottomAd = 0, currentNearby = 0;

function updateTopAd() {
    document.querySelectorAll('#topAdsContainer.ad-slide').forEach((s, i) => s.classList.toggle('active', i === currentTopAd));
}
function nextTopAd() { currentTopAd = (currentTopAd + 1) % topAdChunks.length; updateTopAd(); }
function prevTopAd() { currentTopAd = (currentTopAd - 1 + topAdChunks.length) % topAdChunks.length; updateTopAd(); }

function updateBottomAd() {
    document.querySelectorAll('#bottomAdsContainer.ad-slide').forEach((s, i) => s.classList.toggle('active', i === currentBottomAd));
}
function nextBottomAd() { currentBottomAd = (currentBottomAd + 1) % bottomAdChunks.length; updateBottomAd(); }
function prevBottomAd() { currentBottomAd = (currentBottomAd - 1 + bottomAdChunks.length) % bottomAdChunks.length; updateBottomAd(); }

function updateNearby() {
    document.querySelectorAll('.nearby-slide').forEach((s, i) => s.classList.toggle('active', i === currentNearby));
    document.querySelectorAll('.nearby-dots span').forEach((d, i) => d.classList.toggle('active', i === currentNearby));
}
function nextNearby() { currentNearby = (currentNearby + 1) % nearbyChunks.length; updateNearby(); }
function prevNearby() { currentNearby = (currentNearby - 1 + nearbyChunks.length) % nearbyChunks.length; updateNearby(); }
function goToNearby(i) { currentNearby = i; updateNearby(); }

// AUTO SLIDE - 5 SEC
setInterval(nextTopAd, 5000);
setInterval(nextBottomAd, 5000);
setInterval(nextNearby, 5000);

// MENU
function toggleMenu() {
    document.getElementById('mobileMenu')?.classList.toggle('active');
}