// LOCATION: public/shop-templates/common/checkout/hierarchy-checkout.js - V6.5 WORLD CLASS FINAL - RACE CONDITION + CART EMPTY FIXED + SUPPLIER ROLE FIXED
(function(){
  const API = {
    checkout: '/api/common/checkout',
    address: '/api/user/addresses',
    commonProfile: '/api/common/profile',
    wallet: '/api/common/wallet/balance'
  };

  function getApiBase(){
    return window.API_BASE || window.EnvConfig?.API_BASE || window.location.origin;
  }

  function getAuthHeaders(){
    const token = (window.AuthCore && window.AuthCore.getToken && window.AuthCore.getToken()) || localStorage.getItem('TOKEN') || localStorage.getItem('token') || localStorage.getItem('userToken') || '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  function getQueryParam(name){
    try{ return new URLSearchParams(window.location.search).get(name); }catch(e){ return null; }
  }

  // ===== BUYER INFO - WORLD CLASS - GUEST + USER + SHOP_OWNER =====
  function getBuyerInfo(){
    let gid = sessionStorage.getItem('guest_id') || localStorage.getItem('guest_id') || '';
    if(!gid){
      gid = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2,5);
      try{ sessionStorage.setItem('guest_id', gid); localStorage.setItem('guest_id', gid); }catch(e){}
    }
    const rh = window.RoleHierarchy;
    let buyerId = (rh && rh.getMyId && rh.getMyId()) || window.USER_ID || localStorage.getItem('USER_ID') || gid;
    let buyerRole = (rh && rh.getMyRole && rh.getMyRole()) || window.USER_ROLE || localStorage.getItem('USER_ROLE') || 'customer';
    let buyerShopId = (rh && rh.getMyShopId && rh.getMyShopId()) || window.MY_SHOP_ID || localStorage.getItem('MY_SHOP_ID') || null;
    let buyerAreaId = window.AreaId || localStorage.getItem('AREA_ID') || null;
    if(!buyerId) buyerId = gid;
    if(buyerId.startsWith('guest_')) buyerRole = 'guest';
    if(!buyerRole) buyerRole = 'customer';
    return { buyerId, buyerRole, buyerShopId, buyerAreaId, guestId: gid };
  }

  // ===== SUPPLIER INFO - WORLD CLASS - DEFAULT shop_owner =====
  function getSupplierFromUrl(){
    const shopIdParam = getQueryParam('shopId') || getQueryParam('shop_id') || localStorage.getItem('last_shopId') || '';
    const supplierIdParam = getQueryParam('supplierId') || getQueryParam('supplier_id') || getQueryParam('shopId') || localStorage.getItem('last_supplierId') || shopIdParam || '';
    let supplierRoleParam = getQueryParam('supplierRole') || getQueryParam('supplier_role') || getQueryParam('role') || localStorage.getItem('last_supplierRole') || '';
    if(!supplierRoleParam || supplierRoleParam==='null' || supplierRoleParam==='undefined' || supplierRoleParam==='' || supplierRoleParam==='unknown'){
      supplierRoleParam = 'shop_owner';
    }
    supplierRoleParam = String(supplierRoleParam).toLowerCase().trim();
    const allowedRoles = ['shop_owner','area_manager','admin'];
    if(!allowedRoles.includes(supplierRoleParam)){
      supplierRoleParam = 'shop_owner';
    }
    let finalSupplierId = supplierIdParam || shopIdParam;
    let finalShopId = shopIdParam || supplierIdParam;
    if(!finalSupplierId || finalSupplierId==='unknown' || finalSupplierId==='') finalSupplierId = finalShopId;
    if(!finalShopId || finalShopId==='unknown' || finalShopId==='') finalShopId = finalSupplierId;
    return {
      supplierId: finalSupplierId,
      supplierRole: supplierRoleParam,
      shopId: finalShopId,
      supplierName: getQueryParam('shopName') || getQueryParam('supplierName') || getQueryParam('shop_name') || localStorage.getItem('last_shopName') || 'Shop',
      shopType: getQueryParam('shopType') || getQueryParam('type') || 'general'
    };
  }

  // ===== MAIN CHECKOUT CLASS =====
  window.HierarchyCheckout = {
    currentSupplier: null,
    currentItems: [],
    currentAddress: null,
    currentAddressText: '',
    paymentMode: 'cod',
    _calc: { subtotal: 0, commission: 0, total: 0 },
    _retry: 0,

    async init(){
      console.log('🛒 HierarchyCheckout V6.5 init...');
      this.currentSupplier = getSupplierFromUrl();
      console.log('Supplier:', this.currentSupplier);

      // Wait for CartCore
      if(window.CartCore && window.CartCore.ready){
        try{ await window.CartCore.ready; }catch(e){ console.log('CartCore ready fail', e); }
      } else {
        await new Promise(r=> setTimeout(r, 1000));
      }

      // Extra wait for server load - FIX RACE CONDITION FROM SCREENSHOT
      await new Promise(r=> setTimeout(r, 800));

      // Listen for cart updates if cart arrives late
      window.addEventListener('cart:updated', ()=>{
        console.log('🛒 Cart updated event - reloading checkout');
        this.loadCartWithRetry();
      });

      await this.loadCartWithRetry();

      this.bindEvents();
      await this.loadAddresses();
      await this.checkWallet();
    },

    async loadCartWithRetry(){
      let items = [];
      const sid = this.currentSupplier.supplierId || this.currentSupplier.shopId || '';

      // If supplierId still unknown, try from Cart first
      if(!this.currentSupplier.supplierId || this.currentSupplier.supplierId==='unknown' || this.currentSupplier.supplierId===''){
        if(window.CartCore && window.CartCore.getAllCarts){
          const allCarts = window.CartCore.getAllCarts();
          const firstSid = Object.keys(allCarts)[0];
          if(firstSid){
            this.currentSupplier.supplierId = firstSid;
            this.currentSupplier.shopId = firstSid;
            this.currentSupplier.supplierName = allCarts[firstSid][0]?.shopName || allCarts[firstSid][0]?.shopType || 'Shop';
            this.currentSupplier.supplierRole = allCarts[firstSid][0]?.ownerRole || allCarts[firstSid][0]?.shopOwnerRole || 'shop_owner';
            console.log('Fallback supplier from cart:', this.currentSupplier);
          }
        }
      }

      // TRY 1: Specific supplier
      if(window.CartCore && window.CartCore.getCartBySupplier && sid){
        items = window.CartCore.getCartBySupplier(sid) || [];
        console.log('Try getCartBySupplier(',sid,') =', items.length);
      }

      // TRY 2: getAllCarts - main app bug fix - agar specific empty ho to pehla cart lo
      if(items.length===0 && window.CartCore && window.CartCore.getAllCarts){
        const all = window.CartCore.getAllCarts();
        const keys = Object.keys(all||{});
        console.log('Try getAllCarts keys:', keys);
        if(keys.length>0){
          if(sid && all[sid] && all[sid].length>0){
            items = all[sid];
          } else {
            const firstKey = keys[0];
            items = all[firstKey] || [];
            if(items.length>0){
              this.currentSupplier.supplierId = firstKey;
              this.currentSupplier.shopId = firstKey;
              this.currentSupplier.supplierRole = items[0]?.ownerRole || items[0]?.shopOwnerRole || 'shop_owner';
              this.currentSupplier.supplierName = items[0]?.shopName || items[0]?.shopType || 'Shop';
              try{ localStorage.setItem('last_shopId', firstKey); localStorage.setItem('last_supplierId', firstKey); }catch(e){}
            }
          }
        }
      }

      // TRY 3: Flat getCart
      if(items.length===0 && window.CartCore && window.CartCore.getCart){
        items = window.CartCore.getCart() || [];
        console.log('Try getCart() flat =', items.length);
        if(items.length>0 && !this.currentSupplier.supplierId){
          const first = items[0];
          this.currentSupplier.supplierId = first.shopId || first.ownerId || '';
          this.currentSupplier.shopId = first.shopId || first.ownerId || '';
        }
      }

      // TRY 4: sessionStorage backup
      if(items.length===0){
        try{
          const bkpKeys = Object.keys(sessionStorage).filter(k=>k.startsWith('cart_bkp_'));
          for(const k of bkpKeys){
            try{
              const data = JSON.parse(sessionStorage.getItem(k)||'[]');
              if(Array.isArray(data) && data.length>0){
                items = data;
                const bkSid = k.replace('cart_bkp_','');
                this.currentSupplier.supplierId = bkSid;
                this.currentSupplier.shopId = bkSid;
                break;
              }
            }catch(e){}
          }
        }catch(e){}
      }

      this.currentItems = items;

      if(this.currentItems.length===0 && this._retry < 3){
        this._retry++;
        console.log(`Cart empty, retry ${this._retry}/3...`);
        const el = document.getElementById('checkout-items');
        if(el) el.innerHTML = `<div style="padding:24px;text-align:center;color:#64748b;font-weight:700">
          <i class="fa-solid fa-spinner fa-spin" style="font-size:28px;display:block;margin-bottom:10px;color:#94a3b8"></i>
          Cart sync ho raha hai... (${this._retry}/3)<br>
          <span style="font-size:11px">Supplier: ${this.currentSupplier.supplierId||'searching'}<br>Buyer: ${getBuyerInfo().buyerId.slice(0,12)}<br>Keys: ${window.CartCore && window.CartCore.getAllCarts ? Object.keys(window.CartCore.getAllCarts()).join(',')||'empty' : 'no CartCore'}</span>
        </div>`;
        setTimeout(()=> this.loadCartWithRetry().then(()=> { if(this.currentItems.length>0){ this.renderHeader(); this.renderSummary(); } }), 1500);
        return;
      }

      if(!this.currentItems || this.currentItems.length===0){
        const el = document.getElementById('checkout-items');
        if(el) el.innerHTML = `<div style="padding:24px;text-align:center;color:#64748b;font-weight:700">
          <i class="fa-solid fa-cart-shopping" style="font-size:32px;display:block;margin-bottom:10px;color:#cbd5e1"></i>
          Cart khali hai<br><span style="font-size:12px">Main app se product add karo</span><br>
          <button onclick="location.href='../cart/cart.html?shopId=${encodeURIComponent(this.currentSupplier.shopId||'')}'" style="margin-top:14px;background:#0f172a;color:#fff;border:none;padding:10px 18px;border-radius:10px;font-weight:800">Go to Cart</button>
          <div style="font-size:10px;margin-top:10px;color:#94a3b8;text-align:left;background:#f8fafc;padding:8px;border-radius:8px">
            Debug:<br>
            supplierId=${this.currentSupplier.supplierId||'empty'}<br>
            shopId=${this.currentSupplier.shopId||'empty'}<br>
            buyerId=${getBuyerInfo().buyerId}<br>
            CartCore keys=${window.CartCore && window.CartCore.getAllCarts ? Object.keys(window.CartCore.getAllCarts()).join(', ')||'empty' : 'no CartCore'}<br>
            session keys=${Object.keys(sessionStorage).filter(k=>k.startsWith('cart_bkp_')).join(', ')||'empty'}
          </div>
        </div>`;
        const btn = document.getElementById('place-order-btn');
        if(btn) btn.disabled = true;
        return;
      }

      this.renderHeader();
      this.renderSummary();
      const btn = document.getElementById('place-order-btn');
      if(btn) btn.disabled = false;
      console.log('✅ Checkout ready with', this.currentItems.length, 'items, supplier:', this.currentSupplier);
    },

    renderHeader(){
      const el = document.getElementById('checkout-supplier-name');
      const elRole = document.getElementById('checkout-supplier-role');
      const shopName = this.currentSupplier.supplierName || this.currentItems[0]?.shopName || this.currentItems[0]?.shopType || 'Shop';
      if(el) el.textContent = shopName + ' • ' + this.currentItems.length + ' items';
      if(elRole) elRole.textContent = `ID: ${(this.currentSupplier.shopId||'').slice(0,12)} • Role: ${this.currentSupplier.supplierRole} • Type: ${this.currentSupplier.shopType||'general'}`;
      // Fix Loading shop... text
      try{
        document.querySelectorAll('*').forEach(node=>{
          if(node.childNodes.length===1 && node.textContent.trim()==='Loading shop...'){
            node.textContent = shopName;
          }
        });
      }catch(e){}
    },

    renderSummary(){
      const container = document.getElementById('checkout-items');
      if(!container) return;
      if(!this.currentItems || this.currentItems.length===0) return;
      let html = '';
      let subtotal = 0;
      this.currentItems.forEach(it=>{
        const price = Number(it.price||0);
        const qty = Number(it.qty||it.quantity||1);
        const lineTotal = price * qty;
        subtotal += lineTotal;
        html += `<div class="item">
          <img src="${it.image||it.thumbnail||'https://via.placeholder.com/54'}" onerror="this.src='https://via.placeholder.com/54'">
          <div style="flex:1">
            <div style="font-weight:700;font-size:13px;line-height:1.2">${it.name||it.title||'Product'}</div>
            <div style="font-size:11px;color:#64748b;font-weight:600;margin-top:2px">${qty} ${it.unit||'pcs'} × ₹${price} • ${it.shopName||''}</div>
          </div>
          <div style="font-weight:900;font-size:13px">₹${lineTotal}</div>
        </div>`;
      });
      container.innerHTML = html;
      const commission = Math.round(subtotal * 0.05);
      const total = subtotal;
      this._calc = { subtotal, commission, total };
      const subEl = document.getElementById('checkout-subtotal');
      const comEl = document.getElementById('checkout-commission');
      const totEl = document.getElementById('checkout-total');
      if(subEl) subEl.textContent = `₹${subtotal}`;
      if(comEl) comEl.textContent = `₹${commission} (Admin 5%)`;
      if(totEl) totEl.textContent = `₹${total}`;
    },

    bindEvents(){
      document.querySelectorAll('input[name="paymentMode"]').forEach(r=>{
        r.addEventListener('change', e=>{
          this.paymentMode = e.target.value;
          console.log('Payment mode:', this.paymentMode);
        });
      });
      const gstCheck = document.getElementById('gst-needed');
      if(gstCheck){
        gstCheck.addEventListener('change', e=>{
          const inp = document.getElementById('gst-number');
          if(inp) inp.style.display = e.target.checked ? 'block' : 'none';
        });
      }
      const btn = document.getElementById('place-order-btn');
      if(btn){
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', ()=> this.placeOrder());
      }
    },

    async loadAddresses(){
      const listEl = document.getElementById('address-list');
      if(!listEl) return;
      const buyer = getBuyerInfo();
      listEl.innerHTML = '<div style="padding:10px;color:#94a3b8;font-size:12px">Loading addresses...</div>';
      try{
        let url = `${getApiBase()}${API.commonProfile}/me?buyerId=${encodeURIComponent(buyer.buyerId)}`;
        let res = await fetch(url, { headers: { 'x-buyer-id': buyer.buyerId, ...getAuthHeaders() } }).catch(()=>null);
        let data = res ? await res.json().catch(()=>null) : null;
        let addrs = [];
        if(data && data.success && data.user && data.user.addresses) addrs = data.user.addresses;
        if(addrs.length===0){
          url = `${getApiBase()}${API.address}?buyerId=${encodeURIComponent(buyer.buyerId)}`;
          res = await fetch(url, { headers: { 'x-buyer-id': buyer.buyerId, ...getAuthHeaders() } }).catch(()=>null);
          data = res ? await res.json().catch(()=>null) : null;
          if(data) addrs = data.addresses || data.data || data || [];
        }
        if(addrs.length===0){
          const localText = localStorage.getItem('selectedAddressText');
          const localId = localStorage.getItem('selectedAddressId');
          if(localText){
            addrs = [{ _id: localId||'local_1', id: localId||'local_1', full: localText, line1: localText, city: '', label: 'Local Address' }];
          }
        }
        if(addrs.length===0){
          listEl.innerHTML = '<div style="padding:12px;background:#fffbeb;border:1px dashed #fde68a;border-radius:10px;font-size:12px;font-weight:700;color:#92400e">No saved address. Add new address below.</div>';
          return;
        }
        let html='';
        addrs.forEach((a,i)=>{
          const txt = a.full || a.fullAddress || `${a.line1||''} ${a.line2?','+a.line2:''} ${a.city||''} ${a.state||''} ${a.pincode||''}`.trim();
          const id = a._id || a.id || `addr_${i}`;
          html+=`<div class="addr ${i===0?'active':''}" data-id="${id}" data-text="${String(txt).replace(/"/g,'&quot;')}" style="padding:12px;border:1px solid ${i===0?'#0f172a':'#e2e8f0'};border-radius:12px;margin-bottom:8px;cursor:pointer;background:${i===0?'#f8fafc':'#fff'}">
            <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:13px">${a.name||a.label||'Address '+(i+1)} ${a.phone?' - '+a.phone:''}</b><span style="font-size:10px;background:#f1f5f9;padding:2px 6px;border-radius:6px">${a.label||'Home'}</span></div>
            <div style="font-size:12px;color:#334155;margin-top:4px;line-height:1.4;font-weight:500">${txt}</div>
          </div>`;
        });
        listEl.innerHTML = html;
        this.currentAddress = addrs[0]._id || addrs[0].id || null;
        this.currentAddressText = addrs[0].full || addrs[0].fullAddress || `${addrs[0].line1||''} ${addrs[0].city||''}`;
        listEl.querySelectorAll('.addr').forEach(el=>{
          el.addEventListener('click', ()=>{
            listEl.querySelectorAll('.addr').forEach(x=>{
              x.classList.remove('active');
              x.style.borderColor='#e2e8f0';
              x.style.background='#fff';
            });
            el.classList.add('active');
            el.style.borderColor='#0f172a';
            el.style.background='#f8fafc';
            this.currentAddress = el.dataset.id;
            this.currentAddressText = el.dataset.text;
            try{
              localStorage.setItem('selectedAddressId', this.currentAddress);
              localStorage.setItem('selectedAddressText', this.currentAddressText);
            }catch(e){}
          });
        });
        try{
          localStorage.setItem('selectedAddressId', this.currentAddress);
          localStorage.setItem('selectedAddressText', this.currentAddressText);
        }catch(e){}
      }catch(e){
        console.error('Address load error', e);
        listEl.innerHTML = `<div style="padding:10px;color:#ef4444;font-size:12px">Address load fail: ${e.message}<br>Local address use karo.</div>`;
      }
    },

    async checkWallet(){
      const buyer = getBuyerInfo();
      if(buyer.buyerRole==='shop_owner' || buyer.buyerRole==='area_manager'){
        const el = document.getElementById('wallet-balance');
        if(el) el.textContent = 'Wallet check: Shop owner can use wallet';
      }
    },

    async placeOrder(){
      const btn = document.getElementById('place-order-btn');
      if(btn){ btn.disabled = true; btn.textContent = 'Placing Order... ⏳'; }
      try{
        const buyer = getBuyerInfo();
        if(!this.currentSupplier.supplierId || this.currentSupplier.supplierId==='' || this.currentSupplier.supplierId==='unknown'){
          this.currentSupplier.supplierId = this.currentSupplier.shopId || this.currentItems[0]?.shopId || '';
        }
        if(!this.currentSupplier.shopId || this.currentSupplier.shopId==='' || this.currentSupplier.shopId==='unknown'){
          this.currentSupplier.shopId = this.currentSupplier.supplierId || '';
        }
        if(!this.currentSupplier.supplierRole || this.currentSupplier.supplierRole==='' || this.currentSupplier.supplierRole==='unknown'){
          this.currentSupplier.supplierRole = this.currentItems[0]?.ownerRole || this.currentItems[0]?.shopOwnerRole || 'shop_owner';
        }
        this.currentSupplier.supplierRole = String(this.currentSupplier.supplierRole).toLowerCase();
        const allowed = ['shop_owner','area_manager','admin'];
        if(!allowed.includes(this.currentSupplier.supplierRole)) this.currentSupplier.supplierRole = 'shop_owner';

        if(!this.currentSupplier.shopId){
          throw new Error('Shop ID missing - cart se fir se add karo');
        }
        if(!this.currentAddressText){
          const localAddr = localStorage.getItem('selectedAddressText');
          if(localAddr){
            this.currentAddressText = localAddr;
            this.currentAddress = localStorage.getItem('selectedAddressId') || 'local_1';
          } else {
            throw new Error('Delivery address select karo - Add New Address dabao');
          }
        }

        const total = this._calc?.total || this.currentItems.reduce((s,i)=> s + Number(i.price||0)*Number(i.qty||i.quantity||1),0);

        const payload = {
          shopId: this.currentSupplier.shopId,
          supplierId: this.currentSupplier.supplierId,
          supplierRole: this.currentSupplier.supplierRole,
          supplierShopId: this.currentSupplier.shopId,
          buyerId: buyer.buyerId,
          buyerRole: buyer.buyerRole || 'customer',
          buyerShopId: buyer.buyerShopId || null,
          buyerAreaId: buyer.buyerAreaId || null,
          items: this.currentItems,
          total: total,
          totalAmount: total,
          subtotal: this._calc?.subtotal || total,
          commissionAmount: this._calc?.commission || Math.round(total*0.05),
          addressId: this.currentAddress,
          addressText: this.currentAddressText,
          deliveryAddress: { full: this.currentAddressText, fullAddress: this.currentAddressText },
          paymentMethod: this.paymentMode,
          paymentMode: this.paymentMode,
          isBulkOrder: buyer.buyerRole!=='customer' && buyer.buyerRole!=='guest',
          gstInvoiceNeeded: document.getElementById('gst-needed')?.checked || false,
          gstNumber: document.getElementById('gst-number')?.value || null,
          shopType: this.currentSupplier.shopType || this.currentItems[0]?.shopType || 'general'
        };

        console.log('🛒 Checkout payload V6.5 WORLD CLASS:', payload);
        const url = `${getApiBase()}${API.checkout}/${encodeURIComponent(payload.shopId)}/place`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'x-buyer-id': buyer.buyerId, ...getAuthHeaders() },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if(!res.ok || !data.success){
          throw new Error(data.message || `Order failed: ${res.status}`);
        }

        if(window.CartCore){
          try{ await window.CartCore.clear(this.currentSupplier.supplierId); }catch(e){}
          try{ await window.CartCore.clear(this.currentSupplier.shopId); }catch(e){}
        }
        try{
          sessionStorage.removeItem('cart_bkp_'+this.currentSupplier.supplierId);
          sessionStorage.removeItem('cart_bkp_'+this.currentSupplier.shopId);
          localStorage.removeItem('last_shopId');
          localStorage.removeItem('last_supplierId');
        }catch(e){}

        const orderId = data.orderId || data.order?.orderId || 'ORD'+Date.now();
        console.log('✅ Order placed:', orderId);
        const successUrl = `./order-success.html?shopId=${encodeURIComponent(payload.shopId)}&orderId=${encodeURIComponent(orderId)}&amount=${encodeURIComponent(total)}&supplierId=${encodeURIComponent(payload.supplierId)}&supplierRole=${encodeURIComponent(payload.supplierRole)}`;
        window.location.href = successUrl;

      }catch(e){
        console.error('Place order error', e);
        alert('Order fail: ' + e.message + '\n\nFix: 1) Address select karo 2) Cart me shopId check karo 3) Login karo');
        const btn2 = document.getElementById('place-order-btn');
        if(btn2){ btn2.disabled = false; btn2.textContent = 'Place Order'; }
      }
    },

    addNewAddress(){
      const name = prompt('Name (e.g. Home):') || 'Home';
      if(!name) return;
      const phone = prompt('Phone:') || localStorage.getItem('USER_PHONE') || '';
      const line1 = prompt('House / Street / Area:');
      if(!line1) return;
      const city = prompt('City:') || 'Surat';
      const pincode = prompt('Pincode:') || '';
      const full = `${line1}, ${city} ${pincode} ${phone? '- '+phone:''}`.trim();
      const id = 'local_' + Date.now();
      try{
        localStorage.setItem('selectedAddressText', full);
        localStorage.setItem('selectedAddressId', id);
      }catch(e){}
      this.currentAddress = id;
      this.currentAddressText = full;
      const listEl = document.getElementById('address-list');
      if(listEl){
        listEl.innerHTML = `<div class="addr active" data-id="${id}" data-text="${full.replace(/"/g,'&quot;')}" style="padding:12px;border:2px solid #0f172a;border-radius:12px;background:#f8fafc"><b>${name}</b><br><span style="font-size:12px">${full}</span><br><span style="font-size:10px;color:#16a34a">Local - Will be saved on order</span></div>` + listEl.innerHTML;
      }
      alert('Address added locally: ' + full);
    }
  };

  // Auto init
  document.addEventListener('DOMContentLoaded', ()=> {
    setTimeout(()=> HierarchyCheckout.init(), 500);
  });

  console.log('✅ HierarchyCheckout V6.5 WORLD CLASS FINAL - race + supplierRole fixed');
})();