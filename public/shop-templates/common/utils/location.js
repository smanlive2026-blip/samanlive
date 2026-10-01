// LOCATION: public/shop-templates/common/utils/location.js
// WORLD CLASS LOCATION UTILS - FULL 250+ LINES
class LocationUtils {
  constructor(){
    this.currentLocation = null;
    this.watchId = null;
  }

  async getCurrentLocation(options={}){
    try{
      const { enableHighAccuracy=true, timeout=10000, maximumAge=0 } = options;

      return new Promise((resolve, reject)=>{
        if(!navigator.geolocation){
          reject(new Error('Geolocation not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position)=>{
            const location = {
              lat:position.coords.latitude,
              lng:position.coords.longitude,
              latitude:position.coords.latitude,
              longitude:position.coords.longitude,
              accuracy:position.coords.accuracy,
              altitude:position.coords.altitude,
              heading:position.coords.heading,
              speed:position.coords.speed,
              timestamp:position.timestamp
            };

            this.currentLocation = location;
            resolve(location);
          },
          (error)=>{
            let message = 'Location error';
            switch(error.code){
              case 1: message='Permission denied - Enable location'; break;
              case 2: message='Position unavailable'; break;
              case 3: message='Location timeout'; break;
            }
            reject(new Error(message));
          },
          { enableHighAccuracy, timeout, maximumAge }
        );
      });

    }catch(error){
      throw error;
    }
  }

  async getAddressFromCoords(lat, lng){
    try{
      // Use Google Maps Geocoding API or fallback
      // For now, mock address

      if(window.google && window.google.maps){
        const geocoder = new google.maps.Geocoder();
        const latlng = { lat, lng };

        return new Promise((resolve, reject)=>{
          geocoder.geocode({ location:latlng }, (results, status)=>{
            if(status==='OK' && results[0]){
              const address = results[0].formatted_address;
              const components = results[0].address_components;

              let area = '', city = '', pincode = '', state = '';

              components.forEach(comp=>{
                if(comp.types.includes('sublocality')||comp.types.includes('neighborhood')){
                  area = comp.long_name;
                }
                if(comp.types.includes('locality')){
                  city = comp.long_name;
                }
                if(comp.types.includes('postal_code')){
                  pincode = comp.long_name;
                }
                if(comp.types.includes('administrative_area_level_1')){
                  state = comp.long_name;
                }
              });

              resolve({ address, area, city, pincode, state, lat, lng, full:results[0] });
            } else {
              resolve({ address:`${lat}, ${lng}`, area:'', city:'Surat', pincode:'', state:'Gujarat', lat, lng });
            }
          });
        });
      }

      // Fallback
      return {
        address:`${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        area:'Adajan',
        city:'Surat',
        pincode:'395009',
        state:'Gujarat',
        lat,
        lng
      };

    }catch(error){
      return { address:`${lat}, ${lng}`, area:'', city:'Surat', lat, lng };
    }
  }

  calculateDistance(lat1, lng1, lat2, lng2){
    try{
      const R = 6371; // Earth radius in km
      const dLat = this.toRad(lat2-lat1);
      const dLng = this.toRad(lng2-lng1);

      const a = Math.sin(dLat/2)*Math.sin(dLat/2) +
                Math.cos(this.toRad(lat1))*Math.cos(this.toRad(lat2))*
                Math.sin(dLng/2)*Math.sin(dLng/2);

      const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R*c;

      return {
        km:distance,
        meters:distance*1000,
        formatted: distance<1? `${Math.round(distance*1000)}m` : `${distance.toFixed(1)}km`
      };

    }catch(e){
      return { km:0, meters:0, formatted:'0km' };
    }
  }

  toRad(deg){
    return deg*(Math.PI/180);
  }

  isWithinRadius(shopLat, shopLng, customerLat, customerLng, radiusKm=5){
    try{
      const distance = this.calculateDistance(shopLat, shopLng, customerLat, customerLng);
      return {
        within:distance.km<=radiusKm,
        distance:distance.km,
        formatted:distance.formatted,
        radius:radiusKm
      };
    }catch(e){
      return { within:true, distance:0, formatted:'0km', radius:radiusKm };
    }
  }

  watchLocation(callback, options={}){
    try{
      if(!navigator.geolocation){
        throw new Error('Geolocation not supported');
      }

      this.watchId = navigator.geolocation.watchPosition(
        (position)=>{
          const location = {
            lat:position.coords.latitude,
            lng:position.coords.longitude,
            accuracy:position.coords.accuracy,
            timestamp:position.timestamp
          };
          this.currentLocation = location;
          if(callback) callback(location);
        },
        (error)=>{ console.error('Watch location error:', error); },
        { enableHighAccuracy:true, timeout:10000, maximumAge:0,...options }
      );

      return this.watchId;

    }catch(e){
      return null;
    }
  }

  clearWatch(){
    if(this.watchId!==null && navigator.geolocation){
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  getCurrentCity(){
    try{
      const location = JSON.parse(localStorage.getItem('user_location')||'{}');
      return location.city||'Surat';
    }catch(e){
      return 'Surat';
    }
  }

  getCurrentArea(){
    try{
      const location = JSON.parse(localStorage.getItem('user_location')||'{}');
      return location.area||'Adajan';
    }catch(e){
      return 'Adajan';
    }
  }

  saveLocation(location){
    try{
      localStorage.setItem('user_location', JSON.stringify(location));
      localStorage.setItem('current_lat', location.lat);
      localStorage.setItem('current_lng', location.lng);
      this.currentLocation = location;
      return true;
    }catch(e){
      return false;
    }
  }

  getSavedLocation(){
    try{
      return JSON.parse(localStorage.getItem('user_location')||'null');
    }catch(e){
      return null;
    }
  }
}

window.LocationUtils = new LocationUtils();
window.getCurrentLocation = ()=> window.LocationUtils.getCurrentLocation();
window.calculateDistance = (lat1,lng1,lat2,lng2)=> window.LocationUtils.calculateDistance(lat1,lng1,lat2,lng2);