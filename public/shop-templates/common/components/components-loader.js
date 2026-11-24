// LOCATION: public/shop-templates/common/components/components-loader.js - V2 FINAL
// KAAM: Ek hi file - 18 HTML lagana + Header + Nav + UI + Media sab sambhalna.
// RULE: Alag se 4 fix file ki zaroorat nahi. Sab isi ke andar hai.
// RULE: Dashboard me pehle se sidebar hai toh dobara sidebar mat lao. Double sidebar banega.
// RULE: Product-card.js pehle se lagi hai toh dobara mat lao. Double load banega.

(function () {
  if (window.__SAMAN_LOADER_V2__) return;
  window.__SAMAN_LOADER_V2__ = true;

  var loaded = {};
  var loading = {};
  var loaderCount = 0;
  var loaderTimer = null;
  var toastQueue = [];
  var toastBusy = false;
  var statusTimer = null;
  var lastStatus = null;
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

  function getApiBase() {
    return window.API_BASE || window.location.origin;
  }

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
    if (el && val) el.textContent = val;
  }

  function setImg(id, src) {
    var el = document.getElementById(id);
    if (el && src && el.tagName === 'IMG') el.src = src;
  }

  // HTML ko cheer ke dalo - style alag, html alag, script alag se chalao
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
      var sc = document.createElement('script');
      var src = old.getAttribute('src');
      if (src) { sc.src = src; sc.async = false; }
      else sc.textContent = old.textContent || '';
      document.body.appendChild(sc);
    }
  }

  function loadOne(name) {
    if (loaded[name]) return Promise.resolve(true);
    if (loading[name]) return loading[name];
    // Dashboard me pehle se sidebar hai toh dobara mat lao - CODE 7 FIX
    if (name === 'sidebar' && document.getElementById('sidebar')) { loaded[name] = true; return Promise.resolve(true); }
    // Page me pehle se hai toh dobara mat lao
    if (document.querySelector('[data-saman-comp="' + name + '"]')) { loaded[name] = true; return Promise.resolve(true); }
    var mountEl = document.getElementById('samanComponentsMount');
    if (!mountEl) {
      mountEl = document.createElement('div');
      mountEl.id = 'samanComponentsMount';
      mountEl.style.display = 'contents';
      document.body.appendChild(mountEl);
    }
    loading[name] = fetch(BASE + name + '.html?t=' + Date.now(), { credentials: 'include', cache: 'no-store' })
      .then(function (res) { if (!res.ok) throw new Error('Not found'); return res.text(); })
      .then(function (html) {
        var wrap = document.createElement('div');
        wrap.setAttribute('data-saman-comp', name);
        wrap.style.display = 'contents';
        mountEl.appendChild(wrap);
        injectHtml(html, wrap);
        loaded[name] = true;
        return true;
      })
      .catch(function () { return false; });
    return loading[name];
  }

  function loadOneJs(name) {
    // Product-card pehle se lagi hai toh dobara mat lao - CODE 7 FIX
    if (name === 'product-card' && window.ProductCard) { loaded[name] = true; return Promise.resolve(true); }
    if (loaded[name]) return Promise.resolve(true);
    if (loading[name]) return loading[name];
    loading[name] = new Promise(function (resolve) {
      var sc = document.createElement('script');
      sc.src = BASE + name + '.js?t=' + Date.now();
      sc.async = false;
      sc.onload = function () { loaded[name] = true; resolve(true); };
      sc.onerror = function () { resolve(false); };
      document.body.appendChild(sc);
    });
    return loading[name];
  }

  // HEADER FIX - Code 3 jo gayab tha, ab isi me hai
  async function loadShop() {
    var shopId = getShopId();
    if (!shopId) return null;
    try {
      var res = await fetch(getApiBase() + '/api/common/profile/me?role=shop_owner&shopId=' + encodeURIComponent(shopId), { headers: getHeaders(), credentials: 'include', cache: 'no-store' });
      var data = await res.json().catch(function () { return {}; });
      var shop = data.shop || data.profile || data.data || data || {};
      if (shop.shop) shop = shop.shop;
      var name = shop.shopName || shop.name || shop.title || 'Achar Shop';
      var logo = shop.logo || shop.shopLogo || shop.image || '';
      var addr = shop.address || shop.fullAddress || shop.area || '';
      var rating = shop.rating || shop.avgRating || '';
      var ratingCount = shop.ratingCount || shop.totalReviews || shop.reviewsCount || '';
      var isOpen = shop.isOpen;
      if (isOpen === undefined) isOpen = shop.status !== 'closed' && shop.shopStatus !== 'closed';
      var timing = (shop.openTime || '09:00') + ' - ' + (shop.closeTime || '21:00');
      setText('userHeaderTitle', name);
      setImg('userHeaderLogo', logo);
      if (rating) setText('userHeaderRating', '⭐ ' + rating + (ratingCount ? ' (' + ratingCount + ')' : ''));
      setText('shopHeaderName', name);
      setImg('shopHeaderLogo', logo);
      setText('shopHeaderAddress', addr);
      if (rating) setText('shopHeaderRating', rating + (ratingCount ? ' (' + ratingCount + ' reviews)' : ''));
      setText('dashShopName', name);
      setImg('dashShopLogo', logo);
      setText('dashShopIdShort', 'ID: ' + String(shopId).slice(-6).toUpperCase());
      setText('sidebarShopName', name);
      setText('sidebarShopId', 'ID: ' + String(shopId).slice(-6).toUpperCase());
      setText('sidebarCurrentShop', name);
      setText('footerShopId', 'Shop ID: ' + String(shopId).slice(-8).toUpperCase());
      var badges = ['shopHeaderStatus', 'userHeaderStatus', 'shopStatusBadgeHeader'];
      for (var i = 0; i < badges.length; i++) {
        var el = document.getElementById(badges[i]);
        if (el) { el.textContent = isOpen ? '● Open' : '● Closed'; el.classList.remove('open', 'closed'); el.classList.add(isOpen ? 'open' : 'closed'); }
      }
      var badge2 = document.getElementById('shopStatusBadge');
      if (badge2) {
        badge2.classList.remove('open', 'closed');
        badge2.classList.add(isOpen ? 'open' : 'closed');
        var t = document.getElementById('shopStatusText');
        if (t) t.textContent = isOpen ? 'Open' : 'Closed';
        var time2 = document.getElementById('shopStatusTime');
        if (time2) time2.textContent = timing;
      }
      window.__SAMAN_SHOP_PROFILE = shop;
      document.dispatchEvent(new CustomEvent('saman:shop-loaded', { detail: shop }));
      return shop;
    } catch (e) { return null; }
  }

  // NAV FIX - Code 4 ab isi me hai
  function fixNav() {
    var shopId = getShopId();
    var q = '?shopId=' + encodeURIComponent(shopId);
    var nav = document.getElementById('bottomNav');
    if (nav) {
      var map = {
        home: '../achar-shop/customer-view.html' + q,
        search: '../achar-shop/customer-view.html' + q + '#search',
        categories: '../achar-shop/customer-view.html' + q + '#categories',
        cart: '../common/cart/cart.html' + q,
        profile: '../common/profile/profile.html' + q + '&role=customer'
      };
      Object.keys(map).forEach(function (key) {
        var el = nav.querySelector('[data-nav="' + key + '"]');
        if (el) { el.setAttribute('href', map[key]); el.setAttribute('data-nav-url', map[key]); }
      });
    }
    var sidebar = document.getElementById('sidebar');
    if (sidebar) {
      var smap = {
        dashboard: '../achar-shop/dashboard.html' + q,
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
      sidebar.querySelectorAll('[data-link]').forEach(function (el) {
        var key = (el.getAttribute('data-link') || '').toLowerCase();
        if (smap[key]) { el.setAttribute('href', smap[key]); el.setAttribute('data-nav-url', smap[key]); }
      });
      sidebar.querySelectorAll('a').forEach(function (el) {
        var txt = (el.textContent || '').toLowerCase();
        if (txt.indexOf('dashboard') > -1) el.setAttribute('href', smap.dashboard);
        else if (txt.indexOf('order') > -1) el.setAttribute('href', smap.orders);
        else if (txt.indexOf('product') > -1) el.setAttribute('href', smap.products);
        else if (txt.indexOf('wallet') > -1) el.setAttribute('href', smap.wallet);
        else if (txt.indexOf('setting') > -1) el.setAttribute('href', smap.settings);
        else if (txt.indexOf('profile') > -1) el.setAttribute('href', smap.profile);
      });
    }
    var footers = document.querySelectorAll('#dashboardFooter, #userFooter, .dashboard-footer, .user-footer');
    footers.forEach(function (ft) {
      ft.querySelectorAll('a').forEach(function (el) {
        var href = el.getAttribute('href') || '#';
        if (href !== '#' && href !== '') return;
        var txt = (el.textContent || '').toLowerCase();
        var url = '';
        if (txt.indexOf('order') > -1) url = '../common/orders/orders.html' + q;
        else if (txt.indexOf('about') > -1) url = '../common/pages/about.html' + q;
        else if (txt.indexOf('contact') > -1) url = '../common/pages/contact.html' + q;
        else if (txt.indexOf('privacy') > -1) url = '../common/pages/privacy-policy.html' + q;
        else if (txt.indexOf('terms') > -1) url = '../common/pages/terms.html' + q;
        else if (txt.indexOf('return') > -1) url = '../common/pages/return-policy.html' + q;
        if (url) el.setAttribute('href', url);
      });
    });
  }

  // UI FIX - Code 5 ab isi me hai - Toast / Loader / Confirm / Empty / Skeleton ek hi jagah
  function showToast(msg, type, duration) {
    msg = String(msg || '');
    if (!msg) return;
    toastQueue.push({ msg: msg, type: type || 'success', duration: duration || 2500 });
    runToastQueue();
  }

  function runToastQueue() {
    if (toastBusy) return;
    var item = toastQueue.shift();
    if (!item) return;
    toastBusy = true;
    try {
      if (window.Toast && window.Toast.__SAMAN_ORIG_SHOW__) {
        window.__SAMAN_TOAST_FROM_QUEUE__ = true;
        window.Toast.__SAMAN_ORIG_SHOW__(item.msg, item.type, item.duration);
        window.__SAMAN_TOAST_FROM_QUEUE__ = false;
      } else if (window.Toast && window.Toast.show) {
        window.Toast.show(item.msg, item.type, item.duration);
      }
    } catch (e) { window.__SAMAN_TOAST_FROM_QUEUE__ = false; }
    setTimeout(function () { toastBusy = false; runToastQueue(); }, item.duration + 200);
  }

  function loaderShow(show, text) {
    try {
      if (show) {
        loaderCount++;
        if (window.Loader && window.Loader.show) window.Loader.show(text || 'Loading...');
        else { var el = document.getElementById('globalLoader'); if (el) el.style.display = 'grid'; }
        if (loaderTimer) clearTimeout(loaderTimer);
        loaderTimer = setTimeout(function () { loaderCount = 0; loaderHide(true); }, 15000);
      } else {
        if (loaderCount > 0) loaderCount--;
        if (loaderCount <= 0) loaderHide(true);
      }
    } catch (e) {}
  }

  function loaderHide(force) {
    try {
      if (!force && loaderCount > 0) return;
      loaderCount = 0;
      if (loaderTimer) { clearTimeout(loaderTimer); loaderTimer = null; }
      if (window.Loader && window.Loader.hide) window.Loader.hide();
      else { var el = document.getElementById('globalLoader'); if (el) el.style.display = 'none'; }
      document.body.style.overflow = '';
    } catch (e) {}
  }

  function confirmBox(options) {
    if (typeof options === 'string') options = { message: options };
    options = options || {};
    return new Promise(function (resolve) {
      var done = false;
      function finish(v) { if (done) return; done = true; resolve(v); }
      try {
        if (window.ConfirmModal && window.ConfirmModal.show) {
          window.ConfirmModal.show({
            title: options.title || 'Pakka?', message: options.message || 'Ye kaam kar du?',
            confirmText: options.confirmText || 'Haan', cancelText: options.cancelText || 'Nahi',
            onConfirm: function () { finish(true); }, onCancel: function () { finish(false); }
          });
          setTimeout(function () { finish(false); }, 30000);
          return;
        }
      } catch (e) {}
      finish(window.confirm(options.message || 'Pakka?'));
    });
  }

  function patchOldToastLoader() {
    try {
      if (window.Toast && window.Toast.show && !window.Toast.__SAMAN_PATCHED__) {
        window.Toast.__SAMAN_PATCHED__ = true;
        var oldShow = window.Toast.show.bind(window.Toast);
        window.Toast.__SAMAN_ORIG_SHOW__ = oldShow;
        window.Toast.show = function (msg, type, duration) {
          if (window.__SAMAN_TOAST_FROM_QUEUE__) { oldShow(msg, type, duration); return; }
          showToast(msg, type, duration);
        };
      }
    } catch (e) {}
    try {
      if (window.Loader && window.Loader.show && !window.Loader.__SAMAN_PATCHED__) {
        window.Loader.__SAMAN_PATCHED__ = true;
        window.Loader.show = function (text) { loaderShow(true, text); };
        window.Loader.hide = function () { loaderHide(true); };
      }
    } catch (e) {}
  }

  // MEDIA FIX - Code 6 ab isi me hai - Zoom / QuickView / Language / Status
  function openZoom(images, index, title) {
    if (typeof images === 'string') images = [images];
    images = images || [];
    index = index || 0;
    var qv = document.getElementById('quickViewModal');
    if (qv) qv.style.display = 'none';
    try {
      if (window.ImageZoom && window.ImageZoom.open) { window.ImageZoom.open(images, index, title || 'Product Image'); return; }
      if (window.ImageZoom && typeof window.ImageZoom === 'function') {
        if (!window.__SAMAN_ZOOM_INST__) window.__SAMAN_ZOOM_INST__ = new window.ImageZoom();
        window.__SAMAN_ZOOM_INST__.open(images, index, title || 'Product Image');
        return;
      }
    } catch (e) {}
    if (images[index]) window.open(images[index], '_blank');
  }

  function openQuickView(productId) {
    var zm = document.getElementById('imgZoomModal');
    if (zm) zm.style.display = 'none';
    try {
      if (window.ProductQuickView && window.ProductQuickView.open) { window.ProductQuickView.open(productId); return; }
    } catch (e) {}
    window.location.href = '../common/products/product-detail.html?shopId=' + encodeURIComponent(getShopId()) + '&productId=' + encodeURIComponent(productId);
  }

  function setLang(lang) {
    lang = lang || 'en';
    currentLang = lang;
    window.__SAMAN_LANG__ = lang;
    var label = document.getElementById('currentLangLabel');
    if (label) label.textContent = lang === 'en' ? 'EN' : lang === 'hi' ? 'हि' : 'गु';
    document.querySelectorAll('.lang-option').forEach(function (opt) {
      opt.classList.toggle('active', opt.getAttribute('data-lang') === lang);
    });
    var drop = document.getElementById('langDropdown');
    if (drop) drop.style.display = 'none';
    document.dispatchEvent(new CustomEvent('saman:lang-changed', { detail: { lang: lang } }));
  }

  async function checkStatus() {
    var shopId = getShopId();
    if (!shopId) return null;
    try {
      var res = await fetch(getApiBase() + '/api/common/profile/me?role=shop_owner&shopId=' + encodeURIComponent(shopId), { headers: getHeaders(), credentials: 'include', cache: 'no-store' });
      var data = await res.json().catch(function () { return {}; });
      var shop = data.shop || data.profile || data.data || data || {};
      if (shop.shop) shop = shop.shop;
      var isOpen = shop.isOpen;
      if (isOpen === undefined) isOpen = shop.status !== 'closed';
      if (lastStatus !== null && lastStatus !== isOpen) loadShop();
      lastStatus = isOpen;
      return isOpen;
    } catch (e) { return null; }
  }

  function bindClicks() {
    document.addEventListener('click', function (e) {
      var langOpt = e.target.closest ? e.target.closest('.lang-option') : null;
      if (langOpt) { e.preventDefault(); setLang(langOpt.getAttribute('data-lang') || 'en'); return; }
      if (e.target.closest && e.target.closest('#langToggleBtn')) {
        e.preventDefault();
        var drop = document.getElementById('langDropdown');
        if (drop) drop.style.display = drop.style.display === 'block' ? 'none' : 'block';
        return;
      }
      if (e.target.closest && e.target.closest('#closeQuickView')) { e.preventDefault(); var q = document.getElementById('quickViewModal'); if (q) q.style.display = 'none'; document.body.style.overflow = ''; return; }
      if (e.target.closest && e.target.closest('#imgZoomClose')) { e.preventDefault(); var z = document.getElementById('imgZoomModal'); if (z) z.style.display = 'none'; document.body.style.overflow = ''; return; }
      if (e.target.closest && e.target.closest('#closeStatusDetail')) { e.preventDefault(); var d = document.getElementById('shopStatusDetail'); if (d) d.style.display = 'none'; return; }
      if (e.target.closest && e.target.closest('#shopStatusBadge')) {
        e.preventDefault();
        var d2 = document.getElementById('shopStatusDetail');
        if (d2) d2.style.display = d2.style.display === 'block' ? 'none' : 'block';
        return;
      }
      var openBtn = e.target.closest ? e.target.closest('#dashSidebarToggle') : null;
      if (openBtn) { e.preventDefault(); var sb = document.getElementById('sidebar'); var ov = document.getElementById('sidebarOverlay'); if (sb) sb.classList.add('open'); if (ov) ov.style.display = 'block'; return; }
      var closeBtn = e.target.closest ? e.target.closest('#closeSidebar') : null;
      if (closeBtn) { e.preventDefault(); var sb2 = document.getElementById('sidebar'); var ov2 = document.getElementById('sidebarOverlay'); if (sb2) sb2.classList.remove('open'); if (ov2) ov2.style.display = 'none'; return; }
      var overlay = e.target.closest ? e.target.closest('#sidebarOverlay') : null;
      if (overlay) { var sb3 = document.getElementById('sidebar'); if (sb3) sb3.classList.remove('open'); overlay.style.display = 'none'; return; }
      var openCart = e.target.closest ? e.target.closest('[data-open-cart]') : null;
      if (openCart && openCart.getAttribute('data-nav') !== 'cart') { e.preventDefault(); window.location.href = '../common/cart/cart.html?shopId=' + encodeURIComponent(getShopId()); return; }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var zm = document.getElementById('imgZoomModal'); if (zm) zm.style.display = 'none';
        var qv = document.getElementById('quickViewModal'); if (qv) qv.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
  }

  function pickList() {
    var isDashboard = window.location.pathname.indexOf('dashboard') > -1 || document.body.getAttribute('data-page') === 'dashboard';
    var list = ['toast', 'loader', 'confirm-modal', 'empty-state', 'skeleton-loader', 'language-switcher'];
    if (isDashboard) { list.push('dashboard-header'); list.push('sidebar'); list.push('dashboard-footer'); }
    else { list.push('user-header'); list.push('bottom-nav'); list.push('user-footer'); list.push('shop-header'); list.push('shop-status-badge'); list.push('product-quick-view'); list.push('image-zoom'); }
    return list;
  }

  async function init() {
    bindClicks();
    var hasOwnHeader = !!document.querySelector('header[data-own-header="1"]');
    var list = pickList();
    if (hasOwnHeader) list = list.filter(function (n) { return n !== 'user-header' && n !== 'shop-header' && n !== 'dashboard-header'; });
    for (var i = 0; i < list.length; i++) { try { await loadOne(list[i]); } catch (e) {} }
    try { await loadOneJs('product-card'); } catch (e) {}
    window.__SAMAN_COMPONENTS_READY__ = true;
    document.dispatchEvent(new CustomEvent('saman:components-ready', { detail: { shopId: getShopId() } }));
    patchOldToastLoader();
    fixNav();
    loadShop();
    if (!statusTimer) { checkStatus(); statusTimer = setInterval(function () { checkStatus(); }, 60000); }
    if (window.ProductCard) {
      window.ProductCard.openImageZoom = openZoom;
      window.ProductCard.openQuickView = openQuickView;
    }
    window.SamanComponents = {
      load: loadOne, loadJs: loadOneJs,
      toast: showToast, loader: loaderShow, confirm: confirmBox,
      zoom: openZoom, quickView: openQuickView,
      setLang: setLang, getLang: function () { return currentLang; },
      checkStatus: checkStatus, loadShop: loadShop, fixNav: fixNav,
      ready: function () { return !!window.__SAMAN_COMPONENTS_READY__; }
    };
    window.SamanUI = { toast: showToast, loader: loaderShow, confirm: confirmBox };
    window.SamanMedia = { zoom: openZoom, quickView: openQuickView, setLang: setLang, checkStatus: checkStatus };
    window.SamanHeaderFix = { load: loadShop };
    window.SamanNavFix = { fix: fixNav };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();