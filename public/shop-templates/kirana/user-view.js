// LOCATION: public/shop-templates/kirana/user-view.js - WORLD CLASS USER VIEW JS - V13 FINAL WORLD + COMMON + OLD - FULL PRODUCTION GRADE - NO CUT
class KiranaUserViewCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('last_shopId') || '';
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
    this.init();
  }

  async init(){
    console.log(`🛍️ KiranaUserViewCore V13 WORLD - shopId: ${this.shopId} - World + Common Connected`);
    if(!this.shopId){
      this.showError('Shop ID missing - Add?shopId=YOUR_ID');
      return;
    }
    localStorage.setItem('last_shopId', this.shopId);

    this.bindUI();
    await this.loadShop();
    this.bindSocket();

    // Init Common Modules
    if(window.CartCore){
      window.CartCore.shopId = this.shopId;
      window.CartCore.loadCart();
      this.cart = window.CartCore.getCart(this.shopId) || [];
    }
    if(window.WishlistCore){
      window.WishlistCore.shopId = this.shopId;
      this.wishlist = window.WishlistCore.getWishlist(this.shopId) || [];
    }

    window.ApiCore?.trackEvent('kirana_user_view_v13_world', { shopId: this.shopId, worldCount: this.worldProducts.length });
  }

  bindUI(){
    const $ = (id)=> document.getElementById(id);
    $('searchInput')?.addEventListener('input', (e)=> this.handleSearch(e.target.value));
    $('cartBtn')?.addEventListener('click', ()=> this.openCart());
    $('closeCart')?.addEventListener('click', ()=> this.closeCart());
    $('cartDrawer')?.addEventListener('click', (e)=>{ if(e.target.id==='cartDrawer') this.closeCart(); });
    $('wishlistBtn')?.addEventListener('click', ()=> this.openWishlist());
    $('shareBtn')?.addEventListener('click', ()=> this.shareShop());
    $('checkoutBtn')?.addEventListener('click', ()=> this.goCheckout());
    $('voiceSearchBtn')?.addEventListener('click', ()=> this.voiceSearch());
    $('profileBtn')?.addEventListener('click', ()=> location.href=`/profile.html`);
    $('bottomCart')?.addEventListener('click', ()=> this.openCart());
    $('bottomSearch')?.addEventListener('click', ()=> $('searchInput')?.focus());
  }

  async loadShop(){
    try{
      this.showLoader(true);

      // 1. OLD KIRANA API + 2. WORLD API - DONO PARALLEL
      const [oldRes, worldRes] = await Promise.allSettled([
        window.ApiCore.get(`/api/shops/kirana/${this.shopId}`).catch(()=>({ success:false, shop:{} })),
        fetch(`/api/world-products?shopId=${this.shopId}&type=kirana`).then(r=>r.json()).catch(()=>({ success:false, data:[] }))
      ]);

      const oldData = oldRes.status==='fulfilled'? oldRes.value : { success:false, shop:{} };
      const worldData = worldRes.status==='fulfilled'? worldRes.value : { success:false, data:[] };

      this.shopData = oldData.shop || {};
      this.oldProducts = this.shopData.products || [];
      this.worldProducts = worldData.data || [];

      // MERGE - WORLD KO PRIORITY, WORLD PEHLE DIKHEGA
      this.allProducts = [...this.worldProducts,...this.oldProducts];
      this.filteredProducts = [...this.allProducts];
      this.isShopOpen = this.shopData.settings?.isOpen?? true;

      // 2. COMMON CART + WISHLIST
      try{
        const commonCart = await window.ApiCore.get(`/api/common/cart/${this.shopId}`).catch(()=>null);
        if(commonCart?.items) this.cart = commonCart.items;
      }catch(e){}

      // RENDER
      this.renderShopHeader();
      this.renderCategories();
      this.renderProducts(this.filteredProducts);
      this.renderCart();
      this.updateCartCount();
      this.updateWishlistCount();

      // Check shop open
      this.handleShopStatus();

      console.log(`✅ V13 User View Loaded - World: ${this.worldProducts.length} + Old: ${this.oldProducts.length} = Total: ${this.allProducts.length}`);

    }catch(e){
      window.ErrorHandler?.handleApiError(e, 'kirana_user_view_v13');
      this.showError(e.message);
    }finally{
      this.showLoader(false);
    }
  }

  renderShopHeader(){
    const s = this.shopData;
    if(!s) return;
    document.getElementById('shopName').innerText = s.shopName || s.name || 'Kirana World Store';
    document.getElementById('shopLogoLetter').innerText = (s.shopName||'K')[0].toUpperCase();
    document.getElementById('shopArea').innerText = s.area || s.address || 'Local Market';
    document.getElementById('shopRating').innerText = s.rating || '4.6';
    document.getElementById('bannerTitle').innerText = s.bannerTitle || `${s.shopName||'Kirana'} - Fresh Daily`;
    document.getElementById('bannerSub').innerText = `${this.allProducts.length} products • World: ${this.worldProducts.length} • Free delivery`;
    document.getElementById('openText').innerText = this.isShopOpen? 'Open Now' : 'Closed';
    document.getElementById('openPill').className = `pill ${this.isShopOpen? 'open' : 'closed'}`;
    const badge = document.getElementById('shopStatusBadge');
    if(badge){ badge.innerText = this.isShopOpen? '● OPEN' : '● CLOSED'; badge.style.color = this.isShopOpen? '#10b981' : '#ef4444'; }
    const worldCountEl = document.getElementById('worldCount');
    if(worldCountEl) worldCountEl.innerText = `🌍 World: ${this.worldProducts.length} + Old: ${this.oldProducts.length}`;
  }

  renderCategories(){
    const cats = ['all',...new Set(this.allProducts.map(p=> (p.shopType||p.category||'general').toLowerCase()))].slice(0,15);
    this.categories = cats;
    const listEl = document.getElementById('categoryList');
    if(!listEl) return;
    listEl.innerHTML = cats.map(c=>`<div class="cat ${this.activeCat===c? 'active':''}" data-cat="${c}">${c.toUpperCase()} (${c==='all'? this.allProducts.length : this.allProducts.filter(p=> (p.shopType||p.category||'').toLowerCase()===c).length})</div>`).join('');
    listEl.querySelectorAll('.cat').forEach(el=>{
      el.addEventListener('click', ()=>{
        listEl.querySelectorAll('.cat').forEach(x=>x.classList.remove('active'));
        el.classList.add('active');
        this.activeCat = el.dataset.cat;
        this.filterByCategory(this.activeCat);
      });
    });
  }

  renderProducts(list){
    const grid = document.getElementById('productGrid');
    if(!grid) return;
    if(!list.length){
      grid.innerHTML = `<div class="empty"><div style="font-size:48px">🔍</div><h3>No products found</h3><p style="color:#94a3b8;font-size:12px;margin-top:6px">Try another category or search<br>World API: /api/world-products?shopId=${this.shopId}&type=kirana</p></div>`;
      return;
    }
    grid.innerHTML = list.map(p=>`
      <div class="card">
        <button class="wish ${this.wishlist.includes(p._id)? 'active':''}" onclick="window.KiranaUserView.addToWishlist('${p._id}')"><i class="${this.wishlist.includes(p._id)? 'fa-solid' : 'fa-regular'} fa-heart"></i></button>
        <img src="${p.thumbnail || p.images?.[0]?.url || p.image||`https://source.unsplash.com/400x300/?${encodeURIComponent(p.category||'grocery')}`}" loading="lazy" onerror="this.src='https://placehold.co/400x300/f8fafc/94a3b8?text=${encodeURIComponent((p.name||'Product').slice(0,10))}'" onclick="window.KiranaUserView.openProduct('${p._id}')">
        <div class="info">
          <b title="${p.name}">${p.name}</b>
          <div class="meta">${p.brand||p.extraData?.brand||''} ${p.brand?'•':''} ${p.weight||p.extraData?.weight||p.unit||''} • ${p.shopType||p.category||'kirana'} ${p.shopType==='kirana'?'🌍':''}</div>
          <div class="price-row">
            <div class="price">₹${p.price}${p.mrp&&p.mrp>p.price?`<del>₹${p.mrp}</del>`:''}</div>
            <button class="add ${this.cart.find(c=>c._id===p._id||c.productId===p._id)? 'added':''}" onclick="window.KiranaUserView.addToCart('${p._id}')" ${!this.isShopOpen? 'disabled style="opacity:.4"':''}><i class="fa-solid ${this.cart.find(c=>c._id===p._id||c.productId===p._id)? 'fa-check':'fa-plus'}"></i></button>
          </div>
          <div style="font-size:10px;color:${(p.stock||0)>0?'#10b981':'#ef4444'};margin-top:4px;font-weight:700">${(p.stock||0)>0? `${p.stock} in stock` : 'Out of stock'} • ${p._id? 'World':'Old'}</div>
        </div>
      </div>
    `).join('');
  }

  filterByCategory(cat){
    if(cat==='all'){ this.filteredProducts=[...this.allProducts]; }
    else{ this.filteredProducts = this.allProducts.filter(p=> (p.shopType||p.category||'').toLowerCase()===cat.toLowerCase()); }
    const searchVal = document.getElementById('searchInput')?.value || '';
    if(searchVal) this.handleSearch(searchVal, true);
    else this.renderProducts(this.filteredProducts);
  }

  handleSearch(q, skipCat=false){
    const query = q.toLowerCase().trim();
    let base = skipCat? this.filteredProducts : (this.activeCat==='all'? this.allProducts : this.allProducts.filter(p=> (p.shopType||p.category||'').toLowerCase()===this.activeCat));
    if(!query){ this.renderProducts(base); return; }
    let result = base.filter(p=>
      (p.name||'').toLowerCase().includes(query) ||
      (p.category||'').toLowerCase().includes(query) ||
      (p.shopType||'').toLowerCase().includes(query) ||
      (p.brand||'').toLowerCase().includes(query) ||
      (p.extraData?.brand||'').toLowerCase().includes(query)
    );
    if(window.SearchCore){ window.SearchCore.trackSearch(query, this.shopId); }
    this.renderProducts(result);
  }

  // COMMON CART - WORLD PRODUCT SUPPORT
  async addToCart(productId){
    if(!this.isShopOpen){ this.toast('Shop is closed now 🔴'); return; }
    const product = this.allProducts.find(p=>p._id===productId);
    if(!product){ this.toast('Product not found'); return; }
    if((product.stock||0)<=0){ this.toast('Out of stock'); return; }

    try{
      if(window.CartCore){
        await window.CartCore.addItem({ productId, shopId: this.shopId, qty:1, product });
        this.cart = window.CartCore.getCart(this.shopId);
      }else{
        const existing = this.cart.find(c=>c.productId===productId || c._id===productId);
        if(existing) existing.qty = (existing.qty||1)+1;
        else this.cart.push({ productId, _id:productId, qty:1, product, price: product.price, name: product.name, image: product.thumbnail||product.images?.[0]?.url||product.image });
      }

      window.StorageCore?.saveCart(this.cart);
      window.ApiCore?.post(`/api/common/cart/${this.shopId}/add`, { productId, qty:1, shopType:'kirana' }).catch(()=>{});

      this.renderCart();
      this.updateCartCount();
      this.renderProducts(this.filteredProducts.length? this.filteredProducts : this.allProducts);
      this.toast(`${product.name} added ✅`);
      if(navigator.vibrate) navigator.vibrate(50);

    }catch(e){ console.error(e); this.toast('Failed to add to cart'); }
  }

  renderCart(){
    const container = document.getElementById('cartItems');
    if(!container) return;
    if(!this.cart.length){
      container.innerHTML = `<div style="text-align:center;padding:40px 20px"><div style="font-size:40px">🛒</div><h4 style="margin-top:8px">Cart empty</h4><p style="font-size:12px;color:#94a3b8">Add some kirana items<br><small>World + Old products supported</small></p></div>`;
      const sub1 = document.getElementById('cartSubtotal'); if(sub1) sub1.innerText='₹0';
      const sub2 = document.getElementById('checkoutTotal'); if(sub2) sub2.innerText='₹0';
      return;
    }
    container.innerHTML = this.cart.map(item=>{
      const prod = item.product || this.allProducts.find(p=> p._id===(item.productId||item._id)) || {};
      const img = prod.thumbnail || prod.images?.[0]?.url || prod.image || item.image || '';
      const name = prod.name || item.name || 'Product';
      const price = prod.price || item.price || 0;
      return `
      <div style="display:flex;gap:10px;background:#fff;padding:10px;border-radius:14px;border:1px solid #f1f5f9;align-items:center">
        <img src="${img}" style="width:50px;height:50px;border-radius:10px;object-fit:cover;background:#f8fafc" onerror="this.src='https://placehold.co/100'">
        <div style="flex:1"><b style="font-size:12px">${name}</b><br><span style="font-size:11px;color:#64748b">₹${price} x ${item.qty||1}</span><br><small style="font-size:9px;color:#94a3b8">${prod.shopType||'kirana'} • World</small></div>
        <div style="display:flex;flex-direction:column;gap:4px;align-items:center"><button onclick="window.KiranaUserView.updateQty('${item.productId||item._id}',1)" style="width:26px;height:26px;border-radius:8px;border:1px solid #e2e8f0;background:#fff">+</button><span style="font-size:11px;font-weight:800">${item.qty||1}</span><button onclick="window.KiranaUserView.updateQty('${item.productId||item._id}',-1)" style="width:26px;height:26px;border-radius:8px;border:1px solid #e2e8f0;background:#fff">-</button></div>
      </div>`;
    }).join('');

    const subtotal = this.cart.reduce((sum,i)=>{ const pr = i.product?.price || i.price || 0; return sum + pr*(i.qty||1); }, 0);
    const el1 = document.getElementById('cartSubtotal'); if(el1) el1.innerText = `₹${subtotal}`;
    const el2 = document.getElementById('checkoutTotal'); if(el2) el2.innerText = `₹${subtotal}`;
    const el3 = document.getElementById('cartItemCountText'); if(el3) el3.innerText = `(${this.cart.length})`;
  }

  updateQty(productId, delta){
    const item = this.cart.find(c=> (c.productId===productId || c._id===productId));
    if(!item) return;
    item.qty = (item.qty||1) + delta;
    if(item.qty<=0){ this.cart = this.cart.filter(c=> (c.productId!==productId && c._id!==productId)); }
    if(window.CartCore){
      if(item.qty<=0) window.CartCore.removeFromCart(this.shopId, productId);
      else window.CartCore.updateQty(this.shopId, productId, item.qty);
      this.cart = window.CartCore.getCart(this.shopId);
    }
    this.renderCart();
    this.updateCartCount();
    window.StorageCore?.saveCart(this.cart);
    this.renderProducts(this.filteredProducts);
  }

  updateCartCount(){
    const count = this.cart.reduce((s,i)=> s + (i.qty||1), 0);
    const badge = document.getElementById('cartCount');
    if(badge){ badge.innerText=count; badge.style.display = count>0? 'block':'none'; }
    const bottomBadge = document.getElementById('bottomCartCount');
    if(bottomBadge){ bottomBadge.innerText=count; bottomBadge.style.display = count>0? 'inline-block':'none'; }
    if(window.CartCore){ window.CartCore.updateBadge(count); }
  }

  updateWishlistCount(){
    const badge = document.getElementById('wishlistCount');
    if(badge){ badge.innerText=this.wishlist.length; badge.style.display = this.wishlist.length? 'block':'none'; }
  }

  openCart(){ document.getElementById('cartDrawer')?.classList.add('open'); }
  closeCart(){ document.getElementById('cartDrawer')?.classList.remove('open'); }

  async addToWishlist(productId){
    try{
      if(window.WishlistCore){
        await window.WishlistCore.toggle(productId, this.shopId);
        this.wishlist = window.WishlistCore.getWishlist(this.shopId);
      }else{
        if(this.wishlist.includes(productId)) this.wishlist = this.wishlist.filter(id=>id!==productId);
        else this.wishlist.push(productId);
      }
      if(this.wishlist.includes(productId)) this.toast('Added to wishlist ❤️');
      else this.toast('Removed from wishlist');
      this.updateWishlistCount();
      this.renderProducts(this.filteredProducts.length? this.filteredProducts : this.allProducts);
    }catch(e){ this.toast('Wishlist failed'); }
  }

  openWishlist(){
    if(window.WishlistCore){ window.open(`../common/wishlist/wishlist.html?shopId=${this.shopId}`, '_blank'); }
    else{ this.toast(`Wishlist: ${this.wishlist.length} items ❤️`); }
  }

  shareShop(){
    const url = location.href;
    const text = `Check ${this.shopData.shopName||'Kirana Store'} on SamanLive - ${this.worldProducts.length} world products + ${this.oldProducts.length} old - Fresh kirana in 30 mins! ${url}`;
    if(navigator.share){ navigator.share({ title: this.shopData.shopName, text, url }).catch(()=>{}); }
    else if(window.WhatsAppShare){ window.WhatsAppShare.share(text); }
    else{ navigator.clipboard.writeText(url); this.toast('Shop link copied 📋 World store'); }
    window.ApiCore?.trackEvent('kirana_shop_shared_v13', { shopId: this.shopId, worldCount: this.worldProducts.length });
  }

  goCheckout(){
    if(!this.cart.length){ this.toast('Cart empty - add world products'); return; }
    window.StorageCore?.saveCart(this.cart);
    window.StorageCore?.set('checkout_shopId', this.shopId);
    window.StorageCore?.set('checkout_world_products', this.worldProducts.length);
    location.href = `../common/checkout/checkout.html?shopId=${this.shopId}`;
  }

  openProduct(productId){
    const p = this.allProducts.find(x=>x._id===productId);
    if(!p) return;
    this.toast(`${p.name} - ₹${p.price} - Stock: ${p.stock} - ${p.shopType||'kirana'} ${p.extraData?'🌍 World':''}`);
    if(window.ApiCore) window.ApiCore.trackEvent('product_view_v13', { productId, shopId: this.shopId, isWorld:!!p.shopType });
  }

  voiceSearch(){
    if(!('webkitSpeechRecognition' in window) &&!('SpeechRecognition' in window)){ this.toast('Voice not supported'); return; }
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Speech();
    rec.lang = 'hi-IN';
    rec.onresult = (e)=>{
      const text = e.results[0][0].transcript;
      const inp = document.getElementById('searchInput'); if(inp) inp.value = text;
      this.handleSearch(text);
      this.toast(`Voice: ${text} 🎤`);
    };
    rec.start();
    this.toast('Listening... bolo atta, dal, oil');
  }

  handleShopStatus(){
    if(!this.isShopOpen){
      this.toast('Shop is closed - orders paused 🔴');
      const btn = document.getElementById('cartBtn'); if(btn) btn.style.opacity='0.5';
    }
  }

  bindSocket(){
    if(!window.SocketCore) return;
    window.SocketCore.on('shop-status-changed', (data)=>{
      if(data.shopId===this.shopId){
        this.isShopOpen = data.isOpen;
        this.handleShopStatus();
        const ot = document.getElementById('openText'); if(ot) ot.innerText = data.isOpen? 'Open Now' : 'Closed';
        const op = document.getElementById('openPill'); if(op) op.className = `pill ${data.isOpen? 'open':'closed'}`;
      }
    });
    window.SocketCore.on('product-updated', (data)=>{
      if(data.shopId===this.shopId){ this.loadShop(); }
    });
  }

  showLoader(show){ const el=document.getElementById('loader'); if(el) el.style.display=show?'grid':'none'; }
  showError(msg){ const grid=document.getElementById('productGrid'); if(grid) grid.innerHTML=`<div class="empty" style="color:#ef4444"><h3>Error</h3><p style="font-size:12px">${msg}<br><small>World API: /api/world-products?shopId=${this.shopId}&type=kirana<br>Old API: /api/shops/kirana/${this.shopId}</small></p></div>`; }
  toast(msg){ const t=document.getElementById('toast'); if(!t) return; t.innerText=msg; t.style.display='block'; setTimeout(()=> t.style.display='none', 3500); }
}

window.KiranaUserView = new KiranaUserViewCore();
window.KiranaUserViewCore = window.KiranaUserView;

// Global helpers
window.addToCart = (id)=> window.KiranaUserView.addToCart(id);
window.addToWishlist = (id)=> window.KiranaUserView.addToWishlist(id);