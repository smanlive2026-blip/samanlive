// LOCATION: public/shop-templates/common/customer-shop-status.js

// COMMON CUSTOMER STATUS - Sab 60 shop ke customer-view ke liye ek hi file

const CustomerShopStatus = {
  
  shopId: null,
  isOpen: true,

  init: async function() {
    this.shopId = new URLSearchParams(window.location.search).get('shopId');
    if(!this.shopId) return;

    // 1. Status API se lao
    try {
      const res = await fetch(`/api/shop-toggle/${this.shopId}`);
      const data = await res.json();
      this.isOpen = data.success ? data.isOpen : true;
    } catch(e) {
      this.isOpen = true; // API fail toh open hi mano
    }

    this.updateUI();
    this.blockActions();
  },

  updateUI: function() {
    // shopStatus ID tera har customer-view me same hai
    const statusEl = document.getElementById('shopStatus');
    if(!statusEl) return;
    
    if(this.isOpen) {
      statusEl.innerText = 'Open';
      statusEl.classList.remove('closed');
    } else {
      statusEl.innerText = 'Closed';
      statusEl.classList.add('closed');
    }
  },

  blockActions: function() {
    if(this.isOpen) return; // khula hai toh kuch mat kar

    // 1. Add to Cart ke saare button disable
    setTimeout(() => {
      document.querySelectorAll('.btn-add').forEach(btn => {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa fa-lock"></i> Shop Closed';
        btn.style.background = '#cbd5e1';
      });

      // 2. Cart float pe lock
      const cartBtn = document.getElementById('cartBtn');
      if(cartBtn) {
        cartBtn.style.background = '#94a3b8';
        cartBtn.innerHTML = '<i class="fa fa-lock"></i> Shop Closed';
        cartBtn.onclick = () => alert('🔴 Dukaan abhi band hai, thodi der me try karo');
      }

      // 3. Product cards feeke
      document.querySelectorAll('.product-card').forEach(card => {
        card.style.opacity = '0.6';
        card.style.filter = 'grayscale(0.5)';
      });

      // 4. Upar ek bada banner dikha do
      if(!document.getElementById('closedBanner')) {
        const container = document.querySelector('.container');
        const banner = document.createElement('div');
        banner.id = 'closedBanner';
        banner.innerHTML = `
          <div style="background:#fee2e2; color:#991b1b; padding:14px; border-radius:12px; margin-bottom:15px; text-align:center; font-weight:700; border:2px solid #fca5a5;">
            <i class="fa fa-moon"></i> Dukaan abhi band hai - Kal subah khulegi
          </div>
        `;
        container.prepend(banner);
      }
    }, 500); // render ke baad chale isliye delay
  },

  // addToCart ko bhi common se rok dega
  canAddToCart: function() {
    if(!this.isOpen) {
      alert('🔴 Dukaan band hai, order nahi le sakte');
      return false;
    }
    return true;
  }
};

// Auto start
document.addEventListener('DOMContentLoaded', () => {
  CustomerShopStatus.init();
});