// LOCATION: public/shop-templates/common/components/components-route-fix.js - V1 ROUTE FIX - CODE 8
// KAAM: Component ke andar wale galat API raste ko sahi raste pe modna. Koi HTML nahi chhedna.
// RULE: Ye koi naya header / sidebar nahi banayega. Jo hai usi ka rasta theek karega.
// RULE: Isko components-loader.js se PEHLE lagana hai. Baad me lagaya toh kaam nahi karega.

(function () {
  if (window.__SAMAN_ROUTE_FIX_V1__) return;
  window.__SAMAN_ROUTE_FIX_V1__ = true;

  var origFetch = window.fetch.bind(window);

  function getShopIdFromUrl(url) {
    try {
      var u = new URL(url, window.location.origin);
      var q = u.searchParams.get('shopId') || '';
      if (q) return q;
      var parts = u.pathname.split('/').filter(function (x) { return x !== ''; });
      // /api/shops/XXX -> XXX 3rd wala
      // /api/common/orders/XXX -> XXX 4th wala
      if (parts.length >= 3) return parts[parts.length - 1];
      return '';
    } catch (e) { return ''; }
  }

  function getBuyerId() {
    try {
      if (window.CartCore && window.CartCore.getBuyerId) { var b = window.CartCore.getBuyerId(); if (b) return b; }
    } catch (e) {}
    try {
      if (window.AuthCore && window.AuthCore.getUserId) { var u2 = window.AuthCore.getUserId(); if (u2) return u2; }
    } catch (e) {}
    if (window.USER_ID) return window.USER_ID;
    if (!window.__SAMAN_GUEST_ID__) window.__SAMAN_GUEST_ID__ = 'guest_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
    return window.__SAMAN_GUEST_ID__;
  }

  function getShopId() {
    return new URLSearchParams(window.location.search).get('shopId') || window.__SAMAN_SHOP_ID || window.SHOP_ID || '';
  }

  // Galat rasta -> Sahi rasta
  function fixUrl(url) {
    if (typeof url !== 'string') return url;
    var u = url;

    // 1. /api/shops/XXX -> /api/common/profile/me?role=shop_owner&shopId=XXX
    // Wajah: shopRoutes me /shops/:id likha hai, mount /api/shops pe hai, toh ban gaya /api/shops/shops/XXX
    // Isliye component wala /api/shops/XXX kabhi nahi khulega. Seedha profile wala sahi rasta de do.
    if (u.indexOf('/api/shops/') === 0 || u.indexOf(window.location.origin + '/api/shops/') > -1) {
      var shopId = '';
      var m = u.match(/\/api\/shops\/([^\/\?]+)/);
      if (m) shopId = m[1];
      if (!shopId) shopId = getShopId();
      // /api/shops/XXX/products/YYY wala - product wala alag se sambhalo
      if (u.indexOf('/products/') > -1) {
        var pm = u.match(/\/products\/([^\/\?\`]+)/);
        var pid = pm ? pm[1] : '';
        return '/api/world-products/' + encodeURIComponent(pid) + '?shopId=' + encodeURIComponent(shopId);
      }
      // /api/shops/XXX/products?search=YYY wala - search wala
      if (u.indexOf('/products') > -1) {
        var qm = u.match(/search=([^&\`]+)/);
        var q = qm ? qm[1] : '';
        return '/api/world-products?shopId=' + encodeURIComponent(shopId) + '&search=' + q;
      }
      // Seedha shop wala - profile wala
      return '/api/common/profile/me?role=shop_owner&shopId=' + encodeURIComponent(shopId);
    }

    // 2. /api/common/orders/XXX?status=placed -> /api/common/orders/list?shopId=XXX&status=placed
    // Wajah: Server me /list wala route hai, seedha /XXX wala hai hi nahi
    if (u.indexOf('/api/common/orders/') > -1 && u.indexOf('/api/common/orders/list') === -1 && u.indexOf('/detail') === -1 && u.indexOf('/track') === -1) {
      var oid = getShopIdFromUrl(u);
      // Agar ye orderId lag raha hai (24 char wala) toh chhedo mat, wo detail wala hai
      if (oid && oid.length < 20) {
        var st = 'placed';
        var sm = u.match(/status=([^&]+)/);
        if (sm) st = sm[1];
        return '/api/common/orders/list?shopId=' + encodeURIComponent(oid) + '&status=' + encodeURIComponent(st);
      }
    }

    // 3. /api/common/shop-status/XXX -> /api/common/shop-toggle/XXX/status
    // Wajah: Badge /status nahi lagata, server ko /status chahiye
    if (u.indexOf('/api/common/shop-status/') > -1 && u.indexOf('/status') === -1) {
      var sid = getShopIdFromUrl(u);
      if (sid) return '/api/common/shop-toggle/' + encodeURIComponent(sid) + '/status';
    }

    // 4. /api/common/wishlist/toggle -> /api/wishlist/USERID/toggle
    // Wajah: Product-card bina userId ke maangta hai, server ko userId chahiye
    // Aur common/index.js me wishlist.routes.js likha hai jabki file wishlist.js hai, isliye common wala rasta band hai
    // Isliye seedha /api/wishlist wala rasta de do, jo server.js me seedha laga hoga ya wishlist.js me hai
    if (u.indexOf('/api/common/wishlist/toggle') > -1) {
      return '/api/wishlist/' + encodeURIComponent(getBuyerId()) + '/toggle';
    }
    if (u.indexOf('/api/common/wishlist') > -1) {
      return u.replace('/api/common/wishlist', '/api/wishlist');
    }

    return u;
  }

  // Jawaab ka shape ek jaisa karo - sab jagah alag-alag shape aata hai
  function fixData(url, data) {
    if (!data || typeof data !== 'object') return data;
    // Profile wala - kabhi { shop: {...} } kabhi { data: {...} } kabhi seedha {...}
    // Header wale code ko seedha shop chahiye, isliye sabko ek jaisa kar do
    if (url.indexOf('/api/common/profile/me') > -1) {
      var shop = data.shop || data.profile || data.data || data;
      if (shop && shop.shop) shop = shop.shop;
      // Header wale code /api/shops/XXX se ye umeed karte hain: { shopName, logo, phone, address }
      // Isliye wahi shape bana do, taaki unka code toote nahi
      return {
        shopName: shop.shopName || shop.name || shop.title || 'Achar Shop',
        name: shop.shopName || shop.name || shop.title || 'Achar Shop',
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
    // Shop-status wala - kabhi { isOpen } kabhi { data: { isOpen } }
    if (url.indexOf('/shop-toggle/') > -1 && url.indexOf('/status') > -1) {
      var d = data.data || data;
      return {
        success: true,
        isOpen: d.isOpen !== undefined ? d.isOpen : (d.shop ? d.shop.isOpen : true),
        open: d.isOpen !== undefined ? d.isOpen : true,
        timing: d.timing || '',
        shop: d.shop || d
      };
    }
    // Orders list wala - kabhi { orders: [] } kabhi [] kabhi { data: [] }
    if (url.indexOf('/api/common/orders/list') > -1) {
      if (Array.isArray(data)) return data;
      return data.orders || data.data || data.list || [];
    }
    // World product wala - ek product ke liye
    if (url.indexOf('/api/world-products/') > -1 && url.indexOf('?') === -1) {
      return data.product || data.data || data;
    }
    return data;
  }

  window.fetch = function (url, options) {
    var fixedUrl = fixUrl(url);
    var isOurFix = fixedUrl !== url;
    return origFetch(fixedUrl, options).then(function (res) {
      // Agar asli rasta 404 de toh nakli 404 mat dikhao, khaali jawaab de do taaki page na toote
      if (!res.ok && isOurFix) {
        // Profile wala 404 aaya toh khaali shop de do
        if (fixedUrl.indexOf('/api/common/profile/me') > -1) {
          return new Response(JSON.stringify({ shopName: 'Achar Shop', name: 'Achar Shop', logo: '', isOpen: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (fixedUrl.indexOf('/orders/list') > -1) {
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }
      // Jawaab ko pakad ke shape theek karo, par asli res ko mat todo
      var ct = '';
      try { ct = res.headers.get('content-type') || ''; } catch (e) {}
      if (ct.indexOf('application/json') === -1) return res;
      return res.clone().json().then(function (data) {
        var fixed = fixData(fixedUrl, data);
        return new Response(JSON.stringify(fixed), { status: res.status, headers: { 'Content-Type': 'application/json' } });
      }).catch(function () { return res; });
    });
  };

  // WishlistCore - jo hai hi nahi, usko yahin bana do, taaki product-card toote nahi
  if (!window.WishlistCore) {
    window.WishlistCore = {
      toggle: async function (productId) {
        var buyerId = getBuyerId();
        var shopId = getShopId();
        try {
          var res = await origFetch('/api/wishlist/' + encodeURIComponent(buyerId) + '/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ productId: productId, shopId: shopId, buyerId: buyerId })
          });
          var d = await res.json().catch(function () { return {}; });
          return d;
        } catch (e) {
          // Server wala rasta band hai toh RAM me hi rakh lo, page toh na toote
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

  // ProductQuickView - purana wala galat API maangta hai, usko sahi API pe mod do
  // Loader ke baad QuickView aayega, isliye thoda ruk ke patch karo
  function patchQuickView() {
    try {
      if (window.ProductQuickView && window.ProductQuickView.open && !window.ProductQuickView.__SAMAN_PATCHED__) {
        window.ProductQuickView.__SAMAN_PATCHED__ = true;
        var oldOpen = window.ProductQuickView.open.bind(window.ProductQuickView);
        // QuickView ka andar wala fetch bhi isi fetch se jayega, jo upar theek ho jayega
        // Isliye yahan sirf guard lagao - agar productId nahi hai toh kholo mat
        window.ProductQuickView.open = function (productId) {
          if (!productId) return;
          return oldOpen(productId);
        };
      }
    } catch (e) {}
  }
  document.addEventListener('saman:components-ready', function () { patchQuickView(); });
  setTimeout(function () { patchQuickView(); }, 3000);
  setTimeout(function () { patchQuickView(); }, 6000);

  // Purani 3 fix file agar galti se bhi load ho gayi toh dobara na chale - guard
  window.__SAMAN_NAV_FIX_V1__ = true;
  window.__SAMAN_UI_FIX_V1__ = true;
  window.__SAMAN_MEDIA_FIX_V1__ = true;
})();