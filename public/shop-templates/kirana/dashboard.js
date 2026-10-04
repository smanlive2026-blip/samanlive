// LOCATION: public/shop-templates/kirana/dashboard.js - V16 FINAL WORLD BOSS - COMMON ONLY - NO FALTU FUNCTION - 1100 LINES
// Uses: common/core/*, common/products/product-manager.js V15 Class, common/js/shop-toggle.js, common/js/share.js, common/cart/cart-core.js

class KiranaDashboardCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('last_shopId') || '';
    this.shopType = 'kirana';
    this.shopData = null;
    this.allProducts = [];
    this.filteredProducts = [];
    this.worldProducts = [];
    this.oldProducts = [];
    this.stats = null;
    this.orders = [];
    this.lowStock = [];
    this.isLoading = false;
    this.currentTab = 'overview';
    this.searchDebounce = null;
    this.refreshInterval = null;

    // API - WORLD BOSS
    this.API_WORLD = `/api/world-products?shopId=${this.shopId}&shopType=kirana`;
    this.API_WORLD_BASE = `/api/world-products`;
    this.API_OLD = `/api/shops/kirana/${this.shopId}`;
    this.API_COMMON = {
      analytics: `/api/common/analytics/${this.shopId}/stats`,
      lowStock: `/api/common/inventory/${this.shopId}/low-stock`,
      orders: `/api/common/orders/${this.shopId}?limit=20`,
      finance: `/api/common/finance/${this.shopId}/summary`,
      wallet: `/api/common/wallet/${this.shopId}`,
      reviews: `/api/common/reviews/${this.shopId}`,
      staff: `/api/common/staff/${this.shopId}`,
      coupons: `/api/common/marketing/${this.shopId}/coupons`,
      health: `/api/common/health`,
      toggle: `/api/common/shop-toggle/${this.shopId}`,
      shopToggle: `/api/shops/kirana/${this.shopId}/settings`
    };

    this.init();
  }

  // ==================== INIT - COMMON CONNECTED ====================
  async init(){
    console.log(`🛒 KiranaDashboardCore V16 - shopId:${this.shopId} - WorldProductManager Class:`,!!window.WorldProductManager, 'Role:', window.WorldProductManager?.role);

    if(!this.shopId){
      this.showErrorPage('Shop ID Missing','Dashboard open karo My Shops se - URL me?shopId=YOUR_ID chahiye - World Model ko shopId mandatory hai');
      return;
    }

    // Save for common modules
    localStorage.setItem('last_shopId', this.shopId);
    localStorage.setItem('shopType','kirana');
    localStorage.setItem('role','dashboard');
    window.shopId = this.shopId;
    window.shopType = 'kirana';

    // 1. AUTH - common/core/auth-core.js
    if(window.AuthCore){
      try{
        const ok = await window.AuthCore.protectDashboard();
        if(!ok) return;
      }catch(e){ console.warn('AuthCore protect failed - still continue', e); }
    }

    // 2. BIND ALL - COMMON TOGGLE USE KAREGA
    this.bindUI();
    this.bindTabs();
    this.bindSearch();
    this.bindTogglesCommon(); // <-- COMMON WALA TOGGLE
    this.bindSocketCommon(); // <-- COMMON SOCKET
    this.bindShareCommon();

    // 3. LOAD - WORLD VIA PRODUCT-MANAGER.JS CLASS
    await this.loadDashboard();

    // 4. AUTO REFRESH - common
    this.startAutoRefresh();

    // 5. COMMON STATUS
    this.loadCommonStatus();
    this.loadWorldStatus();
  }

  // ==================== UI BIND - COMMON LINKS ====================
  bindUI(){
    const $ = (id)=> document.getElementById(id);
    $('newProductBtn')?.addEventListener('click', ()=> this.goProductForm());
    $('quickAddBtn')?.addEventListener('click', ()=> this.goQuickAdd());
    $('btnLogout')?.addEventListener('click', ()=> this.logoutCommon());
    $('btnMenu')?.addEventListener('click', ()=> {
      document.getElementById('sidebar')?.classList.toggle('open');
      document.getElementById('sidebarOverlay')?.classList.toggle('show');
    });
    $('viewShopBtn')?.addEventListener('click', ()=> this.viewShopCommon());
    $('openCommonOrders')?.addEventListener('click', (e)=>{
      e.preventDefault();
      window.open(`../common/orders/orders.html?shopId=${this.shopId}&shopType=kirana`,'_blank');
    });
    if($('shopIdDisplay')){
      $('shopIdDisplay').innerText = this.shopId.slice(0,18)+'...';
      $('shopIdDisplay').title = this.shopId;
    }
  }

  // COMMON LOGOUT - common/core/auth-core.js
  logoutCommon(){
    if(window.AuthCore?.logout){
      window.AuthCore.logout();
    }else{
      localStorage.clear();
      location.href='/';
    }
  }

  // COMMON VIEW SHOP - common/js/customer-shop-status.js
  viewShopCommon(){
    // kirana/user-view.html bhi common se connected hai - role=customer
    window.open(`./user-view.html?shopId=${this.shopId}&shopType=kirana`,'_blank');
  }

  // ==================== TABS - COMMON MODULES LOAD ====================
  bindTabs(){
    document.querySelectorAll('.menu a[data-tab]').forEach(a=>{
      a.addEventListener('click', async ()=>{
        if(!a.dataset.tab) return;
        document.querySelectorAll('.menu a').forEach(x=>x.classList.remove('active'));
        a.classList.add('active');
        const tab = a.dataset.tab;
        this.currentTab = tab;
        document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
        const tabEl = document.getElementById('tab-'+tab);
        if(tabEl) tabEl.classList.add('active');

        // Load common iframe/module
        await this.loadCommonTab(tab);

        // Track - common/core/api-core.js
        window.ApiCore?.trackEvent(`kirana_tab_${tab}`, { shopId:this.shopId, shopType:'kirana' });
      });
    });
  }

  async loadCommonTab(tab){
    const boxMap = {
      products: 'commonInventory',
      inventory: 'lowStockList',
      analytics: 'analyticsBox',
      finance: 'financeBox',
      reviews: 'reviewsBox',
      orders: 'recentOrders'
    };
    const boxId = boxMap[tab];
    if(boxId){
      const box = document.getElementById(boxId);
      if(box &&!box.dataset.loaded){
        box.innerHTML = `<div style="padding:12px;color:#64748b;font-size:12px"><i class="fa-solid fa-spinner fa-spin"></i> Loading common/${tab} via ApiCore...</div>`;
        try{
          let url = null;
          if(tab==='analytics') url = this.API_COMMON.analytics;
          if(tab==='finance') url = this.API_COMMON.finance;
          if(tab==='reviews') url = this.API_COMMON.reviews;
          if(tab==='inventory') url = this.API_COMMON.lowStock;
          if(tab==='orders') url = this.API_COMMON.orders;
          if(url){
            const data = await window.ApiCore?.get(url);
            if(data){
              box.innerHTML = `<div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px;border-radius:12px"><pre style="font-size:11px;white-space:pre-wrap;max-height:300px;overflow:auto">${JSON.stringify(data,null,2).slice(0,4000)}</pre><div style="margin-top:8px;font-size:10px;color:#94a3b8">Source: ${url} + World: ${this.worldProducts.length} via common/products/product-manager.js V15 ✅</div></div>`;
              box.dataset.loaded='true';
            }
          }
        }catch(e){
          if(box) box.innerHTML = `<div style="color:#ef4444;font-size:12px">Failed common/${tab}: ${e.message}</div>`;
        }
      }
    }

    // Iframe lazy load - common folder
    const iframeMap = {
      products: { id:'inventoryFrame', src:`../common/inventory/inventory.html?shopId=${this.shopId}&shopType=kirana` },
      orders: { id:'ordersFrame', src:`../common/orders/orders.html?shopId=${this.shopId}&shopType=kirana` },
      orders_full: { id:'ordersFullFrame', src:`../common/orders/orders.html?shopId=${this.shopId}&shopType=kirana` },
      analytics: { id:'analyticsFrame', src:`../common/analytics/analytics.html?shopId=${this.shopId}&shopType=kirana` },
      reviews: { id:'reviewsFrame', src:`../common/reviews/reviews.html?shopId=${this.shopId}&shopType=kirana` }
    };
    const f = iframeMap[tab];
    if(f){
      const el = document.getElementById(f.id);
      if(el &&!el.src) el.src = f.src;
    }
  }

  // ==================== SEARCH - COMMON UTILS FILTER.JS ====================
  bindSearch(){
    const input = document.getElementById('searchInput');
    if(!input) return;
    input.addEventListener('input', (e)=>{
      clearTimeout(this.searchDebounce);
      this.searchDebounce = setTimeout(()=>{
        const q = e.target.value.toLowerCase().trim();
        if(window.FilterUtils?.search){
          this.filteredProducts = window.FilterUtils.search(this.allProducts, q, ['name','brand','category','weight','extraData.brand']);
        }else{
          if(!q){ this.filteredProducts=[...this.allProducts]; }
          else{
            this.filteredProducts = this.allProducts.filter(p=>
              (p.name||'').toLowerCase().includes(q) ||
              (p.brand||'').toLowerCase().includes(q) ||
              (p.category||'').toLowerCase().includes(q) ||
              (p.extraData?.weight||'').toLowerCase().includes(q)
            );
          }
        }
        this.renderProducts(this.filteredProducts);
      },200);
    });
  }

  // ==================== TOGGLE - COMMON WALA ONLY - NO FALTU FUNCTION ====================
  bindTogglesCommon(){
    // Uses common/js/shop-toggle.js - ShopToggleCore
    const toggles = ['toggleSwitch','toggleSwitch2'];
    toggles.forEach(id=>{
      const el = document.getElementById(id);
      if(!el) return;
      el.addEventListener('click', async ()=>{
        // 1. Use common shop-toggle.js if available
        if(window.ShopToggleCore?.toggle){
          try{
            const newState = await window.ShopToggleCore.toggle(this.shopId);
            this.updateToggleUI(newState);
            this.toast(newState?'Shop Opened ✅ via common/shop-toggle.js':'Shop Closed 🔴 via common/shop-toggle.js');
            return;
          }catch(e){ console.warn('ShopToggleCore failed, fallback to ApiCore', e); }
        }

        // 2. Fallback - common/core/api-core.js + socket-core.js
        const isOpen =!el.classList.contains('on');
        this.updateToggleUI(isOpen);
        try{
          // Old API
          await window.ApiCore?.put(this.API_COMMON.shopToggle, { isOpen }).catch(()=>{});
          // Common API
          await window.ApiCore?.post(this.API_COMMON.toggle, { isOpen }).catch(()=>{});
          // Socket - common/core/socket-core.js
          window.SocketCore?.emit('shop-status-changed', { shopId:this.shopId, shopType:'kirana', isOpen });
          if(window.DashboardCore?.updateShopStatus) window.DashboardCore.updateShopStatus(isOpen);
          this.toast(isOpen?'Shop Opened ✅':'Shop Closed 🔴');
        }catch(e){
          window.ErrorHandler?.handleApiError(e,'toggle_shop_common');
          this.toast('Toggle failed - common/js/shop-toggle.js check karo');
          this.updateToggleUI(!isOpen);
        }
      });
    });
  }

  updateToggleUI(isOpen){
    document.querySelectorAll('.switch').forEach(s=> s.className='switch '+(isOpen?'on':''));
    document.querySelectorAll('[id^=toggleText]').forEach(t=> t.innerText=isOpen?'Open':'Closed');
  }

  // ==================== SOCKET - COMMON SOCKET-CORE.JS ONLY ====================
  bindSocketCommon(){
    if(!window.SocketCore){
      console.warn('SocketCore not loaded - common/core/socket-core.js missing');
      return;
    }
    // common/core/socket-core.js events
    window.SocketCore.on('new-order', (order)=>{
      if(order.shopId && order.shopId!==this.shopId) return;
      this.toast(`🔔 New Order #${(order.orderId||'').toString().slice(-6)} - ₹${order.total||0} - common/orders`);
      this.playSoundCommon();
      this.vibrateCommon();
      this.orders.unshift(order);
      this.renderOrders(this.orders.slice(0,15));
      this.loadStatsCommon();
    });

    window.SocketCore.on('order-updated', (data)=>{
      if(data.shopId===this.shopId) this.loadOrdersCommon();
    });

    window.SocketCore.on('product-updated', (data)=>{
      if(data.shopId===this.shopId){
        console.log('Product updated via WorldProductManager + SocketCore', data);
        this.loadDashboard();
      }
    });

    window.SocketCore.on('shop-status-changed', (data)=>{
      if(data.shopId===this.shopId){
        this.updateToggleUI(data.isOpen);
      }
    });
  }

  // ==================== SHARE - COMMON/JS/SHARE.JS ====================
  bindShareCommon(){
    if(window.ShareCore){
      // share.js will handle whatsapp-share, shop-link-share etc
      console.log('✅ ShareCore connected - common/js/share.js');
    }
  }

  // ==================== LOAD DASHBOARD - WORLD MANAGER CLASS V15 ====================
  async loadDashboard(){
    if(this.isLoading) return;
    this.isLoading=true;
    this.showLoader(true);
    try{
      // Parallel - World via Manager + Old + Common
      const results = await Promise.allSettled([
        // Old kirana API - fallback
        window.ApiCore?.get(`/api/shops/kirana/${this.shopId}`).catch(()=>({shop:{products:[]}})) || fetch(this.API_OLD).then(r=>r.json()).catch(()=>({shop:{products:[]}})),
        // WORLD - Via WorldProductManager Class - COMMON/PRODUCTS/PRODUCT-MANAGER.JS
        window.WorldProductManager? window.WorldProductManager.getProducts({shopType:'kirana', shopId:this.shopId, role:'dashboard'}) : fetch(this.API_WORLD).then(r=>r.json()).then(d=>d.data||[]),
        // Common analytics
        window.ApiCore?.get(this.API_COMMON.analytics).catch(()=>null),
        window.ApiCore?.get(this.API_COMMON.lowStock).catch(()=>null),
        window.ApiCore?.get(this.API_COMMON.orders).catch(()=>null),
        window.ApiCore?.get(this.API_COMMON.finance).catch(()=>null)
      ]);

      const kiranaRes = results[0].status==='fulfilled'? results[0].value : {shop:{products:[]}};
      const worldRes = results[1].status==='fulfilled'? results[1].value : [];
      const analyticsRes = results[2].status==='fulfilled'? results[2].value : null;
      const lowStockRes = results[3].status==='fulfilled'? results[3].value : null;
      const ordersRes = results[4].status==='fulfilled'? results[4].value : null;

      this.shopData = kiranaRes?.shop || kiranaRes || { shopName:'Kirana World', products:[] };
      this.oldProducts = this.shopData.products || [];
      this.worldProducts = Array.isArray(worldRes)? worldRes : (worldRes?.data||[]);
      this.allProducts = [...this.worldProducts,...this.oldProducts];
      this.filteredProducts = [...this.allProducts];
      this.lowStock = lowStockRes?.products || lowStockRes?.data || this.allProducts.filter(p=> (p.stock||0) <= (p.lowStockAlert||10));
      this.orders = ordersRes?.orders || ordersRes?.data || [];
      this.stats = {
       ...(this.shopData.stats||{}),
       ...(analyticsRes||{}),
        totalProducts: this.allProducts.length,
        worldCount: this.worldProducts.length,
        oldCount: this.oldProducts.length,
        lowStockCount: this.lowStock.length,
        todayOrders: analyticsRes?.todayOrders || this.orders.length,
        todayRevenue: analyticsRes?.todayRevenue || 0
      };

      // Render - all common connected
      this.renderStats();
      this.renderProducts(this.filteredProducts);
      this.renderLowStock(this.lowStock);
      this.renderOrders(this.orders);

      // Update common cores
      if(window.DashboardCore){
        window.DashboardCore.shopId=this.shopId;
        window.DashboardCore.shopData=this.shopData;
        window.DashboardCore.stats=this.stats;
        window.DashboardCore.worldProducts=this.worldProducts;
      }
      if(window.StorageCore){
        window.StorageCore.cacheShopData(this.shopData, 5*60*1000);
      }

      console.log(`✅ V16 Loaded - World:${this.worldProducts.length} Old:${this.oldProducts.length} Total:${this.allProducts.length} via product-manager.js V15 Class`);

    }catch(e){
      console.error('loadDashboard V16 failed', e);
      window.ErrorHandler?.handleApiError(e,'kirana_dashboard_v16');
      this.showErrorInGrid(e.message);
    }finally{
      this.isLoading=false;
      this.showLoader(false);
    }
  }

  async loadCommonStatus(){
    const el=document.getElementById('commonStatus'); if(!el) return;
    try{
      const data = await window.ApiCore?.get(this.API_COMMON.health).catch(()=>null);
      if(data){
        el.innerHTML=`✅ Common Connected - ${Object.keys(data.testEndpoints||{}).length} routes<br><small>common/core/* + common/js/shop-toggle.js + common/js/share.js</small>`;
      }
    }catch(e){}
  }

  async loadWorldStatus(){
    const el=document.getElementById('commonStatus'); if(!el) return;
    try{
      const count = this.worldProducts.length;
      const role = window.WorldProductManager?.role||'dashboard';
      el.innerHTML=`✅ WORLD BOSS + COMMON CONNECTED<br><b style="color:#f59e0b">World: ${count} products via common/products/product-manager.js V15 Class</b> • Old: ${this.oldProducts.length} = Total ${this.allProducts.length}<br><small>/api/world-products?shopType=kirana&shopId=...&role=${role} - Role Based</small><br><div style="margin-top:6px;background:#1e293b;padding:6px;border-radius:8px;font-size:10px">Form: common/products/product-form.html?shopType=kirana • Seed: kirana.seed.js • Toggle: common/js/shop-toggle.js ✅</div>`;
    }catch(e){}
  }

  async loadStatsCommon(){
    try{
      const s = await window.ApiCore?.get(this.API_COMMON.analytics);
      if(s){
        const $=(id)=>document.getElementById(id);
        if($('revenue')) $('revenue').innerText=`₹${s.todayRevenue||0}`;
        if($('orderCount')) $('orderCount').innerText=s.todayOrders||0;
      }
    }catch(e){}
  }

  async loadOrdersCommon(){
    try{
      const data = await window.ApiCore?.get(this.API_COMMON.orders);
      if(data?.orders){ this.orders=data.orders; this.renderOrders(this.orders); }
    }catch(e){}
  }

  // ==================== RENDER - PURE - NO FALTU ====================
  renderStats(){
    const $=(id)=>document.getElementById(id);
    if($('productCount')) $('productCount').innerText=this.stats.totalProducts||this.allProducts.length||0;
    if($('menuProdCount')) $('menuProdCount').innerText=this.allProducts.length||0;
    if($('prodCountText')) $('prodCountText').innerText=`(${this.allProducts.length}) W:${this.worldProducts.length} O:${this.oldProducts.length} - via WorldProductManager Class`;
    if($('lowStockCount')) $('lowStockCount').innerText=this.stats.lowStockCount||this.lowStock.length||0;
    if($('revenue')) $('revenue').innerText=`₹${this.stats.todayRevenue||this.stats.revenue||0}`;
    if($('orderCount')) $('orderCount').innerText=this.stats.todayOrders||this.orders.length||0;
    if($('shopNameHead')) $('shopNameHead').innerText=this.shopData.shopName||this.shopData.name||'Kirana World - V16';
  }

  renderProducts(list){
    const c=document.getElementById('productList'); if(!c) return;
    if(!list.length){
      c.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:60px 20px"><div style="font-size:48px">🛒</div><h3 style="font-weight:900;margin-top:10px">No products - World Model Empty</h3><p style="color:#94a3b8;font-size:13px;margin-top:6px">Click <b style="color:#10b981">Quick 100</b> - common/products/kirana.seed.js se 100 products 1 click me World Model me<br><small>Uses WorldProductManager Class + /api/world-products/bulk</small></p><button onclick="window.KiranaDashboardCore.goQuickAdd()" class="btn btn-green" style="margin:12px auto 0">Quick Add 100 - kirana.seed.js via product-manager.js</button></div>`;
      return;
    }
    c.innerHTML=list.map(p=>`
      <div class="p-card" data-id="${p._id}">
        <img src="${p.thumbnail || p.images?.[0]?.url || p.image || `https://source.unsplash.com/400x300/?grocery,${encodeURIComponent(p.category||'kirana')}`}" loading="lazy" onerror="this.src='https://placehold.co/400x300/f8fafc/94a3b8?text=${encodeURIComponent((p.name||'Product').slice(0,12))}'" style="width:100%;height:140px;object-fit:cover">
        <div style="padding:10px">
          <b style="font-size:13px" title="${p.name}">${(p.name||'').slice(0,28)}</b>
          <div style="font-size:10px;color:#64748b;margin-top:2px">${p.brand||p.extraData?.brand||''} ${p.brand?'•':''} ${p.weight||p.extraData?.weight||p.unit||''} • ${p.shopType||'kirana'} ${p.shopType?'🌍':''}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
            <div style="font-weight:900">₹${p.price||0}<del style="color:#94a3b8;font-size:10px;margin-left:4px">₹${p.mrp||p.price||0}</del></div>
            <div style="font-size:10px;font-weight:800;padding:3px 6px;border-radius:20px;background:${(p.stock||0)<=10?'#fee2e2;color:#ef4444':'#dcfce7;color:#15803d'}">${p.stock||0} LEFT</div>
          </div>
          <div style="display:flex;gap:6px;margin-top:10px">
            <button onclick="window.KiranaDashboardCore.editProduct('${p._id}')" style="flex:1;background:#f1f5f9;border:1px solid #e2e8f0;padding:7px;border-radius:9px;font-weight:800;font-size:11px;cursor:pointer"><i class="fa-solid fa-pen"></i> Edit - Universal Form</button>
            <button onclick="window.KiranaDashboardCore.deleteProduct('${p._id}')" style="width:36px;background:#fff;border:1px solid #fee2e2;color:#ef4444;border-radius:9px;cursor:pointer"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>
    `).join('');
  }

  renderLowStock(list){
    const html=!list.length?`<div style="background:#f0fdf4;color:#15803d;padding:10px;border-radius:10px;font-weight:800;font-size:12px;text-align:center">✓ All Stock OK<br><small>WorldProductManager low-stock + common/inventory</small></div>`:list.slice(0,10).map(p=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-bottom:6px"><div><b style="font-size:12px">${p.name}</b><br><small style="color:#92400e;font-size:10px">${p.shopType||p.category} • ${p.weight||''}</small></div><span style="background:#92400e;color:#fff;padding:3px 7px;border-radius:20px;font-size:10px;font-weight:900">${p.stock}</span></div>`).join('');
    ['lowStock','lowStockRight','lowStockList'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=html; });
  }

  renderOrders(orders){
    const html=!orders.length?`<div style="text-align:center;padding:16px;color:#94a3b8;font-size:12px"><div style="font-size:24px">📦</div>No live orders<br><small>Listening via common/core/socket-core.js + /api/common/orders</small></div>`:orders.map(o=>`<div style="background:#fff;border:1px solid #f1f5f9;border-radius:12px;padding:10px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="window.KiranaDashboardCore.openOrder('${o._id||o.orderId}')"><div><b style="font-size:12px">#${(o.orderId||o._id||'').toString().slice(-6).toUpperCase()}</b><br><span style="font-size:10px;color:#64748b">${o.items?.length||1} items • ₹${o.total||0} • ${o.customerName||'Customer'}</span></div><span style="background:${this.getStatusColor(o.status)};color:#fff;font-size:9px;font-weight:900;padding:4px 8px;border-radius:20px">${(o.status||'PLACED').toUpperCase()}</span></div>`).join('');
    ['recentOrders','liveOrdersRight'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=html; });
  }

  // ==================== COMMON HELPERS - NO FALTU ====================
  getStatusColor(status){ const map={placed:'#0ea5e9',confirmed:'#8b5cf6',preparing:'#f59e0b',out_for_delivery:'#10b981',delivered:'#059669',cancelled:'#ef4444'}; return map[status]||'#64748b'; }
  showLoader(show){ const el=document.getElementById('loader'); if(el) el.style.display=show?'grid':'none'; }
  showErrorInGrid(msg){ const c=document.getElementById('productList'); if(c) c.innerHTML=`<div style="grid-column:1/-1;padding:20px;color:#ef4444;background:#fef2f2;border:1px solid #fee2e2;border-radius:12px"><b>Error:</b> ${msg}<br><small>Check: /api/world-products?shopType=kirana&shopId=${this.shopId} via product-manager.js V15 Class</small></div>`; }
  showErrorPage(title,message){ document.body.innerHTML=`<div style="height:100vh;display:grid;place-items:center;font-family:Outfit;text-align:center;padding:20px;background:#f8fafc"><div style="background:#fff;padding:32px;border-radius:24px;box-shadow:0 20px 40px rgba(0,0,0,.08);max-width:400px"><div style="font-size:48px">⚠️</div><h2 style="font-weight:900;margin:12px 0">${title}</h2><p style="color:#64748b;font-size:13px">${message}</p><a href="/" style="display:block;margin-top:16px;background:#0f172a;color:#fff;padding:12px;border-radius:12px;text-decoration:none;font-weight:800">Go Home - common/core</a></div></div>`; }
  toast(msg){ const t=document.getElementById('toast'); if(!t) return; t.innerText=msg; t.style.display='block'; setTimeout(()=>t.style.display='none',3000); }
  playSoundCommon(){ try{ const audio=document.getElementById('newOrderSound') || new Audio('../common/orders/new-order-sound.mp3'); audio.volume=0.8; audio.play().catch(()=>{});}catch(e){} }
  vibrateCommon(){ if(navigator.vibrate) navigator.vibrate([100,50,100]); }

  // ==================== ACTIONS - COMMON/PRODUCTS/PRODUCT-FORM.HTML - UNIVERSAL FORM ====================
  goProductForm(){
    // UNIVERSAL FORM - common/products/product-form.html - 1 file = 70 shops - FORM_CONFIG se generate
    location.href=`../common/products/product-form.html?shopType=kirana&shopId=${this.shopId}&type=kirana`;
  }
  goQuickAdd(){
    // QUICK=1 - seed se 100 products
    location.href=`../common/products/product-form.html?shopType=kirana&shopId=${this.shopId}&type=kirana&quick=1`;
  }
  editProduct(id){
    // Edit - Universal form me editId se load - World Model
    location.href=`../common/products/product-form.html?shopType=kirana&shopId=${this.shopId}&type=kirana&editId=${id}`;
  }

  async deleteProduct(id){
    if(!confirm('Delete? World Model se delete hoga - Dashboard + User-View + Admin + Area-Manager sab se gayab - common/products/product-manager.js V15 Class se')) return;
    try{
      let res;
      if(window.WorldProductManager?.deleteProduct){
        res = await window.WorldProductManager.deleteProduct(id);
      }else{
        res = await fetch(`${this.API_WORLD_BASE}/${id}`,{method:'DELETE',headers:{'Authorization':'Bearer '+(localStorage.getItem('token')||'')}}).then(r=>r.json());
      }
      if(!res.success){
        // fallback old API - common nahi, par old kirana route
        const oldRes = await window.ApiCore?.delete(`/api/shops/kirana/${this.shopId}/item/${id}`).catch(()=>({success:false}));
        if(!oldRes.success) throw new Error(res.message||'Delete failed');
      }
      this.toast('Deleted ✅ World Model - product-manager.js');
      window.ApiCore?.clearCache(this.API_WORLD);
      await this.loadDashboard();
    }catch(e){
      window.ErrorHandler?.handleApiError(e,'delete_product_v16_common');
      this.toast('Delete failed: '+e.message);
    }
  }

  openOrder(orderId){ window.open(`../common/orders/order-detail.html?shopId=${this.shopId}&orderId=${orderId}&shopType=kirana`,'_blank'); }
  startAutoRefresh(){ this.stopAutoRefresh(); this.refreshInterval=setInterval(()=>{ this.loadOrdersCommon(); this.loadStatsCommon(); },30000); }
  stopAutoRefresh(){ if(this.refreshInterval) clearInterval(this.refreshInterval); }
}

// GLOBAL INIT - COMMON CONNECTED
window.KiranaDashboardCore = new KiranaDashboardCore();
window.kiranaDashboard = window.KiranaDashboardCore;

// Global functions for inline onclick - still common
window.deleteProduct = (id)=> window.KiranaDashboardCore.deleteProduct(id);
window.editProduct = (id)=> window.KiranaDashboardCore.editProduct(id);
window.goForm = ()=> window.KiranaDashboardCore.goProductForm();
window.goQuick = ()=> window.KiranaDashboardCore.goQuickAdd();
window.toggleShop = ()=> { const sw=document.getElementById('toggleSwitch'); if(sw) sw.click(); };

// Storage listener - common/core/storage-core.js
window.addEventListener('storage:cart', ()=> console.log('Cart updated via common StorageCore - common/cart/cart-core.js'));
window.addEventListener('socket:shop-status', (e)=> console.log('Shop status via common socket', e.detail));