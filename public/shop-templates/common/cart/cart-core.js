// LOCATION: public/shop-templates/common/cart/cart-core.js - V2 SERVER CART - MINIMAL localStorage
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
    return token? { 'Authorization': `Bearer ${token}` } : {};
  }

  function getBuyerInfo(){
    return {
      buyerId: window.RoleHierarchy.getMyId() || 'guest_' + (window.USER_IP || '0'),
      buyerRole: window.RoleHierarchy.getMyRole(),
      buyerShopId: window.RoleHierarchy.getMyShopId()
    };
  }

  function getSupplierInfo(product){
    // product me ye fields honi chahiye - product-manager.js se ayenge
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
        headers: { 'Content-Type': 'application/json',...getAuthHeaders() },
        body: JSON.stringify({
          buyerId: buyer.buyerId,
          buyerRole: buyer.buyerRole,
          supplierId: supplierId,
          items: items
        })
      });
    } catch(e){ console.warn('Cart sync failed, using memory:', e.message); }
    // Backup only if needed - minimal use
    try {
      const key = `cart_bkp_${supplierId}`;
      sessionStorage.setItem(key, JSON.stringify(items)); // localStorage nahi, sessionStorage
    } catch(e){}
  }

  window.CartCore = {
    // Product add - main function
    async add(product, qty = 1){
      const buyer = getBuyerInfo();
      const supplier = getSupplierInfo(product);

      // 1. Role check
      if (!window.RoleHierarchy.canBuy(buyer.buyerRole, supplier.supplierRole, buyer.buyerId, supplier.supplierId)) {
        const msg = buyer.buyerRole === 'shop_owner'? 'Aap is shop se nahi kharid sakte (same level)' : `Aap ${supplier.supplierRole} se nahi kharid sakte`;
        if (window.Toast) Toast.error(msg); else alert(msg);
        return false;
      }

      // 2. Self-buy block - shop_owner apni hi shop ka product add na kare
      if (buyer.buyerShopId && supplier.supplierId && buyer.buyerShopId === supplier.supplierId) {
        if (window.Toast) Toast.error('Aap apni hi dukan ka saman nahi kharid sakte');
        else alert('Self-buy blocked');
        return false;
      }

      // 3. Cart me add - memory me
      const supId = supplier.supplierId;
      if (!memoryCart[supId]) memoryCart[supId] = [];

      const existing = memoryCart[supId].find(i => i.productId === (product._id || product.id));
      if (existing) {
        existing.qty += qty;
      } else {
        memoryCart[supId].push({
          productId: product._id || product.id,
          name: product.name || product.title,
          price: product.price || product.sellingPrice || 0,
          image: product.image || product.images?.[0] || '',
          qty: qty,
          ownerRole: supplier.supplierRole,
          ownerId: supplier.supplierId,
          shopId: supplier.shopId,
          addedAt: Date.now()
        });
      }

      // 4. Server sync + badge update
      await syncToServer(supId, memoryCart[supId]);
      this.emitUpdate();
      if (window.Toast) Toast.success(`${product.name} cart me add hua`);
      return true;
    },

    getCart(supplierId){
      if (supplierId) return memoryCart[supplierId] || [];
      // Agar supplierId nahi diya toh sabka combined
      return Object.values(memoryCart).flat();
    },

    getCartBySupplier(supplierId){
      return memoryCart[supplierId] || [];
    },

    getAllCarts(){
      return memoryCart; // { supplierId: [items] }
    },

    getTotalCount(){
      return Object.values(memoryCart).flat().reduce((s,i)=> s + (i.qty||1), 0);
    },

    getTotalAmount(supplierId){
      const items = supplierId? this.getCart(supplierId) : this.getCart();
      return items.reduce((s,i)=> s + (i.price * i.qty), 0);
    },

    async remove(productId, supplierId){
      if (supplierId) {
        memoryCart[supplierId] = (memoryCart[supplierId]||[]).filter(i=> i.productId!== productId);
        await syncToServer(supplierId, memoryCart[supplierId]);
      } else {
        for (let sid in memoryCart){
          memoryCart[sid] = memoryCart[sid].filter(i=> i.productId!== productId);
          await syncToServer(sid, memoryCart[sid]);
        }
      }
      this.emitUpdate();
    },

    async updateQty(productId, newQty, supplierId){
      if (newQty < 1) return this.remove(productId, supplierId);
      const search = (arr)=> {
        const it = arr.find(i=> i.productId===productId);
        if(it) it.qty = newQty;
      };
      if (supplierId) search(memoryCart[supplierId]||[]);
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
      }
      this.emitUpdate();
      // Server clear bhi
      try {
        await fetch(getApiBase() + API.clear, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json',...getAuthHeaders() },
          body: JSON.stringify({ buyerId: getBuyerInfo().buyerId, supplierId })
        });
      } catch(e){}
    },

    // Server se cart restore - page load pe
    async restore(){
      try {
        const buyer = getBuyerInfo();
        const res = await fetch(getApiBase() + `${API.get}?buyerId=${buyer.buyerId}`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success && data.carts) {
          memoryCart = data.carts; // server format: {supplierId: [items]}
          // sessionStorage backup se bhi merge agar server empty
          if (Object.keys(memoryCart).length === 0){
            for(let i=0;i<sessionStorage.length;i++){
              const key = sessionStorage.key(i);
              if(key && key.startsWith('cart_bkp_')){
                const sid = key.replace('cart_bkp_','');
                try { memoryCart[sid] = JSON.parse(sessionStorage.getItem(key)); } catch(e){}
              }
            }
          }
          this.emitUpdate();
        }
      } catch(e){ console.log('Cart restore skip:', e.message); }
    },

    emitUpdate(){
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: this.getTotalCount(), carts: memoryCart } }));
      // cart-count.js sunega
      if (window.CartCount && window.CartCount.update) window.CartCount.update();
    }
  };

  // Auto restore on load
  document.addEventListener('DOMContentLoaded', ()=> {
    setTimeout(()=> window.CartCore.restore(), 500);
  });

  console.log('✅ CartCore V2 Server Cart loaded');
})();