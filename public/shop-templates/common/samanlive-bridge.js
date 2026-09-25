/**
 * SAMANLIVE - WORLD CLASS COMMON BRIDGE
 * Ek hi file se Dashboard + User-View dono jud jayenge
 * Usage:
 * Dashboard me: <script src="../common/samanlive-bridge.js"></script> <script>SAMAN.initDashboard()</script>
 * User-View me: <script src="../common/samanlive-bridge.js"></script> <script>SAMAN.initUserView()</script>
 */

const SAMAN = {
  basePath: "../common/", // har template se common ka path
  
  // ============ CORE MODULES ============
  core: {
    // File: common/js/dashboard-core.js - Shop owner ka auth, shopId, token check
    dashboardCore: "../common/js/dashboard-core.js",
    // File: common/js/user-core.js - Customer side shop data load
    userCore: "../common/js/user-core.js",
    // File: common/auth/auth-core.js - login check
    authCore: "../common/auth/auth-core.js",
    // File: common/auth/logout.js - logout logic
    logout: "../common/auth/logout.js",
    // File: common/js/shop-toggle.js - shop open/close
    shopToggle: "../common/js/shop-toggle.js",
    // File: common/js/customer-shop-status.js - open/close badge customer side
    shopStatus: "../common/js/customer-shop-status.js",
    // File: common/js/location.js - shop location
    location: "../common/js/location.js",
    // File: common/js/shop-banner-ext.js - banner extension
    bannerExt: "../common/js/shop-banner-ext.js"
  },

  // ============ CART SYSTEM ============
  cart: {
    // File: common/cart/cart.html - main cart page
    page: "../common/cart/cart.html",
    // File: common/cart/cart-drawer.html - slide cart drawer
    drawer: "../common/cart/cart-drawer.html",
    // File: common/cart/cart-core.js - add, remove, qty, total logic
    core: "../common/cart/cart-core.js",
    // File: common/cart/cart-count.js - header me count badge
    count: "../common/cart/cart-count.js"
  },

  // ============ CHECKOUT SYSTEM ============
  checkout: {
    // File: common/checkout/checkout.html
    page: "../common/checkout/checkout.html",
    // File: common/checkout/checkout.js - order place logic
    core: "../common/checkout/checkout.js",
    // File: common/checkout/address-select.html - address choose
    addressPage: "../common/checkout/address-select.html",
    // File: common/checkout/payment-select.html - payment method
    paymentPage: "../common/checkout/payment-select.html",
    // File: common/checkout/order-success.html - order done page
    successPage: "../common/checkout/order-success.html"
  },

  // ============ ORDERS (SHOP OWNER) ============
  ownerOrders: {
    // File: common/orders/orders.html - shop ko order dikhenge
    list: "../common/orders/orders.html",
    // File: common/orders/orders.js
    listJs: "../common/orders/orders.js",
    // File: common/orders/order-detail.html
    detail: "../common/orders/order-detail.html",
    // File: common/orders/order-detail.js
    detailJs: "../common/orders/order-detail.js",
    // File: common/orders/new-order-popup.html - naya order popup + sound
    newPopup: "../common/orders/new-order-popup.html",
    sound: "../common/orders/new-order-sound.mp3",
    bulk: "../common/orders/bulk-orders.html"
  },

  // ============ CUSTOMER ORDERS ============
  customerOrders: {
    // File: common/customer-orders/my-orders.html
    myOrders: "../common/customer-orders/my-orders.html",
    myOrdersJs: "../common/customer-orders/my-orders.js",
    // File: common/customer-orders/track-order.html - normal track
    track: "../common/customer-orders/track-order.html",
    // File: common/customer-orders/track-order-live.js - live map track
    trackLiveJs: "../common/customer-orders/track-order-live.js",
    cancel: "../common/customer-orders/cancel-order.html",
    return: "../common/customer-orders/return-order.html",
    invoice: "../common/customer-orders/invoice-download.html"
  },

  // ============ PROFILE & SETTINGS ============
  profile: {
    // File: common/profile/profile.html - shop profile
    page: "../common/profile/profile.html",
    js: "../common/profile/profile.js",
    info: "../common/profile/shop-info.html",
    infoJs: "../common/profile/shop-info.js",
    gallery: "../common/profile/shop-gallery.html",
    timing: "../common/profile/shop-timing.html",
    verification: "../common/profile/shop-verification.html"
  },
  settings: {
    // File: common/settings/settings.html
    page: "../common/settings/settings.html",
    js: "../common/settings/settings.js",
    openClose: "../common/settings/open-close.html",
    delivery: "../common/settings/delivery-settings.html",
    language: "../common/settings/language-settings.html",
    theme: "../common/settings/theme-settings.html",
    notification: "../common/settings/notification-settings.html"
  },

  // ============ ANALYTICS, WALLET, FINANCE ============
  analytics: {
    page: "../common/analytics/analytics.html",
    js: "../common/analytics/analytics.js",
    salesReport: "../common/analytics/sales-report.html"
  },
  wallet: {
    page: "../common/wallet/wallet.html",
    js: "../common/wallet/wallet.js",
    expensePage: "../common/wallet/expense.html",
    expenseJs: "../common/wallet/expense.js",
    profitLoss: "../common/wallet/profit-loss.html",
    payout: "../common/wallet/payout-history.html",
    gst: "../common/wallet/gst-invoice.html"
  },

  // ============ INVENTORY, STAFF, DELIVERY ============
  inventory: {
    page: "../common/inventory/inventory.html",
    js: "../common/inventory/inventory.js",
    lowStock: "../common/inventory/low-stock-alert.html",
    history: "../common/inventory/stock-history.html",
    barcode: "../common/inventory/barcode-scanner.html"
  },
  staff: {
    list: "../common/staff/staff-list.html",
    add: "../common/staff/staff-add.html",
    permissionJs: "../common/staff/staff-permission.js",
    attendance: "../common/staff/staff-attendance.html"
  },
  delivery: {
    assignPage: "../common/delivery/delivery-boy-assign.html",
    assignJs: "../common/delivery/delivery-boy-assign.js",
    status: "../common/delivery/delivery-status.html",
    routeJs: "../common/delivery/delivery-route-optimize.js",
    proof: "../common/delivery/delivery-proof.html",
    self: "../common/delivery/self-delivery.html"
  },

  // ============ MARKETING, REVIEWS, WISHLIST ============
  marketing: {
    couponsPage: "../common/marketing/coupons.html",
    couponsJs: "../common/marketing/coupons.js",
    applyCouponJs: "../common/marketing/apply-coupon.js",
    referralPage: "../common/marketing/referral.html",
    referralJs: "../common/marketing/referral.js",
    loyaltyPage: "../common/marketing/loyalty-points.html",
    loyaltyJs: "../common/marketing/loyalty.js",
    push: "../common/marketing/push-notification.html",
    whatsapp: "../common/marketing/whatsapp-marketing.html",
    festival: "../common/marketing/festival-offers.html"
  },
  reviews: {
    page: "../common/reviews/reviews.html",
    js: "../common/reviews/reviews.js",
    widget: "../common/reviews/rating-widget.html",
    write: "../common/reviews/write-review.html",
    reply: "../common/reviews/review-reply.html",
    fakeFilter: "../common/reviews/fake-review-filter.js"
  },
  wishlist: {
    page: "../common/wishlist/wishlist.html",
    js: "../common/wishlist/wishlist.js",
    compare: "../common/wishlist/compare-products.html"
  },

  // ============ SHARE, SUPPORT, LEGAL, LIVE, SUBSCRIPTION ============
  share: {
    qrPage: "../common/share/qr-share.html",
    qrJs: "../common/share/qr-share.js",
    whatsappJs: "../common/share/whatsapp-share.js",
    instaJs: "../common/share/instagram-story-share.js",
    linkPage: "../common/share/shop-link-share.html"
  },
  support: {
    helpPage: "../common/support/help.html",
    helpJs: "../common/support/help.js",
    chat: "../common/support/chat-support.html",
    report: "../common/support/report-issue.html",
    dispute: "../common/support/dispute-resolution.html"
  },
  legal: {
    about: "../common/legal/about.html",
    contact: "../common/legal/contact.html",
    privacy: "../common/legal/privacy-policy.html",
    terms: "../common/legal/terms.html",
    returnPolicy: "../common/legal/return-policy.html",
    shipping: "../common/legal/shipping-policy.html",
    fssai: "../common/legal/fssai-license.html"
  },
  live: {
    stream: "../common/live/live-stream.html",
    chat: "../common/live/live-chat.html",
    orders: "../common/live/live-orders.html"
  },
  subscription: {
    plans: "../common/subscription/subscription-plans.html",
    js: "../common/subscription/subscription.js",
    mySubs: "../common/subscription/my-subscriptions.html"
  },
  notifications: {
    page: "../common/notifications/notifications.html",
    js: "../common/notifications/notifications.js"
  },
  banner: {
    page: "../common/banner/banner.html",
    js: "../common/banner/banner.js"
  },

  // ============ COMPONENTS ============
  components: {
    // File: common/components/dashboard-header.html - dashboard top
    dHeader: "../common/components/dashboard-header.html",
    dSidebar: "../common/components/sidebar.html",
    dFooter: "../common/components/dashboard-footer.html",
    uHeader: "../common/components/user-header.html",
    uFooter: "../common/components/user-footer.html",
    shopHeader: "../common/components/shop-header.html",
    statusBadge: "../common/components/shop-status-badge.html",
    productCard: "../common/components/product-card.html",
    productCardJs: "../common/components/product-card.js",
    empty: "../common/components/empty-state.html",
    loader: "../common/components/loader.html",
    confirm: "../common/components/confirm-modal.html",
    toast: "../common/components/toast.html"
  },

  // ============ UTILS ============
  utils: {
    search: "../common/js/search.js",
    filter: "../common/js/filter.js",
    wishlist: "../common/js/wishlist.js",
    review: "../common/js/review.js",
    share: "../common/js/share.js"
  },

  // ============ LOADER FUNCTION ============
  loadScript: function(src){ return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); },
  loadComponent: async function(url, targetId){ try{ const r=await fetch(url); const html=await r.text(); const el=document.getElementById(targetId); if(el) el.innerHTML=html; }catch(e){console.warn("Component load fail:",url)} },

  // ============ DASHBOARD INIT ============
  initDashboard: async function(){
    console.log("SAMAN: Dashboard Bridge Init");
    // Core load
    await this.loadScript(this.core.dashboardCore);
    await this.loadScript(this.core.shopToggle);
    await this.loadScript(this.core.authCore);
    await this.loadScript(this.utils.search);
    await this.loadScript(this.utils.filter);
    // Components load
    await this.loadComponent(this.components.dHeader, "saman-d-header");
    await this.loadComponent(this.components.dSidebar, "saman-d-sidebar");
    await this.loadComponent(this.components.dFooter, "saman-d-footer");
    await this.loadComponent(this.components.toast, "saman-toast");
    await this.loadComponent(this.components.confirm, "saman-confirm");
    await this.loadComponent(this.components.loader, "saman-loader");
    // Common facilities link
    await this.loadComponent(this.ownerOrders.newPopup, "saman-new-order-popup");
    await this.loadComponent(this.banner.page, "saman-banner");
    await this.loadComponent(this.notifications.page, "saman-notifications");
  },

  // ============ USER-VIEW INIT ============
  initUserView: async function(){
    console.log("SAMAN: User-View Bridge Init");
    await this.loadScript(this.core.userCore);
    await this.loadScript(this.core.shopStatus);
    await this.loadScript(this.cart.core);
    await this.loadScript(this.cart.count);
    await this.loadScript(this.utils.search);
    await this.loadScript(this.utils.filter);
    await this.loadScript(this.utils.wishlist);
    await this.loadScript(this.utils.review);
    await this.loadScript(this.utils.share);
    await this.loadScript(this.share.whatsappJs);
    await this.loadScript(this.share.qrJs);
    await this.loadScript(this.marketing.applyCouponJs);
    // Components
    await this.loadComponent(this.components.uHeader, "saman-u-header");
    await this.loadComponent(this.components.uFooter, "saman-u-footer");
    await this.loadComponent(this.components.shopHeader, "saman-shop-header");
    await this.loadComponent(this.components.statusBadge, "saman-status-badge");
    await this.loadComponent(this.cart.drawer, "saman-cart-drawer");
    await this.loadComponent(this.components.toast, "saman-toast");
    await this.loadComponent(this.reviews.widget, "saman-rating-widget");
  }
};