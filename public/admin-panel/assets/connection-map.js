// LOCATION: public/admin-panel/assets/connection-map.js - V3 FIXED - NULL CHECK - SAB DIKHEGA
(function(){
const $ = (id)=>document.getElementById(id);
const LOG = (m)=>{ const l=$('log'); if(!l) return; l.innerText = new Date().toLocaleTimeString()+' > '+m+'\n'+l.innerText; };

const AREA_CHECKS = [
  {name:'area-manager.html', file:'../area-manager.html', connects:['assets/js/area-manager.js','shop-create.js'], note:'Entry'},
  {name:'area-manager.js', file:'../assets/js/area-manager.js', connects:['location.shop.js','shop-create.js'], note:'Area list'},
  {name:'shop-create.js', file:'../assets/js/shop-create.js', connects:['managerShopCreate.js','Shop model'], note:'Shop create'},
  {name:'shop-template-map.js', file:'../assets/js/shop-template-map.js', connects:['shop-templates/*'], note:'Template map'},
  {name:'location.core.js', file:'../assets/js/location.core.js', connects:['location routes'], note:'Location'},
];

const DASH_CHECKS = [
  {shop:'kirana', file:'../shop-templates/kirana/dashboard.html', js:'../shop-templates/kirana/dashboard.js', connects:['dashboard-core.js','socket-core.js','product-manager.js']},
  {shop:'dairy', file:'../shop-templates/dairy/dashboard.html', js:'../shop-templates/dairy/dashboard.js', connects:['dashboard-core.js','product-manager.js','orders.js']},
];

const SHOP_VIEW_LIST = ['kirana','dairy','cloth','mobile','bakery','fruit','restaurant','medical','beauty','sports'];

const COMMON_CHECKS = [
  {name:'cart-core.js', file:'../shop-templates/common/cart/cart-core.js', mustNot:['addItem','removeItem','getCart()'], mustHave:['CartCore.add','CartCore.remove'], connects:['/api/common'], error:'addItem -> add karo warna cart khali'},
  {name:'cart-count.js', file:'../shop-templates/common/cart/cart-count.js', mustHave:['data-cart-count'], connects:['cart-core.js']},
  {name:'product-manager.js', file:'../shop-templates/common/products/product-manager.js', mustHave:['WorldProduct'], connects:['/api/world-products']},
  {name:'checkout.js', file:'../shop-templates/common/checkout/checkout.js', mustHave:['/api/common/checkout'], connects:['checkout.routes.js']},
  {name:'socket-core.js', file:'../shop-templates/common/core/socket-core.js', mustHave:['io'], connects:['server.js global.io']},
];

const SERVER_CHECKS = [
  {name:'Health API', type:'api', api:'/api/health'},
  {name:'World Products API', type:'api', api:'/api/world-products?shopId=test'},
  {name:'Cart Summary', type:'api', api:'/api/common/checkout/test-id/summary'},
];

const WASTE_FILES = [
  {name:'profile/js/wishlist.html', reason:'JS folder me HTML hai - duplicate', path:'public/profile/js/wishlist.html'},
  {name:'deliveryManager double', reason:'server.js me 2 baar use', path:'server.js'},
  {name:'location double', reason:'/api/location 2 baar', path:'server.js'},
];

async function checkFile(path){
  try{ const r=await fetch(path+'?t='+Date.now(),{cache:'no-store'}); if(!r.ok) return {ok:false, err:`${r.status} Not Found - ${path}`, txt:''}; const txt=await r.text(); return {ok:true, txt, size:txt.length}; }catch(e){ return {ok:false, err:e.message, txt:''}; }
}
async function checkApi(url){ try{ const r=await fetch(url,{credentials:'include'}); const t=await r.text(); if(r.status===404) return {ok:false, err:`404 - Route register nahi`, status:r.status}; if(r.status>=500) return {ok:false, err:`${r.status} - ${t.slice(0,120)}`, status:r.status}; return {ok:true, status:r.status, txt:t}; }catch(e){ return {ok:false, err:e.message}; } }

function makeCard(parent, title, sub, status, rows, connects){
  if(!parent) return;
  const d=document.createElement('div'); d.className='card'; d.style.cssText='background:#020617;border:1px solid #1e293b;border-radius:12px;padding:10px;position:relative;margin-bottom:6px';
  let html=`<div class="dot ${status}" style="position:absolute;top:10px;right:10px;width:10px;height:10px;border-radius:50%"></div><b style="font-size:12px;display:block;color:#e2e8f0">${title}</b><small style="font-size:10px;color:#64748b;word-break:break-all">${sub}</small>`;
  rows.forEach(r=>{ html+=`<div style="margin-top:6px;background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:5px 7px;font-size:11px;display:flex;justify-content:space-between"><span style="color:#cbd5e1">${r.label}</span><span style="padding:2px 6px;border-radius:20px;font-size:9px;font-weight:900;background:${r.ok?'#dcfce7':'#fee2e2'};color:${r.ok?'#166534':'#991b1b'}">${r.val}</span></div>`; if(r.err) html+=`<div style="font-size:9px;color:#fca5a5;margin-top:3px">${r.err}</div>`; });
  if(connects && connects.length) html+=`<div style="margin-top:6px;font-size:10px;color:#38bdf8;font-weight:700">🔗 ${connects.join(' , ')}</div>`;
  d.innerHTML=html; parent.appendChild(d);
}

async function run(){
  const a=$('areaLayer'), b=$('dashLayer'), c=$('shopLayer'), d=$('commonLayer'), e=$('serverLayer'), f=$('wasteLayer');
  if(a) a.innerHTML=''; if(b) b.innerHTML=''; if(c) c.innerHTML=''; if(d) d.innerHTML=''; if(e) e.innerHTML=''; if(f) f.innerHTML='';
  LOG('Scan start...');

  for(const ch of AREA_CHECKS){ const res=await checkFile(ch.file); if(a) makeCard(a, ch.name, ch.file+' - '+ch.note, res.ok?'ok':'bad', [{label: res.ok? Math.round(res.size/1024)+'KB':'Missing', val: res.ok?'CONNECTED':'ERROR', ok:res.ok, err:res.err}], ch.connects); }
  for(const ch of DASH_CHECKS){ const res=await checkFile(ch.file); const resJs=await checkFile(ch.js); if(b) makeCard(b, ch.shop+' dashboard', ch.file, (res.ok&&resJs.ok)?'ok':'bad', [{label:'HTML', val:res.ok?'YES':'NO', ok:res.ok},{label:'JS', val:resJs.ok?'YES':'NO', ok:resJs.ok}], ch.connects); }
  for(const name of SHOP_VIEW_LIST){ const path=`../shop-templates/${name}/customer-view.html`; const res=await checkFile(path); if(!c) continue; if(!res.ok){ makeCard(c, name, path, 'bad', [{label:'Missing', val:'NO FILE', ok:false, err:res.err}], []); continue; } const hasCore=res.txt.includes('cart-core.js'); const hasWrong=res.txt.includes('CartCore.addItem'); const hasCount=res.txt.includes('data-cart-count'); makeCard(c, name+' user-view', path, (!hasCore||hasWrong)?'bad':'ok', [{label:'cart-core.js', val:hasCore?'YES':'NO', ok:hasCore, err: !hasCore?'Cart khali dikhega':''},{label:'addItem error', val:hasWrong?'ERROR':'OK', ok:!hasWrong, err: hasWrong?'addItem hatana hai':''},{label:'count', val:hasCount?'YES':'NO', ok:hasCount}], ['cart-core.js','product-manager.js']); }
  for(const ch of COMMON_CHECKS){ const res=await checkFile(ch.file); if(!d) continue; if(!res.ok){ makeCard(d, ch.name, ch.file, 'bad', [{label:'404', val:'MISSING', ok:false, err:res.err}], ch.connects); continue; } let ok=true, errs=[]; if(ch.mustHave) ch.mustHave.forEach(k=>{ if(!res.txt.includes(k)){ ok=false; errs.push(k+' nahi'); }}); if(ch.mustNot) ch.mustNot.forEach(k=>{ if(res.txt.includes(k)){ ok=false; errs.push(k+' galat'); }}); makeCard(d, ch.name, ch.file, ok?'ok':'bad', [{label: errs.length?errs.join(', '): Math.round(res.size/1024)+'KB OK', val: ok?'CONNECTED':'ERROR', ok, err: errs.join(' | ') + (ch.error||'')}], ch.connects); }
  for(const ch of SERVER_CHECKS){ const res=await checkApi(ch.api); if(e) makeCard(e, ch.name, ch.api, res.ok?'ok':'bad', [{label: res.ok? 'Status '+res.status:'Fail', val: res.ok?'LIVE':'ERROR', ok:res.ok, err:res.err}], []); }
  WASTE_FILES.forEach(w=>{ if(f) makeCard(f, w.name, w.path, 'bad', [{label:w.reason, val:'FALTU', ok:false}], []); });
  LOG('Done - jo BAD hai usko sahi kar');
}

// FIX - NULL CHECK - Yahi line 112 pe error de rahi thi
const btn = document.getElementById('recheckBtn');
if(btn){ btn.addEventListener('click', run); } else { console.log('recheckBtn nahi mila, direct run'); }
run();
})();