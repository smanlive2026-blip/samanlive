// 100 MODULES - CHAMAKDAR
const moduleNames = ["Education", "Health", "Kids", "Games", "Music", 
"Books", "Shopping", "Food", "Travel", "Real Estate", "Jobs", 
"Automotive", "Finance", "Banking", "Stocks", "Payments", "Movies", "TV Shows", "Art", "Photography", "Writing", "Theater", "Fitness", "Yoga", 
"Sports", "Football", "Basketball", "Tennis", "Swimming", "Cycling", 
"Climbing", "Skiing", "Surfing", "Fishing", "Camping", "Gardening", 
"Pets", "Cats", "Birds", "Fish", "Butterfly", "Flowers", "Trees",
"Night", "Weather", "Rainbow", "Stars", "Earth", "Space", "UFO", 
"Robots", "Target"];
const moduleIcons = ["🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", 
"🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", 
"⚽", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", 
"🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "🔍", "⭐", "🔍", "🔍", "🔍", "🔍", "🔍"];
const allModules = [];
for(let i = 0; i < 100; i++) {
const idx = i % moduleNames.length;
allModules.push({
icon: moduleIcons[idx],
name: `${moduleNames[idx]}`,
color: `hsl(${(i * 7) % 360}, 70%, 55%)`,
link: `/modules/${moduleNames[idx].toLowerCase().replace(' ', '-')}-${i}`
});
}
// ADS - 200 ADS, 4 PER SLIDE
const allAds = [];
const adColors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", 
"#ef4444", "#6366f1", "#14b8a6"];
for(let i = 0; i < 200; i++) {
allAds.push({
title: `Offer ${i + 1}`,
desc: `70% OFF`,
btn: "Buy",
color: adColors[i % adColors.length]
});
}
// CAMPAIGN - 200 CAMPAIGNS, 4 PER SLIDE
const allCampaigns = [];
for(let i = 0; i < 200; i++) {
allCampaigns.push({
title: `Campaign ${i + 1}`,
desc: `Join Now`,
btn: "Join",
color: adColors[i % adColors.length]
});
}
// NEARBY - 48 SERVICES, 6 PER SLIDE
const nearbyServices = [];
for(let i = 0; i < 48; i++) {
const idx = i % moduleNames.length;
nearbyServices.push({
icon: moduleIcons[idx],
name: `${moduleNames[idx]}`,
color: `hsl(${(i * 11) % 360}, 70%, 55%)`
});
}
// 3 VIDEOS - 5 SEC WALE
const nearbyVideos = [
{ title: "Shop Tour", url: "https://googleapis.com" },
{ title: "Best Deals", url: "https://googleapis.com" },
{ title: "New Arrivals", url: "https://googleapis.com" }
];
// RENDER MODULES - CHAMAKDAR GRADIENT
document.getElementById('serviceGrid').innerHTML =
allModules.map((module, idx) => `
<div class="service-item" style="animation-delay: ${idx * 0.01}s">
<a href="${module.link}">
<div class="service-icon" style="background: linear-gradient(135deg, ${module.color}, ${module.color}dd);">${module.icon}</div>
<p>${module.name}</p>
</a>
</div>
`).join('');
// RENDER TOP ADS - 4 PER SLIDE EK LINE
const topAdChunks = [];
for (let i = 0; i < allAds.length; i += 4) {
topAdChunks.push(allAds.slice(i, i + 4));
}
document.getElementById('topAdsContainer').innerHTML =
topAdChunks.map((chunk, idx) => `
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
// RENDER CAMPAIGN - 4 PER SLIDE EK LINE
const campaignChunks = [];
for (let i = 0; i < allCampaigns.length; i += 4) {
campaignChunks.push(allCampaigns.slice(i, i + 4));
}
document.getElementById('campaignContainer').innerHTML =
campaignChunks.map((chunk, idx) => `
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

// RENDER NEARBY - LINE 1 (6 ICON) + LINE 2 (3 VIDEO) + LINE 3 (4 BUTTONS)
const nearbyChunks = [];
for (let i = 0; i < nearbyServices.length; i += 6) {
nearbyChunks.push(nearbyServices.slice(i, i + 6));
}
document.getElementById('nearbyContent').innerHTML =
nearbyChunks.map((chunk, idx) => `
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
<div class="nearby-videos">
${nearbyVideos.map(video => `
<div class="video-card">
<video muted loop autoplay playsinline>
<source src="${video.url}#t=0,5" type="video/mp4">
</video>
<div class="video-label">${video.title}</div>
<div class="video-play">▶</div>
</div>
`).join('')}
</div>
<!-- LINE 3 BUTTONS ADDED SUCCESSFULLY -->
<div class="nearby-actions-row">
<button class="nearby-action-btn">Track Your Child</button>
<button class="nearby-action-btn">Track Your Family</button>
<button class="nearby-action-btn">Track Your Delivery</button>
<button class="nearby-action-btn add-location-btn">Add Location</button>
</div>
</div>
`).join('');

// RENDER DOTS
document.getElementById('nearbyDots').innerHTML = nearbyChunks.map((_, 
idx) => `
<span class="${idx === 0? 'active' : ''}" onclick="goToNearby(${idx})"></span>
`).join('');
// SLIDER LOGIC - SPACE KE SAATH SELECTOR
let topAdIndex = 0;
let campaignIndex = 0;
let nearbyIndex = 0;
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
function showNearby(idx) {
const slides = document.querySelectorAll('#nearbyContent .nearby-slide');
const dots = document.querySelectorAll('#nearbyDots span');
slides.forEach(s => s.classList.remove('active'));
dots.forEach(d => d.classList.remove('active'));
if(slides[idx]) slides[idx].classList.add('active');
if(dots[idx]) dots[idx].classList.add('active');
nearbyIndex = idx;
}
function nextNearby() {
const slides = document.querySelectorAll('#nearbyContent .nearby-slide');
nearbyIndex = (nearbyIndex + 1) % slides.length;
showNearby(nearbyIndex);
}
function prevNearby() {
const slides = document.querySelectorAll('#nearbyContent .nearby-slide');
nearbyIndex = (nearbyIndex - 1 + slides.length) % slides.length;
showNearby(nearbyIndex);
}
function goToNearby(idx) { showNearby(idx); }
// AUTO SLIDE
setInterval(nextTopAd, 5000);
setInterval(nextCampaign, 6000);
setInterval(nextNearby, 4000);
