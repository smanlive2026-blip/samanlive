// LOCATION: common/core/user-core.js - WORLD CLASS USER CORE - FULL PRODUCTION GRADE
class UserCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('currentShopId') || '';
    this.user = null;
    this.location = null;
    this.preferences = null;
    this.init();
  }

  async init(){
    this.user = await this.getUser();
    this.location = await this.getLocation();
    this.preferences = this.getPreferences();

    // Auto save location changes
    window.addEventListener('location:updated', (e)=>{
      this.location = e.detail;
    });
  }

  async getUser(){
    if(this.user) return this.user;

    if(window.currentUser) return window.currentUser;

    try{
      const cached = JSON.parse(localStorage.getItem('lm_user') || localStorage.getItem('currentUser') || 'null');
      if(cached){ this.user = cached; window.currentUser = cached; return cached; }
    }catch(e){}

    if(window.ApiCore){
      try{
        const data = await window.ApiCore.get('/api/common/auth/check');
        if(data.success && data.user){
          this.user = data.user;
          window.currentUser = data.user;
          localStorage.setItem('lm_user', JSON.stringify(data.user));
          return data.user;
        }
      }catch(err){}
    }

    return null;
  }

  async requireUser(redirectUrl = '/index.html'){
    const user = await this.getUser();
    if(!user){
      if(window.AuthCore) window.AuthCore.showAuthModal(redirectUrl);
      return false;
    }
    return user;
  }

  getUserId(){
    return this.user?._id || this.user?.id || window.currentUser?._id || null;
  }

  isLoggedIn(){ return!!this.user ||!!window.currentUser; }

  getDisplayName(){
    if(!this.user) return 'Guest';
    return this.user.name || this.user.email?.split('@')[0] || this.user.phone || 'User';
  }

  getAvatar(){
    return this.user?.avatar || `https://i.pravatar.cc/150?u=${this.getUserId()||'guest'}`;
  }

  // Location
  async getLocation(){
    if(this.location) return this.location;

    try{
      if(window.LocationCore && window.LocationCore.getLocation){
        const loc = await window.LocationCore.getLocation();
        if(loc){ this.location = loc; return loc; }
      }

      const cached = JSON.parse(localStorage.getItem('lm_user_location') || localStorage.getItem('userLocation') || 'null');
      if(cached){ this.location = cached; return cached; }

      // Default Surat
      return { lat: 21.1702, lng: 72.8311, address: 'Surat, Gujarat', city: 'Surat', state: 'Gujarat', source: 'default' };
    }catch(e){
      return { lat: 21.1702, lng: 72.8311, address: 'Surat, Gujarat', city: 'Surat', state: 'Gujarat', source: 'default' };
    }
  }

  async setLocation(location){
    this.location = location;
    localStorage.setItem('lm_user_location', JSON.stringify(location));
    localStorage.setItem('userLocation', JSON.stringify(location));
    window.dispatchEvent(new CustomEvent('location:updated', { detail: location }));
    if(window.ApiCore){
      window.ApiCore.post('/api/user/location', location).catch(()=>{});
    }
  }

  async updateLocationFromGPS(){
    if(!navigator.geolocation) throw new Error('Geolocation not supported');

    return new Promise((resolve, reject)=>{
      navigator.geolocation.getCurrentPosition(async (pos)=>{
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, source: 'gps', timestamp: Date.now() };

        // Reverse geocode if LocationCore available
        if(window.LocationCore && window.LocationCore.reverseGeocode){
          try{
            const address = await window.LocationCore.reverseGeocode(loc.lat, loc.lng);
            loc.address = address.fullAddress || address.address || `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
            loc.city = address.city || 'Surat';
            loc.state = address.state || 'Gujarat';
          }catch(e){
            loc.address = `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
          }
        }

        await this.setLocation(loc);
        resolve(loc);
      }, (err)=> reject(err), { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
    });
  }

  // Preferences
  getPreferences(){
    try{
      return JSON.parse(localStorage.getItem('lm_user_prefs') || '{}');
    }catch(e){ return {}; }
  }

  setPreference(key, value){
    const prefs = this.getPreferences();
    prefs[key] = value;
    localStorage.setItem('lm_user_prefs', JSON.stringify(prefs));
    this.preferences = prefs;
    window.dispatchEvent(new CustomEvent('prefs:updated', { detail: { key, value, prefs } }));
  }

  getPreference(key, defaultValue = null){
    const prefs = this.getPreferences();
    return prefs[key]!== undefined? prefs[key] : defaultValue;
  }

  // Addresses
  async getAddresses(){
    try{
      if(window.ApiCore){
        const data = await window.ApiCore.get('/api/user/addresses');
        return data.addresses || [];
      }
      return JSON.parse(localStorage.getItem('lm_user_addresses') || '[]');
    }catch(e){ return []; }
  }

  async addAddress(address){
    try{
      if(window.ApiCore){
        const data = await window.ApiCore.post('/api/user/addresses', address);
        return data.address || data;
      } else {
        const addresses = await this.getAddresses();
        address._id = 'addr_' + Date.now();
        addresses.push(address);
        localStorage.setItem('lm_user_addresses', JSON.stringify(addresses));
        return address;
      }
    }catch(e){ throw e; }
  }

  // Cart helpers
  getCart(){
    if(window.StorageCore) return window.StorageCore.getCart();
    try{
      return JSON.parse(localStorage.getItem(`cart_${this.shopId}`) || localStorage.getItem(`lm_${this.shopId}_cart`) || '[]');
    }catch(e){ return []; }
  }

  getCartCount(){
    const cart = this.getCart();
    return cart.reduce((sum, item)=> sum + (item.qty || item.quantity || 1), 0);
  }

  getCartTotal(){
    const cart = this.getCart();
    return cart.reduce((sum, item)=> sum + ((item.price||0) * (item.qty||item.quantity||1)), 0);
  }

  // Orders
  async getOrders(filters = {}){
    try{
      if(window.ApiCore){
        const data = await window.ApiCore.get('/api/user/orders', filters);
        return data.orders || [];
      }
      return [];
    }catch(e){ return []; }
  }

  async getOrder(orderId){
    try{
      if(window.ApiCore){
        const data = await window.ApiCore.get(`/api/user/orders/${orderId}`);
        return data.order || data;
      }
      return null;
    }catch(e){ return null; }
  }

  // Wishlist
  getWishlist(){
    if(window.StorageCore) return window.StorageCore.getWishlist();
    try{ return JSON.parse(localStorage.getItem('wishlist') || '[]'); }catch(e){ return []; }
  }

  isInWishlist(productId){
    return this.getWishlist().includes(productId);
  }

  // Profile update
  async updateProfile(updates){
    try{
      if(window.ApiCore){
        const data = await window.ApiCore.put('/api/user/profile', updates);
        this.user = {...this.user,...data.user };
        window.currentUser = this.user;
        localStorage.setItem('lm_user', JSON.stringify(this.user));
        return this.user;
      }
      throw new Error('ApiCore not available');
    }catch(e){ throw e; }
  }

  // Logout
  async logout(){
    if(window.AuthCore) return window.AuthCore.logout();

    this.user = null;
    window.currentUser = null;
    localStorage.removeItem('lm_user');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    window.location.href = '/index.html?loggedOut=true';
  }

  // Track user action
  track(action, data = {}){
    if(window.ApiCore) window.ApiCore.trackEvent(`user_${action}`, {...data, userId: this.getUserId(), shopId: this.shopId });
  }
}

window.UserCore = new UserCore();
window.userCore = window.UserCore;