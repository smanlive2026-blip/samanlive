// LOCATION: common/checkout/checkout.js - CHECKOUT CORE LOGIC
class CheckoutCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId')||'';
    this.api = `/api/common/checkout`;
  }

  async placeOrder({ addressId, paymentMethod='cod', amount }){
    try{
      const cartRes = await fetch(`/api/common/cart/${this.shopId}?t=${Date.now()}`, { credentials:'include', cache:'no-store' });
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
        userId: window.currentUser?._id || localStorage.getItem('guestId') || 'guest'
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