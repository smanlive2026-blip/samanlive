//      public/assets/js/location.core.js

let userWatchId = null;

function initUserLocation(){
    if(!navigator.geolocation) return;

    userWatchId = LocationCore.startWatch((lat, lng) => {
        // 1. Server ko bhejo
        fetch('/api/location/user', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ userId: localStorage.getItem('userId'), lat, lng })
        });

        // 2. Nearby reload
        if(typeof loadNearbyShops === 'function') loadNearbyShops(lat, lng);
    }, 100);
}

// Page load pe call karna
document.addEventListener('DOMContentLoaded', initUserLocation);