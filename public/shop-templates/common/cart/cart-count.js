// LOCATION: common/cart/cart-count.js - WORLD CLASS CART BADGE
class CartCount {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
    this.el = null;
  }

  init(){
    this.el = document.querySelector('[data-cart-count]');
    if(!this.el){
      // Auto create badge if header has cart icon
      const cartIcon = document.querySelector('[data-cart-icon]');
      if(cartIcon){
        cartIcon.style.position='relative';
        const badge = document.createElement('span');
        badge.setAttribute('data-cart-count','');
        badge.style.cssText = 'position:absolute;top:-8px;right:-8px;background:#ef4444;color:#fff;font-size:10px;font-weight:900;min-width:18px;height:18px;border-radius:10px;display:none;place-items:center;padding:0 4px';
        badge.innerText='0';
        cartIcon.appendChild(badge);
        this.el = badge;
      }
    }
    this.refresh();
    // Listen to cart updates
    window.addEventListener('cart:updated', (e)=> this.setCount(e.detail.count||0));
  }

  async refresh(){
    if(!window.CartCore) return;
    const cart = await window.CartCore.getCart();
    this.setCount(cart.count||0);
  }

  setCount(count){
    if(!this.el) return;
    this.el.innerText = count > 99 ? '99+' : count;
    this.el.style.display = count>0 ? 'grid' : 'none';
  }
}

window.CartCount = new CartCount();
document.addEventListener('DOMContentLoaded', ()=> window.CartCount.init());