// LOCATION: common/cart/cart-core.js - WORLD CLASS CART CORE - API ONLY (NO LOCALSTORAGE CART)
class CartCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
    this.userId = window.currentUser?._id || 'guest_' + (localStorage.getItem('guestId') || this.genGuestId());
    this.api = '/api/common/cart';
    this.cart = { items:[], total:0, count:0 };
  }

  genGuestId(){
    const id = 'g_' + Date.now() + Math.random().toString(36).slice(2,7);
    localStorage.setItem('guestId', id);
    return id;
  }

  async getCart(){
    if(!this.shopId) return this.cart;
    try{
      const res = await fetch(`${this.api}/${this.shopId}?userId=${this.userId}&t=${Date.now()}`, { credentials:'include', cache:'no-store' });
      const data = await res.json();
      this.cart = data.cart || data || { items:[], total:0, count:0 };
      this.updateUI();
      return this.cart;
    }catch(e){
      console.error('Cart get failed', e);
      return this.cart;
    }
  }

  async addItem(product, qty=1){
    if(!this.shopId) return alert('Shop ID missing');
    try{
      const res = await fetch(`${this.api}/${this.shopId}/add`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body: JSON.stringify({ product, qty, userId: this.userId })
      });
      const data = await res.json();
      if(data.success){
        this.cart = data.cart;
        this.updateUI();
        this.showToast(`${product.name || 'Item'} added 🛒`, 'success');
        // Update count badge
        if(window.CartCount) window.CartCount.refresh();
      } else {
        this.showToast(data.message || 'Add failed', 'error');
      }
      return data;
    }catch(e){
      console.error(e);
      this.showToast('Cart error', 'error');
    }
  }

  async removeItem(productId){
    try{
      const res = await fetch(`${this.api}/${this.shopId}/remove`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body: JSON.stringify({ productId, userId: this.userId })
      });
      const data = await res.json();
      if(data.success){
        this.cart = data.cart;
        this.updateUI();
        if(window.CartCount) window.CartCount.refresh();
      }
      return data;
    }catch(e){ console.error(e); }
  }

  async updateQty(productId, qty){
    if(qty <=0) return this.removeItem(productId);
    try{
      const res = await fetch(`${this.api}/${this.shopId}/update`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body: JSON.stringify({ productId, qty, userId: this.userId })
      });
      const data = await res.json();
      if(data.success){ this.cart = data.cart; this.updateUI(); if(window.CartCount) window.CartCount.refresh(); }
      return data;
    }catch(e){ console.error(e); }
  }

  updateUI(){
    // Update all cart count elements
    document.querySelectorAll('[data-cart-count]').forEach(el=>{
      el.innerText = this.cart.count || 0;
      el.style.display = (this.cart.count||0) >0 ? 'grid' : 'none';
    });
    // Update cart total
    document.querySelectorAll('[data-cart-total]').forEach(el=>{
      el.innerText = `₹${this.cart.total || 0}`;
    });
    // Dispatch event for other modules
    window.dispatchEvent(new CustomEvent('cart:updated', { detail:this.cart }));
  }

  showToast(msg, type='success'){
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:${type==='success'?'#0f172a':'#ef4444'};color:#fff;padding:12px 18px;border-radius:12px;font-weight:700;font-family:Outfit,sans-serif;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.2)`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(()=> toast.remove(), 2000);
  }

  // For checkout button
  goToCheckout(){
    if(!this.cart.items || this.cart.items.length===0) return alert('Cart empty');
    window.location.href = `/shop-templates/common/checkout/checkout.html?shopId=${this.shopId}`;
  }
}

window.CartCore = new CartCore();
document.addEventListener('DOMContentLoaded', ()=> window.CartCore.getCart());