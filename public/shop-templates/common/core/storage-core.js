// LOCATION: public/shop-templates/common/core/storage-core.js - V8 RAM ONLY - FULL CODE - NO CUT
// RULE: Ye file ab browser me kuch save nahi karegi - Sab Map me RAM me rahega - Page band hua toh sab gaya
// RULE: Bahar se koi file isko bulaye toh usko farak nahi padega - get / set / getCart / setCart / getUser / setUser sab wahi naam hain
// RULE: Cross-tab wala purana rasta band hai - Ab har tab ka apna RAM hai, server hi asli sach hai
class StorageCore {
  constructor(){
    this.prefix = 'lm_';
    this.shopId = new URLSearchParams(location.search).get('shopId') || window.SHOP_ID || window.shopId || '';
    this.memoryCache = new Map();
    this.listeners = new Map();
    this.quota = 5 * 1024 * 1024;
  }
  getKey(key){ return this.shopId ? (this.prefix + this.shopId + '_' + key) : (this.prefix + key); }
  set(key, value, options){
    options = options || {};
    var ttl = options.ttl || null;
    var shopSpecific = options.shopSpecific !== false;
    var finalKey = shopSpecific ? this.getKey(key) : (this.prefix + key);
    var dataToStore = { value: value, timestamp: Date.now(), ttl: ttl, version: 1 };
    this.memoryCache.set(finalKey, dataToStore);
    this.notifyListeners(key, value, 'set');
    return true;
  }
  get(key, defaultValue, options){
    defaultValue = defaultValue === undefined ? null : defaultValue;
    options = options || {};
    var shopSpecific = options.shopSpecific !== false;
    var finalKey = shopSpecific ? this.getKey(key) : (this.prefix + key);
    if(this.memoryCache.has(finalKey)){
      var cached = this.memoryCache.get(finalKey);
      if(this.isExpired(cached)){ this.remove(key, { shopSpecific: shopSpecific }); return defaultValue; }
      return this.extractValue(cached, false);
    }
    return defaultValue;
  }
  extractValue(wrapped){ return wrapped.value !== undefined ? wrapped.value : wrapped; }
  isExpired(wrapped){ if(!wrapped.timestamp || !wrapped.ttl) return false; return Date.now() - wrapped.timestamp > wrapped.ttl; }
  remove(key, options){
    options = options || {};
    var shopSpecific = options.shopSpecific !== false;
    var finalKey = shopSpecific ? this.getKey(key) : (this.prefix + key);
    this.memoryCache.delete(finalKey);
    this.notifyListeners(key, null, 'remove');
  }
  clear(shopSpecificOnly){
    var self = this;
    if(shopSpecificOnly){
      Array.from(this.memoryCache.keys()).forEach(function(k){ if(k.indexOf(self.prefix + self.shopId + '_') === 0) self.memoryCache.delete(k); });
    } else {
      Array.from(this.memoryCache.keys()).forEach(function(k){ if(k.indexOf(self.prefix) === 0) self.memoryCache.delete(k); });
    }
    this.memoryCache.clear();
  }
  setWithExpiry(key, value, ttlMs, options){ options = options || {}; options.ttl = ttlMs; return this.set(key, value, options); }
  getWithExpiry(key, defaultValue){ return this.get(key, defaultValue); }
  getCart(){ return this.get('cart', [], { shopSpecific: true }) || []; }
  setCart(cart){
    this.set('cart', cart, { shopSpecific: true });
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: cart.reduce(function(s,i){ return s + (i.qty || i.quantity || 1); }, 0), cart: cart } }));
  }
  addToCart(product){
    var cart = this.getCart();
    var existing = cart.find(function(item){ return (item._id || item.productId) === (product._id || product.productId); });
    if(existing){ existing.qty = (existing.qty || existing.quantity || 1) + (product.qty || 1); existing.quantity = existing.qty; }
    else { cart.push(Object.assign({}, product, { qty: product.qty || 1, quantity: product.qty || 1, addedAt: Date.now() })); }
    this.setCart(cart);
    return cart;
  }
  removeFromCart(productId){
    var cart = this.getCart();
    cart = cart.filter(function(item){ return (item._id || item.productId) !== productId; });
    this.setCart(cart);
    return cart;
  }
  clearCart(){ this.setCart([]); }
  getWishlist(){ return this.get('wishlist', [], { shopSpecific: false }) || []; }
  setWishlist(list){ this.set('wishlist', list, { shopSpecific: false }); }
  getUser(){ return this.get('user', null, { shopSpecific: false }) || window.currentUser || null; }
  setUser(user){ this.set('user', user, { shopSpecific: false }); if(user) window.currentUser = user; }
  clearUser(){ this.remove('user', { shopSpecific: false }); window.currentUser = null; }
  cacheShopData(data, ttl){ this.set('shopData', data, { ttl: ttl || (5 * 60 * 1000), shopSpecific: true }); }
  getCachedShopData(){ return this.get('shopData', null); }
  onChange(key, callback){ if(!this.listeners.has(key)) this.listeners.set(key, []); this.listeners.get(key).push(callback); }
  offChange(key, callback){ if(this.listeners.has(key)){ var cbs = this.listeners.get(key); this.listeners.set(key, cbs.filter(function(cb){ return cb !== callback; })); } }
  notifyListeners(key, value, action){
    if(this.listeners.has(key)){ this.listeners.get(key).forEach(function(cb){ try{ cb(value, action, key); }catch(e){} }); }
    window.dispatchEvent(new CustomEvent('storage:' + key, { detail: { value: value, action: action, key: key } }));
  }
  handleStorageEvent(e){ return; }
  cleanOldData(){
    var now = Date.now();
    var cleaned = 0;
    var self = this;
    Array.from(this.memoryCache.keys()).forEach(function(k){
      if(k.indexOf(self.prefix) !== 0) return;
      var parsed = self.memoryCache.get(k);
      if(!parsed) return;
      if(parsed.timestamp && parsed.ttl && now - parsed.timestamp > parsed.ttl){ self.memoryCache.delete(k); cleaned++; }
      else if(parsed.timestamp && now - parsed.timestamp > 7 * 24 * 60 * 60 * 1000){ self.memoryCache.delete(k); cleaned++; }
    });
    console.log('Cleaned ' + cleaned + ' old RAM items');
  }
  encrypt(text){ try{ return btoa(encodeURIComponent(text)); }catch(e){ return text; } }
  decrypt(text){ try{ return decodeURIComponent(atob(text)); }catch(e){ return text; } }
  getSize(){
    var total = 0;
    var self = this;
    this.memoryCache.forEach(function(v, k){ if(k.indexOf(self.prefix) === 0) total += JSON.stringify(v).length + k.length; });
    return total;
  }
  getSizeFormatted(){
    var bytes = this.getSize();
    if(bytes < 1024) return bytes + ' B';
    if(bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
  exportData(){
    var data = {};
    var self = this;
    this.memoryCache.forEach(function(v, k){ if(k.indexOf(self.prefix) === 0) data[k] = JSON.stringify(v); });
    return JSON.stringify(data);
  }
  importData(jsonString){
    try{
      var data = JSON.parse(jsonString);
      var self = this;
      Object.entries(data).forEach(function(pair){ var k = pair[0], v = pair[1]; try{ self.memoryCache.set(k, JSON.parse(v)); }catch(e){ self.memoryCache.set(k, { value: v, timestamp: Date.now(), ttl: null }); } });
      return true;
    }catch(e){ return false; }
  }
}
window.StorageCore = new StorageCore();
window.Storage = window.StorageCore;
console.log('StorageCore V8 loaded - RAM only Map, no browser save');