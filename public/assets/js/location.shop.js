//      public/assets/js/location.shop.js

let shopWatchId = null;
let shopLocationType = 'fixed';
let pickerMap, pickerMarker;

function initShopLocationPicker(mapDivId){
    setTimeout(() => {
        if(!pickerMap){
            pickerMap = L.map(mapDivId).setView([23.0225, 72.5714], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(pickerMap);
            pickerMarker = L.marker([23.0225, 72.5714], {draggable: true}).addTo(pickerMap);
        }
        pickerMap.invalidateSize();
    }, 200);
}

function setLocationType(type) {
    shopLocationType = type;
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.type-btn[data-type="${type}"]`).classList.add('active');
    document.getElementById('fixedFields').style.display = type === 'fixed'? 'block' : 'none';
    document.getElementById('dynamicFields').style.display = type === 'dynamic'? 'block' : 'none';
}

function startShopLiveTracking(){
    shopWatchId = LocationCore.startWatch((lat, lng) => {
        document.getElementById('currentLatLng').innerText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        saveShopLocation(lat, lng, 'dynamic');
    }, 100);
}

function stopShopLiveTracking(){
    LocationCore.stopWatch(shopWatchId);
}

async function saveShopLocation(lat, lng, type){
    const shopId = localStorage.getItem('shopId');
    const range = document.getElementById('deliveryRange').value;
    const address = document.getElementById('shopAddress').value;

    await fetch('/api/location/shop', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ shopId, lat, lng, type, range, address })
    });
}