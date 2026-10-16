// LOCATION: public/shop-templates/common/checkout/hierarchy-checkout.js - V13 - MINIMAL localStorage
// Depends: role-hierarchy.js, cart-core.js, api-core.js
(function(){
  const API = {
    checkout: '/api/common/checkout',
    address: '/api/user/addresses', // tumhara existing address API
    wallet: '/api/common/wallet/balance' // optional
  };

  function getApiBase(){
    return window.API_BASE || window.EnvConfig?.API_BASE || window.location.origin;
  }

  function getAuthHeaders(){
    const token = (window.AuthCore && window.AuthCore.getToken && window.AuthCore.getToken()) || '';
    return {
      'Content-Type': 'application/json',
      ...(token? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  function getQueryParam(name){
    return new URLSearchParams(window.location.search).get(name);
  }

  function getBuyerInfo(){
    return {
      buyerId: window.RoleHierarchy.getMyId() || 'guest_' + Date.now(),
      buyerRole: window.RoleHierarchy.getMyRole(),
      buyerShopId: window.RoleHierarchy.getMyShopId(),
      buyerAreaId: window.AreaId || null
    };
  }

  function getSupplierFromUrl(){
    // URL: checkout.html?supplierId=xxx&supplierRole=yyy&shopId=zzz
    return {
      supplierId: getQueryParam('supplierId') || getQueryParam('shopId'),
      supplierRole: getQueryParam('supplierRole') || 'shop_owner',
      shopId: getQueryParam('shopId') || getQueryParam('supplierId'),
      supplierName: getQueryParam('supplierName') || 'Shop'
    };
  }

  window.HierarchyCheckout = {
    currentSupplier: null,
    currentItems: [],
    currentAddress: null,
    paymentMode: 'cod',

    async init(){
      this.currentSupplier = getSupplierFromUrl();
      if(!this.currentSupplier.supplierId){
        console.warn('No supplierId in URL, trying cart first supplier');
        const allCarts = window.CartCore? window.CartCore.getAllCarts() : {};
        const firstSid = Object.keys(allCarts)[0];
        if(firstSid){
          this.currentSupplier.supplierId = firstSid;
          this.currentSupplier.shopId = firstSid;
        } else {
          alert('Cart empty, shop pe jao');
          window.location.href = '/';
          return;
        }
      }

      this.currentItems = window.CartCore? window.CartCore.getCartBySupplier(this.currentSupplier.supplierId) : [];
      if(this.currentItems.length === 0){
        // fallback all carts
        this.currentItems = window.CartCore? window.CartCore.getCart() : [];
      }

      console.log('Checkout init:', this.currentSupplier, this.currentItems);
      this.renderSummary();
      this.loadAddresses();
      this.bindPayment();
    },

    renderSummary(){
      const total = this.currentItems.reduce((s,i)=> s + (i.price * i.qty), 0);
      const isBulk = getBuyerInfo().buyerRole!== 'customer' && getBuyerInfo().buyerRole!== 'guest';
      
      // commission show
      let commission = 0;
      if(this.currentSupplier.supplierRole!== 'admin') commission = Math.round(total * 0.05);
      const finalTotal = total; // customer total hi pay karega, commission backend me katega

      // UI elements - checkout.html me ye IDs honi chahiye
      const el = (id)=> document.getElementById(id);
      if(el('checkout-items')) el('checkout-items').innerHTML = this.currentItems.map(i=> `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee">
          <span>${i.name} x ${i.qty}</span><span>₹${i.price * i.qty}</span>
        </div>
      `).join('');
      if(el('checkout-subtotal')) el('checkout-subtotal').textContent = `₹${total}`;
      if(el('checkout-commission')) el('checkout-commission').textContent = isBulk? `₹${commission} (Admin commission)` : '₹0';
      if(el('checkout-total')) el('checkout-total').textContent = `₹${finalTotal}`;
      if(el('checkout-supplier-name')) el('checkout-supplier-name').textContent = `${this.currentSupplier.supplierName} (${this.currentSupplier.supplierRole})`;
      
      // GST field show only for bulk
      if(el('gst-section')){
        el('gst-section').style.display = isBulk? 'block' : 'none';
      }
    },

    async loadAddresses(){
      // Simple - profile addresses se
      try {
        const res = await fetch(getApiBase() + API.address, { headers: getAuthHeaders() });
        const data = await res.json();
        const list = data.data || data.addresses || [];
        const container = document.getElementById('address-list');
        if(container && list.length){
          container.innerHTML = list.map((a,i)=> `
            <label style="display:block;border:1px solid #ddd;padding:10px;margin:6px 0;border-radius:8px">
              <input type="radio" name="address" value="${a._id || i}" ${i===0?'checked':''}> 
              ${a.name||''} - ${a.line1||''}, ${a.city||''} - ${a.phone||''}
            </label>
          `).join('');
          this.currentAddress = list[0];
        }
      } catch(e){
        console.log('Address load skip', e.message);
      }
    },

    bindPayment(){
      document.querySelectorAll('[name="paymentMode"], [data-payment-mode]').forEach(el=>{
        el.addEventListener('change', (e)=>{
          const val = e.target.value || e.target.dataset.paymentMode;
          if(val) this.paymentMode = val;
        });
        el.addEventListener('click', (e)=>{
          const val = e.target.value || e.target.dataset.paymentMode;
          if(val) this.paymentMode = val;
        });
      });
      // default
      const codRadio = document.querySelector('input[value="cod"]');
      if(codRadio) this.paymentMode = 'cod';
    },

    getSelectedAddress(){
      const selected = document.querySelector('input[name="address"]:checked');
      if(!selected) return this.currentAddress || { name: 'Guest', phone: '', line1: 'Default', city: 'Ahmedabad' };
      // agar id hai toh address object dhoondo - simplified
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
      if(btn){ btn.disabled = true; btn.textContent = 'Placing...'; }

      const payload = {
        buyerId: buyer.buyerId,
        buyerRole: buyer.buyerRole,
        buyerShopId: buyer.buyerShopId,
        buyerAreaId: buyer.buyerAreaId,
        supplierId: supplier.supplierId,
        supplierRole: supplier.supplierRole,
        supplierShopId: supplier.shopId,
        shopId: supplier.shopId,
        areaId: buyer.buyerAreaId,
        items: this.currentItems,
        addressId: this.getSelectedAddress()?._id || null,
        address: this.getSelectedAddress(),
        paymentMode: this.paymentMode,
        isBulkOrder: buyer.buyerRole!== 'customer' && buyer.buyerRole!== 'guest',
        total: this.currentItems.reduce((s,i)=> s + (i.price * i.qty), 0),
        gstInvoiceNeeded: document.getElementById('gst-needed')?.checked || false,
        gstNumber: document.getElementById('gst-number')?.value || null
      };

      try {
        const res = await fetch(getApiBase() + API.checkout, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if(!data.success) throw new Error(data.message || 'Checkout failed');

        // Clear cart
        if(window.CartCore) await window.CartCore.clear(supplier.supplierId);

        // Success page
        const orderId = data.orderId || data._id;
        window.location.href = `/shop-templates/common/checkout/order-success.html?orderId=${orderId}&supplierId=${supplier.supplierId}`;

      } catch(e){
        console.error(e);
        alert('Order fail: ' + e.message);
        if(btn){ btn.disabled = false; btn.textContent = 'Place Order'; }
      }
    }
  };

  // Auto init on checkout page
  document.addEventListener('DOMContentLoaded', ()=>{
    if(window.location.pathname.includes('checkout.html')){
      // CartCore restore hone ke baad
      setTimeout(()=> window.HierarchyCheckout.init(), 600);
      // Place order button
      document.getElementById('place-order-btn')?.addEventListener('click', ()=> window.HierarchyCheckout.placeOrder());
    }
  });

  console.log('✅ HierarchyCheckout loaded');
})();