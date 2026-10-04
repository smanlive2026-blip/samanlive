const files = [
 {id:"index", name:"index.html", icon:"🏠", tag:"13 BTN MAIN"},
 {id:"dashboard", name:"dashboard.html", icon:"📊", tag:"ANALYTICS v99"},
 {id:"orders", name:"orders.html", icon:"📦", tag:"SUPER ORDERS"},
 {id:"shops", name:"shops.html", icon:"🏪", tag:"SHOPS"},
 {id:"users", name:"users.html", icon:"👥", tag:"USERS"},
 {id:"managers", name:"managers.html", icon:"👔", tag:"MANAGERS"},
 {id:"delivery", name:"delivery.html", icon:"🛵", tag:"DELIVERY"},
 {id:"areas", name:"areas.html", icon:"🗺️", tag:"AREAS"},
 {id:"area-dashboard", name:"area-dashboard.html", icon:"📍", tag:"AREA DASH"},
 {id:"area-detail", name:"area-detail.html", icon:"🔍", tag:"AREA DETAIL"},
 {id:"cities", name:"cities.html", icon:"🏙️", tag:"CITIES"},
 {id:"api-routes", name:"api-routes.html", icon:"🔌", tag:"API ROUTES"},
 {id:"categories", name:"categories.html", icon:"📂", tag:"CATEGORIES"},
 {id:"content", name:"content.html", icon:"🎬", tag:"CONTENT"},
 {id:"coupons", name:"coupons.html", icon:"🎟️", tag:"COUPONS"},
 {id:"reports", name:"reports.html", icon:"📑", tag:"REPORTS"},
 {id:"settings", name:"settings.html", icon:"⚙️", tag:"SETTINGS"},
];

function renderNav(list){
 const nav = document.getElementById('navList');
 if(!nav) return;
 nav.innerHTML = list.map(f=>`
  <button class="nav-btn" data-page="${f.id}" onclick="loadMasterPage('${f.id}', this)">
    <span>${f.icon} ${f.name}</span><b class="tag">${f.tag}</b>
  </button>`).join('');
 document.getElementById('count').innerText = list.length + " files";
}

async function loadMasterPage(pageName, btnElement){
 document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
 if(btnElement) btnElement.classList.add('active');
 
 const container = document.getElementById('mainContainer');
 container.innerHTML = `<div style="text-align:center;padding:60px;color:#64748b">🔄 Loading ${pageName}.html?v=99...</div>`;

 try{
   if(window.moduleMap){ window.moduleMap.remove(); window.moduleMap=null; }
   if(window.shopMap){ window.shopMap.remove(); window.shopMap=null; }
   if(window.areaMap){ window.areaMap.remove(); window.areaMap=null; }

   const bust = Date.now();
   const res = await fetch(`${pageName}.html?v=99&t=${bust}&_=${bust}`, {
     cache:'no-store',
     headers:{'Cache-Control':'no-cache, no-store, must-revalidate','Pragma':'no-cache'}
   });
   if(!res.ok) throw new Error('Page not found: ' + pageName);
   const html = await res.text();
   container.innerHTML = html;

   const scripts = container.querySelectorAll('script');
   scripts.forEach(oldScript=>{
     const newScript = document.createElement('script');
     if(oldScript.src) newScript.src = oldScript.src + `?t=${bust}`;
     else newScript.textContent = oldScript.textContent;
     document.body.appendChild(newScript);
     oldScript.remove();
   });
   
   document.getElementById('lastLoad').innerText = pageName + " @ " + new Date().toLocaleTimeString();
   console.log(`✅ MASTER LOADED: ${pageName}.html?v=99&t=${bust}`);
 }catch(err){
   container.innerHTML = `<div style="padding:40px;text-align:center;color:#ef4444"><h2>⚠️ ${pageName} load fail</h2><p>${err.message}</p><button onclick="loadMasterPage('${pageName}')" style="margin-top:12px;padding:8px 14px;background:#0f172a;color:#fff;border:none;border-radius:8px;cursor:pointer">Retry</button></div>`;
 }
}

window.addEventListener('load', ()=>{
 renderNav(files);
 const search = document.getElementById('search');
 if(search){
   search.addEventListener('input', e=>{
     const q=e.target.value.toLowerCase();
     renderNav(files.filter(f=>f.name.toLowerCase().includes(q) || f.tag.toLowerCase().includes(q)));
   });
 }
 const firstBtn = document.querySelector('[data-page="index"]');
 loadMasterPage('index', firstBtn);
});

window.loadMasterPage = loadMasterPage;