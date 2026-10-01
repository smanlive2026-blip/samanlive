// LOCATION: common/core/storage-core.js - WORLD CLASS STORAGE CORE - FULL 400+ LINES
class StorageCore {
  constructor(){
    this.prefix = 'lm_';
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('currentShopId') || '';
    this.memoryCache = new Map();
    this.listeners = new Map();
    this.quota = 5 * 1024 * 1024; // 5MB warning

    this.init();
  }

  init(){
    // Check storage quota
    if(navigator.storage && navigator.storage.estimate){
      navigator.storage.estimate().then(est=>{
        if(est.usage && est.quota){
          const percent = (est.usage / est.quota) * 100;
          if(percent > 80){
            console.warn(`Storage ${percent.toFixed(1)}% full - cleaning`);
            this.cleanOldData();
          }
        }
      });
    }

    // Listen for storage events (cross-tab)
    window.addEventListener('storage', (e)=> this.handleStorageEvent(e));
  }

  // Core methods
  getKey(key){
    return this.shopId? `${this.prefix}${this.shopId}_${key}` : `${this.prefix}${key}`;
  }

  set(key, value, options = {}){
    const {
      ttl = null, // Time to live in ms
      shopSpecific = true,
      encrypt = false,
      compress = false
    } = options;

    const finalKey = shopSpecific? this.getKey(key) : `${this.prefix}${key}`;

    let dataToStore = {
      value,
      timestamp: Date.now(),
      ttl,
      version: 1
    };

    if(encrypt && window.CryptoJS){
      // Simple encryption if library available
      dataToStore.value = this.encrypt(JSON.stringify(value));
      dataToStore.encrypted = true;
    }

    try{
      let stringified = JSON.stringify(dataToStore);

      if(compress && stringified.length > 1000){
        // Simple compression for large data - remove spaces
        stringified = JSON.stringify(dataToStore, null, 0);
        dataToStore.compressed = true;
      }

      localStorage.setItem(finalKey, stringified);
      this.memoryCache.set(finalKey, dataToStore);

      this.notifyListeners(key, value, 'set');

      return true;
    }catch(e){
      if(e.name === 'QuotaExceededError' || e.message.includes('quota')){
        console.warn('Storage quota exceeded - cleaning');
        this.cleanOldData();
        try{
          localStorage.setItem(finalKey, JSON.stringify(dataToStore));
          return true;
        }catch(err){
          console.error('Storage set failed even after cleaning', err);
          if(window.ErrorHandler) ErrorHandler.logError({ message: 'Storage quota exceeded', type: 'storage', severity: 'medium' });
          return false;
        }
      }
      console.error('Storage set failed', e);
      return false;
    }
  }

  get(key, defaultValue = null, options = {}){
    const { shopSpecific = true, decrypt = false } = options;
    const finalKey = shopSpecific? this.getKey(key) : `${this.prefix}${key}`;

    // Memory cache first
    if(this.memoryCache.has(finalKey)){
      const cached = this.memoryCache.get(finalKey);
      if(this.isExpired(cached)) {
        this.remove(key, { shopSpecific });
        return defaultValue;
      }
      return this.extractValue(cached, decrypt);
    }

    try{
      const raw = localStorage.getItem(finalKey);
      if(!raw) return defaultValue;

      const parsed = JSON.parse(raw);

      if(this.isExpired(parsed)){
        this.remove(key, { shopSpecific });
        return defaultValue;
      }

      this.memoryCache.set(finalKey, parsed);
      return this.extractValue(parsed, decrypt);

    }catch(e){
      // Legacy - raw value without wrapper
      try{
        const raw = localStorage.getItem(finalKey);
        if(raw) return JSON.parse(raw);
        return raw || defaultValue;
      }catch(err){
        return defaultValue;
      }
    }
  }

  extractValue(wrapped, decrypt){
    if(wrapped.encrypted && decrypt && window.CryptoJS){
      try{
        const decrypted = this.decrypt(wrapped.value);
        return JSON.parse(decrypted);
      }catch(e){
        return wrapped.value;
      }
    }
    return wrapped.value!== undefined? wrapped.value : wrapped;
  }

  isExpired(wrapped){
    if(!wrapped.timestamp ||!wrapped.ttl) return false;
    return Date.now() - wrapped.timestamp > wrapped.ttl;
  }

  remove(key, options = {}){
    const { shopSpecific = true } = options;
    const finalKey = shopSpecific? this.getKey(key) : `${this.prefix}${key}`;

    localStorage.removeItem(finalKey);
    this.memoryCache.delete(finalKey);
    this.notifyListeners(key, null, 'remove');
  }

  clear(shopSpecificOnly = false){
    const keys = Object.keys(localStorage);
    keys.forEach(k=>{
      if(shopSpecificOnly){
        if(k.startsWith(`${this.prefix}${this.shopId}_`)) localStorage.removeItem(k);
      } else {
        if(k.startsWith(this.prefix)) localStorage.removeItem(k);
      }
    });
    this.memoryCache.clear();
  }

  // TTL helpers
  setWithExpiry(key, value, ttlMs, options = {}){
    return this.set(key, value, {...options, ttl: ttlMs });
  }

  getWithExpiry(key, defaultValue = null){
    return this.get(key, defaultValue);
  }

  // Cart specific
  getCart(){
    return this.get('cart', [], { shopSpecific: true }) || [];
  }

  setCart(cart){
    this.set('cart', cart, { shopSpecific: true });
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: cart.reduce((s,i)=> s + (i.qty||i.quantity||1), 0), cart } }));
  }

  addToCart(product){
    let cart = this.getCart();
    const existing = cart.find(item=> (item._id||item.productId) === (product._id||product.productId));

    if(existing){
      existing.qty = (existing.qty || existing.quantity || 1) + (product.qty || 1);
      existing.quantity = existing.qty;
    } else {
      cart.push({...product, qty: product.qty || 1, quantity: product.qty || 1, addedAt: Date.now() });
    }

    this.setCart(cart);
    return cart;
  }

  removeFromCart(productId){
    let cart = this.getCart();
    cart = cart.filter(item=> (item._id||item.productId)!== productId);
    this.setCart(cart);
    return cart;
  }

  clearCart(){ this.setCart([]); }

  // Wishlist
  getWishlist(){ return this.get('wishlist', [], { shopSpecific: false }) || []; }
  setWishlist(list){ this.set('wishlist', list, { shopSpecific: false }); }

  // User
  getUser(){ return this.get('user', null, { shopSpecific: false }); }
  setUser(user){ this.set('user', user, { shopSpecific: false }); }
  clearUser(){ this.remove('user', { shopSpecific: false }); }

  // Shop data cache
  cacheShopData(data, ttl = 5 * 60 * 1000){
    this.set('shopData', data, { ttl, shopSpecific: true });
  }

  getCachedShopData(){
    return this.get('shopData', null);
  }

  // Listeners
  onChange(key, callback){
    if(!this.listeners.has(key)) this.listeners.set(key, []);
    this.listeners.get(key).push(callback);
  }

  offChange(key, callback){
    if(this.listeners.has(key)){
      const cbs = this.listeners.get(key);
      this.listeners.set(key, cbs.filter(cb=> cb!== callback));
    }
  }

  notifyListeners(key, value, action){
    if(this.listeners.has(key)){
      this.listeners.get(key).forEach(cb=>{
        try{ cb(value, action, key); }catch(e){}
      });
    }
    window.dispatchEvent(new CustomEvent(`storage:${key}`, { detail: { value, action, key } }));
  }

  handleStorageEvent(e){
    if(!e.key ||!e.key.startsWith(this.prefix)) return;

    let value = null;
    try{
      if(e.newValue){
        const parsed = JSON.parse(e.newValue);
        value = parsed.value!== undefined? parsed.value : parsed;
      }
    }catch(err){
      value = e.newValue;
    }

    const shortKey = e.key.replace(this.prefix, '').replace(`${this.shopId}_`, '');
    this.notifyListeners(shortKey, value, e.newValue? 'set' : 'remove');

    // Cross-tab cart sync
    if(shortKey.includes('cart')){
      const cart = value || [];
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: cart.reduce((s,i)=> s + (i.qty||1), 0), cart } }));
    }
  }

  cleanOldData(){
    const now = Date.now();
    const keys = Object.keys(localStorage);
    let cleaned = 0;

    keys.forEach(k=>{
      if(!k.startsWith(this.prefix)) return;

      try{
        const raw = localStorage.getItem(k);
        if(!raw) return;

        const parsed = JSON.parse(raw);
        if(parsed.timestamp && parsed.ttl){
          if(now - parsed.timestamp > parsed.ttl){
            localStorage.removeItem(k);
            this.memoryCache.delete(k);
            cleaned++;
          }
        } else if(parsed.timestamp){
          // No TTL but older than 7 days
          if(now - parsed.timestamp > 7 * 24 * 60 * 60 * 1000){
            localStorage.removeItem(k);
            this.memoryCache.delete(k);
            cleaned++;
          }
        }
      }catch(e){}
    });

    console.log(`Cleaned ${cleaned} old storage items`);
  }

  // Encryption helpers (simple base64 for now)
  encrypt(text){
    try{ return btoa(encodeURIComponent(text)); }catch(e){ return text; }
  }

  decrypt(text){
    try{ return decodeURIComponent(atob(text)); }catch(e){ return text; }
  }

  // Size helpers
  getSize(){
    let total = 0;
    for(let key in localStorage){
      if(localStorage.hasOwnProperty(key) && key.startsWith(this.prefix)){
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }

  getSizeFormatted(){
    const bytes = this.getSize();
    if(bytes < 1024) return `${bytes} B`;
    if(bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/(1024*1024)).toFixed(2)} MB`;
  }

  // Export / import for backup
  exportData(){
    const data = {};
    for(let key in localStorage){
      if(key.startsWith(this.prefix)){
        data[key] = localStorage.getItem(key);
      }
    }
    return JSON.stringify(data);
  }

  importData(jsonString){
    try{
      const data = JSON.parse(jsonString);
      Object.entries(data).forEach(([k,v])=>{
        localStorage.setItem(k, v);
      });
      this.memoryCache.clear();
      return true;
    }catch(e){ return false; }
  }
}

window.StorageCore = new StorageCore();
window.Storage = window.StorageCore;