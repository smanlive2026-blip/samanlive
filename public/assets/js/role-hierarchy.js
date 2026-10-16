// LOCATION: public/assets/js/role-hierarchy.js - V1 HIERARCHY - MINIMAL localStorage
// Ye file sabse pehle load hogi - app.js, cart-core.js, product-manager.js se pehle
(function(){
  const HIERARCHY = {
    admin: [], // admin kisi se nahi kharidega
    area_manager: ['admin'],
    shop_owner: ['admin', 'area_manager'],
    customer: ['shop_owner', 'area_manager', 'admin']
  };

  window.RoleHierarchy = {
    // Server se role ayega, localStorage fallback sirf emergency
    getMyRole() {
      // 1. Pehle window se (server ne inject kiya ho ya auth-core.js ne set kiya ho)
      if (window.USER_ROLE) return window.USER_ROLE;
      if (window.AuthCore && window.AuthCore.getRole) {
        const r = window.AuthCore.getRole();
        if (r) return r;
      }
      // 2. Last option - localStorage (kam se kam use)
      try {
        const ls = localStorage.getItem('USER_ROLE');
        if (ls) return ls;
      } catch(e){}
      return 'customer'; // guest = customer
    },

    getMyId() {
      if (window.USER_ID) return window.USER_ID;
      if (window.AuthCore && window.AuthCore.getUserId) return window.AuthCore.getUserId();
      try { return localStorage.getItem('USER_ID') || null; } catch(e){ return null; }
    },

    getMyShopId() {
      if (window.MY_SHOP_ID) return window.MY_SHOP_ID;
      const url = new URLSearchParams(location.search);
      return url.get('shopId') || url.get('shop_id') || null;
    },

    canBuy(buyerRole, supplierRole, buyerId, supplierId) {
      buyerRole = buyerRole || this.getMyRole();
      if (!buyerRole) buyerRole = 'customer';
      // Self-buy block - apni hi shop se nahi
      if (buyerId && supplierId && buyerId === supplierId) return false;
      // Same role block - customer customer se nahi, shop_owner apne jaisa se nahi
      if (buyerRole === supplierRole) {
        // customer ko allow hai sabse, but same shop se nahi
        if (buyerRole === 'customer') return buyerId!== supplierId;
        return false;
      }
      const allowed = HIERARCHY[buyerRole] || [];
      return allowed.includes(supplierRole);
    },

    // Server se products filter karne ke liye - kis role ke products dikhane hai
    getAllowedSupplierRoles() {
      const myRole = this.getMyRole();
      return HIERARCHY[myRole] || HIERARCHY['customer'];
    },

    // UI ke liye - Add to Cart button dikhana hai ya nahi
    shouldShowAddButton(product) {
      const myRole = this.getMyRole();
      const myId = this.getMyId();
      const myShopId = this.getMyShopId();
      const supplierRole = product.ownerRole || product.shopOwnerRole || 'shop_owner';
      const supplierId = product.ownerId || product.shopId || product.shop_id;

      // Agar product me ownerRole nahi hai toh default shop_owner samjho
      return this.canBuy(myRole, supplierRole, myId || myShopId, supplierId);
    }
  };

  console.log('✅ RoleHierarchy loaded - MyRole:', window.RoleHierarchy.getMyRole());
})();