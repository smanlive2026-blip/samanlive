// common/cart/cart-core.js - WORLD CLASS CART CORE
window.CommonCart = {
  getCart(shopId){
    return JSON.parse(localStorage.getItem(`cart_${shopId}`)||'[]');
  },
  addToCart(shopId, productIndex, qty=1){
    let cart = this.getCart(shopId);
    let existing = cart.find(c=> c.idx===productIndex);
    if(existing){ existing.qty += qty; }
    else{ cart.push({idx: productIndex, qty}); }
    localStorage.setItem(`cart_${shopId}`, JSON.stringify(cart));
    this.updateCount(shopId);
    // Socket / Analytics - common/analytics/sales-chart.js ko event bhej
    if(window.ShopCore) ShopCore.trackEvent('add_to_cart', {shopId, productIndex});
    return cart;
  },
  updateQty(shopId, index, delta){
    let cart = this.getCart(shopId);
    if(cart[index]){
      cart[index].qty += delta;
      if(cart[index].qty<=0) cart.splice(index,1);
    }
    localStorage.setItem(`cart_${shopId}`, JSON.stringify(cart));
    this.updateCount(shopId);
    return cart;
  },
  remove(shopId, index){
    let cart = this.getCart(shopId);
    cart.splice(index,1);
    localStorage.setItem(`cart_${shopId}`, JSON.stringify(cart));
    this.updateCount(shopId);
  },
  clear(shopId){
    localStorage.removeItem(`cart_${shopId}`);
    this.updateCount(shopId);
  },
  getTotal(shopId, products){
    let cart = this.getCart(shopId);
    return cart.reduce((sum,c)=>{
      const p = products[c.idx];
      return sum + (p? p.price*c.qty : 0);
    },0);
  },
  updateCount(shopId){
    const count = this.getCart(shopId).reduce((s,c)=>s+c.qty,0);
    // common/cart/cart-count.js ko trigger karega
    document.querySelectorAll('#cartCount,.cart-count').forEach(el=>{
      el.innerText = count;
      el.style.display = count? 'flex':'none';
    });
    // For common/components header
    localStorage.setItem(`cart_count_${shopId}`, count);
  }
};