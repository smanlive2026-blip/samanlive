// LOCATION: public/shop-templates/common/core/user-core.js - V9 RAM ONLY - FULL CODE - NO CUT
// RULE: User / Address / Photo sab Server se aayega - RAM me hi rahega - Kahin save nahi hoga
// RULE: Buyer ID CartCore se lega - CartCore nahi hai toh AuthCore se - Apna alag ID kabhi nahi banayega
// RULE: Photo upload UnifiedProfile se hoga - Yahan se seedha Cloudinary pe jayega - Yahan se kahin save nahi hoga
(function(){
  window.UserCore = window.UserCore || {};
  function getBuyerId(){
    if(window.CartCore && window.CartCore.getBuyerId){ var id = window.CartCore.getBuyerId(); if(id) return id; }
    if(window.AuthCore && window.AuthCore.getUserId){
      var aid = window.AuthCore.getUserId();
      if(aid && String(aid).length >= 10) return String(aid).indexOf('user_') === 0 ? String(aid) : ('user_' + String(aid));
    }
    if(window.currentUser && window.currentUser._id) return 'user_' + String(window.currentUser._id);
    if(window.USER_ID) return 'user_' + String(window.USER_ID);
    return window.__SAMAN_GUEST_ID || ('guest_' + Date.now());
  }
  function getRole(){
    if(window.RoleHierarchy && window.RoleHierarchy.getMyRole) return window.RoleHierarchy.getMyRole();
    if(window.AuthCore && window.AuthCore.getRole) return window.AuthCore.getRole();
    return window.USER_ROLE || 'customer';
  }
  function getToken(){
    try{ if(window.AuthCore && window.AuthCore.getToken) return window.AuthCore.getToken() || ''; }catch(e){}
    return window.USER_TOKEN || '';
  }
  function syncRam(user){
    if(!user) return user;
    window.currentUser = user;
    if(user._id) window.USER_ID = user._id;
    if(user.role) window.USER_ROLE = user.role;
    if(user.name) window.USER_NAME = user.name;
    if(user.phone) window.USER_PHONE = user.phone;
    var pic = user.profilePic || user.avatar || user.photo || '';
    if(pic) window.USER_PIC = pic;
    return user;
  }
  async function getUser(){
    var buyerId = getBuyerId();
    var token = getToken();
    try{
      var url = '/api/common/profile/me?buyerId=' + encodeURIComponent(buyerId);
      var res = await fetch(url, { headers: { 'x-buyer-id': buyerId, 'Authorization': token ? ('Bearer ' + token) : '' }, cache: 'no-store' }).catch(function(){ return null; });
      var data = res ? await res.json().catch(function(){ return null; }) : null;
      if(data && data.success && data.user && data.user._id){ console.log('UserCore user from /common/profile/me - Cloudinary pic:', data.user.profilePic || data.user.avatar || 'no pic'); return syncRam(data.user); }
      res = await fetch('/api/auth/me', { headers: { 'Authorization': token ? ('Bearer ' + token) : '' }, cache: 'no-store' }).catch(function(){ return null; });
      data = res ? await res.json().catch(function(){ return null; }) : null;
      var user = (data && (data.user || data.data)) || null;
      if(user && user._id){ console.log('UserCore user from /auth/me'); return syncRam(user); }
      return window.currentUser || null;
    }catch(e){ console.log('UserCore getUser fail', e.message); return window.currentUser || null; }
  }
  function getProfilePic(){
    try{
      if(window.currentUser){
        var pic = window.currentUser.profilePic || window.currentUser.avatar || window.currentUser.photo || '';
        if(pic && pic.indexOf('http') === 0) return pic;
      }
      if(window.USER_PIC && window.USER_PIC.indexOf('http') === 0) return window.USER_PIC;
      return '/assets/default-avatar.png';
    }catch(e){ return '/assets/default-avatar.png'; }
  }
  async function uploadProfilePic(file){
    if(!file) throw new Error('File required');
    if(window.UnifiedProfile && window.UnifiedProfile.handleFileInput){
      var fakeInput = { files: [file] };
      var r = await window.UnifiedProfile.handleFileInput(fakeInput, { role: 'customer', previewSelector: '#userProfilePic' });
      if(r && r.success && r.url){ if(window.currentUser) window.currentUser.profilePic = r.url; window.USER_PIC = r.url; }
      return r;
    }
    var buyerId = getBuyerId();
    var token = getToken();
    var fd = new FormData();
    fd.append('profilePic', file);
    fd.append('buyerId', buyerId);
    fd.append('role', 'customer');
    try{
      var res = await fetch('/api/common/profile/upload-avatar', { method: 'POST', headers: { 'x-buyer-id': buyerId, 'Authorization': token ? ('Bearer ' + token) : '' }, body: fd });
      var data = await res.json();
      if(data.success && data.url){ if(window.currentUser) window.currentUser.profilePic = data.url; window.USER_PIC = data.url; return { success: true, url: data.url, user: data.user }; }
      return data;
    }catch(e){ return { success: false, message: e.message }; }
  }
  async function getAddresses(){
    var buyerId = getBuyerId();
    var token = getToken();
    try{
      var res = await fetch('/api/common/profile/me?buyerId=' + encodeURIComponent(buyerId), { headers: { 'x-buyer-id': buyerId, 'Authorization': token ? ('Bearer ' + token) : '' } }).catch(function(){ return null; });
      var data = res ? await res.json().catch(function(){ return null; }) : null;
      if(data && data.success && data.user && Array.isArray(data.user.addresses) && data.user.addresses.length > 0){ console.log('UserCore addresses from common profile:', data.user.addresses.length); return data.user.addresses; }
      res = await fetch('/api/user/addresses?buyerId=' + encodeURIComponent(buyerId), { headers: { 'x-buyer-id': buyerId, 'Authorization': token ? ('Bearer ' + token) : '' } }).catch(function(){ return null; });
      data = res ? await res.json().catch(function(){ return null; }) : null;
      var addrs = (data && (data.addresses || data.data)) || (Array.isArray(data) ? data : []);
      if(Array.isArray(addrs) && addrs.length > 0){ console.log('UserCore addresses from /user/addresses:', addrs.length); return addrs; }
      if(window.__SAMAN_SELECTED_ADDRESS) return [window.__SAMAN_SELECTED_ADDRESS];
      return [];
    }catch(e){ console.log('UserCore getAddresses fail', e.message); return []; }
  }
  async function addAddress(address){
    var buyerId = getBuyerId();
    var token = getToken();
    try{
      var res = await fetch('/api/user/addresses', { method: 'POST', headers: { 'x-buyer-id': buyerId, 'Content-Type': 'application/json', 'Authorization': token ? ('Bearer ' + token) : '' }, body: JSON.stringify(Object.assign({}, address, { buyerId: buyerId })) });
      var data = await res.json();
      if(data.success && data.address){
        window.__SAMAN_SELECTED_ADDRESS = data.address;
        window.__SAMAN_SELECTED_ADDRESS_ID = data.address._id || '';
        window.__SAMAN_SELECTED_ADDRESS_TEXT = data.address.full || address.line1 || '';
        if(window.CheckoutCore && window.CheckoutCore.setSelectedAddress) window.CheckoutCore.setSelectedAddress(data.address);
      }
      return data;
    }catch(e){ return { success: false, message: e.message }; }
  }
  async function updateProfile(updates){
    var buyerId = getBuyerId();
    var token = getToken();
    try{
      var res = await fetch('/api/common/profile/update', { method: 'PUT', headers: { 'x-buyer-id': buyerId, 'Content-Type': 'application/json', 'Authorization': token ? ('Bearer ' + token) : '' }, body: JSON.stringify(Object.assign({}, updates, { buyerId: buyerId })) });
      var data = await res.json();
      if(data.success && data.user) syncRam(data.user);
      return data;
    }catch(e){ return { success: false, message: e.message }; }
  }
  function getCurrentUserSync(){ return window.currentUser || null; }
  async function init(){
    try{
      var user = await getUser();
      if(user){
        window.dispatchEvent(new CustomEvent('user:loaded', { detail: user }));
        try{
          var pic = getProfilePic();
          document.querySelectorAll('img[data-user-avatar], #profileUserPic, #userProfilePic, .user-avatar-img').forEach(function(img){ if(pic && pic.indexOf('http') === 0) img.src = pic; });
        }catch(e){}
      }
    }catch(e){}
  }
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 500); }); } else { setTimeout(init, 500); }
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
  console.log('UserCore V9 loaded - RAM only - buyerId=', getBuyerId(), 'role=', getRole());
})();