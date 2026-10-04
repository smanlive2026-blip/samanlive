// LOCATION: public/shop-templates/kirana/user-view.js - V16 FINAL WORLD BOSS - COMMON ONLY - WORLD PRODUCT MANAGER V15 CLASS + COMMON MODULES - 1200 LINES - NO KANJUSI - NO FALTU
class KiranaUserViewCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('last_shopId') || '';
    this.shopType = new URLSearchParams(location.search).get('shopType') || 'kirana';
    this.shopData = null;
    this.allProducts = [];
    this.filteredProducts = [];
    this.worldProducts = [];
    this.oldProducts = [];
    this.categories = [];
    this.cart = [];
    this.wishlist = [];
    this.activeCat = 'all';
    this.isShopOpen = true;
    this.role = 'customer';
    this.API_COMMON = {
      cart: `/api/common/cart/${this.shopId}`,
      wishlist: `/api/common/wishlist/${this.shopId}`,
      reviews: `/api/common/reviews/${this.shopId}`,
      toggle: `/api/common/shop-toggle/${this.shopId}/status`
    };
    this.init();
  }

  async init(){
    console.log(`🛍️ KiranaUserViewCore V16 WORLD BOSS - shopId:${this.shopId} shopType:${this.shopType} - WorldProductManager Class:`,!!window.WorldProductManager, 'Role:',window.WorldProductManager?.role||'customer','Common Connected');
    if(!this.shopId){
      this.showError('Shop ID missing - Add?shopId=YOUR_ID - World Model ko shopId chahiye - common/products/product-manager.js V15');
      return;
    }
    localStorage.setItem('last_shopId', this.shopId);
    localStorage.setItem('shopType','kirana');
    localStorage.setItem('role','customer');
    window.shopId = this.shopId;
    window.shopType = 'kirana';

    // BIND - COMMON ONLY
    this.bindUICommon();
    this.bindSocketCommon();
    this.bindShareCommon();
    this.bindSearchCommon();

    // LOAD - WORLD VIA MANAGER CLASS + OLD + COMMON
    await this.loadShop();

    // INIT COMMON MODULES - CART + WISHLIST - COMMON ONLY
    this.initCartCommon();
    this.initWishlistCommon();

    // Track - common/core/api-core.js
    window.ApiCore?.trackEvent('kirana_user_view_v16_world_common', { shopId:this.shopId, shopType:'kirana', worldCount:this.worldProducts.length, role:'customer' });
  }

  // ==================== UI BIND - COMMON ONLY - NO FALTU ====================
  bindUICommon(){
    const $ = (id)=> document.getElementById(id);
    $('searchInput')?.addEventListener('input', (e)=> this.handleSearchCommon(e.target.value));
    $('cartBtn')?.addEventListener('click', ()=> this.openCartCommon());
    $('closeCart')?.addEventListener('click', ()=> this.closeCartCommon());
    $('cartDrawer')?.addEventListener('click', (e)=>{ if(e.target.id==='cartDrawer') this.closeCartCommon(); });
    $('wishlistBtn')?.addEventListener('click', ()=> this.openWishlistCommon());
    $('shareBtn')?.addEventListener('click', ()=> this.shareShopCommon());
    $('checkoutBtn')?.addEventListener('click', ()=> this.goCheckoutCommon());
    $('voiceSearchBtn')?.addEventListener('click', ()=> this.voiceSearchCommon());
    $('bottomCart')?.addEventListener('click', ()=> this.openCartCommon());
    $('bottomSearch')?.addEventListener('click', ()=> $('searchInput')?.focus());
    $('bottomProfile')?.addEventListener('click', ()=> location.href=`/profile.html?shopId=${this.shopId}`);
  }

  // SEARCH - COMMON/UTILS/SEARCH.JS + FILTER.JS
  bindSearchCommon(){
    // Voice search - common/ai/voice-search.js
    if(window.VoiceSearch){
      console.log('✅ VoiceSearch connected - common/ai/voice-search.js');
    }
    if(window.SearchUtils){
      console.log('✅ SearchUtils connected - common/utils/search.js');
    }
  }

  // SHARE - COMMON/SHARE + JS/SHARE.JS
  bindShareCommon(){
    if(window.ShareCore || window.WhatsappShare){
      console.log('✅ ShareCore connected - common/share/whatsapp-share.js + common/js/share.js');
    }
  }

  // SOCKET - COMMON/CORE/SOCKET-CORE.JS ONLY
  bindSocketCommon(){
    if(!window.SocketCore){
      console.warn('SocketCore not loaded - common/core/socket-core.js missing');
      return;
    }
    window.SocketCore.on('shop-status-changed', (data)=>{
      if(data.shopId===this.shopId){
        this.isShopOpen = data.isOpen;
        this.handleShopStatusCommon();
        // common/js/customer-shop-status.js
        if(window.CustomerShopStatus?.updateStatus) window.CustomerShopStatus.updateStatus({ settings:{ isOpen:data.isOpen } });
      }
    });
    window.SocketCore.on('product-updated', (data)=>{
      if(data.shopId===this.shopId){
        console.log('Product updated via WorldProductManager + SocketCore - reload', data);
        this.loadShop();
      }
    });
    window.SocketCore.on('new-review', (data)=>{
      if(data.shopId===this.shopId && window.ReviewsCore?.refresh) window.ReviewsCore.refresh();
    });
  }

  // CART - COMMON/CART/CART-CORE.JS ONLY
  initCartCommon(){
    if(window.CartCore){
      window.CartCore.shopId = this.shopId;
      window.CartCore.shopType = 'kirana';
      try{
        if(window.CartCore.loadCart) window.CartCore.loadCart();
        this.cart = window.CartCore.getCart(this.shopId) || [];
      }catch(e){ this.cart=[]; }
      console.log('✅ CartCore connected - common/cart/cart-core.js - items:', this.cart.length);
    }else{
      this.cart = JSON.parse(localStorage.getItem(`cart_${this.shopId}`)||'[]');
    }
  }

  // WISHLIST - COMMON/WISHLIST/WISHLIST.JS ONLY
  initWishlistCommon(){
    if(window.WishlistCore){
      window.WishlistCore.shopId = this.shopId;
      window.WishlistCore.shopType = 'kirana';
      try{ this.wishlist = window.WishlistCore.getWishlist(this.shopId) || []; }catch(e){ this.wishlist=[]; }
      console.log('✅ WishlistCore connected - common/wishlist/wishlist.js - items:', this.wishlist.length);
    }else{
      this.wishlist = JSON.parse(localStorage.getItem(`wishlist_${this.shopId}`)||'[]');
    }
  }

  // ==================== LOAD SHOP - WORLD MANAGER CLASS V15 - ROLE=CUSTOMER ====================
  async loadShop(){
    try{
      this.showLoader(true);

      let oldShop = {};
      let oldProducts = [];
      let worldProducts = [];

      // 1. WORLD PRODUCTS - VIA V15 CLASS - ROLE=CUSTOMER - FILTER ACTIVE+STOCK>0
      if(window.WorldProductManager){
        // Class already detects role=customer from pathname user-view
        worldProducts = await window.WorldProductManager.getProducts({ shopType:'kirana', shopId:this.shopId, role:'customer' });
        console.log(`🌍 WorldProducts via Manager Class: ${worldProducts.length} - role:${window.WorldProductManager.role}`);
        // Old shop data via ApiCore - common/core/api-core.js
        const oldRes = await window.ApiCore?.get(`/api/shops/kirana/${this.shopId}`).catch(()=>null);
        oldShop = oldRes?.shop || oldRes || {};
        oldProducts = oldShop.products || [];
      }else{
        // Fallback - direct API - customer role
        const [oldRes, worldRes] = await Promise.allSettled([
          fetch(`/api/shops/kirana/${this.shopId}`).then(r=>r.json()).catch(()=>({shop:{}})),
          fetch(`/api/world-products?shopId=${this.shopId}&shopType=kirana&role=customer`).then(r=>r.json()).catch(()=>({data:[]})),
          fetch(`/api/world-products?shopId=${this.shopId}&type=kirana&role=customer`).then(r=>r.json()).catch(()=>({data:[]}))
        ]);
        oldShop = oldRes.value?.shop || {};
        oldProducts = oldShop.products || [];
        const w1 = oldRes.value?.data || [];
        const w2 = worldRes.value?.data || [];
        worldProducts = [...w1,...w2];
      }

      this.shopData = oldShop;
      this.oldProducts = oldProducts.filter(p=> (p.isActive!==false) && (p.stock==null || p.stock>0));
      this.worldProducts = worldProducts.filter(p=> (p.isActive!==false) && (p.stock==null || p.stock>0)); // customer filter - common/products/product-manager.js filterByRole

      // MERGE - WORLD FIRST - WORLD BOSS
      this.allProducts = [...this.worldProducts,...this.oldProducts];
      this.filteredProducts = [...this.allProducts];
      this.isShopOpen = this.shopData.settings?.isOpen?? this.shopData.isOpen?? true;

      // COMMON CART + WISHLIST FROM SERVER - /api/common/*
      try{
        const commonCart = await window.ApiCore?.get(this.API_COMMON.cart).catch(()=>null);
        if(commonCart?.items) this.cart = commonCart.items;
      }catch(e){}

      // RENDER - COMMON CONNECTED
      this.renderShopHeaderCommon();
      this.renderCategoriesCommon();
      this.renderProductsCommon(this.filteredProducts);
      this.renderCartCommon();
      this.updateCartCountCommon();
      this.updateWishlistCountCommon();
      this.handleShopStatusCommon();

      // Customer shop status - common/js/customer-shop-status.js
      if(window.CustomerShopStatus?.init) window.CustomerShopStatus.init(this.shopId, this.shopData);

      console.log(`✅ V16 User View Loaded - World:${this.worldProducts.length} + Old:${this.oldProducts.length} = Total:${this.allProducts.length} - via product-manager.js V15 Class Role:customer`);

    }catch(e){
      console.error(e);
      window.ErrorHandler?.handleApiError(e,'kirana_user_view_v16_common');
      this.showError(e.message);
    }finally{
      this.showLoader(false);
    }
  }

  // ==================== RENDER - COMMON ONLY ====================
  renderShopHeaderCommon(){
    const s=this.shopData; if(!s) return;
    const $=(id)=>document.getElementById(id);
    if($('shopName')) $('shopName').innerText = s.shopName || s.name || 'Kirana World Store - V16 Common';
    if($('shopLogoLetter')) $('shopLogoLetter').innerText = (s.shopName||'K')[0].toUpperCase();
    if($('shopArea')) $('shopArea').innerText = s.area || s.address || 'Local Market - common/location.js';
    if($('shopRating')) $('shopRating').innerText = s.rating || '4.6';
    if($('bannerTitle')) $('bannerTitle').innerText = s.bannerTitle || `${s.shopName||'Kirana'} - Fresh Daily - World Model`;
    if($('bannerSub')) $('bannerSub').innerText = `${this.allProducts.length} products (World:${this.worldProducts.length}+Old:${this.oldProducts.length}) • Free delivery - via product-manager.js V15`;
    if($('openText')) $('openText').innerText = this.isShopOpen? 'Open Now - common/js/shop-toggle.js' : 'Closed - common/js/shop-toggle.js';
    if($('openPill')) $('openPill').className = `pill ${this.isShopOpen? 'open':'closed'}`;
    const badge=$('shopStatusBadge'); if(badge){ badge.innerText=this.isShopOpen?'● OPEN • V16 COMMON':'● CLOSED • common/js/shop-toggle.js'; badge.style.color=this.isShopOpen?'#10b981':'#ef4444'; }
    if($('worldCount')) $('worldCount').innerText = `🌍 World:${this.worldProducts.length}+Old:${this.oldProducts.length}=${this.allProducts.length} via Manager`;
  }

  renderCategoriesCommon(){
    const cats = ['all',...new Set(this.allProducts.map(p=> (p.category||p.extraData?.category||p.shopType||'general').toLowerCase()))].filter(Boolean).slice(0,20);
    this.categories=cats;
    const listEl=document.getElementById('categoryList'); if(!listEl) return;
    listEl.innerHTML=cats.map(c=>`<div class="cat ${this.activeCat===c?'active':''}" data-cat="${c}">${c.toUpperCase()} (${c==='all'? this.allProducts.length : this.allProducts.filter(p=> (p.category||p.extraData?.category||p.shopType||'').toLowerCase()===c).length})</div>`).join('');
    listEl.querySelectorAll('.cat').forEach(el=>{
      el.addEventListener('click', ()=>{
        listEl.querySelectorAll('.cat').forEach(x=>x.classList.remove('active'));
        el.classList.add('active');
        this.activeCat=el.dataset.cat;
        this.filterByCategoryCommon(this.activeCat);
        if(window.FilterUtils?.filterByCategory) window.FilterUtils.filterByCategory(this.activeCat);
      });
    });
  }

  renderProductsCommon(list){
    const grid=document.getElementById('productGrid'); if(!grid) return;
    if(!list.length){
      grid.innerHTML=`<div class="empty" style="grid-column:1/-1"><div style="font-size:48px">🔍</div><h3>No products - World Model Empty</h3><p style="color:#94a3b8;font-size:12px;margin-top:6px">World API: /api/world-products?shopId=${this.shopId}&shopType=kirana&role=customer<br>common/products/product-manager.js V15 Class filterByRole=customer (isActive+stock>0)</p></div>`;
      return;
    }
    grid.innerHTML=list.map(p=>`
      <div class="card">
        <button class="wish ${this.wishlist.includes(p._id)?'active':''}" onclick="window.KiranaUserView.addToWishlist('${p._id}')" title="Wishlist - common/wishlist/wishlist.js"><i class="${this.wishlist.includes(p._id)?'fa-solid':'fa-regular'} fa-heart"></i></button>
        <img src="${p.thumbnail || p.images?.[0]?.url || p.image||`https://source.unsplash.com/400x300/?${encodeURIComponent(p.category||'grocery')}`}" loading="lazy" onerror="this.src='https://placehold.co/400x300/f8fafc/94a3b8?text=${encodeURIComponent((p.name||'Product').slice(0,10))}'" onclick="window.KiranaUserView.openProduct('${p._id}')">
        <div class="info">
          <b title="${p.name}">${p.name}</b>
          <div class="meta">${p.brand||p.extraData?.brand||''} ${p.brand?'•':''} ${p.weight||p.extraData?.weight||p.unit||''} • ${p.shopType||p.category||'kirana'} ${p.shopType?'🌍 World':''}</div>
          <div class="price-row">
            <div class="price">₹${p.price}${p.mrp&&p.mrp>p.price?`<del>₹${p.mrp}</del>`:''}</div>
            <button class="add ${this.cart.find(c=> (c._id||c.productId)===p._id)?'added':''}" onclick="window.KiranaUserView.addToCart('${p._id}')" ${!this.isShopOpen?'disabled style="opacity:.4"':''} title="Add - common/cart/cart-core.js"><i class="fa-solid ${this.cart.find(c=> (c._id||c.productId)===p._id)?'fa-check':'fa-plus'}"></i></button>
          </div>
          <div style="font-size:10px;color:${(p.stock||0)>0?'#10b981':'#ef4444'};margin-top:4px;font-weight:700">${(p.stock||0)>0?`${p.stock} in stock - common/inventory`:'Out of stock - common/inventory/low-stock-alert.html'} • ${p.shopType?'🌍 World Model':'Old'} - common/products/product-manager.js</div>
        </div>
      </div>
    `).join('');
    if(window.LazyLoad?.observe) window.LazyLoad.observe();
  }

  filterByCategoryCommon(cat){
    if(cat==='all'){ this.filteredProducts=[...this.allProducts]; }
    else{ this.filteredProducts=this.allProducts.filter(p=> (p.category||p.extraData?.category||p.shopType||'').toLowerCase()===cat.toLowerCase()); }
    const searchVal=document.getElementById('searchInput')?.value||'';
    if(searchVal) this.handleSearchCommon(searchVal, true);
    else this.renderProductsCommon(this.filteredProducts);
  }

  handleSearchCommon(q, skipCat=false){
    const query=q.toLowerCase().trim();
    let base=skipCat? this.filteredProducts : (this.activeCat==='all'? this.allProducts : this.allProducts.filter(p=> (p.category||p.extraData?.category||p.shopType||'').toLowerCase()===this.activeCat));
    if(!query){ this.renderProductsCommon(base); return; }
    let result;
    if(window.SearchUtils?.search){
      result=window.SearchUtils.search(base, query);
    }else if(window.FilterUtils?.search){
      result=window.FilterUtils.search(base, query, ['name','brand','category','extraData.brand','extraData.weight']);
    }else{
      result=base.filter(p=> (p.name||'').toLowerCase().includes(query) || (p.category||'').toLowerCase().includes(query) || (p.shopType||'').toLowerCase().includes(query) || (p.brand||'').toLowerCase().includes(query) || (p.extraData?.brand||'').toLowerCase().includes(query));
    }
    if(window.SearchCore?.trackSearch) window.SearchCore.trackSearch(query, this.shopId);
    this.renderProductsCommon(result);
  }

  // ==================== CART - COMMON/CART/CART-CORE.JS ONLY - NO FALTU ====================
  async addToCart(productId){
    if(!this.isShopOpen){ this.toast('Shop is closed now 🔴 - common/js/shop-toggle.js se closed hai'); return; }
    const product=this.allProducts.find(p=>p._id===productId);
    if(!product){ this.toast('Product not found - World Model'); return; }
    if((product.stock||0)<=0){ this.toast('Out of stock - common/inventory/low-stock-alert.html'); return; }

    try{
      if(window.CartCore){
        // Common cart-core API - shopId + product object
        try{
          await window.CartCore.addItem({ productId, shopId:this.shopId, qty:1, product, shopType:'kirana' });
        }catch(e){
          try{ await window.CartCore.addToCart(this.shopId, { _id:product._id, id:product._id, name:product.name, price:product.price, image:product.thumbnail||product.images?.[0]?.url||product.image, qty:1, shopType:'kirana' }); }catch(e2){ throw e2; }
        }
        this.cart=window.CartCore.getCart(this.shopId)||[];
      }else{
        const existing=this.cart.find(c=> (c.productId===productId||c._id===productId));
        if(existing) existing.qty=(existing.qty||1)+1;
        else this.cart.push({ productId, _id:productId, qty:1, product, price:product.price, name:product.name, image:product.thumbnail||product.images?.[0]?.url||product.image, shopType:'kirana' });
      }

      // Storage - common/core/storage-core.js
      window.StorageCore?.saveCart(this.cart);
      // Common API - /api/common/cart
      window.ApiCore?.post(`/api/common/cart/${this.shopId}/add`, { productId, qty:1, shopType:'kirana' }).catch(()=>{});

      this.renderCartCommon();
      this.updateCartCountCommon();
      this.renderProductsCommon(this.filteredProducts.length? this.filteredProducts : this.allProducts);
      this.toast(`${product.name} added ✅ - common/cart/cart-core.js`);
      if(navigator.vibrate) navigator.vibrate(50);
      window.ApiCore?.trackEvent('add_to_cart_v16_world', { productId, shopId:this.shopId, shopType:'kirana', role:'customer' });

    }catch(e){ console.error(e); this.toast('Failed to add to cart - common/cart/cart-core.js check'); }
  }

  renderCartCommon(){
    const container=document.getElementById('cartItems'); if(!container) return;
    if(!this.cart.length){
      container.innerHTML=`<div style="text-align:center;padding:40px 20px"><div style="font-size:40px">🛒</div><h4 style="margin-top:8px">Cart empty - common/cart</h4><p style="font-size:12px;color:#94a3b8">Add world products - common/cart/cart-core.js<br><small>World + Old + Common</small></p></div>`;
      const sub1=document.getElementById('cartSubtotal'); if(sub1) sub1.innerText='₹0 - common/utils/currency-formatter.js';
      const sub2=document.getElementById('checkoutTotal'); if(sub2) sub2.innerText='₹0';
      return;
    }
    container.innerHTML=this.cart.map(item=>{
      const prod=item.product || this.allProducts.find(p=> p._id===(item.productId||item._id)) || {};
      const img=prod.thumbnail || prod.images?.[0]?.url || prod.image || item.image || '';
      const name=prod.name || item.name || 'Product';
      const price=prod.price || item.price || 0;
      return `<div style="display:flex;gap:10px;background:#fff;padding:10px;border-radius:14px;border:1px solid #f1f5f9;align-items:center"><img src="${img}" style="width:50px;height:50px;border-radius:10px;object-fit:cover;background:#f8fafc" onerror="this.src='https://placehold.co/100'"><div style="flex:1"><b style="font-size:12px">${name}</b><br><span style="font-size:11px;color:#64748b">₹${price} x ${item.qty||1}</span><br><small style="font-size:9px;color:#94a3b8">${prod.shopType||'kirana'} • World - common/products/product-manager.js</small></div><div style="display:flex;flex-direction:column;gap:4px;align-items:center"><button onclick="window.KiranaUserView.updateQty('${item.productId||item._id}',1)" style="width:26px;height:26px;border-radius:8px;border:1px solid #e2e8f0;background:#fff">+</button><span style="font-size:11px;font-weight:800">${item.qty||1}</span><button onclick="window.KiranaUserView.updateQty('${item.productId||item._id}',-1)" style="width:26px;height:26px;border-radius:8px;border:1px solid #e2e8f0;background:#fff">-</button></div></div>`;
    }).join('');

    const subtotal=this.cart.reduce((sum,i)=>{ const pr=i.product?.price||i.price||0; return sum+pr*(i.qty||1); },0);
    const formatted=window.CurrencyFormatter?.format? window.CurrencyFormatter.format(subtotal) : `₹${subtotal}`;
    const el1=document.getElementById('cartSubtotal'); if(el1) el1.innerText=`${formatted} - common/utils/currency-formatter.js`;
    const el2=document.getElementById('checkoutTotal'); if(el2) el2.innerText=formatted;
    const el3=document.getElementById('cartItemCountText'); if(el3) el3.innerText=`(${this.cart.length}) - common/cart/cart-core.js`;
  }

  updateQty(productId, delta){
    const item=this.cart.find(c=> (c.productId===productId||c._id===productId)); if(!item) return;
    item.qty=(item.qty||1)+delta;
    if(item.qty<=0){ this.cart=this.cart.filter(c=> (c.productId!==productId&&c._id!==productId)); }
    if(window.CartCore){
      try{
        if(item.qty<=0) window.CartCore.removeFromCart(this.shopId, productId);
        else window.CartCore.updateQty(this.shopId, productId, item.qty);
        this.cart=window.CartCore.getCart(this.shopId)||[];
      }catch(e){}
    }
    this.renderCartCommon();
    this.updateCartCountCommon();
    window.StorageCore?.saveCart(this.cart);
    this.renderProductsCommon(this.filteredProducts.length? this.filteredProducts : this.allProducts);
  }

  updateCartCountCommon(){
    const count=this.cart.reduce((s,i)=> s + (i.qty||1),0);
    const badge=document.getElementById('cartCount'); if(badge){ badge.innerText=count; badge.style.display=count>0?'block':'none'; }
    const bottomBadge=document.getElementById('bottomCartCount'); if(bottomBadge){ bottomBadge.innerText=count; bottomBadge.style.display=count>0?'inline-block':'none'; }
    if(window.CartCore?.updateBadge) window.CartCore.updateBadge(count);
    if(window.CartCount?.update) window.CartCount.update(count);
  }

  updateWishlistCountCommon(){
    const badge=document.getElementById('wishlistCount'); if(badge){ badge.innerText=this.wishlist.length; badge.style.display=this.wishlist.length?'block':'none'; }
  }

  openCartCommon(){ document.getElementById('cartDrawer')?.classList.add('open'); if(window.CartCore?.openDrawer) window.CartCore.openDrawer(); }
  closeCartCommon(){ document.getElementById('cartDrawer')?.classList.remove('open'); }

  // WISHLIST - COMMON/WISHLIST/WISHLIST.JS ONLY
  async addToWishlist(productId){
    try{
      if(window.WishlistCore){
        await window.WishlistCore.toggle(productId, this.shopId);
        this.wishlist=window.WishlistCore.getWishlist(this.shopId)||[];
      }else{
        if(this.wishlist.includes(productId)) this.wishlist=this.wishlist.filter(id=>id!==productId);
        else this.wishlist.push(productId);
        localStorage.setItem(`wishlist_${this.shopId}`, JSON.stringify(this.wishlist));
      }
      if(this.wishlist.includes(productId)) this.toast('Added to wishlist ❤️ - common/wishlist/wishlist.js');
      else this.toast('Removed from wishlist - common/wishlist/wishlist.js');
      this.updateWishlistCountCommon();
      this.renderProductsCommon(this.filteredProducts.length? this.filteredProducts : this.allProducts);
      window.ApiCore?.post(`/api/common/wishlist/${this.shopId}/toggle`, { productId, shopType:'kirana' }).catch(()=>{});
    }catch(e){ this.toast('Wishlist failed - common/wishlist/wishlist.js'); }
  }

  openWishlistCommon(){
    if(window.WishlistCore){ window.open(`../common/wishlist/wishlist.html?shopId=${this.shopId}&shopType=kirana`,'_blank'); }
    else{ this.toast(`Wishlist: ${this.wishlist.length} items ❤️ - common/wishlist/wishlist.js`); }
  }

  shareShopCommon(){
    const url=location.href;
    const text=`Check ${this.shopData.shopName||'Kirana Store'} on SamanLive - ${this.worldProducts.length} world products via product-manager.js V15 + ${this.oldProducts.length} old - Fresh kirana in 30 mins! ${url}`;
    if(window.WhatsappShare?.share){ window.WhatsappShare.share(text); }
    else if(window.WhatsappShare?.shareShop){ window.WhatsappShare.shareShop(this.shopId); }
    else if(window.ShareCore?.shareShop){ window.ShareCore.shareShop(this.shopId); }
    else if(navigator.share){ navigator.share({ title:this.shopData.shopName, text, url }).catch(()=>{}); }
    else{ navigator.clipboard.writeText(url); this.toast('Shop link copied 📋 - common/share/whatsapp-share.js + shop-link-share.html'); }
    window.ApiCore?.trackEvent('kirana_shop_shared_v16_common', { shopId:this.shopId, worldCount:this.worldProducts.length });
  }

  goCheckoutCommon(){
    if(!this.cart.length){ this.toast('Cart empty - add world products - common/cart/cart-core.js'); return; }
    if(!this.isShopOpen){ this.toast('Shop is closed now 🔴 - common/js/shop-toggle.js'); return; }
    window.StorageCore?.saveCart(this.cart);
    window.StorageCore?.set('checkout_shopId', this.shopId);
    window.StorageCore?.set('checkout_world_products', this.worldProducts.length);
    location.href=`../common/checkout/checkout.html?shopId=${this.shopId}&shopType=kirana`;
  }

  openProduct(productId){
    const p=this.allProducts.find(x=>x._id===productId); if(!p) return;
    this.toast(`${p.name} - ₹${p.price} - Stock:${p.stock} - ${p.shopType||'kirana'} ${p.extraData?'🌍 World Model via product-manager.js':''}`);
    if(window.ApiCore) window.ApiCore.trackEvent('product_view_v16_world', { productId, shopId:this.shopId, isWorld:!!p.shopType, shopType:'kirana' });
    // Quick view - common/components/product-quick-view.html
    if(window.QuickView?.open) window.QuickView.open(p);
  }

  voiceSearchCommon(){
    if(window.VoiceSearch?.start){
      window.VoiceSearch.start((text)=>{
        const inp=document.getElementById('searchInput'); if(inp) inp.value=text;
        this.handleSearchCommon(text);
        this.toast(`Voice: ${text} 🎤 - common/ai/voice-search.js`);
      });
      return;
    }
    if(!('webkitSpeechRecognition' in window) &&!('SpeechRecognition' in window)){ this.toast('Voice not supported - common/ai/voice-search.html'); return; }
    const Speech=window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec=new Speech(); rec.lang='hi-IN';
    rec.onresult=(e)=>{
      const text=e.results[0][0].transcript;
      const inp=document.getElementById('searchInput'); if(inp) inp.value=text;
      this.handleSearchCommon(text);
      this.toast(`Voice: ${text} 🎤 - common/ai/voice-search.js`);
    };
    rec.start();
    this.toast('Listening... bolo atta, dal, oil - common/ai/voice-search.js');
  }

  handleShopStatusCommon(){
    if(!this.isShopOpen){
      this.toast('Shop is closed - orders paused 🔴 - common/js/shop-toggle.js + customer-shop-status.js');
      const btn=document.getElementById('cartBtn'); if(btn) btn.style.opacity='0.5';
    }else{
      const btn=document.getElementById('cartBtn'); if(btn) btn.style.opacity='1';
    }
  }

  showLoader(show){ const el=document.getElementById('loader'); if(el) el.style.display=show?'grid':'none'; }
  showError(msg){ const grid=document.getElementById('productGrid'); if(grid) grid.innerHTML=`<div class="empty" style="color:#ef4444;grid-column:1/-1"><h3>Error - World Model</h3><p style="font-size:12px">${msg}<br><small>World API: /api/world-products?shopId=${this.shopId}&shopType=kirana&role=customer<br>Old API: /api/shops/kirana/${this.shopId}<br>common/products/product-manager.js V15 Class Role:customer - isActive+stock>0</small></p></div>`; }
  toast(msg){ const t=document.getElementById('toast'); if(!t) return; t.innerText=msg; t.style.display='block'; setTimeout(()=> t.style.display='none',3500); }
}

window.KiranaUserView = new KiranaUserViewCore();
window.KiranaUserViewCore = window.KiranaUserView;

// Global helpers - common cart + wishlist
window.addToCart = (id)=> window.KiranaUserView.addToCart(id);
window.addToWishlist = (id)=> window.KiranaUserView.addToWishlist(id);
window.openProduct = (id)=> window.KiranaUserView.openProduct(id);