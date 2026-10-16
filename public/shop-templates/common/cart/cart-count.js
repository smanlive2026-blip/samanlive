// LOCATION: public/shop-templates/common/cart/cart-count.js - V2 - NO localStorage
(function(){
  window.CartCount = {
    update(){
      const count = window.CartCore? window.CartCore.getTotalCount() : 0;
      // Sab jagah ke badges update
      document.querySelectorAll('[data-cart-count], #cart-count,.cart-badge,.cart-count').forEach(el=>{
        el.textContent = count;
        el.style.display = count > 0? 'flex' : 'none';
        if(count > 99) el.textContent = '99+';
      });
      // Admin / Manager dashboard pe badge hide
      const role = window.RoleHierarchy? window.RoleHierarchy.getMyRole() : 'customer';
      if(role === 'admin'){
        document.querySelectorAll('[data-cart-count]').forEach(el=> el.style.display='none');
      }
    },
    init(){
      // CartCore se event suno
      window.addEventListener('cart:updated', (e)=>{
        this.update();
      });
      // Page load pe
      document.addEventListener('DOMContentLoaded', ()=> {
        setTimeout(()=> this.update(), 800);
      });
    }
  };
  window.CartCount.init();
  console.log('✅ CartCount V2 loaded');
})();