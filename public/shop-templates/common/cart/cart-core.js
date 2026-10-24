// LOCATION: public/shop-templates/common/cart/cart-core.js - V3 SERVER CART - FIXED - NO localStorage
// Depends: role-hierarchy.js, api-core.js, storage-core.js
(function(){
  const API = {
    sync: '/api/common/cart/sync',
    get: '/api/common/cart',
    clear: '/api/common/cart/clear'
  };

  // Memory cache - localStorage ki jagah
  let memoryCart = {}; // { supplierId: [items] }

  function getApiBase(){
    return window.API_BASE || window.EnvConfig?.API_BASE || window.location.origin;
  }

  function getAuthHeaders(){
    const token = (window.AuthCore && window.AuthCore.getToken && window.AuthCore.getToken()) || localStorage.getItem('TOKEN') || localStorage.getItem('token') || '';
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // FIX 1: Stable guest_id - har reload pe naya guest nahi banega
  function getBuyerInfo(){
    let gid = sessionStorage.getItem('guest_id');
    if(!gid){
      gid = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2,5);
      try{ sessionStorage.setItem('guest_id', gid); }catch(e){}
    }
    const rh = window.RoleHierarchy;
    return {
      buyerId: (rh && rh.getMyId && rh.getMyId()) || gid,
      buyerRole: (rh && rh.getMyRole && rh.getMyRole()) || 'customer',
      buyerShopId: (rh && rh.getMyShopId && rh.getMyShopId()) || null
    };
  }

  function getSupplierInfo(product){
    return {
      supplierId: product.ownerId || product.shopId || product.shop_id || product.supplierId || 'unknown',
      supplierRole: product.ownerRole || product.shopOwnerRole || product.supplierRole || 'shop_owner',
      supplierName: product.shopName || product.ownerName || 'Shop',
      shopId: product.shopId || product.shop_id || null
    };
  }

  async function syncToServer(supplierId, items){
    try {
      const buyer = getBuyerInfo();
      await fetch(getApiBase() + API.sync, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          buyerId: buyer.buyerId,
          buyerRole: buyer.buyerRole,
          supplierId: supplierId,
          items: items
        })
      });
    } catch(e){ console.warn('Cart sync failed, using memory:', e.message); }
    try {
      const key = `cart_bkp_${supplierId}`;
      sessionStorage.setItem(key, JSON.stringify(items));
    } catch(e){}
  }

  window.CartCore = {
    async add(product, qty = 1){
      const buyer = getBuyerInfo();
      const supplier = getSupplierInfo(product);

      if (window.RoleHierarchy && !window.RoleHierarchy.canBuy(buyer.buyerRole, supplier.supplierRole, buyer.buyerId, supplier.supplierId)) {
        const msg = buyer.buyerRole === 'shop_owner' ? 'Aap is shop se nahi kharid sakte (same level)' : `Aap ${supplier.supplierRole} se nahi kharid sakte`;
        if (window.Toast) Toast.error(msg); else alert(msg);
        return false;
      }

      if (buyer.buyerShopId && supplier.supplierId && buyer.buyerShopId === supplier.supplierId) {
        if (window.Toast) Toast.error('Aap apni hi dukan ka saman nahi kharid sakte');
        else alert('Self-buy blocked');
        return false;
      }

      const supId = supplier.supplierId;
      if (!memoryCart[supId]) memoryCart[supId] = [];

      const pid = product._id || product.id;
      const existing = memoryCart[supId].find(i => i.productId === pid);
      if (existing) {
        existing.qty += qty;
      } else {
        memoryCart[supId].push({
          productId: pid,
          name: product.name || product.title,
          price: product.price || product.sellingPrice || 0,
          image: product.image || product.images?.[0] || '',
          qty: qty,
          unit: product.unit || '',
          ownerRole: supplier.supplierRole,
          ownerId: supplier.supplierId,
          shopId: supplier.shopId,
          shopName: supplier.supplierName,
          addedAt: Date.now()
        });
      }

      await syncToServer(supId, memoryCart[supId]);
      this.emitUpdate();
      if (window.Toast) Toast.success(`${product.name || 'Product'} cart me add hua`);
      return true;
    },

    getCart(supplierId){
      if (supplierId) return memoryCart[supplierId] || [];
      return Object.values(memoryCart).flat();
    },

    getCartBySupplier(supplierId){
      return memoryCart[supplierId] || [];
    },

    getAllCarts(){
      return memoryCart;
    },

    getTotalCount(){
      return Object.values(memoryCart).flat().reduce((s,i)=> s + (i.qty||1), 0);
    },

    getTotalAmount(supplierId){
      const items = supplierId ? this.getCart(supplierId) : this.getCart();
      return items.reduce((s,i)=> s + (i.price * i.qty), 0);
    },

    async remove(productId, supplierId){
      if (supplierId) {
        memoryCart[supplierId] = (memoryCart[supplierId]||[]).filter(i=> i.productId !== productId);
        await syncToServer(supplierId, memoryCart[supplierId]);
      } else {
        for (let sid in memoryCart){
          memoryCart[sid] = memoryCart[sid].filter(i=> i.productId !== productId);
          await syncToServer(sid, memoryCart[sid]);
        }
      }
      this.emitUpdate();
    },

    async updateQty(productId, newQty, supplierId){
      if (newQty < 1) return this.remove(productId, supplierId);
      const search = (arr)=> {
        const it = (arr||[]).find(i=> i.productId === productId);
        if(it) it.qty = newQty;
      };
      if (supplierId) search(memoryCart[supplierId]);
      else Object.values(memoryCart).forEach(search);

      if (supplierId) await syncToServer(supplierId, memoryCart[supplierId]);
      else {
        for(let sid in memoryCart) await syncToServer(sid, memoryCart[sid]);
      }
      this.emitUpdate();
    },

    async clear(supplierId){
      if (supplierId){
        memoryCart[supplierId] = [];
        await syncToServer(supplierId, []);
      } else {
        for(let sid in memoryCart){
          memoryCart[sid] = [];
          await syncToServer(sid, []);
        }
        memoryCart = {};
        try{
          Object.keys(sessionStorage).forEach(k=>{
            if(k.startsWith('cart_bkp_')) sessionStorage.removeItem(k);
          });
        }catch(e){}
      }
      this.emitUpdate();
      try {
        await fetch(getApiBase() + API.clear, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ buyerId: getBuyerInfo().buyerId, supplierId: supplierId || null })
        });
      } catch(e){}
    },

    async restore(){
      try {
        const buyer = getBuyerInfo();
        const res = await fetch(getApiBase() + `${API.get}?buyerId=${encodeURIComponent(buyer.buyerId)}`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success && data.carts && Object.keys(data.carts).length > 0) {
          memoryCart = data.carts;
        } else {
          // Server empty -> sessionStorage backup se restore
          let restored = {};
          try{
            for(let i=0;i<sessionStorage.length;i++){
              const key = sessionStorage.key(i);
              if(key && key.startsWith('cart_bkp_')){
                const sid = key.replace('cart_bkp_','');
                restored[sid] = JSON.parse(sessionStorage.getItem(key) || '[]');
              }
            }
            if(Object.keys(restored).length > 0) memoryCart = restored;
          }catch(e){}
        }
        this.emitUpdate();
      } catch(e){ console.log('Cart restore skip:', e.message); }
    },

    emitUpdate(){
      const count = this.getTotalCount();
      const total = this.getTotalAmount();
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count, total, carts: memoryCart, items: this.getCart() } }));
      if (window.CartCount && window.CartCount.update) window.CartCount.update();
    },

    // FIX 2: cart getter - drawer aur cart.html isi ko dhundh rahe the
    get cart(){
      const all = Object.values(memoryCart).flat();
      const total = all.reduce((s,i)=> s + (i.price * i.qty), 0);
      const count = all.reduce((s,i)=> s + (i.qty||0), 0);
      return { items: all, total, count, bySupplier: memoryCart, totalAmount: total };
    },

    // FIX 3: Navigation helpers - drawer me missing the
    goToCheckout(supplierId){
      const buyer = getBuyerInfo();
      const sid = supplierId || Object.keys(memoryCart)[0] || 'unknown';
      const url = `/shop-templates/common/checkout/checkout.html?supplierId=${encodeURIComponent(sid)}&buyerId=${encodeURIComponent(buyer.buyerId)}&role=${encodeURIComponent(buyer.buyerRole)}`;
      window.location.href = url;
    },

    goToCart(){
      const sid = Object.keys(memoryCart)[0] || '';
      window.location.href = `/shop-templates/common/cart/cart.html?supplierId=${encodeURIComponent(sid)}`;
    },

    // For compatibility
    onChange(cb){
      window.addEventListener('cart:updated', (e)=>{
        const cartData = this.cart;
        cb(cartData);
      });
    },

    ready: null
  };

  // ready promise
  window.CartCore.ready = new Promise((resolve)=>{
    document.addEventListener('DOMContentLoaded', ()=> {
      setTimeout(async ()=>{
        await window.CartCore.restore();
        resolve(window.CartCore.cart);
      }, 500);
    });
    // Agar DOM already loaded
    if(document.readyState !== 'loading'){
      setTimeout(async ()=>{
        await window.CartCore.restore();
        resolve(window.CartCore.cart);
      }, 500);
    }
  });

  console.log('✅ CartCore V3 Fixed loaded - cart getter + stable guest + nav');
})();