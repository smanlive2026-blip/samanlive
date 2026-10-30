// LOCATION: public/shop-templates/fuel/customer-view.js - V20 WORLD CLASS - FUEL USER VIEW - FULL CODE
// UAR: public/shop-templates/common/js/customer-shop-status.js
// UAR: public/shop-templates/common/core/api-core.js - apiCall
// UAR: public/assets/js/location.core.js + location.shop.js + location.user.js - Location
// UAR: public/shop-templates/common/cart/cart-core.js - Cart
// UAR: public/shop-templates/common/js/wishlist.js, share.js, review.js

console.log('LOCATION: fuel/customer-view.js | WORLD CLASS USER VIEW | MODE: fuel | UAR: common/*');

const FUEL_USER_CONFIG = {
  type: 'fuel',
  mode: 'fuel',
  name: 'Fuel Pump User View',
  icon: '⛽',
  color: '#dc2626',
  commonConnected: true,
  locationConnected: true
};

async function initFuelUser(){
  if(window.LocationCore) await LocationCore.init();
  if(window.LocationShop) await LocationShop.init();
  console.log('LOCATION: Fuel user view ready - UAR common + location.*');
}

document.addEventListener('DOMContentLoaded', initFuelUser);
window.FUEL_USER_CONFIG = FUEL_USER_CONFIG;