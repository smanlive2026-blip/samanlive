// LOCATION: public/shop-templates/common/core/auth-core.js - V6 WORLD CLASS - ME + PROFILE COMMON
(function(){
  window.AuthCore = window.AuthCore || {};

  function getToken(){
    return localStorage.getItem('TOKEN') || localStorage.getItem('token') || localStorage.getItem('userToken') || sessionStorage.getItem('TOKEN') || '';
  }

  function setToken(token){
    if(!token) return;
    localStorage.setItem('TOKEN', token);
    localStorage.setItem('token', token);
    localStorage.setItem('userToken', token);
    try{ sessionStorage.setItem('TOKEN', token); }catch(e){}
  }

  function getUserId(){
    return localStorage.getItem('USER_ID') || window.USER_ID || '';
  }

  function getRole(){
    return localStorage.getItem('USER_ROLE') || window.USER_ROLE || 'customer';
  }

  async function checkAuth(){
    const token = getToken();
    if(!token){
      console.log('AuthCore: no token');
      return null;
    }
    try{
      // WORLD CLASS: Try common profile first, then auth/me
      let res = await fetch('/api/common/profile/me', {
        headers: { 'Authorization': `Bearer ${token}`, 'x-buyer-id': getUserId() }
      }).catch(()=>null);
      let data = res ? await res.json().catch(()=>null) : null;

      if(!data || !data.success){
        res = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } }).catch(()=>null);
        data = res ? await res.json().catch(()=>null) : null;
      }

      const user = data?.user || data?.data || null;
      if(user && user._id){
        window.USER_ID = user._id;
        window.USER_ROLE = user.role || 'customer';
        localStorage.setItem('USER_ID', user._id);
        localStorage.setItem('USER_NAME', user.name||'');
        localStorage.setItem('USER_PHONE', user.phone||'');
        localStorage.setItem('USER_ROLE', user.role||'customer');
        if(user.profilePic) localStorage.setItem('userPic', user.profilePic);
        window.currentUser = user;
        // Merge guest_id to user_ for cart
        try{
          const gid = sessionStorage.getItem('guest_id') || localStorage.getItem('guest_id') || '';
          if(gid && gid.startsWith('guest_')){
            sessionStorage.setItem('guest_id', 'user_'+user._id);
            localStorage.setItem('guest_id', 'user_'+user._id);
          }
        }catch(e){}
        console.log('✅ AuthCore check OK:', user.name, user.role);
        return user;
      } else {
        console.log('AuthCore: token invalid');
        return null;
      }
    }catch(e){
      console.log('AuthCore check error', e.message);
      return null;
    }
  }

  async function login(phone, passwordOrOtp){
    // Simple wrapper for /api/auth/login
    try{
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: passwordOrOtp, otp: passwordOrOtp })
      });
      const data = await res.json();
      if(data.success && data.token){
        setToken(data.token);
        localStorage.setItem('USER_ID', data.user?._id || data.data?._id || '');
        localStorage.setItem('USER_ROLE', data.user?.role || data.data?.role || 'customer');
        // Merge cart guest to user
        try{
          const uid = data.user?._id || data.data?._id;
          if(uid){
            sessionStorage.setItem('guest_id', 'user_'+uid);
            localStorage.setItem('guest_id', 'user_'+uid);
          }
        }catch(e){}
        return data;
      }
      return data;
    }catch(e){ return { success: false, message: e.message }; }
  }

  function logout(){
    localStorage.removeItem('TOKEN');
    localStorage.removeItem('token');
    localStorage.removeItem('userToken');
    sessionStorage.removeItem('TOKEN');
    localStorage.removeItem('USER_ID');
    localStorage.removeItem('USER_ROLE');
    // Reset guest
    const newGuest = 'guest_'+Date.now();
    try{ sessionStorage.setItem('guest_id', newGuest); localStorage.setItem('guest_id', newGuest); }catch(e){}
    location.href = '/index.html';
  }

  window.AuthCore.getToken = getToken;
  window.AuthCore.setToken = setToken;
  window.AuthCore.getUserId = getUserId;
  window.AuthCore.getRole = getRole;
  window.AuthCore.checkAuth = checkAuth;
  window.AuthCore.login = login;
  window.AuthCore.logout = logout;
  window.AuthCore.isLoggedIn = function(){ return !!getToken(); };

  // Auto check on load
  document.addEventListener('DOMContentLoaded', ()=>{
    if(getToken()) checkAuth();
  });

  console.log('✅ AuthCore V6 WORLD CLASS loaded');
})();