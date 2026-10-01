// LOCATION: public/shop-templates/mobile/dashboard.js
// MOBILE DASHBOARD JS - BRIDGE CONNECTED - ALL COMMON MODULES USED

class MobileDashboard {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('shopId') || 'mobile_'+Date.now();
    localStorage.setItem('shopId', this.shopId);
    this.products = [];
    this.orders = [];
    this.socket = null;
    this.filter = 'all';
  }

  async init(){
    console.log("📱 Mobile Dashboard Init - Bridge:", typeof SAMAN!=='undefined'?'✅ Loaded':'❌ Not loaded, manual fallback');

    // Load from storage
    this.products = JSON.parse(localStorage.getItem(`products_${this.shopId}`)||'[]');
    if(this.products.length===0){
      this.products = this.getReadyProducts();
      localStorage.setItem(`products_${this.shopId}`, JSON.stringify(this.products));
    }

    this.orders = JSON.parse(localStorage.getItem(`orders_${this.shopId}`)||'[]');

    // Use common modules if available
    await this.initCommonModules();

    this.renderProducts(this.products);
    this.renderOrders(this.orders);
    this.updateStats();
    this.initSocket();
    this.bindEvents();
    this.checkShopStatus();
  }

  getReadyProducts(){
    return [
      { id:'m1', name:'iPhone 15 Pro Max 256GB', category:'smartphone', brand:'Apple', price:134900, originalPrice:159900, stock:5, image:'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300', ram:'8GB', storage:'256GB', color:'Natural Titanium', warranty:'1 Year', emi:true, imei:'', barcode:'' },
      { id:'m2', name:'Samsung Galaxy S24 Ultra 512GB', category:'smartphone', brand:'Samsung', price:129999, originalPrice:139999, stock:8, image:'https://images.unsplash.com/photo-1610945265064-0e34e730d4d0?w=300', ram:'12GB', storage:'512GB', color:'Titanium Black', warranty:'1 Year', emi:true },
      { id:'m3', name:'OnePlus 12R 256GB', category:'smartphone', brand:'OnePlus', price:42999, originalPrice:49999, stock:12, image:'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300', ram:'16GB', storage:'256GB', color:'Iron Gray', warranty:'1 Year', emi:true },
      { id:'m4', name:'Redmi Note 13 Pro 256GB', category:'smartphone', brand:'Xiaomi', price:24999, originalPrice:29999, stock:20, image:'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300', ram:'12GB', storage:'256GB', color:'Midnight Black', warranty:'1 Year', emi:true },
      { id:'m5', name:'Vivo V30 Pro 256GB', category:'smartphone', brand:'Vivo', price:41999, originalPrice:46999, stock:6, image:'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300', ram:'12GB', storage:'256GB', color:'Peacock Green', warranty:'1 Year', emi:true },
      { id:'m6', name:'AirPods Pro 2nd Gen', category:'accessories', brand:'Apple', price:24900, originalPrice:26900, stock:15, image:'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=300', warranty:'1 Year' },
      { id:'m7', name:'Samsung Galaxy Watch 6', category:'accessories', brand:'Samsung', price:29999, originalPrice:32999, stock:10, image:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300', warranty:'1 Year' },
      { id:'m8', name:'Nokia 105 Feature Phone', category:'feature', brand:'Nokia', price:1499, originalPrice:1999, stock:30, image:'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=300', warranty:'1 Year' }
    ];
  }

  async initCommonModules(){
    try{
      // Use common modules if bridge loaded
      if(typeof SAMAN!=='undefined'){
        console.log("✅ Common modules available:", Object.keys(SAMAN));

        // Analytics - common/analytics/analytics.js
        if(window.AnalyticsCore){
          await window.AnalyticsCore.init();
        }

        // Wallet - common/wallet/wallet.js
        if(window.WalletCore){
          await window.WalletCore.init();
        }

        // Inventory - common/inventory/inventory.js
        if(window.InventoryCore){
          await window.InventoryCore.init();
        }

        // Search - common/js/search.js
        if(window.SearchCore){
          await window.SearchCore.init();
        }

        // Filter - common/js/filter.js
        if(window.FilterCore){
          window.FilterCore.products = this.products;
        }

        // Shop Toggle - common/js/shop-toggle.js
        if(window.ShopToggle){
          await window.ShopToggle.init();
        }

        // Share - common/js/share.js
        if(window.ShareCore){
          console.log("✅ ShareCore ready - common/share/whatsapp-share.js + qr-share.js");
        }

        // Notifications - common/notifications/notifications.js
        if(window.NotificationsCore){
          await window.NotificationsCore.init();
          this.updateNotifBadge();
        }

        // Reviews - common/reviews/reviews.js
        if(window.ReviewCore){
          await window.ReviewCore.init();
        }

        // Wishlist - common/js/wishlist.js
        if(window.WishlistCore){
          await window.WishlistCore.init();
        }
      }

    }catch(e){ console.log("Common modules fallback", e); }
  }

  renderProducts(productsToRender){
    const grid = document.getElementById('productsGrid');
    const empty = document.getElementById('productsEmpty');
    const count = document.getElementById('productsCount');

    if(!grid) return;

    if(count) count.innerText = `${productsToRender.length} products`;

    if(productsToRender.length===0){
      grid.style.display='none';
      if(empty) empty.style.display='block';
      return;
    }

    grid.style.display='grid';
    if(empty) empty.style.display='none';

    grid.innerHTML = productsToRender.map(product=>{
      const stockClass = product.stock===0?'stock-out':product.stock<=3?'stock-low':'stock-in';
      const stockText = product.stock===0?'Out of stock':product.stock<=3?`Only ${product.stock} left`:`${product.stock} in stock`;

      return `
        <div class="product-card" data-product-id="${product.id}" onclick="MobileDashboardInstance.openProduct('${product.id}')">
          <img src="${product.image}" class="product-image" onerror="this.src='https://via.placeholder.com/150?text=📱'">
          <div class="product-actions">
            <button class="product-action" onclick="event.stopPropagation(); MobileDashboardInstance.shareProduct('${product.id}')">📤</button>
            <button class="product-action" onclick="event.stopPropagation(); MobileDashboardInstance.editProduct('${product.id}')">✏️</button>
          </div>
          <div class="product-info">
            <b>${product.name}</b>
            <span>${product.brand||''} • ${product.ram||''} ${product.storage||''} • ${product.color||''}</span>
            <div class="product-price">
              <b>₹${product.price.toLocaleString('en-IN')}</b>
              <span class="stock-badge ${stockClass}">${stockText}</span>
            </div>
            ${product.originalPrice>product.price?`<span style="font-size:10px;color:#94a3b8;text-decoration:line-through">₹${product.originalPrice.toLocaleString('en-IN')}</span>`:''}
            ${product.emi?`<span style="font-size:9px;background:#dcfce7;color:#166534;padding:2px 6px;border-radius:20px;font-weight:700;margin-top:4px;display:inline-block">💳 EMI</span>`:''}
          </div>
        </div>
      `;
    }).join('');

    // Use common product-card.js if available
    if(window.ProductCardCore){
      window.ProductCardCore.render(productsToRender, 'productsGrid');
    }
  }

  renderOrders(ordersToRender){
    const list = document.getElementById('ordersList');
    const empty = document.getElementById('ordersEmpty');
    const count = document.getElementById('ordersCount');

    if(!list) return;

    const today = ordersToRender.filter(o=> new Date(o.createdAt).toDateString()===new Date().toDateString());

    if(count) count.innerText = `${today.length} today • ${ordersToRender.length} total`;

    if(ordersToRender.length===0){
      list.style.display='none';
      if(empty) empty.style.display='block';
      return;
    }

    list.style.display='flex';
    if(empty) empty.style.display='none';

    list.innerHTML = ordersToRender.slice(0,5).map(order=>{
      const isNew = order.status==='pending' && (new Date()-new Date(order.createdAt))<3600000;
      return `
        <div class="order-item ${isNew?'new':''}" onclick="window.location.href='../common/orders/order-detail.html?orderId=${order.orderId}&shopId=${this.shopId}'">
          <div class="order-icon">📦</div>
          <div class="order-info">
            <b>${order.orderId} • ${order.customerName}</b>
            <span>${order.products.map(p=>p.name).join(', ').substring(0,40)} • ${new Date(order.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
          </div>
          <div class="order-price">
            <b>₹${order.total.toLocaleString('en-IN')}</b>
            <span class="order-status status-${order.status}">${order.status}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  updateStats(){
    const todayOrders = this.orders.filter(o=> new Date(o.createdAt).toDateString()===new Date().toDateString());
    const todayRevenue = todayOrders.reduce((sum,o)=> sum+o.total,0);

    const set = (id,val)=>{ const el=document.getElementById(id); if(el) el.innerText=val; };

    set('statOrders', todayOrders.length);
    set('statRevenue', `₹${(todayRevenue/1000).toFixed(1)}k`);
    set('statProducts', this.products.length);
    set('statCustomers', new Set(this.orders.map(o=>o.customerPhone)).size);

    const newOrders = this.orders.filter(o=> o.status==='pending').length;
    const liveBanner = document.getElementById('liveBanner');
    const liveCount = document.getElementById('liveOrdersCount');

    if(liveBanner){
      if(newOrders>0){
        liveBanner.style.display='flex';
        if(liveCount) liveCount.innerText = newOrders;
        liveBanner.onclick = ()=> window.location.href=`../common/live/live-orders.html?shopId=${this.shopId}`;
      } else {
        liveBanner.style.display='none';
      }
    }

    // Low stock warning - uses common/inventory/low-stock-alert.html logic
    const lowStock = this.products.filter(p=> p.stock<=3).length;
    const productsTrend = document.getElementById('productsTrend');
    if(productsTrend && lowStock>0){
      productsTrend.innerText = `⚠️ ${lowStock} low stock`;
      productsTrend.style.background='#fee2e2';
      productsTrend.style.color='#991b1b';
    }
  }

  checkShopStatus(){
    const isOpen = localStorage.getItem(`shop_open_${this.shopId}`)!=='false';
    const toggleBtn = document.getElementById('shopToggleBtn');
    if(toggleBtn){
      if(isOpen){
        toggleBtn.innerText='🟢 Open';
        toggleBtn.className='shop-status-toggle';
      } else {
        toggleBtn.innerText='🔴 Closed';
        toggleBtn.className='shop-status-toggle closed';
      }
    }

    // Use common/js/shop-toggle.js if available
    if(window.ShopToggle){
      window.ShopToggle.isOpen = isOpen;
      window.ShopToggle.updateUI();
    }
  }

  updateNotifBadge(){
    try{
      const notifs = JSON.parse(localStorage.getItem(`notifications_guest_${this.shopId}`)||'[]');
      const unread = notifs.filter(n=>!n.read).length;
      const badge = document.getElementById('notifBadge');
      if(badge){
        if(unread>0){
          badge.innerText = unread>99?'99+':unread;
          badge.style.display='grid';
        } else {
          badge.style.display='none';
        }
      }

      // Use common/notifications/notifications.js
      if(window.NotificationsCore){
        window.NotificationsCore.updateBadge();
      }
    }catch(e){}
  }

  toggleShopStatus(){
    const current = localStorage.getItem(`shop_open_${this.shopId}`)!=='false';
    const newStatus =!current;
    localStorage.setItem(`shop_open_${this.shopId}`, newStatus.toString());
    this.checkShopStatus();
    this.showToast(newStatus?'Shop opened 🟢':'Shop closed 🔴');

    if(this.socket){
      this.socket.emit('shop-status-changed', { shopId:this.shopId, isOpen:newStatus });
    }

    // Use common toggle
    if(window.ShopToggle){
      window.ShopToggle.toggle();
    }
  }

  shareProduct(productId){
    const product = this.products.find(p=> p.id===productId);

    // USE COMMON SHARE - common/share/whatsapp-share.js
    if(window.ShareCore){
      window.ShareCore.shareProductOnWhatsApp(product, { shopId:this.shopId, name:'Mobile World', address:'Surat' });
    } else if(window.WhatsappShare){
      window.WhatsappShare.shareProduct(product, { shopId:this.shopId, name:'Mobile World' });
    } else {
      // Fallback
      const link = `${location.origin}/shop.html?shopId=${this.shopId}&productId=${productId}`;
      const msg = `📱 ${product.name} - ₹${product.price}\n🔗 ${link}\n\nEMI Available 💳 | Exchange Offer 🔄`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    }

    // Track share - common/share/qr-share.js logic
    if(window.ApiCore){
      window.ApiCore.post('/api/common/share/track', { type:'whatsapp_product', shopId:this.shopId, productId, link:`/shop.html?shopId=${this.shopId}&productId=${productId}` }).catch(()=>{});
    }
  }

  shareShop(){
    // USE COMMON SHARE - common/share/shop-link-share.html
    if(window.ShareCore){
      window.ShareCore.shareShopOnWhatsApp({ shopId:this.shopId, name:'Mobile World', address:'Surat' });
    } else {
      const link = `${location.origin}/shop.html?shopId=${this.shopId}`;
      navigator.clipboard.writeText(link);
      this.showToast('Shop link copied 🔗');
    }
  }

  openProduct(productId){
    window.location.href=`product-form.html?shopId=${this.shopId}&productId=${productId}`;
  }

  editProduct(productId){
    window.location.href=`product-form.html?shopId=${this.shopId}&productId=${productId}`;
  }

  openAddProduct(){
    window.location.href=`product-form.html?shopId=${this.shopId}`;
  }

  initSocket(){
    try{
      this.socket = io();

      this.socket.on('connect', ()=>{
        this.socket.emit('join-shop', this.shopId);
        console.log("✅ Mobile shop socket - Connected to common/live/live-orders.html + common/orders/new-order-popup.html");
      });

      this.socket.on('new-order', (data)=>{
        if(data.shopId===this.shopId){
          this.orders.unshift(data.order||data);
          localStorage.setItem(`orders_${this.shopId}`, JSON.stringify(this.orders));
          this.renderOrders(this.orders);
          this.updateStats();
          this.showToast(`🔔 New order! ${data.orderId||''} - ₹${data.total||''}`);

          // Sound - common/orders/new-order-sound.mp3
          try{
            const audio = new Audio('../common/orders/new-order-sound.mp3');
            audio.play().catch(()=>{});
          }catch(e){}

          const liveBanner = document.getElementById('liveBanner');
          if(liveBanner) liveBanner.style.display='flex';

          // Show common new order popup - common/orders/new-order-popup.html
          const popup = document.getElementById('saman-new-order-popup');
          if(popup){
            popup.style.display='block';
            popup.innerHTML = `<div style="background:#fff;padding:20px;border-radius:16px;text-align:center"><b>🔔 New Order!</b><br><span>${data.orderId||''} - ₹${data.total||''}</span><br><button onclick="this.parentElement.parentElement.style.display='none'" style="margin-top:12px;background:#0f172a;color:#fff;border:none;padding:10px 20px;border-radius:20px;font-weight:800">View Order</button></div>`;
          }

          // Use common notification - common/notifications/notifications.js
          if(window.NotificationsCore){
            window.NotificationsCore.sendOrderNotification(data.orderId||data._id, 'pending', data.customerId||'guest', this.shopId);
          }
        }
      });

      this.socket.on('shop-status-changed', (data)=>{
        if(data.shopId===this.shopId){
          this.checkShopStatus();
        }
      });

    }catch(e){ console.log("Socket fallback - common/core/socket-core.js"); }
  }

  bindEvents(){
    document.getElementById('shopToggleBtn')?.addEventListener('click', ()=> this.toggleShopStatus());
    document.getElementById('notifBtn')?.addEventListener('click', ()=> window.location.href=`../common/notifications/notifications.html?shopId=${this.shopId}`);
    document.getElementById('shareBtn')?.addEventListener('click', ()=> this.shareShop());
    document.getElementById('addProductBtn')?.addEventListener('click', ()=> this.openAddProduct());

    document.querySelectorAll('.tab').forEach(tab=>{
      tab.addEventListener('click', ()=>{
        document.querySelectorAll('.tab').forEach(t=> t.classList.remove('active'));
        tab.classList.add('active');
        const filter = tab.dataset.tab;
        let filtered = [...this.products];
        if(filter==='smartphone') filtered = this.products.filter(p=> p.category==='smartphone');
        else if(filter==='feature') filtered = this.products.filter(p=> p.category==='feature');
        else if(filter==='accessories') filtered = this.products.filter(p=> p.category==='accessories');
        else if(filter==='lowstock') filtered = this.products.filter(p=> p.stock<=3);
        else if(filter==='repair'){ this.showToast('Repair - Go to common/delivery/delivery-status.html 🔧', 'info'); return; }
        this.renderProducts(filtered);

        // Use common filter - common/js/filter.js
        if(window.FilterCore){
          window.FilterCore.applyFilters({ category:filter==='all'?'':filter });
        }
      });
    });

    // Use common search - common/js/search.js
    const searchInput = document.getElementById('searchInput');
    if(searchInput){
      searchInput.addEventListener('input', (e)=>{
        const query = e.target.value;
        if(window.SearchCore){
          const results = window.SearchCore.search(query);
          this.renderProducts(results.length>0?results:this.products);
        } else {
          const filtered = this.products.filter(p=> (p.name||'').toLowerCase().includes(query.toLowerCase()) || (p.brand||'').toLowerCase().includes(query.toLowerCase()));
          this.renderProducts(filtered);
        }
      });
    }
  }

  showToast(msg, type='info'){
    const toast = document.getElementById('toast');
    if(!toast){
      console.log("Toast:", msg);
      return;
    }
    toast.innerText = msg;
    toast.className='toast show';
    setTimeout(()=> toast.className='toast', 3000);

    // Use common toast - common/components/toast.html
    if(window.Toast){
      window.Toast.show(msg, type);
    }
  }
}

// Init
window.MobileDashboardInstance = new MobileDashboard();
window.MobileDashboard = window.MobileDashboardInstance;

document.addEventListener('DOMContentLoaded', ()=>{
  // Wait for bridge to load, then init
  setTimeout(()=> window.MobileDashboardInstance.init(), 500);
});

// Global helpers - connected to common
window.openProductDetail = (id)=> window.MobileDashboardInstance.openProduct(id);
window.editProduct = (id)=> window.MobileDashboardInstance.editProduct(id);
window.shareProductBridge = (id)=> window.MobileDashboardInstance.shareProduct(id);
window.openAddProduct = ()=> window.MobileDashboardInstance.openAddProduct();
window.scrollToSection = (id)=> document.getElementById(id)?.scrollIntoView({ behavior:'smooth' });
window.toggleShopStatus = ()=> window.MobileDashboardInstance.toggleShopStatus();