// LOCATION: public/admin-panel/assets/connection-map.js - FULL LOGIC - REAL TIME CHECK - ERROR DETAIL
const $ = (id)=>document.getElementById(id);
const LOG = (m)=>{ const l=$('log'); l.innerText = new Date().toLocaleTimeString()+' > '+m+'\n'+l.innerText; };

const AREA_CHECKS = [
  {name:'area-manager.html', file:'../area-manager.html', connects:['assets/js/area-manager.js','assets/js/shop-create.js','assets/js/shop-template-map.js'], note:'Entry - Yaha se manager login'},
  {name:'area-manager.js', file:'../assets/js/area-manager.js', connects:['location.shop.js','shop-create.js','/api/area/managers'], note:'Area list + Shop create call'},
  {name:'shop-create.js', file:'../assets/js/shop-create.js', connects:['server/routes/managerShopCreate.js','models/Shop.js','shop-template-map.js'], note:'Shop Type select karke template jodta hai'},
  {name:'shop-template-map.js', file:'../assets/js/shop-template-map.js', connects:['shop-templates/kirana/dashboard.html','shop-templates/dairy/dashboard.html'], note:'Kaunsa shopType kaunsa folder kholega'},
  {name:'location.shop.js', file:'../assets/js/location.shop.js', connects:['server/routes/location.js','models/Shop.js'], note:'Shop ki location save'},
];

const DASH_CHECKS = [
  {shop:'kirana', file:'../shop-templates/kirana/dashboard.html', js:'../shop-templates/kirana/dashboard.js', connects:['common/core/dashboard-core.js','common/core/socket-core.js','common/products/product-manager.js','common/orders/orders.js','common/finance/wallet.js','/api/shops/kirana/*'], note:'Kirana dashboard sab common se juda'},
  {shop:'dairy', file:'../shop-templates/dairy/dashboard.html', js:'../shop-templates/dairy/dashboard.js', connects:['common/core/dashboard-core.js','common/products/product-manager.js','common/orders/orders.js','common/live/live-orders.html'], note:'Dairy dashboard'},
  {shop:'cloth', file:'../shop-templates/cloth/dashboard.html', js:'../shop-templates/cloth/dashboard.js', connects:['common/products/product-manager.js','common/orders/orders.js'], note:'Cloth'},
];

const SHOP_VIEW_LIST = ['kirana','dairy','cloth','mobile','bakery','fruit','restaurant','medical','beauty','sports','electronics','furniture','hardware','salon','auto'];

const COMMON_CHECKS = [
  {name:'cart-core.js', file:'../shop-templates/common/cart/cart-core.js', mustNot:['addItem','removeItem','getCart()','CartCore.getCart'], mustHave:['CartCore.add','CartCore.remove','CartCore.updateQty','CartCore.cart','saman_guest'], errorIfWrong:'Purana naam use hua to Cart page Khali dikhega - addItem -> add, removeItem -> remove', connects:['server/routes/common/index.js','models/Cart.js']},
  {name:'cart-count.js', file:'../shop-templates/common/cart/cart-count.js', mustHave:['data-cart-count','CartCore'], connects:['cart-core.js']},
  {name:'product-manager.js', file:'../shop-templates/common/products/product-manager.js', mustHave:['WorldProduct','getProducts'], connects:['/api/world-products','models/WorldProduct.js']},
  {name:'checkout.js', file:'../shop-templates/common/checkout/checkout.js', mustHave:['/api/common/checkout','place'], connects:['server/routes/common/checkout.routes.js','models/Order.js','socket new-order']},
  {name:'socket-core.js', file:'../shop-templates/common/core/socket-core.js', mustHave:['io','join-shop'], connects:['server.js global.io']},
  {name:'cart-drawer.html', file:'../shop-templates/common/cart/cart-drawer.html', mustNot:['removeItem','getCart'], mustHave:['CartCore.remove'], connects:['cart-core.js']},
];

const SERVER_CHECKS = [
  {name:'server.js Socket', type:'file', file:'../../server/server.js', mustHave:['global.io','Server','join-shop','new-order'], note:'Socket.IO init'},
  {name:'common/index.js', type:'file', file:'../../server/routes/common/index.js', mustHave:['checkout','cart'], note:'Common routes register'},
  {name:'checkout.routes.js', type:'file', file:'../../server/routes/common/checkout.routes.js', mustHave:['/orders/my','/summary','/place','shopId'], note:'MY ORDERS route :shopId se PEHLE hona chahiye warna orders ko shopId samjhega'},
  {name:'Cart API live?', type:'api', api:'/api/common/checkout/test-id/summary', note:'DB buffering check'},
  {name:'World Products API', type:'api', api:'/api/world-products?shopId=test', note:'WorldProduct model'},
  {name:'Health API', type:'api', api:'/api/health', note:'Server zinda?'},
];

const WASTE_FILES = [
  {name:'profile/js/wishlist.html', reason:'JS folder ke andar HTML pada hai - /profile/js/wishlist.html -> ye /profile/wishlist.html me hona chahiye, duplicate hai', path:'public/profile/js/wishlist.html'},
  {name:'server/routes/common/checkout.routes.js duplicate logic', reason:'server.js me /api/orders/shop/:shopId aur /api/common/checkout dono same kaam kar rahe hain - ek hi rakho', path:'server/server.js line 128'},
  {name:'deliveryManagerRoutes double use', reason:'server.js me 2 baar app.use /api deliveryManagerRoutes - ek commented hai ek active, confusion', path:'server/server.js'},
  {name:'location routes double', reason:'/api/location 2 baar register - location.js aur user.location.routes.js dono /api/location pe - ek /api/location/user rakho', path:'server/server.js'},
  {name:'areaManagerRoutes double', reason:'areaManagerRoutes aur managerShopCreate dono /api pe - dono /api/area aur /api/manager pe alag karo', path:'server/server.js'},
  {name:'public/shop-templates/common/cart/cart-drawer.html old', reason:'Ye purana drawer hai jo getCart() use karta hai - naya wala cart-core se jodna hai', path:'public/shop-templates/common/cart/cart-drawer.html'},
];

async function checkFile(path){
  try{ const r=await fetch(path+'?t='+Date.now()); if(!r.ok) return {ok:false, err:`${r.status} Not Found - File server pe nahi hai ya path galat: ${path}`, txt:''}; const txt=await r.text(); return {ok:true, txt, size:txt.length}; }catch(e){ return {ok:false, err:e.message, txt:''}; }
}
async function checkApi(url){ try{ const r=await fetch(url,{credentials:'include'}); const t=await r.text(); if(r.status===404) return {ok:false, err:`404 - API route register nahi hai server.js me. /api/common/index.js check karo`, status:r.status}; if(r.status>=500) return {ok:false, err:`${r.status} Server Error - ${t.slice(0,180)}`, status:r.status}; return {ok:true, status:r.status, txt:t}; }catch(e){ return {ok:false, err:e.message}; } }

function makeCard(parent, title, sub, status, rows, connects){
  const d=document.createElement('div'); d.className='card';
  let html=`<div class="dot ${status}"></div><b>${title}</b><small>${sub}</small>`;
  rows.forEach(r=>{ html+=`<div class="row ${r.ok?'':'bad2'} ${r.warn?'warn2':''}"><span>${r.label}</span><span class="badge ${r.ok?'bg': r.warn?'by':'br'}">${r.val}</span></div>`; if(r.err) html+=`<div style="font-size:9px;color:#fca5a5;margin-top:3px">${r.err}</div>`; });
  if(connects && connects.length){ html+=`<div class="conn"><i class="fa-solid fa-link"></i> Connected to: ${connects.join(' , ')}</div>`; }
  d.innerHTML=html; parent.appendChild(d);
}

async function run(){
  $('areaLayer').innerHTML=''; $('dashLayer').innerHTML=''; $('shopLayer').innerHTML=''; $('commonLayer').innerHTML=''; $('serverLayer').innerHTML=''; $('wasteLayer').innerHTML='';
  LOG('Full scan start...');

  for(const c of AREA_CHECKS){
    const res=await checkFile(c.file);
    makeCard($('areaLayer'), c.name, c.file+' - '+c.note, res.ok?'ok':'bad', [{label: res.ok? Math.round(res.size/1024)+'KB':'Missing', val: res.ok?'CONNECTED':'ERROR', ok:res.ok, err:res.err}], c.connects);
  }

  for(const c of DASH_CHECKS){
    const res=await checkFile(c.file); const resJs=await checkFile(c.js);
    const ok=res.ok && resJs.ok;
    const txt=(res.txt||'') + (resJs.txt||'');
    const hasSocket=txt.includes('socket') || txt.includes('io');
    const hasProdMgr=txt.includes('product-manager') || txt.includes('WorldProductManager') || txt.includes('getProducts');
    makeCard($('dashLayer'), c.shop+' dashboard', c.file, ok?'ok':'bad', [
      {label:'HTML exists', val:res.ok?'YES':'NO', ok:res.ok, err:res.err},
      {label:'dashboard.js exists', val:resJs.ok?'YES':'NO', ok:resJs.ok, err:resJs.err},
      {label:'socket-core linked?', val:hasSocket?'YES':'NO', ok:hasSocket, warn:!hasSocket, err: !hasSocket?'Live order ke liye socket-core.js jodna hai warna new-order ghanti nahi bajegi':''},
      {label:'product-manager linked?', val:hasProdMgr?'YES':'NO', ok:hasProdMgr}
    ], c.connects);
  }

  for(const name of SHOP_VIEW_LIST){
    const path=`../shop-templates/${name}/customer-view.html`; const res=await checkFile(path);
    if(!res.ok){ makeCard($('shopLayer'), name, path, 'bad', [{label:'File missing', val:'NO FILE', ok:false, err:res.err}], []); continue; }
    const hasCore=res.txt.includes('cart-core.js'); const hasWrong=res.txt.includes('CartCore.addItem') || res.txt.includes('CartCore.removeItem'); const hasCount=res.txt.includes('data-cart-count'); const hasProdMgr=res.txt.includes('product-manager');
    const status = (!hasCore || hasWrong)? 'bad' : (!hasCount? 'warn':'ok');
    makeCard($('shopLayer'), name+' user-view', path, status, [
      {label:'cart-core.js se juda?', val:hasCore?'YES':'NO', ok:hasCore, err: !hasCore?'SERVER CART se nahi judega, localStorage wala chalega jo Cart page pe khali dikhega':''},
      {label:'Galat naam addItem/removeItem', val:hasWrong?'ERROR':'OK', ok:!hasWrong, err: hasWrong?'Yehi teri Cart Khali wali error hai - addItem ko add, removeItem ko remove karo':''},
      {label:'data-cart-count badge', val:hasCount?'YES':'NO', ok:hasCount, warn:!hasCount},
      {label:'product-manager se juda?', val:hasProdMgr?'YES':'NO', ok:hasProdMgr}
    ], ['common/cart/cart-core.js','common/products/product-manager.js','/api/world-products']);
  }

  for(const c of COMMON_CHECKS){
    const res=await checkFile(c.file); if(!res.ok){ makeCard($('commonLayer'), c.name, c.file, 'bad', [{label:'404', val:'MISSING', ok:false, err:res.err}], c.connects); continue; }
    let ok=true, errs=[]; if(c.mustHave) c.mustHave.forEach(k=>{ if(!res.txt.includes(k)){ ok=false; errs.push(`'${k}' nahi mila`); }}); if(c.mustNot) c.mustNot.forEach(k=>{ if(res.txt.includes(k)){ ok=false; errs.push(`'${k}' galat hai`); }});
    makeCard($('commonLayer'), c.name, c.file, ok?'ok':'bad', [{label: errs.length? errs.join(', '): Math.round(res.size/1024)+'KB OK', val: ok?'CONNECTED':'ERROR', ok, err: (errs.join(' | ') + (c.errorIfWrong? ' | '+c.errorIfWrong:''))}], c.connects);
  }

  for(const c of SERVER_CHECKS){
    if(c.type==='file'){ const res=await checkFile(c.file); let ok=res.ok, errs=[]; if(res.ok && c.mustHave) c.mustHave.forEach(k=>{ if(!res.txt.includes(k)){ ok=false; errs.push(k+' missing'); }}); makeCard($('serverLayer'), c.name, c.file+' - '+c.note, ok?'ok':'bad', [{label: ok? 'Found':'Missing', val: ok?'OK':'ERROR', ok, err: errs.join(', ')||res.err}], []); }
    else { const res=await checkApi(c.api); makeCard($('serverLayer'), c.name, c.api+' - '+c.note, res.ok?'ok':'bad', [{label: res.ok? 'Status '+res.status:'Fail', val: res.ok?'LIVE':'ERROR', ok:res.ok, err:res.err}], []); }
  }

  WASTE_FILES.forEach(w=>{ makeCard($('wasteLayer'), w.name, w.path, 'bad', [{label:w.reason, val:'FALTU / DUPLICATE', ok:false, err:''}], []); });

  LOG('Scan khatam. Jo BAD hai usko pehle sahi kar - specially cart-core wala.');
}
document.getElementById('recheckBtn').addEventListener('click', run);
run();