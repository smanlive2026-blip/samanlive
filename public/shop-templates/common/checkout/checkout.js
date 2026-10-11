// LOCATION: common/checkout/checkout.js - CHECKOUT CORE LOGIC - FIXED V2 (USERID MATCH)
class CheckoutCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId')||'';
    this.api = `/api/common/checkout`;
  }

  // FIX: CartCore wala hi userId banao, nahi to server khali 'guest' cart dega
  getUserId(){
    if(window.CartCore && window.CartCore.userId) return window.CartCore.userId;
    if(window.currentUser && window.currentUser._id) return window.currentUser._id;
    let gid = localStorage.getItem('guestId');
    if(!gid){
      gid = 'g_' + Date.now() + Math.random().toString(36).slice(2,7);
      localStorage.setItem('guestId', gid);
    }
    return 'guest_' + gid;
  }

  async placeOrder({ addressId, paymentMethod='cod', amount }){
    try{
      const userId = this.getUserId();
      const cartRes = await fetch(`/api/common/cart/${this.shopId}?userId=${encodeURIComponent(userId)}&t=${Date.now()}`, { credentials:'include', cache:'no-store' });
      const cartData = await cartRes.json();
      const cart = cartData.cart || cartData;

      if(!cart.items || cart.items.length===0){
        alert('Cart empty');
        return { success:false };
      }

      const payload = {
        shopId: this.shopId,
        items: cart.items,
        total: amount || cart.total,
        addressId: addressId || localStorage.getItem('selectedAddressId'),
        paymentMethod,
        userId: userId
      };

      const res = await fetch(`${this.api}/${this.shopId}/place`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if(data.success){
        // Clear cart from memory (server side)
        // Redirect to success
        window.location.href = `./order-success.html?shopId=${this.shopId}&orderId=${data.orderId || data.order?.orderId}&amount=${payload.total}`;
      }
      return data;
    }catch(e){
      console.error('Checkout failed', e);
      return { success:false, message:e.message };
    }
  }
}

window.CheckoutCore = new CheckoutCore();