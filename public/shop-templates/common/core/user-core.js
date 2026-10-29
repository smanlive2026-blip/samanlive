// LOCATION: public/shop-templates/common/core/user-core.js - V8 FINAL WORLD CLASS - COMMON PROFILE + ADDRESS + WALLET + ROLE + CLOUDINARY CONNECTED
(function(){
  window.UserCore = window.UserCore || {};

  // ===== BUYER ID - 3 LAYER - WORLD CLASS - MAIN APP CONNECTED =====
  function getBuyerId(){
    // 1. CartCore (guest_id + user_xxx) - sabse fresh
    if(window.CartCore && window.CartCore.getBuyerId){
      const id = window.CartCore.getBuyerId();
      if(id) return id;
    }
    // 2. AuthCore
    if(window.AuthCore && window.AuthCore.getUserId){
      const id = window.AuthCore.getUserId();
      if(id && String(id).length>=10) return id.startsWith('user_') ? id : 'user_'+id;
    }
    // 3. localStorage fallback - main app se
    try{
      let id = localStorage.getItem('USER_ID') || window.USER_ID || localStorage.getItem('lm_user') || localStorage.getItem('userId') || '';
      if(id){
        // Agar JSON hai to parse
        try{ const parsed = JSON.parse(id); if(parsed._id) id = parsed._id; }catch(e){}
        if(String(id).length>=10) return String(id).startsWith('user_') ? String(id) : 'user_'+String(id);
      }
      let gid = sessionStorage.getItem('guest_id') || localStorage.getItem('guest_id') || localStorage.getItem('guestId') || localStorage.getItem('guest_id') || '';
      if(gid) return gid;
    }catch(e){}
    return 'guest_' + Date.now();
  }

  function getRole(){
    if(window.RoleHierarchy && window.RoleHierarchy.getMyRole) return window.RoleHierarchy.getMyRole();
    if(window.AuthCore && window.AuthCore.getRole) return window.AuthCore.getRole();
    return localStorage.getItem('USER_ROLE') || localStorage.getItem('lm_role') || localStorage.getItem('USER_ROLE') || 'customer';
  }

  function getToken(){
    return (window.AuthCore && window.AuthCore.getToken && window.AuthCore.getToken()) || localStorage.getItem('TOKEN') || localStorage.getItem('token') || localStorage.getItem('userToken') || localStorage.getItem('lm_token') || '';
  }

  // ===== GET USER - COMMON PROFILE + AUTH/ME + CLOUDINARY =====
  async function getUser(){
    const buyerId = getBuyerId();
    const token = getToken();
    try{
      // 1. Common profile - V7 NEW - main fix - Cloudinary URL yahi se aayega
      let url = `/api/common/profile/me?buyerId=${encodeURIComponent(buyerId)}`;
      let res = await fetch(url, {
        headers: { 'x-buyer-id': buyerId, ...(token?{ 'Authorization': `Bearer ${token}` }: {}) },
        cache: 'no-store'
      }).catch(()=>null);
      let data = res ? await res.json().catch(()=>null) : null;
      if(data && data.success && data.user && data.user._id){
        // Sync localStorage - main app + shop template dono ke liye
        try{
          localStorage.setItem('USER_ID', data.user._id);
          localStorage.setItem('USER_NAME', data.user.name||'');
          localStorage.setItem('USER_PHONE', data.user.phone||'');
          localStorage.setItem('USER_ROLE', data.user.role||'customer');
          const pic = data.user.profilePic || data.user.avatar || data.user.profilePic || '';
          if(pic){
            localStorage.setItem('userPic', pic);
            localStorage.setItem('USER_PIC', pic);
            localStorage.setItem('avatar', pic);
          }
          window.USER_ID = data.user._id;
          window.USER_ROLE = data.user.role;
          window.currentUser = data.user;
          // cached user bhi update
          localStorage.setItem('lm_user', JSON.stringify(data.user));
          localStorage.setItem('currentUser', JSON.stringify(data.user));
        }catch(e){}
        console.log('✅ UserCore V8 user from /common/profile/me - Cloudinary pic:', data.user.profilePic||data.user.avatar||'no pic');
        return data.user;
      }

      // 2. Fallback /api/auth/me - main app old
      res = await fetch('/api/auth/me', {
        headers: { ...(token?{ 'Authorization': `Bearer ${token}` }: {}) },
        cache: 'no-store'
      }).catch(()=>null);
      data = res ? await res.json().catch(()=>null) : null;
      const user = data?.user || data?.data || null;
      if(user && user._id){
        try{
          localStorage.setItem('USER_ID', user._id);
          localStorage.setItem('USER_ROLE', user.role||'customer');
          const pic = user.profilePic || user.avatar || '';
          if(pic) localStorage.setItem('userPic', pic);
          window.USER_ID = user._id;
          window.currentUser = user;
          localStorage.setItem('lm_user', JSON.stringify(user));
        }catch(e){}
        console.log('✅ UserCore V8 user from /auth/me');
        return user;
      }

      // 3. LocalStorage cached user - offline support
      try{
        const cached = localStorage.getItem('lm_user') || localStorage.getItem('currentUser') || '';
        if(cached){
          const u = JSON.parse(cached);
          if(u && u._id){
            console.log('✅ UserCore V8 user from cache');
            return u;
          }
        }
      }catch(e){}

      return null;
    }catch(e){
      console.log('UserCore getUser fail', e.message);
      return null;
    }
  }

  // ===== GET PROFILE PIC - CLOUDINARY - WORLD CLASS =====
  function getProfilePic(){
    try{
      // Priority 1: currentUser
      if(window.currentUser){
        const pic = window.currentUser.profilePic || window.currentUser.avatar || '';
        if(pic && pic.startsWith('http')) return pic;
      }
      // Priority 2: localStorage userPic - Cloudinary URL
      const lp = localStorage.getItem('userPic') || localStorage.getItem('USER_PIC') || localStorage.getItem('avatar') || '';
      if(lp && lp.startsWith('http')) return lp;
      // Priority 3: lm_user cache
      try{
        const cached = JSON.parse(localStorage.getItem('lm_user') || '{}');
        const cp = cached.profilePic || cached.avatar || '';
        if(cp && cp.startsWith('http')) return cp;
      }catch(e){}
      return '/assets/default-avatar.png';
    }catch(e){
      return '/assets/default-avatar.png';
    }
  }

  // ===== UPLOAD PROFILE PIC - CLOUDINARY MANDATORY =====
  async function uploadProfilePic(file){
    const buyerId = getBuyerId();
    const token = getToken();
    if(!file) throw new Error('File required');

    const formData = new FormData();
    formData.append('profilePic', file);
    formData.append('buyerId', buyerId);

    // Try 1: /api/common/profile/upload-avatar - NEW V7
    try{
      const res = await fetch('/api/common/profile/upload-avatar', {
        method: 'POST',
        headers: { 'x-buyer-id': buyerId, ...(token?{ 'Authorization': `Bearer ${token}` }: {}) },
        body: formData
      });
      const data = await res.json();
      if(data.success && data.url){
        try{
          localStorage.setItem('userPic', data.url);
          localStorage.setItem('USER_PIC', data.url);
          if(window.currentUser){
            window.currentUser.profilePic = data.url;
            window.currentUser.avatar = data.url;
            localStorage.setItem('lm_user', JSON.stringify(window.currentUser));
          }
        }catch(e){}
        return { success: true, url: data.url, user: data.user };
      }
    }catch(e){ console.log('upload-avatar fail', e.message); }

    // Try 2: /api/media/upload-pic - fallback
    try{
      const res = await fetch('/api/media/upload-pic', {
        method: 'POST',
        headers: { 'x-buyer-id': buyerId, ...(token?{ 'Authorization': `Bearer ${token}` }: {}) },
        body: formData
      });
      const data = await res.json();
      if(data.success && data.url){
        try{ localStorage.setItem('userPic', data.url); }catch(e){}
        return { success: true, url: data.url };
      }
    }catch(e){}

    return { success: false, message: 'Upload failed' };
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

  // ===== UPDATE PROFILE =====
  async function updateProfile(updates){
    const buyerId = getBuyerId();
    const token = getToken();
    try{
      const res = await fetch('/api/common/profile/update', {
        method: 'PUT',
        headers: { 'x-buyer-id': buyerId, 'Content-Type': 'application/json', ...(token?{ 'Authorization': `Bearer ${token}` }: {}) },
        body: JSON.stringify({ ...updates, buyerId })
      });
      const data = await res.json();
      if(data.success && data.user){
        try{
          localStorage.setItem('USER_NAME', data.user.name||'');
          if(data.user.profilePic) localStorage.setItem('userPic', data.user.profilePic);
          window.currentUser = data.user;
          localStorage.setItem('lm_user', JSON.stringify(data.user));
        }catch(e){}
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

  // ===== INIT - AUTO LOAD - MAIN APP CONNECT =====
  async function init(){
    try{
      const user = await getUser();
      if(user){
        // Dispatch event for other cores
        window.dispatchEvent(new CustomEvent('user:loaded', { detail: user }));
        // Update all avatar images on page
        try{
          const pic = getProfilePic();
          document.querySelectorAll('img[data-user-avatar], #profileUserPic, #userProfilePic, .user-avatar-img').forEach(img=>{
            if(pic && pic.startsWith('http')) img.src = pic;
          });
        }catch(e){}
      }
    }catch(e){}
  }

  // Auto init on DOM ready
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', ()=> setTimeout(init, 500));
  } else {
    setTimeout(init, 500);
  }

  window.UserCore.getUser = getUser;
  window.UserCore.getAddresses = getAddresses;
  window.UserCore.addAddress = addAddress;
  window.UserCore.getBuyerId = getBuyerId;
  window.UserCore.getRole = getRole;
  window.UserCore.getToken = getToken;
  window.UserCore.getCurrentUserSync = getCurrentUserSync;
  window.UserCore.getUserId = getBuyerId;
  window.UserCore.getProfilePic = getProfilePic;
  window.UserCore.uploadProfilePic = uploadProfilePic;
  window.UserCore.updateProfile = updateProfile;
  window.UserCore.init = init;

  console.log('✅ UserCore V8 FINAL WORLD CLASS - common profile + address 3 layer + Cloudinary + lm_user compat - buyerId=', getBuyerId(), 'role=', getRole(), 'pic=', getProfilePic().slice(0,30));
})();