// LOCATION: public/shop-templates/common/components/components-loader.js - V4 - CODE 12
// KAAM: Ek hi file - 28 HTML lagana + Header + Nav + Toast + Zoom + Route fix. Alag fix file kabhi nahi.
// RULE 1: Kisi ek dukaan ka naam hardcode nahi hoga. Dukaan ka folder URL se aayega.
// RULE 2: Component ke HTML ke andar wale galat fetch ko yahin theek karenge, alag route-fix file nahi banegi.
// RULE 3: Ek cheez 2 baar nahi banegi. Toast 1 jagah, Loader 1 jagah, Confirm 1 jagah.
// RULE 4: Dashboard me pehle se sidebar hai toh dobara sidebar mat lao. Double sidebar banega.
// RULE 5: Product-card.js pehle se lagi hai toh dobara mat lao. Double load banega.
// RULE 6: CODE 12 wali 11 nayi file - cart-drawer, mini-cart, saved-for-later, address-select, payment-select, rating-widget, new-order-popup, qr-share-modal, low-stock-alert, cancel-order, return-order - sirf isi list se load hongi. Purani cart/checkout/customer-orders/inventory/orders/share wali file ko haath mat lagana.

(function () {
  if (window.__SAMAN_LOADER_V3__) return;
  window.__SAMAN_LOADER_V3__ = true;

  var loaded = {};
  var loading = {};
  var toastQueue = [];
  var toastBusy = false;
  var currentLang = 'en';

  function getBase() {
    var scripts = document.querySelectorAll('script[src*="components-loader"]');
    if (scripts.length > 0) {
      var src = scripts[0].getAttribute('src') || '';
      var pos = src.lastIndexOf('/');
      if (pos > -1) return src.slice(0, pos + 1);
    }
    return '../common/components/';
  }
  var BASE = getBase();

  function getShopId() {
    return new URLSearchParams(window.location.search).get('shopId') || window.__SAMAN_SHOP_ID || window.SHOP_ID || '';
  }

  // Dukaan ka folder URL se - achar-shop, kirana, bakery, sab isi se. Hardcode nahi.
  function getShopFolder() {
    try {
      var path = window.location.pathname || '';
      // /shop-templates/achar-shop/customer-view.html -> achar-shop
      var m = path.match(/\/shop-templates\/([^\/]+)\//);
      if (m) return m[1];
      // /shop-templates/achar-shop/dashboard.html -> achar-shop
      // Agar common ke andar hai toh pichle page se lo, nahi toh achar-shop mat likho
      if (window.__SAMAN_SHOP_FOLDER__) return window.__SAMAN_SHOP_FOLDER__;
    } catch (e) {}
    return '';
  }

  function getApiBase() { return window.API_BASE || window.location.origin; }

  function getHeaders() {
    var token = '';
    try { if (window.AuthCore && window.AuthCore.getToken) token = window.AuthCore.getToken() || ''; } catch (e) {}
    if (!token) token = window.USER_TOKEN || '';
    var h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el && val !== undefined && val !== null && val !== '') el.textContent = val;
  }
  function setImg(id, src) {
    var el = document.getElementById(id);
    if (el && src && el.tagName === 'IMG') el.src = src;
  }

  // ---- ROUTE FIX - Loader ke andar hi, alag file nahi ----
  // Wajah: shopRoutes me /shops/:id likha hai, mount /api/shops pe hai, toh ban gaya /api/shops/shops/XXX
  // Isliye component wala /api/shops/XXX kabhi nahi khulega. Seedha profile wala sahi rasta de do.
  var origFetch = window.fetch.bind(window);
  function fixUrl(url) {
    if (typeof url !== 'string') return url;
    var u = url;
    // 1. /api/shops/XXX -> /api/common/profile/me?role=shop_owner&shopId=XXX
    if (u.indexOf('/api/shops/') === 0 || u.indexOf(window.location.origin + '/api/shops/') > -1) {
      var shopId = '';
      var m = u.match(/\/api\/shops\/([^\/\?]+)/);
      if (m) shopId = m[1];
      if (!shopId) shopId = getShopId();
      if (u.indexOf('/products/') > -1) {
        var pm = u.match(/\/products\/([^\/\?\`]+)/);
        var pid = pm ? pm[1] : '';
        return '/api/world-products/' + encodeURIComponent(pid) + '?shopId=' + encodeURIComponent(shopId);
      }
      if (u.indexOf('/products') > -1) {
        var qm = u.match(/search=([^&\`]+)/);
        var q = qm ? qm[1] : '';
        return '/api/world-products?shopId=' + encodeURIComponent(shopId) + '&search=' + q;
      }
      return '/api/common/profile/me?role=shop_owner&shopId=' + encodeURIComponent(shopId);
    }
    // 2. /api/common/orders/XXX?status=placed -> /api/common/orders/list?shopId=XXX&status=placed
    if (u.indexOf('/api/common/orders/') > -1 && u.indexOf('/api/common/orders/list') === -1 && u.indexOf('/detail') === -1 && u.indexOf('/track') === -1 && u.indexOf('/cancel') === -1 && u.indexOf('/return') === -1) {
      try {
        var uu = new URL(u, window.location.origin);
        var parts = uu.pathname.split('/').filter(function (x) { return x !== ''; });
        var oid = parts[parts.length - 1];
        if (oid && oid.length < 20 && oid !== 'orders') {
          var st = uu.searchParams.get('status') || 'placed';
          return '/api/common/orders/list?shopId=' + encodeURIComponent(oid) + '&status=' + encodeURIComponent(st);
        }
      } catch (e) {}
    }
    // 3. /api/common/shop-status/XXX -> /api/common/shop-toggle/XXX/status
    if (u.indexOf('/api/common/shop-status/') > -1 && u.indexOf('/status') === -1) {
      try {
        var uu2 = new URL(u, window.location.origin);
        var p2 = uu2.pathname.split('/').filter(function (x) { return x !== ''; });
        var sid = p2[p2.length - 1];
        if (sid) return '/api/common/shop-toggle/' + encodeURIComponent(sid) + '/status';
      } catch (e) {}
    }
    // 4. /api/common/wishlist/toggle -> /api/wishlist/USERID/toggle - bina userId ke server nahi chalega
    if (u.indexOf('/api/common/wishlist/toggle') > -1) {
      var buyer = '';
      try { if (window.CartCore && window.CartCore.getBuyerId) buyer = window.CartCore.getBuyerId() || ''; } catch (e) {}
      if (!buyer) buyer = window.USER_ID || 'guest_' + Date.now();
      return '/api/wishlist/' + encodeURIComponent(buyer) + '/toggle';
    }
    if (u.indexOf('/api/common/wishlist') > -1) {
      return u.replace('/api/common/wishlist', '/api/wishlist');
    }
    return u;
  }

  function fixData(url, data) {
    if (!data || typeof data !== 'object') return data;
    // Profile wala - kabhi { shop: {...} } kabhi { data: {...} } kabhi seedha {...}
    if (url.indexOf('/api/common/profile/me') > -1) {
      var shop = data.shop || data.profile || data.data || data;
      if (shop && shop.shop) shop = shop.shop;
      return {
        shopName: shop.shopName || shop.name || shop.title || '',
        name: shop.shopName || shop.name || shop.title || '',
        logo: shop.logo || shop.shopLogo || shop.image || '',
        shopLogo: shop.logo || shop.shopLogo || shop.image || '',
        phone: shop.phone || shop.ownerPhone || '',
        address: shop.address || shop.fullAddress || shop.area || '',
        fullAddress: shop.address || shop.fullAddress || shop.area || '',
        rating: shop.rating || shop.avgRating || '',
        avgRating: shop.rating || shop.avgRating || '',
        isOpen: shop.isOpen !== undefined ? shop.isOpen : (shop.status !== 'closed'),
        status: shop.status || '',
        shop: shop
      };
    }
    if (url.indexOf('/shop-toggle/') > -1 && url.indexOf('/status') > -1) {
      var d = data.data || data;
      return { success: true, isOpen: d.isOpen !== undefined ? d.isOpen : (d.shop ? d.shop.isOpen : true), open: d.isOpen !== undefined ? d.isOpen : true, timing: d.timing || '', shop: d.shop || d };
    }
    if (url.indexOf('/api/common/orders/list') > -1) {
      if (Array.isArray(data)) return data;
      return data.orders || data.data || data.list || [];
    }
    if (url.indexOf('/api/world-products/') > -1 && url.indexOf('?') === -1) {
      return data.product || data.data || data;
    }
    return data;
  }

  // Sirf tabhi fetch ko chhedo jab URL galat hai, warna waisa hi rehne do
  window.fetch = function (url, options) {
    var fixedUrl = fixUrl(url);
    var isOurFix = fixedUrl !== url;
    return origFetch(fixedUrl, options).then(function (res) {
      if (!res.ok && isOurFix) {
        if (fixedUrl.indexOf('/api/common/profile/me') > -1) {
          return new Response(JSON.stringify({ shopName: '', name: '', logo: '', isOpen: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (fixedUrl.indexOf('/orders/list') > -1) {
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }
      var ct = '';
      try { ct = res.headers.get('content-type') || ''; } catch (e) {}
      if (ct.indexOf('application/json') === -1) return res;
      return res.clone().json().then(function (data) {
        var fixed = fixData(fixedUrl, data);
        return new Response(JSON.stringify(fixed), { status: res.status, headers: { 'Content-Type': 'application/json' } });
      }).catch(function () { return res; });
    });
  };

  // ---- WishlistCore - jo hai hi nahi, usko yahin bana do, taaki product-card toote nahi ----
  if (!window.WishlistCore) {
    window.WishlistCore = {
      toggle: async function (productId) {
        var buyerId = '';
        try { if (window.CartCore && window.CartCore.getBuyerId) buyerId = window.CartCore.getBuyerId() || ''; } catch (e) {}
        if (!buyerId) buyerId = window.USER_ID || 'guest_' + Date.now();
        var shopId = getShopId();
        try {
          var res = await origFetch('/api/wishlist/' + encodeURIComponent(buyerId) + '/toggle', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify({ productId: productId, shopId: shopId, buyerId: buyerId })
          });
          var d = await res.json().catch(function () { return {}; });
          return d;
        } catch (e) {
          if (!window.__SAMAN_WISH_RAM__) window.__SAMAN_WISH_RAM__ = [];
          var idx = window.__SAMAN_WISH_RAM__.indexOf(productId);
          var added = true;
          if (idx > -1) { window.__SAMAN_WISH_RAM__.splice(idx, 1); added = false; }
          else window.__SAMAN_WISH_RAM__.push(productId);
          return { success: true, added: added };
        }
      },
      isWished: function (productId) {
        if (!window.__SAMAN_WISH_RAM__) return false;
        return window.__SAMAN_WISH_RAM__.indexOf(productId) > -1;
      }
    };
  }

  // ---- HTML ko cheer ke dalo - style alag, html alag, script alag se chalao ----
  function injectHtml(html, mountEl) {
    var temp = document.createElement('div');
    temp.innerHTML = html;
    var scripts = [];
    var styles = [];
    var nodes = [];
    var childs = temp.childNodes;
    for (var i = 0; i < childs.length; i++) {
      var n = childs[i];
      if (n.nodeType !== 1) continue;
      var tag = (n.tagName || '').toLowerCase();
      if (tag === 'script') scripts.push(n);
      else if (tag === 'style') styles.push(n);
      else nodes.push(n);
    }
    for (var s = 0; s < styles.length; s++) {
      var st = document.createElement('style');
      st.textContent = styles[s].textContent || '';
      document.head.appendChild(st);
    }
    for (var k = 0; k < nodes.length; k++) mountEl.appendChild(nodes[k]);
    for (var j = 0; j < scripts.length; j++) {
      var old = scripts[j];
      // Component ke andar wale galat fetch wale script ko mat chalao - Loader hi naam bharega
      // Warna 2 baar fetch hoga - ek Loader se, ek HTML wale script se - race banegi
      var txt = old.textContent || '';
      if (txt.indexOf('/api/shops/') > -1 && txt.indexOf('profile/me') === -1) {
        // Sirf us hisse ko chhodo jo naam / logo bhar raha hai, baaki kaam Loader karega
        // Poora script rok do, kyunki uska fetch ab Loader wale fetch se theek ho jayega
        // Yahan kuch mat karo - script mat chalao
        continue;
      }
      var sc = document.createElement('script');
      var src = old.getAttribute('src');
      if (src) { sc.src = src; sc.async = false; }
      else sc.textContent = txt;
      document.body.appendChild(sc);
    }
  }

  function loadOne(name) {
    if (loaded[name]) return Promise.resolve(true);
    if (loading[name]) return loading[name];
    // Dashboard me pehle se sidebar hai toh dobara mat lao
    if (name === 'sidebar' && document.getElementById('sidebar')) { loaded[name] = true; return Promise.resolve(true); }
    // Page me pehle se hai toh dobara mat lao
    if (name === 'user-header' && document.getElementById('userHeader')) { loaded[name] = true; return Promise.resolve(true); }
    if (name === 'shop-header' && document.getElementById('shopHeader')) { loaded[name] = true; return Promise.resolve(true); }
    if (name === 'dashboard-header' && document.getElementById('dashHeader')) { loaded[name] = true; return Promise.resolve(true); }
    if (name === 'bottom-nav' && document.getElementById('bottomNav')) { loaded[name] = true; return Promise.resolve(true); }
    if (name === 'toast' && document.getElementById('toastContainer')) { loaded[name] = true; return Promise.resolve(true); }
    if (name === 'loader' && document.getElementById('globalLoader')) { loaded[name] = true; return Promise.resolve(true); }
    if (name === 'confirm-modal' && document.getElementById('confirmModal')) { loaded[name] = true; return Promise.resolve(true); }
    // CODE 12 - nayi file page me pehle se hai toh dobara mat lao, nahi toh id double ho jayegi
    if (name === 'cart-drawer' && document.getElementById('cartDrawer')) { loaded[name] = true; return Promise.resolve(true); }
    if (name === 'mini-cart' && document.getElementById('miniCart')) { loaded[name] = true; return Promise.resolve(true); }
    if (name === 'saved-for-later' && document.getElementById('savedForLaterBox')) { loaded[name] = true; return Promise.resolve(true); }
    if (name === 'address-select' && document.getElementById('addressSelectBox')) { loaded[name] = true; return Promise.resolve(true); }
    if (name === 'payment-select' && document.getElementById('paymentSelectBox')) { loaded[name] = true; return Promise.resolve(true); }
    if (name === 'rating-widget' && document.getElementById('ratingWidgetBox')) { loaded[name] = true; return Promise.resolve(true); }
    if (name === 'new-order-popup' && document.getElementById('newOrderPopup')) { loaded[name] = true; return Promise.resolve(true); }
    if (name === 'qr-share-modal' && document.getElementById('qrShareModal')) { loaded[name] = true; return Promise.resolve(true); }
    if (name === 'low-stock-alert' && document.getElementById('lowStockAlertBox')) { loaded[name] = true; return Promise.resolve(true); }
    if (name === 'cancel-order' && document.getElementById('cancelOrderModal')) { loaded[name] = true; return Promise.resolve(true); }
    if (name === 'return-order' && document.getElementById('returnOrderModal')) { loaded[name] = true; return Promise.resolve(true); }

    loading[name] = fetch(BASE + name + '.html?t=' + Date.now(), { credentials: 'include', cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('404 ' + name); return r.text(); })
      .then(function (html) {
        var mount = document.getElementById('samanComponentsMount');
        if (!mount) {
          mount = document.createElement('div');
          mount.id = 'samanComponentsMount';
          document.body.insertBefore(mount, document.body.firstChild);
        }
        injectHtml(html, mount);
        loaded[name] = true;
        return true;
      })
      .catch(function () { loaded[name] = true; return false; });
    return loading[name];
  }

  function loadOneJs(name) {
    if (loaded[name]) return Promise.resolve(true);
    if (loading[name]) return loading[name];
    // Product-card.js pehle se lagi hai toh dobara mat lao
    if (name === 'product-card' && (window.ProductCard || document.querySelector('script[src*="product-card.js"]'))) { loaded[name] = true; return Promise.resolve(true); }
    loading[name] = new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = BASE + name + '.js?t=' + Date.now();
      s.async = false;
      s.onload = function () { loaded[name] = true; resolve(true); };
      s.onerror = function () { loaded[name] = true; resolve(false); };
      document.body.appendChild(s);
    });
    return loading[name];
  }

  // ---- Shop ka naam / logo / status - SIRF YAHIN SE bharega, kahin aur se nahi ----
  async function loadShop() {
    var shopId = getShopId();
    if (!shopId) return;
    try {
      var res = await origFetch('/api/common/profile/me?role=shop_owner&shopId=' + encodeURIComponent(shopId), { headers: getHeaders(), credentials: 'include' });
      var data = await res.json().catch(function () { return {}; });
      var shop = data.shop || data.profile || data.data || data || {};
      var name = shop.shopName || shop.name || shop.title || '';
      var logo = shop.logo || shop.shopLogo || shop.image || '';
      var phone = shop.phone || shop.ownerPhone || '';
      var address = shop.address || shop.fullAddress || shop.area || '';
      var rating = shop.rating || shop.avgRating || '';
      var isOpen = shop.isOpen !== undefined ? shop.isOpen : (shop.status !== 'closed');
      if (!name) return;
      // Customer wala header
      setText('userHeaderTitle', name);
      setImg('userHeaderLogo', logo);
      // Dukaan wala header
      setText('shopHeaderName', name);
      setImg('shopHeaderLogo', logo);
      setText('shopHeaderAddress', address);
      // Dashboard wala header
      setText('dashShopName', name);
      setImg('dashShopLogo', logo);
      setText('dashShopIdShort', 'ID: ' + shopId.slice(-4));
      // Sidebar wala
      setText('sidebarShopName', name);
      setText('sidebarShopId', 'ID: ' + shopId.slice(-4));
      setText('sidebarCurrentShop', name);
      // Status - sab jagah ek hi
      var statusText = isOpen ? '● Open' : '● Closed';
      setText('userHeaderStatus', statusText + ' • 30 mins delivery');
      setText('shopHeaderStatus', statusText);
      setText('shopStatusBadgeHeader', statusText);
      if (rating) { setText('userHeaderRating', '⭐ ' + rating); setText('shopHeaderRating', rating + ' reviews'); }
      if (phone) {
        var callBtn = document.getElementById('shopHeaderCall');
        if (callBtn) callBtn.onclick = function () { window.location.href = 'tel:' + phone; };
      }
    } catch (e) {}
  }

  // ---- Sidebar count - Sahi route se ----
  async function loadSidebarCounts() {
    var shopId = getShopId();
    if (!shopId) return;
    if (!document.getElementById('sidebar')) return;
    try {
      var r1 = await origFetch('/api/common/orders/list?shopId=' + encodeURIComponent(shopId) + '&status=placed', { headers: getHeaders(), credentials: 'include' });
      var d1 = await r1.json().catch(function () { return []; });
      var arr = Array.isArray(d1) ? d1 : (d1.orders || d1.data || []);
      setText('sidebarOrdersCount', String(arr.length || 0));
      var el = document.getElementById('sidebarOrdersCount');
      if (el) el.style.display = arr.length ? 'inline' : 'none';
    } catch (e) {}
    try {
      var r2 = await origFetch('/api/common/inventory/' + encodeURIComponent(shopId) + '/low-stock', { headers: getHeaders(), credentials: 'include' });
      var d2 = await r2.json().catch(function () { return []; });
      var arr2 = Array.isArray(d2) ? d2 : (d2.items || d2.data || []);
      var el2 = document.getElementById('sidebarLowStock');
      if (el2) el2.style.display = arr2.length ? 'inline' : 'none';
    } catch (e) {}
  }

  // ---- Toast - Ek hi jagah se ----
  function showToast(msg, type) {
    toastQueue.push({ msg: msg, type: type || 'info' });
    if (toastBusy) return;
    toastBusy = true;
    (function next() {
      var item = toastQueue.shift();
      if (!item) { toastBusy = false; return; }
      var box = document.getElementById('toastContainer');
      if (!box) {
        var t = document.createElement('div');
        t.id = 'toastContainer';
        t.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:center;';
        document.body.appendChild(t);
        box = t;
      }
      var el = document.createElement('div');
      el.textContent = item.msg;
      el.style.cssText = 'background:#111827;color:#fff;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,.2);max-width:92vw;text-align:center;';
      if (item.type === 'error') el.style.background = '#dc2626';
      if (item.type === 'success') el.style.background = '#15803d';
      box.appendChild(el);
      setTimeout(function () { try { el.remove(); } catch (e) {} next(); }, 2500);
    })();
  }

  // ---- Nav Fix - Dukaan ka folder URL se, hardcode nahi ----
  function fixNav() {
    var shopId = getShopId();
    var folder = getShopFolder();
    if (!shopId || !folder) return;
    var q = '?shopId=' + encodeURIComponent(shopId);
    // Bottom-nav
    var navMap = {
      home: '../' + folder + '/customer-view.html' + q,
      search: '../' + folder + '/customer-view.html' + q + '#search',
      categories: '../' + folder + '/customer-view.html' + q + '#categories',
      cart: '../common/cart/cart.html' + q,
      profile: '../common/profile/profile.html' + q + '&role=customer'
    };
    var navItems = document.querySelectorAll('[data-nav]');
    for (var i = 0; i < navItems.length; i++) {
      var key = navItems[i].getAttribute('data-nav');
      if (navMap[key]) navItems[i].setAttribute('href', navMap[key]);
    }
    // Sidebar - Dashboard wala alag, Customer wala alag
    var sideMap = {
      dashboard: '../' + folder + '/dashboard.html' + q,
      orders: '../common/orders/orders.html' + q,
      products: '../common/inventory/inventory.html' + q,
      inventory: '../common/inventory/inventory.html' + q,
      wallet: '../common/wallet/wallet.html' + q,
      analytics: '../common/analytics/analytics.html' + q,
      coupons: '../common/marketing/coupons.html' + q,
      settings: '../common/settings/settings.html' + q,
      profile: '../common/profile/profile.html' + q + '&role=shop_owner',
      notifications: '../common/notifications/notifications.html' + q,
      reviews: '../common/reviews/reviews.html' + q
    };
    var sideLinks = document.querySelectorAll('[data-link]');
    for (var j = 0; j < sideLinks.length; j++) {
      var k2 = sideLinks[j].getAttribute('data-link');
      if (sideMap[k2]) sideLinks[j].setAttribute('href', sideMap[k2]);
    }
    // Sidebar open / close
    var toggle = document.getElementById('dashSidebarToggle');
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    var closeBtn = document.getElementById('closeSidebar');
    function openSb() { if (sidebar) sidebar.classList.add('open'); if (overlay) overlay.style.display = 'block'; }
    function closeSb() { if (sidebar) sidebar.classList.remove('open'); if (overlay) overlay.style.display = 'none'; }
    if (toggle) toggle.onclick = openSb;
    if (closeBtn) closeBtn.onclick = closeSb;
    if (overlay) overlay.onclick = closeSb;
    window.openSidebar = openSb;
    window.closeSidebar = closeSb;
    // View Shop button
    var viewBtn = document.getElementById('sidebarViewShop');
    if (viewBtn) viewBtn.onclick = function () { window.location.href = '../' + folder + '/customer-view.html' + q; };
  }

  // ---- Loader / Confirm / Zoom - Ek hi jagah ----
  window.SamanComponents = {
    toast: showToast,
    showLoader: function () { var el = document.getElementById('globalLoader'); if (el) el.style.display = 'flex'; },
    hideLoader: function () { var el = document.getElementById('globalLoader'); if (el) el.style.display = 'none'; },
    confirm: function (msg) {
      return new Promise(function (resolve) {
        var modal = document.getElementById('confirmModal');
        if (!modal) { resolve(window.confirm(msg)); return; }
        var txtEl = document.getElementById('confirmModalText') || modal.querySelector('p');
        if (txtEl) txtEl.textContent = msg;
        modal.style.display = 'flex';
        var ok = document.getElementById('confirmModalOk');
        var cancel = document.getElementById('confirmModalCancel');
        function done(v) { modal.style.display = 'none'; resolve(v); }
        if (ok) ok.onclick = function () { done(true); };
        if (cancel) cancel.onclick = function () { done(false); };
      });
    },
    load: loadOne,
    loadJs: loadOneJs
  };
  window.SamanUI = window.SamanComponents;
  window.Toast = { show: showToast };

  // ---- Kaunsi file kab laani hai - Page ke hisab se ----
  function getPageType() {
    var path = window.location.pathname || '';
    if (path.indexOf('dashboard') > -1) return 'dashboard';
    if (path.indexOf('customer-view') > -1 || path.indexOf('user-view') > -1 || path.indexOf('shop-view') > -1) return 'customer';
    return 'common';
  }

  async function init() {
    var type = getPageType();
    var list = [];
    if (type === 'customer') {
      list = ['user-header', 'shop-header', 'bottom-nav', 'toast', 'loader', 'confirm-modal', 'empty-state', 'skeleton-loader', 'image-zoom', 'language-switcher', 'product-quick-view', 'user-footer', 'cart-drawer', 'mini-cart', 'saved-for-later', 'rating-widget', 'cancel-order', 'return-order', 'qr-share-modal'];
    } else if (type === 'dashboard') {
      // Dashboard me sidebar pehle se hai toh Loader sidebar mat laayega - loadOne me guard hai
      list = ['dashboard-header', 'sidebar', 'dashboard-footer', 'toast', 'loader', 'confirm-modal', 'empty-state', 'skeleton-loader', 'image-zoom', 'language-switcher', 'new-order-popup', 'low-stock-alert', 'qr-share-modal'];
    } else {
      list = ['toast', 'loader', 'confirm-modal', 'empty-state', 'skeleton-loader', 'image-zoom', 'language-switcher', 'cart-drawer', 'address-select', 'payment-select'];
    }
    for (var i = 0; i < list.length; i++) { try { await loadOne(list[i]); } catch (e) {} }
    try { await loadOneJs('product-card'); } catch (e) {}
    fixNav();
    await loadShop();
    await loadSidebarCounts();
    // Cart count
    try { if (window.CartCore && window.CartCore.getCount) { var c = window.CartCore.getCount(); var badges = document.querySelectorAll('[data-cart-count]'); for (var b = 0; b < badges.length; b++) { badges[b].textContent = String(c); badges[b].style.display = c > 0 ? 'inline' : 'none'; } } } catch (e) {}
    document.dispatchEvent(new CustomEvent('saman:components-ready'));
    window.__SAMAN_COMPONENTS_READY__ = true;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();