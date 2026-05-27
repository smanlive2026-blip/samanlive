// Sample Database Array for "Near You" Layout Modules
const nearbyServices = [
    { name: "Grocery Delivery", icon: "🛒" },
    { name: "Local Pharmacy", icon: "💊" },
    { name: "Electrician Service", icon: "⚡" },
    { name: "Food Express", icon: "🍔" },
    { name: "Plumbing Expert", icon: "🔧" },
    { name: "Car Mechanics", icon: "🚗" },
    { name: "Home Cleaning", icon: "🧹" },
    { name: "Laundry Hub", icon: "🧺" },
    { name: "Pet Clinic", icon: "🐕" },
    { name: "AC Maintenance", icon: "❄️" },
    { name: "Courier Service", icon: "📦" },
    { name: "Hardware Store", icon: "🔨" }
];

document.addEventListener("DOMContentLoaded", () => {
    renderNearbySlider();
    setupBackToTop();
});

function renderNearbySlider() {
    const contentWrapper = document.getElementById("nearbyContent");
    const dotsWrapper = document.getElementById("nearbyDots");
    if (!contentWrapper) return;

    // Splitting item chunks (6 items per line-set layout block)
    const itemsPerSlide = 6;
    const chunks = [];
    
    for (let i = 0; i < nearbyServices.length; i += itemsPerSlide) {
        chunks.push(nearbyServices.slice(i, i + itemsPerSlide));
    }

    // Generating Dynamic Structure Injection Markup
    contentWrapper.innerHTML = chunks.map((chunk, idx) => `
        <div class="nearby-slide ${idx === 0 ? 'active' : ''}" data-slide="${idx}">
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

    // Generating Navigation Track Dots Control Layout
    dotsWrapper.innerHTML = chunks.map((_, idx) => `
        <span class="dot ${idx === 0 ? 'active' : ''}" onclick="switchSlide(${idx})"></span>
    `).join('');
}

// Interactive Slider Controller logic
window.switchSlide = function(slideIndex) {
    const slides = document.querySelectorAll(".nearby-slide");
    const dots = document.querySelectorAll(".dot");

    slides.forEach(slide => slide.classList.remove("active"));
    dots.forEach(dot => dot.classList.remove("active"));

    const activeSlide = document.querySelector(`.nearby-slide[data-slide="${slideIndex}"]`);
    if (activeSlide) activeSlide.classList.add("active");
    if (dots[slideIndex]) dots[slideIndex].classList.add("active");
};

// Fluid Smooth Back to Top Scroll Initialization
function setupBackToTop() {
    const scrollBtn = document.getElementById("backToTop");
    if (!scrollBtn) return;

    scrollBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}
