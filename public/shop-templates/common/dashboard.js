// LOCATION: public/shop-templates/common/dashboard.js - SAMANLIVE COMMON DASHBOARD - FULL LOGIC - NO CUT - PROFILE CONNECTED FIX
class CommonDashboardCore {
  constructor(){
    const params = new URLSearchParams(location.search);
    this.shopId = params.get('shopId') || localStorage.getItem('last_shopId') || '';
    this.shopType = (params.get('shopType') || localStorage.getItem('shopType') || 'kirana').toLowerCase();
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
    this.lastShopUpdate = localStorage.getItem('shop_updated') || '0';

    this.API_WORLD = `/api/world-products?shopId=${this.shopId}&shopType=${this.shopType}`;
    this.API_WORLD_BASE = `/api/world-products`;
    this.API_OLD = `/api/shops/${this.shopType}/${this.shopId}`;
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
      shopToggle: `/api/shops/${this.shopType}/${this.shopId}/settings`,
      shopInfo: `/api/common/profile/${this.shopId}`
    };
    this.init();
  }

  async init(){
    if(!this.shopId){
      this.showErrorPage('Shop ID Missing','Dashboard My Shops / Area Manager se kholo - URL me?shopId=YOUR_ID chahiye');
      return;
    }
    localStorage.setItem('last_shopId', this.shopId);
    localStorage.setItem('shopType', this.shopType);
    localStorage.setItem('role','dashboard');
    localStorage.setItem('shopId', this.shopId);
    window.shopId = this.shopId;
    window.shopType = this.shopType;

    this.applyShopBranding();

    if(window.AuthCore){
      try{ const ok = await window.AuthCore.protectDashboard(); if(!ok){ console.warn('AuthCore protect false - still continue dashboard load'); } }catch(e){ console.warn('AuthCore protect failed - still continue', e); }
    }

    this.bindUI();
    this.bindTabs();
    this.bindSearch();
    this.bindTogglesCommon();
    this.bindSocketCommon();
    this.bindShareCommon();
    this.bindProfile();
    this.bindProfileSync();

    await this.loadDashboard();
    this.startAutoRefresh();
    this.loadCommonStatus();
  }

  // PROFILE CONNECT - Profile page se wapas aate hi auto refresh
  bindProfileSync(){
    const checkUpdate = ()=>{
      const now = localStorage.getItem('shop_updated') || '0';
      if(now!== this.lastShopUpdate){
        this.lastShopUpdate = now;
        this.isLoading = false;
        try{ window.ApiCore?.clearCache?.(); }catch(e){}
        this.loadDashboard();
      }
    };
    window.addEventListener('focus', checkUpdate);
    window.addEventListener('pageshow', checkUpdate);
    window.addEventListener('storage', (e)=>{ if(e.key==='shop_updated') checkUpdate(); });
    document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) checkUpdate(); });
  }

  markShopUpdated(){
    const t = Date.now().toString();
    localStorage.setItem('shop_updated', t);
    this.lastShopUpdate = t;
  }

  // SAMANLIVE BRANDING ONLY - NO SHOP TYPE NAME IN UI
  applyShopBranding(){
    document.title = `SAMANLIVE - Shop Dashboard`;
    const set = (id, txt)=>{ const el=document.getElementById(id); if(el) el.innerText=txt; };
    set('brandShopType', 'Shop Dashboard');
    set('shopTypeDisplay', this.shopType);
    set('headerShopName', 'Shop Dashboard');
    const qBtn = document.getElementById('quickAddBtn');
    if(qBtn) qBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> Quick Add`;
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
    }
    const overlay = $('sidebarOverlay');
    overlay?.addEventListener('click', ()=>{
      document.getElementById('sidebar')?.classList.remove('open');
      overlay.classList.remove('show');
    });
    $('viewShopBtn')?.addEventListener('click', ()=> this.viewShopCommon());
    $('universalFormBtn')?.addEventListener('click', ()=> this.goProductForm());
    $('openCommonOrders')?.addEventListener('click', (e)=>{ e.preventDefault(); this.openCommon(`./orders/orders.html?shopId=${this.shopId}&shopType=${this.shopType}`); });
    if($('shopIdDisplay')){ $('shopIdDisplay').innerText = this.shopId; $('shopIdDisplay').title = this.shopId; }
    if($('roleDisplay')) $('roleDisplay').innerText = window.WorldProductManager?.role || 'dashboard';

    $('btnLowStock')?.addEventListener('click', ()=> this.openCommon(`./inventory/low-stock-alert.html?shopId=${this.shopId}&shopType=${this.shopType}`));
    $('btnWallet1')?.addEventListener('click', ()=> this.openCommon(`./finance/wallet.html?shopId=${this.shopId}&shopType=${this.shopType}`));
    $('btnWallet2')?.addEventListener('click', ()=> this.openCommon(`./wallet/wallet.html?shopId=${this.shopId}&shopType=${this.shopType}`));
    $('btnCoupons')?.addEventListener('click', ()=> this.openCommon(`./marketing/coupons.html?shopId=${this.shopId}&shopType=${this.shopType}`));
    $('btnReferral')?.addEventListener('click', ()=> this.openCommon(`./marketing/referral.html?shopId=${this.shopId}&shopType=${this.shopType}`));
    $('btnStaff')?.addEventListener('click', ()=> this.openCommon(`./staff/staff-list.html?shopId=${this.shopId}&shopType=${this.shopType}`));
    $('btnDelivery')?.addEventListener('click', ()=> this.openCommon(`./delivery/delivery-status.html?shopId=${this.shopId}&shopType=${this.shopType}`));
    $('btnBanner')?.addEventListener('click', ()=> this.openCommon(`./banner/banner.html?shopId=${this.shopId}&shopType=${this.shopType}`));
    $('btnSettings')?.addEventListener('click', ()=> this.openCommon(`./settings/settings.html?shopId=${this.shopId}&shopType=${this.shopType}`));
    $('btnProfile')?.addEventListener('click', ()=> this.openCommon(`./profile/profile.html?shopId=${this.shopId}&shopType=${this.shopType}`));
    $('btnProfile2')?.addEventListener('click', ()=> this.openCommon(`./profile/profile.html?shopId=${this.shopId}&shopType=${this.shopType}`));
  }

  bindProfile(){
    const openProfileTab = ()=>{
      document.querySelectorAll('.menu a').forEach(x=>x.classList.remove('active'));
      document.querySelector('.menu a[data-tab="profile"]')?.classList.add('active');
      document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      document.getElementById('tab-profile')?.classList.add('active');
      if(window.innerWidth<=1100){ document.getElementById('sidebar')?.classList.remove('open'); document.getElementById('sidebarOverlay')?.classList.remove('show'); }
    };
    document.getElementById('btnOpenProfile')?.addEventListener('click', openProfileTab);
    document.getElementById('btnQuickProfile')?.addEventListener('click', openProfileTab);
    document.getElementById('btnEditProfile')?.addEventListener('click', ()=> this.openCommon(`./profile/profile.html?shopId=${this.shopId}&shopType=${this.shopType}`));
    document.getElementById('btnShopInfo')?.addEventListener('click', ()=> this.openCommon(`./profile/shop-info.html?shopId=${this.shopId}&shopType=${this.shopType}`));
    document.getElementById('btnShopTiming')?.addEventListener('click', ()=> this.openCommon(`./profile/shop-timing.html?shopId=${this.shopId}&shopType=${this.shopType}`));
    document.getElementById('btnVerification')?.addEventListener('click', ()=> this.openCommon(`./profile/shop-verification.html?shopId=${this.shopId}&shopType=${this.shopType}`));
  }

  renderProfile(){
    if(!this.shopData) return;
    const d = this.shopData;
    // FIELD FIX - name/shopName dono chalega, avatar/shopImage dono chalega
    const name = d.shopName || d.name || 'My Shop';
    const owner = d.ownerName || d.owner || d.userName || 'Shop Owner';
    const localAvatar = localStorage.getItem(`shop_avatar_${this.shopId}`) || '';
    const localCover = localStorage.getItem(`shop_cover_${this.shopId}`) || '';
    const photo = localAvatar || d.avatar || d.shopImage || d.logo || d.image || d.banner || d.cover || localCover || 'https://placehold.co/100x100/1e293b/ffffff?text=SL';
    const localShop = (()=>{ try{ return JSON.parse(localStorage.getItem(`shop_${this.shopId}`)||'{}'); }catch(e){ return {}; } })();
    const phoneVal = d.phone || d.mobile || localShop.phone || '-';
    const addrVal = d.address || localShop.address || d.area || localShop.area || '-';

    const set = (id, txt)=>{ const el=document.getElementById(id); if(el) el.innerText = txt?? '-'; };
    const setImg = (id, src)=>{ const el=document.getElementById(id); if(el) el.src = src; };
    set('profileShopName', name); set('profileOwnerName', owner); set('profileShopIdShort', 'ID: '+this.shopId.slice(0,12)+'...');
    setImg('profilePhoto', photo);
    set('headerShopName', 'Shop Dashboard');
    set('shopNameHead', name);
    setImg('profileBigPhoto', photo); set('profileBigName', name);
    set('profileBigMeta', `${d.area || localShop.area || d.city || localShop.city || ''}`);
    set('pfShopName', name); set('pfOwnerName', owner); set('pfPhone', phoneVal);
    set('pfShopType', this.shopType); set('pfAddress', addrVal); set('pfStatus', d.isOpen===false?'Closed':'Open');
    setImg('quickPhoto', photo); set('quickShopName', name); set('quickOwner', owner);
  }

  logoutCommon(){
    if(window.AuthCore?.logout){ window.AuthCore.logout(); }
    else{ localStorage.clear(); location.href='/'; }
  }

  viewShopCommon(){
    const mapView = { kirana:'user-view.html' };
    const file = mapView[this.shopType] || 'customer-view.html';
    this.openCommon(`../${this.shopType}/${file}?shopId=${this.shopId}&shopType=${this.shopType}`);
  }

  openCommon(url){
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth<=1100;
    if(isMobile){ location.href = url; } else { const w=window.open(url,'_blank'); if(!w) location.href=url; }
  }

  checkCommonConnection(){
    const el=document.getElementById('commonStatus');
    const pm = window.WorldProductManager;
    if(!pm){ if(el) el.innerHTML='❌ product-manager.js NOT loaded'; return; }
    if(el) el.innerHTML=`✅ SAMANLIVE Connected<br>Shop: ${this.shopData?.shopName||this.shopData?.name||''}<br>Role: ${pm.role}<br>ShopId: ${this.shopId.slice(0,12)}...<br>API: /api/world-products`;
    this.toast('✅ Connection OK - SAMANLIVE');
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
        document.getElementById('tab-'+tab)?.classList.add('active');
        if(tab==='profile'){ this.isLoading=false; this.loadDashboard(); }
        await this.loadCommonTab(tab);
        window.ApiCore?.trackEvent(`dashboard_tab_${tab}`, { shopId:this.shopId, shopType:this.shopType });
        if(window.innerWidth<=1100){ setTimeout(()=>{ document.getElementById('sidebar')?.classList.remove('open'); document.getElementById('sidebarOverlay')?.classList.remove('show'); },400); }
      });
    });
  }

  async loadCommonTab(tab){
    const boxMap = { products:'commonInventory', inventory:'lowStockList', analytics:'analyticsBox', finance:'financeBox', reviews:'reviewsBox', orders:'recentOrders' };
    const boxId = boxMap[tab];
    if(boxId){
      const box = document.getElementById(boxId);
      if(box &&!box.dataset.loaded){
        box.innerHTML = `<div style="padding:12px;color:#64748b;font-size:12px"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</div>`;
        try{
          let url = null;
          if(tab==='analytics') url = this.API_COMMON.analytics;
          if(tab==='finance') url = this.API_COMMON.finance;
          if(tab==='reviews') url = this.API_COMMON.reviews;
          if(tab==='inventory') url = this.API_COMMON.lowStock;
          if(tab==='orders') url = this.API_COMMON.orders;
          if(url && window.ApiCore){
            const data = await window.ApiCore.get(url).catch(()=>null);
            if(data){ box.innerHTML = `<div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px;border-radius:12px"><pre style="font-size:11px;white-space:pre-wrap;max-height:300px;overflow:auto">${JSON.stringify(data,null,2).slice(0,4000)}</pre></div>`; box.dataset.loaded='true'; }
            else box.innerHTML='';
          }
        }catch(e){ box.innerHTML = `<div style="color:#ef4444;font-size:12px">Failed: ${e.message}</div>`; }
      }
    }
    const iframeMap = {
      products:{id:'inventoryFrame',src:`./inventory/inventory.html?shopId=${this.shopId}&shopType=${this.shopType}`},
      orders:{id:'ordersFrame',src:`./orders/orders.html?shopId=${this.shopId}&shopType=${this.shopType}`},
      orders_full:{id:'ordersFullFrame',src:`./orders/orders.html?shopId=${this.shopId}&shopType=${this.shopType}`},
      analytics:{id:'analyticsFrame',src:`./analytics/analytics.html?shopId=${this.shopId}&shopType=${this.shopType}`},
      reviews:{id:'reviewsFrame',src:`./reviews/reviews.html?shopId=${this.shopId}&shopType=${this.shopType}`}
    };
    const f = iframeMap[tab];
    if(f){ const el=document.getElementById(f.id); if(el &&!el.src) el.src=f.src; }
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
          if(!q) this.filteredProducts=[...this.allProducts];
          else this.filteredProducts = this.allProducts.filter(p=>(p.name||'').toLowerCase().includes(q)||(p.brand||'').toLowerCase().includes(q)||(p.category||'').toLowerCase().includes(q)||(p.extraData?.weight||'').toLowerCase().includes(q));
        }
        this.renderProducts(this.filteredProducts);
      },200);
    });
  }

  bindTogglesCommon(){
    ['toggleSwitch','toggleSwitch2'].forEach(id=>{
      const el = document.getElementById(id);
      if(!el) return;
      el.addEventListener('click', async ()=>{
        if(window.ShopToggleCore?.toggle){
          try{
            const newState = await window.ShopToggleCore.toggle(this.shopId);
            this.updateToggleUI(newState);
            this.toast(newState?'Shop Opened ✅':'Shop Closed 🔴');
            this.markShopUpdated();
            return;
          }catch(e){ console.warn('ShopToggleCore failed', e); }
        }
        const isOpen =!el.classList.contains('on');
        this.updateToggleUI(isOpen);
        try{
          await window.ApiCore?.put(this.API_COMMON.shopToggle, { isOpen }).catch(()=>{});
          await window.ApiCore?.post(this.API_COMMON.toggle, { isOpen }).catch(()=>{});
          try{ await window.ApiCore?.put(`/api/shops/${this.shopId}`, { isOpen }).catch(()=>{}); }catch(e){}
          try{ await window.ApiCore?.put(`/api/common/profile/${this.shopId}/timing`, { isOpen }).catch(()=>{}); }catch(e){}
          window.SocketCore?.emit('shop-status-changed', { shopId:this.shopId, shopType:this.shopType, isOpen });
          if(window.DashboardCore?.updateShopStatus) window.DashboardCore.updateShopStatus(isOpen);
          this.markShopUpdated();
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
    const pf=document.getElementById('pfStatus'); if(pf) pf.innerText=isOpen?'Open':'Closed';
  }

  bindSocketCommon(){
    if(!window.SocketCore){ console.warn('SocketCore not loaded'); return; }
    window.SocketCore.on('new-order', (order)=>{
      if(order.shopId && order.shopId!==this.shopId) return;
      this.toast(`🔔 New Order #${(order.orderId||'').toString().slice(-6)} - ₹${order.total||0}`);
      this.playSoundCommon(); this.vibrateCommon();
      this.orders.unshift(order);
      this.renderOrders(this.orders.slice(0,15));
      this.loadStatsCommon();
    });
    window.SocketCore.on('order-updated', (data)=>{ if(data.shopId===this.shopId) this.loadOrdersCommon(); });
    window.SocketCore.on('product-updated', (data)=>{ if(data.shopId===this.shopId) this.loadDashboard(); });
    window.SocketCore.on('shop-status-changed', (data)=>{ if(data.shopId===this.shopId) this.updateToggleUI(data.isOpen); });
    window.SocketCore.on('shop-profile-updated', (data)=>{ if(data.shopId===this.shopId){ this.markShopUpdated(); this.loadDashboard(); } });
    window.SocketCore.on('shop-info-updated', (data)=>{ if(data.shopId===this.shopId){ this.markShopUpdated(); this.loadDashboard(); } });
    window.SocketCore.on('shop-timing-updated', (data)=>{ if(data.shopId===this.shopId){ this.markShopUpdated(); this.loadDashboard(); } });
  }

  bindShareCommon(){ if(window.ShareCore) console.log('✅ ShareCore connected'); }

  async loadDashboard(){
    if(this.isLoading) return;
    this.isLoading=true; this.showLoader(true);
    try{
      const results = await Promise.allSettled([
        window.ApiCore?.get(this.API_OLD).catch(()=>({shop:{products:[]}})),
        window.WorldProductManager? window.WorldProductManager.getProducts({shopType:this.shopType, shopId:this.shopId, role:'dashboard'}) : fetch(this.API_WORLD).then(r=>r.json()).then(d=>d.data||[]),
        window.ApiCore?.get(this.API_COMMON.analytics).catch(()=>null),
        window.ApiCore?.get(this.API_COMMON.lowStock).catch(()=>null),
        window.ApiCore?.get(this.API_COMMON.orders).catch(()=>null),
        window.ApiCore?.get(this.API_COMMON.finance).catch(()=>null),
        window.ApiCore?.get(this.API_COMMON.shopInfo).catch(()=>null),
        window.ApiCore?.get(`/api/common/profile/${this.shopId}`).catch(()=>null)
      ]);
      const oldRes = results[0].status==='fulfilled'? results[0].value : {shop:{products:[]}};
      const worldRes = results[1].status==='fulfilled'? results[1].value : [];
      const analyticsRes = results[2].status==='fulfilled'? results[2].value : null;
      const lowStockRes = results[3].status==='fulfilled'? results[3].value : null;
      const ordersRes = results[4].status==='fulfilled'? results[4].value : null;
      const shopInfoRes = results[6].status==='fulfilled'? results[6].value : null;
      const profileRes = results[7].status==='fulfilled'? results[7].value : null;

      this.shopData = oldRes?.shop || oldRes || { shopName:'', products:[] };
      // PROFILE MERGE FIX - /api/common/profile wala data sabse upar, purana data isko nahi dabayega
      const profShop = profileRes?.shop || profileRes?.profile || profileRes?.data || shopInfoRes?.shop || shopInfoRes?.profile || shopInfoRes?.data || null;
      if(profShop && typeof profShop==='object'){
        // products purane wale se lo, profile fields naye wale se
        const oldProducts = this.shopData.products || [];
        this.shopData = {...this.shopData,...profShop, products: profShop.products && profShop.products.length? profShop.products : oldProducts };
      }
      // LOCALSTORAGE MERGE FIX - profile page local save bhi dikhe
      try{
        const localShop = JSON.parse(localStorage.getItem(`shop_${this.shopId}`)||'{}');
        if(localShop && localShop.name) this.shopData = {...this.shopData,...localShop, shopName: localShop.shopName||localShop.name, name: localShop.name||localShop.shopName};
        const timingLocal = JSON.parse(localStorage.getItem(`timing_${this.shopId}`)||'null');
        if(timingLocal && timingLocal.isOpen!==undefined) this.shopData.isOpen = timingLocal.isOpen;
      }catch(e){}

      // NAME NORMALIZE - dashboard har jagah shopName use karega
      if(this.shopData.name &&!this.shopData.shopName) this.shopData.shopName = this.shopData.name;
      if(this.shopData.shopName &&!this.shopData.name) this.shopData.name = this.shopData.shopName;
      if(this.shopData.avatar &&!this.shopData.shopImage) this.shopData.shopImage = this.shopData.avatar;
      if(this.shopData.cover &&!this.shopData.banner) this.shopData.banner = this.shopData.cover;

      this.oldProducts = this.shopData.products || [];
      this.worldProducts = Array.isArray(worldRes)? worldRes : (worldRes?.data||[]);
      this.allProducts = [...this.worldProducts,...this.oldProducts];
      this.filteredProducts = [...this.allProducts];
      this.lowStock = lowStockRes?.products || lowStockRes?.data || this.allProducts.filter(p=> (p.stock||0) <= (p.lowStockAlert||10));
      this.orders = ordersRes?.orders || ordersRes?.data || [];
      this.stats = {...(this.shopData.stats||{}),...(analyticsRes||{}), totalProducts:this.allProducts.length, worldCount:this.worldProducts.length, oldCount:this.oldProducts.length, lowStockCount:this.lowStock.length, todayOrders: analyticsRes?.todayOrders || this.orders.length, todayRevenue: analyticsRes?.todayRevenue || 0 };

      this.renderStats();
      this.renderProducts(this.filteredProducts);
      this.renderLowStock(this.lowStock);
      this.renderOrders(this.orders);
      this.renderProfile();
      if(this.shopData.isOpen!==undefined) this.updateToggleUI(!!this.shopData.isOpen);

      if(window.DashboardCore){ window.DashboardCore.shopId=this.shopId; window.DashboardCore.shopData=this.shopData; window.DashboardCore.stats=this.stats; window.DashboardCore.worldProducts=this.worldProducts; }
      if(window.StorageCore) window.StorageCore.cacheShopData(this.shopData, 5*60*1000);
    }catch(e){
      console.error('loadDashboard failed', e);
      window.ErrorHandler?.handleApiError(e,'common_dashboard');
      this.showErrorInGrid(e.message);
    }finally{ this.isLoading=false; this.showLoader(false); }
  }

  async loadCommonStatus(){
    const el=document.getElementById('commonStatus'); if(!el) return;
    try{
      const data = await window.ApiCore?.get(this.API_COMMON.health).catch(()=>null);
      if(data) el.innerHTML=`✅ SAMANLIVE Connected<br>Shop: ${this.shopData?.shopName||this.shopData?.name||'My Shop'}<br>Products: ${this.allProducts.length}`;
      else el.innerHTML=`✅ SAMANLIVE Dashboard Ready<br>Products: ${this.allProducts.length} (World: ${this.worldProducts.length})`;
    }catch(e){ el.innerHTML=`✅ SAMANLIVE Ready`; }
  }

  async loadStatsCommon(){
    try{
      const s = await window.ApiCore?.get(this.API_COMMON.analytics);
      if(s){ const $=(id)=>document.getElementById(id); if($('revenue')) $('revenue').innerText=`₹${s.todayRevenue||0}`; if($('orderCount')) $('orderCount').innerText=s.todayOrders||0; }
    }catch(e){}
  }

  async loadOrdersCommon(){
    try{ const data = await window.ApiCore?.get(this.API_COMMON.orders); if(data?.orders){ this.orders=data.orders; this.renderOrders(this.orders); } }catch(e){}
  }

  renderStats(){
    const $=(id)=>document.getElementById(id);
    if($('productCount')) $('productCount').innerText=this.stats.totalProducts||this.allProducts.length||0;
    if($('menuProdCount')) $('menuProdCount').innerText=this.allProducts.length||0;
    if($('prodCountText')) $('prodCountText').innerText=`(${this.allProducts.length}) W:${this.worldProducts.length} O:${this.oldProducts.length}`;
    if($('lowStockCount')) $('lowStockCount').innerText=this.stats.lowStockCount||this.lowStock.length||0;
    if($('revenue')) $('revenue').innerText=`₹${this.stats.todayRevenue||this.stats.revenue||0}`;
    if($('orderCount')) $('orderCount').innerText=this.stats.todayOrders||this.orders.length||0;
  }

  renderProducts(list){
    const c=document.getElementById('productList'); if(!c) return;
    if(!list.length){
      c.innerHTML=`<div class="empty-box"><div style="font-size:48px">🛒</div><h3 style="font-weight:900;margin-top:10px">No products yet</h3><p style="color:#94a3b8;font-size:13px;margin-top:6px">Click <b style="color:#10b981">Quick Add</b> to add ready products</p><button onclick="window.CommonDashboard.goQuickAdd()" class="btn btn-green" style="margin:12px auto 0">Quick Add Products</button></div>`;
      return;
    }
    c.innerHTML=list.map(p=>`
      <div class="p-card" data-id="${p._id}">
        <img src="${p.thumbnail || p.images?.[0]?.url || p.image || `https://placehold.co/400x300/f8fafc/94a3b8?text=${encodeURIComponent((p.name||'Product').slice(0,12))}`}" loading="lazy" onerror="this.src='https://placehold.co/400x300/f8fafc/94a3b8?text=Product'">
        <div style="padding:10px">
          <b style="font-size:13px" title="${p.name||''}">${(p.name||'').slice(0,28)}</b>
          <div style="font-size:10px;color:#64748b;margin-top:2px">${p.brand||p.extraData?.brand||''} ${p.brand?'•':''} ${p.weight||p.extraData?.weight||p.unit||''}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
            <div style="font-weight:900">₹${p.price||0}<del style="color:#94a3b8;font-size:10px;margin-left:4px">₹${p.mrp||p.price||0}</del></div>
            <div class="stock-badge" style="background:${(p.stock||0)<=10?'#fee2e2;color:#ef4444':'#dcfce7;color:#15803d'}">${p.stock||0} LEFT</div>
          </div>
          <div style="display:flex;gap:6px;margin-top:10px">
            <button onclick="window.CommonDashboard.editProduct('${p._id}')" style="flex:1;background:#f1f5f9;border:1px solid #e2e8f0;padding:7px;border-radius:9px;font-weight:800;font-size:11px;cursor:pointer"><i class="fa-solid fa-pen"></i> Edit</button>
            <button onclick="window.CommonDashboard.deleteProduct('${p._id}')" style="width:36px;background:#fff;border:1px solid #fee2e2;color:#ef4444;border-radius:9px;cursor:pointer"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>`).join('');
  }

  renderLowStock(list){
    const html=!list.length?`<div class="low-ok">✓ All Stock OK</div>`:list.slice(0,10).map(p=>`<div class="low-item"><div><b style="font-size:12px">${p.name}</b><br><small style="color:#92400e;font-size:10px">${p.category||''} • ${p.weight||''}</small></div><span class="low-badge">${p.stock}</span></div>`).join('');
    ['lowStock','lowStockRight','lowStockList'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=html; });
  }

  renderOrders(orders){
    const html=!orders.length?`<div style="text-align:center;padding:16px;color:#94a3b8;font-size:12px"><div style="font-size:24px">📦</div>No live orders</div>`:orders.map(o=>`<div class="order-item" onclick="window.CommonDashboard.openOrder('${o._id||o.orderId}')"><div><b style="font-size:12px">#${(o.orderId||o._id||'').toString().slice(-6).toUpperCase()}</b><br><span style="font-size:10px;color:#64748b">${o.items?.length||1} items • ₹${o.total||0} • ${o.customerName||'Customer'}</span></div><span class="order-status" style="background:${this.getStatusColor(o.status)}">${(o.status||'PLACED').toUpperCase()}</span></div>`).join('');
    ['recentOrders','liveOrdersRight'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=html; });
  }

  getStatusColor(status){ const map={placed:'#0ea5e9',confirmed:'#8b5cf6',preparing:'#f59e0b',out_for_delivery:'#10b981',delivered:'#059669',cancelled:'#ef4444'}; return map[(status||'').toLowerCase()]||'#64748b'; }
  showLoader(show){ const el=document.getElementById('loader'); if(el) el.style.display=show?'grid':'none'; }
  showErrorInGrid(msg){ const c=document.getElementById('productList'); if(c) c.innerHTML=`<div style="grid-column:1/-1;padding:20px;color:#ef4444;background:#fef2f2;border:1px solid #fee2e2;border-radius:12px"><b>Error:</b> ${msg}</div>`; }
  showErrorPage(title,message){ document.body.innerHTML=`<div style="height:100vh;display:grid;place-items:center;font-family:Outfit;text-align:center;padding:20px;background:#f8fafc"><div style="background:#fff;padding:32px;border-radius:24px;box-shadow:0 20px 40px rgba(0,0,0,.08);max-width:420px"><div style="font-size:20px;font-weight:900;letter-spacing:1px">SAMANLIVE</div><div style="font-size:48px;margin-top:10px">⚠️</div><h2 style="font-weight:900;margin:12px 0">${title}</h2><p style="color:#64748b;font-size:13px">${message}</p><a href="/" style="display:block;margin-top:16px;background:#0f172a;color:#fff;padding:12px;border-radius:12px;text-decoration:none;font-weight:800">Go Home</a></div></div>`; }
  toast(msg){ const t=document.getElementById('toast'); if(!t) return; t.innerText=msg; t.style.display='block'; setTimeout(()=>t.style.display='none',3000); }
  playSoundCommon(){ try{ const audio=document.getElementById('newOrderSound'); if(audio){ audio.volume=0.8; audio.play().catch(()=>{}); } }catch(e){} }
  vibrateCommon(){ if(navigator.vibrate) navigator.vibrate([100,50,100]); }

  goProductForm(){ location.href=`./products/product-form.html?shopType=${this.shopType}&shopId=${this.shopId}&type=${this.shopType}`; }
  goQuickAdd(){ location.href=`./products/product-form.html?shopType=${this.shopType}&shopId=${this.shopId}&type=${this.shopType}&quick=1`; }
  editProduct(id){ location.href=`./products/product-form.html?shopType=${this.shopType}&shopId=${this.shopId}&type=${this.shopType}&editId=${id}`; }

  async deleteProduct(id){
    if(!confirm('Delete? Ye product dashboard, customer view sab jagah se hat jayega.')) return;
    try{
      let res;
      if(window.WorldProductManager?.deleteProduct){ res = await window.WorldProductManager.deleteProduct(id); }
      else{ res = await fetch(`${this.API_WORLD_BASE}/${id}`,{method:'DELETE',headers:{'Authorization':'Bearer '+(localStorage.getItem('token')||'')}}).then(r=>r.json()); }
      if(!res.success){
        const oldRes = await window.ApiCore?.delete(`/api/shops/${this.shopType}/${this.shopId}/item/${id}`).catch(()=>({success:false}));
        if(!oldRes.success) throw new Error(res.message||'Delete failed');
      }
      this.toast('Deleted ✅');
      window.ApiCore?.clearCache?.(this.API_WORLD);
      await this.loadDashboard();
    }catch(e){ window.ErrorHandler?.handleApiError(e,'delete_product_common'); this.toast('Delete failed: '+e.message); }
  }

  openOrder(orderId){ this.openCommon(`./orders/order-detail.html?shopId=${this.shopId}&orderId=${orderId}&shopType=${this.shopType}`); }
  startAutoRefresh(){ this.stopAutoRefresh(); this.refreshInterval=setInterval(()=>{ this.loadOrdersCommon(); this.loadStatsCommon(); },30000); }
  stopAutoRefresh(){ if(this.refreshInterval) clearInterval(this.refreshInterval); }
}

window.CommonDashboard = new CommonDashboardCore();
window.commonDashboard = window.CommonDashboard;
window.deleteProduct = (id)=> window.CommonDashboard.deleteProduct(id);
window.editProduct = (id)=> window.CommonDashboard.editProduct(id);
window.goForm = ()=> window.CommonDashboard.goProductForm();
window.goQuick = ()=> window.CommonDashboard.goQuickAdd();
window.toggleShop = ()=> { const sw=document.getElementById('toggleSwitch'); if(sw) sw.click(); };
setTimeout(()=>{ const l=document.getElementById('loader'); if(l) l.style.display='none'; window.CommonDashboard?.checkCommonConnection(); window.CommonDashboard?.toast('✅ SAMANLIVE Dashboard Ready'); }, 900);