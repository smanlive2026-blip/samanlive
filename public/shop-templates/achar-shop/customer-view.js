// LOCATION: public/shop-templates/achar-shop/customer-view.js - FULL - COMMON CONNECTED
// RULE: Customer = Dekhega + Cart me dalega + Common Checkout pe jayega. Yahan Accept / Packed ka button kabhi nahi hoga.
// COMMON: cart-core + cart-count + api-core + shop-toggle/status + common/checkout + common/customer-orders/my-orders
// HTML: customer-view.html me isko <script src="customer-view.js"></script> se load karna hai

(function(){
  var API = window.API_BASE || location.origin;
  var params = new URLSearchParams(location.search);
  var shopId = params.get('shopId') || params.get('id') || localStorage.getItem('last_shopId') || localStorage.getItem('shopId') || '';
  window.SHOP_ID = shopId;
  window.shopId = shopId;
  if (shopId) { localStorage.setItem('last_shopId', shopId); localStorage.setItem('shopId', shopId); }

  var shopData = {};
  var allProducts = [];
  var filtered = [];
  var activeCat = 'All';
  var shopOpen = true;

  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function num(v){ var n = Number(v); return Number.isFinite(n) ? n : 0; }
  function toast(m){
    var t = $('toast'); if(!t) return alert(m);
    t.textContent = m; t.style.display = 'block';
    clearTimeout(t._h); t._h = setTimeout(function(){ t.style.display = 'none'; }, 2200);
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
    // 2. Shop ka naam / photo / address - Achar route se (Product ka Common abhi nahi bana)
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
    // 3. Product list
    await loadProducts();
  }

  async function loadProducts(){
    try{
      var res = await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/products');
      var data = await res.json();
      allProducts = data.products || data.items || data.data || [];
      if(!allProducts.length && shopData.products) allProducts = shopData.products;
    }catch(e){ allProducts = shopData.products || []; }
    filtered = allProducts;
    renderCats();
    renderProducts();
  }

  // ---------- CATEGORY + SEARCH ----------
  function renderCats(){
    var cats = ['All'].concat(Array.from(new Set(allProducts.map(function(p){ return p.category || p.acharType || 'Other'; }))));
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
      var okCat = activeCat === 'All' || (p.category || p.acharType || 'Other') === activeCat;
      var okQ = !q || (p.name || '').toLowerCase().includes(q);
      return okCat && okQ;
    });
    renderCats();
    renderProducts();
  }

  // ---------- CART - COMMON ----------
  function getCart(){
    try{
      if(window.CartCore && window.CartCore.getCart) return window.CartCore.getCart() || [];
    }catch(e){}
    try{ return JSON.parse(localStorage.getItem('cart_' + shopId) || localStorage.getItem('cart') || '[]'); }catch(e){ return []; }
  }
  function cartQtyFor(id){
    var c = getCart();
    var f = c.find(function(x){ return String(x._id || x.id || x.productId) === String(id); });
    return f ? num(f.qty || f.quantity || 0) : 0;
  }

  function renderProducts(){
    var box = $('productGrid'); if(!box) return;
    if(!filtered.length){ box.innerHTML = '<div class="empty">Abhi is dukaan me maal nahi hai</div>'; return; }
    box.innerHTML = filtered.map(function(p){
      var id = p._id || p.id;
      var img = p.image || 'https://placehold.co/300/d97706/fff?text=Achar';
      var price500 = num(p.price500 || p.price || 0);
      var price1kg = num(p.price1kg || 0);
      var qty = cartQtyFor(id);
      var btn = '';
      if(!shopOpen){
        btn = '<button class="add" disabled>🔴 Shop Closed</button>';
      } else if(qty > 0){
        btn = '<div class="qtybox"><button onclick="acharMinus(\'' + id + '\')">-</button><span>' + qty + '</span><button onclick="acharPlus(\'' + id + '\')">+</button></div>';
      } else {
        btn = '<button class="add" onclick="acharAdd(\'' + id + '\')">+ Add to Cart - ₹' + price500 + '</button>';
      }
      return '<div class="card"><img src="' + esc(img) + '" loading="lazy" onerror="this.src=\'https://placehold.co/300/d97706/fff?text=Achar\'"><div class="info"><b>' + esc(p.name) + '</b><small>' + esc(p.category || p.acharType || 'Achar') + ' • ' + esc(p.spiceLevel || '') + ' • ' + esc(p.jarType || '') + '</small><div class="price">₹' + price500 + ' <small>500g</small>' + (price1kg ? ' • ₹' + price1kg + ' <small>1Kg</small>' : '') + '</div>' + btn + '</div></div>';
    }).join('');
  }

  window.acharAdd = async function(id){
    if(!shopOpen){ toast('Dukaan band hai'); return; }
    var p = allProducts.find(function(x){ return String(x._id || x.id) === String(id); });
    if(!p) return;
    var forCart = {
      _id: p._id || p.id, id: p._id || p.id, productId: p._id || p.id,
      name: p.name, price: num(p.price500 || p.price), image: p.image || '',
      ownerId: shopId, ownerRole: 'shop_owner', supplierId: shopId, supplierRole: 'shop_owner',
      shopId: shopId, shopName: $('shopName') ? $('shopName').textContent : 'Achar Shop'
    };
    try{
      if(window.CartCore){
        var ok = await window.CartCore.add(forCart, 1);
        if(!ok){ toast('Cart add fail'); return; }
      } else {
        var c = getCart(); c.push({ ...forCart, qty: 1 }); localStorage.setItem('cart', JSON.stringify(c));
      }
    }catch(e){ toast('Cart fail'); return; }
    updateCartBar(); renderProducts();
    toast('Cart me add ho gaya');
  };
  window.acharPlus = async function(id){ await window.acharAdd(id); };
  window.acharMinus = async function(id){
    try{
      if(window.CartCore && window.CartCore.remove){
        await window.CartCore.remove(id, 1);
      } else {
        var c = getCart();
        var f = c.find(function(x){ return String(x._id || x.id || x.productId) === String(id); });
        if(f){ f.qty = num(f.qty) - 1; if(f.qty <= 0) c = c.filter(function(x){ return x !== f; }); }
        localStorage.setItem('cart', JSON.stringify(c));
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
    if(window.CartCount) window.CartCount.update();
  }

  // ---------- BUTTONS ----------
  function bindButtons(){
    var si = $('searchInput'); if(si) si.addEventListener('input', applyFilter);
    var cb = $('cartBar'); if(cb) cb.addEventListener('click', goCheckout);
    var ob = $('ordersBtn'); if(ob) ob.addEventListener('click', function(){
      // COMMON MY ORDERS
      location.href = '../common/customer-orders/my-orders.html?shopId=' + encodeURIComponent(shopId);
    });
    var call = $('callBtn'); if(call) call.addEventListener('click', function(){
      if(!window.SHOP_PHONE) return toast('Shop ka number abhi set nahi hai');
      location.href = 'tel:+91' + window.SHOP_PHONE;
    });
    var wa = $('waBtn'); if(wa) wa.addEventListener('click', function(){
      if(!window.SHOP_PHONE) return toast('Shop ka WhatsApp number abhi set nahi hai');
      window.open('https://wa.me/91' + window.SHOP_PHONE + '?text=' + encodeURIComponent('Namaste! Achar order karna hai.'), '_blank');
    });
    var sb = $('shareBtn'); if(sb) sb.addEventListener('click', shareFn);
    var stb = $('shareTopBtn'); if(stb) stb.addEventListener('click', shareFn);
  }
  function goCheckout(){
    var cart = getCart();
    if(!cart.length){ toast('Cart khali hai'); return; }
    if(!shopOpen){ toast('Dukaan band hai'); return; }
    // COMMON CHECKOUT - apna alag checkout nahi hai
    location.href = '../common/checkout/checkout.html?shopId=' + encodeURIComponent(shopId) + '&supplierId=' + encodeURIComponent(shopId) + '&supplierRole=shop_owner&shopType=achar-shop';
  }
  function shareFn(){
    var url = location.href;
    if(navigator.share) navigator.share({ title: shopData.shopName || 'Achar Shop', text: 'Ghar ka bana shuddh achar - order karo', url: url }).catch(function(){});
    else { navigator.clipboard.writeText(url).then(function(){ toast('Link copy ho gaya'); }); }
  }

  document.addEventListener('cart:updated', updateCartBar);
  if(window.CartCore && window.CartCore.ready) window.CartCore.ready.then(updateCartBar).catch(updateCartBar);
  setTimeout(updateCartBar, 1200);
  setInterval(updateCartBar, 5000);

  // ---------- START ----------
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ bindButtons(); loadShop(); });
  else { bindButtons(); loadShop(); }

  console.log('✅ Achar Customer-View JS loaded - Common Cart + Checkout connected - shopId:', shopId);
})();