// LOCATION: public/shop-templates/common/dashboard.js - SAMANLIVE COMMON DASHBOARD - V18 WORLD BOSS + HIERARCHY MASTER - FULL CODE
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
    this.wallet = { balance:0, totalEarning:0 };

    this.API_WORLD = `/api/world-products?shopId=${this.shopId}&shopType=${this.shopType}`;
    this.API_WORLD_BASE = `/api/world-products`;
    this.API_OLD = `/api/shops/${this.shopType}/${this.shopId}`;
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
    window.MY_SHOP_ID = this.shopId;
    window.USER_ROLE = window.RoleHierarchy? window.RoleHierarchy.getMyRole() : 'shop_owner';

    this.applyShopBranding();

    if(window.AuthCore){
      try{ const ok = await window.AuthCore.protectDashboard(); if(!ok){ console.warn('AuthCore protect false'); } }catch(e){ console.warn('AuthCore protect failed', e); }
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
    await this.loadWallet();
    await this.loadAdminProducts();
    this.startAutoRefresh();
    this.loadCommonStatus();
  }

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

  applyShopBranding(){
    document.title = `SAMANLIVE - Shop Dashboard - V18 Hierarchy`;
    const set = (id, txt)=>{ const el=document.getElementById(id); if(el) el.innerText=txt; };
    set('brandShopType', 'Shop Dashboard - Hierarchy');
    set('shopTypeDisplay', this.shopType);
    set('headerShopName', 'Shop Dashboard - Hierarchy');
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
    $('openCommonOrders')?.addEventListener('click', (e)=>{ e.preventDefault(); this.openCommon(`./orders/orders.html?shopId=${this.shopId}&shopType=${this.shopType}&role=shop_owner`); });
    if($('shopIdDisplay')){ $('shopIdDisplay').innerText = this.shopId; $('shopIdDisplay').title = this.shopId; }
    if($('roleDisplay')) $('roleDisplay').innerText = window.RoleHierarchy? window.RoleHierarchy.getMyRole() : 'shop_owner';

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
    set('headerShopName', 'Shop Dashboard - Hierarchy');
    set('shopNameHead', name + ` • Wallet: ₹${this.wallet.balance||0}`);
    setImg('profileBigPhoto', photo); set('profileBigName', name);
    set('profileBigMeta', `${d.area || localShop.area || d.city || ''} • Role: shop_owner → area_manager, admin`);
    set('pfShopName', name); set('pfOwnerName', owner); set('pfPhone', phoneVal);
    set('pfShopType', this.shopType); set('pfAddress', addrVal); set('pfStatus', d.isOpen===false?'Closed':'Open');
    set('pfWallet', `₹${this.wallet.balance||0} | Earn: ₹${this.wallet.totalEarning||0}`);
    if(window.RoleHierarchy){
      const canBuy = window.RoleHierarchy.CAN_BUY_FROM['shop_owner']||[];
      set('pfCanBuy', JSON.stringify(canBuy));
      const quickRole = document.getElementById('quickRole'); if(quickRole) quickRole.textContent = `shop_owner → ${JSON.stringify(canBuy)}`;
      const hierInfo = document.getElementById('hierarchyInfo'); if(hierInfo) hierInfo.textContent = `shop_owner → ${JSON.stringify(canBuy)}`;
    }
    setImg('quickPhoto', photo); set('quickShopName', name); set('quickOwner', owner);
    const walletShort = document.getElementById('walletShort'); if(walletShort) walletShort.textContent = `Wallet: ₹${this.wallet.balance||0} | Earn: ₹${this.wallet.totalEarning||0}`;
  }

  logoutCommon(){
    if(window.AuthCore?.logout){ window.AuthCore.logout(); }
    else{ localStorage.clear(); location.href='/'; }
  }

  viewShopCommon(){
    const mapView = { kirana:'../kirana/user-view.html', patanjali:'../patanjali/customer-view.html' };
    const file = mapView[this.shopType] || '../kirana/user-view.html';
    this.openCommon(`${file}?shopId=${this.shopId}&shopType=${this.shopType}&supplierId=${this.shopId}&supplierRole=shop_owner`);
  }

  openCommon(url){
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth<=1100;
    if(isMobile){ location.href = url; } else { const w=window.open(url,'_blank'); if(!w) location.href=url; }
  }

  checkCommonConnection(){
    const el=document.getElementById('commonStatus');
    const pm = window.WorldProductManager;
    const rh = window.RoleHierarchy;
    if(!pm){ if(el) el.innerHTML='❌ product-manager.js NOT loaded'; return; }
    if(el) el.innerHTML=`✅ SAMANLIVE Connected - Hierarchy Active<br>Shop: ${this.shopData?.shopName||''}<br>Role: ${rh? rh.getMyRole() : pm.role}<br>Can Buy: ${rh? JSON.stringify(rh.CAN_BUY_FROM['shop_owner']||[]) : 'area_manager, admin'}<br>Wallet: ₹${this.wallet.balance||0}<br>API: /api/world-products`;
    this.toast('✅ Connection OK - Hierarchy + Wallet + Socket');
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
        if(tab==='bulk_buy') await this.loadAdminProducts();
        if(tab==='finance') await this.loadWallet();
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
      orders:{id:'ordersFrame',src:`./orders/orders.html?shopId=${this.shopId}&shopType=${this.shopType}&role=shop_owner`},
      orders_full:{id:'ordersFullFrame',src:`./orders/orders.html?shopId=${this.shopId}&shopType=${this.shopType}&role=shop_owner`},
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
          window.SocketCore?.emit('shop-status-changed', { shopId:this.shopId, shopType:this.shopType, isOpen });
          if(window.shopSocket) window.shopSocket.emit('shop-status-changed', { shopId:this.shopId, isOpen });
          if(window.DashboardCore?.updateShopStatus) window.DashboardCore.updateShopStatus(isOpen);
          if(window.DashboardCore?.emitShopStatus) window.DashboardCore.emitShopStatus(isOpen);
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
    if(window.DashboardCore && window.DashboardCore.initSocket){
      setTimeout(()=> window.DashboardCore.initSocket(), 800);
    }
    if(!window.SocketCore){ console.warn('SocketCore not loaded'); return; }
    window.SocketCore.on('new-order', (order)=>{
      if(order.shopId && order.shopId!==this.shopId) return;
      this.handleNewOrder(order);
    });
    window.SocketCore.on('order-updated', (data)=>{ if(data.shopId===this.shopId) this.loadOrdersCommon(); });
    window.SocketCore.on('product-updated', (data)=>{ if(data.shopId===this.shopId) this.loadDashboard(); });
    window.SocketCore.on('shop-status-changed', (data)=>{ if(data.shopId===this.shopId) this.updateToggleUI(data.isOpen); });
    window.SocketCore.on('shop-profile-updated', (data)=>{ if(data.shopId===this.shopId){ this.markShopUpdated(); this.loadDashboard(); } });
    if(window.shopSocket){
      window.shopSocket.on('new-order', (o)=> this.handleNewOrder(o));
    }
  }

  handleNewOrder(order){
    this.toast(`🔔 New Order #${(order.orderId||'').toString().slice(-6)} - ₹${order.totalAmount||order.total||0} - ${order.buyerRole||'customer'}`);
    this.playSoundCommon(); this.vibrateCommon();
    const badge = document.getElementById('newOrderBadge'); if(badge) badge.style.display='inline-block';
    const countBadge = document.getElementById('newOrderCount'); if(countBadge){
      countBadge.style.display='inline-block';
      const c = parseInt(countBadge.textContent||'0')+1;
      countBadge.textContent = c>9? '9+' : c;
    }
    const badgeRight = document.getElementById('liveOrderBadgeRight'); if(badgeRight){ badgeRight.style.display='inline-block'; badgeRight.textContent = countBadge? countBadge.textContent : 'NEW'; }
    if(window.DashboardCore && window.DashboardCore.showNewOrderPopup) window.DashboardCore.showNewOrderPopup(order);
    this.orders.unshift(order);
    this.renderOrders(this.orders.slice(0,15));
    this.loadStatsCommon(); this.loadWallet();
  }

  bindShareCommon(){ if(window.ShareCore) console.log('✅ ShareCore connected'); }

  // ==================== WALLET - HIERARCHY NEW ====================
  async loadWallet(){
    try{
      const res = await fetch(this.API_COMMON.walletBalance).then(r=>r.json()).catch(()=>({balance:0}));
      this.wallet = res.wallet || res || { balance:0, totalEarning:0 };
      const $ = (id)=> document.getElementById(id);
      const set = (id,val)=>{ const el=$(id); if(el) el.textContent = `₹${val}`; };
      set('walletBalance', this.wallet.balance||0);
      set('totalEarning', this.wallet.totalEarning||0);
      set('revenue', this.wallet.totalEarning||0);
      set('headerWallet', this.wallet.balance||0);
      set('headerEarning', this.wallet.totalEarning||0);
      set('footerWallet', this.wallet.balance||0);
      set('menuWallet', this.wallet.balance||0);
      set('financeWalletBalance', this.wallet.balance||0);
      set('financeTotalEarning', this.wallet.totalEarning||0);
      set('pfWallet', this.wallet.balance||0);
      const short = document.getElementById('walletShort'); if(short) short.textContent = `Wallet: ₹${this.wallet.balance||0} | Earn: ₹${this.wallet.totalEarning||0}`;
      const pfWallet = document.getElementById('pfWallet'); if(pfWallet) pfWallet.textContent = `₹${this.wallet.balance||0} | Earn: ₹${this.wallet.totalEarning||0}`;

      const txRes = await fetch(this.API_COMMON.walletTx).then(r=>r.json()).catch(()=>({transactions:[]}));
      const txEl = document.getElementById('walletTx');
      if(txEl){
        const tx = txRes.transactions||[];
        if(!tx.length) txEl.innerHTML = '<p style="opacity:0.6;font-size:11px">No transactions yet</p>';
        else txEl.innerHTML = tx.map(t=> `
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee;font-size:11px">
            <span>${t.type==='credit'? '🟢' : '🔴'} ${t.description||t.type}<br><small style="color:#94a3b8">${new Date(t.createdAt).toLocaleDateString()}</small></span>
            <span style="font-weight:800;color:${t.type==='credit'? '#10b981' : '#ef4444'}">${t.type==='credit'? '+' : '-'}₹${t.amount}</span>
          </div>
        `).join('');
      }
      this.renderProfile();
    } catch(e){ console.log('Wallet load fail', e.message); }
  }

  async loadAdminProducts(){
    const container = document.getElementById('adminProductsForShopOwner');
    if(!container) return;
    container.innerHTML = '<p style="font-size:12px;opacity:0.6">Loading admin/area_manager products for hierarchy...</p>';
    try{
      const res = await fetch(`/api/world-products?role=shop_owner&shopId=${this.shopId}`).then(r=>r.json()).catch(()=>({data:[]}));
      let products = res.data||res.products||[];
      let allowed = products.filter(p=> ['admin','area_manager'].includes(p.ownerRole||p.supplierRole||''));
      if(allowed.length===0){
        const res2 = await fetch(`/api/world-products?role=admin`).then(r=>r.json()).catch(()=>({data:[]}));
        allowed = (res2.data||[]).slice(0,12).map(p=> ({...p, ownerRole:p.ownerRole||'admin', ownerId:p.ownerId||'admin_default', shopId:p.shopId||'admin_shop'}));
      }
      if(!allowed.length){ container.innerHTML='<p style="font-size:12px;color:#888">No admin/area products</p>'; return; }
      container.innerHTML = allowed.map(p=> `
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:12px">
          <img src="${p.thumbnail||p.image||'https://placehold.co/200x120/e2e8f0/0f172a?text=Shop'}" style="width:100%;height:90px;object-fit:cover;border-radius:8px">
          <div style="font-weight:800;font-size:13px;margin-top:8px">${(p.name||'Product').slice(0,35)}</div>
          <div style="font-size:11px;color:#64748b">₹${p.price} • ${p.ownerRole||'admin'}</div>
          <button onclick='window.CommonDashboard.buyFromHierarchy(${JSON.stringify(p).replace(/'/g,"&#39;")})' style="width:100%;margin-top:8px;padding:8px;background:#0f172a;color:#fff;border:0;border-radius:8px;font-size:12px;font-weight:800">Buy Bulk x10</button>
        </div>
      `).join('');
    } catch(e){ container.innerHTML = `<p style="color:red;font-size:12px">${e.message}</p>`; }
  }

  async buyFromHierarchy(product){
    if(!window.CartCore){ alert('CartCore not loaded'); return; }
    product.ownerRole = product.ownerRole||'admin';
    product.ownerId = product.ownerId||'admin_default';
    product.shopId = product.shopId||product.ownerId;
    const ok = await window.CartCore.add(product, 10);
    if(ok){
      this.toast(`Added ${product.name} x10 - Hierarchy`);
      if(confirm(`Added ${product.name} x10. Checkout?`)){
        location.href = `./checkout/checkout.html?shopId=${this.shopId}&supplierId=${product.ownerId}&supplierRole=${product.ownerRole}&shopType=${this.shopType}&supplierName=${encodeURIComponent(product.ownerRole)}`;
      }
    }
  }

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
      const profShop = profileRes?.shop || profileRes?.profile || profileRes?.data || shopInfoRes?.shop || shopInfoRes?.profile || null;
      if(profShop && typeof profShop==='object'){
        const oldProducts = this.shopData.products || [];
        this.shopData = {...this.shopData,...profShop, products: profShop.products && profShop.products.length? profShop.products : oldProducts };
      }
      try{
        const localShop = JSON.parse(localStorage.getItem(`shop_${this.shopId}`)||'{}');
        if(localShop && localShop.name) this.shopData = {...this.shopData,...localShop, shopName: localShop.shopName||localShop.name, name: localShop.name||localShop.shopName};
        const timingLocal = JSON.parse(localStorage.getItem(`timing_${this.shopId}`)||'null');
        if(timingLocal && timingLocal.isOpen!==undefined) this.shopData.isOpen = timingLocal.isOpen;
      }catch(e){}

      if(this.shopData.name &&!this.shopData.shopName) this.shopData.shopName = this.shopData.name;
      if(this.shopData.shopName &&!this.shopData.name) this.shopData.name = this.shopData.shopName;

      this.oldProducts = this.shopData.products || [];
      this.worldProducts = Array.isArray(worldRes)? worldRes : (worldRes?.data||[]);
      this.allProducts = [...this.worldProducts,...this.oldProducts];
      this.filteredProducts = [...this.allProducts];
      this.lowStock = lowStockRes?.products || lowStockRes?.data || this.allProducts.filter(p=> (p.stock||0) <= (p.lowStockAlert||10));
      this.orders = ordersRes?.orders || ordersRes?.data || [];
      this.stats = {...(this.shopData.stats||{}),...(analyticsRes||{}), totalProducts:this.allProducts.length, worldCount:this.worldProducts.length, oldCount:this.oldProducts.length, lowStockCount:this.lowStock.length, todayOrders: analyticsRes?.todayOrders || this.orders.length, todayRevenue: analyticsRes?.todayRevenue || this.wallet.totalEarning || 0 };

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
      el.innerHTML=`✅ SAMANLIVE Dashboard Ready - Hierarchy<br>Products: ${this.allProducts.length} (World: ${this.worldProducts.length})<br>Wallet: ₹${this.wallet.balance||0} • Role: shop_owner → area_manager, admin`;
    }catch(e){ el.innerHTML=`✅ SAMANLIVE Ready - Wallet: ₹${this.wallet.balance||0}`; }
  }

  async loadStatsCommon(){
    try{
      const s = await window.ApiCore?.get(this.API_COMMON.analytics);
      if(s){ const $=(id)=>document.getElementById(id); if($('revenue')) $('revenue').innerText=`₹${s.todayRevenue||this.wallet.totalEarning||0}`; if($('orderCount')) $('orderCount').innerText=s.todayOrders||0; }
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
    if($('revenue')) $('revenue').innerText=`₹${this.stats.todayRevenue||this.stats.revenue||this.wallet.totalEarning||0}`;
    if($('orderCount')) $('orderCount').innerText=this.stats.todayOrders||this.orders.length||0;
  }

  isSpecialProduct(p){
    if(!p) return false;
    const ex = p.extraData || {};
    return p.isSpecial===true || p.isSpecial==='true' || ex.isSpecial===true || ex.isSpecial==='true' || p.layout==='special' || ex.layout==='special' || p.cardType==='special' || ex.cardType==='special' || (p.category||'').toLowerCase()==='special' || (ex.specialCategory===true);
  }

  getProductImage(p){
    return p.thumbnail || p.images?.[0]?.url || p.image || p.extraData?.thumbnail || `https://placehold.co/400x300/f8fafc/94a3b8?text=${encodeURIComponent((p.name||'Product').slice(0,12))}`;
  }

  renderNormalCard(p){
    return `
      <div class="p-card" data-id="${p._id}">
        <img src="${this.getProductImage(p)}" loading="lazy" onerror="this.src='https://placehold.co/400x300/f8fafc/94a3b8?text=Product'">
        <div style="padding:10px">
          <b style="font-size:13px" title="${p.name||''}">${(p.name||'').slice(0,28)}</b>
          <div style="font-size:10px;color:#64748b;margin-top:2px">${p.brand||p.extraData?.brand||''} ${p.brand||p.extraData?.brand?'•':''} ${p.weight||p.extraData?.weight||p.unit||''}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
            <div style="font-weight:900">₹${p.price||0}<del style="color:#94a3b8;font-size:10px;margin-left:4px">₹${p.mrp||p.price||0}</del></div>
            <div class="stock-badge" style="background:${(p.stock||0)<=10?'#fee2e2;color:#ef4444':'#dcfce7;color:#15803d'}">${p.stock||0} LEFT</div>
          </div>
          <div style="display:flex;gap:6px;margin-top:10px">
            <button onclick="window.CommonDashboard.editProduct('${p._id}')" style="flex:1;background:#f1f5f9;border:1px solid #e2e8f0;padding:7px;border-radius:9px;font-weight:800;font-size:11px;cursor:pointer"><i class="fa-solid fa-pen"></i> Edit</button>
            <button onclick="window.CommonDashboard.deleteProduct('${p._id}')" style="width:36px;background:#fff;border:1px solid #fee2e2;color:#ef4444;border-radius:9px;cursor:pointer"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>`;
  }

  renderSpecialCard(p){
    const ex = p.extraData || {};
    const img = this.getProductImage(p);
    const desc = p.description || ex.description || '';
    const brand = p.brand || ex.brand || '';
    const weight = p.weight || ex.weight || '';
    const badge = ex.badge || p.badge || 'SPECIAL';
    const color = ex.cardColor || p.cardColor || '#fff7ed';
    const border = ex.borderColor || p.borderColor || '#fed7aa';
    const layout = (ex.layout || p.layout || 'big').toString().toLowerCase();
    const isPaid = p.isPaidSpecial===true || ex.isPaidSpecial===true;
    if(layout==='list'){
      return `
      <div class="p-card p-special-card" data-id="${p._id}" style="grid-column:1/-1;display:flex;gap:12px;background:${color};border:1px solid ${border}">
        <img src="${img}" style="width:110px;height:110px;object-fit:cover;flex-shrink:0">
        <div style="padding:10px;flex:1;min-width:0">
          <div style="display:flex;gap:6px"><span style="background:#f97316;color:#fff;font-size:9px;font-weight:900;padding:3px 7px;border-radius:999px">⭐ ${badge}</span>${isPaid?`<span style="background:#0f172a;color:#fff;font-size:9px;font-weight:900;padding:3px 7px;border-radius:999px">PAID</span>`:''}</div>
          <b style="font-size:14px;display:block;margin-top:5px">${p.name||''}</b>
          <div style="font-size:10px;color:#64748b;margin-top:2px">${brand} ${weight}</div>
          ${desc?`<div style="font-size:11px;color:#475569;margin-top:5px">${desc.slice(0,120)}</div>`:''}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:7px">
            <div style="font-weight:900;font-size:15px">₹${p.price||0}</div>
            <div class="stock-badge">${p.stock||0} LEFT</div>
          </div>
          <div style="display:flex;gap:6px;margin-top:9px">
            <button onclick="window.CommonDashboard.editProduct('${p._id}')" style="flex:1;background:#fff;border:1px solid #e2e8f0;padding:7px;border-radius:9px;font-weight:800;font-size:11px">Edit</button>
            <button onclick="window.CommonDashboard.deleteProduct('${p._id}')" style="width:36px;background:#fff;border:1px solid #fee2e2;color:#ef4444;border-radius:9px"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>`;
    }
    return `
      <div class="p-card p-special-card" data-id="${p._id}" style="grid-column:1/-1;background:${color};border:1px solid ${border}">
        <div style="position:relative">
          <img src="${img}" style="width:100%;height:200px;object-fit:cover;display:block">
          <span style="position:absolute;top:10px;left:10px;background:#f97316;color:#fff;font-size:10px;font-weight:900;padding:5px 9px;border-radius:999px">⭐ ${badge}</span>
          ${isPaid?`<span style="position:absolute;top:10px;right:10px;background:#0f172a;color:#fff;font-size:10px;font-weight:900;padding:5px 9px;border-radius:999px">PAID SPECIAL</span>`:''}
        </div>
        <div style="padding:12px">
          <b style="font-size:16px">${p.name||''}</b>
          <div style="font-size:11px;color:#64748b;margin-top:3px">${brand} ${weight}</div>
          ${desc?`<div style="font-size:12px;color:#475569;margin-top:7px;line-height:1.5">${desc}</div>`:''}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:9px">
            <div style="font-weight:900;font-size:18px">₹${p.price||0}</div>
            <div class="stock-badge">${p.stock||0} LEFT</div>
          </div>
          <div style="display:flex;gap:6px;margin-top:11px">
            <button onclick="window.CommonDashboard.editProduct('${p._id}')" style="flex:1;background:#0f172a;color:#fff;border:none;padding:9px;border-radius:9px;font-weight:800;font-size:11px">Edit Special</button>
            <button onclick="window.CommonDashboard.deleteProduct('${p._id}')" style="width:40px;background:#fff;border:1px solid #fee2e2;color:#ef4444;border-radius:9px"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>`;
  }

  renderProducts(list){
    const c=document.getElementById('productList'); if(!c) return;
    if(!list.length){
      c.innerHTML=`<div class="empty-box"><div style="font-size:48px">🛒</div><h3 style="font-weight:900;margin-top:10px">No products yet</h3><p style="color:#94a3b8;font-size:13px;margin-top:6px">Click <b style="color:#10b981">Quick Add</b></p><button onclick="window.CommonDashboard.goQuickAdd()" class="btn btn-green" style="margin:12px auto 0">Quick Add Products</button></div>`;
      return;
    }
    const specialList = list.filter(p=> this.isSpecialProduct(p));
    const normalList = list.filter(p=>!this.isSpecialProduct(p));
    let html = '';
    if(specialList.length){
      html += `<div style="grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;background:#fff7ed;border:1px solid #fed7aa;padding:10px 12px;border-radius:12px"><b style="font-size:13px">⭐ Special Products</b><span style="font-size:11px;font-weight:800;color:#9a3412">${specialList.length} items</span></div>`;
      html += specialList.map(p=> this.renderSpecialCard(p)).join('');
      if(normalList.length){ html += `<div style="grid-column:1/-1;font-weight:900;font-size:13px;margin-top:6px">All Products</div>`; }
    }
    html += normalList.map(p=> this.renderNormalCard(p)).join('');
    c.innerHTML = html;
  }

  renderLowStock(list){
    const html=!list.length?`<div class="low-ok">✓ All Stock OK</div>`:list.slice(0,10).map(p=>`<div class="low-item"><div><b style="font-size:12px">${p.name}</b><br><small style="color:#92400e;font-size:10px">${p.category||''} • ${p.weight||''}</small></div><span class="low-badge">${p.stock}</span></div>`).join('');
    ['lowStock','lowStockRight','lowStockList'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=html; });
  }

  renderOrders(orders){
    const html=!orders.length?`<div style="text-align:center;padding:16px;color:#94a3b8;font-size:12px"><div style="font-size:24px">📦</div>No live orders - Customer order karega toh 🔔 bajega + Wallet</div>`:orders.map(o=>`<div class="order-item" onclick="window.CommonDashboard.openOrder('${o._id||o.orderId}')"><div><b style="font-size:12px">#${(o.orderId||o._id||'').toString().slice(-6).toUpperCase()}</b><br><span style="font-size:10px;color:#64748b">${o.items?.length||1} items • ₹${o.totalAmount||o.total||0} • ${o.buyerRole||'Customer'} • Earn: ₹${o.supplierEarning||''}</span></div><span class="order-status" style="background:${this.getStatusColor(o.status)}">${(o.status||'PLACED').toUpperCase()}</span></div>`).join('');
    ['recentOrders','liveOrdersRight'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=html; });
  }

  getStatusColor(status){ const map={placed:'#0ea5e9',confirmed:'#8b5cf6',preparing:'#f59e0b',out_for_delivery:'#10b981',delivered:'#059669',cancelled:'#ef4444'}; return map[(status||'').toLowerCase()]||'#64748b'; }
  showLoader(show){ const el=document.getElementById('loader'); if(el) el.style.display=show?'grid':'none'; }
  showErrorInGrid(msg){ const c=document.getElementById('productList'); if(c) c.innerHTML=`<div style="grid-column:1/-1;padding:20px;color:#ef4444;background:#fef2f2;border:1px solid #fee2e2;border-radius:12px"><b>Error:</b> ${msg}</div>`; }
  showErrorPage(title,message){ document.body.innerHTML=`<div style="height:100vh;display:grid;place-items:center;font-family:Outfit;text-align:center;padding:20px;background:#f8fafc"><div style="background:#fff;padding:32px;border-radius:24px;box-shadow:0 20px 40px rgba(0,0,0,.08);max-width:420px"><div style="font-size:20px;font-weight:900;letter-spacing:1px">SAMANLIVE</div><div style="font-size:48px;margin-top:10px">⚠️</div><h2 style="font-weight:900;margin:12px 0">${title}</h2><p style="color:#64748b;font-size:13px">${message}</p><a href="/" style="display:block;margin-top:16px;background:#0f172a;color:#fff;padding:12px;border-radius:12px;text-decoration:none;font-weight:800">Go Home</a></div></div>`; }
  toast(msg){ const t=document.getElementById('toast'); if(!t) return; t.innerText=msg; t.style.display='block'; setTimeout(()=>t.style.display='none',3000); }
  playSoundCommon(){ try{ const audio=document.getElementById('newOrderSound'); if(audio){ audio.volume=0.8; audio.play().catch(()=>{}); } if(window.DashboardCore?.playOrderSound) window.DashboardCore.playOrderSound(); }catch(e){} }
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

  openOrder(orderId){ this.openCommon(`./orders/order-detail.html?shopId=${this.shopId}&orderId=${orderId}&shopType=${this.shopType}&role=shop_owner`); }
  startAutoRefresh(){ this.stopAutoRefresh(); this.refreshInterval=setInterval(()=>{ this.loadOrdersCommon(); this.loadStatsCommon(); this.loadWallet(); },30000); }
  stopAutoRefresh(){ if(this.refreshInterval) clearInterval(this.refreshInterval); }
}

window.CommonDashboard = new CommonDashboardCore();
window.commonDashboard = window.CommonDashboard;
window.deleteProduct = (id)=> window.CommonDashboard.deleteProduct(id);
window.editProduct = (id)=> window.CommonDashboard.editProduct(id);
window.goForm = ()=> window.CommonDashboard.goProductForm();
window.goQuick = ()=> window.CommonDashboard.goQuickAdd();
window.toggleShop = ()=> { const sw=document.getElementById('toggleSwitch'); if(sw) sw.click(); };
setTimeout(()=>{ const l=document.getElementById('loader'); if(l) l.style.display='none'; window.CommonDashboard?.checkCommonConnection(); window.CommonDashboard?.toast('✅ SAMANLIVE Dashboard V18 Hierarchy Ready - Wallet + Socket + Bulk Buy'); }, 900);