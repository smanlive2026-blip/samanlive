// LOCATION: public/shop-templates/common/core/user-core.js - V6 COMMON CONNECTED - MAIN APP + SHOP OWNER
class UserCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('last_shopId') || localStorage.getItem('shopId') || '';
    this.user = null;
    this.location = null;
    this.init();
  }
  async init(){
    this.user = await this.getUser();
    this.location = await this.getLocation();
    window.currentUser = this.user;
  }
  async getUser(){
    if(this.user) return this.user;
    if(window.currentUser) return window.currentUser;
    // 1. Main app token se
    const token = localStorage.getItem('userToken') || localStorage.getItem('TOKEN');
    if(token){
      try{
        const res = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer '+token } });
        const data = await res.json();
        if(data.success){
          this.user = data.user;
          window.currentUser = data.user;
          try{
            localStorage.setItem('USER_ID', data.user._id);
            localStorage.setItem('USER_NAME', data.user.name);
            localStorage.setItem('lm_user', JSON.stringify(data.user));
          }catch(e){}
          return data.user;
        }
      }catch(e){}
    }
    // 2. Cache
    try{
      const cached = JSON.parse(localStorage.getItem('lm_user')||'null');
      if(cached){ this.user = cached; window.currentUser = cached; return cached; }
    }catch(e){}
    return null;
  }
  getUserId(){ return this.user?._id || window.currentUser?._id || localStorage.getItem('USER_ID') || null; }
  isLoggedIn(){ return !!this.user || !!window.currentUser || !!localStorage.getItem('userToken'); }
  async getLocation(){
    if(this.location) return this.location;
    if(window.currentUserLocation) return window.currentUserLocation;
    try{
      const c = JSON.parse(localStorage.getItem('userLocation')||'null');
      if(c) return c;
    }catch(e){}
    return { lat: 21.1702, lng: 72.8311, city: 'Surat', state: 'Gujarat', address: 'Surat, Gujarat' };
  }
  async getAddresses(){
    try{
      const token = localStorage.getItem('userToken');
      const buyerId = this.getUserId() || 'guest_'+Date.now();
      const headers = { 'x-buyer-id': buyerId };
      if(token) headers['Authorization'] = 'Bearer '+token;
      if(window.ApiCore){
        const data = await window.ApiCore.get(`/api/user/addresses?buyerId=${buyerId}`, {}, { headers });
        return data.addresses || data.data || [];
      }
      const res = await fetch(`/api/user/addresses?buyerId=${buyerId}`, { headers });
      const data = await res.json();
      return data.addresses || [];
    }catch(e){ return []; }
  }
  async addAddress(address){
    const token = localStorage.getItem('userToken');
    const buyerId = this.getUserId() || '';
    const headers = { 'Content-Type': 'application/json', 'x-buyer-id': buyerId };
    if(token) headers['Authorization'] = 'Bearer '+token;
    const res = await fetch('/api/user/addresses', { method: 'POST', headers, body: JSON.stringify(address) });
    const data = await res.json();
    return data;
  }
  getCart(){ 
    if(window.CartCore) return window.CartCore.getCart();
    try{ return JSON.parse(localStorage.getItem(`cart_${this.shopId}`)||'[]'); }catch(e){ return []; }
  }
  getCartCount(){ 
    if(window.CartCore) return window.CartCore.getTotalCount();
    return this.getCart().length;
  }
  getCartTotal(){ 
    if(window.CartCore) return window.CartCore.getTotalAmount();
    return 0;
  }
  async getOrders(){
    try{
      const buyerId = this.getUserId();
      if(!buyerId) return [];
      if(window.ApiCore){
        const data = await window.ApiCore.get(`/api/common/checkout/orders/my?buyerId=${buyerId}`);
        return data.orders||[];
      }
      const res = await fetch(`/api/common/checkout/orders/my?buyerId=${buyerId}`, { headers: { 'x-buyer-id': buyerId } });
      const data = await res.json();
      return data.orders||[];
    }catch(e){ return []; }
  }
  getWishlist(){ try{ return JSON.parse(localStorage.getItem('wishlist')||'[]'); }catch(e){ return []; } }
  async updateProfile(updates){
    const token = localStorage.getItem('userToken');
    const res = await fetch('/api/user/update', { method: 'PUT', headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+token }, body: JSON.stringify(updates) });
    const data = await res.json();
    if(data.success){ this.user = data.user; window.currentUser = data.user; localStorage.setItem('lm_user', JSON.stringify(data.user)); }
    return data;
  }
  async logout(){
    localStorage.removeItem('userToken'); localStorage.removeItem('TOKEN');
    localStorage.removeItem('USER_ID'); localStorage.removeItem('lm_user');
    window.currentUser = null; this.user = null;
    location.href = '/';
  }
}
window.UserCore = new UserCore();
window.userCore = window.UserCore;
console.log('✅ UserCore V6 COMMON CONNECTED - User:', window.UserCore.getUserId()||'Guest');