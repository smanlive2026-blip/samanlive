// LOCATION: public/admin-panel/assets/connection-map.js - V4 - KIRANA USER-VIEW, CLOTH SHOP-VIEW FIX
(function(){
const $ = (id)=>document.getElementById(id);
const LOG = (m)=>{ const l=$('log'); if(!l) return; l.innerText = new Date().toLocaleTimeString()+' > '+m+'\n'+l.innerText; };

const AREA_CHECKS = [
  {name:'area-manager.html', file:'../area-manager.html', connects:['area-manager.js','shop-create.js']},
  {name:'area-manager.js', file:'../assets/js/area-manager.js', connects:['shop-create.js','location.shop.js']},
  {name:'shop-create.js', file:'../assets/js/shop-create.js', connects:['managerShopCreate.js','Shop model']},
];

const DASH_CHECKS = [
  {shop:'kirana', file:'../shop-templates/kirana/dashboard.html', js:'../shop-templates/kirana/dashboard.js', connects:['dashboard-core.js','socket-core.js','product-manager.js']},
  {shop:'dairy', file:'../shop-templates/dairy/dashboard.html', js:'../shop-templates/dairy/dashboard.js', connects:['dashboard-core.js','product-manager.js']},
  {shop:'cloth', file:'../shop-templates/cloth/dashboard.html', js:'../shop-templates/cloth/dashboard.js', connects:['product-manager.js']},
];

const SHOP_VIEW_LIST = ['kirana','dairy','cloth','mobile','bakery','fruit','restaurant','medical','beauty','sports','electronics','furniture'];

const COMMON_CHECKS = [
  {name:'cart-core.js', file:'../shop-templates/common/cart/cart-core.js', mustNot:['addItem','removeItem','getCart()'], mustHave:['CartCore.add','CartCore.remove'], connects:['/api/common/checkout'], error:'add -> addItem hatana hai'},
  {name:'cart-count.js', file:'../shop-templates/common/cart/cart-count.js', mustHave:['data-cart-count'], connects:['cart-core.js']},
  {name:'product-manager.js', file:'../shop-templates/common/products/product-manager.js', mustHave:['WorldProduct'], connects:['/api/world-products']},
  {name:'checkout.js', file:'../shop-templates/common/checkout/checkout.js', mustHave:['/api/common/checkout'], connects:['checkout.routes.js']},
];

const SERVER_CHECKS = [
  {name:'Health', type:'api', api:'/api/health'},
  {name:'World Products', type:'api', api:'/api/world-products?shopId=test'},
];

async function checkFile(path){
  try{ const r=await fetch(path+'?t='+Date.now(),{cache:'no-store'}); if(!r.ok) return {ok:false, err:`${r.status} Not Found`, txt:''}; const txt=await r.text(); return {ok:true, txt, size:txt.length}; }catch(e){ return {ok:false, err:e.message, txt:''}; }
}

// NAYA FUNCTION - 3 NAAM TRY KAREGA - YAHI TERA FIX HAI
async function checkShopView(shop){
  const tries = [`../shop-templates/${shop}/customer-view.html`,`../shop-templates/${shop}/user-view.html`,`../shop-templates/${shop}/shop-view.html`,`../shop-templates/${shop}/index.html`];
  for(let p of tries){
    const res = await checkFile(p);
    if(res.ok) return {ok:true, path:p, txt:res.txt, size:res.size};
  }
  return {ok:false, path:tries[0], err:'customer-view.html, user-view.html, shop-view.html - koi bhi nahi mila', txt:''};
}

async function checkApi(url){ try{ const r=await fetch(url,{credentials:'include'}); const t=await r.text(); if(r.status===404) return {ok:false, err:`404`, status:r.status}; if(r.status>=500) return {ok:false, err:`${r.status}`, status:r.status}; return {ok:true, status:r.status, txt:t}; }catch(e){ return {ok:false, err:e.message}; } }

function makeCard(parent, title, sub, status, rows, connects){
  if(!parent) return;
  const d=document.createElement('div'); d.className='card'; d.style.cssText='background:#020617;border:1px solid #1e293b;border-radius:12px;padding:10px;position:relative;margin-bottom:6px';
  let html=`<div style="position:absolute;top:10px;right:10px;width:10px;height:10px;border-radius:50%;background:${status==='ok'?'#22c55e':status==='bad'?'#ef4444':'#f59e0b'}"></div><b style="font-size:12px;display:block;color:#e2e8f0">${title}</b><small style="font-size:10px;color:#64748b;word-break:break-all">${sub}</small>`;
  rows.forEach(r=>{ html+=`<div style="margin-top:6px;background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:5px 7px;font-size:11px;display:flex;justify-content:space-between"><span style="color:#cbd5e1">${r.label}</span><span style="padding:2px 6px;border-radius:20px;font-size:9px;font-weight:900;background:${r.ok?'#dcfce7':'#fee2e2'};color:${r.ok?'#166534':'#991b1b'}">${r.val}</span></div>`; if(r.err) html+=`<div style="font-size:9px;color:#fca5a5;margin-top:3px">${r.err}</div>`; });
  if(connects) html+=`<div style="margin-top:6px;font-size:10px;color:#38bdf8;font-weight:700">🔗 ${connects.join(', ')}</div>`;
  d.innerHTML=html; parent.appendChild(d);
}

async function run(){
  const a=$('areaLayer'), b=$('dashLayer'), c=$('shopLayer'), d=$('commonLayer'), e=$('serverLayer'), f=$('wasteLayer'), l=$('log');
  if(a) a.innerHTML=''; if(b) b.innerHTML=''; if(c) c.innerHTML=''; if(d) d.innerHTML=''; if(e) e.innerHTML=''; if(f) f.innerHTML='';
  if(l) l.innerText='Scanning...\n';
  LOG('Scan start...');

  for(const ch of AREA_CHECKS){ const res=await checkFile(ch.file); if(a) makeCard(a, ch.name, ch.file, res.ok?'ok':'bad', [{label: res.ok? Math.round(res.size/1024)+'KB':'Missing', val: res.ok?'CONNECTED':'ERROR', ok:res.ok, err:res.err}], ch.connects); }
  for(const ch of DASH_CHECKS){ const res=await checkFile(ch.file); const resJs=await checkFile(ch.js); if(b) makeCard(b, ch.shop+' dashboard', ch.file, (res.ok&&resJs.ok)?'ok':'bad', [{label:'HTML', val:res.ok?'YES':'NO', ok:res.ok},{label:'JS', val:resJs.ok?'YES':'NO', ok:resJs.ok}], ch.connects); }

  for(const name of SHOP_VIEW_LIST){
    const res = await checkShopView(name);
    if(!c) continue;
    if(!res.ok){ makeCard(c, name, res.path, 'bad', [{label:'File missing', val:'NO FILE', ok:false, err:res.err}], []); continue; }
    const hasCore=res.txt.includes('cart-core.js');
    const hasWrong=res.txt.includes('CartCore.addItem') || res.txt.includes('CartCore.removeItem') || res.txt.includes('CartCore.getCart');
    const hasCount=res.txt.includes('data-cart-count');
    makeCard(c, name+' -> '+res.path.split('/').pop(), res.path, (!hasCore||hasWrong)?'bad':'ok', [
      {label:'cart-core.js juda?', val:hasCore?'YES':'NO', ok:hasCore, err:!hasCore?'Cart page khali dikhega - cart-core.js jodna hai':''},
      {label:'addItem error', val:hasWrong?'ERROR':'OK', ok:!hasWrong, err: hasWrong?'Yahi bug hai - CartCore.addItem ko CartCore.add karo, removeItem ko remove':''},
      {label:'cart count', val:hasCount?'YES':'NO', ok:hasCount}
    ], ['cart-core.js','product-manager.js']);
    if(hasWrong) LOG(`${name} me addItem wala purana code pada hai - isi wajah se cart error`);
  }

  for(const ch of COMMON_CHECKS){ const res=await checkFile(ch.file); if(!d) continue; if(!res.ok){ makeCard(d, ch.name, ch.file, 'bad', [{label:'404', val:'MISSING', ok:false, err:res.err}], ch.connects); continue; } let ok=true, errs=[]; if(ch.mustHave) ch.mustHave.forEach(k=>{ if(!res.txt.includes(k)){ ok=false; errs.push(k+' nahi'); }}); if(ch.mustNot) ch.mustNot.forEach(k=>{ if(res.txt.includes(k)){ ok=false; errs.push(k+' galat'); }}); makeCard(d, ch.name, ch.file, ok?'ok':'bad', [{label: errs.length?errs.join(', '): Math.round(res.size/1024)+'KB OK', val: ok?'CONNECTED':'ERROR', ok, err: errs.join(' | ') + (ch.error||'')}], ch.connects); }
  for(const ch of SERVER_CHECKS){ const res=await checkApi(ch.api); if(e) makeCard(e, ch.name, ch.api, res.ok?'ok':'bad', [{label: res.ok? 'Status '+res.status:'Fail', val: res.ok?'LIVE':'ERROR', ok:res.ok, err:res.err}], []); }
  LOG('Done');
}

const btn = document.getElementById('recheckBtn');
if(btn) btn.addEventListener('click', run);
run();
})();