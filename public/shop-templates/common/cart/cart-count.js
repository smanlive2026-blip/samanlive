// LOCATION: public/shop-templates/common/cart/cart-count.js - V3 HOTFIX - getTotalCount + getCount fallback
(function(){
  window.CartCount = {
    update(){
      let count = 0;
      try{
        if(window.CartCore){
          if(window.CartCore.getTotalCount) count = window.CartCore.getTotalCount();
          else if(window.CartCore.getCount) count = window.CartCore.getCount();
          else if(window.CartCore.getCartCount) count = window.CartCore.getCartCount();
          else if(window.CartCore.count) count = typeof window.CartCore.count === 'function' ? window.CartCore.count() : window.CartCore.count;
        }
      }catch(e){ count = 0; }
      
      document.querySelectorAll('[data-cart-count], #cart-count,.cart-badge,.cart-count').forEach(el=>{
        el.textContent = count;
        el.style.display = count > 0? 'flex' : 'none';
        if(count > 99) el.textContent = '99+';
      });
      const role = window.RoleHierarchy? window.RoleHierarchy.getMyRole() : 'customer';
      if(role === 'admin'){
        document.querySelectorAll('[data-cart-count]').forEach(el=> el.style.display='none');
      }
    },
    init(){
      window.addEventListener('cart:updated', ()=>{ this.update(); });
      document.addEventListener('DOMContentLoaded', ()=> { setTimeout(()=> this.update(), 800); });
      // Polling fallback agar CartCore late load ho
      let tries = 0;
      const interval = setInterval(()=>{
        this.update();
        tries++;
        if(tries>10) clearInterval(interval);
      }, 1000);
    }
  };
  window.CartCount.init();
  console.log('✅ CartCount V3 HOTFIX loaded');
})();