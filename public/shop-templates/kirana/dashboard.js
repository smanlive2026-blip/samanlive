// LOCATION: public/shop-templates/kirana/dashboard.js - V17 FINAL WORLD BOSS + V13 HIERARCHY MASTER - 1300 LINES
// Uses: common/core/*, common/products/product-manager.js V15 Class, common/js/shop-toggle.js, common/js/share.js, common/cart/cart-core.js, role-hierarchy.js, dashboard-core.js

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
    this.wallet = { balance:0, totalEarning:0 };

    this.API_WORLD = `/api/world-products?shopId=${this.shopId}&shopType=kirana`;
    this.API_WORLD_BASE = `/api/world-products`;
    this.API_OLD = `/api/shops/kirana/${this.shopId}`;
    this.API_COMMON = {
      analytics: `/api/common/analytics/${this.shopId}/stats`,
      lowStock: `/api/common/inventory/${this.shopId}/low-stock`,
      orders: `/api/common/orders/${this.shopId}?limit=20`,
      finance: `/api/common/finance/${this.shopId}/summary`,
      wallet: `/api/common/wallet/${this.shopId}`,
      walletBalance: `/api/common/wallet/balance?userId=${this.shopId}&role=shop_owner&shopId=${this.shopId}`,
      walletTx: `/api/common/wallet/transactions?userId=${this.shopId}&role=shop_owner&limit=20`,
      reviews: `/api/common/reviews/${this.shopId}`,
      staff: `/api/common/staff/${this.shopId}`,
      coupons: `/api/common/marketing/${this.shopId}/coupons`,
      health: `/api/common/health`,
      toggle: `/api/common/shop-toggle/${this.shopId}`,
      shopToggle: `/api/shops/kirana/${this.shopId}/settings`
    };

    this.init();
  }

  async init(){
    console.log(`🛒 KiranaDashboardCore V17 - shopId:${this.shopId} - WorldProductManager:`,!!window.WorldProductManager, 'RoleHierarchy:',!!window.RoleHierarchy);

    if(!this.shopId){
      this.showErrorPage('Shop ID Missing','Dashboard open karo My Shops se - URL me?shopId=YOUR_ID chahiye');
      return;
    }

    localStorage.setItem('last_shopId', this.shopId);
    localStorage.setItem('shopType','kirana');
    localStorage.setItem('role','dashboard');
    window.shopId = this.shopId;
    window.shopType = 'kirana';
    window.MY_SHOP_ID = this.shopId;
    window.USER_ROLE = 'shop_owner';

    if(window.AuthCore){
      try{
        const ok = await window.AuthCore.protectDashboard();
        if(!ok) return;
      }catch(e){ console.warn('AuthCore protect failed', e); }
    }

    this.bindUI();
    this.bindTabs();
    this.bindSearch();
    this.bindTogglesCommon();
    this.bindSocketCommon();
    this.bindShareCommon();

    await this.loadDashboard();
    await this.loadWallet();
    await this.loadAdminProducts();

    this.startAutoRefresh();
    this.loadCommonStatus();
    this.loadWorldStatus();
  }

  bindUI(){
    const $ = (id)=> document.getElementById(id);
    $('newProductBtn')?.addEventListener('click', ()=> this.goProductForm());
    $('quickAddBtn')?.addEventListener('click', ()=> this.goQuickAdd());
    $('btnLogout')?.addEventListener('click', ()=> this.logoutCommon());
    const btnMenu = $('btnMenu');
    if(btnMenu){
      const newBtn = btnMenu.cloneNode(true);
      btnMenu.parentNode.replaceChild(newBtn, btnMenu);
      const toggleSidebar = (e)=>{
        if(e){ e.preventDefault(); e.stopPropagation(); }
        document.getElementById('sidebar')?.classList.toggle('open');
        document.getElementById('sidebarOverlay')?.classList.toggle('show');
      };
      newBtn.addEventListener('click', toggleSidebar);
      newBtn.addEventListener('touchend', toggleSidebar, {passive:false});
    }
    $('viewShopBtn')?.addEventListener('click', ()=> this.viewShopCommon());
    $('openCommonOrders')?.addEventListener('click', (e)=>{
      e.preventDefault();
      window.open(`../common/orders/orders.html?shopId=${this.shopId}&shopType=kirana&role=shop_owner`,'_blank');
    });
    if($('shopIdDisplay')){
      $('shopIdDisplay').innerText = this.shopId.slice(0,18)+'...';
      $('shopIdDisplay').title = this.shopId;
    }
  }

  logoutCommon(){
    if(window.AuthCore?.logout){ window.AuthCore.logout(); }
    else{ localStorage.clear(); location.href='/'; }
  }

  viewShopCommon(){
    window.open(`./user-view.html?shopId=${this.shopId}&shopType=kirana&supplierId=${this.shopId}&supplierRole=shop_owner`,'_blank');
  }

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
        await this.loadCommonTab(tab);
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
        box.innerHTML = `<div style="padding:12px;color:#64748b;font-size:12px"><i class="fa-solid fa-spinner fa-spin"></i> Loading common/${tab}...</div>`;
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
              box.innerHTML = `<div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px;border-radius:12px"><pre style="font-size:11px;white-space:pre-wrap;max-height:300px;overflow:auto">${JSON.stringify(data,null,2).slice(0,4000)}</pre></div>`;
              box.dataset.loaded='true';
            }
          }
        }catch(e){
          if(box) box.innerHTML = `<div style="color:#ef4444;font-size:12px">Failed common/${tab}: ${e.message}</div>`;
        }
      }
    }
    const iframeMap = {
      products: { id:'inventoryFrame', src:`../common/inventory/inventory.html?shopId=${this.shopId}&shopType=kirana` },
      orders: { id:'ordersFrame', src:`../common/orders/orders.html?shopId=${this.shopId}&shopType=kirana&role=shop_owner` },
      orders_full: { id:'ordersFullFrame', src:`../common/orders/orders.html?shopId=${this.shopId}&shopType=kirana&role=shop_owner` },
      analytics: { id:'analyticsFrame', src:`../common/analytics/analytics.html?shopId=${this.shopId}&shopType=kirana` },
      reviews: { id:'reviewsFrame', src:`../common/reviews/reviews.html?shopId=${this.shopId}&shopType=kirana` }
    };
    const f = iframeMap[tab];
    if(f){
      const el = document.getElementById(f.id);
      if(el &&!el.src) el.src = f.src;
    }
    if(tab==='bulk_buy'){ this.loadAdminProducts(); }
    if(tab==='finance'){ this.loadWallet(); }
  }

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

  bindTogglesCommon(){
    const toggles = ['toggleSwitch','toggleSwitch2'];
    toggles.forEach(id=>{
      const el = document.getElementById(id);
      if(!el) return;
      el.addEventListener('click', async ()=>{
        if(window.ShopToggleCore?.toggle){
          try{
            const newState = await window.ShopToggleCore.toggle(this.shopId);
            this.updateToggleUI(newState);
            this.toast(newState?'Shop Opened ✅ via common/shop-toggle.js':'Shop Closed 🔴');
            return;
          }catch(e){ console.warn('ShopToggleCore failed', e); }
        }
        const isOpen =!el.classList.contains('on');
        this.updateToggleUI(isOpen);
        try{
          await window.ApiCore?.put(this.API_COMMON.shopToggle, { isOpen }).catch(()=>{});
          await window.ApiCore?.post(this.API_COMMON.toggle, { isOpen }).catch(()=>{});
          window.SocketCore?.emit('shop-status-changed', { shopId:this.shopId, shopType:'kirana', isOpen });
          if(window.shopSocket) window.shopSocket.emit('shop-status-changed', { shopId:this.shopId, isOpen });
          if(window.DashboardCore) window.DashboardCore.emitShopStatus(isOpen);
          this.toast(isOpen?'Shop Opened ✅':'Shop Closed 🔴');
        }catch(e){
          window.ErrorHandler?.handleApiError(e,'toggle_shop_common');
          this.toast('Toggle failed');
          this.updateToggleUI(!isOpen);
        }
      });
    });
  }

  updateToggleUI(isOpen){
    document.querySelectorAll('.switch').forEach(s=> s.className='switch '+(isOpen?'on':''));
    document.querySelectorAll('[id^=toggleText]').forEach(t=> t.innerText=isOpen?'Open':'Closed');
  }

  bindSocketCommon(){
    // Hierarchy DashboardCore socket
    if(window.DashboardCore && window.DashboardCore.initSocket){
      setTimeout(()=> window.DashboardCore.initSocket(), 500);
    }
    if(!window.SocketCore){
      console.warn('SocketCore not loaded');
      return;
    }
    window.SocketCore.on('new-order', (order)=>{
      if(order.shopId && order.shopId!==this.shopId) return;
      this.handleNewOrder(order);
    });
    window.SocketCore.on('order-updated', (data)=>{
      if(data.shopId===this.shopId) this.loadOrdersCommon();
    });
    window.SocketCore.on('product-updated', (data)=>{
      if(data.shopId===this.shopId){ this.loadDashboard(); }
    });
    window.SocketCore.on('shop-status-changed', (data)=>{
      if(data.shopId===this.shopId){ this.updateToggleUI(data.isOpen); }
    });
    // Direct socket
    if(window.shopSocket){
      window.shopSocket.on('new-order', (o)=> this.handleNewOrder(o));
    }
  }

  handleNewOrder(order){
    this.toast(`🔔 New Order #${(order.orderId||'').toString().slice(-6)} - ₹${order.totalAmount||order.total||0} - ${order.buyerRole||'customer'}`);
    this.playSoundCommon();
    this.vibrateCommon();
    // Badge
    const badge = document.getElementById('newOrderBadge');
    if(badge) badge.style.display='inline-block';
    const countBadge = document.getElementById('newOrderCount');
    if(countBadge){
      countBadge.style.display='inline-block';
      const c = parseInt(countBadge.textContent||'0')+1;
      countBadge.textContent = c>9? '9+' : c;
    }
    const badgeRight = document.getElementById('liveOrderBadgeRight');
    if(badgeRight){
      badgeRight.style.display='inline-block';
      badgeRight.textContent = countBadge? countBadge.textContent : 'NEW';
    }
    if(window.DashboardCore && window.DashboardCore.showNewOrderPopup) window.DashboardCore.showNewOrderPopup(order);
    this.orders.unshift(order);
    this.renderOrders(this.orders.slice(0,15));
    this.loadStatsCommon();
    this.loadWallet();
  }

  bindShareCommon(){
    if(window.ShareCore){ console.log('✅ ShareCore connected'); }
  }

  // ==================== WALLET - HIERARCHY NEW ====================
  async loadWallet(){
    try {
      const res = await fetch(this.API_COMMON.walletBalance).then(r=>r.json()).catch(()=>({balance:0}));
      this.wallet = res.wallet || res || { balance:0, totalEarning:0 };
      const $ = (id)=> document.getElementById(id);
      if($('walletBalance')) $('walletBalance').textContent = `₹${this.wallet.balance||0}`;
      if($('totalEarning')) $('totalEarning').textContent = `₹${this.wallet.totalEarning||0}`;
      if($('revenue')) $('revenue').textContent = `₹${this.wallet.totalEarning||0}`;
      if($('headerWallet')) $('headerWallet').textContent = `₹${this.wallet.balance||0}`;
      if($('headerEarning')) $('headerEarning').textContent = `₹${this.wallet.totalEarning||0}`;
      if($('sidebarWallet')) $('sidebarWallet').textContent = `₹${this.wallet.balance||0}`;
      if($('financeWalletBalance')) $('financeWalletBalance').textContent = `₹${this.wallet.balance||0}`;
      if($('financeTotalEarning')) $('financeTotalEarning').textContent = `₹${this.wallet.totalEarning||0}`;

      const txRes = await fetch(this.API_COMMON.walletTx).then(r=>r.json()).catch(()=>({transactions:[]}));
      const txEl = document.getElementById('walletTx');
      if(txEl){
        const tx = txRes.transactions || [];
        if(!tx.length) txEl.innerHTML = '<p style="opacity:0.6;font-size:11px">No transactions yet - Order aane pe earning dikhegi</p>';
        else txEl.innerHTML = tx.map(t=> `
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee;font-size:11px">
            <span>${t.type==='credit'? '🟢' : '🔴'} ${t.description||t.type}<br><small style="color:#94a3b8">${new Date(t.createdAt).toLocaleDateString()}</small></span>
            <span style="font-weight:800;color:${t.type==='credit'? '#10b981' : '#ef4444'}">${t.type==='credit'? '+' : '-'}₹${t.amount}<br><small>Bal: ₹${t.balanceAfter||0}</small></span>
          </div>
        `).join('');
      }
    } catch(e){ console.log('Wallet load fail', e.message); }
  }

  // ==================== BULK BUY FROM ADMIN/AREA - HIERARCHY NEW ====================
  async loadAdminProducts(){
    const container = document.getElementById('adminProductsForShopOwner');
    if(!container) return;
    container.innerHTML = '<p style="font-size:12px;opacity:0.6">Loading admin/area_manager products for hierarchy...</p>';
    try {
      const res = await fetch(`/api/world-products?role=shop_owner&shopId=${this.shopId}`).then(r=>r.json()).catch(()=>({data:[]}));
      let products = res.data || res.products || [];
      let allowed = products.filter(p=> ['admin','area_manager'].includes(p.ownerRole || p.supplierRole || p.shopOwnerRole || ''));
      if(allowed.length===0){
        const res2 = await fetch(`/api/world-products?role=admin`).then(r=>r.json()).catch(()=>({data:[]}));
        allowed = (res2.data||[]).slice(0,12).map(p=> ({...p, ownerRole:p.ownerRole||'admin', ownerId:p.ownerId||'admin_default', shopId:p.shopId||'admin_shop'}));
      }
      if(!allowed.length){ container.innerHTML='<p style="font-size:12px;color:#888">No admin/area products. Admin se stock lo.</p>'; return; }
      container.innerHTML = allowed.map(p=> `
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:12px">
          <img src="${p.thumbnail||p.image||'https://placehold.co/200x120/e2e8f0/0f172a?text=Kirana'}" style="width:100%;height:90px;object-fit:cover;border-radius:8px">
          <div style="font-weight:800;font-size:13px;margin-top:8px">${(p.name||'Product').slice(0,35)}</div>
          <div style="font-size:11px;color:#64748b">₹${p.price} • ${p.ownerRole||'admin'}</div>
          <button onclick='window.KiranaDashboardCore.buyFromHierarchy(${JSON.stringify(p).replace(/'/g,"&#39;")})' style="width:100%;margin-top:8px;padding:8px;background:#0f172a;color:#fff;border:0;border-radius:8px;font-size:12px;font-weight:800">Buy Bulk x10</button>
        </div>
      `).join('');
    } catch(e){ container.innerHTML = `<p style="color:red;font-size:12px">${e.message}</p>`; }
  }

  async buyFromHierarchy(product){
    if(!window.CartCore){ alert('CartCore not loaded'); return; }
    product.ownerRole = product.ownerRole || product.supplierRole || 'admin';
    product.ownerId = product.ownerId || product.shopId || 'admin_default';
    product.shopId = product.shopId || product.ownerId;
    const ok = await window.CartCore.add(product, 10);
    if(ok){
      this.toast(`Added ${product.name} x10 to cart - Hierarchy`);
      if(confirm(`Added ${product.name} x10. Checkout par jana hai? Wallet se pay hoga.`)){
        location.href = `../common/checkout/checkout.html?shopId=${this.shopId}&supplierId=${product.ownerId}&supplierRole=${product.ownerRole}&shopType=kirana&supplierName=${encodeURIComponent(product.ownerRole)}`;
      }
    }
  }

  async loadDashboard(){
    if(this.isLoading) return;
    this.isLoading=true;
    this.showLoader(true);
    try{
      const results = await Promise.allSettled([
        window.ApiCore?.get(`/api/shops/kirana/${this.shopId}`).catch(()=>({shop:{products:[]}})) || fetch(this.API_OLD).then(r=>r.json()).catch(()=>({shop:{products:[]}})),
        window.WorldProductManager? window.WorldProductManager.getProducts({shopType:'kirana', shopId:this.shopId, role:'dashboard'}) : fetch(this.API_WORLD).then(r=>r.json()).then(d=>d.data||[]),
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
        todayRevenue: analyticsRes?.todayRevenue || this.wallet.totalEarning || 0
      };

      this.renderStats();
      this.renderProducts(this.filteredProducts);
      this.renderLowStock(this.lowStock);
      this.renderOrders(this.orders);

      if(window.DashboardCore){
        window.DashboardCore.shopId=this.shopId;
        window.DashboardCore.shopData=this.shopData;
        window.DashboardCore.stats=this.stats;
        window.DashboardCore.worldProducts=this.worldProducts;
      }
      if(window.StorageCore){ window.StorageCore.cacheShopData(this.shopData, 5*60*1000); }

      console.log(`✅ V17 Loaded - World:${this.worldProducts.length} Old:${this.oldProducts.length} Total:${this.allProducts.length} Wallet:₹${this.wallet.balance}`);

    }catch(e){
      console.error('loadDashboard V17 failed', e);
      window.ErrorHandler?.handleApiError(e,'kirana_dashboard_v17');
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
        el.innerHTML=`✅ Common + Hierarchy Connected<br>Wallet: ₹${this.wallet.balance||0} • Role: shop_owner → area_manager, admin`;
      }
    }catch(e){}
  }

  async loadWorldStatus(){
    const el=document.getElementById('commonStatus'); if(!el) return;
    try{
      const count = this.worldProducts.length;
      const role = window.WorldProductManager?.role||'dashboard';
      el.innerHTML=`✅ WORLD BOSS + HIERARCHY V17<br><b style="color:#10b981">World: ${count} products</b> • Old: ${this.oldProducts.length} = Total ${this.allProducts.length}<br><small>Role: shop_owner → [area_manager, admin] • Wallet: ₹${this.wallet.balance||0}</small><br><div style="margin-top:6px;background:#1e293b;padding:6px;border-radius:8px;font-size:10px">Toggle: common/js/shop-toggle.js + Socket: dashboard-core.js + Cart: cart-core.js ✅</div>`;
    }catch(e){}
  }

  async loadStatsCommon(){
    try{
      const s = await window.ApiCore?.get(this.API_COMMON.analytics);
      if(s){
        const $=(id)=>document.getElementById(id);
        if($('revenue')) $('revenue').innerText=`₹${s.todayRevenue||this.wallet.totalEarning||0}`;
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

  renderStats(){
    const $=(id)=>document.getElementById(id);
    if($('productCount')) $('productCount').innerText=this.stats.totalProducts||this.allProducts.length||0;
    if($('menuProdCount')) $('menuProdCount').innerText=this.allProducts.length||0;
    if($('prodCountText')) $('prodCountText').innerText=`(${this.allProducts.length}) W:${this.worldProducts.length} O:${this.oldProducts.length}`;
    if($('lowStockCount')) $('lowStockCount').innerText=this.stats.lowStockCount||this.lowStock.length||0;
    if($('revenue')) $('revenue').innerText=`₹${this.stats.todayRevenue||this.stats.revenue||this.wallet.totalEarning||0}`;
    if($('orderCount')) $('orderCount').innerText=this.stats.todayOrders||this.orders.length||0;
    if($('shopNameHead')) $('shopNameHead').innerText=this.shopData.shopName||this.shopData.name||'Kirana World - V17 Hierarchy';
  }

  renderProducts(list){
    const c=document.getElementById('productList'); if(!c) return;
    if(!list.length){
      c.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:60px 20px"><div style="font-size:48px">🛒</div><h3 style="font-weight:900;margin-top:10px">No products</h3><p style="color:#94a3b8;font-size:13px;margin-top:6px">Click <b style="color:#10b981">Quick 100</b> - kirana.seed.js se 100 products</p><button onclick="window.KiranaDashboardCore.goQuickAdd()" class="btn btn-green" style="margin:12px auto 0">Quick Add 100</button></div>`;
      return;
    }
    c.innerHTML=list.map(p=>`
      <div class="p-card" data-id="${p._id}">
        <img src="${p.thumbnail || p.images?.[0]?.url || p.image || `https://source.unsplash.com/400x300/?grocery,${encodeURIComponent(p.category||'kirana')}`}" loading="lazy" onerror="this.src='https://placehold.co/400x300/f8fafc/94a3b8?text=${encodeURIComponent((p.name||'Product').slice(0,12))}'" style="width:100%;height:140px;object-fit:cover">
        <div style="padding:10px">
          <b style="font-size:13px" title="${p.name}">${(p.name||'').slice(0,28)}</b>
          <div style="font-size:10px;color:#64748b;margin-top:2px">${p.brand||p.extraData?.brand||''} ${p.brand?'•':''} ${p.weight||p.extraData?.weight||p.unit||''}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
            <div style="font-weight:900">₹${p.price||0}<del style="color:#94a3b8;font-size:10px;margin-left:4px">₹${p.mrp||p.price||0}</del></div>
            <div style="font-size:10px;font-weight:800;padding:3px 6px;border-radius:20px;background:${(p.stock||0)<=10?'#fee2e2;color:#ef4444':'#dcfce7;color:#15803d'}">${p.stock||0} LEFT</div>
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
    const html=!list.length?`<div style="background:#f0fdf4;color:#15803d;padding:10px;border-radius:10px;font-weight:800;font-size:12px;text-align:center">✓ All Stock OK</div>`:list.slice(0,10).map(p=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-bottom:6px"><div><b style="font-size:12px">${p.name}</b><br><small style="color:#92400e;font-size:10px">${p.shopType||p.category} • ${p.weight||''}</small></div><span style="background:#92400e;color:#fff;padding:3px 7px;border-radius:20px;font-size:10px;font-weight:900">${p.stock}</span></div>`).join('');
    ['lowStock','lowStockRight','lowStockList'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=html; });
  }

  renderOrders(orders){
    const html=!orders.length?`<div style="text-align:center;padding:16px;color:#94a3b8;font-size:12px"><div style="font-size:24px">📦</div>No live orders<br><small>Customer order karega toh yaha 🔔 bajega + Wallet + Socket</small></div>`:orders.map(o=>`<div style="background:#fff;border:1px solid #f1f5f9;border-radius:12px;padding:10px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="window.KiranaDashboardCore.openOrder('${o._id||o.orderId}')"><div><b style="font-size:12px">#${(o.orderId||o._id||'').toString().slice(-6).toUpperCase()}</b><br><span style="font-size:10px;color:#64748b">${o.items?.length||1} items • ₹${o.totalAmount||o.total||0} • ${o.buyerRole||'Customer'} • Earn: ₹${o.supplierEarning||''}</span></div><span style="background:${this.getStatusColor(o.status)};color:#fff;font-size:9px;font-weight:900;padding:4px 8px;border-radius:20px">${(o.status||'PLACED').toUpperCase()}</span></div>`).join('');
    ['recentOrders','liveOrdersRight'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=html; });
  }

  getStatusColor(status){ const map={placed:'#0ea5e9',confirmed:'#8b5cf6',preparing:'#f59e0b',out_for_delivery:'#10b981',delivered:'#059669',cancelled:'#ef4444'}; return map[status]||'#64748b'; }
  showLoader(show){ const el=document.getElementById('loader'); if(el) el.style.display=show?'grid':'none'; }
  showErrorInGrid(msg){ const c=document.getElementById('productList'); if(c) c.innerHTML=`<div style="grid-column:1/-1;padding:20px;color:#ef4444;background:#fef2f2;border:1px solid #fee2e2;border-radius:12px"><b>Error:</b> ${msg}</div>`; }
  showErrorPage(title,message){ document.body.innerHTML=`<div style="height:100vh;display:grid;place-items:center;font-family:Outfit;text-align:center;padding:20px;background:#f8fafc"><div style="background:#fff;padding:32px;border-radius:24px;box-shadow:0 20px 40px rgba(0,0,0,.08);max-width:400px"><div style="font-size:48px">⚠️</div><h2 style="font-weight:900;margin:12px 0">${title}</h2><p style="color:#64748b;font-size:13px">${message}</p><a href="/" style="display:block;margin-top:16px;background:#0f172a;color:#fff;padding:12px;border-radius:12px;text-decoration:none;font-weight:800">Go Home</a></div></div>`; }
  toast(msg){ const t=document.getElementById('toast'); if(!t) return; t.innerText=msg; t.style.display='block'; setTimeout(()=>t.style.display='none',3000); }
  playSoundCommon(){ try{ const audio=document.getElementById('newOrderSound') || new Audio('../common/orders/new-order-sound.mp3'); audio.volume=0.8; audio.play().catch(()=>{});}catch(e){} }
  vibrateCommon(){ if(navigator.vibrate) navigator.vibrate([100,50,100]); }

  goProductForm(){ location.href=`../common/products/product-form.html?shopType=kirana&shopId=${this.shopId}&type=kirana`; }
  goQuickAdd(){ location.href=`../common/products/product-form.html?shopType=kirana&shopId=${this.shopId}&type=kirana&quick=1`; }
  editProduct(id){ location.href=`../common/products/product-form.html?shopType=kirana&shopId=${this.shopId}&type=kirana&editId=${id}`; }

  async deleteProduct(id){
    if(!confirm('Delete? World Model se delete hoga - Dashboard + User-View sab se gayab')) return;
    try{
      let res;
      if(window.WorldProductManager?.deleteProduct){ res = await window.WorldProductManager.deleteProduct(id); }
      else{ res = await fetch(`${this.API_WORLD_BASE}/${id}`,{method:'DELETE',headers:{'Authorization':'Bearer '+(localStorage.getItem('token')||'')}}).then(r=>r.json()); }
      if(!res.success){
        const oldRes = await window.ApiCore?.delete(`/api/shops/kirana/${this.shopId}/item/${id}`).catch(()=>({success:false}));
        if(!oldRes.success) throw new Error(res.message||'Delete failed');
      }
      this.toast('Deleted ✅ World Model');
      window.ApiCore?.clearCache(this.API_WORLD);
      await this.loadDashboard();
    }catch(e){
      window.ErrorHandler?.handleApiError(e,'delete_product_v17');
      this.toast('Delete failed: '+e.message);
    }
  }

  openOrder(orderId){ window.open(`../common/orders/order-detail.html?shopId=${this.shopId}&orderId=${orderId}&shopType=kirana&role=shop_owner`,'_blank'); }
  startAutoRefresh(){ this.stopAutoRefresh(); this.refreshInterval=setInterval(()=>{ this.loadOrdersCommon(); this.loadStatsCommon(); this.loadWallet(); },30000); }
  stopAutoRefresh(){ if(this.refreshInterval) clearInterval(this.refreshInterval); }
}

window.KiranaDashboardCore = new KiranaDashboardCore();
window.kiranaDashboard = window.KiranaDashboardCore;
window.deleteProduct = (id)=> window.KiranaDashboardCore.deleteProduct(id);
window.editProduct = (id)=> window.KiranaDashboardCore.editProduct(id);
window.goForm = ()=> window.KiranaDashboardCore.goProductForm();
window.goQuick = ()=> window.KiranaDashboardCore.goQuickAdd();
window.toggleShop = ()=> { const sw=document.getElementById('toggleSwitch'); if(sw) sw.click(); };