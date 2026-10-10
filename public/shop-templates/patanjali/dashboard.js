// LOCATION: public/shop-templates/patanjali/dashboard.js - PATANJALI POWERFUL - COMMON CONNECTED - V1
(function(){
  if(window.PatanjaliDashboardLoaded) return;
  window.PatanjaliDashboardLoaded = true;

  class PatanjaliDashboardCore {
    constructor(){
      const p = new URLSearchParams(location.search);
      this.shopId = p.get('shopId') || p.get('id') || localStorage.getItem('last_shopId') || '';
      this.shopType = 'patanjali';
      this.shopData = null;
      this.allProducts = []; this.filteredProducts = [];
      this.worldProducts = []; this.oldProducts = [];
      this.orders = []; this.lowStock = [];
      this.currentCat = 'All'; this.currentSort = 'default';
      this.isLoading = false; this.searchDebounce = null;
      this.lastShopUpdate = localStorage.getItem('shop_updated') || '0';
      this.API_WORLD_BASE = `/api/world-products`;
      this.API_OLD = `/api/shops/patanjali/${this.shopId}`;
      this.API_COMMON = {
        analytics: `/api/common/analytics/${this.shopId}/stats`,
        lowStock: `/api/common/inventory/${this.shopId}/low-stock`,
        orders: `/api/common/orders/${this.shopId}?limit=20`,
        toggle: `/api/common/shop-toggle/${this.shopId}`,
        shopInfo: `/api/common/profile/${this.shopId}`
      };
      this.init();
    }

    async init(){
      if(!this.shopId){
        const c = document.getElementById('inventoryList');
        if(c) c.innerHTML = `<div class="empty-box"><div style="font-size:48px">⚠️</div><h3 style="font-weight:900;margin-top:10px">Shop ID Missing</h3><p style="color:#94a3b8;font-size:13px">URL me ?shopId= lagao</p></div>`;
        this.showLoader(false); return;
      }
      localStorage.setItem('last_shopId', this.shopId);
      localStorage.setItem('shopType', 'patanjali');
      window.shopId = this.shopId; window.shopType = 'patanjali';
      const sid = document.getElementById('shopIdDisplay');
      if(sid) sid.innerText = 'ID: ' + this.shopId.slice(-6);
      if(window.AuthCore){ try{ await window.AuthCore.protectDashboard(); }catch(e){} }
      this.bindUI(); this.bindSearch(); this.bindToggle(); this.bindSocket(); this.bindProfileSync();
      await this.loadDashboard();
      setInterval(()=>{ this.isLoading = false; this.loadDashboard(); }, 30000);
    }

    bindProfileSync(){
      const check = ()=>{
        const now = localStorage.getItem('shop_updated') || '0';
        if(now !== this.lastShopUpdate){ this.lastShopUpdate = now; this.isLoading = false; this.loadDashboard(); }
      };
      window.addEventListener('focus', check);
      window.addEventListener('pageshow', check);
      window.addEventListener('storage', (e)=>{ if(e.key==='shop_updated') check(); });
    }
    markShopUpdated(){ const t = Date.now().toString(); localStorage.setItem('shop_updated', t); this.lastShopUpdate = t; }

    bindUI(){
      const $ = (id)=> document.getElementById(id);
      $('newProductBtn')?.addEventListener('click', ()=> this.goProductForm());
      $('quickAddBtn')?.addEventListener('click', ()=> this.goQuickAdd());
      $('viewShopBtn')?.addEventListener('click', ()=> this.viewShop());
      $('addProductBtn')?.addEventListener('click', ()=> this.goProductForm());
      $('sortSelect')?.addEventListener('change', (e)=>{ this.currentSort = e.target.value; this.applyFilters(); });
    }

    bindSearch(){
      const input = document.getElementById('searchInput'); if(!input) return;
      input.addEventListener('input', (e)=>{
        clearTimeout(this.searchDebounce);
        this.searchDebounce = setTimeout(()=>{ this.searchQuery = e.target.value.toLowerCase().trim(); this.applyFilters(); }, 200);
      });
    }
    searchQuery = '';

    applyFilters(){
      let base = this.currentCat==='All'? [...this.allProducts] : this.allProducts.filter(p=>(p.category||'General')===this.currentCat);
      if(this.searchQuery){
        const q = this.searchQuery;
        base = base.filter(p=>(p.name||'').toLowerCase().includes(q)||(p.brand||'').toLowerCase().includes(q)||(p.category||'').toLowerCase().includes(q));
      }
      if(this.currentSort==='price-low') base.sort((a,b)=>(a.price||0)-(b.price||0));
      if(this.currentSort==='price-high') base.sort((a,b)=>(b.price||0)-(a.price||0));
      if(this.currentSort==='stock-low') base.sort((a,b)=>(a.stock||0)-(b.stock||0));
      if(this.currentSort==='name') base.sort((a,b)=>(a.name||'').localeCompare(b.name||''));
      this.filteredProducts = base;
      this.renderProducts(this.filteredProducts);
    }

    bindToggle(){
      const el = document.getElementById('toggleSwitch'); if(!el) return;
      el.addEventListener('click', async ()=>{
        const isOpen = !el.classList.contains('on');
        this.updateToggleUI(isOpen);
        try{
          if(window.ShopToggleCore?.toggle){ const s = await window.ShopToggleCore.toggle(this.shopId); this.updateToggleUI(s); }
          else{
            await fetch(this.API_COMMON.toggle, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({isOpen})}).catch(()=>{});
            await fetch(`/api/shops/patanjali/${this.shopId}/settings`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({isOpen})}).catch(()=>{});
          }
          this.markShopUpdated();
          this.toast(isOpen? 'Shop Opened ✅' : 'Shop Closed 🔴');
        }catch(e){ this.updateToggleUI(!isOpen); this.toast('Toggle failed'); }
      });
    }
    updateToggleUI(isOpen){
      const sw = document.getElementById('toggleSwitch'); if(sw) sw.className = 'switch ' + (isOpen? 'on':'');
      const tt = document.getElementById('toggleText'); if(tt) tt.innerText = isOpen? 'Open':'Closed';
    }

    bindSocket(){
      if(!window.SocketCore) return;
      window.SocketCore.on('new-order', (o)=>{
        if(o.shopId && o.shopId!==this.shopId) return;
        this.toast(`🔔 New Order - ₹${o.total||0}`);
        try{ document.getElementById('newOrderSound')?.play().catch(()=>{}); }catch(e){}
        if(navigator.vibrate) navigator.vibrate([100,50,100]);
        this.orders.unshift(o); this.renderOrders(this.orders.slice(0,10));
        this.isLoading = false; this.loadDashboard();
      });
      window.SocketCore.on('shop-status-changed', (d)=>{ if(d.shopId===this.shopId) this.updateToggleUI(d.isOpen); });
      window.SocketCore.on('shop-profile-updated', (d)=>{ if(d.shopId===this.shopId){ this.markShopUpdated(); this.loadDashboard(); } });
    }

    async loadDashboard(){
      if(this.isLoading) return;
      this.isLoading = true; this.showLoader(true);
      try{
        const results = await Promise.allSettled([
          window.WorldProductManager? window.WorldProductManager.getProducts({shopType:'patanjali', shopId:this.shopId}) : fetch(`${this.API_WORLD_BASE}?shopId=${this.shopId}&shopType=patanjali`).then(r=>r.json()).then(d=>d.data||[]),
          fetch(`${this.API_OLD}?t=${Date.now()}`, {cache:'no-store'}).then(r=>r.json()).catch(()=>({})),
          window.ApiCore? window.ApiCore.get(this.API_COMMON.analytics).catch(()=>null) : null,
          window.ApiCore? window.ApiCore.get(this.API_COMMON.lowStock).catch(()=>null) : null,
          window.ApiCore? window.ApiCore.get(this.API_COMMON.orders).catch(()=>null) : null,
          window.ApiCore? window.ApiCore.get(this.API_COMMON.shopInfo).catch(()=>null) : null
        ]);
        const worldRes = results[0].status==='fulfilled'? results[0].value : [];
        const oldRes = results[1].status==='fulfilled'? results[1].value : {};
        const analyticsRes = results[2].status==='fulfilled'? results[2].value : null;
        const lowStockRes = results[3].status==='fulfilled'? results[3].value : null;
        const ordersRes = results[4].status==='fulfilled'? results[4].value : null;
        const profileRes = results[5].status==='fulfilled'? results[5].value : null;

        this.shopData = oldRes?.shop || oldRes || {};
        const profShop = profileRes?.shop || profileRes?.profile || profileRes?.data || null;
        if(profShop && typeof profShop==='object'){
          const oldP = this.shopData.products || [];
          this.shopData = {...this.shopData,...profShop, products: profShop.products?.length? profShop.products : oldP};
        }
        try{ const ls = JSON.parse(localStorage.getItem(`shop_${this.shopId}`)||'{}'); if(ls.name||ls.shopName) this.shopData = {...this.shopData,...ls}; }catch(e){}

        this.oldProducts = this.shopData.products || [];
        this.worldProducts = Array.isArray(worldRes)? worldRes : (worldRes?.data || []);
        const wIds = new Set(this.worldProducts.map(p=>p._id));
        this.allProducts = [...this.worldProducts,...this.oldProducts.filter(p=>!wIds.has(p._id))];
        this.lowStock = lowStockRes?.products || lowStockRes?.data || this.allProducts.filter(p=>(p.stock||0) <= (p.lowStockAlert||20));
        this.orders = ordersRes?.orders || ordersRes?.data || this.shopData.liveOrders || [];

        this.renderStats(analyticsRes);
        this.renderCats();
        this.applyFilters();
        this.renderLowStock(this.lowStock);
        this.renderCategories();
        this.renderOrders(this.orders);
        this.renderProfile();
        this.renderStatus();
        if(this.shopData.isOpen!==undefined) this.updateToggleUI(!!this.shopData.isOpen);
        if(this.shopData.settings?.isOpen!==undefined) this.updateToggleUI(!!this.shopData.settings.isOpen);
      }catch(e){
        console.error('Patanjali load failed', e);
        const c = document.getElementById('inventoryList');
        if(c) c.innerHTML = `<div class="empty-box" style="color:#ef4444"><b>Error:</b> ${e.message}</div>`;
      }finally{ this.isLoading = false; this.showLoader(false); }
    }

    renderStatus(){
      const el = document.getElementById('commonStatus'); if(!el) return;
      el.innerHTML = `✅ SAMANLIVE Connected<br>Shop: ${this.shopData?.shopName||this.shopData?.name||'Patanjali Store'}<br>Products: ${this.allProducts.length} (World: ${this.worldProducts.length})<br>Type: patanjali`;
    }
    renderProfile(){
      const d = this.shopData || {};
      const name = d.shopName || d.name || 'Patanjali Store';
      const owner = d.ownerName || d.owner || 'Owner';
      const photo = localStorage.getItem(`shop_avatar_${this.shopId}`) || d.avatar || d.shopImage || d.logo || d.image || 'https://placehold.co/100x100/16a34a/ffffff?text=P';
      const img = document.getElementById('shopPhoto'); if(img) img.src = photo;
      const set = (id, txt)=>{ const el=document.getElementById(id); if(el) el.innerText = txt; };
      set('shopName', name); set('headerShopName', name);
      set('shopMeta', `${owner} • ${d.area || d.city || 'Ayurvedic Store'}`);
    }
    renderStats(analytics){
      const $ = (id)=> document.getElementById(id);
      const medicineCats = ['Ayurvedic Medicine','Chyawanprash'];
      const medicineCount = this.allProducts.filter(p=> medicineCats.includes(p.category)).length;
      const todayOrders = analytics?.todayOrders || analytics?.todaySale || this.orders.length || 0;
      const revenue = analytics?.todayRevenue || analytics?.revenue || 0;
      if($('totalProducts')) $('totalProducts').innerText = this.allProducts.length;
      if($('prodCount')) $('prodCount').innerText = `(${this.allProducts.length})`;
      if($('medicineCount')) $('medicineCount').innerText = medicineCount;
      if($('todaySales')) $('todaySales').innerText = todayOrders;
      if($('revenue')) $('revenue').innerText = revenue;
      if($('lowStockCount')) $('lowStockCount').innerText = this.lowStock.length;
      if($('worldCountText')) $('worldCountText').innerText = `World: ${this.worldProducts.length} • Old: ${this.oldProducts.length}`;
      if($('items')) $('items').innerText = this.allProducts.length;
    }
    renderCats(){
      const bar = document.getElementById('catTabs'); if(!bar) return;
      const cats = ['All',...new Set(this.allProducts.map(p=>p.category||'General'))];
      bar.innerHTML = cats.map(c=>`<div class="tab ${c===this.currentCat?'active':''}" onclick="window.PatanjaliDashboard.filterCat('${c.replace(/'/g,"\\'")}',this)">${c==='All'?'🌿 All':c}</div>`).join('');
    }
    filterCat(cat, el){
      this.currentCat = cat;
      document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      if(el) el.classList.add('active');
      this.applyFilters();
    }
    isSpecial(p){ const ex = p.extraData || {}; return p.isSpecial===true || p.isSpecial==='true' || ex.isSpecial===true || ex.isSpecial==='true'; }
    getImg(p){ return p.thumbnail || p.image || p.extraData?.thumbnail || `https://placehold.co/400x300/16a34a/ffffff?text=${encodeURIComponent((p.name||'Patanjali').slice(0,10))}`; }

    renderProducts(list){
      const c = document.getElementById('inventoryList'); if(!c) return;
      if(!list.length){
        c.innerHTML = `<div class="empty-box"><div style="font-size:50px">🌿</div><h3 style="font-weight:900;margin-top:10px">No products</h3><p style="color:#94a3b8;font-size:13px;margin-top:6px">Click <b style="color:#16a34a">Quick Add</b> to add Patanjali products</p><button onclick="window.PatanjaliDashboard.goQuickAdd()" class="btn btn-green" style="margin:14px auto 0">Quick Add Products</button></div>`;
        return;
      }
      const specialList = list.filter(p=>this.isSpecial(p));
      const normalList = list.filter(p=>!this.isSpecial(p));
      let html = '';
      if(specialList.length){
        html += `<div style="grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;background:#f0fdf4;border:1px solid #bbf7d0;padding:10px 12px;border-radius:12px"><b style="font-size:13px">⭐ Special Products</b><span style="font-size:11px;font-weight:800;color:#166534">${specialList.length} items</span></div>`;
        html += specialList.map(p=>this.renderSpecialCard(p)).join('');
        if(normalList.length) html += `<div style="grid-column:1/-1;font-weight:900;font-size:13px;margin-top:4px">All Products</div>`;
      }
      html += normalList.map(p=>this.renderNormalCard(p)).join('');
      c.innerHTML = html;
      // purana table wala hisaab bhi bhar do agar HTML me hai
      this.renderTable(normalList.concat(specialList));
    }
    renderNormalCard(p){
      const brand = p.brand || p.extraData?.brand || 'Patanjali';
      const size = p.extraData?.size || p.size || p.weight || '';
      return `<div class="p-card"><img src="${this.getImg(p)}" loading="lazy" onerror="this.src='https://placehold.co/400x300/16a34a/ffffff?text=Patanjali'"><div class="p-info"><b title="${p.name||''}">${(p.name||'').slice(0,40)}</b><div class="meta">${brand} • ${p.category||''} ${size?'• '+size:''}</div><div class="price-row"><div class="price">₹${p.price||0}<br><span class="brand-badge">${brand}</span></div><div class="stock ${(p.stock||0)<=20?'low':'ok'}">${p.stock||0} LEFT</div></div><div class="card-actions"><button class="btn-edit" onclick="window.PatanjaliDashboard.editProduct('${p._id}')">Edit</button><button class="btn-del" onclick="window.PatanjaliDashboard.deleteProduct('${p._id}')"><i class="fa fa-trash"></i></button></div></div></div>`;
    }
    renderSpecialCard(p){
      const ex = p.extraData || {}; const brand = p.brand || ex.brand || 'Patanjali';
      const badge = ex.badge || p.badge || 'SPECIAL'; const bg = ex.cardColor || p.cardColor || '#f0fdf4';
      const layout = (ex.layout || p.layout || 'big').toString().toLowerCase();
      if(layout==='list'){
        return `<div class="p-card" style="grid-column:1/-1;display:flex;background:${bg};border:1px solid #bbf7d0"><img src="${this.getImg(p)}" style="width:110px;height:110px" onerror="this.src='https://placehold.co/400x300/16a34a/ffffff?text=P'"><div class="p-info" style="flex:1"><span style="background:#16a34a;color:#fff;font-size:9px;font-weight:900;padding:3px 7px;border-radius:999px">⭐ ${badge}</span><b style="margin-top:5px">${p.name||''}</b><div class="meta">${brand} • ${p.category||''}</div><div class="price-row"><div class="price">₹${p.price||0}</div><div class="stock ${(p.stock||0)<=20?'low':'ok'}">${p.stock||0} LEFT</div></div><div class="card-actions"><button class="btn-edit" onclick="window.PatanjaliDashboard.editProduct('${p._id}')">Edit</button><button class="btn-del" onclick="window.PatanjaliDashboard.deleteProduct('${p._id}')"><i class="fa fa-trash"></i></button></div></div></div>`;
      }
      return `<div class="p-card" style="grid-column:1/-1;background:${bg};border:1px solid #bbf7d0"><div style="position:relative"><img src="${this.getImg(p)}" style="height:190px" onerror="this.src='https://placehold.co/400x300/16a34a/ffffff?text=P'"><span style="position:absolute;top:10px;left:10px;background:#16a34a;color:#fff;font-size:10px;font-weight:900;padding:5px 9px;border-radius:999px">⭐ ${badge}</span></div><div class="p-info"><b style="font-size:15px;min-height:auto">${p.name||''}</b><div class="meta">${brand} • ${p.category||''}</div>${p.description||ex.description?`<div style="font-size:12px;color:#475569;margin-top:6px">${(p.description||ex.description).slice(0,140)}</div>`:''}<div class="price-row"><div class="price" style="font-size:17px">₹${p.price||0} <del>₹${p.mrp||p.price||0}</del></div><div class="stock ${(p.stock||0)<=20?'low':'ok'}">${p.stock||0} LEFT</div></div><div class="card-actions"><button class="btn-edit" style="background:#14532d;color:#fff;border:none" onclick="window.PatanjaliDashboard.editProduct('${p._id}')">Edit Special</button><button class="btn-del" onclick="window.PatanjaliDashboard.deleteProduct('${p._id}')"><i class="fa fa-trash"></i></button></div></div></div>`;
    }
    renderTable(list){
      const tbody = document.getElementById('productTableBody'); const table = document.getElementById('productTable'); const loader = document.getElementById('loader');
      if(!tbody) return;
      if(loader) loader.style.display = 'none';
      if(table) table.style.display = 'table';
      tbody.innerHTML = list.map(p=>`<tr><td><b style="font-size:13px">${p.name}</b><br><small style="color:#94a3b8">${p.brand||''}</small></td><td><span class="category-badge ayurved">${p.category||'General'}</span></td><td><b>₹${p.price||0}</b></td><td>${p.stock||0}</td><td><button onclick="window.PatanjaliDashboard.editProduct('${p._id}')" style="background:#f1f5f9;border:1px solid #e2e8f0;padding:6px 10px;border-radius:8px;font-weight:800;font-size:11px;cursor:pointer">Edit</button></td></tr>`).join('');
    }
    renderLowStock(list){
      const c = document.getElementById('lowStock'); if(!c) return;
      if(!list.length){ c.innerHTML = '<div class="ok-box">✓ All Stock OK</div>'; return; }
      c.innerHTML = list.slice(0,8).map(p=>`<div class="low-item"><div style="min-width:0"><b style="font-size:12px">${p.name}</b><br><small style="color:#92400e;font-size:10px">${p.category||''}</small></div><span style="background:#92400e;color:#fff;padding:3px 7px;border-radius:20px;font-size:10px;font-weight:900">${p.stock||0}</span></div>`).join('');
    }
    renderCategories(){
      const c = document.getElementById('subBox'); if(!c) return;
      const cats = [...new Set(this.allProducts.map(p=>p.category||'General'))];
      if(!cats.length){ c.innerHTML = '<p style="color:#94a3b8;font-size:12px">No categories</p>'; return; }
      c.innerHTML = cats.map(cat=>`<div class="cat-row"><span>${cat}</span><span class="pill">${this.allProducts.filter(p=>(p.category||'General')===cat).length}</span></div>`).join('');
    }
    renderOrders(orders){
      const c = document.getElementById('liveOrders'); if(!c) return;
      if(!orders.length){ c.innerHTML = '<p style="color:#94a3b8;font-size:12px">No live orders</p>'; return; }
      c.innerHTML = orders.slice(0,8).map(o=>`<div class="order-row"><div><b style="font-size:12px">#${(o.orderId||o._id||'').toString().slice(-6).toUpperCase()}</b><br><small style="color:#64748b;font-size:10px">₹${o.total||0} • ${o.customerName||o.customer||'Customer'}</small></div><span class="pill">${(o.status||'PLACED').toUpperCase()}</span></div>`).join('');
    }
    showLoader(s){ const el = document.getElementById('loader'); if(el && el.id==='loader' && el.classList.contains('loader-box')===false) el.style.display = s? 'grid':'none'; const mainLoader = document.querySelector('#loader'); if(mainLoader) mainLoader.style.display = s? 'grid':'none'; }
    toast(m){ const t = document.getElementById('toast'); if(!t) return; t.innerText = m; t.style.display = 'block'; setTimeout(()=> t.style.display='none', 2800); }
    goProductForm(){ location.href = `../common/products/product-form.html?shopType=patanjali&shopId=${this.shopId}&type=patanjali`; }
    goQuickAdd(){ location.href = `../common/products/product-form.html?shopType=patanjali&shopId=${this.shopId}&type=patanjali&quick=1`; }
    editProduct(id){ location.href = `../common/products/product-form.html?shopType=patanjali&shopId=${this.shopId}&type=patanjali&editId=${id}`; }
    viewShop(){ window.open(`./user-view.html?shopId=${this.shopId}&shopType=patanjali`, '_blank'); }
    async deleteProduct(id){
      if(!confirm('Delete? Ye item dashboard aur customer view dono se hat jayega.')) return;
      try{
        let res;
        if(window.WorldProductManager?.deleteProduct) res = await window.WorldProductManager.deleteProduct(id);
        else res = await fetch(`${this.API_WORLD_BASE}/${id}`, {method:'DELETE'}).then(r=>r.json());
        if(!res.success){
          const old = await fetch(`/api/shops/patanjali/${this.shopId}/item/${id}`, {method:'DELETE'}).then(r=>r.json()).catch(()=>({success:false}));
          if(!old.success) throw new Error(res.message || 'Delete failed');
        }
        this.toast('Deleted ✅'); this.isLoading = false; await this.loadDashboard();
      }catch(e){ this.toast('Delete failed: ' + e.message); }
    }
  }

  window.PatanjaliDashboard = new PatanjaliDashboardCore();
  window.patanjaliDashboard = window.PatanjaliDashboard;
  window.goForm = ()=> window.PatanjaliDashboard.goProductForm();
  window.goQuick = ()=> window.PatanjaliDashboard.goQuickAdd();
  window.viewShop = ()=> window.PatanjaliDashboard.viewShop();
  window.editPatanjali = (id)=> window.PatanjaliDashboard.editProduct(id);
  window.filterCat = (cat, el)=> window.PatanjaliDashboard.filterCat(cat, el);

  setTimeout(()=>{ const l = document.getElementById('loader'); if(l) l.style.display = 'none'; window.PatanjaliDashboard?.toast('✅ Patanjali Dashboard Ready'); }, 1200);
})();