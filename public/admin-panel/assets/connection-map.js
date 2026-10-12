// LOCATION: public/admin-panel/assets/connection-map.js - V5 FINAL - APP.JS + NEARBY + TEMPLATE MAP SAB JODA
(function(){
const $ = (id)=>document.getElementById(id);
const LOG = (m)=>{ const l=$('log'); if(l) l.innerText = new Date().toLocaleTimeString()+' > '+m+'\n'+l.innerText; };

async function checkFile(path){
  try{ const r=await fetch(path+'?t='+Date.now(),{cache:'no-store'}); if(!r.ok) return {ok:false, txt:'', err:`${r.status} Not Found - ${path}`}; const txt=await r.text(); return {ok:true, txt, size:txt.length}; }catch(e){ return {ok:false, txt:'', err:e.message}; }
}
async function checkShopView(shop){
  const tries = [`../shop-templates/${shop}/customer-view.html`,`../shop-templates/${shop}/user-view.html`,`../shop-templates/${shop}/shop-view.html`];
  for(let p of tries){ const r=await checkFile(p); if(r.ok) return {ok:true, path:p, txt:r.txt, size:r.size}; }
  return {ok:false, path:tries[0], err:'customer-view/user-view/shop-view nahi mila'};
}
function makeCard(parent, title, sub, status, rows, connects){
  if(!parent) return;
  const d=document.createElement('div'); d.style.cssText='background:#020617;border:1px solid #1e293b;border-radius:12px;padding:10px;position:relative;margin-bottom:6px';
  let h=`<div style="position:absolute;top:10px;right:10px;width:10px;height:10px;border-radius:50%;background:${status==='ok'?'#22c55e':status==='bad'?'#ef4444':'#f59e0b'}"></div><b style="font-size:12px;color:#e2e8f0">${title}</b><small style="display:block;font-size:10px;color:#64748b;word-break:break-all">${sub}</small>`;
  rows.forEach(r=>{ h+=`<div style="margin-top:6px;background:#0f172a;border-radius:8px;padding:5px 7px;font-size:11px;display:flex;justify-content:space-between"><span style="color:#cbd5e1">${r.label}</span><span style="background:${r.ok?'#dcfce7':'#fee2e2'};color:${r.ok?'#166534':'#991b1b'};padding:2px 6px;border-radius:20px;font-size:9px;font-weight:900">${r.val}</span></div>`; if(r.err) h+=`<div style="font-size:9px;color:#fca5a5">${r.err}</div>`; });
  if(connects) h+=`<div style="margin-top:6px;font-size:10px;color:#38bdf8;font-weight:700">🔗 ${connects.join(', ')}</div>`;
  d.innerHTML=h; parent.appendChild(d);
}

const LAYERS = {
  // LAYER 0 - TERA MAIN BAAP - JO TU PUCH RAHA THA
  main: [
    {name:'app.js - BLACKBOARD LAYOUT V4', file:'../../assets/js/app.js', connects:['shop-template-map.js','location.core.js','nearby-shops logic','WorldProductManager','/api/settings','/api/world-products'], mustHave:['loadSettings','renderCategoryChips','renderNearbyProductsRepeat','WorldProductManager'], note:'Ye index.html ka main hai - sab yahi se start'},
    {name:'nearby-shops.js - FINAL + KM FILTER', file:'../../assets/js/nearby-shops.js', connects:['shop-template-map.js','/api/shop-view/nearby-shops','/api/areas','LocationManager','last_nearby_shops_cache'], mustHave:['loadAllShopsInstant','checkAreaAndUpdateAds','setKmFilter','toggleWishlist'], note:'Nearby shops grid, fav, call, map - 6 shop ke baad ad'},
    {name:'shop-template-map.js - 70+ SHOPS MAP', file:'../../assets/js/shop-template-map.js', connects:['app.js -> filterShopsByType','nearby-shops.js -> template','server/models/Shop.js'], mustHave:['SHOP_TEMPLATES','getShopTemplateFolder','kirana','cloth'], note:'Sab dukaan ka ID se folder map - isko tod diya to shop khulegi hi nahi'},
    {name:'location.core.js', file:'../../assets/js/location.core.js', connects:['app.js LocationManager','nearby-shops.js userLocation'], note:'Location core'},
    {name:'shop-create.js', file:'../../assets/js/shop-create.js', connects:['shop-template-map.js','managerShopCreate route','Shop model'], note:'Area manager shop banata hai'},
  ],
  area: [
    {name:'area-manager.html', file:'../area-manager.html', connects:['area-manager.js','shop-create.js']},
    {name:'area-manager.js', file:'../../assets/js/area-manager.js', connects:['shop-create.js']},
  ],
  dash: [
    {shop:'kirana', file:'../shop-templates/kirana/dashboard.html', js:'../shop-templates/kirana/dashboard.js', connects:['common/core/dashboard-core.js','common/core/socket-core.js','common/products/product-manager.js','/api/shops/kirana']},
    {shop:'dairy', file:'../shop-templates/dairy/dashboard.html', js:'../shop-templates/dairy/dashboard.js', connects:['dashboard-core.js','product-manager.js','orders.js']},
    {shop:'cloth', file:'../shop-templates/cloth/dashboard.html', js:'../shop-templates/cloth/dashboard.js', connects:['product-manager.js','shop-view.html']},
  ],
  common: [
    {name:'cart-core.js', file:'../shop-templates/common/cart/cart-core.js', mustNot:['addItem','getCart()'], mustHave:['CartCore.add','CartCore.cart'], connects:['/api/common/checkout'], error:'addItem hatao'},
    {name:'cart-count.js', file:'../shop-templates/common/cart/cart-count.js', mustHave:['data-cart-count'], connects:['cart-core.js']},
    {name:'product-manager.js', file:'../shop-templates/common/products/product-manager.js', mustHave:['WorldProduct'], connects:['world-product.routes.js']},
    {name:'socket-core.js', file:'../shop-templates/common/core/socket-core.js', mustHave:['io','join-shop'], connects:['server.js global.io']},
    {name:'checkout.js', file:'../shop-templates/common/checkout/checkout.js', mustHave:['/api/common/checkout'], connects:['common/index.js']},
  ]
};

async function run(){
  ['mainLayer','areaLayer','dashLayer','shopLayer','commonLayer','serverLayer','wasteLayer'].forEach(id=>{ const el=$(id); if(el) el.innerHTML=''; });
  const log=$('log'); if(log) log.innerText='Starting...\n'; LOG('Full scan start');

  // MAIN LAYER - TERA SAWAL
  const mainEl=$('mainLayer');
  for(const c of LAYERS.main){
    const res=await checkFile(c.file);
    let ok=res.ok, errs=[];
    if(res.ok && c.mustHave) c.mustHave.forEach(k=>{ if(!res.txt.includes(k)){ ok=false; errs.push(k+' missing'); }});
    if(mainEl) makeCard(mainEl, c.name, c.file+' - '+c.note, ok?'ok':'bad', [{label: res.ok? Math.round(res.size/1024)+'KB':'Missing', val: ok?'CONNECTED':'ERROR', ok, err: (res.err||'')+' '+errs.join(', ')}], c.connects);
  }

  for(const c of LAYERS.area){ const r=await checkFile(c.file); const el=$('areaLayer'); if(el) makeCard(el,c.name,c.file,r.ok?'ok':'bad',[{label:r.ok?'YES':'NO',val:r.ok?'OK':'ERROR',ok:r.ok,err:r.err}],c.connects); }
  for(const c of LAYERS.dash){ const r1=await checkFile(c.file); const r2=await checkFile(c.js); const el=$('dashLayer'); if(el) makeCard(el,c.shop+' dashboard',c.file,(r1.ok&&r2.ok)?'ok':'bad',[{label:'HTML',val:r1.ok?'YES':'NO',ok:r1.ok},{label:'JS',val:r2.ok?'YES':'NO',ok:r2.ok}],c.connects); }

  const shops=['kirana','dairy','cloth','mobile','bakery','fruit','restaurant','medical','beauty','sports'];
  const shopEl=$('shopLayer');
  for(const name of shops){
    const res=await checkShopView(name);
    if(!shopEl) continue;
    if(!res.ok){ makeCard(shopEl,name,res.path,'bad',[{label:'Missing',val:'NO FILE',ok:false,err:res.err}],[]); continue; }
    const hasCore=res.txt.includes('cart-core.js'); const hasWrong=res.txt.includes('CartCore.addItem'); const hasCount=res.txt.includes('data-cart-count');
    makeCard(shopEl,name+' -> '+res.path.split('/').pop(),res.path,(!hasCore||hasWrong)?'bad':'ok',[{label:'cart-core',val:hasCore?'YES':'NO',ok:hasCore,err:!hasCore?'Cart khali bug':''},{label:'addItem bug',val:hasWrong?'ERROR':'OK',ok:!hasWrong,err:hasWrong?'addItem hatao':''},{label:'count',val:hasCount?'YES':'NO',ok:hasCount}],['cart-core.js','product-manager.js']);
  }

  const commonEl=$('commonLayer');
  for(const c of LAYERS.common){ const r=await checkFile(c.file); if(!commonEl) continue; if(!r.ok){ makeCard(commonEl,c.name,c.file,'bad',[{label:'404',val:'MISSING',ok:false,err:r.err}],c.connects); continue; } let ok=true,errs=[]; if(c.mustHave) c.mustHave.forEach(k=>{ if(!r.txt.includes(k)){ ok=false; errs.push(k); }}); if(c.mustNot) c.mustNot.forEach(k=>{ if(r.txt.includes(k)){ ok=false; errs.push(k+' galat'); }}); makeCard(commonEl,c.name,c.file,ok?'ok':'bad',[{label:errs.length?errs.join(', '):Math.round(r.size/1024)+'KB',val:ok?'CONNECTED':'ERROR',ok,err:errs.join(' | ') + (c.error||'')}],c.connects); }

  const serverEl=$('serverLayer');
  const apiChecks=['/api/health','/api/world-products?shopId=test'];
  for(const api of apiChecks){ try{ const rr=await fetch(api); makeCard(serverEl,api,api,rr.ok?'ok':'bad',[{label:rr.status,val:rr.ok?'LIVE':'ERROR',ok:rr.ok}],[]); }catch(e){ makeCard(serverEl,api,api,'bad',[{label:'Fail',val:'ERROR',ok:false,err:e.message}],[]); } }

  const wasteEl=$('wasteLayer');
  const waste=[{name:'profile/js/wishlist.html',path:'public/profile/js/wishlist.html',reason:'JS folder me HTML - duplicate - delete karo'},{name:'deliveryManager double',path:'server.js line 2 baar',reason:'duplicate use'}];
  waste.forEach(w=>{ if(wasteEl) makeCard(wasteEl,w.name,w.path,'bad',[{label:w.reason,val:'FALTU',ok:false}],[]); });

  LOG('Done - Ab main layer bhi dikhega');
}
const btn=document.getElementById('recheckBtn'); if(btn) btn.addEventListener('click',run); run();
})();