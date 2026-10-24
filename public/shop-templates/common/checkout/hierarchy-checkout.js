// LOCATION: public/shop-templates/common/checkout/hierarchy-checkout.js - V14 FIXED - Matches CartCore V3 + CheckoutCore V3
// Depends: role-hierarchy.js, cart-core.js V3, api-core.js, auth-core.js
(function(){
  const API = {
    checkout: '/api/common/checkout',
    address: '/api/user/addresses',
    wallet: '/api/common/wallet/balance'
  };

  function getApiBase(){
    return window.API_BASE || window.EnvConfig?.API_BASE || window.location.origin;
  }

  function getAuthHeaders(){
    const token = (window.AuthCore && window.AuthCore.getToken && window.AuthCore.getToken()) || localStorage.getItem('TOKEN') || localStorage.getItem('token') || '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  function getQueryParam(name){
    return new URLSearchParams(window.location.search).get(name);
  }

  // FIXED: Stable guest_id + null safe RoleHierarchy
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
      buyerShopId: (rh && rh.getMyShopId && rh.getMyShopId()) || null,
      buyerAreaId: (window.AreaId || window.AreaManager?.areaId || null)
    };
  }

  function getSupplierFromUrl(){
    return {
      supplierId: getQueryParam('supplierId') || getQueryParam('shopId') || null,
      supplierRole: getQueryParam('supplierRole') || 'shop_owner',
      shopId: getQueryParam('shopId') || getQueryParam('supplierId') || null,
      supplierName: getQueryParam('supplierName') || getQueryParam('shopName') || 'Shop'
    };
  }

  window.HierarchyCheckout = {
    currentSupplier: null,
    currentItems: [],
    currentAddress: null,
    paymentMode: 'cod',

    async init(){
      this.currentSupplier = getSupplierFromUrl();

      // SupplierId nahi hai toh Cart se first supplier lo
      if(!this.currentSupplier.supplierId){
        console.warn('No supplierId in URL, trying cart first supplier');
        // CartCore ready hone ka wait
        if(window.CartCore && window.CartCore.ready){
          try{ await window.CartCore.ready; }catch(e){}
        }
        const allCarts = window.CartCore ? window.CartCore.getAllCarts() : {};
        const firstSid = Object.keys(allCarts)[0];
        if(firstSid){
          this.currentSupplier.supplierId = firstSid;
          this.currentSupplier.shopId = firstSid;
          this.currentSupplier.supplierName = (allCarts[firstSid][0]?.shopName) || 'Shop';
          this.currentSupplier.supplierRole = (allCarts[firstSid][0]?.ownerRole) || 'shop_owner';
        } else {
          alert('Cart empty hai, shop pe jao');
          window.location.href = '/shop-templates/common/cart/cart.html';
          return;
        }
      }

      // Items lo - supplier wise
      if(window.CartCore){
        this.currentItems = window.CartCore.getCartBySupplier(this.currentSupplier.supplierId) || [];
        if(this.currentItems.length === 0){
          this.currentItems = window.CartCore.getCart() || [];
        }
      }

      console.log('HierarchyCheckout init:', this.currentSupplier, this.currentItems);
      
      if(this.currentItems.length === 0){
        alert('Cart khali hai');
        window.location.href = '/shop-templates/common/cart/cart.html';
        return;
      }

      this.renderSummary();
      await this.loadAddresses();
      this.bindPayment();
    },

    renderSummary(){
      const total = this.currentItems.reduce((s,i)=> s + (Number(i.price||0) * Number(i.qty||1)), 0);
      const buyer = getBuyerInfo();
      const isBulk = buyer.buyerRole !== 'customer' && buyer.buyerRole !== 'guest' && buyer.buyerRole !== null;
      
      let commission = 0;
      if(this.currentSupplier.supplierRole !== 'admin' && isBulk){
        commission = Math.round(total * 0.05);
      }

      const el = (id)=> document.getElementById(id);
      
      // Escaping for XSS
      const esc = (s)=> String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

      if(el('checkout-items')){
        el('checkout-items').innerHTML = this.currentItems.map(i=> `
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9">
            <span style="font-size:13px">${esc(i.name)} x ${i.qty}</span>
            <span style="font-weight:800">₹${Number(i.price)*Number(i.qty)}</span>
          </div>
        `).join('');
      }
      if(el('checkout-subtotal')) el('checkout-subtotal').textContent = `₹${total}`;
      if(el('checkout-commission')) el('checkout-commission').textContent = isBulk ? `₹${commission} (Admin commission - backend me katega)` : '₹0';
      if(el('checkout-total')) el('checkout-total').textContent = `₹${total}`;
      if(el('checkout-supplier-name')) el('checkout-supplier-name').textContent = `${esc(this.currentSupplier.supplierName)} (${esc(this.currentSupplier.supplierRole)})`;
      
      if(el('gst-section')){
        el('gst-section').style.display = isBulk ? 'block' : 'none';
      }

      // For payment-select page sync
      try{
        localStorage.setItem('checkoutTotal', String(total));
        localStorage.setItem('checkoutSupplierId', this.currentSupplier.supplierId);
      }catch(e){}
    },

    async loadAddresses(){
      try {
        const res = await fetch(getApiBase() + API.address, { 
          headers: getAuthHeaders(),
          credentials: 'include',
          cache: 'no-store'
        });
        if(!res.ok) throw new Error('Auth failed');
        const data = await res.json();
        const list = data.data || data.addresses || data || [];
        const container = document.getElementById('address-list');
        if(container){
          if(list.length){
            container.innerHTML = list.map((a,i)=> `
              <label style="display:block;border:1px solid #e2e8f0;padding:12px;margin:6px 0;border-radius:10px;cursor:pointer;background:#fff">
                <input type="radio" name="address" value="${a._id || i}" ${i===0?'checked':''} style="margin-right:8px"> 
                <b style="font-size:13px">${a.name||a.fullName||'HOME'}</b> - ${a.house||a.line1||''}, ${a.area||''}, ${a.city||''} - ${a.phone||''}
              </label>
            `).join('');
            this.currentAddress = list[0];
          } else {
            container.innerHTML = `<p style="color:#94a3b8;padding:12px">No saved address. <a href="../profile/profile.html">Add karo</a> ya neeche guest address use karo.</p>`;
            this.currentAddress = { _id: 'guest_addr', name: 'Guest', line1: 'Default', city: 'Ahmedabad' };
          }
        }
      } catch(e){
        console.log('Address load skip, using guest:', e.message);
        const container = document.getElementById('address-list');
        if(container){
          container.innerHTML = `<p style="color:#64748b;padding:10px">Address API not logged in - Guest checkout</p>`;
        }
        this.currentAddress = { _id: 'guest_addr', name: 'Guest', phone: '', line1: 'Current Location', city: 'Default' };
      }
    },

    bindPayment(){
      document.querySelectorAll('[name="paymentMode"], [data-payment-mode]').forEach(el=>{
        const handler = (e)=>{
          const val = e.target.value || e.target.dataset.paymentMode || e.target.dataset.method;
          if(val) this.paymentMode = val;
        };
        el.addEventListener('change', handler);
        el.addEventListener('click', handler);
      });
      // default COD
      this.paymentMode = 'cod';
      const codRadio = document.querySelector('input[value="cod"]');
      if(codRadio) codRadio.checked = true;
    },

    getSelectedAddress(){
      const selected = document.querySelector('input[name="address"]:checked');
      if(!selected) return this.currentAddress || { _id: 'guest_addr', name: 'Guest' };
      // If _id based list, find object
      if(this.currentAddress && this.currentAddress._id === selected.value){
        return this.currentAddress;
      }
      // Return whatever selected
      return this.currentAddress || { _id: selected.value };
    },

    async placeOrder(){
      const buyer = getBuyerInfo();
      const supplier = this.currentSupplier;

      if(this.currentItems.length === 0){
        alert('Cart khali hai');
        return;
      }

      const btn = document.getElementById('place-order-btn');
      if(btn){ btn.disabled = true; btn.textContent = 'Placing Order...'; }

      const total = this.currentItems.reduce((s,i)=> s + (Number(i.price||0)*Number(i.qty||1)), 0);

      const payload = {
        buyerId: buyer.buyerId,
        buyerRole: buyer.buyerRole,
        buyerShopId: buyer.buyerShopId,
        buyerAreaId: buyer.buyerAreaId,
        supplierId: supplier.supplierId,
        supplierRole: supplier.supplierRole,
        supplierShopId: supplier.shopId,
        shopId: supplier.shopId || supplier.supplierId,
        areaId: buyer.buyerAreaId,
        items: this.currentItems,
        addressId: this.getSelectedAddress()?._id || localStorage.getItem('selectedAddressId') || null,
        address: this.getSelectedAddress(),
        addressText: localStorage.getItem('selectedAddressText') || '',
        paymentMode: this.paymentMode,
        paymentMethod: this.paymentMode,
        isBulkOrder: buyer.buyerRole !== 'customer' && buyer.buyerRole !== 'guest',
        total: total,
        totalAmount: total,
        gstInvoiceNeeded: document.getElementById('gst-needed')?.checked || false,
        gstNumber: document.getElementById('gst-number')?.value || null
      };

      console.log('Placing order payload:', payload);

      try {
        const res = await fetch(getApiBase() + API.checkout, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if(!data.success) throw new Error(data.message || 'Checkout failed');

        // Clear cart - V3
        if(window.CartCore){
          await window.CartCore.clear(supplier.supplierId);
        }
        try{ sessionStorage.removeItem('cart_bkp_'+supplier.supplierId); }catch(e){}

        const orderId = data.orderId || data._id || data.order?._id || 'ORD'+Date.now();
        window.location.href = `/shop-templates/common/checkout/order-success.html?orderId=${orderId}&supplierId=${supplier.supplierId}&shopId=${payload.shopId}&amount=${total}`;

      } catch(e){
        console.error('Order fail:', e);
        alert('Order fail: ' + e.message);
        if(btn){ btn.disabled = false; btn.textContent = 'Place Order'; }
      }
    }
  };

  // Auto init only on checkout.html
  document.addEventListener('DOMContentLoaded', ()=>{
    if(window.location.pathname.includes('checkout.html')){
      setTimeout(()=> {
        // Wait for CartCore
        if(window.CartCore && window.CartCore.ready){
          window.CartCore.ready.then(()=> window.HierarchyCheckout.init());
        } else {
          window.HierarchyCheckout.init();
        }
      }, 800);
      
      document.getElementById('place-order-btn')?.addEventListener('click', (e)=>{
        e.preventDefault();
        window.HierarchyCheckout.placeOrder();
      });
    }
  });

  console.log('✅ HierarchyCheckout V14 Fixed - stable guest_id + CartCore ready wait + esc');
})();