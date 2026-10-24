// LOCATION: common/checkout/checkout.js - FIXED V3 - Matches CartCore V3 - NO localStorage guestId mismatch
// Depends: cart-core.js V3, role-hierarchy.js, api-core.js
class CheckoutCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
    this.supplierId = new URLSearchParams(location.search).get('supplierId') || this.shopId || '';
    this.api = `/api/common/checkout`;
  }

  // FIXED: CartCore V3 wala hi guest_id use karo - sessionStorage guest_id
  getBuyerInfo(){
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

  getApiBase(){
    return window.API_BASE || window.EnvConfig?.API_BASE || window.location.origin;
  }

  getAuthHeaders(){
    const token = (window.AuthCore && window.AuthCore.getToken && window.AuthCore.getToken()) || localStorage.getItem('TOKEN') || localStorage.getItem('token') || '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  // Main placeOrder - CartCore se items lega, server pe purana cart fetch nahi karega
  async placeOrder({ addressId, paymentMethod='cod', amount }){
    try{
      const buyer = this.getBuyerInfo();
      const supplierId = this.supplierId || this.shopId;

      // 1. CartCore V3 se items lo - supplier wise
      let items = [];
      if(window.CartCore){
        items = window.CartCore.getCartBySupplier(supplierId);
        if(!items || items.length === 0){
          items = window.CartCore.getCart(); // fallback - all suppliers
        }
      }

      if(!items || items.length === 0){
        alert('Cart khali hai - pehle saman add karo');
        return { success:false, message:'Cart empty' };
      }

      const total = amount || items.reduce((s,i)=> s + (Number(i.price||0) * Number(i.qty||1)), 0);

      // 2. Payload - hierarchy-checkout.js wala format se match
      const payload = {
        shopId: this.shopId || supplierId,
        supplierId: supplierId,
        supplierRole: new URLSearchParams(location.search).get('supplierRole') || 'shop_owner',
        buyerId: buyer.buyerId,
        buyerRole: buyer.buyerRole,
        buyerShopId: buyer.buyerShopId,
        items: items,
        total: total,
        totalAmount: total,
        addressId: addressId || localStorage.getItem('selectedAddressId') || null,
        addressText: localStorage.getItem('selectedAddressText') || '',
        paymentMethod: paymentMethod || 'cod',
        isBulkOrder: buyer.buyerRole !== 'customer' && buyer.buyerRole !== 'guest',
        createdAt: new Date().toISOString()
      };

      console.log('CheckoutCore placeOrder payload:', payload);

      // 3. Server pe order place
      const res = await fetch(`${this.getApiBase()}${this.api}/${payload.shopId}/place`, {
        method:'POST',
        headers: this.getAuthHeaders(),
        credentials:'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if(data.success){
        // 4. Cart clear - supplier wise
        if(window.CartCore){
          await window.CartCore.clear(supplierId);
        }
        // sessionStorage backup bhi clear
        try{ sessionStorage.removeItem('cart_bkp_'+supplierId); }catch(e){}

        // 5. Success redirect
        const orderId = data.orderId || data.order?.orderId || data._id || 'ORD'+Date.now();
        window.location.href = `./order-success.html?shopId=${payload.shopId}&orderId=${orderId}&amount=${total}&supplierId=${supplierId}`;
      } else {
        alert(data.message || 'Order fail ho gaya');
      }
      return data;

    }catch(e){
      console.error('Checkout failed', e);
      alert('Checkout error: ' + e.message);
      return { success:false, message:e.message };
    }
  }

  // For COD modal - direct call
  async placeCODOrder(amount){
    const addressId = localStorage.getItem('selectedAddressId');
    return this.placeOrder({ addressId, paymentMethod:'cod', amount });
  }

  // For UPI - after UPI app return
  async placeUPIOrder(amount, upiApp){
    const addressId = localStorage.getItem('selectedAddressId');
    // UPI ke liye alag payload me upiApp add kar sakte ho if needed
    return this.placeOrder({ addressId, paymentMethod:'upi', amount });
  }
}

window.CheckoutCore = new CheckoutCore();
console.log('✅ CheckoutCore V3 Fixed - Uses CartCore V3 getCartBySupplier, stable guest_id');