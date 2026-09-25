/**
 * SAMANLIVE DASHBOARD BRIDGE
 * Sirf Dashboard me use hoga
 * Usage: <script src="../common/dashboard-bridge.js"></script> <script>DASHBOARD_BRIDGE.init()</script>
 */
const DASHBOARD_BRIDGE = {
  base: "../common/",
  loadScript: (src) => new Promise((res, rej) => { const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); }),
  loadHTML: async (url, id) => { try{ const r=await fetch(url); const h=await r.text(); const el=document.getElementById(id); if(el) el.innerHTML=h; }catch(e){} },

  // ============ 30 FILES LINK ============
  files: {
    // CORE - 5 files
    c1: "../common/js/dashboard-core.js", // shopId, auth, token check - har dashboard me chahiye
    c2: "../common/auth/auth-core.js", // login session
    c3: "../common/auth/logout.js", // logout button
    c4: "../common/js/shop-toggle.js", // open/close shop
    c5: "../common/js/location.js", // shop location save

    // COMPONENTS - 6 files
    c6: "../common/components/dashboard-header.html", // top bar
    c7: "../common/components/sidebar.html", // side menu
    c8: "../common/components/dashboard-footer.html", // footer
    c9: "../common/components/toast.html", // success/error msg
    c10: "../common/components/confirm-modal.html", // delete confirm
    c11: "../common/components/loader.html", // loading

    // ORDERS - 5 files
    c12: "../common/orders/orders.html", // orders list page
    c13: "../common/orders/orders.js", // orders logic
    c14: "../common/orders/order-detail.html", // single order
    c15: "../common/orders/order-detail.js", 
    c16: "../common/orders/new-order-popup.html", // naya order ka popup + sound

    // PROFILE & SETTINGS - 5 files
    c17: "../common/profile/profile.html", // profile edit
    c18: "../common/profile/profile.js",
    c19: "../common/settings/settings.html", // main settings
    c20: "../common/settings/settings.js",
    c21: "../common/settings/open-close.html", // timing

    // BUSINESS - 9 files
    c22: "../common/inventory/inventory.html", // stock
    c23: "../common/inventory/inventory.js",
    c24: "../common/wallet/wallet.html", // paisa
    c25: "../common/wallet/wallet.js",
    c26: "../common/analytics/analytics.html", // sales report
    c27: "../common/analytics/analytics.js",
    c28: "../common/staff/staff-list.html", // staff
    c29: "../common/delivery/delivery-boy-assign.html", // delivery
    c30: "../common/banner/banner.html", // banner upload
  },

  init: async function(){
    console.log("DASHBOARD BRIDGE init");
    // JS load
    await this.loadScript(this.files.c1);
    await this.loadScript(this.files.c2);
    await this.loadScript(this.files.c4);
    await this.loadScript(this.files.c13);
    await this.loadScript(this.files.c18);
    await this.loadScript(this.files.c20);
    await this.loadScript(this.files.c23);
    await this.loadScript(this.files.c25);
    await this.loadScript(this.files.c27);
    // HTML components load
    await this.loadHTML(this.files.c6, "db-header");
    await this.loadHTML(this.files.c7, "db-sidebar");
    await this.loadHTML(this.files.c8, "db-footer");
    await this.loadHTML(this.files.c9, "db-toast");
    await this.loadHTML(this.files.c10, "db-confirm");
    await this.loadHTML(this.files.c11, "db-loader");
    await this.loadHTML(this.files.c16, "db-new-order-popup");
    await this.loadHTML(this.files.c30, "db-banner");
  }
};