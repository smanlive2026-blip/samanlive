const LocationCore = {
    getDistance: (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI/180; const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180; const Δλ = (lon2-lon1) * Math.PI/180;
        const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    },

    startWatch: (callback, minDistance=100) => {
        let last = null;
        return navigator.geolocation.watchPosition(pos => {
            const {latitude:lat, longitude:lng} = pos.coords;
            if(last && LocationCore.getDistance(last.lat, last.lng, lat, lng) < minDistance) return;
            last = {lat, lng};
            callback(lat, lng);
        }, err => console.log("Location error:", err), {enableHighAccuracy: true, maximumAge: 0});
    },

    stopWatch: (watchId) => {
        if(watchId) navigator.geolocation.clearWatch(watchId);
    }
};