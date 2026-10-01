// LOCATION: public/shop-templates/mobile/customer.js
// MOBILE CUSTOMER VIEW JS - BRIDGE CONNECTED - ALL COMMON MODULES

class MobileCustomer {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('shopId') || 'mobile_'+Date.now();
    this.products = [];
    this.filteredProducts = [];
    this.cart = JSON.parse(localStorage.getItem(`cart_${this.shopId}`)||'[]');
    this.wishlist = JSON.parse(localStorage.getItem(`wishlist_guest` )||'[]');
    this.filter = 'all';
    this.searchQuery = '';
  }

  async init(){
    console.log("📱 Mobile Customer Init - Bridge common modules:", typeof SAMAN!=='undefined'?'✅':'❌ Manual');

    this.products = JSON.parse(localStorage.getItem(`products_${this.shopId}`)||'[]');
    if(this.products.length===0){
      this.products = this.getReadyProducts();
      localStorage.setItem(`products_${this.shopId}`, JSON.stringify(this.products));
    }

    this.filteredProducts = [...this.products];

    await this.initCommonModules();

    this.renderProducts(this.filteredProducts);
    this.renderReviews();
    this.updateBadges();
    this.bindEvents();
    this.checkShopStatus();
    this.initSocket();
  }

  getReadyProducts(){
    return [
      { id:'m1', name:'iPhone 15 Pro Max 256GB', brand:'Apple', category:'smartphone', price:134900, originalPrice:159900, stock:5, image:'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300', ram:'8GB', storage:'256GB', color:'Natural Titanium', rating:4.9, reviews:124, emi:true, exchange:true, specs:'A17 Pro, 48MP, 5G' },
      { id:'m2', name:'Samsung Galaxy S24 Ultra 512GB', brand:'Samsung', category:'smartphone', price:129999, originalPrice:139999, stock:8, image:'https://images.unsplash.com/photo-1610945265064-0e34e730d4d0?w=300', ram:'12GB', storage:'512GB', color:'Titanium Black', rating:4.8, reviews:89, emi:true, exchange:true, specs:'Snapdragon 8 Gen 3, 200MP' },
      { id:'m3', name:'OnePlus 12R 256GB', brand:'OnePlus', category:'smartphone', price:42999, originalPrice:49999, stock:12, image:'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300', ram:'16GB', storage:'256GB', color:'Iron Gray', rating:4.7, reviews:156, emi:true, specs:'Snapdragon 8 Gen 2, 100W' },
      { id:'m4', name:'Redmi Note 13 Pro 256GB', brand:'Xiaomi', category:'smartphone', price:24999, originalPrice:29999, stock:20, image:'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300', ram:'12GB', storage:'256GB', color:'Midnight Black', rating:4.6, reviews:203, emi:true, specs:'200MP, 67W' },
      { id:'m5', name:'Vivo V30 Pro 256GB', brand:'Vivo', category:'smartphone', price:41999, originalPrice:46999, stock:6, image:'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300', ram:'12GB', storage:'256GB', color:'Peacock Green', rating:4.5, reviews:67, emi:true, specs:'Dimensity 8200, Zeiss' },
      { id:'m6', name:'AirPods Pro 2nd Gen', brand:'Apple', category:'accessories', price:24900, originalPrice:26900, stock:15, image:'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=300', rating:4.8, reviews:342, specs:'ANC, MagSafe' },
      { id:'m7', name:'Samsung Galaxy Watch 6', brand:'Samsung', category:'accessories', price:29999, originalPrice:32999, stock:10, image:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300', rating:4.7, reviews:89, specs:'Bluetooth, GPS' },
      { id:'m8', name:'Nokia 105 Feature Phone', brand:'Nokia', category:'feature', price:1499, originalPrice:1999, stock:30, image:'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=300', rating:4.3, reviews:45, specs:'FM Radio, Torch' }
    ];
  }

  async initCommonModules(){
    try{
      // Cart - common/cart/cart-core.js
      if(window.CartCore){
        await window.CartCore.init();
        this.cart = window.CartCore.getCart();
      }

      // Cart count - common/cart/cart-count.js
      if(window.CartCount){
        window.CartCount.update();
      }

      // Wishlist - common/js/wishlist.js
      if(window.WishlistCore){
        await window.WishlistCore.init();
        this.wishlist = window.WishlistCore.getWishlist();
      }

      // Search - common/js/search.js
      if(window.SearchCore){
        window.SearchCore.products = this.products;
      }

      // Filter - common/js/filter.js + utils/filter.js
      if(window.FilterCore){
        window.FilterCore.products = this.products;
      }

      // Reviews - common/reviews/reviews.js + rating-widget.html
      if(window.ReviewCore){
        await window.ReviewCore.init();
      }

      // Share - common/js/share.js + whatsapp-share.js + qr-share.js
      if(window.ShareCore){
        console.log("✅ Share ready - common/share/*");
      }

      // Shop status - common/js/customer-shop-status.js
      if(window.CustomerShopStatus){
        await window.CustomerShopStatus.init();
      }

      // Coupons - common/marketing/apply-coupon.js
      if(window.CouponCore){
        await window.CouponCore.init();
      }

      // User core - common/js/user-core.js
      if(window.UserCore){
        await window.UserCore.init();
      }

    }catch(e){ console.log("Common modules fallback", e); }
  }

  renderProducts(productsToRender){
    const grid = document.getElementById('productsGrid');
    const empty = document.getElementById('productsEmpty');

    if(!grid) return;

    if(productsToRender.length===0){
      grid.style.display='none';
      if(empty) empty.style.display='block';
      return;
    }

    grid.style.display='grid';
    if(empty) empty.style.display='none';

    grid.innerHTML = productsToRender.map(product=>{
      const discount = product.originalPrice>product.price? Math.round(((product.originalPrice-product.price)/product.originalPrice)*100) : 0;
      const isInWishlist = this.wishlist.find(p=> (p.id||p._id)===product.id);
      const isInCart = this.cart.find(p=> (p.id||p._id)===product.id);

      return `
        <div class="product-card" data-product-id="${product.id}" onclick="MobileCustomerInstance.openProductDetail('${product.id}')">
          <img src="${product.image}" class="product-image" onerror="this.src='https://via.placeholder.com/150?text=📱'">
          ${discount>0?`<div class="product-badge">${discount}% OFF</div>`:''}
          ${product.emi?`<div class="product-badge emi">💳 EMI</div>`:''}
          <div class="product-info">
            <b>${product.name}</b>
            <span>${product.brand} • ${product.ram||''} ${product.storage||''} • ⭐ ${product.rating||4.5} (${product.reviews||0})</span>
            <div class="product-specs">
              ${product.specs?product.specs.split(',').slice(0,2).map(s=>`<span class="spec-tag">${s.trim()}</span>`).join(''):''}
            </div>
            <div class="product-price">
              <div><b>₹${product.price.toLocaleString('en-IN')}</b>${product.originalPrice>product.price?`<br><span class="product-price-original">₹${product.originalPrice.toLocaleString('en-IN')}</span>`:''}</div>
              <span style="font-size:9px;background:${product.stock>0?'#dcfce7;color:#166534':'#fee2e2;color:#991b1b'};padding:2px 6px;border-radius:20px;font-weight:700">${product.stock>0?'In Stock':'Out of Stock'}</span>
            </div>
            <div class="product-actions">
              <button class="action-btn add-cart-btn" onclick="event.stopPropagation(); MobileCustomerInstance.addToCart('${product.id}')" ${product.stock===0?'disabled':''}>${isInCart?'✅ In Cart':'🛒 Add'}</button>
              <button class="action-btn wishlist-btn ${isInWishlist?'active':''}" onclick="event.stopPropagation(); MobileCustomerInstance.toggleWishlist('${product.id}')">${isInWishlist?'❤️':'🤍'}</button>
            </div>
            ${product.exchange?`<div style="font-size:9px;color:#059669;font-weight:700;margin-top:4px">🔄 Exchange bonus ₹5,000</div>`:''}
          </div>
        </div>
      `;
    }).join('');

    // Use common product-card.js if available - common/components/product-card.js
    if(window.ProductCardCore){
      // ProductCardCore can enhance rendering
    }
  }

  renderReviews(){
    const container = document.getElementById('reviewsList');
    if(!container) return;

    const reviews = [
      { name:'Rahul K.', rating:5, text:'Best mobile shop in Surat! Got iPhone 15 Pro Max at best price with EMI. Fast delivery!', date:'2 days ago', verified:true },
      { name:'Priya S.', rating:5, text:'Exchange offer was amazing! Got ₹8000 for old phone. Staff very helpful ❤️', date:'1 week ago', verified:true },
      { name:'Amit P.', rating:4, text:'Good collection, competitive prices. AirPods Pro delivered in 30 mins. Recommended!', date:'2 weeks ago', verified:true }
    ];

    container.innerHTML = reviews.map(r=>`
      <div style="background:#f8fafc;border-radius:10px;padding:10px;display:flex;gap:10px">
        <div style="width:32px;height:32px;background:#0f172a;color:#fff;border-radius:50%;display:grid;place-items:center;font-weight:900;font-size:12px">${r.name[0]}</div>
        <div style="flex:1">
          <div style="display:flex;gap:6px;align-items:center"><b style="font-size:12px">${r.name}</b><span style="font-size:10px">${'⭐'.repeat(r.rating)}</span>${r.verified?'<span style="font-size:8px;background:#dcfce7;color:#166534;padding:2px 6px;border-radius:20px;font-weight:700">✅ Verified</span>':''}</div>
          <span style="font-size:11px;color:#475569;display:block;margin-top:2px;line-height:1.3">${r.text}</span>
          <span style="font-size:9px;color:#94a3b8">${r.date}</span>
        </div>
      </div>
    `).join('');

    // Use common rating widget - common/reviews/rating-widget.html
    if(window.ReviewCore){
      document.getElementById('ratingValue').innerText = window.ReviewCore.getAverage().toFixed(1);
      document.getElementById('ratingCount').innerText = `${window.ReviewCore.getCount()} reviews • 98% positive`;
    }
  }

  addToCart(productId){
    const product = this.products.find(p=> p.id===productId);

    if(!product || product.stock===0){
      this.showToast('Out of stock', 'warning');
      return;
    }

    // Use common cart - common/cart/cart-core.js
    if(window.CartCore){
      window.CartCore.addToCart({ ...product, shopId:this.shopId, quantity:1 });
      this.cart = window.CartCore.getCart();
    } else {
      const existing = this.cart.find(p=> p.id===productId);
      if(existing){
        existing.quantity = (existing.quantity||1)+1;
      } else {
        this.cart.push({ ...product, quantity:1, shopId:this.shopId });
      }
      localStorage.setItem(`cart_${this.shopId}`, JSON.stringify(this.cart));
    }

    this.updateBadges();
    this.renderProducts(this.filteredProducts);
    this.showToast(`${product.name} added to cart 🛒`, 'success');

    // Show cart badge - common/cart/cart-count.js
    const cartBadge = document.getElementById('cartTotalBadge');
    if(cartBadge){
      cartBadge.style.display='flex';
      document.getElementById('cartTotalItems').innerText = `${this.cart.reduce((sum,p)=> sum+(p.quantity||1),0)} items`;
      const total = this.cart.reduce((sum,p)=> sum+(p.price*(p.quantity||1)),0);
      document.getElementById('cartTotalPrice').innerText = `₹${total.toLocaleString('en-IN')} • Free delivery`;
    }
  }

  toggleWishlist(productId){
    const product = this.products.find(p=> p.id===productId);

    // Use common wishlist - common/js/wishlist.js
    if(window.WishlistCore){
      window.WishlistCore.toggleWishlist(product);
      this.wishlist = window.WishlistCore.getWishlist();
    } else {
      const exists = this.wishlist.find(p=> p.id===productId);
      if(exists){
        this.wishlist = this.wishlist.filter(p=> p.id!==productId);
        this.showToast('Removed from wishlist', 'info');
      } else {
        this.wishlist.push(product);
        this.showToast(`${product.name} added to wishlist ❤️`, 'success');
      }
      localStorage.setItem(`wishlist_guest`, JSON.stringify(this.wishlist));
    }

    this.updateBadges();
    this.renderProducts(this.filteredProducts);
  }

  openProductDetail(productId){
    // In real, go to product detail - for now show modal or go to shop.html?productId
    window.location.href=`/shop.html?shopId=${this.shopId}&productId=${productId}`;
  }

  filterByCategory(category){
    this.filter = category;
    if(category==='all'){
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = this.products.filter(p=> p.category===category);
    }

    document.querySelectorAll('.cat-btn').forEach(btn=>{
      btn.classList.remove('active');
      if(btn.dataset.category===category) btn.classList.add('active');
    });

    this.renderProducts(this.filteredProducts);

    // Use common filter - common/js/filter.js
    if(window.FilterCore){
      window.FilterCore.applyFilters({ category:category==='all'?'':category });
    }
  }

  filterByBrand(brand){
    this.filteredProducts = this.products.filter(p=> p.brand===brand);

    document.querySelectorAll('.cat-btn').forEach(btn=>{
      btn.classList.remove('active');
      if(btn.dataset.brand===brand) btn.classList.add('active');
    });

    this.renderProducts(this.filteredProducts);

    if(window.FilterCore){
      window.FilterCore.applyFilters({ brand });
    }
  }

  search(query){
    this.searchQuery = query.toLowerCase();

    if(!query){
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = this.products.filter(p=>
        (p.name||'').toLowerCase().includes(this.searchQuery) ||
        (p.brand||'').toLowerCase().includes(this.searchQuery) ||
        (p.specs||'').toLowerCase().includes(this.searchQuery)
      );
    }

    this.renderProducts(this.filteredProducts);

    // Use common search - common/js/search.js
    if(window.SearchCore){
      const results = window.SearchCore.search(query);
      if(results.length>0) this.renderProducts(results);
    }
  }

  updateBadges(){
    try{
      const cartCount = this.cart.reduce((sum,p)=> sum+(p.quantity||1),0);
      const wishlistCount = this.wishlist.length;

      const setBadge = (id,count)=>{
        const el = document.getElementById(id);
        if(el){
          if(count>0){
            el.innerText = count>99?'99+':count;
            el.style.display='grid';
          } else {
            el.style.display='none';
          }
        }
      };

      setBadge('cartBadge', cartCount);
      setBadge('cartNavBadge', cartCount);
      setBadge('wishlistBadge', wishlistCount);
      setBadge('wishlistNavBadge', wishlistCount);

      // Use common cart count - common/cart/cart-count.js
      if(window.CartCount){
        window.CartCount.update();
      }

      // Use common wishlist badge - common/js/wishlist.js
      if(window.WishlistCore){
        window.WishlistCore.updateBadge();
      }

      // Cart total badge
      const cartTotalBadge = document.getElementById('cartTotalBadge');
      if(cartTotalBadge){
        if(cartCount>0){
          cartTotalBadge.style.display='flex';
          document.getElementById('cartTotalItems').innerText = `${cartCount} items`;
          const total = this.cart.reduce((sum,p)=> sum+(p.price*(p.quantity||1)),0);
          document.getElementById('cartTotalPrice').innerText = `₹${total.toLocaleString('en-IN')} • Free delivery`;
        } else {
          cartTotalBadge.style.display='none';
        }
      }

    }catch(e){}
  }

  checkShopStatus(){
    const isOpen = localStorage.getItem(`shop_open_${this.shopId}`)!=='false';
    const statusBadge = document.getElementById('shopStatusBadge');

    if(statusBadge){
      if(isOpen){
        statusBadge.innerHTML='🟢 Open • Delivery in 30 mins';
        statusBadge.className='status-badge';
      } else {
        statusBadge.innerHTML='🔴 Closed • Opens at 9 AM';
        statusBadge.className='status-badge closed';
      }
    }

    // Use common customer shop status - common/js/customer-shop-status.js
    if(window.CustomerShopStatus){
      window.CustomerShopStatus.checkStatus();
    }
  }

  shareShop(){
    // Use common share - common/share/whatsapp-share.js + shop-link-share.html + instagram-story-share.js
    if(window.ShareCore){
      window.ShareCore.shareShopOnWhatsApp({ shopId:this.shopId, name:'Mobile World', address:'Adajan, Surat' });
    } else if(window.WhatsappShare){
      window.WhatsappShare.shareShop({ shopId:this.shopId, name:'Mobile World' });
    } else {
      const link = `${location.origin}/shop.html?shopId=${this.shopId}`;
      const msg = `📱 Mobile World - Best mobiles in Surat!\n🔗 ${link}\n\n✅ EMI Available\n✅ Exchange Offer\n✅ Fast Delivery`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    }
  }

  openCart(){
    // Use common cart drawer - common/cart/cart-drawer.html + cart-core.js
    const drawer = document.getElementById('cartDrawer');
    if(drawer){
      drawer.classList.add('active');
      this.renderCartDrawer();
    } else {
      window.location.href=`../common/cart/cart.html?shopId=${this.shopId}`;
    }

    if(window.CartDrawer){
      window.CartDrawer.open();
    }
  }

  closeCart(){
    const drawer = document.getElementById('cartDrawer');
    if(drawer) drawer.classList.remove('active');

    if(window.CartDrawer){
      window.CartDrawer.close();
    }
  }

  renderCartDrawer(){
    const container = document.getElementById('cartDrawerItems');
    const totalContainer = document.getElementById('cartDrawerTotal');

    if(!container) return;

    if(this.cart.length===0){
      container.innerHTML='<div style="text-align:center;padding:20px;color:#64748b">Cart is empty<br>Add mobiles to cart!</div>';
      if(totalContainer) totalContainer.innerHTML='';
      return;
    }

    container.innerHTML = this.cart.map(item=>`
      <div style="display:flex;gap:10px;padding:10px;border:1px solid #f1f5f9;border-radius:12px;margin-bottom:8px">
        <img src="${item.image}" style="width:50px;height:50px;border-radius:8px;object-fit:cover" onerror="this.src='https://via.placeholder.com/50?text=📱'">
        <div style="flex:1">
          <b style="display:block;font-size:12px">${item.name}</b>
          <span style="font-size:10px;color:#64748b">₹${item.price.toLocaleString('en-IN')} x ${item.quantity||1}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px">
          <button onclick="MobileCustomerInstance.updateCartQty('${item.id}', ${(item.quantity||1)+1})" style="background:#f1f5f9;border:none;width:24px;height:24px;border-radius:50%;cursor:pointer">+</button>
          <button onclick="MobileCustomerInstance.updateCartQty('${item.id}', ${(item.quantity||1)-1})" style="background:#f1f5f9;border:none;width:24px;height:24px;border-radius:50%;cursor:pointer">-</button>
        </div>
      </div>
    `).join('');

    const total = this.cart.reduce((sum,p)=> sum+(p.price*(p.quantity||1)),0);
    const items = this.cart.reduce((sum,p)=> sum+(p.quantity||1),0);

    if(totalContainer){
      totalContainer.innerHTML=`
        <div style="display:flex;justify-content:space-between;font-size:12px"><span>Subtotal (${items} items)</span><b>₹${total.toLocaleString('en-IN')}</b></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:6px"><span>Delivery</span><b style="color:#10b981">Free</b></div>
        <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:900;margin-top:10px;padding-top:10px;border-top:1px solid #f1f5f9"><span>Total</span><b>₹${total.toLocaleString('en-IN')}</b></div>
      `;
    }
  }

  updateCartQty(productId, newQty){
    if(newQty<=0){
      this.cart = this.cart.filter(p=> p.id!==productId);
    } else {
      const item = this.cart.find(p=> p.id===productId);
      if(item) item.quantity = newQty;
    }

    localStorage.setItem(`cart_${this.shopId}`, JSON.stringify(this.cart));

    if(window.CartCore){
      if(newQty<=0) window.CartCore.removeFromCart(productId);
      else window.CartCore.updateQuantity(productId, newQty);
      this.cart = window.CartCore.getCart();
    }

    this.updateBadges();
    this.renderCartDrawer();
    this.renderProducts(this.filteredProducts);
  }

  bindEvents(){
    document.getElementById('shareShopBtn')?.addEventListener('click', ()=> this.shareShop());
    document.getElementById('cartHeaderBtn')?.addEventListener('click', ()=> this.openCart());
    document.getElementById('cartTotalBadge')?.addEventListener('click', ()=> this.openCart());
    document.getElementById('wishlistHeaderBtn')?.addEventListener('click', ()=> window.location.href=`../common/wishlist/wishlist.html?shopId=${this.shopId}`);
    document.getElementById('checkoutBtn')?.addEventListener('click', ()=> window.location.href=`../common/checkout/checkout.html?shopId=${this.shopId}`);

    document.querySelectorAll('.cat-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        document.querySelectorAll('.cat-btn').forEach(b=> b.classList.remove('active'));
        btn.classList.add('active');

        if(btn.dataset.category){
          this.filterByCategory(btn.dataset.category);
        } else if(btn.dataset.brand){
          this.filterByBrand(btn.dataset.brand);
        }
      });
    });

    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');

    if(searchInput){
      searchInput.addEventListener('input', (e)=>{
        const query = e.target.value;
        this.search(query);
        if(clearSearch) clearSearch.style.display = query?'block':'none';
      });
    }

    if(clearSearch){
      clearSearch.addEventListener('click', ()=>{
        if(searchInput) searchInput.value='';
        this.search('');
        clearSearch.style.display='none';
      });
    }
  }

  initSocket(){
    try{
      const socket = io();

      socket.on('connect', ()=>{
        socket.emit('join-shop', this.shopId);
        console.log("✅ Customer view socket - common/js/customer-shop-status.js + live");
      });

      socket.on('shop-status-changed', (data)=>{
        if(data.shopId===this.shopId){
          this.checkShopStatus();
          this.showToast(data.isOpen?'🟢 Shop is now open!':'🔴 Shop is closed', data.isOpen?'success':'info');
        }
      });

      socket.on('product-updated', (data)=>{
        if(data.shopId===this.shopId){
          this.products = JSON.parse(localStorage.getItem(`products_${this.shopId}`)||'[]');
          this.filteredProducts = [...this.products];
          this.renderProducts(this.filteredProducts);
        }
      });

    }catch(e){}
  }

  showToast(msg, type='info'){
    const toast = document.getElementById('toast');
    if(!toast){ console.log(msg); return; }
    toast.innerText = msg;
    toast.className='toast show';
    setTimeout(()=> toast.className='toast', 3000);

    if(window.Toast){
      window.Toast.show(msg, type);
    }
  }
}

window.MobileCustomerInstance = new MobileCustomer();
window.MobileCustomer = window.MobileCustomerInstance;

document.addEventListener('DOMContentLoaded', ()=>{
  setTimeout(()=> window.MobileCustomerInstance.init(), 500);
});

// Global helpers - connected to common modules
window.filterByCategory = (cat)=> window.MobileCustomerInstance.filterByCategory(cat);
window.filterByBrand = (brand)=> window.MobileCustomerInstance.filterByBrand(brand);
window.showToast = (msg,type)=> window.MobileCustomerInstance.showToast(msg,type);
window.openCart = ()=> window.MobileCustomerInstance.openCart();
window.closeCart = ()=> window.MobileCustomerInstance.closeCart();