// LOCATION: public/shop-templates/common/checkout/hierarchy-checkout.js - V4 DAIRY FIXED - FULLY COMPATIBLE WITH CHECKOUT.HTML V4 + CARTCORE V4
// Depends: role-hierarchy.js, cart-core.js V4, api-core.js
(function(){
  const API = {
    checkout: '/api/common/checkout',
    address: '/api/user/addresses',
    wallet: '/api/common/wallet/balance'
  };

  function getApiBase(){ return window.API_BASE || window.EnvConfig?.API_BASE || window.location.origin; }
  function getAuthHeaders(){
    const token = (window.AuthCore && window.AuthCore.getToken && window.AuthCore.getToken()) || localStorage.getItem('TOKEN') || localStorage.getItem('token') || '';
    return { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
  }
  function getQueryParam(n){ return new URLSearchParams(window.location.search).get(n); }

  function getBuyerInfo(){
    let gid = sessionStorage.getItem('guest_id');
    if(!gid){ gid = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2,5); try{ sessionStorage.setItem('guest_id', gid); }catch(e){} }
    const rh = window.RoleHierarchy;
    return {
      buyerId: (rh && rh.getMyId && rh.getMyId()) || gid,
      buyerRole: (rh && rh.getMyRole && rh.getMyRole()) || 'customer',
      buyerShopId: (rh && rh.getMyShopId && rh.getMyShopId()) || null,
      buyerAreaId: window.AreaId || window.AreaManager?.areaId || null
    };
  }

  function getSupplierFromUrl(){
    const shopId = getQueryParam('shopId') || '';
    const supplierId = getQueryParam('supplierId') || shopId;
    return {
      supplierId: supplierId,
      supplierRole: getQueryParam('supplierRole') || 'shop_owner',
      shopId: shopId || supplierId,
      supplierName: getQueryParam('shopName') || getQueryParam('supplierName') || 'Dairy Shop'
    };
  }

  window.HierarchyCheckout = {
    currentSupplier: null,
    currentItems: [],
    currentAddress: null,
    currentAddressText: '',
    paymentMode: 'cod',

    async init(){
      this.currentSupplier = getSupplierFromUrl();

      // CartCore ready wait + backup sync already loaded in V4
      if(window.CartCore && window.CartCore.ready){
        try{ await window.CartCore.ready; }catch(e){}
      } else {
        await new Promise(r=> setTimeout(r, 600));
      }

      // SupplierId fix - unknown ya empty ho to cart se lo
      if(!this.currentSupplier.supplierId || this.currentSupplier.supplierId === 'unknown'){
        const allCarts = window.CartCore ? window.CartCore.getAllCarts() : {};
        const firstSid = Object.keys(allCarts)[0];
        if(firstSid){
          this.currentSupplier.supplierId = firstSid;
          this.currentSupplier.shopId = firstSid;
          this.currentSupplier.supplierName = allCarts[firstSid][0]?.shopName || 'Dairy Shop';
          this.currentSupplier.supplierRole = allCarts[firstSid][0]?.ownerRole || 'shop_owner';
        } else {
          // last try - session backup
          try{
            for(let i=0;i<sessionStorage.length;i++){
              const k = sessionStorage.key(i);
              if(k && k.startsWith('cart_bkp_')){
                const sid = k.replace('cart_bkp_','');
                this.currentSupplier.supplierId = sid;
                this.currentSupplier.shopId = sid;
                break;
              }
            }
          }catch(e){}
        }
      }

      // Items nikalo
      if(window.CartCore){
        this.currentItems = window.CartCore.getCartBySupplier(this.currentSupplier.supplierId) || [];
        if(this.currentItems.length===0) this.currentItems = window.CartCore.getCart() || [];
      }

      if(this.currentItems.length===0){
        document.getElementById('checkout-items').innerHTML = '<div style="padding:20px;text-align:center">Cart khali hai <br><a href="../cart/cart.html">Cart pe jao</a></div>';
        document.getElementById('place-order-btn').disabled = true;
        return;
      }

      this.renderHeader();
      this.renderSummary();
      this.bindEvents();
      await this.loadAddresses();
      await this.checkWallet();
    },

    renderHeader(){
      const el = document.getElementById('checkout-supplier-name');
      const elRole = document.getElementById('checkout-supplier-role');
      if(el) el.textContent = this.currentSupplier.supplierName || this.currentItems[0]?.shopName || 'Dairy Shop';
      if(elRole) elRole.textContent = `${this.currentSupplier.shopId} • ${this.currentSupplier.supplierRole}`;

      const buyer = getBuyerInfo();
      const isBulk = buyer.buyerRole !== 'customer' && buyer.buyerRole !== 'guest';
      const gstSec = document.getElementById('gst-section');
      if(gstSec) gstSec.style.display = isBulk ? 'block' : 'none';
    },

    renderSummary(){
      const container = document.getElementById('checkout-items');
      let html = '';
      let subtotal = 0;
      this.currentItems.forEach(it=>{
        const price = Number(it.price||0);
        const qty = Number(it.qty||1);
        subtotal += price*qty;
        html += `<div class="item">
          <img src="${it.image||'https://via.placeholder.com/54'}" onerror="this.src='https://via.placeholder.com/54'">
          <div style="flex:1"><div style="font-weight:600">${it.name}</div><div style="font-size:12px;color:#64748b">${qty} ${it.unit||''} × ₹${price}</div></div>
          <div style="font-weight:700">₹${price*qty}</div>
        </div>`;
      });
      if(container) container.innerHTML = html;

      const buyer = getBuyerInfo();
      const isAdminSupplier = this.currentSupplier.supplierRole === 'admin';
      const commission = isAdminSupplier ? 0 : Math.round(subtotal * 0.05);
      const total = subtotal; // customer total = subtotal, commission backend pe cut hoga

      document.getElementById('checkout-subtotal').textContent = `₹${subtotal}`;
      document.getElementById('checkout-commission').textContent = `₹${commission} ${isAdminSupplier?'(No commission for admin)':''}`;
      document.getElementById('checkout-total').textContent = `₹${total}`;

      this._calc = { subtotal, commission, total };
    },

    bindEvents(){
      document.querySelectorAll('input[name="paymentMode"]').forEach(r=>{
        r.addEventListener('change', e=>{ this.paymentMode = e.target.value; });
      });
      document.getElementById('gst-needed')?.addEventListener('change', e=>{
        const inp = document.getElementById('gst-number');
        if(inp) inp.style.display = e.target.checked ? 'block' : 'none';
      });
      document.getElementById('place-order-btn')?.addEventListener('click', ()=> this.placeOrder());
    },

    async loadAddresses(){
      const listEl = document.getElementById('address-list');
      const buyer = getBuyerInfo();
      try{
        const res = await fetch(`${getApiBase()}${API.address}?buyerId=${encodeURIComponent(buyer.buyerId)}`, { headers: { 'x-buyer-id': buyer.buyerId, ...getAuthHeaders() } });
        const data = await res.json();
        let addrs = data.addresses || data.data || [];
        if(addrs.length===0){
          listEl.innerHTML = '<div style="color:#64748b">Koi address nahi, naya add karo</div>';
          return;
        }
        let html='';
        addrs.forEach((a,i)=>{
          const txt = a.full || `${a.line1||''} ${a.city||''} ${a.pincode||''}`;
          html+=`<div class="addr ${i===0?'active':''}" data-id="${a._id||a.id}" data-text="${txt.replace(/"/g,'&quot;')}"><b>${a.name||a.label||'Address '+(i+1)}</b> - ${a.phone||''}<br><span style="font-size:12px">${txt}</span></div>`;
        });
        listEl.innerHTML = html;
        this.currentAddress = addrs[0]._id || addrs[0].id;
        this.currentAddressText = addrs[0].full || `${addrs[0].line1} ${addrs[0].city}`;
        listEl.querySelectorAll('.addr').forEach(el=>{
          el.addEventListener('click', ()=>{
            listEl.querySelectorAll('.addr').forEach(x=> x.classList.remove('active'));
            el.classList.add('active');
            this.currentAddress = el.dataset.id;
            this.currentAddressText = el.dataset.text;
          });
        });
      }catch(e){
        listEl.innerHTML = `<div style="color:#e11">Address load fail: ${e.message}</div>`;
        // fallback - localStorage
        const localAddr = localStorage.getItem('selectedAddressText');
        if(localAddr){
          this.currentAddressText = localAddr;
          this.currentAddress = localStorage.getItem('selectedAddressId') || null;
        }
      }
    },

    async checkWallet(){
      if(this.paymentMode !== 'wallet') return;
      try{
        const buyer = getBuyerInfo();
        const res = await fetch(`${getApiBase()}${API.wallet}?buyerId=${encodeURIComponent(buyer.buyerId)}`, { headers: { 'x-buyer-id': buyer.buyerId, ...getAuthHeaders() } });
        const data = await res.json();
        document.getElementById('wallet-balance').textContent = `Wallet Balance: ₹${data.balance||0}`;
      }catch(e){}
    },

    async placeOrder(){
      const btn = document.getElementById('place-order-btn');
      if(btn) { btn.disabled = true; btn.textContent = 'Placing...'; }
      try{
        const buyer = getBuyerInfo();
        const total = this._calc?.total || this.currentItems.reduce((s,i)=> s + Number(i.price||0)*Number(i.qty||1),0);
        const payload = {
          shopId: this.currentSupplier.shopId,
          supplierId: this.currentSupplier.supplierId,
          supplierRole: this.currentSupplier.supplierRole,
          buyerId: buyer.buyerId,
          buyerRole: buyer.buyerRole,
          buyerShopId: buyer.buyerShopId,
          buyerAreaId: buyer.buyerAreaId,
          items: this.currentItems,
          total: total,
          totalAmount: total,
          subtotal: this._calc?.subtotal || total,
          commissionAmount: this._calc?.commission || 0,
          addressId: this.currentAddress || localStorage.getItem('selectedAddressId') || null,
          addressText: this.currentAddressText || localStorage.getItem('selectedAddressText') || '',
          deliveryAddress: { full: this.currentAddressText || '' },
          paymentMethod: this.paymentMode,
          paymentMode: this.paymentMode,
          isBulkOrder: buyer.buyerRole !== 'customer',
          gstInvoiceNeeded: document.getElementById('gst-needed')?.checked || false,
          gstNumber: document.getElementById('gst-number')?.value || null,
          createdAt: new Date().toISOString()
        };

        console.log('Dairy Checkout payload:', payload);

        const res = await fetch(`${getApiBase()}${API.checkout}/${encodeURIComponent(payload.shopId)}/place`, {
          method:'POST',
          headers: { 'x-buyer-id': buyer.buyerId, ...getAuthHeaders() },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if(!data.success) throw new Error(data.message || 'Order failed');

        // clear cart supplier wise
        if(window.CartCore) await window.CartCore.clear(this.currentSupplier.supplierId);
        try{ sessionStorage.removeItem('cart_bkp_'+this.currentSupplier.supplierId); }catch(e){}

        const orderId = data.orderId || data.order?.orderId || data.data?.orderId || 'ORD'+Date.now();
        window.location.href = `./order-success.html?shopId=${encodeURIComponent(payload.shopId)}&orderId=${encodeURIComponent(orderId)}&amount=${encodeURIComponent(total)}&supplierId=${encodeURIComponent(payload.supplierId)}`;

      }catch(e){
        alert('Order fail: '+ e.message);
        if(btn){ btn.disabled = false; btn.textContent = 'Place Order'; }
      }
    },

    addNewAddress(){
      const txt = prompt('Full Address likho (House, City, Pincode, Phone):');
      if(!txt) return;
      localStorage.setItem('selectedAddressText', txt);
      this.currentAddressText = txt;
      this.currentAddress = 'local_'+Date.now();
      document.getElementById('address-list').innerHTML = `<div class="addr active" data-id="${this.currentAddress}" data-text="${txt}">${txt} (Local)</div>`;
    }
  };

  document.addEventListener('DOMContentLoaded', ()=> HierarchyCheckout.init());
  console.log('✅ HierarchyCheckout V4 DAIRY FIXED loaded');

})();