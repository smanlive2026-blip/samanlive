// LOCATION: public/shop-templates/common/components/components-loader.js - V1 SAHI WALA
// KAAM: Sirf 1 kaam - 18 HTML tukdon ko page pe lagana, unka andar wala script samet.
// RULE: Ye koi naya logic nahi banayega. Cart / Order / Wallet ka kaam pehle wali common files ka hai.
// RULE: HTML ko innerHTML se nahi dalenge, warna andar wala script marega. Isliye cheer ke dalenge.

(function () {
  if (window.__SAMAN_LOADER_V1__) return;
  window.__SAMAN_LOADER_V1__ = true;

  var loaded = {};
  var loading = {};

  function getBase() {
    var s = document.currentScript;
    if (s && s.src) {
      var idx = s.src.indexOf('/shop-templates/');
      if (idx > -1) return s.src.slice(0, idx) + '/shop-templates/common/components/';
    }
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
    return new URLSearchParams(window.location.search).get('shopId') || window.__SAMAN_SHOP_ID || '';
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
    // 1. Style pehle
    for (var s = 0; s < styles.length; s++) {
      var st = document.createElement('style');
      st.textContent = styles[s].textContent || '';
      st.setAttribute('data-saman-comp-style', '1');
      document.head.appendChild(st);
    }
    // 2. HTML body me
    for (var k = 0; k < nodes.length; k++) {
      mountEl.appendChild(nodes[k]);
    }
    // 3. Script sabse last me, alag se chala ke
    for (var j = 0; j < scripts.length; j++) {
      var old = scripts[j];
      var sc = document.createElement('script');
      var src = old.getAttribute('src');
      if (src) {
        sc.src = src;
        sc.async = false;
      } else {
        sc.textContent = old.textContent || '';
      }
      document.body.appendChild(sc);
    }
  }

  function loadOne(name, mountId) {
    if (loaded[name]) return Promise.resolve(true);
    if (loading[name]) return loading[name];
    var mountEl = null;
    if (mountId) mountEl = document.getElementById(mountId);
    if (!mountEl) {
      mountEl = document.getElementById('samanComponentsMount');
      if (!mountEl) {
        mountEl = document.createElement('div');
        mountEl.id = 'samanComponentsMount';
        mountEl.style.display = 'contents';
        document.body.appendChild(mountEl);
      }
    }
    // Pehle se page me hai toh dobara mat lao
    var already = document.querySelector('[data-saman-comp="' + name + '"]');
    if (already) { loaded[name] = true; return Promise.resolve(true); }
    loading[name] = fetch(BASE + name + '.html?t=' + Date.now(), { credentials: 'include', cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('Not found ' + name);
        return res.text();
      })
      .then(function (html) {
        var wrap = document.createElement('div');
        wrap.setAttribute('data-saman-comp', name);
        wrap.style.display = 'contents';
        mountEl.appendChild(wrap);
        injectHtml(html, wrap);
        loaded[name] = true;
        return true;
      })
      .catch(function () {
        return false;
      });
    return loading[name];
  }

  function loadOneJs(name) {
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

  // Page pe kya chahiye, wo page ke data se tay hoga
  function pickList() {
    var isDashboard = window.location.pathname.indexOf('dashboard') > -1 || document.body.getAttribute('data-page') === 'dashboard';
    var list = [];
    // Har page pe chahiye wale
    list.push('toast');
    list.push('loader');
    list.push('confirm-modal');
    list.push('empty-state');
    list.push('skeleton-loader');
    list.push('language-switcher');
    if (isDashboard) {
      list.push('dashboard-header');
      list.push('sidebar');
      list.push('dashboard-footer');
    } else {
      list.push('user-header');
      list.push('bottom-nav');
      list.push('user-footer');
      list.push('shop-header');
      list.push('shop-status-badge');
      list.push('product-quick-view');
      list.push('image-zoom');
    }
    // Page ne mana kiya ho toh mat lao
    var skip = (document.body.getAttribute('data-saman-skip') || '').split(',');
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      var skipIt = false;
      for (var j = 0; j < skip.length; j++) {
        if (skip[j] && skip[j].trim() === n) skipIt = true;
      }
      if (!skipIt) out.push(n);
    }
    return out;
  }

  async function init() {
    // Achar ke purane header / footer se takkar na ho, isliye pehle check
    // Agar page me pehle se apna header hai toh loader wala header mat lao
    var hasOwnHeader = !!document.querySelector('header[data-own-header="1"]');
    var list = pickList();
    if (hasOwnHeader) {
      list = list.filter(function (n) { return n !== 'user-header' && n !== 'shop-header' && n !== 'dashboard-header'; });
    }
    for (var i = 0; i < list.length; i++) {
      try { await loadOne(list[i]); } catch (e) {}
    }
    // Product card ka JS alag se, kyunki wo .html nahi .js hai
    try { await loadOneJs('product-card'); } catch (e) {}
    // Sab lag gaya, page ko bata do
    window.__SAMAN_COMPONENTS_READY__ = true;
    document.dispatchEvent(new CustomEvent('saman:components-ready', { detail: { shopId: getShopId() } }));
  }

  function toast(msg, type) {
    try {
      if (window.Toast && window.Toast.show) { window.Toast.show(msg, type || 'success'); return; }
    } catch (e) {}
    alert(msg);
  }

  function loaderShow(show, text) {
    try {
      if (window.Loader) {
        if (show) window.Loader.show(text || 'Loading...');
        else window.Loader.hide();
        return;
      }
    } catch (e) {}
  }

  function confirmBox(title, msg) {
    return new Promise(function (resolve) {
      try {
        if (window.ConfirmModal && window.ConfirmModal.show) {
          window.ConfirmModal.show({ title: title, message: msg, onConfirm: function () { resolve(true); }, onCancel: function () { resolve(false); } });
          return;
        }
      } catch (e) {}
      resolve(window.confirm(msg));
    });
  }

  function empty(show, title, msg) {
    try {
      if (window.EmptyState) {
        if (show) window.EmptyState.show({ title: title || 'Koi data nahi', message: msg || '' });
        else window.EmptyState.hide();
      }
    } catch (e) {}
  }

  window.SamanComponents = {
    load: loadOne,
    loadJs: loadOneJs,
    toast: toast,
    loader: loaderShow,
    confirm: confirmBox,
    empty: empty,
    ready: function () { return !!window.__SAMAN_COMPONENTS_READY__; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();