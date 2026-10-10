// LOCATION: public/shop-templates/dairy/dashboard.js - DAIRY POWERFUL - COMMON CONNECTED - V7 WORLD + SPECIAL CARD
(function(){
  if(window.DairyDashboardLoaded) return;
  window.DairyDashboardLoaded = true;

  class DairyDashboardCore {
    constructor(){
      const p = new URLSearchParams(location.search);
      this.shopId = p.get('shopId') || p.get('id') || localStorage.getItem('last_shopId') || '';
      this.shopType = 'dairy';
      this.shopData = null;
      this.allProducts = []; this.filteredProducts = [];
      this.worldProducts = []; this.oldProducts = [];
      this.orders = []; this.lowStock = []; this.subscriptions = [];
      this.currentCat = 'All'; this.isLoading = false;
      this.searchDebounce = null; this.refreshInterval = null;
      this.lastShopUpdate = localStorage.getItem('shop_updated') || '0';

      this.API_WORLD_BASE = `/api/world-products`;
      this.API_OLD = `/api/shops/dairy/${this.shopId}`;
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
        if(c) c.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px"><div style="font-size:48px">⚠️</div><h3 style="font-weight:900;margin-top:10px">Shop ID Missing</h3><p style="color:#94a3b8;font-size:13px">URL me ?shopId= lagao</p></div>`;
        this.showLoader(false); return;
      }
      localStorage.setItem('last_shopId', this.shopId);
      localStorage.setItem('shopType', 'dairy');
      window.shopId = this.shopId; window.shopType = 'dairy';
      const sid = document.getElementById('shopIdDisplay');
      if(sid) sid.innerText = 'ID: ' + this.shopId.slice(-6);

      if(window.AuthCore){ try{ await window.AuthCore.protectDashboard(); }catch(e){ console.warn('Auth failed, still continue', e); } }

      this.bindUI(); this.bindSearch(); this.bindToggle(); this.bindSocket(); this.bindProfileSync();
      await this.loadDashboard();
      this.startAutoRefresh();
    }

    bindProfileSync(){
      const check = ()=>{
        const now = localStorage.getItem('shop_updated') || '0';
        if(now !== this.lastShopUpdate){ this.lastShopUpdate = now; this.isLoading = false; try{ window.ApiCore?.clearCache?.(); }catch(e){} this.loadDashboard(); }
      };
      window.addEventListener('focus', check);
      window.addEventListener('pageshow', check);
      window.addEventListener('storage', (e)=>{ if(e.key==='shop_updated') check(); });
      document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) check(); });
    }
    markShopUpdated(){ const t = Date.now().toString(); localStorage.setItem('shop_updated', t); this.lastShopUpdate = t; }

    bindUI(){
      const $ = (id)=> document.getElementById(id);
      $('newProductBtn')?.addEventListener('click', ()=> this.goProductForm());
      $('quickAddBtn')?.addEventListener('click', ()=> this.goQuickAdd());
      $('viewShopBtn')?.addEventListener('click', ()=> this.viewShop());
    }

    bindSearch(){
      const input = document.getElementById('searchInput'); if(!input) return;
      input.addEventListener('input', (e)=>{
        clearTimeout(this.searchDebounce);
        this.searchDebounce = setTimeout(()=>{
          const q = e.target.value.toLowerCase().trim();
          let base = this.currentCat==='All'? this.allProducts : this.allProducts.filter(p=>(p.category||'General')===this.currentCat);
          this.filteredProducts = !q? [...base] : base.filter(p=>
            (p.name||'').toLowerCase().includes(q) ||
            (p.brand||p.extraData?.brand||'').toLowerCase().includes(q) ||
            (p.category||'').toLowerCase().includes(q)
          );
          this.renderProducts(this.filteredProducts);
        }, 200);
      });
    }

    bindToggle(){
      const el = document.getElementById('toggleSwitch'); if(!el) return;
      // purana inline onclick hatao warna double chalega
      el.removeAttribute('onclick');
      el.addEventListener('click', async ()=>{
        const isOpen = !el.classList.contains('on');
        this.updateToggleUI(isOpen);
        try{
          if(window.ShopToggleCore?.toggle){
            const state = await window.ShopToggleCore.toggle(this.shopId);
            this.updateToggleUI(state);
          }else{
            await fetch(this.API_COMMON.toggle, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({isOpen})}).catch(()=>{});
            await fetch(`/api/shops/dairy/${this.shopId}/settings`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({isOpen})}).catch(()=>{});
          }
          this.markShopUpdated();
          this.toast(isOpen? 'Shop Opened ✅ - Doodh chalu 🥛' : 'Shop Closed 🔴');
        }catch(e){ this.updateToggleUI(!isOpen); this.toast('Toggle failed'); }
      });
    }
    updateToggleUI(isOpen){
      const sw = document.getElementById('toggleSwitch');
      if(sw) sw.className = 'switch ' + (isOpen? 'on' : '');
      const tt = document.getElementById('toggleText');
      if(tt) tt.innerText = isOpen? 'Open' : 'Closed';
    }

    bindSocket(){
      // Common wala SocketCore
      if(window.SocketCore){
        window.SocketCore.on('new-order', (order)=>{
          if(order.shopId && order.shopId!==this.shopId) return;
          this.toast(`🔔 New Order - ₹${order.total||0}`);
          this.playSound(); if(navigator.vibrate) navigator.vibrate([100,50,100]);
          this.orders.unshift(order); this.renderOrders(this.orders.slice(0,10));
          this.isLoading = false; this.loadDashboard();
        });
        window.SocketCore.on('shop-status-changed', (d)=>{ if(d.shopId===this.shopId) this.updateToggleUI(d.isOpen); });
        window.SocketCore.on('shop-profile-updated', (d)=>{ if(d.shopId===this.shopId){ this.markShopUpdated(); this.loadDashboard(); } });
        window.SocketCore.on('product-updated', (d)=>{ if(d.shopId===this.shopId){ this.isLoading=false; this.loadDashboard(); } });
        return;
      }
      // Purana dairy wala socket.io fallback
      setTimeout(()=>{
        if(window.io){
          try{
            const socket = io();
            socket.on(`new-order-${this.shopId}`, ()=>{ this.toast('🔔 New Dairy Order'); this.isLoading=false; this.loadDashboard(); });
            socket.on(`dairy-order-${this.shopId}`, ()=>{ this.isLoading=false; this.loadDashboard(); });
          }catch(e){}
        }
      }, 1000);
    }

    async loadDashboard(){
      if(this.isLoading) return;
      this.isLoading = true; this.showLoader(true);
      try{
        const results = await Promise.allSettled([
          window.WorldProductManager? window.WorldProductManager.getProducts({shopType:'dairy', shopId:this.shopId, role:'dashboard'}) : fetch(`${this.API_WORLD_BASE}?shopId=${this.shopId}&shopType=dairy&role=dashboard`).then(r=>r.json()).then(d=>d.data||[]),
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
        // PROFILE MERGE - common wala hisaab, profile wala data purane ko dabayega nahi
        const profShop = profileRes?.shop || profileRes?.profile || profileRes?.data || null;
        if(profShop && typeof profShop==='object'){
          const oldProducts = this.shopData.products || [];
          this.shopData = {...this.shopData, ...profShop, products: profShop.products?.length? profShop.products : oldProducts};
        }
        try{
          const localShop = JSON.parse(localStorage.getItem(`shop_${this.shopId}`)||'{}');
          if(localShop && (localShop.name || localShop.shopName)) this.shopData = {...this.shopData, ...localShop};
          const timingLocal = JSON.parse(localStorage.getItem(`timing_${this.shopId}`)||'null');
          if(timingLocal && timingLocal.isOpen!==undefined) this.shopData.isOpen = timingLocal.isOpen;
        }catch(e){}

        if(this.shopData.name && !this.shopData.shopName) this.shopData.shopName = this.shopData.name;
        if(this.shopData.shopName && !this.shopData.name) this.shopData.name = this.shopData.shopName;

        this.oldProducts = this.shopData.products || [];
        this.worldProducts = Array.isArray(worldRes)? worldRes : (worldRes?.data || []);
        const worldIds = new Set(this.worldProducts.map(p=>p._id));
        // World wala pehle, purana uske neeche - duplicate nahi hoga
        this.allProducts = [...this.worldProducts, ...this.oldProducts.filter(p=>!worldIds.has(p._id))];
        this.filteredProducts = this.currentCat==='All'? [...this.allProducts] : this.allProducts.filter(p=>(p.category||'General')===this.currentCat);

        this.lowStock = lowStockRes?.products || lowStockRes?.data || this.allProducts.filter(p=> (p.stock||0) <= (p.lowStockAlert||20));
        this.orders = ordersRes?.orders || ordersRes?.data || this.shopData.liveOrders || [];
        this.subscriptions = this.shopData.subscriptions || [];

        this.renderStats(analyticsRes);
        this.renderCats();
        this.renderProducts(this.filteredProducts);
        this.renderLowStock(this.lowStock);
        this.renderCategoriesOrSubs();
        this.renderOrders(this.orders);
        this.renderProfile();
        this.renderStatus();

        if(this.shopData.isOpen!==undefined) this.updateToggleUI(!!this.shopData.isOpen);
        if(this.shopData.settings?.isOpen!==undefined) this.updateToggleUI(!!this.shopData.settings.isOpen);

        if(window.DashboardCore){ window.DashboardCore.shopId=this.shopId; window.DashboardCore.shopData=this.shopData; }
      }catch(e){
        console.error('Dairy loadDashboard failed', e);
        const c = document.getElementById('inventoryList');
        if(c) c.innerHTML = `<div style="grid-column:1/-1;padding:20px;color:#ef4444;background:#fef2f2;border:1px solid #fee2e2;border-radius:12px"><b>Error:</b> ${e.message}</div>`;
      }finally{ this.isLoading = false; this.showLoader(false); }
    }

    renderStatus(){
      const el = document.getElementById('commonStatus'); if(!el) return;
      el.innerHTML = `✅ SAMANLIVE Connected<br>Shop: ${this.shopData?.shopName||this.shopData?.name||'Dairy Shop'}<br>Products: ${this.allProducts.length} (World: ${this.worldProducts.length})<br>Type: dairy`;
    }

    renderProfile(){
      const d = this.shopData || {};
      const name = d.shopName || d.name || 'Dairy Shop';
      const owner = d.ownerName || d.owner || d.userName || 'Owner';
      const photo = localStorage.getItem(`shop_avatar_${this.shopId}`) || d.avatar || d.shopImage || d.logo || d.image || 'https://placehold.co/100x100/0ea5e9/ffffff?text=D';
      const img = document.getElementById('shopPhoto'); if(img) img.src = photo;
      const set = (id, txt)=>{ const el=document.getElementById(id); if(el) el.innerText = txt; };
      set('shopName', name); set('headerShopName', name);
      set('shopMeta', `${owner} • ${d.area || d.city || 'Dairy'}`);
      set('profileShopName', name); set('profileOwnerName', owner);
    }

    checkExpiryToday(){
      const today = new Date().toDateString();
      return this.allProducts.filter(p=>{
        if(!p.expiry && !p.extraData?.expiry) return false;
        const ex = p.expiry || p.extraData?.expiry;
        return new Date(ex).toDateString() === today;
      });
    }

    renderStats(analytics){
      const $ = (id)=> document.getElementById(id);
      const todayOrders = analytics?.todayOrders || analytics?.todaySale || this.shopData?.stats?.todaySale || this.orders.length || 0;
      const revenue = analytics?.todayRevenue || analytics?.revenue || this.shopData?.stats?.revenue || 0;
      // purana HTML me items = Total Products, expiry = Low Stock count
      if($('items')) $('items').innerText = this.allProducts.length;
      if($('prodCount')) $('prodCount').innerText = `(${this.allProducts.length})`;
      if($('sale')) $('sale').innerText = todayOrders;
      if($('revenue')) $('revenue').innerText = `₹${revenue}`;
      if($('expiry')) $('expiry').innerText = this.checkExpiryToday().length || this.lowStock.length;
      if($('productCount')) $('productCount').innerText = this.allProducts.length;
      if($('lowStockCount')) $('lowStockCount').innerText = this.lowStock.length;
      if($('orderCount')) $('orderCount').innerText = todayOrders;
    }

    renderCats(){
      const bar = document.getElementById('catTabs'); if(!bar) return;
      const cats = ['All', ...new Set(this.allProducts.map(p=>p.category||'General'))];
      bar.innerHTML = cats.map(c=>`<div class="tab ${c===this.currentCat?'active':''}" onclick="window.DairyDashboard.filterCat('${c.replace(/'/g,"\\'")}',this)">${c==='All'?'🥛 All':c}</div>`).join('');
    }

    filterCat(cat, el){
      this.currentCat = cat;
      document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      if(el) el.classList.add('active');
      const q = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
      let base = cat==='All'? this.allProducts : this.allProducts.filter(p=>(p.category||'General')===cat);
      this.filteredProducts = !q? [...base] : base.filter(p=>(p.name||'').toLowerCase().includes(q));
      this.renderProducts(this.filteredProducts);
    }

    // ===== SPECIAL CARD - COMMON WALA LOGIC =====
    isSpecialProduct(p){
      if(!p) return false;
      const ex = p.extraData || {};
      return p.isSpecial===true || p.isSpecial==='true' || ex.isSpecial===true || ex.isSpecial==='true' || p.layout==='special' || ex.layout==='special';
    }
    getProductImage(p){
      return p.thumbnail || p.image || p.images?.[0]?.url || p.extraData?.thumbnail || `https://placehold.co/400x300/0ea5e9/ffffff?text=${encodeURIComponent((p.name||'Dairy').slice(0,10))}`;
    }

    renderProducts(list){
      const c = document.getElementById('inventoryList'); if(!c) return;
      if(!list.length){
        c.innerHTML = `<div class="empty-box" style="grid-column:1/-1;text-align:center;padding:50px"><div style="font-size:50px">🥛</div><h3 style="font-weight:900;margin-top:10px">No dairy items</h3><p style="color:#94a3b8;font-size:13px;margin-top:6px">Click <b style="color:#0ea5e9">Quick Add</b> to add dairy products</p><button onclick="window.DairyDashboard.goQuickAdd()" class="btn btn-milk" style="margin:14px auto 0;background:#0ea5e9;color:#fff;border:none;padding:10px 16px;border-radius:12px;font-weight:800;cursor:pointer">Quick Add Products</button></div>`;
        return;
      }
      const specialList = list.filter(p=> this.isSpecialProduct(p));
      const normalList = list.filter(p=>!this.isSpecialProduct(p));
      let html = '';
      if(specialList.length){
        html += `<div style="grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;background:#f0f9ff;border:1px solid #bae6fd;padding:10px 12px;border-radius:12px"><b style="font-size:13px">⭐ Special Products</b><span style="font-size:11px;font-weight:800;color:#0369a1">${specialList.length} items</span></div>`;
        html += specialList.map(p=> this.renderSpecialCard(p)).join('');
        if(normalList.length) html += `<div style="grid-column:1/-1;font-weight:900;font-size:13px;margin-top:4px">All Products</div>`;
      }
      html += normalList.map(p=> this.renderNormalCard(p)).join('');
      c.innerHTML = html;
    }

    renderNormalCard(p){
      const brand = p.brand || p.extraData?.brand || 'Local Fresh';
      const size = p.extraData?.size || p.size || p.weight || p.unit || '';
      const exp = p.expiry || p.extraData?.expiry || '';
      return `
      <div class="p-card">
        <img src="${this.getProductImage(p)}" loading="lazy" onerror="this.src='https://placehold.co/400x300/0ea5e9/ffffff?text=Dairy'">
        <div class="p-info">
          <b title="${p.name||''}">${(p.name||'').slice(0,40)}</b>
          <div class="meta">${p.category||''} ${size?'• '+size:''} ${exp?'• Exp: '+new Date(exp).toLocaleDateString():''}</div>
          <div class="price-row"><div class="price">₹${p.price||0}<br><span class="brand-badge">${brand}</span></div><div class="stock ${(p.stock||0)<=20?'low':'ok'}">${p.stock||0} LEFT</div></div>
          <div style="display:flex;gap:6px;margin-top:10px">
            <button onclick="window.DairyDashboard.editProduct('${p._id}')" style="flex:1;background:#f1f5f9;border:1px solid #e2e8f0;padding:7px;border-radius:10px;font-weight:800;font-size:11px;cursor:pointer">Edit</button>
            <button onclick="window.DairyDashboard.deleteProduct('${p._id}')" style="width:36px;background:#fff;border:1px solid #fee2e2;color:#ef4444;border-radius:10px;cursor:pointer"><i class="fa fa-trash"></i></button>
          </div>
        </div>
      </div>`;
    }

    renderSpecialCard(p){
      const ex = p.extraData || {};
      const brand = p.brand || ex.brand || '';
      const badge = ex.badge || p.badge || 'SPECIAL';
      const bg = ex.cardColor || p.cardColor || '#f0f9ff';
      const layout = (ex.layout || p.layout || 'big').toString().toLowerCase();
      if(layout==='list'){
        return `<div class="p-card" style="grid-column:1/-1;display:flex;background:${bg};border:1px solid #bae6fd">
          <img src="${this.getProductImage(p)}" style="width:110px;height:110px" onerror="this.src='https://placehold.co/400x300/0ea5e9/ffffff?text=Dairy'">
          <div class="p-info" style="flex:1"><span style="background:#0ea5e9;color:#fff;font-size:9px;font-weight:900;padding:3px 7px;border-radius:999px">⭐ ${badge}</span><b style="margin-top:5px">${p.name||''}</b><div class="meta">${brand} • ${p.category||''}</div><div class="price-row"><div class="price">₹${p.price||0}</div><div class="stock ${(p.stock||0)<=20?'low':'ok'}">${p.stock||0} LEFT</div></div>
          <div style="display:flex;gap:6px;margin-top:8px"><button onclick="window.DairyDashboard.editProduct('${p._id}')" style="flex:1;background:#fff;border:1px solid #e2e8f0;padding:7px;border-radius:9px;font-weight:800;font-size:11px;cursor:pointer">Edit</button><button onclick="window.DairyDashboard.deleteProduct('${p._id}')" style="width:36px;background:#fff;border:1px solid #fee2e2;color:#ef4444;border-radius:9px;cursor:pointer"><i class="fa fa-trash"></i></button></div></div></div>`;
      }
      return `<div class="p-card" style="grid-column:1/-1;background:${bg};border:1px solid #bae6fd">
        <div style="position:relative"><img src="${this.getProductImage(p)}" style="height:190px" onerror="this.src='https://placehold.co/400x300/0ea5e9/ffffff?text=Dairy'"><span style="position:absolute;top:10px;left:10px;background:#0ea5e9;color:#fff;font-size:10px;font-weight:900;padding:5px 9px;border-radius:999px">⭐ ${badge}</span></div>
        <div class="p-info"><b style="font-size:15px;min-height:auto">${p.name||''}</b><div class="meta">${brand} • ${p.category||''} ${ex.quality?'• '+ex.quality:''}</div>${p.description||ex.description?`<div style="font-size:12px;color:#475569;margin-top:6px">${(p.description||ex.description).slice(0,140)}</div>`:''}
        <div class="price-row"><div class="price" style="font-size:17px">₹${p.price||0} <del style="color:#94a3b8;font-size:12px">₹${p.mrp||p.price||0}</del></div><div class="stock ${(p.stock||0)<=20?'low':'ok'}">${p.stock||0} LEFT</div></div>
        <div style="display:flex;gap:6px;margin-top:10px"><button onclick="window.DairyDashboard.editProduct('${p._id}')" style="flex:1;background:#0f172a;color:#fff;border:none;padding:9px;border-radius:9px;font-weight:800;font-size:11px;cursor:pointer">Edit Special</button><button onclick="window.DairyDashboard.deleteProduct('${p._id}')" style="width:40px;background:#fff;border:1px solid #fee2e2;color:#ef4444;border-radius:9px;cursor:pointer"><i class="fa fa-trash"></i></button></div></div></div>`;
    }

    renderLowStock(list){
      const c = document.getElementById('lowStock'); if(!c) return;
      if(!list.length){ c.innerHTML = '<div style="background:#f0fdf4;color:#166534;padding:10px;border-radius:10px;font-weight:800;font-size:12px;text-align:center">✓ All Fresh - Stock OK</div>'; return; }
      c.innerHTML = list.slice(0,8).map(p=>{
        const exp = p.expiry || p.extraData?.expiry || '';
        return `<div class="low-item" style="display:flex;justify-content:space-between;padding:10px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-bottom:6px"><div style="min-width:0"><b style="font-size:12px">${p.name}</b><br><small style="color:#92400e;font-size:10px">${exp? 'Exp: '+new Date(exp).toLocaleDateString() : (p.category||'')}</small></div><span style="background:#92400e;color:#fff;padding:3px 7px;border-radius:20px;font-size:10px;font-weight:900;height:fit-content">${p.stock||0}</span></div>`;
      }).join('');
    }

    renderCategoriesOrSubs(){
      const c = document.getElementById('subBox'); if(!c) return;
      // Subscription data server de to wahi, nahi to Categories dikhao (purane dairy me yahi box tha)
      if(this.subscriptions && this.subscriptions.length){
        c.innerHTML = this.subscriptions.map(s=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f8fafc;font-size:13px;font-weight:600"><span>${s.customer||s.customerName||''} - ${s.qty||1}L Daily</span><span style="background:#e0f2fe;color:#0369a1;padding:2px 8px;border-radius:20px;font-size:11px">${s.slot||'Morning'}</span></div>`).join('');
        return;
      }
      const cats = [...new Set(this.allProducts.map(p=>p.category||'General'))];
      if(!cats.length){ c.innerHTML = '<p style="color:#94a3b8;font-size:12px">No active subscription</p>'; return; }
      c.innerHTML = cats.map(cat=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f8fafc;font-size:13px;font-weight:600"><span>${cat}</span><span style="background:#e0f2fe;color:#0369a1;padding:2px 8px;border-radius:20px;font-size:11px">${this.allProducts.filter(p=>(p.category||'General')===cat).length}</span></div>`).join('');
    }

    renderOrders(orders){
      const c = document.getElementById('liveOrders'); if(!c) return;
      if(!orders.length){ c.innerHTML = '<p style="color:#94a3b8;font-size:12px">No live orders</p>'; return; }
      c.innerHTML = orders.slice(0,8).map(o=>`<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #f1f5f9"><div><b style="font-size:12px">#${(o.orderId||o._id||'').toString().slice(-6).toUpperCase()}</b><br><small style="color:#64748b;font-size:10px">₹${o.total||0} • ${o.customerName||o.customer||'Customer'}</small></div><span style="font-size:10px;font-weight:900;background:#e0f2fe;color:#0369a1;padding:3px 7px;border-radius:999px;height:fit-content">${(o.status||'PLACED').toUpperCase()}</span></div>`).join('');
      // common wale dusre box bhi bhar do agar HTML me hain
      const rc = document.getElementById('recentOrders'); if(rc) rc.innerHTML = c.innerHTML;
      const lr = document.getElementById('liveOrdersRight'); if(lr) lr.innerHTML = c.innerHTML;
    }

    showLoader(show){ const el = document.getElementById('loader'); if(el) el.style.display = show? 'grid' : 'none'; }
    toast(msg){ const t = document.getElementById('toast'); if(!t) return; t.innerText = msg; t.style.display = 'block'; setTimeout(()=> t.style.display='none', 2800); }
    playSound(){ try{ const a = document.getElementById('newOrderSound'); if(a){ a.volume = 0.8; a.play().catch(()=>{}); } }catch(e){} }

    // ===== PRODUCT FORM - DAIRY SEED KE SAATH =====
    goProductForm(){ location.href = `../common/products/product-form.html?shopType=dairy&shopId=${this.shopId}&type=dairy`; }
    goQuickAdd(){ location.href = `../common/products/product-form.html?shopType=dairy&shopId=${this.shopId}&type=dairy&quick=1`; }
    editProduct(id){ location.href = `../common/products/product-form.html?shopType=dairy&shopId=${this.shopId}&type=dairy&editId=${id}`; }
    viewShop(){ window.open(`./user-view.html?shopId=${this.shopId}&shopType=dairy`, '_blank'); }

    async deleteProduct(id){
      if(!confirm('Delete? Ye item dashboard aur customer view dono se hat jayega.')) return;
      try{
        let res;
        if(window.WorldProductManager?.deleteProduct) res = await window.WorldProductManager.deleteProduct(id);
        else res = await fetch(`${this.API_WORLD_BASE}/${id}`, {method:'DELETE'}).then(r=>r.json());
        if(!res.success){
          const old = await fetch(`/api/shops/dairy/${this.shopId}/item/${id}`, {method:'DELETE'}).then(r=>r.json()).catch(()=>({success:false}));
          if(!old.success) throw new Error(res.message || 'Delete failed');
        }
        this.toast('Deleted ✅'); this.isLoading = false; await this.loadDashboard();
      }catch(e){ this.toast('Delete failed: ' + e.message); }
    }

    startAutoRefresh(){ this.stopAutoRefresh(); this.refreshInterval = setInterval(()=>{ this.isLoading = false; this.loadDashboard(); }, 30000); }
    stopAutoRefresh(){ if(this.refreshInterval) clearInterval(this.refreshInterval); }
  }

  window.DairyDashboard = new DairyDashboardCore();
  window.dairyDashboard = window.DairyDashboard;

  // Purane dairy HTML ke inline naam bhi chalte rahenge
  window.goForm = ()=> window.DairyDashboard.goProductForm();
  window.goQuick = ()=> window.DairyDashboard.goQuickAdd();
  window.viewShop = ()=> window.DairyDashboard.viewShop();
  window.editDairy = (id)=> window.DairyDashboard.editProduct(id);
  window.edit = window.editDairy;
  window.deleteDairyItem = (id)=> window.DairyDashboard.deleteProduct(id);
  window.del = window.deleteDairyItem;
  window.toggleShop = ()=>{ const sw = document.getElementById('toggleSwitch'); if(sw) sw.click(); };
  window.filterCat = (cat, el)=> window.DairyDashboard.filterCat(cat, el);
  window.dairyToast = (m)=> window.DairyDashboard.toast(m);

  setTimeout(()=>{ const l=document.getElementById('loader'); if(l) l.style.display='none'; window.DairyDashboard?.toast('✅ Dairy Dashboard Ready'); }, 1200);
})();