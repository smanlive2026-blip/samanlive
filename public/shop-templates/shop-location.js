window.ShopLocationManager = {
    shopId: null,
    
    init: function(shopId) {
        this.shopId = shopId;
        document.getElementById('locationBtn').onclick = () => {
            const card = document.getElementById('locationCard');
            card.style.display = card.style.display === 'none' ? 'block' : 'none';
            card.scrollIntoView({behavior: 'smooth'});
        };
        document.getElementById('locationType').onchange = () => {
            document.getElementById('rangeDiv').style.display = 
                document.getElementById('locationType').value === 'fixed' ? 'block' : 'none';
        };
        document.getElementById('saveLocationBtn').onclick = () => this.saveLocation();
        this.loadExistingLocation();
    },

    saveLocation: async function() {
        const btn = document.getElementById('saveLocationBtn');
        const status = document.getElementById('locationStatus');
        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Location le rahe...';

            const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, {enableHighAccuracy: true, timeout: 10000}));
            const loc = {lat: pos.coords.latitude, lng: pos.coords.longitude};

            const res = await fetch('/api/location/shop', {
                method: 'POST', 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify({
                    shopId: this.shopId,
                    lat: loc.lat, lng: loc.lng,
                    type: document.getElementById('locationType').value,
                    range: document.getElementById('deliveryRange').value,
                    address: document.getElementById('shopAddress').value
                })
            });
            const data = await res.json();

            if(data.success) {
                status.innerHTML = `✅ Saved! Lat:${loc.lat.toFixed(4)} Lng:${loc.lng.toFixed(4)}`;
                status.style.color = '#10b981';
                btn.innerHTML = '<i class="fa fa-check"></i> Update Location';
            } else throw new Error(data.message);

        } catch(e) {
            status.innerHTML = `❌ ${e.message || e}`;
            status.style.color = '#ef4444';
            btn.innerHTML = '<i class="fa fa-location-crosshairs"></i> Try Again';
        } finally { btn.disabled = false; }
    },

    loadExistingLocation: async function() {
        try {
            const res = await fetch(`/api/location/shop/${this.shopId}`);
            const data = await res.json();
            if(data.success && data.data) {
                const d = data.data;
                document.getElementById('locationType').value = d.locationType;
                document.getElementById('deliveryRange').value = d.deliveryRange;
                document.getElementById('shopAddress').value = d.address || '';
                document.getElementById('locationStatus').innerHTML = `✅ Already Set`;
                document.getElementById('locationType').dispatchEvent(new Event('change'));
            }
        } catch(e){}
    }
};

// ShopID dashboard.js se milegi. Waha se call karna