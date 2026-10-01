// LOCATION: common/core/dashboard-core.js - WORLD CLASS DASHBOARD CORE
class DashboardCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || this.getShopIdFromPath() || '';
    this.shopData = null;
    this.stats = null;
    this.isLoading = false;
    this.refreshInterval = null;
    this.socket = null;

    // Cache keys
    this.CACHE_DURATION = 2 * 60 * 1000; // 2 mins

    this.init();
  }

  getShopIdFromPath(){
    // Try to get shopId from URL path like /shop/dashboard/:shopId
    const match = location.pathname.match(/\/dashboard\/([^\/]+)/);
    return match? match[1] : '';
  }

  async init(){
    if(!this.shopId){
      console.warn('DashboardCore: No shopId found');
      this.showShopIdError();
      return;
    }

    console.log(`DashboardCore init for shop: ${this.shopId}`);

    // Load initial data
    await this.loadDashboard();

    // Setup auto refresh every 30 sec
    this.startAutoRefresh();

    // Setup socket for live orders
    this.initSocket();

    // Bind UI events
    this.bindEvents();
  }

  showShopIdError(){
    const container = document.getElementById('dashboardRoot') || document.body;
    if(container && location.pathname.includes('dashboard')){
      container.innerHTML = `
        <div style="height:100vh;display:grid;place-items:center;font-family:Outfit,sans-serif;text-align:center;padding:20px">
          <div style="background:#fff;padding:32px;border-radius:24px;box-shadow:0 20px 40px rgba(0,0,0,.08)">
            <div style="font-size:48px">⚠️</div>
            <h2 style="font-weight:900;margin:12px 0">Shop ID Missing</h2>
            <p style="color:#64748b">Please open dashboard from My Shops</p>
            <a href="/profile.html" style="display:inline-block;margin-top:16px;background:#0f172a;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:800">My Shops</a>
          </div>
        </div>
      `;
    }
  }

  async loadDashboard(){
    if(this.isLoading) return;
    this.isLoading = true;

    this.showLoader();

    try{
      // Parallel loading for speed
      const [shopData, statsData] = await Promise.allSettled([
        this.fetchShopData(),
        this.fetchStats()
      ]);

      if(shopData.status === 'fulfilled'){
        this.shopData = shopData.value;
        this.renderShopInfo(this.shopData);
      }

      if(statsData.status === 'fulfilled'){
        this.stats = statsData.value;
        this.renderStats(this.stats);
      }

      // Load recent orders
      this.loadRecentOrders();

      // Load low stock
      this.loadLowStock();

      this.hideLoader();

    }catch(e){
      console.error('Dashboard load failed', e);
      this.showError(e.message);
      this.hideLoader();
    }finally{
      this.isLoading = false;
    }
  }

  async fetchShopData(){
    try{
      if(!window.ApiCore) throw new Error('ApiCore missing');

      // Try multiple endpoints
      let data;
      try{
        data = await window.ApiCore.get(`/api/shops/${this.shopId}`);
      }catch(e){
        data = await window.ApiCore.get(`/api/shops/dairy/${this.shopId}`);
      }

      return data.shop || data.data || data;
    }catch(e){
      console.error('Fetch shop failed', e);
      // Return mock for dev
      return {
        shopId: this.shopId,
        shopName: 'My Shop',
        name: 'My Shop',
        products: [],
        stats: { todayOrders: 0, todayRevenue: 0, lowStock: 0 }
      };
    }
  }

  async fetchStats(){
    try{
      const data = await window.ApiCore.get(`/api/common/analytics/${this.shopId}/stats`);
      return data.stats || data;
    }catch(e){
      return {
        todayOrders: 0,
        todayRevenue: 0,
        totalProducts: 0,
        lowStock: 0,
        monthlyRevenue: 0
      };
    }
  }

  async loadRecentOrders(){
    const container = document.getElementById('recentOrders') || document.getElementById('liveOrdersList');
    if(!container) return;

    try{
      const data = await window.ApiCore.get(`/api/common/orders/${this.shopId}?limit=5`);
      const orders = data.orders || [];

      if(orders.length === 0){
        container.innerHTML = `<div style="text-align:center;padding:20px;color:#94a3b8;font-size:13px">No recent orders</div>`;
        return;
      }

      container.innerHTML = orders.map(o=>`
        <div style="background:#fff;border:1px solid #f1f5f9;border-radius:12px;padding:12px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div><b style="font-size:13px">#${o.orderId||o._id}</b><br><span style="font-size:11px;color:#64748b">${o.items?.length||1} items • ₹${o.total||0}</span></div>
          <span style="background:${this.getStatusColor(o.status)};color:#fff;font-size:10px;font-weight:900;padding:4px 8px;border-radius:20px">${(o.status||'PLACED').toUpperCase()}</span>
        </div>
      `).join('');

    }catch(e){
      console.error('Recent orders failed', e);
    }
  }

  async loadLowStock(){
    const container = document.getElementById('lowStockList');
    if(!container) return;

    try{
      const data = await window.ApiCore.get(`/api/common/inventory/${this.shopId}/low-stock`);
      const products = data.products || [];

      if(products.length === 0){
        container.innerHTML = `<div style="text-align:center;padding:16px;color:#10b981;font-weight:800;font-size:13px">✅ All stocks OK</div>`;
        return;
      }

      container.innerHTML = products.slice(0,5).map(p=>`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f8fafc">
          <span style="font-size:13px;font-weight:600">${p.name}</span>
          <span style="background:#fee2e2;color:#991b1b;font-size:11px;font-weight:900;padding:2px 6px;border-radius:6px">${p.stock||0} left</span>
        </div>
      `).join('');

    }catch(e){}
  }

  getStatusColor(status){
    const map = {
      placed:'#0ea5e9', confirmed:'#8b5cf6', preparing:'#f59e0b',
      out_for_delivery:'#10b981', delivered:'#059669', cancelled:'#ef4444'
    };
    return map[status] || '#64748b';
  }

  renderShopInfo(shop){
    const nameEls = document.querySelectorAll('#shopName, [data-shop-name]');
    nameEls.forEach(el=> el.innerText = shop.shopName || shop.name || 'My Shop');

    const logoEls = document.querySelectorAll('#shopLogo, [data-shop-logo]');
    logoEls.forEach(el=> { if(shop.logo) el.src = shop.logo; });

    // Update page title
    if(shop.shopName) document.title = `${shop.shopName} - Dashboard`;
  }

  renderStats(stats){
    // Update all stats elements
    const mappings = {
      todayOrders: ['todayOrders', 'today-orders', 'ordersToday'],
      todayRevenue: ['todayRevenue', 'today-revenue', 'revenueToday'],
      totalProducts: ['totalProducts', 'total-products', 'productsCount'],
      lowStock: ['lowStock', 'low-stock']
    };

    Object.entries(mappings).forEach(([key, ids])=>{
      ids.forEach(id=>{
        const el = document.getElementById(id) || document.querySelector(`[data-stat="${key}"]`);
        if(el){
          const value = stats[key] || 0;
          el.innerText = key.includes('Revenue')? `₹${value}` : value;
        }
      });
    });
  }

  showLoader(){
    const loader = document.getElementById('dashboardLoader');
    if(loader) loader.style.display = 'grid';
    if(window.Loader) window.Loader.show();
  }

  hideLoader(){
    const loader = document.getElementById('dashboardLoader');
    if(loader) loader.style.display = 'none';
    if(window.Loader) window.Loader.hide();
  }

  showError(msg){
    const container = document.getElementById('dashboardError');
    if(container){
      container.style.display = 'block';
      container.innerText = msg;
    }
    if(window.Toast) window.Toast.show(msg, 'error');
  }

  startAutoRefresh(){
    this.stopAutoRefresh();
    this.refreshInterval = setInterval(()=> {
      console.log('Auto refreshing dashboard...');
      this.loadRecentOrders();
      this.fetchStats().then(s=> this.renderStats(s));
    }, 30000); // 30 sec
  }

  stopAutoRefresh(){
    if(this.refreshInterval) clearInterval(this.refreshInterval);
  }

  initSocket(){
    try{
      if(typeof io === 'undefined') return;

      this.socket = io('', { query:{ shopId: this.shopId } });

      this.socket.on('new-order', (order)=>{
        console.log('New order received', order);
        if(window.Toast) window.Toast.show(`New order #${order.orderId} - ₹${order.total}`, 'success');

        // Play sound
        const audio = document.getElementById('newOrderSound') || new Audio('/shop-templates/common/orders/new-order-sound.mp3');
        audio.play().catch(()=>{});

        // Show popup
        this.showNewOrderPopup(order);

        // Refresh
        this.loadRecentOrders();
      });

      this.socket.on('connect', ()=> console.log('Socket connected for shop', this.shopId));
    }catch(e){
      console.warn('Socket init failed', e);
    }
  }

  showNewOrderPopup(order){
    if(document.getElementById('newOrderPopup')) return;

    const popup = document.createElement('div');
    popup.id = 'newOrderPopup';
    popup.style.cssText = `position:fixed;top:16px;right:16px;left:16px;max-width:400px;margin:auto;background:#0f172a;color:#fff;padding:16px;border-radius:16px;z-index:9999;box-shadow:0 20px 40px rgba(0,0,0,.3);animation:slideDown.4s;font-family:Outfit,sans-serif`;
    popup.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-weight:900">🔔 New Order!</b><button onclick="this.parentElement.parentElement.remove()" style="background:#1e293b;border:none;color:#fff;width:24px;height:24px;border-radius:50%">✕</button></div>
      <div style="margin-top:8px;font-size:13px">Order #${order.orderId} • ₹${order.total} • ${order.items?.length||1} items</div>
      <button onclick="window.location.href='/shop-templates/common/orders/order-detail.html?shopId=${this.shopId}&orderId=${order.orderId}'" style="margin-top:12px;width:100%;background:#fff;color:#0f172a;border:none;padding:10px;border-radius:10px;font-weight:900">View Order</button>
      <style>@keyframes slideDown{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}</style>
    `;
    document.body.appendChild(popup);
    setTimeout(()=> popup.remove(), 8000);
  }

  bindEvents(){
    // Refresh button
    document.getElementById('refreshDashboard')?.addEventListener('click', ()=> this.loadDashboard());

    // Shop toggle
    document.getElementById('shopToggle')?.addEventListener('change', async (e)=>{
      try{
        await window.ApiCore.post(`/api/common/shop-toggle/${this.shopId}`, { isOpen: e.target.checked });
        window.Toast?.show(e.target.checked? 'Shop opened ✅' : 'Shop closed', 'success');
      }catch(err){
        window.Toast?.show('Failed to update shop status', 'error');
      }
    });
  }

  // Public methods
  refresh(){ return this.loadDashboard(); }
  getShopId(){ return this.shopId; }
  getShopData(){ return this.shopData; }
}

window.DashboardCore = new DashboardCore();