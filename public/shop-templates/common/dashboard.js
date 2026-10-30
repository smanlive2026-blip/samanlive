// LOCATION: public/shop-templates/common/dashboard.js - V20 WORLD MASTER - 50 MODES - AREA MANAGER SAFE - COMMON CONNECTED - FULL CODE - NO CUT
class CommonDashboardCoreV20 {
  constructor(){
    const params = new URLSearchParams(location.search);
    this.shopId = params.get('shopId') || localStorage.getItem('last_shopId') || '';
    this.shopType = (params.get('shopType') || params.get('type') || window.CURRENT_SHOP_TYPE || localStorage.getItem('shopType') || 'kirana').toLowerCase();
    if(!params.get('shopType')){
      const m = location.pathname.match(/\/shop-templates\/([^\/]+)\//);
      if(m) this.shopType = m[1].toLowerCase();
    }
    this.shopType = this.shopType.trim();
    this.mode = window.getModeForShop ? window.getModeForShop(this.shopType) : (window.SHOP_MODES ? window.SHOP_MODES['retail'] : {id:'retail',name:'Retail',icon:'🛒',color:'#10b981',tabs:['products','orders','finance'],fields:[]});
    this.shopData = null;
    this.allProducts = [];
    this.filteredProducts = [];
    this.worldProducts = [];
    this.stats = null;
    this.orders = [];
    this.lowStock = [];
    this.isLoading = false;
    this.currentTab = 'overview';
    this.searchDebounce = null;
    this.refreshInterval = null;
    this.wallet = { balance:0, totalEarning:0 };
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
      shopInfo: `/api/common/profile/${this.shopId}`,
      shopDetail: `/api/shops/${this.shopType}/${this.shopId}`
    };
    console.log(`🚀 V20 WORLD - shopId:${this.shopId} shopType:${this.shopType} mode:${this.mode.id} icon:${this.mode.icon} color:${this.mode.color}`);
    this.init();
  }

  async init(){
    if(!this.shopId){
      this.showErrorPage('Shop ID Missing','Dashboard My Shops / Area Manager se kholo - URL me ?shopId=YOUR_ID chahiye - Area Manager ko koi problem nahi ayegi');
      return;
    }
    localStorage.setItem('last_shopId', this.shopId);
    localStorage.setItem('shopType', this.shopType);
    localStorage.setItem('role','dashboard');
    localStorage.setItem('shopId', this.shopId);
    window.shopId = this.shopId;
    window.shopType = this.shopType;
    window.MY_SHOP_ID = this.shopId;
    window.CURRENT_SHOP_TYPE = this.shopType;
    window.CURRENT_MODE = this.mode;
    window.USER_ROLE = 'shop_owner';

    this.bindUI();
    this.bindTabs();
    this.bindSearch();
    this.bindToggles();
    this.bindSocket();
    this.bindCommonModules();

    await this.loadDashboard();
    await this.loadWallet();
    await this.loadAdminProducts();
    await this.loadAreaInfo();
    this.startAutoRefresh();
    this.hideLoader();
  }

  showErrorPage(title, msg){
    document.body.innerHTML = `<div style="height:100vh;display:grid;place-items:center;font-family:Outfit,sans-serif;text-align:center;padding:20px;background:#f8fafc"><div style="background:#fff;padding:32px;border-radius:24px;box-shadow:0 20px 40px rgba(0,0,0,.08);max-width:400px"><div style="font-size:48px">⚠️</div><h2 style="font-weight:900;margin:12px 0">${title}</h2><p style="color:#64748b;font-size:13px;line-height:1.5">${msg}</p><div style="margin-top:16px;display:grid;gap:8px"><a href="/profile.html" style="display:block;background:#0f172a;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:800">My Shops</a><a href="/area-manager.html" style="display:block;background:#f1f5f9;color:#0f172a;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:800">Area Manager</a></div></div></div>`;
  }

  hideLoader(){ const l=document.getElementById('loader'); if(l) l.style.display='none'; }

  bindUI(){
    const $ = (id)=> document.getElementById(id);
    $('newProductBtn')?.addEventListener('click', ()=> this.goProductForm());
    $('quickAddBtn')?.addEventListener('click', ()=> this.goQuickAdd());
    $('btnLogout')?.addEventListener('click', ()=> this.logout());
    $('viewShopBtn')?.addEventListener('click', ()=> this.viewShop());
    $('viewShopBtn2')?.addEventListener('click', ()=> this.viewShop());
    $('universalFormBtn')?.addEventListener('click', ()=> this.goProductForm());
    $('btnMenu')?.addEventListener('click', (e)=>{
      e.preventDefault(); e.stopPropagation();
      document.getElementById('sidebar')?.classList.toggle('open');
      document.getElementById('sidebarOverlay')?.classList.toggle('show');
    });
    $('sidebarOverlay')?.addEventListener('click', ()=>{
      document.getElementById('sidebar')?.classList.remove('open');
      $('sidebarOverlay')?.classList.remove('show');
    });
    $('btnOpenProfile')?.addEventListener('click', ()=> this.openProfile());
    $('btnWallet1')?.addEventListener('click', ()=> this.openWallet());
    $('btnLowStock')?.addEventListener('click', ()=> this.openLowStock());
    $('btnBulkBuy')?.addEventListener('click', ()=> this.openBulkBuy());
    if($('shopIdDisplay')){ $('shopIdDisplay').innerText = this.shopId.slice(0,22)+'...'; $('shopIdDisplay').title = this.shopId; }
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
        const tabEl = document.getElementById('tab-'+tab) || document.getElementById('tab-'+tab.replace('_','-')) || document.getElementById('tab-overview');
        if(tabEl) tabEl.classList.add('active');
        await this.loadTabData(tab);
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebarOverlay')?.classList.remove('show');
      });
    });
  }

  bindSearch(){
    const input = document.getElementById('searchInput');
    if(!input) return;
    input.addEventListener('input', (e)=>{
      clearTimeout(this.searchDebounce);
      this.searchDebounce = setTimeout(()=>{
        const q = e.target.value.toLowerCase().trim();
        if(!q){ this.filteredProducts = this.allProducts; }
        else { this.filteredProducts = this.allProducts.filter(p=> (p.name||'').toLowerCase().includes(q) || (p.category||'').toLowerCase().includes(q) || (p.brand||'').toLowerCase().includes(q)); }
        this.renderProducts(this.filteredProducts);
      }, 300);
    });
  }

  bindToggles(){
    const toggle = document.getElementById('shopToggle');
    if(!toggle) return;
    toggle.addEventListener('click', async ()=>{
      const switchEl = document.getElementById('toggleSwitch');
      const textEl = document.getElementById('toggleText');
      const dot = document.getElementById('toggleDot');
      const isOn = switchEl?.classList.contains('on');
      const newState = !isOn;
      try{
        await fetch(`/api/common/shop-toggle/${this.shopId}`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ isOpen: newState, shopType: this.shopType, businessMode: this.mode.id })}).then(r=>r.json());
        if(switchEl){ switchEl.classList.toggle('on', newState); switchEl.classList.toggle('off', !newState); switchEl.style.background = newState ? '#22c55e' : '#ef4444'; }
        if(dot){ dot.style.transform = newState ? 'translateX(20px)' : 'translateX(0)'; }
        if(textEl) textEl.textContent = newState ? 'Open' : 'Closed';
        this.showToast(newState ? `✅ ${this.mode.name} Opened` : `❌ ${this.mode.name} Closed`);
      }catch(e){ console.error('toggle failed', e); this.showToast('Toggle failed: '+e.message); }
    });
  }

  bindSocket(){
    try{
      if(typeof io === 'undefined'){ console.log('Socket.IO not loaded'); return; }
      const socket = io('/', { query: { shopId: this.shopId, shopType: this.shopType, mode: this.mode.id } });
      window.shopSocket = socket;
      socket.on('connect', ()=>{ console.log(`✅ Socket connected for ${this.shopId} mode:${this.mode.id} icon:${this.mode.icon}`); socket.emit('join-shop', this.shopId); if(this.shopData?.areaCode) socket.emit('join-area', this.shopData.areaCode); });
      socket.on('new-order', (order)=>{
        console.log('🔔 NEW ORDER for mode', this.mode.id, order);
        const badge = document.getElementById('newOrderCount') || document.getElementById('newOrderBadge');
        if(badge){ badge.style.display='block'; const cur = parseInt(badge.textContent||'0')+1; badge.textContent = cur>9 ? '9+' : cur.toString(); }
        let msg = `🔔 New ${this.mode.id==='food'?'Table Order':this.mode.id==='service'?'Appointment':this.mode.id==='healthcare'?'Patient':this.mode.id==='rental'?'Booking':'Order'}: ${order.orderId||order._id||'New'} - ₹${order.totalAmount||order.total||0}`;
        this.showToast(msg);
        this.loadWallet();
        this.loadOrders();
      });
      socket.on('shop-status-changed', (data)=>{ console.log('Shop status changed', data); });
      socket.on('disconnect', (reason)=>{ console.log('Socket disconnected', reason); });
    }catch(e){ console.log('Socket bind skip', e.message); }
  }

  bindCommonModules(){
    const $ = (id)=> document.getElementById(id);
    $('btnCoupons')?.addEventListener('click', (e)=>{ e.preventDefault(); this.openCommon(`../common/marketing/coupons.html?shopId=${this.shopId}&shopType=${this.shopType}&mode=${this.mode.id}`); });
    $('btnStaff')?.addEventListener('click', (e)=>{ e.preventDefault(); this.openCommon(`../common/staff/staff-list.html?shopId=${this.shopId}&shopType=${this.shopType}&mode=${this.mode.id}`); });
    $('btnDelivery')?.addEventListener('click', (e)=>{ e.preventDefault(); this.openCommon(`../common/delivery/delivery-status.html?shopId=${this.shopId}&shopType=${this.shopType}&mode=${this.mode.id}`); });
    $('btnReviews')?.addEventListener('click', (e)=>{ e.preventDefault(); this.openCommon(`../common/reviews/reviews.html?shopId=${this.shopId}&shopType=${this.shopType}&mode=${this.mode.id}`); });
  }

  async loadDashboard(){
    if(this.isLoading) return;
    this.isLoading = true;
    try{
      let shopRes = {};
      try{ shopRes = await fetch(`/api/shops/${this.shopType}/${this.shopId}?t=${Date.now()}`).then(r=>r.json()); }catch(e){ try{ shopRes = await fetch(`/api/common/profile/${this.shopId}?t=${Date.now()}`).then(r=>r.json()); }catch(e2){} }
      this.shopData = shopRes.shop || shopRes.data || shopRes;
      if(this.shopData && this.shopData.shopName){
        const set = (id, txt)=>{ const el=document.getElementById(id); if(el) el.textContent=txt; };
        set('profileShopName', this.shopData.shopName);
        set('profileOwnerName', this.shopData.ownerName || 'Owner');
        set('headerShopName', this.shopData.shopName + ' - ' + this.mode.name);
        set('areaDisplay', this.shopData.areaCode || '-');
        set('bucketDisplay', this.shopData.bucket || '-');
        set('roleDisplay', 'shop_owner');
        if(this.shopData.profilePic || this.shopData.image || this.shopData.logo){
          const img=document.getElementById('profilePhoto');
          if(img) img.src = this.shopData.profilePic || this.shopData.image || this.shopData.logo;
        }
        const isOpen = this.shopData.isOpen !== false;
        const switchEl = document.getElementById('toggleSwitch');
        const dot = document.getElementById('toggleDot');
        const textEl = document.getElementById('toggleText');
        if(switchEl){ switchEl.classList.toggle('on', isOpen); switchEl.classList.toggle('off', !isOpen); switchEl.style.background = isOpen ? '#22c55e' : '#ef4444'; }
        if(dot){ dot.style.transform = isOpen ? 'translateX(20px)' : 'translateX(0)'; }
        if(textEl) textEl.textContent = isOpen ? 'Open' : 'Closed';
      }
      await this.loadProducts();
      await this.loadOrders();
    }catch(e){ console.error('loadDashboard failed', e); }
    finally{ this.isLoading=false; }
  }

  async loadAreaInfo(){
    try{
      if(!this.shopData?.areaCode) return;
      const areaRes = await fetch(`/api/areas/${this.shopData.areaCode}?t=${Date.now()}`).then(r=>r.json()).catch(()=>({}));
      if(areaRes.area || areaRes.data){
        const area = areaRes.area || areaRes.data;
        const set = (id, txt)=>{ const el=document.getElementById(id); if(el) el.textContent=txt; };
        set('areaDisplay', area.areaCode || this.shopData.areaCode);
      }
    }catch(e){}
  }

  async loadProducts(){
    try{
      let products = [];
      if(window.WorldProductManager){
        const mgr = new window.WorldProductManager();
        mgr.shopId = this.shopId;
        mgr.shopType = this.shopType;
        products = await mgr.getProducts({ shopId: this.shopId, shopType: this.shopType });
      } else {
        const url = `/api/world-products?shopId=${this.shopId}&shopType=${this.shopType}&role=dashboard&t=${Date.now()}`;
        const res = await fetch(url).then(r=>r.json()).catch(()=>({data:[]}));
        products = res.data || res.products || [];
      }
      this.allProducts = products;
      this.filteredProducts = products;
      this.renderProducts(products);
      const countEl = document.getElementById('menuProdCount');
      if(countEl) countEl.textContent = products.length;
      const statProd = document.getElementById('statProducts');
      if(statProd) statProd.textContent = products.length;
      const lowStock = products.filter(p=> (p.stock||0) < 5).length;
      const statLow = document.getElementById('statLowStock');
      if(statLow) statLow.textContent = lowStock;
    }catch(e){ console.error('loadProducts failed', e); }
  }

  renderProducts(products){
    const grid = document.getElementById('productGrid') || document.getElementById('productGrid2');
    if(!grid) return;
    if(!products || products.length===0){
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#94a3b8"><div style="font-size:48px">${this.mode.icon}</div><p style="font-weight:900;margin:12px 0;font-size:16px">No ${this.mode.name} yet</p><p style="font-size:12px;color:#64748b;margin-bottom:16px">Mode: ${this.mode.id} | Shop: ${this.shopType}</p><button onclick="document.getElementById('newProductBtn').click()" style="background:${this.mode.color};color:#fff;border:0;padding:12px 20px;border-radius:10px;font-weight:900;cursor:pointer;box-shadow:0 8px 20px ${this.mode.color}40"><i class="fa-solid fa-plus"></i> Add ${this.mode.id==='food'?'Menu Item':this.mode.id==='service'?'Service':this.mode.id==='healthcare'?'Patient/Appointment':this.mode.id==='rental'?'Rental Item':this.mode.id==='mandi'?'Mandi Item':'Product'}</button><p style="margin-top:12px;font-size:11px;color:#94a3b8">Quick Add se ${this.shopType} ke ready ${this.mode.name} add karo</p></div>`;
      return;
    }
    grid.innerHTML = products.map(p=>{
      const img = p.thumbnail || p.image || (Array.isArray(p.images)?(p.images[0]?.url||p.images[0]):'') || 'https://placehold.co/200x200/f1f5f9/64748b?text=Product';
      const price = p.price || p.sellingPrice || 0;
      const stock = p.stock || 0;
      const low = stock < 5;
      let extraInfo = '';
      if(this.mode.id==='fashion'){ const size = p.extraData?.size || p.size || '-'; const color = p.extraData?.color || p.color || '-'; extraInfo = `<small style="color:${this.mode.color};font-weight:700;font-size:11px">Size: ${size} | Color: ${color}</small>`; }
      else if(this.mode.id==='food'){ const veg = p.extraData?.veg !== false; extraInfo = `<small style="color:${veg?'#16a34a':'#dc2626'};font-weight:800;font-size:11px">${veg?'🟢 Veg':'🔴 Non-Veg'} | ${p.extraData?.prepTime||10} min | ${p.extraData?.category||'General'}</small>`; }
      else if(this.mode.id==='mandi'){ const rate = p.extraData?.ratePerKg || price; const weight = p.extraData?.weight || p.weight || ''; extraInfo = `<small style="color:#16a34a;font-weight:800;font-size:11px">₹${rate}/kg ${weight? '| '+weight : ''}</small>`; }
      else if(this.mode.id==='service'){ extraInfo = `<small style="color:#f97316;font-weight:700;font-size:11px">${p.category||'Service'} | ${stock>0?'Available':'Busy'}</small>`; }
      else if(this.mode.id==='healthcare'){ extraInfo = `<small style="color:#06b6d4;font-weight:700;font-size:11px">${p.category||'Medicine'} | Stock: ${stock}</small>`; }
      else { extraInfo = `<small style="color:#64748b;font-size:11px">${p.category||this.shopType} • ${stock} in stock • ${p.brand||'Local'}</small>`; }

      return `<div class="p-card" onclick="window.CDCORE.viewProduct('${p._id}')">
        <img src="${img}" alt="${p.name||'Product'}" loading="lazy" onerror="this.src='https://placehold.co/200x200/f1f5f9/64748b?text=No+Img'" style="width:100%;height:140px;object-fit:cover;background:#f8fafc">
        <div style="padding:10px"><b style="font-size:13px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3">${p.name||'Product'}</b>${extraInfo}<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><span style="font-weight:900;font-size:14px;color:#0f172a">₹${price}</span><span style="font-size:10px;padding:3px 7px;border-radius:20px;font-weight:900;background:${low?'#fee2e2;color:#991b1b':'#dcfce7;color:#166534'}">${low?'LOW':stock+' LEFT'}</span></div><div style="display:flex;gap:6px;margin-top:10px"><button onclick="event.stopPropagation(); window.CDCORE.editProduct('${p._id}')" style="flex:1;background:#0f172a;color:#fff;border:0;padding:7px;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer;display:flex;gap:4px;align-items:center;justify-content:center"><i class="fa-solid fa-pen" style="font-size:10px"></i> Edit</button><button onclick="event.stopPropagation(); window.CDCORE.deleteProduct('${p._id}')" style="background:#fee2e2;color:#dc2626;border:0;padding:7px 10px;border-radius:8px;cursor:pointer"><i class="fa-solid fa-trash" style="font-size:11px"></i></button></div></div>
      </div>`;
    }).join('');
  }

  async loadOrders(){
    try{
      const url = `/api/common/orders/${this.shopId}?limit=10&t=${Date.now()}`;
      const res = await fetch(url).then(r=>r.json()).catch(()=>({orders:[]}));
      const orders = res.orders || res.data || [];
      this.orders = orders;
      const container = document.getElementById('recentOrders');
      if(!container) return;
      if(orders.length===0){
        container.innerHTML = `<div style="text-align:center;padding:30px;color:#94a3b8"><div style="font-size:32px">${this.mode.icon}</div><p style="font-weight:800;margin-top:8px">No ${this.mode.id==='food'?'Table Orders':this.mode.id==='service'?'Appointments':this.mode.id==='rental'?'Bookings':'Orders'} yet</p><small style="color:#64748b">Live orders yahan ayenge - Socket connected</small></div>`;
        const statOrders = document.getElementById('statOrders'); if(statOrders) statOrders.textContent = '0';
        return;
      }
      container.innerHTML = orders.map(o=>`<div style="background:#fff;border:1px solid #f1f5f9;border-radius:12px;padding:12px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;box-shadow:0 2px 8px rgba(0,0,0,.03)"><div><b style="font-size:13px">#${o.orderId||o._id?.toString().slice(-6)||'Order'}</b><br><span style="font-size:11px;color:#64748b">${o.items?.length||1} items • ₹${o.total||o.totalAmount||0} • ${o.buyerRole||'customer'}</span><br><span style="font-size:10px;color:#94a3b8">${new Date(o.createdAt||Date.now()).toLocaleString()}</span></div><span style="background:${this.getStatusColor(o.status)};color:#fff;font-size:10px;font-weight:900;padding:4px 8px;border-radius:20px">${(o.status||'PLACED').toUpperCase()}</span></div>`).join('');
      const statOrders = document.getElementById('statOrders'); if(statOrders) statOrders.textContent = orders.length;
    }catch(e){ console.error('loadOrders failed', e); }
  }

  getStatusColor(status){
    const map = {placed:'#0ea5e9',confirmed:'#8b5cf6',preparing:'#f59e0b',ready:'#10b981',delivered:'#16a34a',cancelled:'#ef4444',pending:'#64748b'};
    return map[(status||'placed').toLowerCase()] || '#0ea5e9';
  }

  async loadWallet(){
    try{
      const res = await fetch(`/api/common/wallet/balance?userId=${this.shopId}&role=shop_owner&shopId=${this.shopId}&t=${Date.now()}`).then(r=>r.json()).catch(()=>({}));
      if(res.success || res.balance!==undefined || res.data){
        const bal = res.balance || res.data?.balance || res.data?.totalEarning || 0;
        const earn = res.totalEarning || res.data?.totalEarning || bal;
        const set = (id, val)=>{ const el=document.getElementById(id); if(el) el.textContent = `₹${val}`; };
        set('walletBalance', bal); set('walletBalance2', bal); set('menuWallet', bal); set('totalEarning', earn); set('totalEarning2', earn);
        const short = document.getElementById('walletShort'); if(short) short.textContent = `Wallet: ₹${bal} | Earn: ₹${earn}`;
        const statRev = document.getElementById('statRevenue'); if(statRev) statRev.textContent = `₹${earn}`;
      }
    }catch(e){}
  }

  async loadAdminProducts(){
    try{
      const container = document.getElementById('worldProducts');
      if(!container) return;
      container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:20px;color:#94a3b8"><i class="fa-solid fa-spinner fa-spin"></i> Loading admin ${this.mode.name}...</div>`;
      const url = `/api/world-products?shopType=${this.shopType}&role=admin&limit=50&t=${Date.now()}`;
      const res = await fetch(url).then(r=>r.json()).catch(()=>({data:[]}));
      let products = res.data || res.products || [];
      products = products.filter(p=> p.shopId !== this.shopId);
      if(products.length===0){ container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:20px;color:#94a3b8"><div style="font-size:32px">📦</div><p>No admin ${this.mode.name} for ${this.shopType}</p><small>Area Manager ya Admin se products ayenge</small></div>`; return; }
      this.worldProducts = products;
      container.innerHTML = products.slice(0,20).map(p=>`<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:10px;transition:.2s"><img src="${p.thumbnail||p.image||'https://placehold.co/200'}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;background:#f8fafc"><b style="font-size:12px;display:block;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</b><div style="font-size:11px;color:#64748b;margin-top:2px">₹${p.price||0} • Stock: ${p.stock||0} • ${p.brand||'Admin'}</div><button onclick="window.CDCORE.buyFromAdmin('${p._id}')" style="width:100%;margin-top:8px;background:${this.mode.color};color:#fff;border:0;padding:7px;border-radius:8px;font-size:11px;font-weight:900;cursor:pointer;box-shadow:0 4px 12px ${this.mode.color}30"><i class="fa-solid fa-cart-plus"></i> Buy & Add to My Shop</button></div>`).join('');
    }catch(e){ console.error('loadAdminProducts failed', e); }
  }

  async loadTabData(tab){
    if(tab==='products') this.renderProducts(this.filteredProducts);
    if(tab==='orders') this.loadOrders();
    if(tab==='bulk_buy') this.loadAdminProducts();
    if(tab==='finance') this.loadWallet();
    if(tab==='inventory') this.loadLowStock();
  }

  async loadLowStock(){
    const container = document.getElementById('lowStockList');
    if(!container) return;
    const low = this.allProducts.filter(p=> (p.stock||0) < 5);
    if(low.length===0){ container.innerHTML = `<div style="text-align:center;padding:20px;color:#10b981;font-weight:800"><i class="fa-solid fa-check-circle" style="font-size:24px"></i><p style="margin-top:8px">✅ All ${this.mode.name} stock OK</p></div>`; return; }
    container.innerHTML = low.map(p=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border-bottom:1px solid #f8fafc"><span style="font-size:13px;font-weight:600">${p.name}</span><span style="background:#fee2e2;color:#991b1b;font-size:11px;font-weight:900;padding:3px 8px;border-radius:20px">${p.stock||0} LEFT - LOW</span></div>`).join('');
  }

  goProductForm(){ window.open(`/shop-templates/${this.shopType}/product-form.html?shopId=${this.shopId}&shopType=${this.shopType}&mode=${this.mode.id}`,'_blank'); }
  goQuickAdd(){ window.open(`/shop-templates/${this.shopType}/quick-add.html?shopId=${this.shopId}&shopType=${this.shopType}&mode=${this.mode.id}`,'_blank'); }
  viewShop(){ window.open(`/shop-templates/${this.shopType}/customer-view.html?shopId=${this.shopId}&shopType=${this.shopType}&mode=${this.mode.id}&supplierId=${this.shopId}&supplierRole=shop_owner`,'_blank'); }
  openProfile(){ this.openCommon(`../common/profile/profile.html?shopId=${this.shopId}&shopType=${this.shopType}&mode=${this.mode.id}`); }
  openWallet(){ this.openCommon(`../common/finance/wallet.html?shopId=${this.shopId}&shopType=${this.shopType}&mode=${this.mode.id}`); }
  openLowStock(){ document.querySelector('.menu a[data-tab="inventory"]')?.click(); }
  openBulkBuy(){ document.querySelector('.menu a[data-tab="bulk_buy"]')?.click(); }
  openCommon(url){ window.open(url, '_blank'); }
  logout(){ if(window.AuthCore?.logout){ window.AuthCore.logout(); } else { localStorage.clear(); location.href='/'; } }
  viewProduct(id){ const p=this.allProducts.find(x=>x._id===id); if(p) alert(`${p.name}\nPrice: ₹${p.price}\nStock: ${p.stock}\nMode: ${this.mode.id}\nShop: ${this.shopType}\n\nEdit karne ke liye Edit button dabao`); }
  showToast(msg){ const t=document.getElementById('toast'); if(!t) return; t.textContent=msg; t.style.display='block'; setTimeout(()=> t.style.display='none', 3500); }

  async editProduct(id){
    const p=this.allProducts.find(x=>x._id===id); if(!p){ alert('Product not found'); return; }
    const newPrice = prompt(`Edit price for ${p.name} (${this.mode.name})\nCurrent: ₹${p.price}\nMode: ${this.mode.id}`, p.price);
    if(newPrice===null) return;
    const price = parseFloat(newPrice);
    if(isNaN(price) || price<0){ alert('Invalid price'); return; }
    try{
      const res = await fetch(`/api/world-products/${id}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ price, shopId: this.shopId, shopType: this.shopType, businessMode: this.mode.id })}).then(r=>r.json());
      if(res.success){ this.showToast('✅ Updated - '+this.mode.name); this.loadProducts(); } else alert('Failed: '+(res.message||'error'));
    }catch(e){ alert('Error: '+e.message); }
  }

  async deleteProduct(id){
    if(!confirm(`Delete this ${this.mode.name}? Mode: ${this.mode.id}`)) return;
    try{
      const res = await fetch(`/api/world-products/${id}`, {method:'DELETE'}).then(r=>r.json());
      if(res.success){ this.showToast('🗑️ Deleted - '+this.mode.name); this.loadProducts(); } else alert('Failed');
    }catch(e){ alert(e.message); }
  }

  async buyFromAdmin(id){
    try{
      const p=this.worldProducts.find(x=>x._id===id); if(!p) return alert('Product not found');
      if(!confirm(`Buy ${p.name} for ₹${p.price}?\nMode: ${this.mode.name}\nIt will be added to your shop ${this.shopType}.\nArea Manager safe.`)) return;
      const newProd = { ...p, shopId: this.shopId, shopType: this.shopType, businessMode: this.mode.id, originalProductId: p._id, isActive: true, stock: 50 };
      delete newProd._id; delete newProd.__v; delete newProd.createdAt; delete newProd.updatedAt;
      const res = await fetch('/api/world-products', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(newProd)}).then(r=>r.json());
      if(res.success){ alert(`✅ Added to your ${this.mode.name} shop - ${this.shopType}`); this.loadProducts(); } else alert('Failed: '+(res.message||'')); 
    }catch(e){ alert(e.message); }
  }

  startAutoRefresh(){
    if(this.refreshInterval) clearInterval(this.refreshInterval);
    this.refreshInterval = setInterval(()=>{ this.loadProducts(); this.loadWallet(); this.loadOrders(); }, 30000);
  }
}

window.CommonDashboardCoreV20 = CommonDashboardCoreV20;
window.CDCORE = null;
document.addEventListener('DOMContentLoaded', ()=>{
  setTimeout(()=>{
    window.CDCORE = new CommonDashboardCoreV20();
  }, 300);
});