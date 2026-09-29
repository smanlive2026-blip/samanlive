// LOCATION: public/shop-templates/dairy/dashboard.js - V7 WORLD CLASS FINAL - FULL
// NO LOCALSTORAGE - ONLY API - SPORTS LEVEL

(function(){
  if(window.DairyDashboardLoaded) return;
  window.DairyDashboardLoaded = true;

  const API_BASE = '/api/shops/dairy';
  const params = new URLSearchParams(location.search);
  window.shopId = params.get('shopId') || params.get('id') || '';
  const shopId = window.shopId;

  if(!shopId){
    document.body.innerHTML = '<div style="padding:40px;text-align:center"><h2>shopId missing! URL me ?shopId=DAIRY123 lagao</h2></div>';
    return;
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const el = document.getElementById('shopIdDisplay');
    if(el) el.innerText = 'ID: ' + shopId.slice(-6);
  });

  let allProducts = [];
  let currentCat = 'all';

  // ===== TOAST =====
  function toast(m){
    const t = document.getElementById('toast');
    if(!t) return alert(m);
    t.innerText = m;
    t.style.display = 'block';
    setTimeout(()=> t.style.display='none', 2500);
  }
  window.dairyToast = toast;

  // ===== API LOAD =====
  async function load(){
    try{
      const r = await fetch(`${API_BASE}/${shopId}?t=${Date.now()}`, { cache:'no-store' });
      const d = await r.json();
      if(!d.success) throw new Error(d.message);
      const s = d.shop;

      const totalLtr = s.products?.reduce((sum,p)=>sum+(parseFloat(p.stock)||0),0) || 0;
      const saleEl = document.getElementById('items');
      if(saleEl) saleEl.innerText = totalLtr + ' L';
      const pc = document.getElementById('prodCount');
      if(pc) pc.innerText = `(${s.products?.length || 0})`;
      const sale = document.getElementById('sale');
      if(sale) sale.innerText = s.stats?.todaySale || 0;
      const rev = document.getElementById('revenue');
      if(rev) rev.innerText = '₹' + (s.stats?.revenue || 0);
      const exp = document.getElementById('expiry');
      if(exp) exp.innerText = s.stats?.expiryToday || checkExpiry(s.products||[]).length;

      const isOpen = s.settings?.isOpen ?? true;
      const sw = document.getElementById('toggleSwitch');
      const tt = document.getElementById('toggleText');
      if(sw) sw.className = 'switch ' + (isOpen ? 'on' : '');
      if(tt) tt.innerText = isOpen ? 'Open' : 'Closed';

      allProducts = s.products || [];
      render(allProducts);
      renderLow(s.lowStock || allProducts.filter(p => (p.stock||0) <= 5));
      renderSubs(s.subscriptions || []);
      renderLiveOrders(s.liveOrders || []);

      if(window.CartCount && window.CartCount.refresh) CartCount.refresh(shopId);

    }catch(e){
      const c = document.getElementById('inventoryList');
      if(c) c.innerHTML = `<p style="padding:20px;color:red">Error: ${e.message}<br>API: ${API_BASE}/${shopId} check karo</p>`;
    }
  }

  function checkExpiry(products){
    const today = new Date().toDateString();
    return products.filter(p=>{
      if(!p.expiry) return false;
      return new Date(p.expiry).toDateString() === today;
    });
  }

  // ===== RENDER INVENTORY =====
  function render(list){
    const c = document.getElementById('inventoryList');
    if(!c) return;
    if(!list.length){
      c.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:50px"><div style="font-size:50px">🥛</div><h3 style="margin-top:10px;font-weight:900">No dairy items</h3><p style="color:#94a3b8;font-size:13px">Click Add Milk to add</p></div>`;
      return;
    }
    c.innerHTML = list.map(p => `
      <div class="p-card">
        <img src="${p.image || `https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400`}" onerror="this.src='https://placehold.co/400/0ea5e9/fff?text=${encodeURIComponent((p.name||'Milk').slice(0,10))}'">
        <div class="p-info">
          <b>${p.name}</b><div class="meta">${p.unit || '1 Ltr'} • Exp: ${p.expiry? new Date(p.expiry).toLocaleDateString(): '3 days'}</div>
          <div class="price-row"><div class="price">₹${p.price}<br><span class="brand-badge">${p.fat || 'Full Cream'}</span></div><div class="stock ${(p.stock||0) <= 2 ? 'low' : p.expiryAlert? 'exp':'ok'}">${p.stock||0} ${p.unit||'L'} LEFT</div></div>
          <div style="display:flex;gap:6px;margin-top:10px"><button onclick="editDairy('${p._id}')" style="flex:1;background:#f1f5f9;border:1px solid #e2e8f0;padding:7px;border-radius:10px;font-weight:800;font-size:11px;cursor:pointer">Edit</button><button onclick="deleteDairyItem('${p._id}')" style="width:36px;background:#fff;border:1px solid #fee2e2;color:#ef4444;border-radius:10px;cursor:pointer"><i class="fa fa-trash"></i></button></div>
        </div>
      </div>
    `).join('');
  }

  function renderLow(list){
    const c = document.getElementById('lowStock');
    if(!c) return;
    if(!list.length){ c.innerHTML = '<div style="background:#f0fdf4;color:#166534;padding:10px;border-radius:10px;font-weight:800;font-size:12px;text-align:center">✓ All Fresh</div>'; return; }
    c.innerHTML = list.slice(0,5).map(p=>`<div style="display:flex;justify-content:space-between;padding:10px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-bottom:6px"><div><b style="font-size:12px">${p.name}</b><br><small style="color:#92400e;font-size:10px">Exp: ${p.expiry? new Date(p.expiry).toLocaleDateString() : 'Today'}</small></div><span style="background:#92400e;color:#fff;padding:3px 7px;border-radius:20px;font-size:10px;font-weight:900">${p.stock}L</span></div>`).join('');
  }

  function renderSubs(list){
    const c = document.getElementById('subBox');
    if(!c) return;
    if(!list.length){ c.innerHTML = '<p style="color:#94a3b8;font-size:12px">No active subscription</p>'; return; }
    c.innerHTML = list.map(s=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f8fafc;font-size:13px;font-weight:600"><span>${s.customer} - ${s.qty}L Daily</span><span style="background:#e0f2fe;color:#0369a1;padding:2px 8px;border-radius:20px;font-size:11px">${s.slot}</span></div>`).join('');
  }

  function renderLiveOrders(list){
    const c = document.getElementById('liveOrders');
    if(!c) return;
    if(!list.length){ c.innerHTML = '<p style="color:#94a3b8;font-size:12px">No live orders</p>'; return; }
    c.innerHTML = list.map(o=>`<div style="padding:8px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:6px;font-size:12px"><b>${o.customer}</b> - ₹${o.total}<br><small>${o.slot||'Morning'}</small></div>`).join('');
  }

  // ===== ACTIONS - HTML BUTTONS KE LIYE =====
  window.viewShop = () => window.open(`/shop-templates/dairy/customer-view.html?shopId=${shopId}`, '_blank');
  window.goForm = () => location.href = `/shop-templates/dairy/product-form.html?shopId=${shopId}`;
  window.goQuick = () => location.href = `/shop-templates/dairy/product-form.html?shopId=${shopId}&quick=1`;
  window.editDairy = (id) => location.href = `/shop-templates/dairy/product-form.html?shopId=${shopId}&editId=${id}`;
  window.edit = window.editDairy; // purana naam bhi kaam kare

  window.deleteDairyItem = async function(id){
    if(!confirm('Delete karna hai?')) return;
    try{
      const r = await fetch(`${API_BASE}/${shopId}/item/${id}`, { method:'DELETE' });
      const d = await r.json();
      if(d.success){ toast('Deleted 🗑️'); load(); } else toast('Failed: '+d.message);
    }catch(e){ toast('Error: '+e.message); }
  };
  window.del = window.deleteDairyItem;

  window.toggleShop = async function(){
    const sw = document.getElementById('toggleSwitch');
    if(!sw) return;
    const isOpen = !sw.classList.contains('on');
    sw.classList.toggle('on', isOpen);
    const tt = document.getElementById('toggleText');
    if(tt) tt.innerText = isOpen ? 'Open' : 'Closed';
    try{
      await fetch(`${API_BASE}/${shopId}/settings`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ isOpen }) });
      toast(isOpen ? 'Shop Opened - Doodh chalu 🥛' : 'Closed');
    }catch(e){ toast('Toggle failed'); }
  };

  window.filterCat = function(cat, el){
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    if(el) el.classList.add('active');
    currentCat = cat;
    if(cat==='all') render(allProducts);
    else render(allProducts.filter(p => (p.category||'').toLowerCase().includes(cat.toLowerCase()) || (p.name||'').toLowerCase().includes(cat.toLowerCase())));
  };

  window.searchDairy = function(q){
    const query = (q || document.getElementById('searchInput')?.value || '').toLowerCase();
    if(!query) render(currentCat==='all'? allProducts : allProducts.filter(p => (p.category||'').toLowerCase().includes(currentCat.toLowerCase())));
    else render(allProducts.filter(p => (p.name||'').toLowerCase().includes(query) || (p.category||'').toLowerCase().includes(query)));
  };

  // Search input bind
  document.addEventListener('DOMContentLoaded', ()=>{
    const si = document.getElementById('searchInput');
    if(si) si.addEventListener('input', (e)=> searchDairy(e.target.value));
  });

  // INIT
  function init(){ load(); }
  document.addEventListener('DOMContentLoaded', init);
  if(document.readyState !== 'loading') init();

  // SOCKET - Live orders
  document.addEventListener('DOMContentLoaded', ()=>{
    setTimeout(()=>{
      if(window.io){
        try{
          const socket = io();
          socket.on(`new-order-${shopId}`, (order)=>{
            toast(`New Order: ${order.customer} - ₹${order.total}`);
            load();
          });
          socket.on(`dairy-order-${shopId}`, ()=> load());
        }catch(e){}
      }
    }, 1000);
  });

})();