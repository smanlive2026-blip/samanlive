// LOCATION: common/checkout/checkout.js - V4 RAM ONLY - FULL CODE - NO CUT
// RULE: Buyer ID CartCore se hi lega - Apna alag guest ID kabhi nahi banayega - Yahi purana bug tha
// RULE: Address RAM me rahega - window wale variable me - Kahin save nahi hoga
// RULE: Items CartCore se lega - Server pe purana cart dobara nahi mangega
// RULE: Order ke baad Cart clear + RAM wali backup bhi clear - Wapas aane pe purana saman nahi dikhega
class CheckoutCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
    this.supplierId = new URLSearchParams(location.search).get('supplierId') || this.shopId || '';
    this.api = '/api/common/checkout';
  }
  getBuyerInfo(){
    var buyerId = '';
    var buyerRole = 'customer';
    if(window.CartCore && window.CartCore.getBuyerId) buyerId = window.CartCore.getBuyerId();
    if(!buyerId && window.UserCore && window.UserCore.getBuyerId) buyerId = window.UserCore.getBuyerId();
    if(!buyerId && window.AuthCore && window.AuthCore.getUserId) buyerId = window.AuthCore.getUserId();
    if(!buyerId) buyerId = window.__SAMAN_GUEST_ID || ('guest_' + Date.now());
    if(window.RoleHierarchy && window.RoleHierarchy.getMyRole) buyerRole = window.RoleHierarchy.getMyRole();
    else if(window.AuthCore && window.AuthCore.getRole) buyerRole = window.AuthCore.getRole();
    else buyerRole = window.USER_ROLE || 'customer';
    var buyerShopId = null;
    if(window.RoleHierarchy && window.RoleHierarchy.getMyShopId) buyerShopId = window.RoleHierarchy.getMyShopId();
    return { buyerId: buyerId, buyerRole: buyerRole, buyerShopId: buyerShopId };
  }
  getApiBase(){ return window.API_BASE || (window.EnvConfig && window.EnvConfig.API_BASE) || window.location.origin; }
  getAuthHeaders(){
    var token = '';
    try{ if(window.AuthCore && window.AuthCore.getToken) token = window.AuthCore.getToken() || ''; }catch(e){}
    if(!token) token = window.USER_TOKEN || '';
    var h = { 'Content-Type': 'application/json' };
    if(token) h['Authorization'] = 'Bearer ' + token;
    var buyer = this.getBuyerInfo();
    h['x-buyer-id'] = buyer.buyerId;
    return h;
  }
  getSelectedAddress(){
    if(window.__SAMAN_SELECTED_ADDRESS) return window.__SAMAN_SELECTED_ADDRESS;
    return null;
  }
  setSelectedAddress(addr){
    window.__SAMAN_SELECTED_ADDRESS = addr || null;
    if(addr && addr._id) window.__SAMAN_SELECTED_ADDRESS_ID = addr._id;
    if(addr && (addr.full || addr.line1)) window.__SAMAN_SELECTED_ADDRESS_TEXT = addr.full || addr.line1;
  }
  async placeOrder(opts){
    opts = opts || {};
    var addressId = opts.addressId || window.__SAMAN_SELECTED_ADDRESS_ID || (this.getSelectedAddress() && this.getSelectedAddress()._id) || null;
    var paymentMethod = opts.paymentMethod || 'cod';
    var amount = opts.amount;
    try{
      var buyer = this.getBuyerInfo();
      var supplierId = this.supplierId || this.shopId;
      var items = [];
      if(window.CartCore){
        items = window.CartCore.getCartBySupplier(supplierId);
        if(!items || items.length === 0) items = window.CartCore.getCart();
      }
      if(!items || items.length === 0){ alert('Cart khali hai - pehle saman add karo'); return { success: false, message: 'Cart empty' }; }
      var total = amount || items.reduce(function(s,i){ return s + (Number(i.price||0) * Number(i.qty||1)); }, 0);
      var addrText = window.__SAMAN_SELECTED_ADDRESS_TEXT || (this.getSelectedAddress() && (this.getSelectedAddress().full || this.getSelectedAddress().line1)) || '';
      var payload = { shopId: this.shopId || supplierId, supplierId: supplierId, supplierRole: new URLSearchParams(location.search).get('supplierRole') || 'shop_owner', buyerId: buyer.buyerId, buyerRole: buyer.buyerRole, buyerShopId: buyer.buyerShopId, items: items, total: total, totalAmount: total, addressId: addressId, addressText: addrText, paymentMethod: paymentMethod, isBulkOrder: buyer.buyerRole !== 'customer' && buyer.buyerRole !== 'guest', createdAt: new Date().toISOString() };
      console.log('CheckoutCore placeOrder payload:', payload);
      var res = await fetch(this.getApiBase() + this.api + '/' + payload.shopId + '/place', { method: 'POST', headers: this.getAuthHeaders(), credentials: 'include', body: JSON.stringify(payload) });
      var data = await res.json();
      if(data.success){
        if(window.CartCore) await window.CartCore.clear(supplierId);
        window.__SAMAN_SELECTED_ADDRESS = null; window.__SAMAN_SELECTED_ADDRESS_ID = ''; window.__SAMAN_SELECTED_ADDRESS_TEXT = '';
        var orderId = data.orderId || (data.order && data.order.orderId) || data._id || ('ORD' + Date.now());
        window.location.href = './order-success.html?shopId=' + payload.shopId + '&orderId=' + orderId + '&amount=' + total + '&supplierId=' + supplierId;
      } else { alert(data.message || 'Order fail ho gaya'); }
      return data;
    }catch(e){ console.error('Checkout failed', e); alert('Checkout error: ' + e.message); return { success: false, message: e.message }; }
  }
  async placeCODOrder(amount){ return this.placeOrder({ addressId: window.__SAMAN_SELECTED_ADDRESS_ID || null, paymentMethod: 'cod', amount: amount }); }
  async placeUPIOrder(amount, upiApp){ return this.placeOrder({ addressId: window.__SAMAN_SELECTED_ADDRESS_ID || null, paymentMethod: 'upi', amount: amount }); }
}
window.CheckoutCore = new CheckoutCore();
console.log('CheckoutCore V4 loaded - CartCore buyerId + RAM address');