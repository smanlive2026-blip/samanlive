// LOCATION: public/shop-templates/common/shop-toggle.js

const ShopToggle = {
  getShopId: function() {
    return window.shopId || new URLSearchParams(window.location.search).get('shopId');
  },

  toggle: async function() {
    const wrapEl = document.getElementById('shopToggle');
    const switchEl = document.getElementById('toggleSwitch');
    const textEl = document.getElementById('toggleText');
    if (!switchEl || !textEl) return;

    const isCurrentlyOpen = switchEl.classList.contains('on');
    const newStatus = !isCurrentlyOpen;

    // UI fast
    switchEl.classList.toggle('on', newStatus);
    switchEl.classList.toggle('off', !newStatus);
    textEl.innerText = newStatus ? 'Open' : 'Closed';
    wrapEl.style.opacity = '0.6';

    try {
      const res = await fetch(`/api/shop-toggle/${this.getShopId()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: newStatus })
      });
      const data = await res.json();
      if (!data.success) throw new Error('fail');
    } catch (err) {
      switchEl.classList.toggle('on', isCurrentlyOpen);
      switchEl.classList.toggle('off', !isCurrentlyOpen);
      textEl.innerText = isCurrentlyOpen ? 'Open' : 'Closed';
      alert('Status save nahi hua');
    } finally {
      wrapEl.style.opacity = '1';
    }
  },

  bind: function() {
    const wrapEl = document.getElementById('shopToggle');
    const switchEl = document.getElementById('toggleSwitch');
    const textEl = document.getElementById('toggleText');
    if (!wrapEl || !switchEl) return;

    // Page load pe backend se status lao
    fetch(`/api/shop-toggle/${this.getShopId()}`, {cache:'no-store'})
      .then(r=>r.json()).then(d=>{
        const isOpen = d.isOpen ?? true;
        switchEl.classList.toggle('on', isOpen);
        switchEl.classList.toggle('off', !isOpen);
        textEl.innerText = isOpen ? 'Open' : 'Closed';
      }).catch(()=>{});

    wrapEl.addEventListener('click', () => this.toggle());
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ShopToggle.bind();
});