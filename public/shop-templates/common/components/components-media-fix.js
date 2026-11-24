// LOCATION: public/shop-templates/common/components/components-media-fix.js - V1 MEDIA FIX - LAST
// KAAM: Image Zoom + QuickView + Language + Shop Status ko ek hi jagah se chalana.
// RULE: Ye naya zoom / quickview nahi banayega. Jo pehle se hai usi ko chaleyga.
// RULE: Ek hi waqt me 2 modal kabhi nahi khulenge. Ek khula toh dusra band.

(function () {
  if (window.__SAMAN_MEDIA_FIX_V1__) return;
  window.__SAMAN_MEDIA_FIX_V1__ = true;

  function getShopId() {
    return new URLSearchParams(window.location.search).get('shopId') || window.__SAMAN_SHOP_ID || '';
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

  function closeAllModals(exceptId) {
    var ids = ['imgZoomModal', 'quickViewModal', 'shopStatusDetail', 'confirmModal'];
    for (var i = 0; i < ids.length; i++) {
      if (ids[i] === exceptId) continue;
      var el = document.getElementById(ids[i]);
      if (el) el.style.display = 'none';
    }
    var langDrop = document.getElementById('langDropdown');
    if (langDrop && exceptId !== 'langDropdown') langDrop.style.display = 'none';
  }

  // IMAGE ZOOM - ek hi zoom, dobara khula toh purana band
  function openZoom(images, index, title) {
    closeAllModals('imgZoomModal');
    if (typeof images === 'string') images = [images];
    images = images || [];
    index = index || 0;
    try {
      if (window.ImageZoom && window.ImageZoom.open) { window.ImageZoom.open(images, index, title || 'Product Image'); return; }
      if (window.ImageZoom && typeof window.ImageZoom === 'function') {
        if (!window.__SAMAN_ZOOM_INST__) window.__SAMAN_ZOOM_INST__ = new window.ImageZoom();
        window.__SAMAN_ZOOM_INST__.open(images, index, title || 'Product Image');
        return;
      }
    } catch (e) {}
    // Zoom file abhi aayi nahi toh seedha naya tab me khol do, atko mat
    if (images[index]) window.open(images[index], '_blank');
  }

  function closeZoom() {
    try {
      if (window.ImageZoom && window.ImageZoom.close) { window.ImageZoom.close(); return; }
      if (window.__SAMAN_ZOOM_INST__ && window.__SAMAN_ZOOM_INST__.close) { window.__SAMAN_ZOOM_INST__.close(); return; }
    } catch (e) {}
    var el = document.getElementById('imgZoomModal');
    if (el) el.style.display = 'none';
    document.body.style.overflow = '';
  }

  // QUICK VIEW - product ka data DOM se lo, dobara API mat maaro jab tak zaroori na ho
  async function openQuickView(productId) {
    closeAllModals('quickViewModal');
    try {
      if (window.ProductQuickView && window.ProductQuickView.open) { window.ProductQuickView.open(productId); return; }
    } catch (e) {}
    // QuickView file abhi aayi nahi toh product page pe bhej do
    try {
      var card = document.querySelector('[data-product-id="' + productId + '"]');
      if (card) {
        var nameEl = card.querySelector('.product-name');
        var imgEl = card.querySelector('.product-image');
        var priceEl = card.querySelector('.product-price');
        var modal = document.getElementById('quickViewModal');
        if (modal) {
          modal.style.display = 'grid';
          document.body.style.overflow = 'hidden';
          var qvName = document.getElementById('qvName');
          if (qvName && nameEl) qvName.textContent = nameEl.textContent;
          var qvImg = document.getElementById('qvMainImg');
          if (qvImg && imgEl) qvImg.src = imgEl.getAttribute('src') || '';
          var qvPrice = document.getElementById('qvPrice');
          if (qvPrice && priceEl) qvPrice.textContent = priceEl.textContent;
          var addBtn = document.getElementById('qvAddToCart');
          if (addBtn) addBtn.setAttribute('data-add', productId);
          return;
        }
      }
    } catch (e) {}
    window.location.href = '../common/products/product-detail.html?shopId=' + encodeURIComponent(getShopId()) + '&productId=' + encodeURIComponent(productId);
  }

  function closeQuickView() {
    try {
      if (window.ProductQuickView && window.ProductQuickView.close) { window.ProductQuickView.close(); return; }
    } catch (e) {}
    var el = document.getElementById('quickViewModal');
    if (el) el.style.display = 'none';
    document.body.style.overflow = '';
  }

  // LANGUAGE - purana wala sirf 6 shabd badalta tha, ab poora page ke laayak banao
  var LANG_WORDS = {
    en: { search: 'Search products...', addToCart: 'Add to Cart', buyNow: 'Buy Now', cart: 'Cart', orders: 'Orders', profile: 'Profile', home: 'Home', categories: 'Categories', wishlist: 'Wishlist' },
    hi: { search: 'Product dhoondho...', addToCart: 'Cart me daalo', buyNow: 'Abhi khareedo', cart: 'Cart', orders: 'Order', profile: 'Profile', home: 'Home', categories: 'Category', wishlist: 'Wishlist' },
    gu: { search: 'Product shodho...', addToCart: 'Cart ma nakho', buyNow: 'Hamnaj kharido', cart: 'Cart', orders: 'Order', profile: 'Profile', home: 'Home', categories: 'Category', wishlist: 'Wishlist' }
  };

  var CURRENT_LANG = 'en';

  function setLang(lang) {
    lang = lang || 'en';
    if (!LANG_WORDS[lang]) lang = 'en';
    CURRENT_LANG = lang;
    window.__SAMAN_LANG__ = lang;
    try {
      // Purani LanguageSwitcher ko bhi bata do
      if (window.LanguageSwitcher) {
        var ls = window.LanguageSwitcher;
        if (typeof ls === 'function') {
          if (!window.__SAMAN_LANG_INST__) window.__SAMAN_LANG_INST__ = new ls();
          if (window.__SAMAN_LANG_INST__.setLanguage) window.__SAMAN_LANG_INST__.setLanguage(lang);
        } else if (ls.setLanguage) ls.setLanguage(lang);
        else if (ls.setLang) ls.setLang(lang);
      }
    } catch (e) {}
    // Button pe label badlo
    var label = document.getElementById('currentLangLabel');
    if (label) label.textContent = lang === 'en' ? 'EN' : lang === 'hi' ? 'हि' : 'ગુ';
    // Option me active badlo
    document.querySelectorAll('.lang-option').forEach(function (opt) {
      opt.classList.toggle('active', opt.getAttribute('data-lang') === lang);
    });
    // Search wali jagah ka placeholder badlo - poora page nahi, sirf jo dikhta hai
    var w = LANG_WORDS[lang];
    document.querySelectorAll('input[placeholder*="Search"], input[placeholder*="search"], input[placeholder*="dhoondho"], input[placeholder*="shodho"]').forEach(function (inp) {
      inp.placeholder = w.search;
    });
    document.querySelectorAll('[data-add]').forEach(function (btn) {
      var txt = btn.querySelector('.add-text');
      if (txt) txt.textContent = w.addToCart;
    });
    // Dropdown band karo
    var drop = document.getElementById('langDropdown');
    if (drop) drop.style.display = 'none';
    document.dispatchEvent(new CustomEvent('saman:lang-changed', { detail: { lang: lang } }));
  }

  function toggleLangDrop() {
    var drop = document.getElementById('langDropdown');
    if (!drop) return;
    var isOpen = drop.style.display === 'block';
    closeAllModals('langDropdown');
    drop.style.display = isOpen ? 'none' : 'block';
  }

  // SHOP STATUS - har 60 sec me check, par ek hi timer se
  var statusTimer = null;
  var lastStatus = null;

  async function checkStatus() {
    var shopId = getShopId();
    if (!shopId) return null;
    try {
      var res = await fetch(getApiBase() + '/api/common/profile/me?role=shop_owner&shopId=' + encodeURIComponent(shopId), { headers: getHeaders(), credentials: 'include', cache: 'no-store' });
      var data = await res.json().catch(function () { return {}; });
      var shop = data.shop || data.profile || data.data || data || {};
      if (shop.shop) shop = shop.shop;
      var isOpen = shop.isOpen;
      if (isOpen === undefined) isOpen = shop.status !== 'closed' && shop.shopStatus !== 'closed';
      if (lastStatus !== null && lastStatus !== isOpen) {
        // Status badla toh header ko bata do
        if (window.SamanHeaderFix && window.SamanHeaderFix.load) window.SamanHeaderFix.load();
        else document.dispatchEvent(new CustomEvent('saman:shop-status-changed', { detail: { isOpen: isOpen, shopId: shopId } }));
      }
      lastStatus = isOpen;
      // Badge wali jagah bhi yahin se bharo
      var badge = document.getElementById('shopStatusBadge');
      if (badge) {
        badge.classList.remove('open', 'closed');
        badge.classList.add(isOpen ? 'open' : 'closed');
        var t = document.getElementById('shopStatusText');
        if (t) t.textContent = isOpen ? 'Open' : 'Closed';
      }
      return isOpen;
    } catch (e) {
      return null;
    }
  }

  function startStatusTimer() {
    if (statusTimer) return;
    checkStatus();
    statusTimer = setInterval(function () { checkStatus(); }, 60000);
  }

  function bindClicks() {
    document.addEventListener('click', function (e) {
      // Zoom wali image dabayi
      var zoomImg = e.target.closest ? e.target.closest('[data-zoom-img]') : null;
      if (zoomImg && !e.target.closest('[data-product-id]')) {
        // Card wali image ka kaam ProductCard pehle se sambhal raha hai, isko dobara mat chalao
        return;
      }
      // Zoom band karo
      if (e.target.closest && e.target.closest('#imgZoomClose')) { e.preventDefault(); closeZoom(); return; }
      if (e.target.closest && e.target.closest('#imgZoomNext')) {
        e.preventDefault();
        try { if (window.ImageZoom && window.ImageZoom.next) window.ImageZoom.next(); else if (window.__SAMAN_ZOOM_INST__ && window.__SAMAN_ZOOM_INST__.next) window.__SAMAN_ZOOM_INST__.next(); } catch (err) {}
        return;
      }
      if (e.target.closest && e.target.closest('#imgZoomPrev')) {
        e.preventDefault();
        try { if (window.ImageZoom && window.ImageZoom.prev) window.ImageZoom.prev(); else if (window.__SAMAN_ZOOM_INST__ && window.__SAMAN_ZOOM_INST__.prev) window.__SAMAN_ZOOM_INST__.prev(); } catch (err) {}
        return;
      }
      // QuickView band karo
      if (e.target.closest && e.target.closest('#closeQuickView')) { e.preventDefault(); closeQuickView(); return; }
      var qvBack = e.target.closest ? e.target.closest('.quick-view-backdrop') : null;
      if (qvBack) { closeQuickView(); return; }
      var zoomBack = e.target.closest ? e.target.closest('.img-zoom-backdrop') : null;
      if (zoomBack) { closeZoom(); return; }
      // Language kholo / band karo
      if (e.target.closest && e.target.closest('#langToggleBtn')) { e.preventDefault(); toggleLangDrop(); return; }
      var langOpt = e.target.closest ? e.target.closest('.lang-option') : null;
      if (langOpt) {
        e.preventDefault();
        setLang(langOpt.getAttribute('data-lang') || 'en');
        return;
      }
      // Status detail kholo / band karo
      if (e.target.closest && e.target.closest('#shopStatusBadge')) {
        e.preventDefault();
        var d = document.getElementById('shopStatusDetail');
        if (d) d.style.display = d.style.display === 'block' ? 'none' : 'block';
        return;
      }
      if (e.target.closest && e.target.closest('#closeStatusDetail')) {
        e.preventDefault();
        var d2 = document.getElementById('shopStatusDetail');
        if (d2) d2.style.display = 'none';
        return;
      }
      // Qty wale button - QuickView ke andar
      if (e.target.closest && e.target.closest('#qvPlus')) {
        e.preventDefault();
        var q = document.getElementById('qvQty');
        if (q) q.textContent = String(Number(q.textContent || 1) + 1);
        return;
      }
      if (e.target.closest && e.target.closest('#qvMinus')) {
        e.preventDefault();
        var q2 = document.getElementById('qvQty');
        if (q2) { var v = Number(q2.textContent || 1) - 1; if (v < 1) v = 1; q2.textContent = String(v); }
        return;
      }
    });

    // ESC dabao toh sab modal band
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllModals('');
    });
  }

  function init() {
    bindClicks();
    startStatusTimer();
    // Language pehle wali hi rakho, nayi mat banao
    window.SamanMedia = {
      zoom: openZoom,
      closeZoom: closeZoom,
      quickView: openQuickView,
      closeQuickView: closeQuickView,
      setLang: setLang,
      getLang: function () { return CURRENT_LANG; },
      checkStatus: checkStatus
    };
    // ProductCard se bhi isi ko jod do, taaki 2 zoom na khule
    if (window.ProductCard) {
      window.ProductCard.openImageZoom = openZoom;
      window.ProductCard.openQuickView = openQuickView;
    }
    if (window.SamanComponents) {
      window.SamanComponents.zoom = openZoom;
      window.SamanComponents.quickView = openQuickView;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();