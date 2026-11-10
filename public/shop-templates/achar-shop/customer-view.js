// LOCATION: public/shop-templates/achar-shop/customer-view.js - FULL - PRODUCT-FORM KE HISAB SE - V3
// RULE: Customer = Dekhega + Cart me dalega + Common Checkout pe jayega. Yahan Accept / Packed ka button kabhi nahi hoga.
// COMMON: WorldProductManager.getProducts = /api/world-products + cart-core + cart-count + api-core + shop-toggle/status + wishlist + reviews + share + common/checkout + common/customer-orders/my-orders + common/products/product-detail.html
// PRODUCT-FORM: Product = WORLD MODEL se hi aayega. Seed / Achar API se nahi. Seed sirf Product Form ke Quick Add ke liye hai.
// READ RULE: price500 = p.price500 || p.extraData?.price500 || p.price | image = p.thumbnail || p.image || p.extraData?.thumbnail
// HTML: customer-view.html me isko <script src="customer-view.js"></script> se load karna hai - INLINE ME DOBARA MAT LIKHNA

(function(){
  // Double load guard - agar ye file 2 baar load ho gayi toh Add 2 baar na chale
  if (window.__ACHAR_CV_LOADED__) return;
  window.__ACHAR_CV_LOADED__ = true;

  var API = window.API_BASE || location.origin;
  var params = new URLSearchParams(location.search);
  var shopId = params.get('shopId') || params.get('id') || localStorage.getItem('last_shopId') || localStorage.getItem('shopId') || '';
  window.SHOP_ID = shopId;
  window.shopId = shopId;
  window.SHOP_TYPE = 'achar-shop';
  var SHOP_TYPE = 'achar-shop';
  if (shopId) { localStorage.setItem('last_shopId', shopId); localStorage.setItem('shopId', shopId); }

  var shopData = {};
  var allProducts = [];
  var filtered = [];
  var activeCat = 'All';
  var shopOpen = true;
  var selectedSize = {}; // productId -> '500g' ya '1kg' - Card pe jo select karega wahi Cart me jayega

  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function num(v){ var n = Number(v); return Number.isFinite(n) ? n : 0; }
  function toast(m){
    var t = $('toast'); if(!t) return alert(m);
    t.textContent = m; t.style.display = 'block';
    clearTimeout(t._h); t._h = setTimeout(function(){ t.style.display = 'none'; }, 2200);
  }
  // PRODUCT-FORM WALA NORMALISE - extraData se bhi padho, warna price500 / spiceLevel khaali dikhega
  function normProduct(p, i){
    var ex = p.extraData || {};
    var price500 = num(p.price500 || ex.price500 || p.price || 0);
    var price1kg = num(p.price1kg || ex.price1kg || 0);
    return {
      _id: p._id || p.id || ('achar-' + (i + 1)), id: p._id || p.id || ('achar-' + (i + 1)),
      name: p.name || '',
      brand: p.brand || ex.brand || 'Maa Ke Haath Ka',
      category: p.category || ex.category || 'Other',
      price: price500, price500: price500, price1kg: price1kg,
      mrp: num(p.mrp || ex.mrp || 0),
      stock: num(p.stock ?? ex.stock ?? 0),
      jarType: p.jarType || ex.jarType || 'Glass',
      spiceLevel: p.spiceLevel || ex.spiceLevel || 'Medium',
      weight: p.weight || ex.weight || '500g',
      unit: p.unit || ex.unit || 'jar',
      // Product Form me image ka naam thumbnail hai
      image: p.thumbnail || p.image || ex.thumbnail || ex.image || '',
      thumbnail: p.thumbnail || p.image || ex.thumbnail || ex.image || '',
      description: p.description || ex.description || p.desc || ex.desc || '',
      extraData: ex,
      isActive: p.isActive !== false,
      shopId: p.shopId || shopId, shopType: p.shopType || SHOP_TYPE
    };
  }

  // ---------- SHOP + STATUS - COMMON ----------
  async function loadShop(){
    if(!shopId){
      var g = $('productGrid');
      if(g) g.innerHTML = '<div class="empty">Shop ID nahi mili. QR se dobara kholo.</div>';
      return;
    }
    // 1. Dukaan khuli hai ya band - Common shop-toggle se
    try{
      var r = await fetch(API + '/api/common/shop-toggle/' + encodeURIComponent(shopId) + '/status');
      var d = await r.json();
      if(d && d.success){
        shopOpen = !!d.isOpen;
        var box = $('shopStatusBox');
        var txt = $('shopStatusText');
        if(box) box.className = 'status ' + (shopOpen ? 'open' : 'closed');
        if(txt) txt.textContent = shopOpen ? 'Shop Open - Order kar sakte ho' : 'Shop Closed - Abhi order nahi hoga';
        if(d.shopName && $('shopName')) $('shopName').textContent = d.shopName;
      }
    }catch(e){}
    // 1b. Common Customer Shop Status wala helper hai toh usi se bhi sync karo
    try{ if (window.CustomerShopStatus && window.CustomerShopStatus.check) { var s2 = await window.CustomerShopStatus.check(shopId); if (typeof s2 === 'boolean') { shopOpen = s2; } } }catch(e){}
    // 2. Shop ka naam / photo / address - Achar route se (Shop ka data World Model me nahi hai, isliye yahi rahega)
    try{
      var res = await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId));
      var data = await res.json();
      if(data && data.success) shopData = data.shop || {};
      var name = shopData.ownerName ? shopData.ownerName + ' ki Dukaan' : (shopData.shopName || shopData.name || 'Maa Ke Haath Ka Achar');
      if($('shopName')) $('shopName').textContent = name;
      if($('footerShopName')) $('footerShopName').textContent = name;
      if($('pageTitle')) $('pageTitle').textContent = name;
      if($('topShopName')) $('topShopName').textContent = shopData.announcement || 'Ghar ka bana shuddh achar';
      if($('bannerTitle')) $('bannerTitle').textContent = shopData.announcement || 'Ghar Ka Bana Shuddh Achar';
      if(shopData.bannerPhotoUrl && $('shopBanner')) $('shopBanner').src = shopData.bannerPhotoUrl;
      if(shopData.ownerPhotoUrl && $('shopLogo')) $('shopLogo').src = shopData.ownerPhotoUrl;
      if($('shopAddress')) $('shopAddress').textContent = shopData.shopAddress || shopData.fullAddress || 'Fresh • Hygienic • Maa ke haath ka swad';
      if(shopData.phone) { window.SHOP_PHONE = shopData.phone; }
    }catch(e){}
    // 3. Product - WORLD MODEL se hi aayega - Seed / Achar API se nahi
    await loadProducts();
  }

  // DELETED V3: loadSeed() / normalizeSeed() DELETE kar diya
  // Seed ka kaam sirf Product Form ke Quick Add me hai. Customer ko Seed ka maal nahi dikhega.
  // Customer ko sirf wo maal dikhega jo Dukaandaar ne Product Form se Save kiya hai.

  async function loadProducts(){
    try{
      // WORLD MODEL - 1 hi tareeka: WorldProductManager.getProducts()
      // Ye /api/world-products?shopType=achar-shop&shopId=XXX&role=customer pe jata hai
      // Customer role me Product Manager khud stock>0 + isActive wale hi dega
      if (window.WorldProductManager && window.WorldProductManager.getProducts) {
        var list = await window.WorldProductManager.getProducts({ shopId: shopId, shopType: SHOP_TYPE });
        allProducts = (list || []).map(normProduct);
      } else if (window.ProductManager && window.ProductManager.getProducts) {
        var list2 = await window.ProductManager.getProducts({ shopId: shopId, shopType: SHOP_TYPE });
        allProducts = (list2 || []).map(normProduct);
      } else {
        // Product Manager load nahi hua toh direct World API - Achar API / Seed kabhi nahi
        var res = await fetch(API + '/api/world-products?shopType=' + SHOP_TYPE + '&shopId=' + encodeURIComponent(shopId) + '&role=customer');
        var data = await res.json();
        allProducts = (data.data || data.products || []).map(normProduct);
      }
    }catch(e){
      console.warn('[achar-cv] world products fail', e.message);
      allProducts = [];
    }
    filtered = allProducts;
    renderCats();
    renderProducts();
  }

  // ---------- CATEGORY + SEARCH ----------
  function renderCats(){
    var cats = ['All'].concat(Array.from(new Set(allProducts.map(function(p){ return p.category || 'Other'; }))));
    var el = $('catChips'); if(!el) return;
    el.innerHTML = cats.map(function(c){
      return '<button class="chip ' + (c === activeCat ? 'active' : '') + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');
    el.querySelectorAll('.chip').forEach(function(ch){
      ch.addEventListener('click', function(){ activeCat = ch.dataset.cat; applyFilter(); });
    });
  }
  function applyFilter(){
    var q = ($('searchInput') && $('searchInput').value || '').toLowerCase();
    filtered = allProducts.filter(function(p){
      var okCat = activeCat === 'All' || (p.category || 'Other') === activeCat;
      var okQ = !q || (p.name || '').toLowerCase().includes(q);
      return okCat && okQ;
    });
    renderCats();
    renderProducts();
  }

  // ---------- CART - COMMON ----------
  function cartKey(){ return 'cart_' + shopId; }
  function getCart(){
    try{
      if(window.CartCore && window.CartCore.getCart) {
        var c1 = window.CartCore.getCart() || [];
        if (c1.length && c1[0] && c1[0].shopId && String(c1[0].shopId) !== String(shopId)) { /* dusri dukaan ka hai - local wala lo */ }
        else return c1;
      }
    }catch(e){}
    try{ return JSON.parse(localStorage.getItem(cartKey()) || '[]'); }catch(e){ return []; }
  }
  function saveLocalCart(c){ try{ localStorage.setItem(cartKey(), JSON.stringify(c)); }catch(e){} }
  function cartQtyFor(id, size){
    var c = getCart();
    // Size alag hai toh Qty alag hai - 500g wala + 1Kg wala ek me mix nahi hoga
    var f = c.find(function(x){ return String(x._id || x.id || x.productId) === String(id) && (size ? String(x.size || '500g') === String(size) : true); });
    return f ? num(f.qty || f.quantity || 0) : 0;
  }
  function priceFor(p, size){ return size === '1kg' ? num(p.price1kg || p.price500 || p.price) : num(p.price500 || p.price); }

  function renderProducts(){
    var box = $('productGrid'); if(!box) return;
    if(!filtered.length){ box.innerHTML = '<div class="empty">Abhi is dukaan me maal nahi hai<br><small style="font-size:11px">Dukaandaar ne abhi Product Form se maal add nahi kiya hai</small></div>'; return; }
    box.innerHTML = filtered.map(function(p){
      var id = p._id || p.id;
      var img = p.image || p.thumbnail || 'https://placehold.co/300/d97706/fff?text=Achar';
      var price500 = num(p.price500 || p.price || 0);
      var price1kg = num(p.price1kg || 0);
      var size = selectedSize[id] || '500g';
      var qty = cartQtyFor(id, size);
      var wishActive = false;
      try{ if (window.Wishlist && window.Wishlist.has) wishActive = window.Wishlist.has(id); }catch(e){}
      var btn = '';
      if(!shopOpen){
        btn = '<button class="add" disabled>🔴 Shop Closed</button>';
      } else if(qty > 0){
        btn = '<div class="qtybox"><button onclick="acharMinus(\'' + id + '\',\'' + size + '\')">-</button><span>' + qty + '</span><button onclick="acharPlus(\'' + id + '\',\'' + size + '\')">+</button></div>';
      } else {
        btn = '<button class="add" onclick="acharAdd(\'' + id + '\',\'' + size + '\')">+ Add to Cart - ₹' + priceFor(p, size) + '</button>';
      }
      var sizeBtn = price1kg ? '<div style="display:flex;gap:6px;margin-top:6px"><button onclick="acharSize(\'' + id + '\',\'500g\')" style="flex:1;padding:6px;border-radius:8px;font-size:11px;font-weight:800;background:' + (size === '500g' ? '#0f172a;color:#fff' : '#f1f5f9;color:#0f172a') + '">500g ₹' + price500 + '</button><button onclick="acharSize(\'' + id + '\',\'1kg\')" style="flex:1;padding:6px;border-radius:8px;font-size:11px;font-weight:800;background:' + (size === '1kg' ? '#0f172a;color:#fff' : '#f1f5f9;color:#0f172a') + '">1Kg ₹' + price1kg + '</button></div>' : '';
      return '<div class="card"><img src="' + esc(img) + '" loading="lazy" onclick="acharDetail(\'' + id + '\')" style="cursor:pointer" onerror="this.src=\'https://placehold.co/300/d97706/fff?text=Achar\'"><div class="info"><div style="display:flex;justify-content:space-between;align-items:start"><b>' + esc(p.name) + '</b><button onclick="acharWish(\'' + id + '\')" style="background:none;font-size:16px;line-height:1">' + (wishActive ? '❤️' : '🤍') + '</button></div><small>' + esc(p.category || 'Achar') + ' • ' + esc(p.spiceLevel || '') + ' • ' + esc(p.jarType || '') + '</small><div class="price">₹' + price500 + ' <small>500g</small>' + (price1kg ? ' • ₹' + price1kg + ' <small>1Kg</small>' : '') + '</div>' + sizeBtn + btn + '</div></div>';
    }).join('');
  }

  // Size badlo - 500g / 1Kg
  window.acharSize = function(id, size){
    selectedSize[id] = size;
    renderProducts();
  };
  // Product Detail - Common Product Detail page pe jayega - type bhi dena hai, warna wo general samjhega
  window.acharDetail = function(id){
    location.href = '../common/products/product-detail.html?shopId=' + encodeURIComponent(shopId) + '&productId=' + encodeURIComponent(id) + '&shopType=' + SHOP_TYPE + '&type=' + SHOP_TYPE;
  };
  // Wishlist - Common
  window.acharWish = async function(id){
    try{
      if (window.Wishlist && window.Wishlist.toggle) { await window.Wishlist.toggle(id, shopId); toast('Wishlist update ho gayi'); renderProducts(); return; }
    }catch(e){}
    toast('Wishlist abhi is shop me nahi hai');
  };

  window.acharAdd = async function(id, size){
    if(!shopOpen){ toast('Dukaan band hai'); return; }
    var p = allProducts.find(function(x){ return String(x._id || x.id) === String(id); });
    if(!p) return;
    var sz = size || selectedSize[id] || '500g';
    var price = priceFor(p, sz);
    var forCart = {
      _id: p._id || p.id, id: p._id || p.id, productId: p._id || p.id,
      name: p.name + (sz === '1kg' ? ' (1Kg)' : ' (500g)'),
      productName: p.name, price: price,
      // Product Form me image ka naam thumbnail hai - dono bhej do taaki Checkout / Detail me photo na toote
      image: p.image || p.thumbnail || '', thumbnail: p.thumbnail || p.image || '',
      size: sz, weight: sz === '1kg' ? '1Kg' : '500g',
      ownerId: shopId, ownerRole: 'shop_owner', supplierId: shopId, supplierRole: 'shop_owner',
      shopId: shopId, shopName: $('shopName') ? $('shopName').textContent : 'Achar Shop',
      shopType: SHOP_TYPE, category: p.category || 'Other',
      extraData: p.extraData || {}
    };
    try{
      if(window.CartCore && window.CartCore.add){
        var ok = await window.CartCore.add(forCart, 1);
        if(!ok){ toast('Cart add fail'); return; }
      } else {
        // CartCore nahi hai toh sirf is dukaan ke Cart me dalo - dusri dukaan se mix mat karo
        var c = getCart();
        var f = c.find(function(x){ return String(x._id || x.id || x.productId) === String(id) && String(x.size || '500g') === String(sz); });
        if (f) f.qty = num(f.qty || f.quantity || 0) + 1;
        else c.push({ ...forCart, qty: 1 });
        saveLocalCart(c);
      }
    }catch(e){ toast('Cart fail'); return; }
    updateCartBar(); renderProducts();
    toast('Cart me add ho gaya');
  };
  window.acharPlus = async function(id, size){ await window.acharAdd(id, size); };
  window.acharMinus = async function(id, size){
    var sz = size || selectedSize[id] || '500g';
    try{
      if(window.CartCore && window.CartCore.remove){
        await window.CartCore.remove(id, 1, sz);
      } else {
        var c = getCart();
        var f = c.find(function(x){ return String(x._id || x.id || x.productId) === String(id) && String(x.size || '500g') === String(sz); });
        if(f){ f.qty = num(f.qty) - 1; if(f.qty <= 0) c = c.filter(function(x){ return x !== f; }); }
        saveLocalCart(c);
      }
    }catch(e){}
    updateCartBar(); renderProducts();
  };

  function updateCartBar(){
    var cart = getCart();
    var count = cart.reduce(function(s,c){ return s + num(c.qty || c.quantity || 1); }, 0);
    var total = cart.reduce(function(s,c){ return s + (num(c.price) * num(c.qty || c.quantity || 1)); }, 0);
    var bar = $('cartBar');
    if(!count){ if(bar) bar.style.display = 'none'; return; }
    if(bar) bar.style.display = 'flex';
    if($('cartBarText')) $('cartBarText').textContent = count + ' item • ' + (shopData.shopName || 'Achar Shop');
    if($('cartBarTotal')) $('cartBarTotal').textContent = '₹' + total + ' • Common Checkout';
    try{ if(window.CartCount && window.CartCount.update) window.CartCount.update(); }catch(e){}
  }

  // ---------- BUTTONS ----------
  function bindButtons(){
    var si = $('searchInput'); if(si) si.addEventListener('input', applyFilter);
    var cb = $('cartBar'); if(cb) cb.addEventListener('click', goCheckout);
    var ob = $('ordersBtn'); if(ob) ob.addEventListener('click', function(){
      location.href = '../common/customer-orders/my-orders.html?shopId=' + encodeURIComponent(shopId);
    });
    var call = $('callBtn'); if(call) call.addEventListener('click', function(){
      if(!window.SHOP_PHONE) return toast('Shop ka number abhi set nahi hai');
      location.href = 'tel:+91' + window.SHOP_PHONE;
    });
    var wa = $('waBtn'); if(wa) wa.addEventListener('click', function(){
      if(!window.SHOP_PHONE) return toast('Shop ka WhatsApp number abhi set nahi hai');
      try{ if (window.WhatsAppShare && window.WhatsAppShare.share) return window.WhatsAppShare.share('https://wa.me/91' + window.SHOP_PHONE, 'Namaste! Achar order karna hai.'); }catch(e){}
      window.open('https://wa.me/91' + window.SHOP_PHONE + '?text=' + encodeURIComponent('Namaste! Achar order karna hai.'), '_blank');
    });
    var sb = $('shareBtn'); if(sb) sb.addEventListener('click', shareFn);
    var stb = $('shareTopBtn'); if(stb) stb.addEventListener('click', shareFn);
  }
  function goCheckout(){
    var cart = getCart();
    if(!cart.length){ toast('Cart khali hai'); return; }
    if(!shopOpen){ toast('Dukaan band hai'); return; }
    location.href = '../common/checkout/checkout.html?shopId=' + encodeURIComponent(shopId) + '&supplierId=' + encodeURIComponent(shopId) + '&supplierRole=shop_owner&shopType=' + SHOP_TYPE;
  }
  function shareFn(){
    var url = location.href;
    try{
      if (window.ShareCore && window.ShareCore.share) return window.ShareCore.share({ title: shopData.shopName || 'Achar Shop', text: 'Ghar ka bana shuddh achar - order karo', url: url });
      if (window.WhatsAppShare && window.WhatsAppShare.share) return window.WhatsAppShare.share(url, 'Ghar ka bana shuddh achar - order karo');
    }catch(e){}
    if(navigator.share) navigator.share({ title: shopData.shopName || 'Achar Shop', text: 'Ghar ka bana shuddh achar - order karo', url: url }).catch(function(){});
    else { navigator.clipboard.writeText(url).then(function(){ toast('Link copy ho gaya'); }); }
  }

  document.addEventListener('cart:updated', updateCartBar);
  document.addEventListener('wishlist:updated', renderProducts);
  try{ if(window.CartCore && window.CartCore.ready) window.CartCore.ready.then(updateCartBar).catch(updateCartBar); }catch(e){}
  setTimeout(updateCartBar, 1200);
  setInterval(updateCartBar, 5000);

  // ---------- START ----------
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ bindButtons(); loadShop(); });
  else { bindButtons(); loadShop(); }

  console.log('✅ Achar Customer-View JS loaded - PRODUCT-FORM (World Model) + Common Cart - shopId:', shopId);
})();