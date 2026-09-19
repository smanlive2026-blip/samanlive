// LOCATION: public/shop-templates/common/shop-toggle.js

// COMMON TOGGLE - sab Shops ke liye ek hi file
// Isko har dashboard.html me include karna hai

const ShopToggle = {
  
  // shopId global hona chahiye (tere dashboard.js me already hai)
  getShopId: function() {
    return window.shopId || new URLSearchParams(window.location.search).get('shopId');
  },

  // Dashboard pe Open/Close click
  toggle: async function() {
    const toggleEl = document.getElementById('shopToggle');
    const textEl = document.getElementById('toggleText');
    if (!toggleEl || !textEl) return console.error('shopToggle element nahi mila');

    const isCurrentlyOpen = !toggleEl.classList.contains('off');
    const newStatus = !isCurrentlyOpen;

    // 1. UI turant change (user ko fast lage)
    toggleEl.classList.toggle('off', !newStatus);
    textEl.innerText = newStatus ? 'Open' : 'Closed';
    toggleEl.style.opacity = '0.6';

    try {
      // 2. Common API call
      const res = await fetch(`/api/shop-toggle/${this.getShopId()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: newStatus })
      });
      const data = await res.json();
      
      if (!data.success) throw new Error(data.message || 'Toggle fail');

      console.log('Toggle success:', data.isOpen ? 'Open' : 'Closed');
    } catch (err) {
      // Fail hua toh UI wapas reverse kar do
      toggleEl.classList.toggle('off', isCurrentlyOpen ? false : true);
      textEl.innerText = isCurrentlyOpen ? 'Open' : 'Closed';
      alert('Status save nahi hua: ' + err.message);
    } finally {
      toggleEl.style.opacity = '1';
    }
  },

  // Har dashboard pe auto bind ho jayega
  bind: function() {
    const el = document.getElementById('shopToggle');
    if (el) {
      el.addEventListener('click', () => this.toggle());
      console.log('ShopToggle binded');
    }
  },

  // Customer-view ke liye status load karna (agar chahiye toh)
  loadStatusForCustomer: async function(shopId, statusElementId = 'shopStatus') {
    try {
      const res = await fetch(`/api/shop-toggle/${shopId}`);
      const data = await res.json();
      const statusEl = document.getElementById(statusElementId);
      if (!statusEl) return;

      if (data.isOpen) {
        statusEl.innerText = 'Open';
        statusEl.classList.remove('closed');
      } else {
        statusEl.innerText = 'Closed';
        statusEl.classList.add('closed');
      }
    } catch (e) {
      console.log('Status load error', e);
    }
  }
};

// Auto bind on load
document.addEventListener('DOMContentLoaded', () => {
  ShopToggle.bind();
});

//  Har shop ke dashboard.html me sabse neeche ye add kar de:
//<script src="/shop-templates/common/shop-toggle.js"></script>//
