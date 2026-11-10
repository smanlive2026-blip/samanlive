// LOCATION: public/shop-templates/achar-shop/dashboard.js - FULL - COMMON CONNECTED
// RULE: Order = Common Order. Product / Profile = Achar route (abhi ke liye).
// COMMON: /api/common/orders/list + /api/common/orders/:id/status + /api/common/checkout/:shopId/place + /api/common/shop-toggle
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
    // Search + chips - Products
    var spInput = $('searchProduct'); if (spInput) spInput.addEventListener('input', function () { renderProducts(); });
    // Order chips
    document.querySelectorAll('#orderChips .chip').forEach(function (c) {
      c.addEventListener('click', function () {
        document.querySelectorAll('#orderChips .chip').forEach(function (x) { x.classList.remove('active'); });
        c.classList.add('active');
        orderFilter = c.dataset.orderFilter || 'all';
        renderOrders();
      });
    });
    // Product image + owner image
    var pi = $('productImageInput'); if (pi) pi.addEventListener('change', function (e) { handleProductImage(e.target.files[0]); });
    var oi = $('ownerInput'); if (oi) oi.addEventListener('change', function (e) { handleOwnerImage(e.target.files[0]); });
    var oib = $('ownerImgBig'); if (oib) oib.addEventListener('click', function () { $('ownerInput').click(); });
  }

  function shareWhatsApp() {
    var msg = 'Namaste! ' + (shopData.shopName || 'Achar Shop') + ' se ghar ka bana shuddh achar order karo: ' + shopUrl();
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
    await loadCommonOrders();
    await loadProducts();
    renderAll();
    initSocket();
    // Har 30 sec me Common Order refresh - naya order aaye toh pata chale
    setInterval(function () { loadCommonOrders().then(renderAll).catch(function () {}); }, 30000);
  }

  // ShopToggle - Common wali JS hi sambhalegi, yahan sirf UI sync rakhenge
  function bindShopToggleUI() {
    var btn = $('shopToggle');
    if (!btn) return;
    // Common shop-toggle.js is button pe apna listener lagayega (data-shop-toggle se)
    // Yahan dobara fetch nahi karenge, warna 2 baar toggle hoga
    // Sirf status dikhane ke liye Common API se ek baar lao
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

  // Socket - Common Order aaye toh turant dikhe
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

  // ================= COMMON ORDERS - YAHI ASLI JOD HAI =================
  function normalizeOrder(o) {
    // Common Order ka shape alag ho sakta hai - sabko ek shape me lao
    var status = o.orderStatus || o.status || 'placed';
    // Purane 'cancelled' ko 'cancelled' hi rakhenge, naya 'rejected' alag hai
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
      // COMMON - 1 hi API, sab dukaan ke liye same
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
    // SHOP SIRF YE 3 KAR SAKTA HAI - Assign / Delivered yahan nahi hoga
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

    // Last 7 din
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
      // COMMON - 1 hi API
      var res = await fetch(API + '/api/common/orders/' + encodeURIComponent(orderId) + '/status', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: status, role: ROLE, userId: shopId, shopId: shopId })
      });
      var d = await res.json().catch(function () { return {}; });
      if (!res.ok || !d.success) throw new Error((d && d.message) || 'Status fail - Common orders.routes.js check karo');
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

  // ================= PRODUCTS - Achar route (abhi ke liye) =================
  async function loadProducts() {
    try {
      var res = await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/products', { headers: getHeaders() });
      var data = await res.json().catch(function () { return {}; });
      allProducts = data.products || data.items || data.data || [];
      if (!allProducts.length) {
        // Fallback - shop data ke andar products ho toh wahi lo
        allProducts = shopData.products || [];
      }
    } catch (e) { allProducts = shopData.products || []; }
    return allProducts;
  }

  function productRow(p) {
    var stock = num(p.stock);
    var low = stock <= 2;
    return '<div class="row"><img src="' + esc(p.image || 'https://placehold.co/100/d97706/fff?text=A') + '" onerror="this.src=\'https://placehold.co/100/d97706/fff?text=A\'"><div class="mid"><b>' + esc(p.name) + '</b><span>' + esc(p.category || p.acharType || 'Achar') + ' • ' + esc(p.spiceLevel || '') + ' • ' + esc(p.jarType || '') + ' • 500g ₹' + num(p.price500 || p.price) + ' • 1Kg ₹' + num(p.price1kg || p.price) + '</span></div><div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end"><span class="badge ' + (low ? 'red' : 'green') + '">' + (low ? 'Low Stock' : 'Stock: ' + stock + ' Kg') + '</span><div><button class="btn light sm" onclick="acharEditProduct(\'' + (p._id || p.id) + '\')">Edit</button> <button class="btn red sm" onclick="acharDeleteProduct(\'' + (p._id || p.id) + '\')">Delete</button></div></div></div>';
  }

  function renderProducts() {
    var el = $('inventoryList'); if (!el) return;
    var q = ($('searchProduct') && $('searchProduct').value || '').toLowerCase();
    var list = allProducts.filter(function (p) {
      var okCat = productFilter === 'All' || (p.category || p.acharType || 'Other') === productFilter;
      var okQ = !q || (p.name || '').toLowerCase().includes(q);
      return okCat && okQ;
    });
    // Category chips
    var chipsEl = $('categoryChips');
    if (chipsEl && !chipsEl.dataset.built) {
      var cats = ['All'].concat(Array.from(new Set(allProducts.map(function (p) { return p.category || p.acharType || 'Other'; }))));
      chipsEl.innerHTML = cats.map(function (c) { return '<button class="chip ' + (c === productFilter ? 'active' : '') + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>'; }).join('');
      chipsEl.dataset.built = '1';
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
    try {
      var res = await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/products/' + encodeURIComponent(id), { method: 'DELETE', headers: getHeaders() });
      var d = await res.json().catch(function () { return {}; });
      if (!res.ok || (d.success === false)) throw new Error(d.message || 'Delete fail');
      allProducts = allProducts.filter(function (p) { return String(p._id || p.id) !== String(id); });
      renderAll();
      toast('Product delete ho gaya');
    } catch (e) { toast('Delete fail: ' + e.message); }
  };

  async function handleProductImage(file) {
    if (!file) return;
    try {
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
      image: productImageUrl || 'https://placehold.co/600/d97706/fff?text=Achar'
    };
    try {
      var url = API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/products';
      var method = 'POST';
      if (currentEditId) { url += '/' + encodeURIComponent(currentEditId); method = 'PUT'; }
      var res = await fetch(url, { method: method, headers: getHeaders(), body: JSON.stringify(payload) });
      var d = await res.json().catch(function () { return {}; });
      if (!res.ok || (d.success === false)) throw new Error(d.message || 'Save fail');
      toast(currentEditId ? 'Achar update ho gaya' : 'Achar add ho gaya');
      $('addModal').classList.remove('open');
      await loadProducts();
      renderAll();
    } catch (e) { toast('Save fail: ' + e.message); }
  };

  // ================= QUICK ADD =================
  var QUICK_LIST = ['Aam ka Achar', 'Nimbu ka Achar', 'Mix Achar', 'Gajar ka Achar', 'Mirchi ka Achar', 'Lahsun ka Achar', 'Aam ka Murabba', 'Gajar ka Murabba', 'Amla ka Achar', 'Karela ka Achar', 'Baingan ka Achar', 'Gobhi ka Achar', 'Hari Mirchi ka Achar', 'Adrak ka Achar', 'Imli ka Achar'];
  function openQuickAdd() {
    quickAddSelected = new Set();
    var el = $('quickAddList'); if (!el) return;
    el.innerHTML = QUICK_LIST.map(function (n) {
      var exists = allProducts.some(function (p) { return (p.name || '').toLowerCase() === n.toLowerCase(); });
      return '<label style="display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:600;font-size:13px"><input type="checkbox" data-quick="' + esc(n) + '" ' + (exists ? 'disabled' : '') + '> ' + esc(n) + (exists ? ' <span class="badge green">Added</span>' : '') + '</label>';
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
      var items = Array.from(quickAddSelected).map(function (n) { return { name: n, category: 'Mix', price500: 150, price1kg: 280, price: 150, stock: 10, image: 'https://placehold.co/600/d97706/fff?text=Achar' }; });
      var res = await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/products/bulk', { method: 'POST', headers: getHeaders(), body: JSON.stringify({ products: items, items: items }) });
      var d = await res.json().catch(function () { return {}; });
      if (!res.ok || (d.success === false)) {
        // Bulk fail hua toh ek-ek karke add karo
        for (var i = 0; i < items.length; i++) {
          await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/products', { method: 'POST', headers: getHeaders(), body: JSON.stringify(items[i]) }).catch(function () {});
        }
      }
      toast(quickAddSelected.size + ' achar add ho gaye');
      $('quickAddModal').classList.remove('open');
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
      // COMMON CHECKOUT - Manual order bhi wahi Order Collection me jayega
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
      // COMMON shop-toggle timing - Customer ko wahi timing dikhegi
      var res = await fetch(API + '/api/common/shop-toggle/' + encodeURIComponent(shopId) + '/timing', { method: 'POST', headers: getHeaders(), body: JSON.stringify({ open: open, close: close, role: ROLE, userId: shopId, shopId: shopId }) });
      var d = await res.json().catch(function () { return {}; });
      if (!res.ok || (d.success === false)) {
        // Fallback - Achar settings pe save karo
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
      var res = await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/settings', { method: 'PUT', headers: getHeaders(), body: JSON.stringify(payload) });
      var d = await res.json().catch(function () { return {}; });
      if (!res.ok || (d.success === false)) throw new Error(d.message || 'Save fail');
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
      var res = await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/settings', { method: 'PUT', headers: getHeaders(), body: JSON.stringify(payload) });
      var d = await res.json().catch(function () { return {}; });
      if (!res.ok || (d.success === false)) throw new Error(d.message || 'Save fail');
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

  console.log('✅ Achar Dashboard JS loaded - Common Orders connected - shopId:', shopId);
})();