// LOCATION: public/shop-templates/common/core/user-core.js - V10 COOKIE PERSIST - FULL CODE
// RULE: Buyer ID pehle AuthCore / Cookie wale User se banega - CartCore wale Guest se nahi
// RULE: Token nahi hai toh Server ko Profile mat maango - 401 wala loop band
// RULE: Purane naam sab wahi hain - getUser / getAddresses / addAddress / getBuyerId / getRole / getToken / getProfilePic / uploadProfilePic / updateProfile
(function(){
  window.UserCore = window.UserCore || {};
  function getCookie(name){
    try{
      var parts = document.cookie.split(';');
      for(var i = 0; i < parts.length; i++){
        var p = parts[i].trim();
        if(p.indexOf(name + '=') === 0) return decodeURIComponent(p.substring(name.length + 1));
      }
    }catch(e){}
    return '';
  }
  function setCookie(name, value, days){
    try{
      var d = new Date();
      d.setTime(d.getTime() + (days || 7) * 24 * 60 * 60 * 1000);
      document.cookie = name + '=' + encodeURIComponent(value || '') + '; expires=' + d.toUTCString() + '; path=/; SameSite=Lax';
    }catch(e){}
  }
  function getBuyerId(){
    try{
      if(window.AuthCore && window.AuthCore.getUserId){
        var aid = window.AuthCore.getUserId();
        if(aid && String(aid).length >= 10) return String(aid).indexOf('user_') === 0 ? String(aid) : ('user_' + String(aid));
      }
    }catch(e){}
    var cookieUid = getCookie('SL_UID') || window.USER_ID || '';
    if(cookieUid && String(cookieUid).length >= 10) return String(cookieUid).indexOf('user_') === 0 ? String(cookieUid) : ('user_' + String(cookieUid));
    if(window.currentUser && window.currentUser._id) return 'user_' + String(window.currentUser._id);
    if(window.CartCore && window.CartCore.getBuyerId){ var id = window.CartCore.getBuyerId(); if(id) return id; }
    return window.__SAMAN_GUEST_ID || ('guest_' + Date.now());
  }
  function getRole(){
    if(window.AuthCore && window.AuthCore.getRole){
      var r = window.AuthCore.getRole();
      if(r && r !== 'customer') return r;
    }
    var cr = getCookie('SL_ROLE') || window.USER_ROLE || '';
    if(cr) return cr;
    if(window.RoleHierarchy && window.RoleHierarchy.getMyRole) return window.RoleHierarchy.getMyRole();
    return 'customer';
  }
  function getToken(){
    try{ if(window.AuthCore && window.AuthCore.getToken){ var t = window.AuthCore.getToken() || ''; if(t) return t; } }catch(e){}
    var c = getCookie('SL_TOKEN') || '';
    if(c){ window.USER_TOKEN = c; return c; }
    return window.USER_TOKEN || '';
  }
  function syncRam(user){
    if(!user) return user;
    window.currentUser = user;
    if(user._id){ window.USER_ID = user._id; setCookie('SL_UID', user._id, 7); }
    if(user.role){ window.USER_ROLE = user.role; setCookie('SL_ROLE', user.role, 7); }
    if(user.name) window.USER_NAME = user.name;
    if(user.phone) window.USER_PHONE = user.phone;
    var pic = user.profilePic || user.avatar || user.photo || '';
    if(pic) window.USER_PIC = pic;
    return user;
  }
  async function getUser(){
    var token = getToken();
    if(!token) return window.currentUser || null;
    var buyerId = getBuyerId();
    try{
      var url = '/api/common/profile/me?buyerId=' + encodeURIComponent(buyerId);
      var res = await fetch(url, { headers: { 'x-buyer-id': buyerId, 'Authorization': 'Bearer ' + token }, cache: 'no-store' }).catch(function(){ return null; });
      var data = res ? await res.json().catch(function(){ return null; }) : null;
      if(data && data.success && data.user && data.user._id){ console.log('UserCore user from /common/profile/me'); return syncRam(data.user); }
      res = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token }, cache: 'no-store' }).catch(function(){ return null; });
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
    if(!token) return window.__SAMAN_SELECTED_ADDRESS ? [window.__SAMAN_SELECTED_ADDRESS] : [];
    try{
      var res = await fetch('/api/common/profile/me?buyerId=' + encodeURIComponent(buyerId), { headers: { 'x-buyer-id': buyerId, 'Authorization': 'Bearer ' + token } }).catch(function(){ return null; });
      var data = res ? await res.json().catch(function(){ return null; }) : null;
      if(data && data.success && data.user && Array.isArray(data.user.addresses) && data.user.addresses.length > 0) return data.user.addresses;
      res = await fetch('/api/user/addresses?buyerId=' + encodeURIComponent(buyerId), { headers: { 'x-buyer-id': buyerId, 'Authorization': 'Bearer ' + token } }).catch(function(){ return null; });
      data = res ? await res.json().catch(function(){ return null; }) : null;
      var addrs = (data && (data.addresses || data.data)) || (Array.isArray(data) ? data : []);
      if(Array.isArray(addrs) && addrs.length > 0) return addrs;
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
    if(!getToken()) return;
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
  console.log('UserCore V10 loaded - Cookie persist - buyerId=', getBuyerId(), 'role=', getRole());
})();