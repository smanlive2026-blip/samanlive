// LOCATION: public/shop-templates/achar-shop/dashboard.js - FULL - PRODUCT-FORM + COMMON PROFILE - V4
// RULE: Product = WORLD MODEL. Order = Common Order. Profile = COMMON UNIFIED PROFILE (V23).
// PRODUCT-FORM: Add / Edit / Quick Add = ../common/products/product-form.html - Dashboard me apna modal NAHI hoga
// PROFILE: Photo = UnifiedProfile.handleFileInput() -> /api/common/profile/upload-avatar -> Cloudinary -> Shop model
//          Details = PUT /api/common/profile/shop/{shopId} -> Shop model - Achar /settings pe KABHI NAHI
//          3 ALAG PHOTO: shop_logo -> logo, shop_cover -> banner, shop_owner -> ownerPhotoUrl
// COMMON: WorldProductManager = /api/world-products + /api/common/orders/list + /api/common/orders/:id/status + /api/common/checkout/:shopId/place + /api/common/shop-toggle + /api/common/profile/me + /api/common/profile/shop/:shopId
// READ RULE: price500 = p.price500 || p.extraData?.price500 || p.price | image = p.thumbnail || p.image || p.extraData?.thumbnail
//            logo = shop.logo || shop.shopLogo | banner = shop.banner || shop.coverPhoto | ownerPhoto = shop.ownerPhotoUrl

(function () {
  var params = new URLSearchParams(location.search);
  var shopId = params.get('shopId') || params.get('id') || localStorage.getItem('last_shopId') || localStorage.getItem('shopId') || '';
  window.SHOP_ID = shopId;
  window.shopId = shopId;
  window.SHOP_TYPE = 'achar-shop';
  var ROLE = 'shop_owner';
  var API = window.API_BASE || location.origin;
  var SHOP_TYPE = 'achar-shop';

  var shopData = {};
  var allProducts = [];
  var allOrders = [];
  var productFilter = 'All';
  var orderFilter = 'all';
  var manualQty = {};

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
  function returnUrl() { return location.href.split('?')[0] + '?shopId=' + encodeURIComponent(shopId); }
  function productFormUrl(extra) {
    return '../common/products/product-form.html?shopId=' + encodeURIComponent(shopId) + '&type=' + SHOP_TYPE + '&shopType=' + SHOP_TYPE + '&returnUrl=' + encodeURIComponent(returnUrl()) + (extra || '');
  }
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
  function normProduct(p, i) {
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
      lowStockAlert: num(p.lowStockAlert || ex.lowStockAlert || 2),
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
  // Profile ke liye - address kabhi object kabhi string aata hai, isliye 1 jagah se nikaalo
  function shopAddressStr(s) {
    if (!s) return '';
    if (typeof s.address === 'string') return s.address;
    if (s.address && s.address.line1) return s.address.line1 + (s.address.city ? ', ' + s.address.city : '');
    return s.shopAddress || s.fullAddress || '';
  }
  function shopLogoUrl(s) { return (s && (s.logo || s.shopLogo || s.uploadedLogo || s.image)) || ''; }
  function shopBannerUrl(s) { return (s && (s.banner || s.coverPhoto || s.cover || s.bannerPhotoUrl)) || ''; }
  function shopOwnerPhotoUrl(s) { return (s && (s.ownerPhotoUrl || s.ownerPhoto || s.ownerAvatar)) || ''; }

  // ================= NAV / PAGE =================
  function showPage(page) {
    document.querySelectorAll('.page').forEach(function (el) { el.classList.toggle('active', el.dataset.page === page); });
    document.querySelectorAll('.nav button[data-page]').forEach(function (b) { b.classList.toggle('active', b.dataset.page === page); });
    var titles = { home: 'Overview', products: 'Products', orders: 'Orders', wallet: 'Earnings & Wallet', settings: 'Settings', profile: 'Profile', location: 'Location' };
    var subs = { home: 'Aaj ka hisaab, ek nazar me', products: 'Achar - Search, stock, edit', orders: 'Common Checkout se aaye orders', wallet: 'Common Order se bana hisaab', settings: 'Timing aur contact', profile: 'Shop profile - Common Profile', location: 'Location aur delivery range' };
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
    var add1 = $('addAcharBtn'); if (add1) add1.addEventListener('click', openProductForm);
    var add2 = $('addAcharBtn2'); if (add2) add2.addEventListener('click', openProductForm);
    var qa = $('quickAddBtn'); if (qa) qa.addEventListener('click', openQuickAdd);
    var mo = $('newOrderBtn'); if (mo) mo.addEventListener('click', openManualOrder);
    var wa = $('whatsappShareBtn'); if (wa) wa.addEventListener('click', shareWhatsApp);
    var sa = $('saveAnnouncement'); if (sa) sa.addEventListener('click', saveAnnouncement);
    var st = $('saveTiming'); if (st) st.addEventListener('click', saveTiming);
    var sp = $('savePhone'); if (sp) sp.addEventListener('click', savePhone);
    var spf = $('saveProfileBtn'); if (spf) spf.addEventListener('click', saveProfile);
    var sl = $('saveLocationBtn'); if (sl) sl.addEventListener('click', saveLocation);
    var ll = $('loadLocationBtn'); if (ll) ll.addEventListener('click', loadLocation);
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
    // PROFILE - 3 ALAG PHOTO - 3 ALAG INPUT - HTML me onchange bhi hai, yahan backup hai
    // Purana wala handleOwnerImage(file) wala tareeka DELETE - wo Achar /upload pe jata tha
    var logoIn = $('shopLogoInput'); if (logoIn) logoIn.addEventListener('change', function () { changeShopLogo(logoIn); });
    var bannerIn = $('shopBannerInput'); if (bannerIn) bannerIn.addEventListener('change', function () { changeShopBanner(bannerIn); });
    var ownerIn = $('ownerInput'); if (ownerIn) ownerIn.addEventListener('change', function () { changeOwnerPhoto(ownerIn); });
    var oib = $('ownerImgBig'); if (oib) oib.addEventListener('click', function () { if ($('ownerInput')) $('ownerInput').click(); });
    var logoPrev = $('shopLogoPreview'); if (logoPrev) logoPrev.addEventListener('click', function () { if ($('shopLogoInput')) $('shopLogoInput').click(); });
    var bannerPrev = $('shopBannerPreview'); if (bannerPrev) bannerPrev.addEventListener('click', function () { if ($('shopBannerInput')) $('shopBannerInput').click(); });
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
    // PROFILE PEHLE - Common Profile se, phir Achar ka bacha hua data - ulta karoge toh Logo udd jayega
    await loadShopProfile();
    await loadShopData();
    await loadCommonOrders();
    await loadProducts();
    renderAll();
    initSocket();
    setInterval(function () { loadCommonOrders().then(renderAll).catch(function () {}); }, 30000);
    window.addEventListener('focus', function () { loadProducts().then(renderAll).catch(function () {}); });
    // Common Profile se wapas aaye toh Profile dobara load karo
    window.addEventListener('focus', function () { loadShopProfile().catch(function () {}); });
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

  // ================= SHOP PROFILE - COMMON UNIFIED PROFILE - V23 =================
  async function loadShopProfile() {
    // 1. UnifiedProfile - sabse pehle, yahi asli Shop hai
    try {
      if (window.UnifiedProfile && window.UnifiedProfile.loadMyProfile) {
        var prof = await window.UnifiedProfile.loadMyProfile();
        if (prof && prof.success && (prof.shop || prof.user)) {
          shopData = Object.assign({}, shopData, prof.shop || prof.user);
          fillShopProfileUI();
          return shopData;
        }
      }
    } catch (e) { console.warn('[achar] UnifiedProfile fail', e.message); }
    // 2. Direct Common API
    try {
      var token = localStorage.getItem('TOKEN') || localStorage.getItem('userToken') || '';
      var buyerId = localStorage.getItem('USER_ID') || '';
      var res = await fetch(API + '/api/common/profile/me?buyerId=' + encodeURIComponent(buyerId) + '&role=shop_owner&shopId=' + encodeURIComponent(shopId), {
        headers: { 'Authorization': 'Bearer ' + token, 'x-buyer-id': buyerId }
      });
      var data = await res.json().catch(function () { return {}; });
      if (data && data.success && (data.shop || data.user)) {
        shopData = Object.assign({}, shopData, data.shop || data.user);
        fillShopProfileUI();
        return shopData;
      }
    } catch (e) {}
    // 3. Local cache - API fail ho toh bhi khaali na dikhe
    try {
      var local = JSON.parse(localStorage.getItem('shop_' + shopId) || '{}');
      if (local && (local.shopName || local.name)) {
        shopData = Object.assign({}, shopData, local);
        fillShopProfileUI();
        return shopData;
      }
    } catch (e) {}
    return shopData;
  }

  function fillShopProfileUI() {
    if (!shopData) return;
    var logo = shopLogoUrl(shopData);
    var banner = shopBannerUrl(shopData);
    var ownerPhoto = shopOwnerPhotoUrl(shopData);
    var name = shopData.shopName || shopData.name || 'Maa Ke Haath Ka Achar';
    var ownerName = shopData.ownerName || '';

    if ($('shopName')) $('shopName').textContent = ownerName ? ownerName + ' ki Dukaan' : name;
    // Sidebar me Owner Photo dikhega - Logo nahi
    if ($('ownerImg') && ownerPhoto) $('ownerImg').src = ownerPhoto;
    // Profile page - 3 alag photo
    if ($('shopLogoPreview') && logo) $('shopLogoPreview').src = logo;
    if ($('shopLogoImg') && logo) $('shopLogoImg').src = logo;
    if ($('shopBannerPreview') && banner) $('shopBannerPreview').src = banner;
    if ($('bannerUrlInput') && banner) $('bannerUrlInput').value = banner;
    if ($('ownerImgBig') && ownerPhoto) $('ownerImgBig').src = ownerPhoto;

    if ($('announcementInput')) $('announcementInput').value = shopData.announcement || shopData.tagline || '';
    if ($('shopPhoneInput')) $('shopPhoneInput').value = shopData.phone || shopData.ownerPhone || '';
    if ($('ownerNameInput')) $('ownerNameInput').value = ownerName;
    if ($('profileAddressInput')) $('profileAddressInput').value = shopAddressStr(shopData);
    if ($('shopAddress')) $('shopAddress').value = shopAddressStr(shopData);
    if ($('deliveryRange')) $('deliveryRange').value = shopData.deliveryRange || 5;
    if ($('locationType')) $('locationType').value = shopData.locationType || 'fixed';
    // Timing bhi Common Profile se aati hai toh wahi bhardo
    if (shopData.timing) {
      if ($('openTime')) $('openTime').value = to24(shopData.timing.open || shopData.timing.openingTime || shopData.openTime || '09:00');
      if ($('closeTime')) $('closeTime').value = to24(shopData.timing.close || shopData.timing.closingTime || shopData.closeTime || '21:00');
    }
    try { localStorage.setItem('shop_' + shopId, JSON.stringify(shopData)); } catch (e) {}
    window.SHOP_PROFILE = shopData;
  }

  // --- 3 PHOTO - 3 ALAG FUNCTION ---
  async function changeShopLogo(inputEl) {
    if (!inputEl || !inputEl.files || !inputEl.files[0]) return;
    if (!window.UnifiedProfile) return toast('Profile system load nahi hua - page refresh karo');
    var r = await window.UnifiedProfile.handleFileInput(inputEl, {
      role: 'shop_logo', field: 'logo', type: 'logo', shopId: shopId,
      previewSelector: '#shopLogoPreview, #shopLogoImg',
      msgId: 'profileStatus'
    });
    if (r && r.success) {
      shopData.logo = r.url; shopData.shopLogo = r.url; shopData.uploadedLogo = r.url; shopData.image = r.url;
      fillShopProfileUI();
      toast('✅ Shop Logo save ho gaya - Customer ko dikhega');
    }
  }
  async function changeShopBanner(inputEl) {
    if (!inputEl || !inputEl.files || !inputEl.files[0]) return;
    if (!window.UnifiedProfile) return toast('Profile system load nahi hua - page refresh karo');
    var r = await window.UnifiedProfile.handleFileInput(inputEl, {
      role: 'shop_cover', field: 'banner', type: 'banner', shopId: shopId,
      previewSelector: '#shopBannerPreview',
      msgId: 'profileStatus'
    });
    if (r && r.success) {
      shopData.banner = r.url; shopData.coverPhoto = r.url; shopData.cover = r.url;
      fillShopProfileUI();
      toast('✅ Banner save ho gaya - Customer ko dikhega');
    }
  }
  async function changeOwnerPhoto(inputEl) {
    if (!inputEl || !inputEl.files || !inputEl.files[0]) return;
    if (!window.UnifiedProfile) return toast('Profile system load nahi hua - page refresh karo');
    var r = await window.UnifiedProfile.handleFileInput(inputEl, {
      role: 'shop_owner', field: 'ownerPhotoUrl', type: 'avatar', shopId: shopId,
      previewSelector: '#ownerImg, #ownerImgBig',
      msgId: 'profileStatus'
    });
    if (r && r.success) {
      shopData.ownerPhotoUrl = r.url; shopData.ownerPhoto = r.url; shopData.ownerAvatar = r.url;
      fillShopProfileUI();
      toast('✅ Owner Photo save ho gaya');
    }
  }
  window.changeShopLogo = changeShopLogo;
  window.changeShopBanner = changeShopBanner;
  window.changeOwnerPhoto = changeOwnerPhoto;
  // Purana naam - agar kahin se call ho raha hai toh bhi UnifiedProfile hi chalega
  window.handleOwnerImage = function (inputOrFile) {
    if (inputOrFile && inputOrFile.files) return changeOwnerPhoto(inputOrFile);
    return toast('Owner Photo badalne ke liye file chuno');
  };
  window.handleProfilePicChange = function (inputEl, role, previewSelector) {
    if (window.UnifiedProfile) return window.UnifiedProfile.handleFileInput(inputEl, { role: role || 'shop_logo', shopId: shopId, previewSelector: previewSelector, msgId: 'profileStatus' });
  };

  // --- COMMON PROFILE PAGES ---
  window.openShopProfile = function () { location.href = '../common/profile/profile.html?shopId=' + encodeURIComponent(shopId); };
  window.openShopInfo = function () { location.href = '../common/profile/shop-info.html?shopId=' + encodeURIComponent(shopId); };
  window.openShopGallery = function () { location.href = '../common/profile/shop-gallery.html?shopId=' + encodeURIComponent(shopId); };
  window.openShopTimingPage = function () { location.href = '../common/profile/shop-timing.html?shopId=' + encodeURIComponent(shopId); };
  window.openShopVerification = function () { location.href = '../common/profile/shop-verification.html?shopId=' + encodeURIComponent(shopId); };

  // ================= SHOP DATA - ACHAR ROUTE - SIRF FALLBACK =================
  // RULE: Ye Common Profile ko overwrite NAHI karega. Sirf jo field khaali hai, wahi bharega.
  async function loadShopData() {
    try {
      var res = await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId), { headers: getHeaders() });
      var data = await res.json().catch(function () { return {}; });
      if (!data.success) throw new Error(data.message || 'Shop load fail');
      var acharShop = data.shop || {};
      // Merge - Common Profile wali value ko khaali Achar wali se mat udao
      Object.keys(acharShop).forEach(function (k) {
        if (shopData[k] === undefined || shopData[k] === '' || shopData[k] === null) shopData[k] = acharShop[k];
      });
      // Logo / Banner / Owner Photo - Common wali hi rahegi, Achar wali se kabhi overwrite nahi hogi
      if ($('shopName')) $('shopName').textContent = shopData.ownerName ? shopData.ownerName + ' ki Dukaan' : (shopData.shopName || shopData.name || 'Maa Ke Haath Ka Achar');
      if ($('pageTitle')) $('pageTitle').textContent = 'Overview';
      fillShopProfileUI();
      if ($('openTime') && !$('openTime').value) $('openTime').value = to24(shopData.openTime || (shopData.timing && shopData.timing.open) || '09:00');
      if ($('closeTime') && !$('closeTime').value) $('closeTime').value = to24(shopData.closeTime || (shopData.timing && shopData.timing.close) || '21:00');
    } catch (e) {
      console.warn('[achar] shop load fail', e.message);
    }
  }

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

  // ================= PRODUCTS - WORLD MODEL =================
  async function loadProducts() {
    try {
      if (window.WorldProductManager && window.WorldProductManager.getProducts) {
        var list = await window.WorldProductManager.getProducts({ shopId: shopId, shopType: SHOP_TYPE });
        allProducts = (list || []).map(normProduct);
      } else if (window.ProductManager && window.ProductManager.getProducts) {
        var list2 = await window.ProductManager.getProducts({ shopId: shopId, shopType: SHOP_TYPE });
        allProducts = (list2 || []).map(normProduct);
      } else {
        var res = await fetch(API + '/api/world-products?shopType=' + SHOP_TYPE + '&shopId=' + encodeURIComponent(shopId) + '&role=dashboard');
        var data = await res.json().catch(function () { return {}; });
        allProducts = (data.data || data.products || []).map(normProduct);
      }
    } catch (e) {
      console.warn('[achar] world products fail', e.message);
      allProducts = [];
    }
    return allProducts;
  }

  function productRow(p) {
    var stock = num(p.stock);
    var low = stock <= num(p.lowStockAlert || 2);
    return '<div class="row"><img src="' + esc(p.image || p.thumbnail || 'https://placehold.co/100/d97706/fff?text=A') + '" onerror="this.src=\'https://placehold.co/100/d97706/fff?text=A\'"><div class="mid"><b>' + esc(p.name) + '</b><span>' + esc(p.category || 'Achar') + ' • ' + esc(p.spiceLevel || '') + ' • ' + esc(p.jarType || '') + ' • 500g ₹' + num(p.price500 || p.price) + ' • 1Kg ₹' + num(p.price1kg || p.price) + '</span></div><div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end"><span class="badge ' + (low ? 'red' : 'green') + '">' + (low ? 'Low Stock' : 'Stock: ' + stock + ' Kg') + '</span><div><button class="btn light sm" onclick="acharEditProduct(\'' + (p._id || p.id) + '\')">Edit</button> <button class="btn red sm" onclick="acharDeleteProduct(\'' + (p._id || p.id) + '\')">Delete</button></div></div></div>';
  }

  function renderProducts() {
    var el = $('inventoryList'); if (!el) return;
    var q = ($('searchProduct') && $('searchProduct').value || '').toLowerCase();
    var list = allProducts.filter(function (p) {
      var okCat = productFilter === 'All' || (p.category || 'Other') === productFilter;
      var okQ = !q || (p.name || '').toLowerCase().includes(q);
      return okCat && okQ;
    });
    var chipsEl = $('categoryChips');
    if (chipsEl) {
      var cats = ['All'].concat(Array.from(new Set(allProducts.map(function (p) { return p.category || 'Other'; }))));
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
    if (!list.length) { el.innerHTML = '<div class="empty"><i>🥒</i>Abhi koi product nahi hai. Naya Achar add karo - Product Form khulega.</div>'; return; }
    el.innerHTML = list.map(productRow).join('');
    if ($('navProductCount')) $('navProductCount').textContent = String(allProducts.length);
    if ($('totalProducts')) $('totalProducts').textContent = String(allProducts.length);
    var lowCount = allProducts.filter(function (p) { return num(p.stock) <= num(p.lowStockAlert || 2); }).length;
    if ($('lowStockLine')) $('lowStockLine').textContent = lowCount + ' low stock';
    var stockEl = $('stockAlert');
    if (stockEl) {
      var lows = allProducts.filter(function (p) { return num(p.stock) <= num(p.lowStockAlert || 2); });
      stockEl.innerHTML = lows.length ? lows.slice(0, 5).map(function (p) { return '<div class="kv"><span>' + esc(p.name) + '</span><b style="color:#dc2626">' + num(p.stock) + ' Kg</b></div>'; }).join('') : '<div class="empty">Sab stock thik hai ✅</div>';
    }
  }

  function renderHomeProducts() {
    var el = $('homeProducts'); if (!el) return;
    if (!allProducts.length) { el.innerHTML = '<div class="empty">Abhi koi product nahi hai</div>'; return; }
    el.innerHTML = allProducts.slice(0, 3).map(productRow).join('');
  }

  // ================= ADD / EDIT / QUICK ADD - PRODUCT-FORM =================
  function openProductForm() { location.href = productFormUrl(''); }
  function openQuickAdd() { location.href = productFormUrl('&quick=1'); }
  window.openProductForm = openProductForm;
  window.openAddModal = openProductForm;
  window.openQuickAdd = openQuickAdd;
  window.closeAddModal = function () {};
  window.closeQuickAdd = function () {};
  window.saveNewAchar = function () { openProductForm(); };

  window.acharEditProduct = function (id) { location.href = productFormUrl('&editId=' + encodeURIComponent(id)); };

  window.acharDeleteProduct = async function (id) {
    if (!confirm('Ye product delete karein?')) return;
    try {
      if (window.WorldProductManager && window.WorldProductManager.deleteProduct) {
        var r = await window.WorldProductManager.deleteProduct(id);
        if (!r || r.success === false) throw new Error((r && r.message) || 'Delete fail');
      } else if (window.ProductManager && window.ProductManager.deleteProduct) {
        var r2 = await window.ProductManager.deleteProduct(id);
        if (!r2 || r2.success === false) throw new Error('Delete fail');
      } else {
        var res = await fetch(API + '/api/world-products/' + encodeURIComponent(id), { method: 'DELETE', headers: getHeaders() });
        var d = await res.json().catch(function () { return {}; });
        if (!res.ok || (d.success === false)) throw new Error(d.message || 'Delete fail');
      }
      allProducts = allProducts.filter(function (p) { return String(p._id || p.id) !== String(id); });
      renderAll();
      toast('Product delete ho gaya');
    } catch (e) { toast('Delete fail: ' + e.message); }
  };

  window.handleProductImage = function () { openProductForm(); };

  // ================= MANUAL ORDER - COMMON CHECKOUT =================
  function openManualOrder() {
    var el = $('moItems'); if (!el) return;
    manualQty = {};
    if (!allProducts.length) { el.innerHTML = '<div class="empty">Pehle Product Form se product add karo</div>'; }
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
      items.push({ productId: id, name: p.name, price: num(p.price500 || p.price), qty: num(manualQty[id]), quantity: num(manualQty[id]), image: p.image || p.thumbnail || '' });
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

  // ================= SETTINGS / PROFILE SAVE / LOCATION =================
  async function saveAnnouncement() {
    var val = $('announcementInput') ? $('announcementInput').value || '' : '';
    try {
      // Announcement bhi Common Profile me jayega - taaki Customer ko wahi dikhe
      var token = localStorage.getItem('TOKEN') || localStorage.getItem('userToken') || '';
      var buyerId = localStorage.getItem('USER_ID') || '';
      var res = await fetch(API + '/api/common/profile/shop/' + encodeURIComponent(shopId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, 'x-buyer-id': buyerId },
        body: JSON.stringify({ shopId: shopId, announcement: val, tagline: val })
      });
      var d = await res.json().catch(function () { return {}; });
      if (!res.ok || (d.success === false)) {
        await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/settings', { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ announcement: val }) });
      }
      shopData.announcement = val; shopData.tagline = val;
      try { localStorage.setItem('shop_' + shopId, JSON.stringify(shopData)); } catch (e) {}
      toast('Announcement save ho gaya');
    } catch (e) { toast('Save fail: ' + e.message); }
  }

  async function saveTiming() {
    var open = $('openTime') ? $('openTime').value || '09:00' : '09:00';
    var close = $('closeTime') ? $('closeTime').value || '21:00' : '21:00';
    try {
      var res = await fetch(API + '/api/common/shop-toggle/' + encodeURIComponent(shopId) + '/timing', { method: 'POST', headers: getHeaders(), body: JSON.stringify({ open: open, close: close, role: ROLE, userId: shopId, shopId: shopId }) });
      var d = await res.json().catch(function () { return {}; });
      if (!res.ok || (d.success === false)) {
        await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/settings', { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ openTime: open, closeTime: close, timing: { open: open, close: close } }) });
      }
      shopData.openTime = open; shopData.closeTime = close; shopData.timing = { open: open, close: close };
      if ($('timingStatus')) $('timingStatus').textContent = 'Timing save ho gayi: ' + to12(open) + ' - ' + to12(close);
      toast('Timing save ho gayi');
    } catch (e) { toast('Timing fail: ' + e.message); }
  }

  async function savePhone() {
    var phone = ($('shopPhoneInput') ? $('shopPhoneInput').value || '' : '').trim();
    if (!/^[6-9]\d{9}$/.test(phone)) return toast('Sahi 10 digit phone likho');
    try {
      var token = localStorage.getItem('TOKEN') || localStorage.getItem('userToken') || '';
      var buyerId = localStorage.getItem('USER_ID') || '';
      var res = await fetch(API + '/api/common/profile/shop/' + encodeURIComponent(shopId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, 'x-buyer-id': buyerId },
        body: JSON.stringify({ shopId: shopId, phone: phone, ownerPhone: phone, whatsapp: phone })
      });
      var d = await res.json().catch(function () { return {}; });
      if (!res.ok || (d.success === false)) {
        await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/settings', { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ phone: phone }) });
      }
      shopData.phone = phone; shopData.ownerPhone = phone;
      try { localStorage.setItem('shop_' + shopId, JSON.stringify(shopData)); } catch (e) {}
      if ($('phoneStatus')) $('phoneStatus').textContent = 'Number save ho gaya: ' + phone;
      toast('Number save ho gaya');
    } catch (e) { toast('Save fail: ' + e.message); }
  }

  async function saveProfile() {
    var payload = {
      shopId: shopId,
      shopName: shopData.shopName || shopData.name || '',
      name: shopData.shopName || shopData.name || '',
      ownerName: $('ownerNameInput') ? $('ownerNameInput').value || '' : (shopData.ownerName || ''),
      phone: $('shopPhoneInput') ? $('shopPhoneInput').value || '' : (shopData.phone || ''),
      ownerPhone: $('shopPhoneInput') ? $('shopPhoneInput').value || '' : (shopData.phone || ''),
      address: $('profileAddressInput') ? $('profileAddressInput').value || '' : shopAddressStr(shopData),
      shopAddress: $('profileAddressInput') ? $('profileAddressInput').value || '' : shopAddressStr(shopData),
      fullAddress: $('profileAddressInput') ? $('profileAddressInput').value || '' : shopAddressStr(shopData),
      logo: shopLogoUrl(shopData),
      shopLogo: shopLogoUrl(shopData),
      uploadedLogo: shopLogoUrl(shopData),
      image: shopLogoUrl(shopData),
      banner: shopBannerUrl(shopData) || ($('bannerUrlInput') ? $('bannerUrlInput').value || '' : ''),
      coverPhoto: shopBannerUrl(shopData) || ($('bannerUrlInput') ? $('bannerUrlInput').value || '' : ''),
      cover: shopBannerUrl(shopData) || ($('bannerUrlInput') ? $('bannerUrlInput').value || '' : ''),
      ownerPhotoUrl: shopOwnerPhotoUrl(shopData),
      ownerPhoto: shopOwnerPhotoUrl(shopData),
      ownerAvatar: shopOwnerPhotoUrl(shopData),
      announcement: $('announcementInput') ? $('announcementInput').value || '' : (shopData.announcement || ''),
      tagline: $('announcementInput') ? $('announcementInput').value || '' : (shopData.tagline || '')
    };
    try {
      var token = localStorage.getItem('TOKEN') || localStorage.getItem('userToken') || '';
      var buyerId = localStorage.getItem('USER_ID') || '';
      // 1. Common Profile - asli save yahin hoga
      var res = await fetch(API + '/api/common/profile/shop/' + encodeURIComponent(shopId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, 'x-buyer-id': buyerId },
        body: JSON.stringify(payload)
      });
      var d = await res.json().catch(function () { return {}; });
      if (!res.ok || (d.success === false)) {
        // 2. Fallback - Purana Achar route - sirf naam / phone ke liye, Photo ke liye nahi
        var res2 = await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/settings', { method: 'PUT', headers: getHeaders(), body: JSON.stringify(payload) });
        var d2 = await res2.json().catch(function () { return {}; });
        if (!res2.ok || (d2.success === false)) throw new Error((d && d.message) || (d2 && d2.message) || 'Save fail');
      }
      Object.assign(shopData, payload);
      try { localStorage.setItem('shop_' + shopId, JSON.stringify(shopData)); } catch (e) {}
      fillShopProfileUI();
      if ($('profileStatus')) $('profileStatus').textContent = '✅ Profile save ho gaya - Customer ko dikhega';
      toast('Profile save ho gaya');
    } catch (e) { toast('Profile fail: ' + e.message); }
  }

  async function saveLocation() {
    var payload = {
      locationType: $('locationType') ? $('locationType').value || 'fixed' : 'fixed',
      deliveryRange: num($('deliveryRange') ? $('deliveryRange').value : 5) || 5,
      shopAddress: $('shopAddress') ? $('shopAddress').value || '' : '',
      fullAddress: $('shopAddress') ? $('shopAddress').value || '' : '',
      address: $('shopAddress') ? $('shopAddress').value || '' : ''
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
        // Location bhi Common Profile me jayegi - taaki Nearby Shops me sahi location jaye
        var token = localStorage.getItem('TOKEN') || localStorage.getItem('userToken') || '';
        var res = await fetch(API + '/api/common/profile/shop/' + encodeURIComponent(shopId), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify(Object.assign({ shopId: shopId }, payload))
        });
        var d = await res.json().catch(function () { return {}; });
        if (!res.ok || (d.success === false)) {
          await fetch(API + '/api/shops/achar/' + encodeURIComponent(shopId) + '/settings', { method: 'PUT', headers: getHeaders(), body: JSON.stringify(payload) });
        }
      }
      Object.assign(shopData, payload);
      try { localStorage.setItem('shop_' + shopId, JSON.stringify(shopData)); } catch (e) {}
      if ($('locationStatus')) $('locationStatus').textContent = 'Location save ho gayi';
      toast('Location save ho gayi');
    } catch (e) { toast('Location fail: ' + e.message); }
  }
  async function loadLocation() {
    if ($('locationStatus')) $('locationStatus').textContent = 'Pehle wali: ' + (shopAddressStr(shopData) || '-') + ' | Range: ' + (shopData.deliveryRange || 5) + ' KM | Lat: ' + (shopData.lat || shopData.latitude || '-') + ', Lng: ' + (shopData.lng || shopData.longitude || '-');
  }

  // ================= START =================
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  console.log('✅ Achar Dashboard JS loaded - PRODUCT-FORM (World Model) + Common Orders + COMMON PROFILE (UnifiedProfile) - shopId:', shopId);
})();