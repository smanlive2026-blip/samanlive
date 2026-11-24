// LOCATION: public/shop-templates/common/components/components-ui-fix.js - V1 UI FIX
// KAAM: Toast / Loader / Confirm / Empty / Skeleton ko ek hi jagah se chalana.
// RULE: Ye naya toast / loader nahi banayega. Jo pehle se hai usi ko chaleyga.
// RULE: Ek hi waqt me 2 toast / 2 loader kabhi nahi khulenge. Purana band, phir naya.

(function () {
  if (window.__SAMAN_UI_FIX_V1__) return;
  window.__SAMAN_UI_FIX_V1__ = true;

  var loaderCount = 0;
  var loaderTimer = null;
  var toastQueue = [];
  var toastBusy = false;

  // Toast - ek-ek karke dikhao, ek sath 5 mat chipkao
  function showToast(msg, type, duration) {
    msg = String(msg || '');
    if (!msg) return;
    type = type || 'success';
    duration = duration || 2500;
    toastQueue.push({ msg: msg, type: type, duration: duration });
    runToastQueue();
  }

  function runToastQueue() {
    if (toastBusy) return;
    var item = toastQueue.shift();
    if (!item) return;
    toastBusy = true;
    try {
      // Pehle wali toast file ka hi Toast use karo
      if (window.Toast && window.Toast.show) {
        // Purane wale Toast ka asli show bulao, par ek baar hi
        var orig = window.Toast.__SAMAN_ORIG_SHOW__ || window.Toast.show;
        window.Toast.__SAMAN_ORIG_SHOW__ = orig;
        // Agar purana Toast abhi bhi apna kaam kar raha hai toh usi ko bulao
        orig.call(window.Toast, item.msg, item.type, item.duration);
      } else {
        // Toast file abhi aayi nahi toh chhota sa dabba khud bana do, par ek hi
        var box = document.getElementById('samanFallbackToast');
        if (!box) {
          box = document.createElement('div');
          box.id = 'samanFallbackToast';
          box.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:999999;background:#0f172a;color:#fff;padding:12px 16px;border-radius:12px;font-weight:800;font-size:13px;box-shadow:0 12px 24px rgba(0,0,0,.2);max-width:90vw;';
          document.body.appendChild(box);
        }
        box.textContent = item.msg;
        box.style.display = 'block';
        setTimeout(function () { if (box) box.style.display = 'none'; }, item.duration);
      }
    } catch (e) {}
    setTimeout(function () { toastBusy = false; runToastQueue(); }, item.duration + 200);
  }

  // Loader - ginti se chalao, ek khole toh ek band karega
  function loaderShow(show, text) {
    try {
      if (show) {
        loaderCount++;
        if (window.Loader && window.Loader.show) {
          window.Loader.show(text || 'Loading...');
        } else {
          var el = document.getElementById('globalLoader');
          if (el) el.style.display = 'grid';
        }
        // 15 sec me khud band, atakna nahi hai
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
      else {
        var el = document.getElementById('globalLoader');
        if (el) el.style.display = 'none';
      }
      document.body.style.overflow = '';
    } catch (e) {}
  }

  // Confirm - ek hi dabba, dobara khula toh pehle wala band
  function confirmBox(options) {
    if (typeof options === 'string') options = { message: options };
    options = options || {};
    return new Promise(function (resolve) {
      var done = false;
      function finish(v) {
        if (done) return;
        done = true;
        resolve(v);
      }
      try {
        if (window.ConfirmModal && window.ConfirmModal.show) {
          window.ConfirmModal.show({
            title: options.title || 'Pakka?',
            message: options.message || 'Ye kaam kar du?',
            icon: options.icon || '⚠️',
            confirmText: options.confirmText || 'Haan',
            cancelText: options.cancelText || 'Nahi',
            requireInput: !!options.requireInput,
            onConfirm: function () { finish(true); if (options.onConfirm) options.onConfirm(); },
            onCancel: function () { finish(false); if (options.onCancel) options.onCancel(); }
          });
          // 30 sec me khud band, atakna nahi hai
          setTimeout(function () { finish(false); }, 30000);
          return;
        }
      } catch (e) {}
      finish(window.confirm(options.message || 'Pakka?'));
    });
  }

  // Empty - dikhao / chhupao, ek hi jagah se
  function emptyShow(show, preset, title, msg) {
    try {
      if (!show) {
        if (window.EmptyState && window.EmptyState.hide) window.EmptyState.hide();
        var el = document.getElementById('emptyState');
        if (el) el.style.display = 'none';
        return;
      }
      if (window.EmptyState && window.EmptyState.show) {
        // Pehle wali EmptyState ko preset ya title do
        if (preset && window.EmptyState.presets && window.EmptyState.presets[preset]) {
          window.EmptyState.show(preset);
        } else {
          window.EmptyState.show({ title: title || 'Koi data nahi', message: msg || '' });
        }
        return;
      }
      var el2 = document.getElementById('emptyState');
      if (el2) {
        el2.style.display = 'grid';
        var t = document.getElementById('emptyTitle');
        if (t && title) t.textContent = title;
        var m = document.getElementById('emptyMessage');
        if (m && msg) m.textContent = msg;
      }
    } catch (e) {}
  }

  // Skeleton - list khali ho toh dikhao, data aate hi band
  function skeletonShow(show, type) {
    try {
      if (show) {
        if (window.SkeletonLoader && window.SkeletonLoader.show) { window.SkeletonLoader.show(type || 'productGrid'); return; }
        var el = document.getElementById('skeletonLoader');
        if (el) el.style.display = 'block';
      } else {
        if (window.SkeletonLoader && window.SkeletonLoader.hide) { window.SkeletonLoader.hide(); return; }
        var el2 = document.getElementById('skeletonLoader');
        if (el2) el2.style.display = 'none';
      }
    } catch (e) {}
  }

  // Purane Toast / Loader ko bhi isi ek jagah se bandho, taaki 2 baar na chale
  function patchOldOnes() {
    try {
      // Toast - purana show ab isi queue se chalega
      if (window.Toast && window.Toast.show && !window.Toast.__SAMAN_PATCHED__) {
        window.Toast.__SAMAN_PATCHED__ = true;
        var oldShow = window.Toast.show.bind(window.Toast);
        window.Toast.__SAMAN_ORIG_SHOW__ = oldShow;
        window.Toast.show = function (msg, type, duration) {
          // Agar ye humari queue se aaya hai toh seedha chalao, warna queue me daalo
          if (window.__SAMAN_TOAST_FROM_QUEUE__) { oldShow(msg, type, duration); return; }
          showToast(msg, type, duration);
        };
      }
    } catch (e) {}
    try {
      if (window.Loader && window.Loader.show && !window.Loader.__SAMAN_PATCHED__) {
        window.Loader.__SAMAN_PATCHED__ = true;
        var oldLShow = window.Loader.show.bind(window.Loader);
        var oldLHide = window.Loader.hide.bind(window.Loader);
        window.Loader.show = function (text, sub) {
          if (window.__SAMAN_LOADER_FROM_QUEUE__) { oldLShow(text, sub); return; }
          loaderShow(true, text);
        };
        window.Loader.hide = function () { loaderHide(true); oldLHide(); };
      }
    } catch (e) {}
  }

  function fixToastQueueFlag() {
    // Queue wala Toast chalate waqt flag lagao, taaki patch wapas queue me na bheje
    var origRun = runToastQueue;
    runToastQueue = function () {
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
          window.__SAMAN_TOAST_FROM_QUEUE__ = true;
          window.Toast.show(item.msg, item.type, item.duration);
          window.__SAMAN_TOAST_FROM_QUEUE__ = false;
        }
      } catch (e) {
        window.__SAMAN_TOAST_FROM_QUEUE__ = false;
      }
      setTimeout(function () { toastBusy = false; runToastQueue(); }, item.duration + 200);
    };
  }

  function init() {
    fixToastQueueFlag();
    // Loader wale components aane ke baad patch karo
    if (window.__SAMAN_COMPONENTS_READY__) patchOldOnes();
    else document.addEventListener('saman:components-ready', function () { patchOldOnes(); });
    setTimeout(function () { patchOldOnes(); }, 2500);

    // Sabke liye ek hi naam - ab koi bhi file inko bulayegi toh ek hi jagah se chalega
    window.SamanUI = {
      toast: showToast,
      loader: loaderShow,
      loaderHide: function () { loaderHide(true); },
      confirm: confirmBox,
      empty: emptyShow,
      skeleton: skeletonShow
    };

    // SamanComponents wale purane naam bhi isi se jod do, taaki purana code toote nahi
    if (window.SamanComponents) {
      window.SamanComponents.toast = showToast;
      window.SamanComponents.loader = loaderShow;
      window.SamanComponents.confirm = function (title, msg) {
        if (typeof title === 'object') return confirmBox(title);
        return confirmBox({ title: title, message: msg });
      };
      window.SamanComponents.empty = function (show, title, msg) { emptyShow(show, null, title, msg); };
    }

    // Language wala - purana wala sirf 6 shabd badalta tha, ab usko bhi yahin se bulayenge
    window.SamanUI.setLang = function (lang) {
      try {
        if (window.LanguageSwitcher) {
          var ls = window.LanguageSwitcher;
          if (typeof ls === 'function') { var inst = new ls(); if (inst.setLanguage) inst.setLanguage(lang); }
          else if (ls.setLanguage) ls.setLanguage(lang);
        }
      } catch (e) {}
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();