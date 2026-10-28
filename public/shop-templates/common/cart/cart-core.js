// LOCATION: public/shop-templates/common/cart/cart-core.js - V6.3 WORLD CLASS FINAL - getTotalCount FIX + GUEST + USER MERGE + LAST_SHOP_ID + 3 LAYER SYNC
(function(){
  const API_BASE = window.API_BASE || window.EnvConfig?.API_BASE || window.location.origin;
  const CART_API = `${API_BASE}/api/common/cart`;
  const LS_GUEST = 'guest_id';
  const LS_LAST_SHOP = 'last_shopId';
  const LS_LAST_SUPPLIER = 'last_supplierId';
  const LS_LAST_ROLE = 'last_supplierRole';

  let _cartCache = {}; // { shopId: [items] }
  let _readyResolve;
  window.CartCore = window.CartCore || {};
  window.CartCore.ready = new Promise(r=> _readyResolve = r);

  // ========== BUYER ID - WORLD CLASS 3 LAYER ==========
  function getBuyerId(){
    // Layer 1: Logged user
    try{
      const uid = (window.RoleHierarchy && window.RoleHierarchy.getMyId && window.RoleHierarchy.getMyId()) || window.USER_ID || localStorage.getItem('USER_ID') || '';
      if(uid && String(uid).length>=10){
        const id = String(uid);
        // If ObjectId, prefix user_
        if(id.length===24 && !id.startsWith('user_') && !id.startsWith('guest_')){
          return 'user_' + id;
        }
        if(id.startsWith('user_') || id.startsWith('guest_')) return id;
        return 'user_' + id;
      }
    }catch(e){}

    // Layer 2: Guest from sessionStorage
    try{
      let gid = sessionStorage.getItem(LS_GUEST) || localStorage.getItem(LS_GUEST) || '';
      if(gid) return gid;
      // Create new
      gid = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2,6);
      sessionStorage.setItem(LS_GUEST, gid);
      localStorage.setItem(LS_GUEST, gid);
      return gid;
    }catch(e){
      return 'guest_' + Date.now();
    }
  }

  function getBuyerRole(){
    try{
      if(window.RoleHierarchy && window.RoleHierarchy.getMyRole) return window.RoleHierarchy.getMyRole();
      return localStorage.getItem('USER_ROLE') || 'customer';
    }catch(e){ return 'customer'; }
  }

  function getHeaders(){
    const token = (window.AuthCore && window.AuthCore.getToken && window.AuthCore.getToken()) || localStorage.getItem('TOKEN') || localStorage.getItem('token') || localStorage.getItem('userToken') || '';
    return {
      'Content-Type': 'application/json',
      'x-buyer-id': getBuyerId(),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  function safeStorageGet(key){
    try{ return sessionStorage.getItem(key) || localStorage.getItem(key) || ''; }catch(e){ return ''; }
  }
  function safeStorageSet(key, val){
    try{ sessionStorage.setItem(key, val); }catch(e){}
    try{ localStorage.setItem(key, val); }catch(e){}
  }

  // ========== LOAD CART FROM SERVER + LOCAL BACKUP ==========
  async function loadFromServer(){
    try{
      const buyerId = getBuyerId();
      const res = await fetch(`${CART_API}/list?buyerId=${encodeURIComponent(buyerId)}`, { headers: getHeaders() }).catch(()=>null);
      if(!res || !res.ok){
        // Try local backup
        loadFromBackup();
        return;
      }
      const data = await res.json().catch(()=>({}));
      const carts = data.carts || data.data || data || {};
      
      if(Array.isArray(carts)){
        // Array format -> group by shopId
        _cartCache = {};
        carts.forEach(c=>{
          const sid = c.shopId || c.supplierId || 'unknown';
          _cartCache[sid] = c.items || c.products || [];
          // Backup
          safeStorageSet('cart_bkp_'+sid, JSON.stringify(_cartCache[sid]));
        });
      } else if(typeof carts === 'object'){
        // Object format { shopId: items }
        if(carts.shopId){
          // Single cart
          _cartCache[carts.shopId] = carts.items || [];
          safeStorageSet('cart_bkp_'+carts.shopId, JSON.stringify(_cartCache[carts.shopId]));
        } else {
          _cartCache = carts;
          Object.keys(_cartCache).forEach(sid=>{
            safeStorageSet('cart_bkp_'+sid, JSON.stringify(_cartCache[sid]||[]));
          });
        }
      }
      console.log('✅ CartCore V6 loaded from server:', Object.keys(_cartCache).length, 'shops, buyerId=', buyerId);
    }catch(e){
      console.log('Cart load server fail, using backup', e.message);
      loadFromBackup();
    }
  }

  function loadFromBackup(){
    _cartCache = {};
    try{
      Object.keys(sessionStorage).forEach(k=>{
        if(k.startsWith('cart_bkp_')){
          try{
            const sid = k.replace('cart_bkp_','');
            const items = JSON.parse(sessionStorage.getItem(k)||'[]');
            if(Array.isArray(items) && items.length>0) _cartCache[sid]=items;
          }catch(e){}
        }
      });
      // Also localStorage last items
      const lastShop = safeStorageGet(LS_LAST_SHOP);
      if(lastShop && !_cartCache[lastShop]){
        const bkp = safeStorageGet('cart_bkp_'+lastShop);
        if(bkp){
          try{ const it = JSON.parse(bkp); if(it.length>0) _cartCache[lastShop]=it; }catch(e){}
        }
      }
    }catch(e){}
    console.log('✅ CartCore loaded from backup:', Object.keys(_cartCache).length, 'shops');
  }

  async function syncToServer(shopId){
    const items = _cartCache[shopId] || [];
    const buyerId = getBuyerId();
    const buyerRole = getBuyerRole();
    try{
      await fetch(`${CART_API}/sync`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          buyerId: buyerId,
          buyerRole: buyerRole,
          shopId: shopId,
          supplierId: shopId,
          items: items,
          total: items.reduce((s,i)=> s + Number(i.price||0)*Number(i.qty||1),0)
        })
      }).catch(()=>{});
      safeStorageSet('cart_bkp_'+shopId, JSON.stringify(items));
      safeStorageSet(LS_LAST_SHOP, shopId);
    }catch(e){ console.log('Sync fail', e.message); }
  }

  // ========== PUBLIC API ==========
  window.CartCore.getBuyerId = getBuyerId;
  window.CartCore.getAllCarts = function(){ return { ..._cartCache }; };
  window.CartCore.getCart = function(){
    // Flat all items
    return Object.values(_cartCache).flat();
  };
  window.CartCore.getCartBySupplier = function(supplierId){
    if(!supplierId) return window.CartCore.getCart();
    return _cartCache[supplierId] || _cartCache[String(supplierId)] || [];
  };
  window.CartCore.getCount = function(){
    return Object.values(_cartCache).flat().reduce((s,i)=> s + Number(i.qty||i.quantity||1),0);
  };
  window.CartCore.getTotal = function(shopId){
    const items = shopId ? window.CartCore.getCartBySupplier(shopId) : window.CartCore.getCart();
    return items.reduce((s,i)=> s + Number(i.price||0)*Number(i.qty||1),0);
  };

  // ========== BACKWARD COMPAT FIX - YEHI TERA ERROR FIX HAI ==========
  // Purane code me getTotalCount(), getCartCount(), count sab use ho raha hai
  window.CartCore.getTotalCount = function(){
    try{ return window.CartCore.getCount(); }catch(e){ return 0; }
  };
  window.CartCore.getCartCount = window.CartCore.getTotalCount;
  window.CartCore.getTotalItems = window.CartCore.getTotalCount;
  window.CartCore.getCartTotal = window.CartCore.getTotal;
  window.CartCore.count = window.CartCore.getTotalCount;
  window.CartCore.totalCount = window.CartCore.getTotalCount;
  // Extra safe: direct property
  Object.defineProperty(window.CartCore, 'totalCountValue', {
    get(){ try{ return window.CartCore.getCount(); }catch(e){ return 0; } }
  });

  window.CartCore.add = async function(product, qty=1){
    if(!product) return false;
    const shopId = product.shopId || product.shop_id || product.ownerId || product._id || 'unknown_shop';
    const pid = product.productId || product._id || product.id || String(Date.now());
    
    if(!_cartCache[shopId]) _cartCache[shopId]=[];
    
    const idx = _cartCache[shopId].findIndex(it=> (it.productId||it._id||it.id)===pid);
    if(idx>=0){
      const cur = Number(_cartCache[shopId][idx].qty||_cartCache[shopId][idx].quantity||1);
      _cartCache[shopId][idx].qty = cur + Number(qty);
      _cartCache[shopId][idx].quantity = cur + Number(qty);
    } else {
      _cartCache[shopId].push({
        productId: pid,
        _id: pid,
        name: product.name||product.title||'Product',
        title: product.name||product.title||'Product',
        price: Number(product.price||0),
        mrp: Number(product.mrp||0),
        image: product.thumbnail||product.image|| (Array.isArray(product.images)?product.images[0]?.url: product.images?.[0]) || '/assets/default-product.png',
        thumbnail: product.thumbnail||product.image||'/assets/default-product.png',
        unit: product.unit||'pcs',
        qty: Number(qty),
        quantity: Number(qty),
        shopId: shopId,
        shopName: product.shopName||product.shopType||'Shop',
        ownerId: product.ownerId||shopId,
        ownerRole: product.ownerRole||product.shopOwnerRole||'shop_owner',
        shopType: product.shopType||'general',
        variant: product.variant||''
      });
    }

    // Save last shop info - MAIN APP BUG FIX
    safeStorageSet(LS_LAST_SHOP, shopId);
    safeStorageSet(LS_LAST_SUPPLIER, shopId);
    safeStorageSet(LS_LAST_ROLE, product.ownerRole||'shop_owner');
    safeStorageSet('last_product', JSON.stringify(product));

    console.log(`✅ CartCore add: ${product.name||pid} x${qty} to shop ${shopId}, total shops ${Object.keys(_cartCache).length}`);
    await syncToServer(shopId);
    if(window.CartCount && window.CartCount.update) window.CartCount.update();
    try{ window.dispatchEvent(new CustomEvent('cart:updated', {detail:{count: window.CartCore.getTotalCount()}})); }catch(e){}
    return true;
  };

  window.CartCore.updateQty = async function(shopId, productId, delta){
    if(!_cartCache[shopId]) return;
    const idx = _cartCache[shopId].findIndex(it=> (it.productId||it._id)===productId);
    if(idx<0) return;
    const cur = Number(_cartCache[shopId][idx].qty||1);
    const next = cur + Number(delta);
    if(next<=0){
      _cartCache[shopId].splice(idx,1);
    } else {
      _cartCache[shopId][idx].qty = next;
      _cartCache[shopId][idx].quantity = next;
    }
    if(_cartCache[shopId].length===0) delete _cartCache[shopId];
    await syncToServer(shopId);
    if(window.CartCount && window.CartCount.update) window.CartCount.update();
    try{ window.dispatchEvent(new CustomEvent('cart:updated', {detail:{count: window.CartCore.getTotalCount()}})); }catch(e){}
  };

  window.CartCore.remove = async function(shopId, productId){
    if(!_cartCache[shopId]) return;
    _cartCache[shopId] = _cartCache[shopId].filter(it=> (it.productId||it._id)!==productId);
    if(_cartCache[shopId].length===0) delete _cartCache[shopId];
    await syncToServer(shopId);
    if(window.CartCount && window.CartCount.update) window.CartCount.update();
    try{ window.dispatchEvent(new CustomEvent('cart:updated', {detail:{count: window.CartCore.getTotalCount()}})); }catch(e){}
  };

  window.CartCore.clear = async function(shopId){
    if(shopId){
      delete _cartCache[shopId];
      try{ sessionStorage.removeItem('cart_bkp_'+shopId); localStorage.removeItem('cart_bkp_'+shopId); }catch(e){}
      await syncToServer(shopId);
      try{
        await fetch(`${CART_API}/clear/${encodeURIComponent(shopId)}?buyerId=${encodeURIComponent(getBuyerId())}`, { method: 'DELETE', headers: getHeaders() }).catch(()=>{});
      }catch(e){}
    } else {
      const keys = Object.keys(_cartCache);
      _cartCache = {};
      keys.forEach(k=>{ try{ sessionStorage.removeItem('cart_bkp_'+k); }catch(e){} });
      try{
        await fetch(`${CART_API}/clear-all?buyerId=${encodeURIComponent(getBuyerId())}`, { method: 'DELETE', headers: getHeaders() }).catch(()=>{});
      }catch(e){}
    }
    if(window.CartCount && window.CartCount.update) window.CartCount.update();
    try{ window.dispatchEvent(new CustomEvent('cart:updated', {detail:{count: 0}})); }catch(e){}
  };

  window.CartCore.goToCart = function(shopId){
    const sid = shopId || safeStorageGet(LS_LAST_SHOP) || Object.keys(_cartCache)[0] || '';
    location.href = `/shop-templates/common/cart/cart.html?shopId=${encodeURIComponent(sid)}`;
  };
  window.CartCore.goToCheckout = function(shopId){
    const sid = shopId || safeStorageGet(LS_LAST_SHOP) || Object.keys(_cartCache)[0] || '';
    const role = safeStorageGet(LS_LAST_ROLE) || 'shop_owner';
    location.href = `/shop-templates/common/checkout/checkout.html?shopId=${encodeURIComponent(sid)}&supplierId=${encodeURIComponent(sid)}&supplierRole=${encodeURIComponent(role)}`;
  };

  // Init
  (async function(){
    await loadFromServer();
    _readyResolve(true);
    if(window.CartCount && window.CartCount.update) window.CartCount.update();
  })();

  console.log('✅ CartCore V6.3 WORLD CLASS FINAL - getTotalCount FIXED - buyerId=', getBuyerId());
})();