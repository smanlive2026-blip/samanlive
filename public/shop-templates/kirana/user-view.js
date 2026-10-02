// LOCATION: public/shop-templates/kirana/user-view.js - WORLD CLASS USER VIEW JS - V10 FINAL - PURA COMMON CONNECTED - CART + WISHLIST + CHECKOUT + REVIEWS + SHARE
class KiranaUserViewCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('last_shopId') || '';
    this.shopData = null;
    this.allProducts = [];
    this.filteredProducts = [];
    this.categories = [];
    this.cart = [];
    this.wishlist = [];
    this.activeCat = 'all';
    this.isShopOpen = true;
    this.init();
  }

  async init(){
    console.log(`🛍️ KiranaUserViewCore V10 - shopId: ${this.shopId} - Common Connected`);
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
    }
    if(window.WishlistCore){
      window.WishlistCore.shopId = this.shopId;
    }

    window.ApiCore?.trackEvent('kirana_user_view_v10', { shopId: this.shopId });
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
  }

  async loadShop(){
    try{
      this.showLoader(true);
      // 1. OLD KIRANA API
      const data = await window.ApiCore.get(`/api/shops/kirana/${this.shopId}`);
      if(!data.success) throw new Error(data.message);
      this.shopData = data.shop;
      this.allProducts = this.shopData.products || [];
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

      // Check shop open
      this.handleShopStatus();

    }catch(e){
      window.ErrorHandler?.handleApiError(e, 'kirana_user_view');
      this.showError(e.message);
    }finally{
      this.showLoader(false);
    }
  }

  renderShopHeader(){
    const s = this.shopData;
    document.getElementById('shopName').innerText = s.shopName || s.name || 'Kirana Store';
    document.getElementById('shopLogoLetter').innerText = (s.shopName||'K')[0].toUpperCase();
    document.getElementById('shopArea').innerText = s.area || s.address || 'Local Market';
    document.getElementById('shopRating').innerText = s.rating || '4.5';
    document.getElementById('bannerTitle').innerText = s.bannerTitle || `${s.shopName||'Kirana'} - Fresh Daily`;
    document.getElementById('openText').innerText = this.isShopOpen? 'Open Now' : 'Closed';
    document.getElementById('openPill').className = `pill ${this.isShopOpen? 'open' : 'closed'}`;
    document.getElementById('shopStatusBadge').innerText = this.isShopOpen? 'OPEN' : 'CLOSED';
    document.getElementById('shopStatusBadge').className = `pill ${this.isShopOpen? 'open' : 'closed'}`;
  }

  renderCategories(){
    const cats = ['all',...new Set(this.allProducts.map(p=> p.category||'general'))].slice(0,12);
    this.categories = cats;
    document.getElementById('categoryList').innerHTML = cats.map(c=>`<div class="cat ${this.activeCat===c? 'active':''}" data-cat="${c}">${c.toUpperCase()}</div>`).join('');
    document.querySelectorAll('.cat').forEach(el=>{
      el.addEventListener('click', ()=>{
        document.querySelectorAll('.cat').forEach(x=>x.classList.remove('active'));
        el.classList.add('active');
        this.activeCat = el.dataset.cat;
        this.filterByCategory(this.activeCat);
      });
    });
  }

  renderProducts(list){
    const grid = document.getElementById('productGrid');
    if(!list.length){
      grid.innerHTML = `<div class="empty"><div style="font-size:48px">🔍</div><h3>No products found</h3><p style="color:#94a3b8;font-size:12px;margin-top:6px">Try another category or search</p></div>`;
      return;
    }
    grid.innerHTML = list.map(p=>`
      <div class="card">
        <button class="wish ${this.wishlist.includes(p._id)? 'active':''}" onclick="window.KiranaUserView.addToWishlist('${p._id}')"><i class="${this.wishlist.includes(p._id)? 'fa-solid' : 'fa-regular'} fa-heart"></i></button>
        <img src="${p.image||`https://source.unsplash.com/400x300/?${encodeURIComponent(p.category||'grocery')}`}" loading="lazy" onerror="this.src='https://placehold.co/400x300/f8fafc/94a3b8?text=${encodeURIComponent(p.name.slice(0,10))}'" onclick="window.KiranaUserView.openProduct('${p._id}')">
        <div class="info">
          <b>${p.name}</b>
          <div class="meta">${p.brand||''} ${p.brand?'•':''} ${p.weight||p.unit||''}</div>
          <div class="price-row">
            <div class="price">₹${p.price}${p.mrp?`<del>₹${p.mrp}</del>`:''}</div>
            <button class="add" onclick="window.KiranaUserView.addToCart('${p._id}')" ${!this.isShopOpen? 'disabled style="opacity:.4"':''}><i class="fa-solid fa-plus"></i></button>
          </div>
          <div style="font-size:10px;color:${p.stock>0?'#10b981':'#ef4444'};margin-top:4px;font-weight:700">${p.stock>0? `${p.stock} in stock` : 'Out of stock'} • Common: cart-core.js</div>
        </div>
      </div>
    `).join('');
  }

  filterByCategory(cat){
    if(cat==='all'){ this.filteredProducts=[...this.allProducts]; }
    else{ this.filteredProducts = this.allProducts.filter(p=> (p.category||'').toLowerCase()===cat.toLowerCase()); }
    const searchVal = document.getElementById('searchInput')?.value || '';
    if(searchVal) this.handleSearch(searchVal, true);
    else this.renderProducts(this.filteredProducts);
  }

  handleSearch(q, skipCat=false){
    const query = q.toLowerCase().trim();
    let base = skipCat? this.filteredProducts : (this.activeCat==='all'? this.allProducts : this.allProducts.filter(p=> (p.category||'').toLowerCase()===this.activeCat));
    if(!query){ this.renderProducts(base); return; }

    // Use common search utils if available
    let result = base.filter(p=>
      (p.name||'').toLowerCase().includes(query) ||
      (p.category||'').toLowerCase().includes(query) ||
      (p.brand||'').toLowerCase().includes(query)
    );

    // Also try common search API
    if(window.SearchCore){
      window.SearchCore.trackSearch(query, this.shopId);
    }

    this.renderProducts(result);
  }

  // COMMON CART
  async addToCart(productId){
    if(!this.isShopOpen){ this.toast('Shop is closed now'); return; }
    const product = this.allProducts.find(p=>p._id===productId);
    if(!product){ this.toast('Product not found'); return; }
    if(product.stock<=0){ this.toast('Out of stock'); return; }

    try{
      // Try common cart API
      if(window.CartCore){
        await window.CartCore.addItem({ productId, shopId: this.shopId, qty:1, product });
      }

      // Also local
      const existing = this.cart.find(c=>c.productId===productId);
      if(existing) existing.qty +=1;
      else this.cart.push({ productId, qty:1, product, price: product.price });

      // Save via common storage
      window.StorageCore?.saveCart(this.cart);
      window.ApiCore?.post(`/api/common/cart/${this.shopId}/add`, { productId, qty:1 }).catch(()=>{});

      this.renderCart();
      this.updateCartCount();
      this.toast(`${product.name} added ✅`);

      // Haptic
      if(navigator.vibrate) navigator.vibrate(50);

    }catch(e){
      this.toast('Failed to add to cart');
    }
  }

  renderCart(){
    const container = document.getElementById('cartItems');
    if(!container) return;
    if(!this.cart.length){
      container.innerHTML = `<div style="text-align:center;padding:40px 20px"><div style="font-size:40px">🛒</div><h4 style="margin-top:8px">Cart empty</h4><p style="font-size:12px;color:#94a3b8">Add some kirana items<br><small>Common: cart-core.js + /api/common/cart</small></p></div>`;
      document.getElementById('cartSubtotal').innerText='₹0';
      document.getElementById('checkoutTotal').innerText='₹0';
      return;
    }
    container.innerHTML = this.cart.map(item=>`
      <div style="display:flex;gap:10px;background:#f8fafc;padding:8px;border-radius:12px;border:1px solid #f1f5f9">
        <img src="${item.product?.image||''}" style="width:50px;height:50px;border-radius:10px;object-fit:cover;background:#fff" onerror="this.src='https://placehold.co/100'">
        <div style="flex:1"><b style="font-size:12px">${item.product?.name||'Product'}</b><br><span style="font-size:11px;color:#64748b">₹${item.product?.price||item.price} x ${item.qty}</span></div>
        <div style="display:flex;flex-direction:column;gap:4px;align-items:center"><button onclick="window.KiranaUserView.updateQty('${item.productId}',1)" style="width:24px;height:24px;border-radius:6px;border:1px solid #e2e8f0;background:#fff">+</button><span style="font-size:11px;font-weight:800">${item.qty}</span><button onclick="window.KiranaUserView.updateQty('${item.productId}',-1)" style="width:24px;height:24px;border-radius:6px;border:1px solid #e2e8f0;background:#fff">-</button></div>
      </div>
    `).join('');

    const subtotal = this.cart.reduce((sum,i)=> sum + (i.product?.price||i.price||0)*i.qty, 0);
    document.getElementById('cartSubtotal').innerText = `₹${subtotal}`;
    document.getElementById('checkoutTotal').innerText = `₹${subtotal}`;
    document.getElementById('cartItemCountText').innerText = `(${this.cart.length})`;
  }

  updateQty(productId, delta){
    const item = this.cart.find(c=>c.productId===productId);
    if(!item) return;
    item.qty += delta;
    if(item.qty<=0){ this.cart = this.cart.filter(c=>c.productId!==productId); }
    this.renderCart();
    this.updateCartCount();
    window.StorageCore?.saveCart(this.cart);
  }

  updateCartCount(){
    const count = this.cart.reduce((s,i)=> s + i.qty, 0);
    const badge = document.getElementById('cartCount');
    if(badge){ badge.innerText=count; badge.style.display = count>0? 'block':'none'; }
    // Also update common cart-count
    if(window.CartCore){
      window.CartCore.updateBadge(count);
    }
  }

  openCart(){ document.getElementById('cartDrawer')?.classList.add('open'); }
  closeCart(){ document.getElementById('cartDrawer')?.classList.remove('open'); }

  async addToWishlist(productId){
    try{
      if(window.WishlistCore){
        await window.WishlistCore.toggle(productId, this.shopId);
      }
      if(this.wishlist.includes(productId)){
        this.wishlist = this.wishlist.filter(id=>id!==productId);
        this.toast('Removed from wishlist');
      } else {
        this.wishlist.push(productId);
        this.toast('Added to wishlist ❤️');
      }
      document.getElementById('wishlistCount').innerText = this.wishlist.length;
      document.getElementById('wishlistCount').style.display = this.wishlist.length? 'block':'none';
      this.renderProducts(this.filteredProducts.length? this.filteredProducts : this.allProducts);
    }catch(e){ this.toast('Wishlist failed'); }
  }

  openWishlist(){
    if(window.WishlistCore){
      window.open(`../common/wishlist/wishlist.html?shopId=${this.shopId}`, '_blank');
    } else {
      this.toast(`Wishlist: ${this.wishlist.length} items`);
    }
  }

  shareShop(){
    const url = location.href;
    const text = `Check ${this.shopData.shopName||'Kirana Store'} on SamanLive - Fresh kirana in 30 mins! ${url}`;
    if(navigator.share){
      navigator.share({ title: this.shopData.shopName, text, url }).catch(()=>{});
    } else if(window.WhatsAppShare){
      window.WhatsAppShare.share(text);
    } else {
      navigator.clipboard.writeText(url);
      this.toast('Shop link copied 📋');
    }
    window.ApiCore?.trackEvent('kirana_shop_shared', { shopId: this.shopId });
  }

  goCheckout(){
    if(!this.cart.length){ this.toast('Cart empty'); return; }
    // Save cart for common checkout
    window.StorageCore?.saveCart(this.cart);
    window.StorageCore?.set('checkout_shopId', this.shopId);
    // Common checkout
    location.href = `../common/checkout/checkout.html?shopId=${this.shopId}`;
  }

  openProduct(productId){
    const p = this.allProducts.find(x=>x._id===productId);
    if(!p) return;
    // Common product quick view
    if(document.getElementById('productQuickView')){
      // open modal
    } else {
      // fallback - show toast with details
      this.toast(`${p.name} - ₹${p.price} - ${p.stock} left`);
    }
  }

  voiceSearch(){
    if(!('webkitSpeechRecognition' in window) &&!('SpeechRecognition' in window)){
      this.toast('Voice not supported');
      return;
    }
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Speech();
    rec.lang = 'hi-IN';
    rec.onresult = (e)=>{
      const text = e.results[0][0].transcript;
      document.getElementById('searchInput').value = text;
      this.handleSearch(text);
      this.toast(`Voice: ${text}`);
    };
    rec.start();
    this.toast('Listening... bolo atta, dal, oil');
  }

  handleShopStatus(){
    if(!this.isShopOpen){
      this.toast('Shop is closed - orders paused');
      document.getElementById('cartBtn').style.opacity = '0.5';
    }
  }

  bindSocket(){
    if(!window.SocketCore) return;
    window.SocketCore.on('shop-status-changed', (data)=>{
      if(data.shopId===this.shopId){
        this.isShopOpen = data.isOpen;
        this.handleShopStatus();
        document.getElementById('openText').innerText = data.isOpen? 'Open Now' : 'Closed';
        document.getElementById('openPill').className = `pill ${data.isOpen? 'open':'closed'}`;
      }
    });
  }

  showLoader(show){
    // simple
  }

  showError(msg){
    document.getElementById('productGrid').innerHTML = `<div class="empty" style="color:#ef4444"><h3>Error</h3><p style="font-size:12px">${msg}</p></div>`;
  }

  toast(msg){
    const t=document.getElementById('toast');
    if(!t) return;
    t.innerText=msg;
    t.style.display='block';
    setTimeout(()=> t.style.display='none', 3000);
  }
}

window.KiranaUserView = new KiranaUserViewCore();
window.KiranaUserViewCore = window.KiranaUserView;