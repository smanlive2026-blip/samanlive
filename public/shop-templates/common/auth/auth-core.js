// LOCATION: public/shop-templates/common/core/auth-core.js - V8 COOKIE PERSIST - FULL CODE
// RULE: Token Cookie me rahega - Page badalne / Reload hone pe bhi Token nahi udega - Home se Profile tak jayega
// RULE: Purane naam sab wahi hain - getToken / setToken / getUserId / getRole / checkAuth / login / logout / isLoggedIn
(function(){
  window.AuthCore = window.AuthCore || {};
  function setCookie(name, value, days){
    try{
      var d = new Date();
      d.setTime(d.getTime() + (days || 7) * 24 * 60 * 60 * 1000);
      document.cookie = name + '=' + encodeURIComponent(value || '') + '; expires=' + d.toUTCString() + '; path=/; SameSite=Lax';
    }catch(e){}
  }
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
  function eraseCookie(name){
    try{ document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax'; }catch(e){}
  }
  var _token = window.USER_TOKEN || getCookie('SL_TOKEN') || '';
  var _userId = window.USER_ID || getCookie('SL_UID') || '';
  var _role = window.USER_ROLE || getCookie('SL_ROLE') || 'customer';
  var _user = window.currentUser || null;
  if(_token) window.USER_TOKEN = _token;
  if(_userId) window.USER_ID = _userId;
  if(_role) window.USER_ROLE = _role;
  function getToken(){
    if(_token) return _token;
    if(window.USER_TOKEN){ _token = window.USER_TOKEN; return _token; }
    var c = getCookie('SL_TOKEN');
    if(c){ _token = c; window.USER_TOKEN = c; return c; }
    return '';
  }
  function setToken(token){
    if(!token) return;
    _token = token;
    window.USER_TOKEN = token;
    setCookie('SL_TOKEN', token, 7);
  }
  function clearToken(){ _token = ''; window.USER_TOKEN = ''; eraseCookie('SL_TOKEN'); }
  function getUserId(){
    if(_userId) return _userId;
    if(window.USER_ID){ _userId = window.USER_ID; return _userId; }
    var c = getCookie('SL_UID');
    if(c){ _userId = c; window.USER_ID = c; return c; }
    if(_user && _user._id) return _user._id;
    return '';
  }
  function setUserId(id){
    if(!id) return;
    _userId = id; window.USER_ID = id; setCookie('SL_UID', id, 7);
  }
  function getRole(){
    if(_role) return _role;
    if(window.USER_ROLE){ _role = window.USER_ROLE; return _role; }
    var c = getCookie('SL_ROLE');
    if(c){ _role = c; window.USER_ROLE = c; return c; }
    if(_user && _user.role) return _user.role;
    return 'customer';
  }
  function setRole(role){ _role = role || 'customer'; window.USER_ROLE = _role; setCookie('SL_ROLE', _role, 7); }
  function getUser(){ return _user || window.currentUser || null; }
  function setUser(user){
    if(!user) return;
    _user = user; window.currentUser = user;
    if(user._id) setUserId(user._id);
    if(user.role) setRole(user.role);
    if(user.name) window.USER_NAME = user.name;
    if(user.phone) window.USER_PHONE = user.phone;
    if(user.profilePic || user.avatar || user.photo) window.USER_PIC = user.profilePic || user.avatar || user.photo;
  }
  function clearUser(){
    _user = null; _userId = ''; _role = 'customer';
    window.currentUser = null; window.USER_ID = ''; window.USER_NAME = '';
    window.USER_PHONE = ''; window.USER_PIC = ''; window.USER_ROLE = 'customer';
    eraseCookie('SL_UID'); eraseCookie('SL_ROLE');
  }
  async function checkAuth(){
    var token = getToken();
    if(!token){ console.log('AuthCore: no token'); return null; }
    try{
      var res = await fetch('/api/common/profile/me', { headers: { 'Authorization': 'Bearer ' + token, 'x-buyer-id': getUserId() } }).catch(function(){ return null; });
      var data = res ? await res.json().catch(function(){ return null; }) : null;
      if(!data || !data.success){
        res = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } }).catch(function(){ return null; });
        data = res ? await res.json().catch(function(){ return null; }) : null;
      }
      var user = (data && (data.user || data.data)) || null;
      if(user && user._id){
        setUser(user);
        if(window.__GUEST_ID && String(window.__GUEST_ID).indexOf('guest_') === 0){ window.__GUEST_ID = 'user_' + user._id; }
        console.log('AuthCore check OK:', user.name, user.role);
        return user;
      } else { console.log('AuthCore: token invalid'); return null; }
    }catch(e){ console.log('AuthCore check error', e.message); return null; }
  }
  async function login(phone, passwordOrOtp){
    try{
      var res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: phone, password: passwordOrOtp, otp: passwordOrOtp }) });
      var data = await res.json();
      if(data.success && data.token){
        setToken(data.token);
        var u = data.user || data.data || null;
        if(u) setUser(u);
        if(u && u._id) window.__GUEST_ID = 'user_' + u._id;
        return data;
      }
      return data;
    }catch(e){ return { success: false, message: e.message }; }
  }
  function logout(){
    clearToken(); clearUser();
    window.__GUEST_ID = 'guest_' + Date.now();
    location.href = '/index.html';
  }
  window.AuthCore.getToken = getToken;
  window.AuthCore.setToken = setToken;
  window.AuthCore.clearToken = clearToken;
  window.AuthCore.getUserId = getUserId;
  window.AuthCore.setUserId = setUserId;
  window.AuthCore.getRole = getRole;
  window.AuthCore.setRole = setRole;
  window.AuthCore.getUser = getUser;
  window.AuthCore.setUser = setUser;
  window.AuthCore.checkAuth = checkAuth;
  window.AuthCore.login = login;
  window.AuthCore.logout = logout;
  window.AuthCore.isLoggedIn = function(){ return !!getToken(); };
  document.addEventListener('DOMContentLoaded', function(){ if(getToken()) checkAuth(); });
  console.log('AuthCore V8 loaded - Cookie persist - Page badalne pe bhi Token rahega');
})();