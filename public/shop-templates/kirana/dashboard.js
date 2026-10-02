// LOCATION: public/shop-templates/kirana/dashboard.js - WORLD CLASS KIRANA DASHBOARD JS - V10 FINAL - PURA COMMON FOLDER CONNECTED - FULL PRODUCTION GRADE
class KiranaDashboardCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('last_shopId') || '';
    this.shopData = null;
    this.allProducts = [];
    this.filteredProducts = [];
    this.stats = null;
    this.orders = [];
    this.lowStock = [];
    this.isLoading = false;
    this.cache = new Map();
    this.listeners = new Map();
    this.refreshInterval = null;
    this.searchDebounce = null;
    this.currentTab = 'overview';

    // Config
    this.API_OLD = `/api/shops/kirana/${this.shopId}`;
    this.API_COMMON = {
      analytics: `/api/common/analytics/${this.shopId}/stats`,
      lowStock: `/api/common/inventory/${this.shopId}/low-stock`,
      orders: `/api/common/orders/${this.shopId}?limit=10`,
      finance: `/api/common/finance/${this.shopId}/summary`,
      wallet: `/api/common/wallet/${this.shopId}`,
      reviews: `/api/common/reviews/${this.shopId}`,
      staff: `/api/common/staff/${this.shopId}`,
      marketing: `/api/common/marketing/${this.shopId}/coupons`,
      health: `/api/common/health`,
      toggle: `/api/common/shop-toggle/${this.shopId}`
    };

    this.init();
  }

  async init(){
    console.log(`🛒 KiranaDashboardCore V10 WORLD CLASS - shopId: ${this.shopId} - Common Connected`);

    if(!this.shopId){
      this.showErrorPage('Shop ID Missing', 'Please open dashboard from My Shops with?shopId=YOUR_ID');
      return;
    }

    localStorage.setItem('last_shopId', this.shopId);

    // 1. AUTH PROTECTION - COMMON AUTH-CORE
    if(window.AuthCore){
      try{
        const ok = await window.AuthCore.protectDashboard();
        if(!ok){
          console.warn('Auth protection blocked');
          return;
        }
      }catch(e){
        console.warn('AuthCore protect failed', e);
      }
    }

    // 2. INIT UI
    this.bindUI();
    this.bindTabs();
    this.bindSearch();
    this.bindToggles();
    this.bindSocket();

    // 3. LOAD DATA - PURA COMMON + OLD
    await this.loadDashboard();

    // 4. AUTO REFRESH EVERY 30 SEC
    this.startAutoRefresh();

    // 5. LOAD COMMON COMPONENTS
    this.loadCommonStatus();

    // 6. TRACK
    if(window.ApiCore){
      window.ApiCore.trackEvent('kirana_dashboard_js_v10_loaded', { shopId: this.shopId, timestamp: Date.now() });
    }
  }

  bindUI(){
    const $ = (id)=> document.getElementById(id);

    // Buttons
    $('newProductBtn')?.addEventListener('click', ()=> this.goProductForm());
    $('quickAddBtn')?.addEventListener('click', ()=> this.goQuickAdd());
    $('refreshDashboard')?.addEventListener('click', ()=> this.loadDashboard());
    $('btnLogout')?.addEventListener('click', ()=> window.AuthCore?.logout());
    $('btnMenu')?.addEventListener('click', ()=> document.getElementById('sidebar')?.classList.toggle('open'));
    $('viewShopBtn')?.addEventListener('click', ()=> window.open(`/shop-templates/kirana/user-view.html?shopId=${this.shopId}`, '_blank'));
    $('openCommonOrders')?.addEventListener('click', ()=> window.open(`../common/orders/orders.html?shopId=${this.shopId}`, '_blank'));

    // Shop ID display
    if($('shopIdDisplay')){
      $('shopIdDisplay').innerText = this.shopId? this.shopId.slice(0,12)+'...' : 'MISSING';
      $('shopIdDisplay').title = this.shopId;
    }
  }

  bindTabs(){
    document.querySelectorAll('.menu a[data-tab]').forEach(a=>{
      a.addEventListener('click', async ()=>{
        document.querySelectorAll('.menu a').forEach(x=>x.classList.remove('active'));
        a.classList.add('active');
        const tab = a.dataset.tab;
        this.currentTab = tab;
        document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
        const tabEl = document.getElementById('tab-'+tab);
        if(tabEl) tabEl.classList.add('active');

        if(tab!== 'overview'){
          await this.loadCommonTab(tab);
        }

        // Track tab view
        window.ApiCore?.trackEvent(`kirana_tab_${tab}_view`, { shopId: this.shopId });
      });
    });
  }

  bindSearch(){
    const input = document.getElementById('searchInput');
    if(!input) return;
    input.addEventListener('keyup', (e)=>{
      clearTimeout(this.searchDebounce);
      this.searchDebounce = setTimeout(()=>{
        const q = e.target.value.toLowerCase().trim();
        if(!q){
          this.filteredProducts = [...this.allProducts];
        } else {
          this.filteredProducts = this.allProducts.filter(p=>
            (p.name||'').toLowerCase().includes(q) ||
            (p.category||'').toLowerCase().includes(q) ||
            (p.brand||'').toLowerCase().includes(q) ||
            (p.barcode||'').toLowerCase().includes(q)
          );
        }
        this.renderProducts(this.filteredProducts);
      }, 250);
    });
  }

  bindToggles(){
    const bind = (id)=>{
      const el = document.getElementById(id);
      if(!el) return;
      el.addEventListener('click', async ()=>{
        const isOpen =!el.classList.contains('on');
        document.querySelectorAll('.switch').forEach(s=> s.className = 'switch '+(isOpen?'on':''));
        document.querySelectorAll('[id^=toggleText]').forEach(t=> t.innerText = isOpen?'Open':'Closed');

        try{
          // Old API
          await window.ApiCore.put(`/api/shops/kirana/${this.shopId}/settings`, { isOpen });
          // New Common API
          await window.ApiCore.post(this.API_COMMON.toggle, { isOpen }).catch(()=>{});

          this.toast(isOpen?'Shop Opened ✅':'Shop Closed 🔴');
          window.SocketCore?.emit('shop-status-changed', { shopId: this.shopId, isOpen });

          // Update shopData
          if(this.shopData){
            this.shopData.settings = this.shopData.settings || {};
            this.shopData.settings.isOpen = isOpen;
          }
        }catch(e){
          window.ErrorHandler?.handleApiError(e, 'toggle_shop');
          this.toast('Failed to toggle shop');
        }
      });
    };
    bind('toggleSwitch');
    bind('toggleSwitch2');
  }

  bindSocket(){
    if(!window.SocketCore){
      console.warn('SocketCore not loaded - live orders disabled');
      return;
    }

    window.SocketCore.on('new-order', (order)=>{
      console.log('🔔 Kirana - New order from common socket', order);
      this.toast(`🔔 New Order #${(order.orderId||'').toString().slice(-6)} - ₹${order.total||0}`);
      this.playSound();
      this.vibrate();

      // Add to top of orders
      this.orders.unshift(order);
      this.renderOrders(this.orders.slice(0,10));
      this.loadStats();
    });

    window.SocketCore.on('order-updated', (order)=>{
      console.log('Order updated', order);
      this.loadOrders();
    });

    window.SocketCore.on('shop-status-changed', (data)=>{
      if(data.shopId === this.shopId){
        const isOpen = data.isOpen;
        document.querySelectorAll('.switch').forEach(s=> s.className = 'switch '+(isOpen?'on':''));
        document.querySelectorAll('[id^=toggleText]').forEach(t=> t.innerText = isOpen?'Open':'Closed');
      }
    });

    window.addEventListener('socket:new-order', (e)=> this.bindSocketNewOrder(e.detail));
  }

  bindSocketNewOrder(order){
    this.toast(`🔔 New Order! ₹${order.total||0}`);
    this.loadOrders();
  }

  async loadDashboard(){
    if(this.isLoading) return;
    this.isLoading = true;
    this.showLoader(true);

    try{
      // Parallel loading - Old + Common both
      const results = await Promise.allSettled([
        window.ApiCore.get(`/api/shops/kirana/${this.shopId}`),
        window.ApiCore.get(this.API_COMMON.analytics),
        window.ApiCore.get(this.API_COMMON.lowStock),
        window.ApiCore.get(this.API_COMMON.orders),
        window.ApiCore.get(this.API_COMMON.finance).catch(()=>null)
      ]);

      const kiranaRes = results[0].status === 'fulfilled'? results[0].value : null;
      const analyticsRes = results[1].status === 'fulfilled'? results[1].value : null;
      const lowStockRes = results[2].status === 'fulfilled'? results[2].value : null;
      const ordersRes = results[3].status === 'fulfilled'? results[3].value : null;

      if(!kiranaRes ||!kiranaRes.success){
        throw new Error(kiranaRes?.message || 'Failed to load kirana shop - check /api/shops/kirana/:shopId route');
      }

      this.shopData = kiranaRes.shop;
      this.allProducts = this.shopData.products || [];
      this.filteredProducts = [...this.allProducts];
      this.lowStock = lowStockRes?.products || this.shopData.lowStock || [];
      this.orders = ordersRes?.orders || [];
      this.stats = {
       ...this.shopData.stats,
       ...analyticsRes,
        totalProducts: this.allProducts.length,
        lowStockCount: this.lowStock.length,
        todayOrders: analyticsRes?.todayOrders || ordersRes?.orders?.length || 0,
        todayRevenue: analyticsRes?.todayRevenue || this.shopData.stats?.revenue || 0
      };

      // RENDER ALL
      this.renderStats();
      this.renderProducts(this.filteredProducts);
      this.renderLowStock(this.lowStock);
      this.renderOrders(this.orders);

      // Update DashboardCore if exists
      if(window.DashboardCore){
        window.DashboardCore.shopId = this.shopId;
        window.DashboardCore.shopData = this.shopData;
        window.DashboardCore.stats = this.stats;
      }

      // Cache shopData in StorageCore
      if(window.StorageCore){
        window.StorageCore.cacheShopData(this.shopData, 5*60*1000);
        window.StorageCore.set('last_dashboard_load', Date.now(), { ttl: 60000 });
      }

    }catch(e){
      console.error('loadDashboard failed', e);
      window.ErrorHandler?.handleApiError(e, 'kirana_dashboard_load');
      this.showErrorInGrid(e.message);
    }finally{
      this.isLoading = false;
      this.showLoader(false);
    }
  }

  async loadCommonTab(tab){
    const boxMap = {
      analytics: 'analyticsBox',
      finance: 'financeBox',
      reviews: 'reviewsBox'
    };
    const boxId = boxMap[tab];
    if(!boxId) return;

    const box = document.getElementById(boxId);
    if(!box) return;

    box.innerHTML = `<div style="padding:12px;color:#64748b;font-size:12px"><i class="fa-solid fa-spinner fa-spin"></i> Loading common/${tab}...</div>`;

    try{
      let data = null;
      if(tab === 'analytics'){
        data = await window.ApiCore.get(this.API_COMMON.analytics);
      } else if(tab === 'finance'){
        data = await window.ApiCore.get(this.API_COMMON.finance);
      } else if(tab === 'reviews'){
        data = await window.ApiCore.get(this.API_COMMON.reviews);
      }

      if(data){
        box.innerHTML = `<div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px;border-radius:12px"><pre style="font-size:11px;white-space:pre-wrap;word-break:break-all">${JSON.stringify(data, null, 2).slice(0, 3000)}</pre><div style="margin-top:8px;font-size:10px;color:#94a3b8">Source: /api/common/${tab}/:shopId - Connected ✅</div></div>`;
      } else {
        box.innerHTML = `<div style="color:#94a3b8;font-size:12px">No data - Common API /api/common/${tab} not ready yet. Check server/routes/common/${tab}.routes.js</div>`;
      }
    }catch(e){
      box.innerHTML = `<div style="color:#ef4444;font-size:12px">Failed to load common/${tab}: ${e.message}<br><small>Check /api/common/health</small></div>`;
    }
  }

  async loadCommonStatus(){
    const el = document.getElementById('commonStatus');
    if(!el) return;
    try{
      const data = await window.ApiCore.get(this.API_COMMON.health);
      if(data.success){
        el.innerHTML = `✅ Common Connected<br><small>${data.mountedRoutes||''} routes • ${data.message||''}</small><br><div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">${Object.keys(data.testEndpoints||{}).slice(0,4).map(k=>`<span style="background:#1e293b;padding:2px 6px;border-radius:6px;font-size:9px">${k}</span>`).join('')}</div>`;
      } else {
        el.innerText = '⚠️ Common health check failed';
      }
    }catch(e){
      el.innerHTML = `❌ Common not connected<br><small>${e.message}<br>Check server/routes/common/index.js - safeMount</small>`;
    }
  }

  async loadStats(){
    try{
      const s = await window.ApiCore.get(this.API_COMMON.analytics);
      if(s){
        document.getElementById('revenue').innerText = `₹${s.todayRevenue||0}`;
        document.getElementById('orderCount').innerText = s.todayOrders||0;
      }
    }catch(e){}
  }

  async loadOrders(){
    try{
      const data = await window.ApiCore.get(this.API_COMMON.orders);
      if(data?.orders){
        this.orders = data.orders;
        this.renderOrders(this.orders);
      }
    }catch(e){}
  }

  renderStats(){
    if(!this.stats) return;
    const $ = (id)=> document.getElementById(id);
    if($('productCount')) $('productCount').innerText = this.stats.totalProducts || this.allProducts.length || 0;
    if($('menuProdCount')) $('menuProdCount').innerText = this.allProducts.length || 0;
    if($('prodCountText')) $('prodCountText').innerText = `(${this.allProducts.length||0})`;
    if($('lowStockCount')) $('lowStockCount').innerText = this.stats.lowStockCount || this.lowStock.length || 0;
    if($('revenue')) $('revenue').innerText = `₹${this.stats.todayRevenue||this.stats.revenue||0}`;
    if($('orderCount')) $('orderCount').innerText = this.stats.todayOrders || this.stats.totalOrders || this.orders.length || 0;
    if($('shopNameHead')) $('shopNameHead').innerText = this.shopData.shopName || this.shopData.name || 'Kirana';
  }

  renderProducts(list){
    const c = document.getElementById('productList');
    if(!c) return;
    if(!list.length){
      c.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px"><div style="font-size:50px">🛒</div><h3 style="margin-top:10px;font-weight:900">No products yet</h3><p style="color:#94a3b8;font-size:13px;margin-top:6px">Click <b style="color:#10b981">Quick Add 100</b> to add 100 products in 1 sec<br><small style="font-size:11px">Uses /api/shops/kirana/:shopId + common inventory</small></p><button onclick="window.KiranaDashboardCore.goQuickAdd()" class="btn btn-green" style="margin:12px auto 0">Quick Add 100</button></div>`;
      return;
    }
    c.innerHTML = list.map(p=>`
      <div class="p-card" data-id="${p._id}">
        <img src="${p.image||`https://source.unsplash.com/400x300/?grocery,${encodeURIComponent(p.category||'kirana')}`}" loading="lazy" onerror="this.src='https://placehold.co/400x300/f8fafc/94a3b8?text=${encodeURIComponent((p.name||'Product').slice(0,12))}'">
        <div class="p-info">
          <b title="${p.name}">${p.name||'Unnamed'}</b>
          <div class="meta">${p.brand||''} ${p.brand?'•':''} ${p.weight||p.unit||''} • ${p.category||'general'}</div>
          <div class="price-row">
            <div class="price">₹${p.price||0}${p.mrp?`<del>₹${p.mrp}</del>`:''}</div>
            <div class="stock ${(p.stock||0) <= (p.lowStockLimit||10)? 'low' : 'ok'}">${p.stock||0} LEFT</div>
          </div>
          <div style="display:flex;gap:6px;margin-top:10px">
            <button onclick="window.KiranaDashboardCore.editProduct('${p._id}')" style="flex:1;background:#f1f5f9;border:1px solid #e2e8f0;padding:7px;border-radius:9px;font-weight:800;font-size:11px;cursor:pointer"><i class="fa-solid fa-pen"></i> Edit</button>
            <button onclick="window.KiranaDashboardCore.deleteProduct('${p._id}')" style="width:36px;background:#fff;border:1px solid #fee2e2;color:#ef4444;border-radius:9px;cursor:pointer"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>
    `).join('');
  }

  renderLowStock(list){
    const html =!list.length? `<div style="background:#f0fdf4;color:#15803d;padding:10px;border-radius:10px;font-weight:800;font-size:12px;text-align:center">✓ All Stock OK<br><small style="font-weight:600">Common: /api/common/inventory/:shopId/low-stock</small></div>` : list.slice(0,8).map(p=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-bottom:6px"><div><b style="font-size:12px">${p.name}</b><br><small style="color:#92400e;font-size:10px">${p.category}</small></div><span style="background:#92400e;color:#fff;padding:3px 7px;border-radius:20px;font-size:10px;font-weight:900">${p.stock}</span></div>`).join('');

    ['lowStock','lowStockRight','lowStockList'].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.innerHTML = html;
    });
  }

  renderOrders(orders){
    const html =!orders.length? `<div style="text-align:center;padding:16px;color:#94a3b8;font-size:12px"><div style="font-size:24px">📦</div>No live orders<br><small>Listening via SocketCore + /api/common/orders</small></div>` : orders.map(o=>`
      <div style="background:#fff;border:1px solid #f1f5f9;border-radius:12px;padding:10px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="window.KiranaDashboardCore.openOrder('${o._id||o.orderId}')">
        <div><b style="font-size:12px">#${(o.orderId||o._id||'').toString().slice(-6).toUpperCase()}</b><br><span style="font-size:10px;color:#64748b">${o.items?.length||1} items • ₹${o.total||0} • ${o.customerName||'Customer'}</span></div>
        <span style="background:${this.getStatusColor(o.status)};color:#fff;font-size:9px;font-weight:900;padding:4px 8px;border-radius:20px">${(o.status||'PLACED').toUpperCase()}</span>
      </div>
    `).join('');

    ['recentOrders','liveOrdersRight'].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.innerHTML = html;
    });
  }

  getStatusColor(status){
    const map = { placed:'#0ea5e9', confirmed:'#8b5cf6', preparing:'#f59e0b', out_for_delivery:'#10b981', delivered:'#059669', cancelled:'#ef4444' };
    return map[status] || '#64748b';
  }

  showLoader(show){
    const el = document.getElementById('loader') || document.getElementById('dashboardLoader');
    if(el) el.style.display = show? 'grid' : 'none';
  }

  showErrorInGrid(msg){
    const c = document.getElementById('productList');
    if(c) c.innerHTML = `<div style="grid-column:1/-1;padding:20px;color:#ef4444;background:#fef2f2;border:1px solid #fee2e2;border-radius:12px"><b>Error:</b> ${msg}<br><br><small>Check:<br>1. /api/shops/kirana/${this.shopId} route exists in server/routes/shops/kirana-route.js<br>2. /api/common/health - common/index.js mounted<br>3. MongoDB connected</small></div>`;
  }

  showErrorPage(title, message){
    document.body.innerHTML = `<div style="height:100vh;display:grid;place-items:center;font-family:Outfit;text-align:center;padding:20px;background:#f8fafc"><div style="background:#fff;padding:32px;border-radius:24px;box-shadow:0 20px 40px rgba(0,0,0,.08);max-width:380px"><div style="font-size:48px">⚠️</div><h2 style="font-weight:900;margin:12px 0">${title}</h2><p style="color:#64748b;font-size:13px">${message}</p><a href="/" style="display:block;margin-top:16px;background:#020617;color:#fff;padding:12px;border-radius:12px;text-decoration:none;font-weight:800">Go Home</a></div></div>`;
  }

  toast(msg){
    const t = document.getElementById('toast');
    if(!t) return;
    t.innerText = msg;
    t.style.display = 'block';
    setTimeout(()=> t.style.display='none', 3000);
  }

  playSound(){
    try{
      const audio = document.getElementById('newOrderSound') || new Audio('../common/orders/new-order-sound.mp3');
      audio.volume = 0.8;
      audio.play().catch(()=>{});
    }catch(e){}
  }

  vibrate(){
    if(navigator.vibrate) navigator.vibrate([100,50,100]);
  }

  // ACTIONS
  goProductForm(){ location.href=`./product-form.html?shopId=${this.shopId}`; }
  goQuickAdd(){ location.href=`./product-form.html?shopId=${this.shopId}&quick=1`; }
  editProduct(id){ location.href=`./product-form.html?shopId=${this.shopId}&editId=${id}`; }

  async deleteProduct(id){
    if(!confirm('Delete this product? This will also clear common inventory cache.')) return;
    try{
      const res = await window.ApiCore.delete(`/api/shops/kirana/${this.shopId}/item/${id}`);
      if(res.success){
        this.toast('Deleted ✅');
        window.ApiCore.clearCache(`/api/shops/kirana/${this.shopId}`);
        window.ApiCore.clearCache(`/api/common/inventory`);
        await this.loadDashboard();
      } else {
        throw new Error(res.message||'Delete failed');
      }
    }catch(e){
      window.ErrorHandler?.handleApiError(e, 'delete_product');
      this.toast('Delete failed: '+e.message);
    }
  }

  openOrder(orderId){
    window.open(`../common/orders/order-detail.html?shopId=${this.shopId}&orderId=${orderId}`, '_blank');
  }

  startAutoRefresh(){
    this.stopAutoRefresh();
    this.refreshInterval = setInterval(()=>{
      console.log('Kirana auto refresh - common orders + stats');
      this.loadOrders();
      this.loadStats();
    }, 30000);
  }

  stopAutoRefresh(){
    if(this.refreshInterval) clearInterval(this.refreshInterval);
  }

  // PUBLIC API FOR HTML INLINE CALLS
  filterProducts(q){
    const query = q.toLowerCase();
    this.renderProducts(this.allProducts.filter(p=> (p.name||'').toLowerCase().includes(query) || (p.category||'').toLowerCase().includes(query)));
  }
}

// GLOBAL INIT
window.KiranaDashboardCore = new KiranaDashboardCore();
window.kiranaDashboard = window.KiranaDashboardCore;

// GLOBAL HELPERS FOR OLD HTML onclick
window.deleteProduct = (id)=> window.KiranaDashboardCore.deleteProduct(id);
window.editProduct = (id)=> window.KiranaDashboardCore.editProduct(id);
window.filterProducts = ()=> {
  const q = document.getElementById('searchInput')?.value || '';
  window.KiranaDashboardCore.filterProducts(q);
};
window.goForm = ()=> window.KiranaDashboardCore.goProductForm();
window.goQuick = ()=> window.KiranaDashboardCore.goQuickAdd();
window.toggleShop = ()=> {
  const sw = document.getElementById('toggleSwitch');
  if(sw) sw.click();
};

// Listen for storage events
window.addEventListener('storage:cart', ()=> console.log('Cart updated via common StorageCore'));