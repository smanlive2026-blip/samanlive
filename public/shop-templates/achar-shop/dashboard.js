// LOCATION: public/shop-templates/achar-shop/dashboard.js - FULL - COMMON CONNECTED - V2
// RULE: Order = Common Order. Product = Achar route + Common Seed fallback. Profile / Timing = Achar + Common Toggle.
// COMMON: /api/common/orders/list + /api/common/orders/:id/status + /api/common/checkout/:shopId/place + /api/common/shop-toggle + ../common/products/achar-shop.seed.js + ../common/products/product-manager.js + ../common/inventory/inventory.js
// DESIGN: HTML wahi hai, is JS me koi naya button nahi banaya hai.

(function () {
  var params = new URLSearchParams(location.search);
  var shopId = params.get('shopId') || params.get('id') || localStorage.getItem('last_shopId') || localStorage.getItem('shopId') || '';
  window.SHOP_ID = shopId;
  window.shopId = shopId;
  var ROLE = 'shop_owner';
  var API = window.API_BASE || location.origin;

  var shopData = {};
  var allProducts = [];
  var allOrders = [];
  var seedProducts = []; // COMMON SEED - 100 product yahan rahenge
  var currentEditId = null;
  var productImageUrl = '';
  var productFilter = 'All';
  var orderFilter = 'all';
  var manualQty = {};
  var quickAddSelected = new Set();

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function num(v) { var n = Number(v); return Number.isFinite(n) ? n : 0; }
  function toast(m) {
    var t = $('toast');
    if (!t) return alert(m);
    t.textContent = m; t.style.display = 'block';
    clearTimeout(t._h); t._h = setTimeout(function () { t.style.display = 'none'; }, 2800);
  }
  function getHeaders() {
    var token = (window.AuthCore && window.AuthCore.getToken && window.AuthCore.getToken()) || localStorage.getItem('TOKEN') || localStorage.getItem('token') || '';
    return { 'Content-Type': 'application/json', 'x-shop-id': shopId, 'x-role': ROLE, ...(token ? { 'Authorization': 'Bearer ' + token } : {}) };
  }
  function shopUrl() { return location.origin + '/shop-templates/achar-shop/customer-view.html?shopId=' + encodeURIComponent(shopId); }
  function to24(t) {
    if (!t) return '09:00';
    if (t.includes('AM') || t.includes('PM')) {
      var parts = t.split(' '); var tm = parts[0]; var mod = parts[1];
      var hm = tm.split(':'); var h = hm[0]; var m = hm[1] || '00';
      if (h === '12') h = '00'; if (mod === 'PM') h = String(num(h) + 12);
      return String(h).padStart(2, '0') + ':' + m;
    }
    return t;
  }
  function to12(t) {
    if (!t) return '09:00 AM';
    if (t.includes('AM') || t.includes('PM')) return t;
    var hm = t.split(':'); var h = num(hm[0]); var m = hm[1] || '00';
    var mod = h >= 12 ? 'PM' : 'AM'; var hh = h % 12; if (hh === 0) hh = 12;
    return hh + ':' + m + ' ' + mod;
  }

  // ================= NAV / PAGE =================
  function showPage(page) {
    document.querySelectorAll('.page').forEach(function (el) { el.classList.toggle('active', el.dataset.page === page); });
    document.querySelectorAll('.nav button[data-page]').forEach(function (b) { b.classList.toggle('active', b.dataset.page === page); });
    var titles = { home: 'Overview', products: 'Products', orders: 'Orders', wallet: 'Earnings & Wallet', settings: 'Settings', profile: 'Profile', location: 'Location' };
    var subs = { home: 'Aaj ka hisaab, ek nazar me', products: 'Achar - Search, stock, edit', orders: 'Common Checkout se aaye orders', wallet: 'Common Order se bana hisaab', settings: 'Timing aur contact', profile: 'Shop profile', location: 'Location aur delivery range' };
    if ($('pageTitle')) $('pageTitle').textContent = titles[page] || 'Overview';
    if ($('pageSub')) $('pageSub').textContent = subs[page] || '';
    if (window.innerWidth <= 900) { var sb = $('sidebar'); if (sb) sb.classList.remove('open'); var ov = $('overlay'); if (ov) ov.classList.remove('show'); }
  }
  window.showPage = showPage;

  function bindNav() {
    document.querySelectorAll('.nav button[data-page]').forEach(function (b) {
      b.addEventListener('click', function () { showPage(b.dataset.page); });
    });
    document.querySelectorAll('[data-goto]').forEach(function (el) {
      el.addEventListener('click', function () { showPage(el.dataset.goto); });
    });
    var menuBtn = $('menuBtn'); if (menuBtn) menuBtn.addEventListener('click', function () { $('sidebar').classList.add('open'); $('overlay').classList.add('show'); });
    var ov = $('overlay'); if (ov) ov.addEventListener('click', function () { $('sidebar').classList.remove('open'); ov.classList.remove('show'); });
    var notifBtn = $('notifBtn'); if (notifBtn) notifBtn.addEventListener('click', function () { showPage('orders'); });
    var add1 = $('addAcharBtn'); if (add1) add1.addEventListener('click', openAddModal);
    var add2 = $('addAcharBtn2'); if (add2) add2.addEventListener('click', openAddModal);
    var qa = $('quickAddBtn'); if (qa) qa.addEventListener('click', openQuickAdd);
    var mo = $('newOrderBtn'); if (mo) mo.addEventListener('click', openManualOrder);
    var wa = $('whatsappShareBtn'); if (wa) wa.addEventListener('click', shareWhatsApp);
    var sa = $('saveAnnouncement'); if (sa) sa.addEventListener('click', saveAnnouncement);
    var st = $('saveTiming'); if (st) st.addEventListener('click', saveTiming);
    var sp = $('savePhone'); if (sp) sp.addEventListener('click', savePhone);
    var spf = $('saveProfileBtn'); if (spf) spf.addEventListener('click', saveProfile);
    var sl = $('saveLocationBtn'); if (sl) sl.addEventListener('click', saveLocation);
    var ll = $('loadLocationBtn'); if (ll) ll.addEventListener('click', loadLocation);
    var qas = $('quickAddSaveBtn'); if (qas) qas.addEventListener('click', saveQuickAdd);
    var mos = $('moSaveBtn'); if (mos) mos.addEventListener('click', saveManualOrder);
    var spInput = $('searchProduct'); if (spInput) spInput.addEventListener('input', function () { renderProducts(); });
    document.querySelectorAll('#orderChips .chip').forEach(function (c) {
      c.addEventListener('click', function () {
        document.querySelectorAll('#orderChips .chip').forEach(function (x) { x.classList.remove('active'); });
        c.classList.add('active');
        orderFilter = c.dataset.orderFilter || 'all';
        renderOrders();
      });
    });
    var pi = $('productImageInput'); if (pi) pi.addEventListener('change', function (e) { handleProductImage(e.target.files[0]); });
    var oi = $('ownerInput'); if (oi) oi.addEventListener('change', function (e) { handleOwnerImage(e.target.files[0]); });
    var oib = $('ownerImgBig'); if (oib) oib.addEventListener('click', function () { $('ownerInput').click(); });
  }

  function shareWhatsApp() {
    var msg = 'Namaste! ' + (shopData.shopName || 'Achar Shop') + ' se ghar ka bana shuddh achar order karo: ' + shopUrl();
    try {
      if (window.WhatsAppShare && window.WhatsAppShare.share) return window.WhatsAppShare.share(shopUrl(), msg);
      if (window.ShareCore && window.ShareCore.whatsapp) return window.ShareCore.whatsapp(shopUrl(), msg);
    } catch (e) {}
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
  }

  // ================= INIT =================
  async function init() {
    if (!shopId) {
      toast('Shop ID nahi mili. Shop list se dobara kholo.');
      return;
    }
    if ($('shopIdDisplay')) $('shopIdDisplay').textContent = 'Shop ID: ' + shopId;
    bindNav();
    bindShopToggleUI();
    await loadShopData();
    await loadSeed(); // COMMON SEED pehle load karo, taaki Quick Add + fallback ready rahe
    await loadCommonOrders();
    await loadProducts();
    renderAll();
    initSocket();
    setInterval(function () { loadCommonOrders().then(renderAll).catch(function () {}); }, 30000);
  }

  function bindShopToggleUI() {
    var btn = $('shopToggle');
    if (!btn) return;
    fetch(API + '/api/common/shop-toggle/' + encodeURIComponent(shopId) + '/status', { headers: getHeaders() })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.success) updateToggleUI(d.isOpen);
      }).catch(function () {});
  }
  function updateToggleUI(isOpen) {
    var btn = $('shopToggle'); if (!btn) return;
    var txt = $('toggleText'); if (txt) txt.textContent = isOpen ? 'Open' : 'Closed';
    btn.classList.toggle('open', !!isOpen);
    btn.classList.toggle('closed', !isOpen);
  }

  function initSocket() {
    try {
      if (window.SocketCore && window.SocketCore.on) {
        window.SocketCore.on('new-order', function (d) {
          if (d && d.shopId && String(d.shopId) !== String(shopId)) return;
          toast('🧾 Naya order aaya!');
          loadCommonOrders().then(renderAll);
        });
        window.SocketCore.on('shop-status-changed', function (d) {
          if (d && String(d.shopId) === String(shopId)) updateToggleUI(d.isOpen);
        });
      }
      if (window.shopSocket) {
        window.shopSocket.on('new-order', function () { loadCommonOrders().then(renderAll); });
      }
    } catch (e) {}
  }

  // ================= SHOP DATA =================
  async function loadShopData() {
    try {
      var res = await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId), { headers: getHeaders() });
      var data = await res.json().catch(function () { return {}; });
      if (!data.success) throw new Error(data.message || 'Shop load fail');
      shopData = data.shop || {};
      var name = shopData.ownerName ? shopData.ownerName + ' ki Dukaan' : (shopData.shopName || shopData.name || 'Maa Ke Haath Ka Achar');
      if ($('shopName')) $('shopName').textContent = name;
      if ($('pageTitle')) $('pageTitle').textContent = 'Overview';
      if ($('ownerImg') && shopData.ownerPhotoUrl) $('ownerImg').src = shopData.ownerPhotoUrl;
      if ($('ownerImgBig') && shopData.ownerPhotoUrl) $('ownerImgBig').src = shopData.ownerPhotoUrl;
      if ($('announcementInput')) $('announcementInput').value = shopData.announcement || '';
      if ($('openTime')) $('openTime').value = to24(shopData.openTime || shopData.timing && shopData.timing.open || '09:00');
      if ($('closeTime')) $('closeTime').value = to24(shopData.closeTime || shopData.timing && shopData.timing.close || '21:00');
      if ($('shopPhoneInput')) $('shopPhoneInput').value = shopData.phone || '';
      if ($('ownerNameInput')) $('ownerNameInput').value = shopData.ownerName || '';
      if ($('profileAddressInput')) $('profileAddressInput').value = shopData.shopAddress || shopData.fullAddress || '';
      if ($('shopAddress')) $('shopAddress').value = shopData.shopAddress || shopData.fullAddress || '';
      if ($('deliveryRange')) $('deliveryRange').value = shopData.deliveryRange || 5;
      if ($('locationType')) $('locationType').value = shopData.locationType || 'fixed';
    } catch (e) {
      console.warn('[achar] shop load fail', e.message);
    }
  }

  // ================= COMMON SEED - 100 PRODUCT =================
  async function loadSeed() {
    // 1. Pehle Common index.js wala loader try karo - wahi asli loader hai
    try {
      if (window.SeedLoader && window.SeedLoader.loadSeed) {
        var s1 = await window.SeedLoader.loadSeed('achar-shop');
        if (s1 && s1.products && s1.products.length) { seedProducts = normalizeSeed(s1.products); return seedProducts; }
      }
    } catch (e) {}
    // 2. Direct import - dashboard.html se relative path
    try {
      var m = await import('../common/products/achar-shop.seed.js');
      var list = m.PRODUCTS || (m.default && m.default.PRODUCTS) || [];
      if (list.length) { seedProducts = normalizeSeed(list); return seedProducts; }
    } catch (e) { console.warn('[achar] seed import fail - seed file ka naam check karo: achar-shop.seed.js', e.message); }
    seedProducts = [];
    return seedProducts;
  }
  function normalizeSeed(list) {
    return (list || []).map(function (p, i) {
      return {
        _id: p._id || p.id || ('seed-achar-' + (i + 1)),
        id: p._id || p.id || ('seed-achar-' + (i + 1)),
        name: p.name, brand: p.brand || 'Maa Ke Haath Ka',
        category: p.category || p.acharType || 'Other', acharType: p.category || p.acharType || 'Other',
        price: num(p.price500 || p.price), price500: num(p.price500 || p.price), price1kg: num(p.price1kg || p.price),
        mrp: num(p.mrp || 0), stock: num(p.stock ?? 20),
        jarType: p.jarType || 'Glass', spiceLevel: p.spiceLevel || 'Medium',
        image: p.image || p.thumbnail || '', thumbnail: p.thumbnail || p.image || '',
        description: p.description || p.desc || '', desc: p.description || p.desc || '',
        shopId: shopId, isSeed: true
      };
    });
  }
  window.getAcharSeed = function () { return seedProducts; };

  // ================= COMMON ORDERS =================
  function normalizeOrder(o) {
    var status = o.orderStatus || o.status || 'placed';
    return {
      _id: o._id || o.id || '',
      orderId: o.orderId || o.orderCode || o._id || '',
      orderCode: o.orderCode || o.orderId || '',
      customerName: o.customerName || o.buyerName || o.customer && o.customer.name || 'Customer',
      customerPhone: o.customerPhone || o.buyerPhone || o.customer && o.customer.phone || '',
      customerAddress: o.customerAddress || o.address || o.deliveryAddress || '',
      items: o.items || o.products || [],
      total: num(o.total || o.grandTotal || o.amount || 0),
      payment: o.payment || o.paymentMethod || 'cod',
      orderStatus: status,
      status: status,
      createdAt: o.createdAt || new Date().toISOString()
    };
  }

  async function loadCommonOrders() {
    try {
      // COMMON - pehle Common Orders.js wala helper, nahi hai toh direct API
      if (window.CommonOrders && window.CommonOrders.list) {
        var l1 = await window.CommonOrders.list({ role: ROLE, id: shopId, shopId: shopId, limit: 100 });
        allOrders = (l1 || []).map(normalizeOrder);
        return allOrders;
      }
      var url = API + '/api/common/orders/list?role=shop_owner&id=' + encodeURIComponent(shopId) + '&shopId=' + encodeURIComponent(shopId) + '&limit=100';
      var res = await fetch(url, { headers: getHeaders() });
      var data = await res.json().catch(function () { return {}; });
      var list = data.orders || data.data || [];
      allOrders = list.map(normalizeOrder);
    } catch (e) {
      console.warn('[achar] common orders fail', e.message);
      allOrders = [];
    }
    return allOrders;
  }

  function orderTotal(o) { return num(o.total); }

  function statusBadge(s) {
    var map = { placed: 'amber', confirmed: 'green', packed: 'green', out_for_delivery: 'blue', delivered: 'green', cancelled: 'red', rejected: 'red' };
    var label = { placed: 'Placed', confirmed: 'Confirmed', packed: 'Packed', out_for_delivery: 'On Way', delivered: 'Delivered', cancelled: 'Cancelled', rejected: 'Rejected' };
    return '<span class="badge ' + (map[s] || 'grey') + '">' + (label[s] || s) + '</span>';
  }

  function orderCard(o) {
    var itemsText = (o.items || []).map(function (it) { return esc(it.name || it.productName || 'Item') + ' x ' + (it.qty || it.quantity || 1); }).join(', ') || 'Items';
    var btns = '';
    if (o.orderStatus === 'placed') {
      btns = '<button class="btn green sm" onclick="acharAccept(\'' + o.orderId + '\')">✅ Accept</button> <button class="btn red sm" onclick="acharReject(\'' + o.orderId + '\')">❌ Reject</button>';
    } else if (o.orderStatus === 'confirmed') {
      btns = '<button class="btn amber sm" onclick="acharPack(\'' + o.orderId + '\')">📦 Packed</button>';
    } else if (o.orderStatus === 'packed') {
      btns = '<span class="badge grey">Shop ka kaam khatam - Ab Delivery Boy ka kaam hai</span>';
    } else {
      btns = '<span class="badge grey">' + esc(o.orderStatus) + '</span>';
    }
    return '<div class="row"><div class="mid"><b>' + esc(o.orderId) + ' - ' + esc(o.customerName) + ' - ₹' + orderTotal(o) + '</b><span>' + esc(itemsText) + ' • ' + esc(o.customerPhone) + ' • ' + esc(o.payment) + '</span></div><div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">' + statusBadge(o.orderStatus) + '<div>' + btns + '</div></div></div>';
  }

  function renderOrders() {
    var el = $('orderList'); if (!el) return;
    var list = orderFilter === 'all' ? allOrders : allOrders.filter(function (o) { return o.orderStatus === orderFilter; });
    if (!list.length) { el.innerHTML = '<div class="empty"><i>🧾</i>Is status me koi order nahi.</div>'; return; }
    el.innerHTML = list.map(orderCard).join('');
    var nav = $('navOrderCount'); if (nav) nav.textContent = String(allOrders.length);
  }

  function renderHomeOrders() {
    var el = $('homeOrders'); if (!el) return;
    var pending = allOrders.filter(function (o) { return ['placed', 'confirmed'].includes(o.orderStatus); });
    if (!pending.length) { el.innerHTML = '<div class="empty">✅ Koi pending order nahi.<br>Customer jab checkout karega, yahan aayega.</div>'; return; }
    el.innerHTML = pending.slice(0, 3).map(orderCard).join('');
    var navP = $('navPendingCount'); if (navP) navP.textContent = String(pending.length);
  }

  function renderStatsAndWallet() {
    var today = new Date().toDateString();
    var todayOrders = allOrders.filter(function (o) { return new Date(o.createdAt).toDateString() === today; });
    var todaySale = todayOrders.reduce(function (s, o) { return s + orderTotal(o); }, 0);
    var totalSale = allOrders.reduce(function (s, o) { return s + orderTotal(o); }, 0);
    var fee = Math.round(totalSale * 0.05);
    var earn = totalSale - fee;
    var deliveredSale = allOrders.filter(function (o) { return o.orderStatus === 'delivered'; }).reduce(function (s, o) { return s + orderTotal(o); }, 0);
    var pendingSale = allOrders.filter(function (o) { return ['placed', 'confirmed', 'packed'].includes(o.orderStatus); }).reduce(function (s, o) { return s + orderTotal(o); }, 0);

    if ($('todaySale')) $('todaySale').textContent = String(todaySale);
    if ($('todayOrdersLine')) $('todayOrdersLine').textContent = todayOrders.length + ' orders today';
    if ($('totalOrders')) $('totalOrders').textContent = String(allOrders.length);
    if ($('myEarning')) $('myEarning').textContent = String(earn);
    if ($('walletTotal')) $('walletTotal').textContent = String(totalSale);
    if ($('walletFee')) $('walletFee').textContent = String(fee);
    if ($('walletEarn')) $('walletEarn').textContent = String(earn);
    if ($('walletPending')) $('walletPending').textContent = String(pendingSale);
    if ($('walletDelivered')) $('walletDelivered').textContent = String(deliveredSale);

    var weekEl = $('weekList'); if (weekEl) {
      var days = [];
      for (var i = 6; i >= 0; i--) {
        var d = new Date(); d.setDate(d.getDate() - i);
        var ds = d.toDateString();
        var sum = allOrders.filter(function (o) { return new Date(o.createdAt).toDateString() === ds; }).reduce(function (s, o) { return s + orderTotal(o); }, 0);
        days.push('<div class="kv"><span>' + d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) + '</span><b>₹' + sum + '</b></div>');
      }
      weekEl.innerHTML = days.join('');
    }
    var notifDot = $('notifDot'); if (notifDot) notifDot.style.display = allOrders.some(function (o) { return o.orderStatus === 'placed'; }) ? 'block' : 'none';
  }

  function renderAll() {
    renderOrders();
    renderHomeOrders();
    renderStatsAndWallet();
    renderProducts();
    renderHomeProducts();
  }

  // ================= ORDER STATUS - COMMON =================
  async function changeOrderStatus(orderId, status) {
    if ((status === 'cancelled' || status === 'rejected') && !confirm('Ye order ' + status + ' karein?')) return;
    try {
      if (window.CommonOrders && window.CommonOrders.updateStatus) {
        var r1 = await window.CommonOrders.updateStatus(orderId, status, { role: ROLE, userId: shopId, shopId: shopId });
        if (!r1 || r1.success === false) throw new Error('Status fail');
      } else {
        var res = await fetch(API + '/api/common/orders/' + encodeURIComponent(orderId) + '/status', {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({ status: status, role: ROLE, userId: shopId, shopId: shopId })
        });
        var d = await res.json().catch(function () { return {}; });
        if (!res.ok || !d.success) throw new Error((d && d.message) || 'Status fail - Common orders.routes.js check karo');
      }
      toast('Order ' + status + ' ho gaya');
      await loadCommonOrders();
      renderAll();
    } catch (e) {
      toast('Status fail: ' + e.message);
    }
  }
  window.acharAccept = function (id) { return changeOrderStatus(id, 'confirmed'); };
  window.acharReject = function (id) { return changeOrderStatus(id, 'rejected'); };
  window.acharPack = function (id) { return changeOrderStatus(id, 'packed'); };
  window.changeOrderStatus = changeOrderStatus;

  // ================= PRODUCTS - Achar route + Common Seed fallback =================
  async function loadProducts() {
    try {
      var res = await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/products', { headers: getHeaders() });
      var data = await res.json().catch(function () { return {}; });
      allProducts = data.products || data.items || data.data || [];
      if (!allProducts.length) allProducts = shopData.products || [];
    } catch (e) { allProducts = shopData.products || []; }

    // COMMON SEED FALLBACK - API khaali hai toh Seed se 100 product le lo
    // API me maal hai toh Seed load hi nahi hoga - double nahi hoga
    if (!allProducts.length && seedProducts.length) {
      allProducts = seedProducts.slice();
      if ($('inventoryList')) { /* Seed se aaya hai - Dashboard pe dikhega, API me save nahi hoga jab tak Edit / Quick Add na karo */ }
    }
    // Normalise - _id / price500 sab me ho, warna Edit / Cart toot jayega
    allProducts = allProducts.map(function (p, i) {
      return {
        _id: p._id || p.id || ('achar-' + (i + 1)), id: p._id || p.id || ('achar-' + (i + 1)),
        name: p.name, category: p.category || p.acharType || 'Other', acharType: p.category || p.acharType || 'Other',
        price: num(p.price500 || p.price), price500: num(p.price500 || p.price), price1kg: num(p.price1kg || p.price),
        stock: num(p.stock ?? 0), jarType: p.jarType || 'Glass', spiceLevel: p.spiceLevel || 'Medium',
        image: p.image || p.thumbnail || '', thumbnail: p.thumbnail || p.image || '',
        description: p.description || p.desc || '', desc: p.description || p.desc || '',
        isSeed: p.isSeed || false, shopId: shopId
      };
    });
    return allProducts;
  }

  function productRow(p) {
    var stock = num(p.stock);
    var low = stock <= 2;
    var seedTag = p.isSeed ? ' <span class="badge amber">Seed</span>' : '';
    return '<div class="row"><img src="' + esc(p.image || 'https://placehold.co/100/d97706/fff?text=A') + '" onerror="this.src=\'https://placehold.co/100/d97706/fff?text=A\'"><div class="mid"><b>' + esc(p.name) + '</b><span>' + esc(p.category || p.acharType || 'Achar') + ' • ' + esc(p.spiceLevel || '') + ' • ' + esc(p.jarType || '') + ' • 500g ₹' + num(p.price500 || p.price) + ' • 1Kg ₹' + num(p.price1kg || p.price) + '</span></div><div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end"><span class="badge ' + (low ? 'red' : 'green') + '">' + (low ? 'Low Stock' : 'Stock: ' + stock + ' Kg') + '</span>' + seedTag + '<div><button class="btn light sm" onclick="acharEditProduct(\'' + (p._id || p.id) + '\')">Edit</button> <button class="btn red sm" onclick="acharDeleteProduct(\'' + (p._id || p.id) + '\')">Delete</button></div></div></div>';
  }

  function renderProducts() {
    var el = $('inventoryList'); if (!el) return;
    var q = ($('searchProduct') && $('searchProduct').value || '').toLowerCase();
    var list = allProducts.filter(function (p) {
      var okCat = productFilter === 'All' || (p.category || p.acharType || 'Other') === productFilter;
      var okQ = !q || (p.name || '').toLowerCase().includes(q);
      return okCat && okQ;
    });
    var chipsEl = $('categoryChips');
    if (chipsEl) {
      var cats = ['All'].concat(Array.from(new Set(allProducts.map(function (p) { return p.category || p.acharType || 'Other'; }))));
      chipsEl.innerHTML = cats.map(function (c) { return '<button class="chip ' + (c === productFilter ? 'active' : '') + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>'; }).join('');
      chipsEl.querySelectorAll('.chip').forEach(function (ch) {
        ch.addEventListener('click', function () {
          productFilter = ch.dataset.cat;
          chipsEl.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('active'); });
          ch.classList.add('active');
          renderProducts();
        });
      });
    }
    if (!list.length) { el.innerHTML = '<div class="empty"><i>🥒</i>Abhi koi product nahi hai. Naya Achar add karo.</div>'; return; }
    el.innerHTML = list.map(productRow).join('');
    if ($('navProductCount')) $('navProductCount').textContent = String(allProducts.length);
    if ($('totalProducts')) $('totalProducts').textContent = String(allProducts.length);
    var lowCount = allProducts.filter(function (p) { return num(p.stock) <= 2; }).length;
    if ($('lowStockLine')) $('lowStockLine').textContent = lowCount + ' low stock';
    var stockEl = $('stockAlert');
    if (stockEl) {
      var lows = allProducts.filter(function (p) { return num(p.stock) <= 2; });
      stockEl.innerHTML = lows.length ? lows.slice(0, 5).map(function (p) { return '<div class="kv"><span>' + esc(p.name) + '</span><b style="color:#dc2626">' + num(p.stock) + ' Kg</b></div>'; }).join('') : '<div class="empty">Sab stock thik hai ✅</div>';
    }
  }

  function renderHomeProducts() {
    var el = $('homeProducts'); if (!el) return;
    if (!allProducts.length) { el.innerHTML = '<div class="empty">Abhi koi product nahi hai</div>'; return; }
    el.innerHTML = allProducts.slice(0, 3).map(productRow).join('');
  }

  // ================= ADD / EDIT PRODUCT =================
  function openAddModal() {
    currentEditId = null;
    if ($('modalTitle')) $('modalTitle').textContent = 'Naya Achar Add Karo';
    ['acharName', 'acharDesc', 'acharPrice500g', 'acharPrice1kg', 'acharStock'].forEach(function (id) { if ($(id)) $(id).value = ''; });
    if ($('acharType')) $('acharType').value = 'Aam';
    if ($('acharJar')) $('acharJar').value = 'Glass';
    if ($('acharSpice')) $('acharSpice').value = 'Medium';
    productImageUrl = '';
    if ($('productImgPreview')) $('productImgPreview').src = 'https://placehold.co/600/d97706/fff?text=Achar+Photo';
    $('addModal').classList.add('open');
  }
  window.openAddModal = openAddModal;
  window.closeAddModal = function () { $('addModal').classList.remove('open'); };

  window.acharEditProduct = function (id) {
    var p = allProducts.find(function (x) { return String(x._id || x.id) === String(id); });
    if (!p) return;
    currentEditId = id;
    if ($('modalTitle')) $('modalTitle').textContent = 'Achar Edit Karo';
    if ($('acharName')) $('acharName').value = p.name || '';
    if ($('acharDesc')) $('acharDesc').value = p.description || p.desc || '';
    if ($('acharType')) $('acharType').value = p.category || p.acharType || 'Aam';
    if ($('acharJar')) $('acharJar').value = p.jarType || 'Glass';
    if ($('acharSpice')) $('acharSpice').value = p.spiceLevel || 'Medium';
    if ($('acharPrice500g')) $('acharPrice500g').value = p.price500 || p.price || '';
    if ($('acharPrice1kg')) $('acharPrice1kg').value = p.price1kg || p.price || '';
    if ($('acharStock')) $('acharStock').value = p.stock || '';
    productImageUrl = p.image || '';
    if ($('productImgPreview') && productImageUrl) $('productImgPreview').src = productImageUrl;
    $('addModal').classList.add('open');
  };

  window.acharDeleteProduct = async function (id) {
    if (!confirm('Ye product delete karein?')) return;
    var p = allProducts.find(function (x) { return String(x._id || x.id) === String(id); });
    // Seed wala product - API me hai hi nahi, sirf list se hatao
    if (p && p.isSeed) {
      allProducts = allProducts.filter(function (x) { return String(x._id || x.id) !== String(id); });
      seedProducts = seedProducts.filter(function (x) { return String(x._id || x.id) !== String(id); });
      renderAll();
      toast('Seed product list se hat gaya');
      return;
    }
    try {
      // COMMON Product Manager hai toh usi se delete karo
      if (window.ProductManager && window.ProductManager.delete) {
        await window.ProductManager.delete(shopId, id);
      } else {
        var res = await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/products/' + encodeURIComponent(id), { method: 'DELETE', headers: getHeaders() });
        var d = await res.json().catch(function () { return {}; });
        if (!res.ok || (d.success === false)) throw new Error(d.message || 'Delete fail');
      }
      allProducts = allProducts.filter(function (x) { return String(x._id || x.id) !== String(id); });
      renderAll();
      toast('Product delete ho gaya');
    } catch (e) { toast('Delete fail: ' + e.message); }
  };

  async function handleProductImage(file) {
    if (!file) return;
    try {
      // COMMON Image Compress hai toh pehle compress karo
      if (window.ImageCompress && window.ImageCompress.compress) { try { file = await window.ImageCompress.compress(file); } catch (e) {} }
      var fd = new FormData();
      fd.append('image', file);
      var res = await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/upload', { method: 'POST', body: fd });
      var d = await res.json().catch(function () { return {}; });
      productImageUrl = d.url || d.imageUrl || d.secure_url || '';
      if (!productImageUrl) throw new Error('Upload fail');
      if ($('productImgPreview')) $('productImgPreview').src = productImageUrl;
      toast('Photo upload ho gayi');
    } catch (e) { toast('Photo fail: ' + e.message); }
  }

  async function handleOwnerImage(file) {
    if (!file) return;
    try {
      var fd = new FormData();
      fd.append('image', file);
      var res = await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/upload', { method: 'POST', body: fd });
      var d = await res.json().catch(function () { return {}; });
      var url = d.url || d.imageUrl || d.secure_url || '';
      if (!url) throw new Error('Upload fail');
      if ($('ownerImg')) $('ownerImg').src = url;
      if ($('ownerImgBig')) $('ownerImgBig').src = url;
      shopData.ownerPhotoUrl = url;
      toast('Owner photo upload ho gayi - Profile Save karo');
    } catch (e) { toast('Photo fail: ' + e.message); }
  }

  window.saveNewAchar = async function () {
    var name = ($('acharName').value || '').trim();
    if (!name) return toast('Achar ka naam likho');
    var payload = {
      name: name,
      category: $('acharType').value,
      acharType: $('acharType').value,
      description: $('acharDesc').value,
      desc: $('acharDesc').value,
      jarType: $('acharJar').value,
      spiceLevel: $('acharSpice').value,
      price500: num($('acharPrice500g').value),
      price1kg: num($('acharPrice1kg').value),
      price: num($('acharPrice500g').value) || num($('acharPrice1kg').value),
      stock: num($('acharStock').value),
      image: productImageUrl || 'https://placehold.co/600/d97706/fff?text=Achar',
      shopId: shopId
    };
    try {
      // Seed wala Edit hai toh pehle usko Seed se hatao, phir API me save karo
      var isSeedEdit = currentEditId && String(currentEditId).indexOf('seed-achar-') === 0;
      if (isSeedEdit) currentEditId = null;

      if (window.ProductManager && window.ProductManager.save) {
        await window.ProductManager.save(shopId, payload, currentEditId);
      } else {
        var url = API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/products';
        var method = 'POST';
        if (currentEditId) { url += '/' + encodeURIComponent(currentEditId); method = 'PUT'; }
        var res = await fetch(url, { method: method, headers: getHeaders(), body: JSON.stringify(payload) });
        var d = await res.json().catch(function () { return {}; });
        if (!res.ok || (d.success === false)) throw new Error(d.message || 'Save fail');
      }
      toast(currentEditId ? 'Achar update ho gaya' : 'Achar add ho gaya');
      $('addModal').classList.remove('open');
      // Seed fallback wala product Edit hua toh usko Seed list se hata do, warna double dikhega
      if (isSeedEdit) { seedProducts = seedProducts.filter(function (x) { return x.name !== name; }); }
      await loadProducts();
      renderAll();
    } catch (e) { toast('Save fail: ' + e.message); }
  };

  // ================= QUICK ADD - AB SEED SE 100 PRODUCT =================
  function openQuickAdd() {
    quickAddSelected = new Set();
    var el = $('quickAddList'); if (!el) return;
    // COMMON SEED se lo - pehle wale 15 naam nahi, ab 100 naam aayenge
    var list = seedProducts.length ? seedProducts : allProducts;
    if (!list.length) { el.innerHTML = '<div class="empty">Seed load nahi hui - pehle Naya Achar se add karo</div>'; $('quickAddModal').classList.add('open'); return; }
    el.innerHTML = list.map(function (p) {
      var exists = allProducts.some(function (x) { return (x.name || '').toLowerCase() === (p.name || '').toLowerCase() && !x.isSeed; });
      return '<label style="display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:600;font-size:13px"><input type="checkbox" data-quick="' + esc(p.name) + '" data-quick-cat="' + esc(p.category) + '" data-quick-price500="' + num(p.price500) + '" data-quick-price1kg="' + num(p.price1kg) + '" ' + (exists ? 'disabled' : '') + '> ' + esc(p.name) + ' - ₹' + num(p.price500) + (exists ? ' <span class="badge green">Added</span>' : '') + '</label>';
    }).join('');
    el.querySelectorAll('input[data-quick]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        if (cb.checked) quickAddSelected.add(cb.dataset.quick); else quickAddSelected.delete(cb.dataset.quick);
        if ($('quickAddCount')) $('quickAddCount').textContent = String(quickAddSelected.size);
      });
    });
    if ($('quickAddCount')) $('quickAddCount').textContent = '0';
    $('quickAddModal').classList.add('open');
  }
  window.openQuickAdd = openQuickAdd;
  window.closeQuickAdd = function () { $('quickAddModal').classList.remove('open'); };

  async function saveQuickAdd() {
    if (!quickAddSelected.size) return toast('Koi achar tick karo');
    try {
      var items = [];
      document.querySelectorAll('#quickAddList input[data-quick]:checked').forEach(function (cb) {
        items.push({ name: cb.dataset.quick, category: cb.dataset.quickCat || 'Mix', acharType: cb.dataset.quickCat || 'Mix', price500: num(cb.dataset.quickPrice500) || 150, price1kg: num(cb.dataset.quickPrice1kg) || 280, price: num(cb.dataset.quickPrice500) || 150, stock: 10, image: 'https://placehold.co/600/d97706/fff?text=Achar', shopId: shopId });
      });
      var res = await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/products/bulk', { method: 'POST', headers: getHeaders(), body: JSON.stringify({ products: items, items: items }) });
      var d = await res.json().catch(function () { return {}; });
      if (!res.ok || (d.success === false)) {
        for (var i = 0; i < items.length; i++) {
          await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/products', { method: 'POST', headers: getHeaders(), body: JSON.stringify(items[i]) }).catch(function () {});
        }
      }
      toast(quickAddSelected.size + ' achar add ho gaye');
      $('quickAddModal').classList.remove('open');
      // Quick Add wale Seed se hat jayenge, warna double dikhenge
      seedProducts = seedProducts.filter(function (p) { return !quickAddSelected.has(p.name); });
      await loadProducts();
      renderAll();
    } catch (e) { toast('Quick Add fail: ' + e.message); }
  }

  // ================= MANUAL ORDER - COMMON CHECKOUT =================
  function openManualOrder() {
    var el = $('moItems'); if (!el) return;
    manualQty = {};
    if (!allProducts.length) { el.innerHTML = '<div class="empty">Pehle product add karo</div>'; }
    else {
      el.innerHTML = allProducts.map(function (p) {
        var id = p._id || p.id;
        return '<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid #f1f5f9"><span style="flex:1;font-size:13px;font-weight:600">' + esc(p.name) + ' - ₹' + num(p.price500 || p.price) + '</span><div class="qbox"><button type="button" onclick="acharMoMinus(\'' + id + '\')">-</button><span id="mo-qty-' + id + '">0</span><button type="button" onclick="acharMoPlus(\'' + id + '\')">+</button></div></div>';
      }).join('');
    }
    if ($('moTotal')) $('moTotal').textContent = '0';
    if ($('moName')) $('moName').value = '';
    if ($('moPhone')) $('moPhone').value = '';
    if ($('moAddress')) $('moAddress').value = '';
    $('manualOrderModal').classList.add('open');
  }
  window.openManualOrder = openManualOrder;
  window.closeManualOrder = function () { $('manualOrderModal').classList.remove('open'); };

  function updateMoTotal() {
    var total = 0;
    Object.keys(manualQty).forEach(function (id) {
      var p = allProducts.find(function (x) { return String(x._id || x.id) === String(id); });
      if (p) total += num(p.price500 || p.price) * num(manualQty[id]);
    });
    if ($('moTotal')) $('moTotal').textContent = String(total);
    return total;
  }
  window.acharMoPlus = function (id) {
    manualQty[id] = num(manualQty[id]) + 1;
    var el = $('mo-qty-' + id); if (el) el.textContent = String(manualQty[id]);
    updateMoTotal();
  };
  window.acharMoMinus = function (id) {
    manualQty[id] = Math.max(0, num(manualQty[id]) - 1);
    var el = $('mo-qty-' + id); if (el) el.textContent = String(manualQty[id]);
    updateMoTotal();
  };

  async function saveManualOrder() {
    var name = ($('moName').value || '').trim();
    var phone = ($('moPhone').value || '').trim();
    if (!name) return toast('Customer ka naam likho');
    if (!/^[6-9]\d{9}$/.test(phone)) return toast('Sahi 10 digit phone likho');
    var items = [];
    Object.keys(manualQty).forEach(function (id) {
      if (!num(manualQty[id])) return;
      var p = allProducts.find(function (x) { return String(x._id || x.id) === String(id); });
      if (!p) return;
      items.push({ productId: id, name: p.name, price: num(p.price500 || p.price), qty: num(manualQty[id]), quantity: num(manualQty[id]), image: p.image || '' });
    });
    if (!items.length) return toast('Koi item tick karo');
    var total = updateMoTotal();
    try {
      var res = await fetch(API + '/api/common/checkout/' + encodeURIComponent(shopId) + '/place', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          shopId: shopId, supplierId: shopId, supplierRole: 'shop_owner',
          buyerId: 'manual_' + phone, buyerName: name, buyerPhone: phone,
          customerName: name, customerPhone: phone, customerAddress: $('moAddress').value || '',
          items: items, total: total, grandTotal: total,
          payment: $('moPayment').value || 'cod', paymentMethod: $('moPayment').value || 'cod',
          source: 'manual', role: ROLE
        })
      });
      var d = await res.json().catch(function () { return {}; });
      if (!res.ok || (d.success === false)) throw new Error(d.message || 'Manual order fail');
      toast('✅ Order ban gaya - Common Order me gaya');
      $('manualOrderModal').classList.remove('open');
      await loadCommonOrders();
      renderAll();
      showPage('orders');
    } catch (e) { toast('Order fail: ' + e.message); }
  }

  // ================= SETTINGS / PROFILE / LOCATION =================
  async function saveAnnouncement() {
    var val = $('announcementInput').value || '';
    try {
      var res = await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/settings', { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ announcement: val }) });
      var d = await res.json().catch(function () { return {}; });
      if (!res.ok || (d.success === false)) throw new Error(d.message || 'Save fail');
      shopData.announcement = val;
      toast('Announcement save ho gaya');
    } catch (e) { toast('Save fail: ' + e.message); }
  }

  async function saveTiming() {
    var open = $('openTime').value || '09:00';
    var close = $('closeTime').value || '21:00';
    try {
      var res = await fetch(API + '/api/common/shop-toggle/' + encodeURIComponent(shopId) + '/timing', { method: 'POST', headers: getHeaders(), body: JSON.stringify({ open: open, close: close, role: ROLE, userId: shopId, shopId: shopId }) });
      var d = await res.json().catch(function () { return {}; });
      if (!res.ok || (d.success === false)) {
        await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/settings', { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ openTime: open, closeTime: close, timing: { open: open, close: close } }) });
      }
      if ($('timingStatus')) $('timingStatus').textContent = 'Timing save ho gayi: ' + to12(open) + ' - ' + to12(close);
      toast('Timing save ho gayi');
    } catch (e) { toast('Timing fail: ' + e.message); }
  }

  async function savePhone() {
    var phone = ($('shopPhoneInput').value || '').trim();
    if (!/^[6-9]\d{9}$/.test(phone)) return toast('Sahi 10 digit phone likho');
    try {
      var res = await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/settings', { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ phone: phone }) });
      var d = await res.json().catch(function () { return {}; });
      if (!res.ok || (d.success === false)) throw new Error(d.message || 'Save fail');
      shopData.phone = phone;
      if ($('phoneStatus')) $('phoneStatus').textContent = 'Number save ho gaya: ' + phone;
      toast('Number save ho gaya');
    } catch (e) { toast('Save fail: ' + e.message); }
  }

  async function saveProfile() {
    var payload = {
      ownerName: $('ownerNameInput').value || '',
      shopAddress: $('profileAddressInput').value || '',
      fullAddress: $('profileAddressInput').value || '',
      ownerPhotoUrl: shopData.ownerPhotoUrl || '',
      bannerPhotoUrl: $('bannerUrlInput').value || shopData.bannerPhotoUrl || ''
    };
    try {
      if (window.ProfileCore && window.ProfileCore.save) {
        await window.ProfileCore.save(shopId, payload);
      } else {
        var res = await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/settings', { method: 'PUT', headers: getHeaders(), body: JSON.stringify(payload) });
        var d = await res.json().catch(function () { return {}; });
        if (!res.ok || (d.success === false)) throw new Error(d.message || 'Save fail');
      }
      Object.assign(shopData, payload);
      if ($('profileStatus')) $('profileStatus').textContent = 'Profile save ho gaya';
      toast('Profile save ho gaya');
    } catch (e) { toast('Profile fail: ' + e.message); }
  }

  async function saveLocation() {
    var payload = {
      locationType: $('locationType').value || 'fixed',
      deliveryRange: num($('deliveryRange').value) || 5,
      shopAddress: $('shopAddress').value || '',
      fullAddress: $('shopAddress').value || ''
    };
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (pos) {
          payload.lat = pos.coords.latitude;
          payload.lng = pos.coords.longitude;
          payload.latitude = pos.coords.latitude;
          payload.longitude = pos.coords.longitude;
          doSaveLocation(payload);
        }, function () { doSaveLocation(payload); });
      } else {
        doSaveLocation(payload);
      }
    } catch (e) { toast('Location fail: ' + e.message); }
  }
  async function doSaveLocation(payload) {
    try {
      if (window.LocationCore && window.LocationCore.save) {
        await window.LocationCore.save(shopId, payload);
      } else {
        var res = await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/settings', { method: 'PUT', headers: getHeaders(), body: JSON.stringify(payload) });
        var d = await res.json().catch(function () { return {}; });
        if (!res.ok || (d.success === false)) throw new Error(d.message || 'Save fail');
      }
      if ($('locationStatus')) $('locationStatus').textContent = 'Location save ho gayi';
      toast('Location save ho gayi');
    } catch (e) { toast('Location fail: ' + e.message); }
  }
  async function loadLocation() {
    if ($('locationStatus')) $('locationStatus').textContent = 'Pehle wali: ' + (shopData.shopAddress || '-') + ' | Range: ' + (shopData.deliveryRange || 5) + ' KM | Lat: ' + (shopData.lat || shopData.latitude || '-') + ', Lng: ' + (shopData.lng || shopData.longitude || '-');
  }

  // ================= START =================
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  console.log('✅ Achar Dashboard JS loaded - Common Orders + Seed + ProductManager connected - shopId:', shopId);
})();