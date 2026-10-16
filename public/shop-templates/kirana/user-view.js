// LOCATION: public/shop-templates/kirana/user-view.js - V17 WORLD BOSS + V13 HIERARCHY MASTER - 1400 LINES
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
    this.role = window.RoleHierarchy? window.RoleHierarchy.getMyRole() : 'customer';
    this.API_COMMON = {
      cart: `/api/common/cart/${this.shopId}`,
      wishlist: `/api/common/wishlist/${this.shopId}`,
      reviews: `/api/common/reviews/${this.shopId}`,
      toggle: `/api/common/shop-toggle/${this.shopId}/status`,
      walletBalance: `/api/common/wallet/balance?userId=${this.shopId}&role=shop_owner&shopId=${this.shopId}`
    };
    this.init();
  }

  async init(){
    console.log(`🛍️ KiranaUserViewCore V17 WORLD BOSS + HIERARCHY - shopId:${this.shopId} Role:`, this.role, 'RoleHierarchy:',!!window.RoleHierarchy);
    if(!this.shopId){
      this.showError('Shop ID missing - Add?shopId=YOUR_ID');
      return;
    }
    localStorage.setItem('last_shopId', this.shopId);
    localStorage.setItem('shopType','kirana');
    window.shopId = this.shopId;
    window.shopType = 'kirana';
    window.MY_SHOP_ID = this.shopId;
    window.USER_ROLE = this.role;

    this.bindUICommon();
    this.bindSocketCommon();
    this.bindShareCommon();
    this.bindSearchCommon();

    await this.loadShop();

    this.initCartCommon();
    this.initWishlistCommon();

    window.ApiCore?.trackEvent('kirana_user_view_v17_hierarchy', { shopId:this.shopId, shopType:'kirana', worldCount:this.worldProducts.length, role:this.role });
  }

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

  bindSearchCommon(){
    if(window.VoiceSearch){ console.log('✅ VoiceSearch connected'); }
    if(window.SearchUtils){ console.log('✅ SearchUtils connected'); }
  }

  bindShareCommon(){
    if(window.ShareCore || window.WhatsappShare){ console.log('✅ ShareCore connected'); }
  }

  bindSocketCommon(){
    if(!window.SocketCore){ console.warn('SocketCore not loaded'); return; }
    window.SocketCore.on('shop-status-changed', (data)=>{
      if(data.shopId===this.shopId){
        this.isShopOpen = data.isOpen;
        this.handleShopStatusCommon();
        if(window.CustomerShopStatus?.updateStatus) window.CustomerShopStatus.updateStatus({ settings:{ isOpen:data.isOpen } });
      }
    });
    window.SocketCore.on('product-updated', (data)=>{
      if(data.shopId===this.shopId){ this.loadShop(); }
    });
    window.SocketCore.on('new-review', (data)=>{
      if(data.shopId===this.shopId && window.ReviewsCore?.refresh) window.ReviewsCore.refresh();
    });
    // DashboardCore socket also
    if(window.DashboardCore && window.DashboardCore.initSocket){
      // Not needed for customer view
    }
  }

  initCartCommon(){
    if(window.CartCore){
      window.CartCore.shopId = this.shopId;
      window.CartCore.shopType = 'kirana';
      try{
        if(window.CartCore.getCart) {
          const c = window.CartCore.getCart();
          this.cart = Array.isArray(c)? c : (c?.items||[]);
        }
      }catch(e){ this.cart=[]; }
      console.log('✅ CartCore connected - items:', this.cart.length);
    }else{
      this.cart = JSON.parse(localStorage.getItem(`cart_${this.shopId}`)||'[]');
    }
  }

  initWishlistCommon(){
    if(window.WishlistCore){
      window.WishlistCore.shopId = this.shopId;
      window.WishlistCore.shopType = 'kirana';
      try{ this.wishlist = window.WishlistCore.getWishlist(this.shopId) || []; }catch(e){ this.wishlist=[]; }
    }else{
      this.wishlist = JSON.parse(localStorage.getItem(`wishlist_${this.shopId}`)||'[]');
    }
  }

  // ==================== LOAD SHOP - WORLD + HIERARCHY ====================
  async loadShop(){
    try{
      this.showLoader(true);

      let oldShop = {};
      let oldProducts = [];
      let worldProducts = [];

      if(window.WorldProductManager){
        worldProducts = await window.WorldProductManager.getProducts({ shopType:'kirana', shopId:this.shopId, role:this.role });
        const oldRes = await window.ApiCore?.get(`/api/shops/kirana/${this.shopId}`).catch(()=>null);
        oldShop = oldRes?.shop || oldRes || {};
        oldProducts = oldShop.products || [];
      }else{
        const [oldRes, worldRes] = await Promise.allSettled([
          fetch(`/api/shops/kirana/${this.shopId}`).then(r=>r.json()).catch(()=>({shop:{}})),
          fetch(`/api/world-products?shopId=${this.shopId}&shopType=kirana&role=${this.role}`).then(r=>r.json()).catch(()=>({data:[]})),
        ]);
        oldShop = oldRes.value?.shop || {};
        oldProducts = oldShop.products || [];
        worldProducts = worldRes.value?.data || [];
      }

      this.shopData = oldShop;
      this.oldProducts = oldProducts.filter(p=> (p.isActive!==false) && (p.stock==null || p.stock>0));
      this.worldProducts = worldProducts.filter(p=> (p.isActive!==false) && (p.stock==null || p.stock>0));

      // MERGE + HIERARCHY INJECT
      this.allProducts = [...this.worldProducts,...this.oldProducts].map(p=> ({
    ...p,
        ownerRole: p.ownerRole || p.shopOwnerRole || 'shop_owner',
        ownerId: p.ownerId || p.shopId || this.shopId,
        shopId: p.shopId || this.shopId,
        shopName: oldShop.shopName || oldShop.name || 'Kirana Store',
        shopType: 'kirana'
      }));
      // Hierarchy filter - show only allowed products for current role
      if(window.RoleHierarchy){
        this.allProducts = this.allProducts.filter(p=> window.RoleHierarchy.shouldShowAddButton(p) || true); // show all but disable button if not allowed
      }
      this.filteredProducts = [...this.allProducts];
      this.isShopOpen = this.shopData.settings?.isOpen?? this.shopData.isOpen?? true;

      try{
        const commonCart = await window.ApiCore?.get(this.API_COMMON.cart).catch(()=>null);
        if(commonCart?.items) this.cart = commonCart.items;
      }catch(e){}

      this.renderShopHeaderCommon();
      this.renderCategoriesCommon();
      this.renderProductsCommon(this.filteredProducts);
      this.renderCartCommon();
      this.updateCartCountCommon();
      this.updateWishlistCountCommon();
      this.handleShopStatusCommon();

      if(window.CustomerShopStatus?.init) window.CustomerShopStatus.init(this.shopId, this.shopData);

      console.log(`✅ V17 Hierarchy User View Loaded - World:${this.worldProducts.length} Total:${this.allProducts.length} Role:${this.role}`);

    }catch(e){
      console.error(e);
      window.ErrorHandler?.handleApiError(e,'kirana_user_view_v17_hierarchy');
      this.showError(e.message);
    }finally{
      this.showLoader(false);
    }
  }

  renderShopHeaderCommon(){
    const s=this.shopData; if(!s) return;
    const $=(id)=>document.getElementById(id);
    if($('shopName')) $('shopName').innerText = s.shopName || s.name || 'Kirana World Store - V17 Hierarchy';
    if($('shopLogoLetter')) $('shopLogoLetter').innerText = (s.shopName||'K')[0].toUpperCase();
    if($('shopArea')) $('shopArea').innerText = s.area || s.address || 'Local Market';
    if($('shopRating')) $('shopRating').innerText = s.rating || '4.6';
    if($('bannerTitle')) $('bannerTitle').innerText = s.bannerTitle || `${s.shopName||'Kirana'} - Fresh Daily - Hierarchy`;
    if($('bannerSub')) $('bannerSub').innerText = `${this.allProducts.length} products (World:${this.worldProducts.length}+Old:${this.oldProducts.length}) • Role: ${this.role} → ${window.RoleHierarchy? JSON.stringify(window.RoleHierarchy.CAN_BUY_FROM[this.role]||[]) : 'shop_owner'}`;
    if($('openText')) $('openText').innerText = this.isShopOpen? 'Open Now' : 'Closed';
    if($('openPill')) $('openPill').className = `pill ${this.isShopOpen? 'open':'closed'}`;
    const badge=$('shopStatusBadge'); if(badge){ badge.innerText=this.isShopOpen?`● OPEN • ${this.role} • HIERARCHY`:'● CLOSED'; badge.style.color=this.isShopOpen?'#10b981':'#ef4444'; }
    if($('worldCount')) $('worldCount').innerText = `🌍 World:${this.worldProducts.length}+Old:${this.oldProducts.length}=${this.allProducts.length} • Role:${this.role}`;
    if($('rolePill')) $('rolePill').textContent = `Role: ${this.role} → ${window.RoleHierarchy? JSON.stringify(window.RoleHierarchy.CAN_BUY_FROM[this.role]||[]) : 'shop_owner'}`;
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
      grid.innerHTML=`<div class="empty" style="grid-column:1/-1"><div style="font-size:48px">🔍</div><h3>No products</h3></div>`;
      return;
    }
    grid.innerHTML=list.map(p=>{
      const canBuy = window.RoleHierarchy? window.RoleHierarchy.shouldShowAddButton(p) : true;
      return `
      <div class="card">
        <button class="wish ${this.wishlist.includes(p._id)?'active':''}" onclick="window.KiranaUserView.addToWishlist('${p._id}')"><i class="${this.wishlist.includes(p._id)?'fa-solid':'fa-regular'} fa-heart"></i></button>
        <img src="${p.thumbnail || p.images?.[0]?.url || p.image||`https://source.unsplash.com/400x300/?${encodeURIComponent(p.category||'grocery')}`}" loading="lazy" onerror="this.src='https://placehold.co/400x300/f8fafc/94a3b8?text=${encodeURIComponent((p.name||'Product').slice(0,10))}'" onclick="window.KiranaUserView.openProduct('${p._id}')">
        <div class="info">
          <b title="${p.name}">${p.name}</b>
          <div class="meta">${p.brand||''} ${p.brand?'•':''} ${p.weight||''} • ${p.ownerRole||'shop_owner'} ${p.shopType?'🌍':''}</div>
          <div class="price-row">
            <div class="price">₹${p.price}${p.mrp&&p.mrp>p.price?`<del>₹${p.mrp}</del>`:''}</div>
            ${!canBuy? `<span style="font-size:9px;background:#f1f5f9;padding:3px 6px;border-radius:10px">Not for ${this.role}</span>` : `<button class="add ${this.cart.find(c=> (c._id||c.productId)===p._id)?'added':''}" onclick="window.KiranaUserView.addToCart('${p._id}')" ${!this.isShopOpen?'disabled style="opacity:.4"':''}><i class="fa-solid ${this.cart.find(c=> (c._id||c.productId)===p._id)?'fa-check':'fa-plus'}"></i></button>`}
          </div>
          <div style="font-size:10px;color:${(p.stock||0)>0?'#10b981':'#ef4444'};margin-top:4px;font-weight:700">${(p.stock||0)>0?`${p.stock} in stock`: 'Out of stock'} • ${p.ownerRole||''}</div>
        </div>
      </div>
    `}).join('');
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
    if(window.SearchUtils?.search){ result=window.SearchUtils.search(base, query); }
    else if(window.FilterUtils?.search){ result=window.FilterUtils.search(base, query, ['name','brand','category','extraData.brand','extraData.weight']); }
    else{ result=base.filter(p=> (p.name||'').toLowerCase().includes(query)); }
    if(window.SearchCore?.trackSearch) window.SearchCore.trackSearch(query, this.shopId);
    this.renderProductsCommon(result);
  }

  // ==================== CART - HIERARCHY MASTER ====================
  async addToCart(productId){
    if(!this.isShopOpen){ this.toast('Shop is closed now 🔴'); return; }
    const product=this.allProducts.find(p=>p._id===productId);
    if(!product){ this.toast('Product not found'); return; }
    if((product.stock||0)<=0){ this.toast('Out of stock'); return; }

    // Hierarchy check
    if(window.RoleHierarchy){
      const can = window.RoleHierarchy.shouldShowAddButton(product);
      if(!can){
        this.toast(`Aap ${this.role} ho, ${product.ownerRole} se nahi kharid sakte. Allowed: ${JSON.stringify(window.RoleHierarchy.CAN_BUY_FROM[this.role]||[])}`);
        return;
      }
    }

    const productForCart = {
      _id: product._id, id: product._id, productId: product._id,
      name: product.name, title: product.name,
      price: product.price,
      image: product.thumbnail||product.images?.[0]?.url||product.image,
      thumbnail: product.thumbnail||product.images?.[0]?.url||product.image,
      qty:1, quantity:1,
      ownerRole: product.ownerRole||'shop_owner',
      ownerId: product.ownerId||this.shopId,
      shopId: product.shopId||this.shopId,
      shopName: product.shopName||this.shopData.shopName||'Kirana Store',
      shopType:'kirana',
      stock: product.stock
    };

    try{
      if(window.CartCore){
        const ok = await window.CartCore.add(productForCart, 1);
        if(!ok){ this.toast('Add failed - role check'); return; }
        this.cart=window.CartCore.getCart()||[];
      }else{
        const existing=this.cart.find(c=> (c.productId===productId||c._id===productId));
        if(existing) existing.qty=(existing.qty||1)+1;
        else this.cart.push(productForCart);
      }

      window.StorageCore?.saveCart(this.cart);
      window.ApiCore?.post(`/api/common/cart/${this.shopId}/add`, { productId, qty:1, shopType:'kirana' }).catch(()=>{});

      this.renderCartCommon();
      this.updateCartCountCommon();
      this.renderProductsCommon(this.filteredProducts.length? this.filteredProducts : this.allProducts);
      this.toast(`${product.name} added ✅ - Supplier: ${product.ownerRole} • Role: ${this.role}`);
      if(navigator.vibrate) navigator.vibrate(50);
      window.ApiCore?.trackEvent('add_to_cart_v17_hierarchy', { productId, shopId:this.shopId, role:this.role, ownerRole:product.ownerRole });

    }catch(e){ console.error(e); this.toast('Failed to add to cart - '+e.message); }
  }

  renderCartCommon(){
    const container=document.getElementById('cartItems'); if(!container) return;
    let displayCart = window.CartCore? window.CartCore.getCart() : this.cart;
    if(!displayCart.length){
      container.innerHTML=`<div style="text-align:center;padding:40px 20px"><div style="font-size:40px">🛒</div><h4 style="margin-top:8px">Cart empty</h4><p style="font-size:12px;color:#94a3b8">Role: ${this.role} → ${window.RoleHierarchy? JSON.stringify(window.RoleHierarchy.CAN_BUY_FROM[this.role]||[]) : ''}</p></div>`;
      const sub1=document.getElementById('cartSubtotal'); if(sub1) sub1.innerText='₹0';
      const sub2=document.getElementById('checkoutTotal'); if(sub2) sub2.innerText='₹0';
      return;
    }
    container.innerHTML=displayCart.map(item=>{
      const prod=item.product || this.allProducts.find(p=> p._id===(item.productId||item._id)) || {};
      const img=prod.thumbnail || prod.images?.[0]?.url || prod.image || item.image || item.thumbnail || '';
      const name=prod.name || item.name || 'Product';
      const price=prod.price || item.price || 0;
      return `<div style="display:flex;gap:10px;background:#fff;padding:10px;border-radius:14px;border:1px solid #f1f5f9;align-items:center"><img src="${img}" style="width:50px;height:50px;border-radius:10px;object-fit:cover;background:#f8fafc"><div style="flex:1"><b style="font-size:12px">${name}</b><br><span style="font-size:11px;color:#64748b">₹${price} x ${item.qty||1} • ${item.ownerRole||''}</span></div><div style="display:flex;flex-direction:column;gap:4px;align-items:center"><button onclick="window.KiranaUserView.updateQty('${item.productId||item._id}',1)" style="width:26px;height:26px;border-radius:8px;border:1px solid #e2e8f0;background:#fff">+</button><span style="font-size:11px;font-weight:800">${item.qty||1}</span><button onclick="window.KiranaUserView.updateQty('${item.productId||item._id}',-1)" style="width:26px;height:26px;border-radius:8px;border:1px solid #e2e8f0;background:#fff">-</button></div></div>`;
    }).join('');

    const subtotal = window.CartCore? window.CartCore.getTotal() : displayCart.reduce((sum,i)=>{ const pr=i.product?.price||i.price||0; return sum+pr*(i.qty||1); },0);
    const formatted=window.CurrencyFormatter?.format? window.CurrencyFormatter.format(subtotal) : `₹${subtotal}`;
    const el1=document.getElementById('cartSubtotal'); if(el1) el1.innerText=formatted;
    const el2=document.getElementById('checkoutTotal'); if(el2) el2.innerText=formatted;
    const el3=document.getElementById('cartItemCountText'); if(el3) el3.innerText=`(${displayCart.length})`;
    const supEl=document.getElementById('cartSupplier'); if(supEl && displayCart.length) supEl.textContent = `${displayCart[0].ownerRole||''} • ${displayCart[0].shopName||''}`;
  }

  async updateQty(productId, delta){
    if(window.CartCore){
      const cart = window.CartCore.getCart();
      const item = cart.find(c=> (c.productId===productId||c._id===productId||c.id===productId));
      if(!item) return;
      if(delta>0){
        await window.CartCore.add({...item, _id:productId, id:productId}, 1);
      } else {
        if(item.qty<=1) await window.CartCore.remove(productId, item.ownerId||this.shopId);
        else {
          await window.CartCore.remove(productId, item.ownerId||this.shopId);
          await window.CartCore.add({...item, _id:productId, id:productId}, item.qty+delta);
        }
      }
      this.cart = window.CartCore.getCart()||[];
    } else {
      const item=this.cart.find(c=> (c.productId===productId||c._id===productId)); if(!item) return;
      item.qty=(item.qty||1)+delta;
      if(item.qty<=0){ this.cart=this.cart.filter(c=> (c.productId!==productId&&c._id!==productId)); }
    }
    this.renderCartCommon();
    this.updateCartCountCommon();
    window.StorageCore?.saveCart(this.cart);
    this.renderProductsCommon(this.filteredProducts.length? this.filteredProducts : this.allProducts);
  }

  updateCartCountCommon(){
    const cart = window.CartCore? window.CartCore.getCart() : this.cart;
    const count= cart.reduce((s,i)=> s + (i.qty||i.quantity||1),0);
    const badge=document.getElementById('cartCount'); if(badge){ badge.innerText=count; badge.style.display=count>0?'block':'none'; }
    const bottomBadge=document.getElementById('bottomCartCount'); if(bottomBadge){ bottomBadge.innerText=count; bottomBadge.style.display=count>0?'inline-block':'none'; }
    if(window.CartCore?.updateBadge) window.CartCore.updateBadge(count);
    if(window.CartCount?.update) window.CartCount.update(count);
  }

  updateWishlistCountCommon(){
    const badge=document.getElementById('wishlistCount'); if(badge){ badge.innerText=this.wishlist.length; badge.style.display=this.wishlist.length?'block':'none'; }
  }

  openCartCommon(){ document.getElementById('cartDrawer')?.classList.add('open'); this.renderCartCommon(); }
  closeCartCommon(){ document.getElementById('cartDrawer')?.classList.remove('open'); }

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
      this.updateWishlistCountCommon();
      this.renderProductsCommon(this.filteredProducts.length? this.filteredProducts : this.allProducts);
      window.ApiCore?.post(`/api/common/wishlist/${this.shopId}/toggle`, { productId, shopType:'kirana' }).catch(()=>{});
    }catch(e){ this.toast('Wishlist failed'); }
  }

  openWishlistCommon(){
    if(window.WishlistCore){ window.open(`../common/wishlist/wishlist.html?shopId=${this.shopId}&shopType=kirana`,'_blank'); }
    else{ this.toast(`Wishlist: ${this.wishlist.length} items`); }
  }

  shareShopCommon(){
    const url=location.href;
    const text=`Check ${this.shopData.shopName||'Kirana Store'} on SamanLive - ${this.worldProducts.length} world products - Role:${this.role} ${url}`;
    if(window.WhatsappShare?.share){ window.WhatsappShare.share(text); }
    else if(navigator.share){ navigator.share({ title:this.shopData.shopName, text, url }).catch(()=>{}); }
    else{ navigator.clipboard.writeText(url); this.toast('Shop link copied'); }
  }

  goCheckoutCommon(){
    const cart = window.CartCore? window.CartCore.getCart() : this.cart;
    if(!cart.length){ this.toast('Cart empty'); return; }
    if(!this.isShopOpen){ this.toast('Shop is closed'); return; }
    window.StorageCore?.saveCart(cart);
    const supplierId = cart[0].ownerId || cart[0].shopId || this.shopId;
    const supplierRole = cart[0].ownerRole || 'shop_owner';
    const supplierName = cart[0].shopName || this.shopData.shopName || 'Kirana Store';
    location.href=`../common/checkout/checkout.html?shopId=${this.shopId}&supplierId=${supplierId}&supplierRole=${supplierRole}&shopType=kirana&supplierName=${encodeURIComponent(supplierName)}`;
  }

  openProduct(productId){
    const p=this.allProducts.find(x=>x._id===productId); if(!p) return;
    this.toast(`${p.name} - ₹${p.price} - Stock:${p.stock} - ${p.ownerRole||''} - Role:${this.role}`);
    if(window.QuickView?.open) window.QuickView.open(p);
  }

  voiceSearchCommon(){
    if(window.VoiceSearch?.start){
      window.VoiceSearch.start((text)=>{
        const inp=document.getElementById('searchInput'); if(inp) inp.value=text;
        this.handleSearchCommon(text);
      });
      return;
    }
    if(!('webkitSpeechRecognition' in window) &&!('SpeechRecognition' in window)){ this.toast('Voice not supported'); return; }
    const Speech=window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec=new Speech(); rec.lang='hi-IN';
    rec.onresult=(e)=>{
      const text=e.results[0][0].transcript;
      const inp=document.getElementById('searchInput'); if(inp) inp.value=text;
      this.handleSearchCommon(text);
    };
    rec.start();
  }

  handleShopStatusCommon(){
    if(!this.isShopOpen){
      this.toast('Shop is closed - orders paused 🔴');
    }
  }

  showLoader(show){ const el=document.getElementById('loader'); if(el) el.style.display=show?'grid':'none'; }
  showError(msg){ const grid=document.getElementById('productGrid'); if(grid) grid.innerHTML=`<div class="empty" style="color:#ef4444;grid-column:1/-1"><h3>Error</h3><p style="font-size:12px">${msg}</p></div>`; }
  toast(msg){ const t=document.getElementById('toast'); if(!t) return; t.innerText=msg; t.style.display='block'; setTimeout(()=> t.style.display='none',3500); }
}

window.KiranaUserView = new KiranaUserViewCore();
window.KiranaUserViewCore = window.KiranaUserView;
window.addToCart = (id)=> window.KiranaUserView.addToCart(id);
window.addToWishlist = (id)=> window.KiranaUserView.addToWishlist(id);
window.openProduct = (id)=> window.KiranaUserView.openProduct(id);