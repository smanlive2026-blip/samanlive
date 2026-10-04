const files = [
 {name:"index.html", icon:"🏠", tag:"13 BUTTON MAIN", cls:"main", path:"./index.html"},
 {name:"dashboard.html", icon:"📊", tag:"ANALYTICS v99", cls:"imp", path:"./dashboard.html"},
 {name:"orders.html", icon:"📦", tag:"TU ABHI YAHI KHOLA", cls:"imp", path:"./orders.html"},
 {name:"shops.html", icon:"🏪", tag:"SHOPS", cls:"", path:"./shops.html"},
 {name:"users.html", icon:"👥", tag:"USERS", cls:"", path:"./users.html"},
 {name:"managers.html", icon:"👔", tag:"MANAGERS", cls:"", path:"./managers.html"},
 {name:"delivery.html", icon:"🛵", tag:"DELIVERY", cls:"", path:"./delivery.html"},
 {name:"areas.html", icon:"🗺️", tag:"AREAS", cls:"", path:"./areas.html"},
 {name:"area-dashboard.html", icon:"📍", tag:"AREA DASH", cls:"", path:"./area-dashboard.html"},
 {name:"area-detail.html", icon:"🔍", tag:"AREA DETAIL", cls:"", path:"./area-detail.html"},
 {name:"cities.html", icon:"🏙️", tag:"CITIES", cls:"", path:"./cities.html"},
 {name:"api-routes.html", icon:"🔌", tag:"API ROUTES", cls:"", path:"./api-routes.html"},
 {name:"categories.html", icon:"📂", tag:"CATEGORIES", cls:"", path:"./categories.html"},
 {name:"content.html", icon:"🎬", tag:"CONTENT", cls:"", path:"./content.html"},
 {name:"coupons.html", icon:"🎟️", tag:"COUPONS", cls:"", path:"./coupons.html"},
 {name:"reports.html", icon:"📑", tag:"REPORTS", cls:"", path:"./reports.html"},
 {name:"settings.html", icon:"⚙️", tag:"SETTINGS", cls:"", path:"./settings.html"},
 {name:"admin.js", icon:"📜", tag:"ASSET JS", cls:"", path:"./assets/admin.js"},
 {name:"area.js", icon:"📜", tag:"ASSET JS", cls:"", path:"./assets/area.js"},
 {name:"area.css", icon:"🎨", tag:"ASSET CSS", cls:"", path:"./assets/area.css"},
 {name:"comman-control-shop/", icon:"📁", tag:"FOLDER", cls:"", path:"./comman-control-shop/"}
];

function render(list){
 document.getElementById('grid').innerHTML = list.map(f=>`<a class="card ${f.cls}" href="${f.path}?v=${Date.now()}" target="_blank"><span>${f.icon} ${f.name}</span><b>${f.tag}</b></a>`).join('');
 document.getElementById('count').innerText = list.length + " files";
}
function toast(m){ const t=document.getElementById('toast'); t.innerText=m; t.style.display='block'; setTimeout(()=>t.style.display='none',2000); }

window.addEventListener('load', ()=>{
 render(files);
 document.getElementById('search').addEventListener('input', e=>{
   const q=e.target.value.toLowerCase();
   render(files.filter(f=>f.name.toLowerCase().includes(q) || f.tag.toLowerCase().includes(q)));
 });
});

function fixIndex(){ 
 navigator.clipboard.writeText("git checkout HEAD -- public/admin-panel/index.html");
 toast("✅ Command copied - terminal me paste kar");
}