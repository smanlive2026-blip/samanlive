// LOCATION: public/shop-templates/common/js/shop-toggle.js - COMMON - FINAL - Step 1.3
// CONTRACT: SHOP-DASHBOARD-COMMON-CONTRACT.md - Step 1.3
// RULE: Shop apni dukaan Open / Close karegi. Pehle server pe save hoga, phir button badlega.
// LOAD KARNE KA SAHI PATH - Shop Dashboard se: <script src="../common/js/shop-toggle.js"></script>
// GALAT PATH - /shop-templates/common/shop-toggle.js - aisi file hai hi nahi, ye mat likhna

(function () {
  if (window.ShopToggle) return; // Dobara load nahi hoga

  const API_BASE = window.API_BASE || window.location.origin;

  function getShopId() {
    const p = new URLSearchParams(location.search);
    return p.get('shopId') || p.get('id') || localStorage.getItem('last_shopId') || localStorage.getItem('shopId') || '';
  }

  function getHeaders() {
    const token = (window.AuthCore && window.AuthCore.getToken && window.AuthCore.getToken()) || localStorage.getItem('TOKEN') || localStorage.getItem('token') || '';
    return { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
  }

  function getRole() {
    return localStorage.getItem('USER_ROLE') || 'shop_owner';
  }

  function getUserId() {
    return localStorage.getItem('USER_ID') || '';
  }

  class ShopToggle {
    constructor() {
      this.shopId = getShopId();
      this.isOpen = true;
      this.is24Hours = false;
      this.timing = { open: '09:00', close: '21:00' };
      this.busy = false;
    }

    async init() {
      if (!this.shopId) return;
      await this.loadStatus();
      this.bindEvents();
      this.initSocket();
    }

    async loadStatus() {
      try {
        const res = await fetch(`${API_BASE}/api/common/shop-toggle/${this.shopId}/status`, { headers: getHeaders() });
        const data = await res.json();
        if (data.success) {
          this.isOpen = data.isOpen;
          this.is24Hours = data.is24Hours || false;
          this.timing = data.timing || this.timing;
          // Server wala sach hai, localStorage wala purana ho sakta hai - server ko maano
          localStorage.setItem(`shop_open_${this.shopId}`, String(this.isOpen));
        }
      } catch (e) {
        // Server nahi mila toh localStorage se dikhao, par toggle dabane pe server pe hi jayega
        this.isOpen = localStorage.getItem(`shop_open_${this.shopId}`) !== 'false';
      }
      this.updateUI();
    }

    updateUI() {
      // Jo bhi button hai - sabko ek saath badlo
      document.querySelectorAll('[data-shop-toggle], #shopToggleBtn, .shop-toggle-btn').forEach(btn => {
        btn.innerText = this.isOpen ? '🟢 Shop Open' : '🔴 Shop Closed';
        btn.style.background = this.isOpen ? '#dcfce7' : '#fee2e2';
        btn.style.color = this.isOpen ? '#166534' : '#991b1b';
        btn.dataset.open = String(this.isOpen);
        btn.disabled = this.busy;
      });
      document.querySelectorAll('[data-shop-status], .shop-status-badge, #shopStatusBadge').forEach(badge => {
        badge.innerText = this.isOpen ? '🟢 Open' : '🔴 Closed';
        badge.style.background = this.isOpen ? '#dcfce7' : '#fee2e2';
        badge.style.color = this.isOpen ? '#166534' : '#991b1b';
      });
    }

    bindEvents() {
      document.querySelectorAll('[data-shop-toggle], #shopToggleBtn, .shop-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => this.toggle());
      });
    }

    initSocket() {
      // Server se koi aur device se band hui toh yahan bhi band dikhegi
      try {
        if (window.shopSocket) {
          window.shopSocket.on('shop-status-changed', (d) => {
            if (String(d.shopId) === String(this.shopId)) {
              this.isOpen = d.isOpen;
              this.updateUI();
            }
          });
        }
      } catch (_) {}
    }

    async toggle() {
      if (this.busy) return;
      // Customer / Area Manager / Admin toggle nahi dabayenge - button hi nahi dikhega, phir bhi check rakha hai
      const role = getRole();
      if (role === 'customer' || role === 'area_manager' || role === 'area-manager' || role === 'admin') {
        alert('Tum dukaan Open / Close nahi kar sakte');
        return;
      }

      const old = this.isOpen;
      const next = !old;
      this.busy = true;
      this.updateUI();

      try {
        const res = await fetch(`${API_BASE}/api/common/shop-toggle/${this.shopId}/toggle`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ isOpen: next, shopId: this.shopId, role, userId: getUserId() })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Toggle fail');

        this.isOpen = next;
        localStorage.setItem(`shop_open_${this.shopId}`, String(next));
        if (window.Toast) window.Toast.show(data.message, 'success');
        else alert(data.message);
      } catch (e) {
        // Server pe save nahi hua toh button wapas purana - dhokha nahi denge
        this.isOpen = old;
        alert('❌ ' + e.message);
      } finally {
        this.busy = false;
        this.updateUI();
      }
    }
  }

  window.ShopToggle = ShopToggle;
  window.shopToggle = new ShopToggle();
  document.addEventListener('DOMContentLoaded', () => window.shopToggle.init());
  // Agar DOM pehle se load hai toh abhi init karo
  if (document.readyState !== 'loading') window.shopToggle.init();

  console.log('✅ ShopToggle loaded - Step 1.3');
})();