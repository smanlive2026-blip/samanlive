// LOCATION: public/shop-templates/common/core/user-core.js - V7 FINAL WORLD CLASS - COMMON PROFILE + ADDRESS + WALLET + ROLE FIXED
(function(){
  window.UserCore = window.UserCore || {};

  // ===== BUYER ID - 3 LAYER - WORLD CLASS =====
  function getBuyerId(){
    // 1. CartCore (guest_id + user_xxx)
    if(window.CartCore && window.CartCore.getBuyerId){
      const id = window.CartCore.getBuyerId();
      if(id) return id;
    }
    // 2. AuthCore
    if(window.AuthCore && window.AuthCore.getUserId){
      const id = window.AuthCore.getUserId();
      if(id && String(id).length>=10) return id.startsWith('user_') ? id : 'user_'+id;
    }
    // 3. localStorage fallback - tere purane logic se
    try{
      let id = localStorage.getItem('USER_ID') || window.USER_ID || localStorage.getItem('lm_user') || '';
      if(id){
        // Agar JSON hai to parse
        try{ const parsed = JSON.parse(id); if(parsed._id) id = parsed._id; }catch(e){}
        if(String(id).length>=10) return String(id).startsWith('user_') ? String(id) : 'user_'+String(id);
      }
      let gid = sessionStorage.getItem('guest_id') || localStorage.getItem('guest_id') || localStorage.getItem('guestId') || '';
      if(gid) return gid;
    }catch(e){}
    return 'guest_' + Date.now();
  }

  function getRole(){
    if(window.RoleHierarchy && window.RoleHierarchy.getMyRole) return window.RoleHierarchy.getMyRole();
    if(window.AuthCore && window.AuthCore.getRole) return window.AuthCore.getRole();
    return localStorage.getItem('USER_ROLE') || localStorage.getItem('lm_role') || 'customer';
  }

  function getToken(){
    return (window.AuthCore && window.AuthCore.getToken && window.AuthCore.getToken()) || localStorage.getItem('TOKEN') || localStorage.getItem('token') || localStorage.getItem('userToken') || localStorage.getItem('lm_token') || '';
  }

  // ===== GET USER - COMMON PROFILE + AUTH/ME =====
  async function getUser(){
    const buyerId = getBuyerId();
    const token = getToken();
    try{
      // 1. Common profile - main fix
      let url = `/api/common/profile/me?buyerId=${encodeURIComponent(buyerId)}`;
      let res = await fetch(url, {
        headers: { 'x-buyer-id': buyerId, ...(token?{ 'Authorization': `Bearer ${token}` }: {}) }
      }).catch(()=>null);
      let data = res ? await res.json().catch(()=>null) : null;
      if(data && data.success && data.user && data.user._id){
        // Sync localStorage
        try{
          localStorage.setItem('USER_ID', data.user._id);
          localStorage.setItem('USER_NAME', data.user.name||'');
          localStorage.setItem('USER_PHONE', data.user.phone||'');
          localStorage.setItem('USER_ROLE', data.user.role||'customer');
          if(data.user.profilePic) localStorage.setItem('userPic', data.user.profilePic);
          window.USER_ID = data.user._id;
          window.USER_ROLE = data.user.role;
          window.currentUser = data.user;
        }catch(e){}
        return data.user;
      }

      // 2. Fallback /api/auth/me
      res = await fetch('/api/auth/me', {
        headers: { ...(token?{ 'Authorization': `Bearer ${token}` }: {}) }
      }).catch(()=>null);
      data = res ? await res.json().catch(()=>null) : null;
      const user = data?.user || data?.data || null;
      if(user && user._id){
        try{
          localStorage.setItem('USER_ID', user._id);
          localStorage.setItem('USER_ROLE', user.role||'customer');
          window.USER_ID = user._id;
          window.currentUser = user;
        }catch(e){}
        return user;
      }

      // 3. LocalStorage cached user
      try{
        const cached = localStorage.getItem('lm_user') || localStorage.getItem('currentUser') || '';
        if(cached){
          const u = JSON.parse(cached);
          if(u && u._id) return u;
        }
      }catch(e){}

      return null;
    }catch(e){
      console.log('UserCore getUser fail', e.message);
      return null;
    }
  }

  // ===== GET ADDRESSES - 3 LAYER =====
  async function getAddresses(){
    const buyerId = getBuyerId();
    const token = getToken();
    try{
      // 1. Common profile se addresses
      let res = await fetch(`/api/common/profile/me?buyerId=${encodeURIComponent(buyerId)}`, {
        headers: { 'x-buyer-id': buyerId, ...(token?{ 'Authorization': `Bearer ${token}` }: {}) }
      }).catch(()=>null);
      let data = res ? await res.json().catch(()=>null) : null;
      if(data && data.success && data.user && Array.isArray(data.user.addresses) && data.user.addresses.length>0){
        console.log('✅ UserCore addresses from common profile:', data.user.addresses.length);
        return data.user.addresses;
      }

      // 2. /api/user/addresses
      res = await fetch(`/api/user/addresses?buyerId=${encodeURIComponent(buyerId)}`, {
        headers: { 'x-buyer-id': buyerId, ...(token?{ 'Authorization': `Bearer ${token}` }: {}) }
      }).catch(()=>null);
      data = res ? await res.json().catch(()=>null) : null;
      let addrs = data?.addresses || data?.data || (Array.isArray(data)?data:[]);
      if(Array.isArray(addrs) && addrs.length>0){
        console.log('✅ UserCore addresses from /user/addresses:', addrs.length);
        return addrs;
      }

      // 3. LocalStorage fallback - tere checkout ke liye sabse jaruri
      const localText = localStorage.getItem('selectedAddressText');
      const localId = localStorage.getItem('selectedAddressId');
      if(localText){
        return [{ _id: localId||'local_1', id: localId||'local_1', full: localText, line1: localText, city: '', label: 'Local Address', phone: localStorage.getItem('USER_PHONE')||'' }];
      }

      return [];
    }catch(e){
      console.log('UserCore getAddresses fail', e.message);
      return [];
    }
  }

  // ===== ADD ADDRESS =====
  async function addAddress(address){
    const buyerId = getBuyerId();
    const token = getToken();
    try{
      const res = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'x-buyer-id': buyerId, 'Content-Type': 'application/json', ...(token?{ 'Authorization': `Bearer ${token}` }: {}) },
        body: JSON.stringify({ ...address, buyerId })
      });
      const data = await res.json();
      if(data.success){
        try{ localStorage.setItem('selectedAddressText', data.address?.full || address.line1); localStorage.setItem('selectedAddressId', data.address?._id || 'local_'+Date.now()); }catch(e){}
      }
      return data;
    }catch(e){ return { success: false, message: e.message }; }
  }

  // ===== CURRENT USER SYNC - TERE PURANE CODE KE LIYE =====
  function getCurrentUserSync(){
    try{
      const u = localStorage.getItem('lm_user') || localStorage.getItem('currentUser');
      if(u) return JSON.parse(u);
    }catch(e){}
    return window.currentUser || null;
  }

  window.UserCore.getUser = getUser;
  window.UserCore.getAddresses = getAddresses;
  window.UserCore.addAddress = addAddress;
  window.UserCore.getBuyerId = getBuyerId;
  window.UserCore.getRole = getRole;
  window.UserCore.getToken = getToken;
  window.UserCore.getCurrentUserSync = getCurrentUserSync;
  window.UserCore.getUserId = getBuyerId;

  console.log('✅ UserCore V7 FINAL WORLD CLASS - common profile + address 3 layer + lm_user compat - buyerId=', getBuyerId(), 'role=', getRole());
})();