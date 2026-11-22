// LOCATION: public/shop-templates/common/cart/cart-core.js - V7 RAM ONLY - FULL CODE - NO CUT
// RULE: Cart sirf Server + RAM me rahega - Browser me kahin save nahi hoga
// RULE: Buyer ID ek hi jagah se banega - Yahi ID Checkout / UserCore / Profile sab use karenge
// RULE: Purane naam sab wahi hain - getBuyerId / getCart / getCartBySupplier / getCount / getTotal / add / updateQty / remove / clear / goToCart / goToCheckout
(function(){
  var API_BASE = window.API_BASE || (window.EnvConfig && window.EnvConfig.API_BASE) || window.location.origin;
  var CART_API = API_BASE + '/api/common/cart';
  var _cartCache = {};
  var _guestId = '';
  var _lastShopId = '';
  var _lastSupplierId = '';
  var _lastRole = 'shop_owner';
  var _readyResolve;
  window.CartCore = window.CartCore || {};
  window.CartCore.ready = new Promise(function(r){ _readyResolve = r; });

  function getBuyerId(){
    try{
      var uid = (window.RoleHierarchy && window.RoleHierarchy.getMyId && window.RoleHierarchy.getMyId()) || window.USER_ID || (window.AuthCore && window.AuthCore.getUserId && window.AuthCore.getUserId()) || (window.currentUser && window.currentUser._id) || '';
      if(uid && String(uid).length >= 10){
        var id = String(uid);
        if(id.indexOf('user_') === 0 || id.indexOf('guest_') === 0) return id;
        if(id.length === 24) return 'user_' + id;
        return 'user_' + id;
      }
    }catch(e){}
    if(!_guestId){
      _guestId = window.__SAMAN_GUEST_ID || ('guest_' + Date.now() + '_' + Math.random().toString(36).substr(2,6));
      window.__SAMAN_GUEST_ID = _guestId;
    }
    return _guestId;
  }
  function getBuyerRole(){
    try{ if(window.RoleHierarchy && window.RoleHierarchy.getMyRole) return window.RoleHierarchy.getMyRole(); }catch(e){}
    try{ if(window.AuthCore && window.AuthCore.getRole) return window.AuthCore.getRole(); }catch(e){}
    return window.USER_ROLE || 'customer';
  }
  function getHeaders(){
    var token = '';
    try{ if(window.AuthCore && window.AuthCore.getToken) token = window.AuthCore.getToken() || ''; }catch(e){}
    if(!token) token = window.USER_TOKEN || '';
    return { 'Content-Type': 'application/json', 'x-buyer-id': getBuyerId(), 'Authorization': token ? ('Bearer ' + token) : '' };
  }
  async function loadFromServer(){
    try{
      var buyerId = getBuyerId();
      var res = await fetch(CART_API + '/list?buyerId=' + encodeURIComponent(buyerId), { headers: getHeaders() }).catch(function(){ return null; });
      if(!res || !res.ok) return;
      var data = await res.json().catch(function(){ return {}; });
      var carts = data.carts || data.data || data || {};
      if(Array.isArray(carts)){
        _cartCache = {};
        carts.forEach(function(c){ var sid = c.shopId || c.supplierId || 'unknown'; _cartCache[sid] = c.items || c.products || []; });
      } else if(typeof carts === 'object'){
        if(carts.shopId){ _cartCache[carts.shopId] = carts.items || []; }
        else { _cartCache = carts; }
      }
      console.log('CartCore V7 loaded from server:', Object.keys(_cartCache).length, 'shops, buyerId=', buyerId);
    }catch(e){ console.log('Cart load server fail', e.message); }
  }
  async function syncToServer(shopId){
    var items = _cartCache[shopId] || [];
    var buyerId = getBuyerId();
    var buyerRole = getBuyerRole();
    try{
      await fetch(CART_API + '/sync', { method: 'POST', headers: getHeaders(), body: JSON.stringify({ buyerId: buyerId, buyerRole: buyerRole, shopId: shopId, supplierId: shopId, items: items, total: items.reduce(function(s,i){ return s + Number(i.price||0)*Number(i.qty||1); },0) }) }).catch(function(){});
      _lastShopId = shopId;
      window.__SAMAN_LAST_SHOP = shopId;
    }catch(e){ console.log('Sync fail', e.message); }
  }
  window.CartCore.getBuyerId = getBuyerId;
  window.CartCore.getAllCarts = function(){ return Object.assign({}, _cartCache); };
  window.CartCore.getCart = function(){ return Object.values(_cartCache).flat(); };
  window.CartCore.getCartBySupplier = function(supplierId){ if(!supplierId) return window.CartCore.getCart(); return _cartCache[supplierId] || _cartCache[String(supplierId)] || []; };
  window.CartCore.getCount = function(){ return Object.values(_cartCache).flat().reduce(function(s,i){ return s + Number(i.qty||i.quantity||1); },0); };
  window.CartCore.getTotal = function(shopId){ var items = shopId ? window.CartCore.getCartBySupplier(shopId) : window.CartCore.getCart(); return items.reduce(function(s,i){ return s + Number(i.price||0)*Number(i.qty||1); },0); };
  window.CartCore.getTotalCount = function(){ try{ return window.CartCore.getCount(); }catch(e){ return 0; } };
  window.CartCore.getCartCount = window.CartCore.getTotalCount;
  window.CartCore.getTotalItems = window.CartCore.getTotalCount;
  window.CartCore.getCartTotal = window.CartCore.getTotal;
  window.CartCore.count = window.CartCore.getTotalCount;
  window.CartCore.totalCount = window.CartCore.getTotalCount;
  Object.defineProperty(window.CartCore, 'totalCountValue', { get: function(){ try{ return window.CartCore.getCount(); }catch(e){ return 0; } } });
  window.CartCore.add = async function(product, qty){
    qty = qty || 1;
    if(!product) return false;
    var shopId = product.shopId || product.shop_id || product.ownerId || product._id || 'unknown_shop';
    var pid = product.productId || product._id || product.id || String(Date.now());
    if(!_cartCache[shopId]) _cartCache[shopId] = [];
    var idx = _cartCache[shopId].findIndex(function(it){ return (it.productId||it._id||it.id) === pid; });
    if(idx >= 0){
      var cur = Number(_cartCache[shopId][idx].qty || _cartCache[shopId][idx].quantity || 1);
      _cartCache[shopId][idx].qty = cur + Number(qty);
      _cartCache[shopId][idx].quantity = cur + Number(qty);
    } else {
      _cartCache[shopId].push({ productId: pid, _id: pid, name: product.name||product.title||'Product', title: product.name||product.title||'Product', price: Number(product.price||0), mrp: Number(product.mrp||0), image: product.thumbnail||product.image||(Array.isArray(product.images)?(product.images[0]&&product.images[0].url):product.images&&product.images[0])||'/assets/default-product.png', thumbnail: product.thumbnail||product.image||'/assets/default-product.png', unit: product.unit||'pcs', qty: Number(qty), quantity: Number(qty), shopId: shopId, shopName: product.shopName||product.shopType||'Shop', ownerId: product.ownerId||shopId, ownerRole: product.ownerRole||product.shopOwnerRole||'shop_owner', shopType: product.shopType||'general', variant: product.variant||'' });
    }
    _lastShopId = shopId; _lastSupplierId = shopId; _lastRole = product.ownerRole || 'shop_owner';
    window.__SAMAN_LAST_SHOP = shopId; window.__SAMAN_LAST_SUPPLIER = shopId; window.__SAMAN_LAST_ROLE = _lastRole;
    window.__SAMAN_LAST_PRODUCT = product;
    console.log('CartCore add:', product.name || pid, 'x', qty, 'to shop', shopId);
    await syncToServer(shopId);
    if(window.CartCount && window.CartCount.update) window.CartCount.update();
    try{ window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: window.CartCore.getTotalCount() } })); }catch(e){}
    return true;
  };
  window.CartCore.updateQty = async function(shopId, productId, delta){
    if(!_cartCache[shopId]) return;
    var idx = _cartCache[shopId].findIndex(function(it){ return (it.productId||it._id) === productId; });
    if(idx < 0) return;
    var cur = Number(_cartCache[shopId][idx].qty || 1);
    var next = cur + Number(delta);
    if(next <= 0){ _cartCache[shopId].splice(idx,1); } else { _cartCache[shopId][idx].qty = next; _cartCache[shopId][idx].quantity = next; }
    if(_cartCache[shopId].length === 0) delete _cartCache[shopId];
    await syncToServer(shopId);
    if(window.CartCount && window.CartCount.update) window.CartCount.update();
    try{ window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: window.CartCore.getTotalCount() } })); }catch(e){}
  };
  window.CartCore.remove = async function(shopId, productId){
    if(!_cartCache[shopId]) return;
    _cartCache[shopId] = _cartCache[shopId].filter(function(it){ return (it.productId||it._id) !== productId; });
    if(_cartCache[shopId].length === 0) delete _cartCache[shopId];
    await syncToServer(shopId);
    if(window.CartCount && window.CartCount.update) window.CartCount.update();
    try{ window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: window.CartCore.getTotalCount() } })); }catch(e){}
  };
  window.CartCore.clear = async function(shopId){
    if(shopId){
      delete _cartCache[shopId];
      await syncToServer(shopId);
      try{ await fetch(CART_API + '/clear/' + encodeURIComponent(shopId) + '?buyerId=' + encodeURIComponent(getBuyerId()), { method: 'DELETE', headers: getHeaders() }).catch(function(){}); }catch(e){}
    } else {
      var keys = Object.keys(_cartCache);
      _cartCache = {};
      try{ await fetch(CART_API + '/clear-all?buyerId=' + encodeURIComponent(getBuyerId()), { method: 'DELETE', headers: getHeaders() }).catch(function(){}); }catch(e){}
    }
    if(window.CartCount && window.CartCount.update) window.CartCount.update();
    try{ window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: 0 } })); }catch(e){}
  };
  window.CartCore.goToCart = function(shopId){
    var sid = shopId || _lastShopId || window.__SAMAN_LAST_SHOP || Object.keys(_cartCache)[0] || '';
    location.href = '/shop-templates/common/cart/cart.html?shopId=' + encodeURIComponent(sid);
  };
  window.CartCore.goToCheckout = function(shopId){
    var sid = shopId || _lastShopId || window.__SAMAN_LAST_SHOP || Object.keys(_cartCache)[0] || '';
    var role = _lastRole || window.__SAMAN_LAST_ROLE || 'shop_owner';
    location.href = '/shop-templates/common/checkout/checkout.html?shopId=' + encodeURIComponent(sid) + '&supplierId=' + encodeURIComponent(sid) + '&supplierRole=' + encodeURIComponent(role);
  };
  (async function(){ await loadFromServer(); _readyResolve(true); if(window.CartCount && window.CartCount.update) window.CartCount.update(); })();
  console.log('CartCore V7 loaded - RAM only - buyerId=', getBuyerId());
})();