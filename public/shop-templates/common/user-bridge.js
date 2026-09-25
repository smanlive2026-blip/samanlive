/**
 * SAMANLIVE USER BRIDGE
 * Sirf Customer-View / User-View me use hoga
 * Usage: <script src="../common/user-bridge.js"></script> <script>USER_BRIDGE.init()</script>
 */
const USER_BRIDGE = {
  base: "../common/",
  loadScript: (src) => new Promise((res, rej) => { const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); }),
  loadHTML: async (url, id) => { try{ const r=await fetch(url); const h=await r.text(); const el=document.getElementById(id); if(el) el.innerHTML=h; }catch(e){} },

  files: {
    // CORE - 5 files
    u1: "../common/js/user-core.js", // shop data load customer side
    u2: "../common/js/customer-shop-status.js", // open/close badge
    u3: "../common/js/search.js", // product search
    u4: "../common/js/filter.js", // category filter
    u5: "../common/js/shop-banner-ext.js", // banner

    // CART & CHECKOUT - 7 files
    u6: "../common/cart/cart-core.js", // add to cart logic - sabse important
    u7: "../common/cart/cart-count.js", // cart count top pe
    u8: "../common/cart/cart-drawer.html", // slide wala cart
    u9: "../common/cart/cart.html", // full cart page
    u10: "../common/checkout/checkout.html", // checkout page
    u11: "../common/checkout/checkout.js", // checkout logic
    u12: "../common/checkout/order-success.html", // success page

    // COMPONENTS - 6 files
    u13: "../common/components/user-header.html", // customer header
    u14: "../common/components/user-footer.html", // footer
    u15: "../common/components/shop-header.html", // shop name + logo
    u16: "../common/components/shop-status-badge.html", // open dot
    u17: "../common/components/product-card.html", // product card
    u18: "../common/components/toast.html", // toast msg

    // CUSTOMER FEATURES - 12 files
    u19: "../common/js/wishlist.js", // favourite
    u20: "../common/js/review.js", // review
    u21: "../common/js/share.js", // share
    u22: "../common/share/whatsapp-share.js", // whatsapp share
    u23: "../common/share/qr-share.html", // qr code
    u24: "../common/reviews/rating-widget.html", // star rating
    u25: "../common/customer-orders/my-orders.html", // my orders
    u26: "../common/customer-orders/track-order.html", // track order
    u27: "../common/wishlist/wishlist.html", // wishlist page
    u28: "../common/marketing/apply-coupon.js", // coupon apply
    u29: "../common/legal/about.html", // about page link
    u30: "../common/support/help.html", // help page
  },

  init: async function(){
    console.log("USER BRIDGE init");
    // JS
    await this.loadScript(this.files.u1);
    await this.loadScript(this.files.u2);
    await this.loadScript(this.files.u3);
    await this.loadScript(this.files.u4);
    await this.loadScript(this.files.u6);
    await this.loadScript(this.files.u7);
    await this.loadScript(this.files.u11);
    await this.loadScript(this.files.u19);
    await this.loadScript(this.files.u20);
    await this.loadScript(this.files.u21);
    await this.loadScript(this.files.u22);
    await this.loadScript(this.files.u28);
    // HTML
    await this.loadHTML(this.files.u8, "ub-cart-drawer");
    await this.loadHTML(this.files.u13, "ub-header");
    await this.loadHTML(this.files.u14, "ub-footer");
    await this.loadHTML(this.files.u15, "ub-shop-header");
    await this.loadHTML(this.files.u16, "ub-status-badge");
    await this.loadHTML(this.files.u18, "ub-toast");
    await this.loadHTML(this.files.u23, "ub-qr");
    await this.loadHTML(this.files.u24, "ub-rating");
  }
};