//   ye golden rule h    public/assets/js/location.shop.js

let shopWatchId = null;
let shopLocationType = 'fixed';
let pickerMap, pickerMarker;

// YE OBJECT dashboard.js me use ho raha hai
const ShopLocationManager = {
    shopId: null,
    
    init: function(id){ 
        this.shopId = id;
        localStorage.setItem('shopId', id); // saveShopLocation me kaam aayega
        this.loadSavedLocation();
    },

    loadSavedLocation: async function() {
        try {
            const res = await fetch(`/api/location/shop/${this.shopId}`);
            const data = await res.json();
            if(data.success && data.data){
                document.getElementById('locationTypeBadge').innerText = data.data.locationType === 'fixed'? 'Fixed' : 'Mobile';
                document.getElementById('rangeText').innerText = `Delivery Range: ${data.data.deliveryRange} KM`;
                if(data.data.address) document.getElementById('shopAddress').value = data.data.address;
            }
        } catch(err) {
            const saved = localStorage.getItem('shopLocation_'+this.shopId);
            if(saved){
                const data = JSON.parse(saved);
                document.getElementById('locationTypeBadge').innerText = data.type === 'fixed'? 'Fixed' : 'Mobile';
                document.getElementById('rangeText').innerText = `Delivery Range: ${data.range} KM`;
                document.getElementById('shopAddress').value = data.address;
            }
        }
    }
};


// YE 2 FUNCTION BUTTON KE LIYE ZARURI THE
function openLocationModal(){ 
    document.getElementById('locationModal').style.display = 'flex'; 
    initShopLocationPicker('locationPickerMap'); // tera wala function call
}
function closeLocationModal(){ 
    document.getElementById('locationModal').style.display = 'none'; 
}


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
    const shopId = ShopLocationManager.shopId; // fix kiya
    const range = document.getElementById('deliveryRange').value;
    const address = document.getElementById('shopAddress').value;

    // API fail hua to localStorage me save
    try{
        await fetch('/api/location/shop', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ shopId, lat, lng, type, range, address })
        });
    }catch(e){
        localStorage.setItem('shopLocation_'+shopId, JSON.stringify({type, lat, lng, range, address}));
    }

    document.getElementById('locationTypeBadge').innerText = type === 'fixed'? 'Fixed' : 'Mobile';
    document.getElementById('rangeText').innerText = `Delivery Range: ${range} KM`;
    alert('Location Saved! ✅');
    closeLocationModal();
}

// SAVE BUTTON KE LIYE NAYA FUNCTION
function saveLocation(){
    const latlng = pickerMarker.getLatLng();
    saveShopLocation(latlng.lat, latlng.lng, shopLocationType);
}