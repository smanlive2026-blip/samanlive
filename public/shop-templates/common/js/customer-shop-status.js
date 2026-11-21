// LOCATION: public/shop-templates/common/js/customer-shop-status.js - FULL - V2 - CUSTOMER SIDE
// RULE: Order KABHI NAHI RUKEGA. Shop Closed sirf DIKHANE ke liye hai, ROKNE ke liye nahi.
// FLOW: Load -> GET /api/common/shop-toggle/:shopId/status -> Badge + Banner dikhao -> Order Button HAMESHA ON rakho
//       Dukaan band hai toh bhi order ban jayega, Dashboard pe Pending me dikh jayega.
//       Dukaan wala jab kholega, wahi order usko dikh jayega, Accept kar lega.
// ROUTE: /api/common/shop-toggle/:shopId/status - V2 shop-toggle.js se aata hai - Shop Model ka isOpen + timing
// TIMING: Hardcoded "9 AM" NAHI hai. Server se openingTime aayega - Jaise 09:00 -> "09:00 AM" dikhega.
// SOCKET: Dukaan wala dusre phone se khole/band kare toh yahan bhi turant badge badlega, button phir bhi ON rahega.
// STORAGE: Is file me koi browser storage se status NAHI uthaya jayega. Server nahi mila toh default Open dikhega, purana galat status kabhi nahi.
// BUTTON: [data-order-btn], #orderNowBtn, .order-btn - Inko kabhi disabled mat karna. Sirf original text wapas lao.

class CustomerShopStatus {
  constructor() {
    // shopId SIRF URL se - kahi aur se NAHI
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
    this.isOpen = true;
    this.timing = { openingTime: '09:00', closingTime: '21:00', open: '09:00', close: '21:00' };
    this._timer = null;
  }

  async init() {
    if (!this.shopId) return;
    await this.checkStatus();
    this.initSocket();
    // Har 1 min me Server se dobara check karo - Dukaan wala kab khole/band kare, pata chalta rahe
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => this.checkStatus(), 60000);
  }

  async checkStatus() {
    try {
      let isOpen = true;
      let timing = this.timing;

      // 1. ApiCore se - HAMESHA Server se
      if (window.ApiCore) {
        try {
          const data = await window.ApiCore.get('/api/common/shop-toggle/' + encodeURIComponent(this.shopId) + '/status');
          if (data) {
            isOpen = data.isOpen !== undefined ? data.isOpen : true;
            if (data.timing) timing = data.timing;
            // Kabhi-kabhi timing alag key me aati hai - usko bhi pakad lo
            if (data.openingTime) timing.openingTime = data.openingTime;
            if (data.closingTime) timing.closingTime = data.closingTime;
          }
        } catch (e) { /* ApiCore fail toh direct fetch pe jao */ }
      }

      // 2. Direct fetch se - ApiCore na chale toh bhi Server se hi mangenge
      if (!window.ApiCore) {
        try {
          const res = await fetch('/api/common/shop-toggle/' + encodeURIComponent(this.shopId) + '/status', { cache: 'no-store' });
          const data = await res.json().catch(() => null);
          if (data && data.success !== false) {
            isOpen = data.isOpen !== undefined ? data.isOpen : true;
            if (data.timing) timing = data.timing;
            if (data.openingTime) timing.openingTime = data.openingTime;
            if (data.closingTime) timing.closingTime = data.closingTime;
          }
        } catch (e) { /* Server nahi mila toh default Open - purana galat status kabhi nahi */ }
      }

      this.isOpen = !!isOpen;
      this.timing = timing || this.timing;

      this.updateUI(this.isOpen, this.timing);

      return { isOpen: this.isOpen, timing: this.timing };

    } catch (e) {
      return { isOpen: true, timing: this.timing };
    }
  }

  // 09:00 -> 09:00 AM, 21:00 -> 09:00 PM, 09:30 -> 09:30 AM
  formatTime(timeStr) {
    if (!timeStr) return '09:00 AM';
    try {
      const parts = String(timeStr).split(':');
      let h = parseInt(parts[0]) || 0;
      const m = String(parts[1] || '00').padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      let hour = h % 12;
      if (hour === 0) hour = 12;
      return String(hour).padStart(2, '0') + ':' + m + ' ' + ampm;
    } catch (e) {
      return String(timeStr);
    }
  }

  updateUI(isOpen, timing) {
    try {
      const t = timing || this.timing || {};
      const openTime = t.openingTime || t.open || '09:00';
      const closeTime = t.closingTime || t.close || '21:00';
      const openText = this.formatTime(openTime);
      const closeText = this.formatTime(closeTime);

      // 1. BADGE - Har jagah ka badge ek saath badlo - Sirf dikhane ke liye
      const badges = document.querySelectorAll('.shop-status-badge, [data-shop-status], #customerShopStatus, #shopStatus, #shopStatusBadge');
      badges.forEach(badge => {
        if (isOpen) {
          badge.innerHTML = '🟢 Open • Delivery available';
          badge.style.background = '#dcfce7';
          badge.style.color = '#166534';
        } else {
          badge.innerHTML = '🔴 Closed • Khulegi ' + openText + ' pe';
          badge.style.background = '#fee2e2';
          badge.style.color = '#991b1b';
        }
      });

      // 2. ORDER BUTTON - KABHI DISABLE MAT KARNA - Yehi sabse important fix hai
      // Dukaan band hai toh bhi customer order kar sakega. Order Dashboard pe Pending me dikhega.
      // Dukaan wala kholega toh wahi order usko dikh jayega.
      const orderBtns = document.querySelectorAll('[data-order-btn], #orderNowBtn, .order-btn');
      orderBtns.forEach(btn => {
        // Pehli baar original text yaad rakho, taaki baar-baar badalne pe text na bigde
        if (!btn.dataset.originalText) {
          btn.dataset.originalText = btn.innerText || '🛒 Order Now';
        }
        btn.disabled = false;
        btn.removeAttribute('disabled');
        btn.innerText = btn.dataset.originalText;
        btn.style.background = '';
        btn.style.color = '';
        btn.style.cursor = '';
        btn.style.opacity = '';
        btn.classList.remove('shop-closed-disabled');
        // Band hai toh halka sa hint de do, par button ON hi rahega
        if (!isOpen) {
          btn.setAttribute('title', 'Shop abhi band hai, par order ban jayega. Dukaan khulte hi dukaan wala dekh lega.');
        } else {
          btn.removeAttribute('title');
        }
      });

      // 3. CLOSED BANNER - Sirf dikhane ke liye - Order nahi rokega
      const closedBanners = document.querySelectorAll('.shop-closed-banner, #shopClosedBanner');
      closedBanners.forEach(banner => {
        banner.style.display = isOpen ? 'none' : 'block';
        // Banner ke andar agar text wali jagah hai toh usme bhi khulne ka time daal do
        try {
          const timeEl = banner.querySelector('[data-open-time], .open-time, #closedOpenTime');
          if (timeEl) timeEl.innerText = openText;
          // Agar banner ka text khali hai ya purana "9 AM" likha hai toh sahi kar do
          if (banner.innerText && banner.innerText.indexOf('9 AM') !== -1) {
            banner.innerHTML = '🔴 Shop abhi band hai • Khulegi ' + openText + ' pe • Order kar sakte ho, dukaan khulte hi dukaan wala dekh lega';
          }
        } catch (e) {}
      });

      // 4. Khulne / Band hone ka time dikhane wali chhoti line - Agar page pe hai toh
      const openTimeEls = document.querySelectorAll('[data-shop-open-time], #shopOpenTimeText');
      openTimeEls.forEach(el => {
        el.innerText = isOpen ? ('Band hogi ' + closeText + ' pe') : ('Khulegi ' + openText + ' pe');
      });

    } catch (e) {}
  }

  initSocket() {
    try {
      if (window.SocketCore) {
        window.SocketCore.on('shop-status-changed', (data) => {
          if (!data) return;
          if (String(data.shopId) !== String(this.shopId)) return;
          // Socket se timing aayi hai toh usko bhi le lo, nahi aayi toh purani timing hi rakho
          if (data.timing) this.timing = data.timing;
          this.isOpen = data.isOpen !== undefined ? !!data.isOpen : this.isOpen;
          this.updateUI(this.isOpen, this.timing);
          // Toast sirf batane ke liye hai - Order rokne ke liye nahi
          if (window.Toast) {
            Toast.show(this.isOpen ? '🟢 Shop khul gayi - Order kar sakte ho' : '🔴 Shop band ho gayi - Par order phir bhi ban jayega', this.isOpen ? 'success' : 'info');
          }
        });
      }
    } catch (e) {}
  }

  // Dusri file ko puchhna ho ki dukaan khuli hai ya nahi - toh ye use karegi - Par order rokne ke liye isko use MAT karna
  isShopOpen() { return this.isOpen; }
  getTiming() { return this.timing; }
  getOpensAt() { return (this.timing && (this.timing.openingTime || this.timing.open)) || '09:00'; }
}

window.CustomerShopStatus = new CustomerShopStatus();
window.CustomerShopStatusInstance = window.CustomerShopStatus;
if (document.readyState !== 'loading') {
  window.CustomerShopStatus.init();
} else {
  document.addEventListener('DOMContentLoaded', () => window.CustomerShopStatus.init());
}