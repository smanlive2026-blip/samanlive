// LOCATION: public/shop-templates/common/cart/cart-count.js - CART BADGE - WORLD CLASS - NO LOCALSTORAGE
(function(){
  function update(count, total){
    document.querySelectorAll('[data-cart-count]').forEach(el=>{
      el.textContent = count || 0;
      el.style.display = count > 0? 'grid' : 'none';
    });
    document.querySelectorAll('[data-cart-total]').forEach(el=> el.textContent = '₹' + (total || 0));
  }
  function init(){
    if(window.CartCore){
      update(window.CartCore.cart.itemCount, window.CartCore.cart.total);
      window.CartCore.onChange(c => update(c.itemCount, c.total));
      window.CartCore.ready.then(()=> update(window.CartCore.cart.itemCount, window.CartCore.cart.total));
    } else {
      setTimeout(init, 100);
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();