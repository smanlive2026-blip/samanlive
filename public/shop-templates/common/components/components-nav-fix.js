// LOCATION: public/shop-templates/common/components/components-nav-fix.js - V1 NAV FIX
// KAAM: Bottom Nav + Sidebar + Footer ke galat / mare hue link ko sahi page pe bhejna.
// RULE: Ye koi naya nav nahi banayega. Jo nav pehle se hai usi ke link sahi karega.
// RULE: Har link me shopId sath jayega. Bina shopId ke page khali khulega.

(function () {
  if (window.__SAMAN_NAV_FIX_V1__) return;
  window.__SAMAN_NAV_FIX_V1__ = true;

  function getShopId() {
    return new URLSearchParams(window.location.search).get('shopId') || window.__SAMAN_SHOP_ID || '';
  }

  function getBuyerId() {
    if (window.__SAMAN_GUEST_ID) return window.__SAMAN_GUEST_ID;
    if (window.CartCore && window.CartCore.getBuyerId) { try { var b = window.CartCore.getBuyerId(); if (b) return b; } catch (e) {} }
    return 'guest_' + Date.now();
  }

  function setHref(el, url) {
    if (!el) return;
    el.setAttribute('href', url);
    // Kuch link <a> nahi <button> hain, unke liye data bhi rakh do
    el.setAttribute('data-nav-url', url);
  }

  function fixBottomNav() {
    var nav = document.getElementById('bottomNav');
    if (!nav) return;
    var shopId = getShopId();
    var q = '?shopId=' + encodeURIComponent(shopId);
    var map = {
      home: '../achar-shop/customer-view.html' + q,
      search: '../achar-shop/customer-view.html' + q + '#search',
      categories: '../achar-shop/customer-view.html' + q + '#categories',
      cart: '../common/cart/cart.html' + q,
      profile: '../common/profile/profile.html' + q + '&role=customer',
      orders: '../common/customer-orders/my-orders.html' + q + '&buyerId=' + encodeURIComponent(getBuyerId()),
      wishlist: '../common/wishlist/wishlist.html' + q + '&buyerId=' + encodeURIComponent(getBuyerId())
    };
    Object.keys(map).forEach(function (key) {
      var el = nav.querySelector('[data-nav="' + key + '"]');
      if (el) setHref(el, map[key]);
    });
    // Cart wala button alag se - data-open-cart wala
    var cartBtn = nav.querySelector('[data-open-cart]');
    if (cartBtn) setHref(cartBtn, map.cart);
    // Active wala - jo page khula hai usi ko active dikhao
    var path = window.location.pathname || '';
    var activeKey = 'home';
    if (path.indexOf('cart') > -1) activeKey = 'cart';
    else if (path.indexOf('profile') > -1) activeKey = 'profile';
    else if (path.indexOf('my-orders') > -1) activeKey = 'orders';
    nav.querySelectorAll('.nav-item').forEach(function (it) { it.classList.remove('active'); });
    var activeEl = nav.querySelector('[data-nav="' + activeKey + '"]');
    if (activeEl) activeEl.classList.add('active');
  }

  function fixSidebar() {
    var sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    var shopId = getShopId();
    var q = '?shopId=' + encodeURIComponent(shopId);
    var map = {
      dashboard: '../achar-shop/dashboard.html' + q,
      orders: '../common/orders/orders.html' + q,
      products: '../common/inventory/inventory.html' + q,
      inventory: '../common/inventory/inventory.html' + q,
      wallet: '../common/wallet/wallet.html' + q,
      analytics: '../common/analytics/analytics.html' + q,
      marketing: '../common/marketing/coupons.html' + q,
      coupons: '../common/marketing/coupons.html' + q,
      settings: '../common/settings/settings.html' + q,
      profile: '../common/profile/profile.html' + q + '&role=shop_owner',
      notifications: '../common/notifications/notifications.html' + q,
      delivery: '../common/delivery/delivery-boy-assign.html' + q,
      support: '../common/support/help.html' + q,
      live: '../common/live/live-orders.html' + q,
      finance: '../common/finance/profit-loss.html' + q,
      reviews: '../common/reviews/reviews.html' + q
    };
    sidebar.querySelectorAll('[data-link]').forEach(function (el) {
      var key = el.getAttribute('data-link') || '';
      key = key.toLowerCase();
      if (map[key]) setHref(el, map[key]);
    });
    // Sidebar me jo <a href="#"> hain unko bhi text se pakdo
    sidebar.querySelectorAll('a').forEach(function (el) {
      var txt = (el.textContent || '').toLowerCase();
      if (txt.indexOf('dashboard') > -1) setHref(el, map.dashboard);
      else if (txt.indexOf('order') > -1) setHref(el, map.orders);
      else if (txt.indexOf('product') > -1) setHref(el, map.products);
      else if (txt.indexOf('wallet') > -1) setHref(el, map.wallet);
      else if (txt.indexOf('analytics') > -1 || txt.indexOf('report') > -1) setHref(el, map.analytics);
      else if (txt.indexOf('coupon') > -1 || txt.indexOf('marketing') > -1) setHref(el, map.marketing);
      else if (txt.indexOf('setting') > -1) setHref(el, map.settings);
      else if (txt.indexOf('profile') > -1) setHref(el, map.profile);
      else if (txt.indexOf('notif') > -1) setHref(el, map.notifications);
      else if (txt.indexOf('delivery') > -1) setHref(el, map.delivery);
      else if (txt.indexOf('support') > -1 || txt.indexOf('help') > -1) setHref(el, map.support);
      else if (txt.indexOf('review') > -1) setHref(el, map.reviews);
    });
    // Switch Shop wala button - ab marega nahi
    var switchBtn = sidebar.querySelector('.switch-btn');
    if (switchBtn) {
      switchBtn.onclick = function (e) {
        e.preventDefault();
        window.location.href = '/nearby-shops.html?shopId=' + encodeURIComponent(shopId);
      };
    }
  }

  function fixFooters() {
    var shopId = getShopId();
    var q = '?shopId=' + encodeURIComponent(shopId);
    // Dashboard footer + User footer - dono ke # wale link
    var footers = document.querySelectorAll('#dashboardFooter, #userFooter, .dashboard-footer, .user-footer');
    footers.forEach(function (ft) {
      ft.querySelectorAll('a').forEach(function (el) {
        var href = el.getAttribute('href') || '#';
        if (href !== '#' && href !== '') return;
        var txt = (el.textContent || '').toLowerCase();
        var url = '';
        if (txt.indexOf('order') > -1) url = '../common/orders/orders.html' + q;
        else if (txt.indexOf('product') > -1) url = '../common/inventory/inventory.html' + q;
        else if (txt.indexOf('about') > -1) url = '../common/pages/about.html' + q;
        else if (txt.indexOf('contact') > -1) url = '../common/pages/contact.html' + q;
        else if (txt.indexOf('privacy') > -1) url = '../common/pages/privacy-policy.html' + q;
        else if (txt.indexOf('terms') > -1) url = '../common/pages/terms.html' + q;
        else if (txt.indexOf('return') > -1) url = '../common/pages/return-policy.html' + q;
        else if (txt.indexOf('faq') > -1) url = '../common/pages/faq.html' + q;
        else if (txt.indexOf('shop') > -1) url = '../achar-shop/customer-view.html' + q;
        else if (txt.indexOf('home') > -1) url = '../achar-shop/customer-view.html' + q;
        if (url) setHref(el, url);
      });
      // Social wale button - ab # pe nahi atkenge
      ft.querySelectorAll('.social-btn').forEach(function (btn) {
        var title = (btn.getAttribute('title') || '').toLowerCase();
        btn.onclick = function (e) {
          e.preventDefault();
          if (title.indexOf('whatsapp') > -1) window.open('https://wa.me/?text=' + encodeURIComponent('Achar Shop dekho - ' + window.location.origin + '/shop-templates/achar-shop/customer-view.html?shopId=' + shopId), '_blank');
          else if (title.indexOf('instagram') > -1) window.open('https://instagram.com/', '_blank');
          else if (title.indexOf('facebook') > -1) window.open('https://facebook.com/', '_blank');
          else if (title.indexOf('youtube') > -1) window.open('https://youtube.com/', '_blank');
        };
      });
    });
  }

  function bindGlobalClicks() {
    document.addEventListener('click', function (e) {
      // Bottom nav / sidebar ke andar ka click - agar href # hai toh fix wala url use karo
      var link = e.target.closest ? e.target.closest('a[data-nav-url]') : null;
      if (link) {
        var url = link.getAttribute('data-nav-url') || '';
        var href = link.getAttribute('href') || '';
        if (url && (href === '#' || href === '')) {
          e.preventDefault();
          window.location.href = url;
          return;
        }
      }
      // Cart kholo wala - sab jagah ek hi kaam
      var openCart = e.target.closest ? e.target.closest('[data-open-cart]') : null;
      if (openCart) {
        // Agar ye bottom nav ka hai toh uska href pehle se sahi hai, usko rokna nahi
        if (openCart.getAttribute('data-nav') === 'cart') return;
        e.preventDefault();
        window.location.href = '../common/cart/cart.html?shopId=' + encodeURIComponent(getShopId());
        return;
      }
      // Sidebar kholo / band karo
      var openBtn = e.target.closest ? e.target.closest('#dashSidebarToggle') : null;
      if (openBtn) {
        e.preventDefault();
        var sb = document.getElementById('sidebar');
        var ov = document.getElementById('sidebarOverlay');
        if (sb) sb.classList.add('open');
        if (ov) ov.style.display = 'block';
        return;
      }
      var closeBtn = e.target.closest ? e.target.closest('#closeSidebar') : null;
      if (closeBtn) {
        e.preventDefault();
        var sb2 = document.getElementById('sidebar');
        var ov2 = document.getElementById('sidebarOverlay');
        if (sb2) sb2.classList.remove('open');
        if (ov2) ov2.style.display = 'none';
        return;
      }
      var overlay = e.target.closest ? e.target.closest('#sidebarOverlay') : null;
      if (overlay) {
        var sb3 = document.getElementById('sidebar');
        if (sb3) sb3.classList.remove('open');
        overlay.style.display = 'none';
        return;
      }
    });
  }

  function init() {
    bindGlobalClicks();
    if (window.__SAMAN_COMPONENTS_READY__) {
      fixBottomNav(); fixSidebar(); fixFooters();
    } else {
      document.addEventListener('saman:components-ready', function () {
        fixBottomNav(); fixSidebar(); fixFooters();
      });
      setTimeout(function () { fixBottomNav(); fixSidebar(); fixFooters(); }, 2000);
    }
    // Loader ke baad aaye nav ke liye dobara bhi try karo
    setTimeout(function () { fixBottomNav(); fixSidebar(); fixFooters(); }, 4000);
    window.SamanNavFix = { fix: function () { fixBottomNav(); fixSidebar(); fixFooters(); } };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();