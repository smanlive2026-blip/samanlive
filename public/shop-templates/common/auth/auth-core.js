// LOCATION: public/shop-templates/common/auth/auth-core.js - V6 COMMON CONNECTED
class AuthCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
  }
  getToken(){ return localStorage.getItem('userToken') || localStorage.getItem('TOKEN') || ''; }
  isLoggedIn(){ return !!this.getToken(); }
  async checkAuth(){
    const token = this.getToken();
    if(!token) return { authenticated: false, user: null };
    try{
      const res = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer '+token }, cache: 'no-store' });
      const data = await res.json();
      if(data.success){
        window.currentUser = data.user;
        return { authenticated: true, user: data.user };
      }
      localStorage.removeItem('userToken');
      return { authenticated: false, user: null };
    }catch(e){ return { authenticated: false, user: null }; }
  }
  async getRole(){
    const auth = await this.checkAuth();
    return auth.user?.role || localStorage.getItem('USER_ROLE') || 'customer';
  }
  getOwnerId(){ return window.currentUser?._id || localStorage.getItem('USER_ID') || ''; }
  async protectDashboard(){
    const result = await this.checkAuth();
    if(!result.authenticated){
      document.body.innerHTML = `<div style="height:100vh;display:grid;place-items:center;font-family:Outfit,sans-serif;text-align:center;padding:20px"><div><h1 style="font-size:48px">🔒</h1><h2>Login Required</h2><p>Dashboard dekhne ke liye main app se login karo</p><a href="/" style="display:inline-block;margin-top:16px;background:#0f172a;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:800">Go to Login</a></div></div>`;
      return false;
    }
    return true;
  }
  showAuthModal(redirectUrl){
    window._redirectAfterLogin = redirectUrl || location.href;
    if(window.openLoginModal) window.openLoginModal();
    else location.href = '/';
  }
  async logout(){
    localStorage.removeItem('userToken'); localStorage.removeItem('TOKEN');
    localStorage.removeItem('USER_ID'); localStorage.removeItem('lm_user');
    window.currentUser = null;
    location.href = '/';
  }
}
window.AuthCore = new AuthCore();
if(location.pathname.includes('dashboard.html')){
  window.AuthCore.protectDashboard();
}
console.log('✅ AuthCore V6 COMMON CONNECTED');