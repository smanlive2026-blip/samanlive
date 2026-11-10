// LOCATION: public/shop-templates/achar-shop/customer-view.js - FULL - PRODUCT-FORM + COMMON PROFILE - V4
// RULE: Customer = Dekhega + Cart me dalega + Common Checkout pe jayega. Yahan Accept / Packed ka button kabhi nahi hoga.
// COMMON: WorldProductManager.getProducts = /api/world-products + cart-core + cart-count + api-core + shop-toggle/status + UNIFIED PROFILE + wishlist + reviews + share + common/checkout + common/customer-orders/my-orders + common/products/product-detail.html
// PRODUCT-FORM: Product = WORLD MODEL se hi aayega. Seed / Achar API se nahi. Seed sirf Product Form ke Quick Add ke liye hai.
// PROFILE: Shop ka Logo / Banner / Owner Photo / Naam / Address / Phone / Timing / Gallery = COMMON PROFILE se aayega - /api/common/profile/me?role=shop_owner&shopId=XXX
// READ RULE: price500 = p.price500 || p.extraData?.price500 || p.price | image = p.thumbnail || p.image || p.extraData?.thumbnail
//            logo = shop.logo || shop.shopLogo | banner = shop.banner || shop.coverPhoto | ownerPhoto = shop.ownerPhotoUrl
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
  function to12(t){
    if (!t) return '';
    if (t.includes('AM') || t.includes('PM')) return t;
    var hm = String(t).split(':'); var h = num(hm[0]); var m = hm[1] || '00';
    var mod = h >= 12 ? 'PM' : 'AM'; var hh = h % 12; if (hh === 0) hh = 12;
    return hh + ':' + m + ' ' + mod;
  }
  // PROFILE ke liye - Common Profile me field ke 3-4 naam hain, isliye 1 jagah se nikaalo
  function shopLogoUrl(s){ return (s && (s.logo || s.shopLogo || s.uploadedLogo || s.image)) || ''; }
  function shopBannerUrl(s){ return (s && (s.banner || s.coverPhoto || s.cover || s.bannerPhotoUrl)) || ''; }
  function shopOwnerPhotoUrl(s){ return (s && (s.ownerPhotoUrl || s.ownerPhoto || s.ownerAvatar)) || ''; }
  function shopAddressStr(s){
    if (!s) return '';
    if (typeof s.address === 'string') return s.address;
    if (s.address && s.address.line1) return s.address.line1 + (s.address.city ? ', ' + s.address.city : '') + (s.address.pincode ? ' - ' + s.address.pincode : '');
    return s.shopAddress || s.fullAddress || '';
  }
  function shopPhoneStr(s){ return (s && (s.phone || s.ownerPhone || s.whatsapp)) || ''; }
  function shopTimingStr(s){
    if (!s) return '🕒 09:00 AM - 09:00 PM';
    var t = s.timing || {};
    var open = t.open || t.openingTime || s.openTime || '09:00';
    var close = t.close || t.closingTime || s.closeTime || '21:00';
    return '🕒 ' + to12(open) + ' - ' + to12(close);
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
    // 2. SHOP PROFILE - COMMON PROFILE se hi aayega - Achar API se nahi
    await loadShopProfileForCustomer();
    // 3. Product - WORLD MODEL se hi aayega - Seed / Achar API se nahi
    await loadProducts();
  }

  // ============ SHOP PROFILE FOR CUSTOMER - COMMON UNIFIED PROFILE ============
  // RULE: Customer kabhi Achar API se Shop ka photo nahi lega - sirf Common Profile se lega
  //       Kyunki Dukaandaar ne Photo Common Profile pe save ki hai, Achar API pe nahi
  async function loadShopProfileForCustomer(){
    var shop = null;
    // 1. Common Profile - asli Shop - UnifiedProfile se bhi try karo, direct API se bhi
    try{
      if (window.UnifiedProfile && window.UnifiedProfile.loadMyProfile) {
        // UnifiedProfile apne getIds() se shopId uthata hai - localStorage me pehle se set hai
        var prof = await window.UnifiedProfile.loadMyProfile();
        if (prof && prof.success && (prof.shop || prof.user)) shop = prof.shop || prof.user;
      }
    }catch(e){}
    // 2. Direct Common API - UnifiedProfile na chale toh
    if (!shop) {
      try{
        var token = localStorage.getItem('TOKEN') || localStorage.getItem('userToken') || '';
        var buyerId = localStorage.getItem('USER_ID') || '';
        var res = await fetch(API + '/api/common/profile/me?buyerId=' + encodeURIComponent(buyerId) + '&role=shop_owner&shopId=' + encodeURIComponent(shopId), {
          headers: { 'Authorization': 'Bearer ' + token, 'x-buyer-id': buyerId }
        });
        var data = await res.json().catch(function(){ return {}; });
        if (data && data.success && (data.shop || data.user)) shop = data.shop || data.user;
      }catch(e){}
    }
    // 3. Local cache - API fail ho toh bhi khaali na dikhe - Dashboard ne save kiya hoga
    if (!shop) {
      try{
        var local = JSON.parse(localStorage.getItem('shop_' + shopId) || '{}');
        if (local && (local.shopName || local.name)) shop = local;
      }catch(e){}
    }
    // 4. Last fallback - Purana Achar route - sirf naam ke liye, Photo ke liye nahi
    if (!shop) {
      try{
        var r2 = await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId));
        var d2 = await r2.json();
        if (d2 && d2.success) shop = d2.shop || {};
      }catch(e){}
    }
    if (!shop) return;
    shopData = shop;
    renderShopProfileForCustomer(shop);
    // Customer ke liye bhi cache kar do - dobara khole toh turant dikhe
    try{ localStorage.setItem('shop_' + shopId, JSON.stringify(shop)); }catch(e){}
  }

  function renderShopProfileForCustomer(shop){
    if (!shop) return;
    var name = shop.shopName || shop.name || 'Maa Ke Haath Ka Achar';
    var ownerName = shop.ownerName || '';
    var logo = shopLogoUrl(shop);
    var banner = shopBannerUrl(shop);
    var ownerPhoto = shopOwnerPhotoUrl(shop) || logo;
    var address = shopAddressStr(shop);
    var phone = shopPhoneStr(shop);
    var rating = shop.rating || shop.avgRating || 4.5;
    var isVerified = !!shop.isVerified;

    // Topbar - LOGO alag hai, Owner Photo nahi
    if ($('shopName')) $('shopName').textContent = ownerName ? ownerName + ' ki Dukaan' : name;
    if ($('footerShopName')) $('footerShopName').textContent = name;
    if ($('pageTitle')) $('pageTitle').textContent = name;
    if ($('topShopName')) $('topShopName').textContent = shop.announcement || shop.tagline || shop.description || 'Ghar ka bana shuddh achar';
    if ($('bannerTitle')) $('bannerTitle').textContent = shop.announcement || shop.tagline || 'Ghar Ka Bana Shuddh Achar';
    // LOGO alag, BANNER alag - dono Common Profile se aayenge
    if (logo && $('shopLogo')) $('shopLogo').src = logo;
    if (banner && $('shopBanner')) $('shopBanner').src = banner;
    if ($('shopAddress')) $('shopAddress').textContent = address || 'Fresh • Hygienic • Maa ke haath ka swad';

    // SHOP INFO CARD - Banner ke neeche - Customer ko yahin se sab pata chalega
    if ($('shopOwnerPhoto') && ownerPhoto) $('shopOwnerPhoto').src = ownerPhoto;
    if ($('shopOwnerName')) $('shopOwnerName').textContent = ownerName ? ownerName + ' ki Dukaan' : name;
    if ($('shopPhoneText')) $('shopPhoneText').textContent = phone ? '📞 ' + phone : '📞 -';
    if ($('shopFullAddress')) $('shopFullAddress').textContent = address ? '📍 ' + address : '📍 -';
    if ($('shopTimingText')) $('shopTimingText').textContent = shopTimingStr(shop);
    if ($('shopRating')) $('shopRating').textContent = '⭐ ' + rating;
    if ($('shopVerified')) $('shopVerified').style.display = isVerified ? 'inline-block' : 'none';
    if ($('footerShopAddress')) $('footerShopAddress').textContent = address || 'Ghar ka bana hua shuddh achar. Order Common Checkout se jayega, dukaan wale ko turant dikhega.';

    // GALLERY - Dukaandaar ne Gallery me jo photo daali, wahi dikhegi
    var gallery = shop.gallery || shop.shopImages || [];
    var strip = $('shopGalleryStrip');
    if (strip) {
      if (gallery && gallery.length) {
        strip.style.display = 'flex';
        strip.innerHTML = gallery.map(function(u){
          return '<img src="' + esc(u) + '" alt="Shop Photo" loading="lazy" onerror="this.style.display=\'none\'">';
        }).join('');
      } else {
        strip.style.display = 'none';
        strip.innerHTML = '';
      }
    }

    // Call / WhatsApp ke liye Phone - Common Profile se aayega
    if (phone) window.SHOP_PHONE = phone;
    window.SHOP_PROFILE = shop;
  }

  // DELETED V3: loadSeed() / normalizeSeed() DELETE kar diya
  // Seed ka kaam sirf Product Form ke Quick Add me hai. Customer ko Seed ka maal nahi dikhega.

  async function loadProducts(){
    try{
      if (window.WorldProductManager && window.WorldProductManager.getProducts) {
        var list = await window.WorldProductManager.getProducts({ shopId: shopId, shopType: SHOP_TYPE });
        allProducts = (list || []).map(normProduct);
      } else if (window.ProductManager && window.ProductManager.getProducts) {
        var list2 = await window.ProductManager.getProducts({ shopId: shopId, shopType: SHOP_TYPE });
        allProducts = (list2 || []).map(normProduct);
      } else {
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

  window.acharSize = function(id, size){
    selectedSize[id] = size;
    renderProducts();
  };
  window.acharDetail = function(id){
    location.href = '../common/products/product-detail.html?shopId=' + encodeURIComponent(shopId) + '&productId=' + encodeURIComponent(id) + '&shopType=' + SHOP_TYPE + '&type=' + SHOP_TYPE;
  };
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

  console.log('✅ Achar Customer-View JS loaded - PRODUCT-FORM (World Model) + COMMON PROFILE (UnifiedProfile) + Common Cart - shopId:', shopId);
})();