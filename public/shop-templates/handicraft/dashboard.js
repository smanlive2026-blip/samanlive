// LOCATION: public/shop-templates/handicraft/dashboard.js - V20 WORLD CLASS - HANDICRAFT MODE - FULL CODE
// UAR: public/shop-templates/common/dashboard.js + core/api-core.js, dashboard-core.js, auth-core.js + location.core.js, location.shop.js, location.user.js + common/orders/orders.js, inventory/inventory.js, finance/wallet.js, analytics/analytics.js
// MODE: handicraft | SHOP: Handicraft / Handmade | ICON: 🎨 | COLOR: #a16207 | WORLD CLASS
console.log('LOCATION: public/shop-templates/handicraft/dashboard.js | WORLD CLASS | MODE: handicraft | UAR: common/*');
const HANDICRAFT_CONFIG = {type:'handicraft',mode:'handicraft',name:'Handicraft / Handmade',icon:'🎨',color:'#a16207',colorDark:'#78350f',tabs:['dashboard','products','custom-orders','artisans','orders','finance','analytics'],commonConnected:true,locationConnected:true,premium:true};
let shopId = new URLSearchParams(location.search).get('shopId');
async function initHandicraftWorldClass(){
  console.log('LOCATION: initHandicraftWorldClass - WORLD CLASS - HANDICRAFT - COMMON CONNECTED');
  try{
    if(window.DashboardCore) await DashboardCore.init(HANDICRAFT_CONFIG);
    if(window.LocationCore) await LocationCore.init();
    if(window.LocationShop) await LocationShop.init();
    console.log('LOCATION: handicraft dashboard ready - UAR common/* + location.*');
  }catch(e){ console.error(e); }
  finally{ let l=document.getElementById('loader'); if(l){ l.style.opacity='0'; setTimeout(()=>l.style.display='none',400); } }
}
document.addEventListener('DOMContentLoaded', initHandicraftWorldClass);
window.HANDICRAFT_CONFIG = HANDICRAFT_CONFIG;