//  ye sabhi shop template ke liye comman location file h  public/shop-template.js    

const ShopLocationManager = {
    shopId: null,
    type: 'fixed', // fixed ya dynamic
    pickerMap: null,
    pickerMarker: null,
    watchId: null,

    // INIT - dashboard.js se call hoga
    init: function(shopId) {
        this.shopId = shopId;
    },

    // Modal open hote hi map load
    openModal: function() {
        document.getElementById('locationModal').style.display = 'flex';
        setTimeout(() => {
            if(!this.pickerMap){
                this.pickerMap = L.map('locationPickerMap').setView([23.0225, 72.5714], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.pickerMap);
                this.pickerMarker = L.marker([23.0225, 72.5714], {draggable: true}).addTo(this.pickerMap);
            }
            this.pickerMap.invalidateSize();
        }, 200);
    },

    closeModal: function() {
        document.getElementById('locationModal').style.display = 'none';
    },

    // Fixed / Dynamic button
    setType: function(type) {
        this.type = type;
        document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.type-btn[data-type="${type}"]`).classList.add('active');
        document.getElementById('fixedFields').style.display = type === 'fixed'? 'block' : 'none';
        document.getElementById('dynamicFields').style.display = type === 'dynamic'? 'block' : 'none';
    },

    // Dynamic Live Tracking
    startLiveLocation: function() {
        this.watchId = LocationCore.startWatch((lat, lng) => {
            document.getElementById('currentLatLng').innerText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }, 100);
    },

    stopLiveLocation: function() {
        LocationCore.stopWatch(this.watchId);
        document.getElementById('currentLatLng').innerText = 'Stopped';
    },

    // SAVE - NAYA API /api/location/shop
    saveLocation: async function() {
        if(!this.shopId) return alert("Shop ID missing");

        let lat, lng;
        if(this.type === 'fixed'){
            let latlng = this.pickerMarker.getLatLng();
            lat = latlng.lat;
            lng = latlng.lng;
        } else {
            let txt = document.getElementById('currentLatLng').innerText;
            if(txt === 'Not Started' || txt === 'Stopped') return alert("Pehle Start Live Location karo");
            [lat, lng] = txt.split(', ').map(Number);
        }

        const range = document.getElementById('deliveryRange').value;
        const address = document.getElementById('shopAddress').value;

        try {
            const res = await fetch('/api/location/shop', {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ 
                    shopId: this.shopId, 
                    lat: lat, 
                    lng: lng, 
                    type: this.type, 
                    range: range, 
                    address: address
                })
            });
            const data = await res.json();
            if(data.success){
                alert("Location Saved Successfully!");
                this.closeModal();
                // upar badge update kar de
                document.getElementById('locationTypeBadge').innerText = this.type === 'fixed' ? 'Fixed' : 'Mobile';
                document.getElementById('rangeText').innerText = `Delivery Range: ${range} KM`;
            }
        } catch(err){
            console.error(err);
            alert("Location save failed");
        }
    }
}

// Global functions taaki HTML onclick kaam kare
function openLocationModal(){ ShopLocationManager.openModal(); }
function closeLocationModal(){ ShopLocationManager.closeModal(); }
function setLocationType(type){ ShopLocationManager.setType(type); }
function startLiveLocation(){ ShopLocationManager.startLiveLocation(); }
function stopLiveLocation(){ ShopLocationManager.stopLiveLocation(); }
function saveLocation(){ ShopLocationManager.saveLocation(); }