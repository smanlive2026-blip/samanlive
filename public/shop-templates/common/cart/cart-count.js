// common/cart/cart-count.js - Jo header me count dikhata hai
document.addEventListener('DOMContentLoaded', ()=>{
  const shopId = new URLSearchParams(window.location.search).get('shopId') || localStorage.getItem('lastShopId');
  if(!shopId) return;
  if(window.CommonCart) CommonCart.updateCount(shopId);
});