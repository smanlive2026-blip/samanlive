// 100 MODULES - CHAMAKDAR
const moduleNames = ["Education", "Health", "Kids", "Games", "Music", "Books", "Shopping", "Food", "Travel", "Real Estate", "Jobs", "Automotive", "Finance", "Banking", "Stocks", "Payments", "Movies", "TV Shows", "Art", "Photography", "Writing", "Theater", "Fitness", "Yoga", "Sports", "Football", "Basketball", "Tennis", "Swimming", "Cycling", "Climbing", "Skiing", "Surfing", "Fishing", "Camping", "Gardening", "Pets", "Cats", "Birds", "Fish", "Butterfly", "Flowers", "Trees", "Night", "Weather", "Rainbow", "Stars", "Earth", "Space", "UFO", "Robots", "Target"];
const moduleIcons = ["📚", "🏥", "👶", "🎮", "🎵", "📖", "🛒", "🍕", "✈️", "🏠", "💼", "🚗", "💰", "🏦", "📈", "💳", "🎬", "📺", "🎨", "📷", "✍️", "🎭", "💪", "🧘", "⚽", "🏈", "🏀", "🎾", "🏊", "🚴", "🧗", "⛷️", "🏄", "🎣", "🏕️", "🌱", "🐾", "🐱", "🐦", "🐟", "🦋", "🌸", "🌳", "🌙", "☁️", "🌈", "⭐", "🌍", "🚀", "🛸", "🤖", "🎯"];
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
const adColors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#6366f1", "#14b8a6"];
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
    { title: "Promo 1", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
    { title: "Promo 2", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
    { title: "Promo 3", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" }
];

// RENDER MODULES - CHAMAKDAR GRADIENT
document.getElementById('serviceGrid').innerHTML = allModules.map((module, idx) => `
    <div class="service-item" style="--delay: ${idx * 0.01}s">
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

// RENDER CAMPAIGN - 4 PER SLIDE EK LINE
const campaignChunks = [];
for (let i = 0; i < allCampaigns.length; i += 4) {
    campaignChunks.push(allCampaigns.slice(i, i + 4));
}
document.getElementById('campaignContainer').innerHTML = campaignChunks.map((chunk, idx) => `
    <div class="ad-slide ${idx === 0? 'active' : ''}">
        <div class="ads-grid">
            ${chunk.map(campaign => `
                <div class="campaign-card" style="background: linear-gradient(135deg