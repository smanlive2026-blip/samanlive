// LOCATION: public/shop-templates/common/core/auth-core.js - FRONTEND AUTH CORE
class AuthCore {
  constructor(){
    this.user = null;
    this.isAuthenticated = false;
    this.checked = false;
  }

  async check(){
    try{
      const data = window.ApiCore
        ? await window.ApiCore.get('/api/common/auth/check')
        : await (await fetch('/api/common/auth/check', { credentials:'include' })).json();
      this.isAuthenticated = !!(data.authenticated || data.isLoggedIn);
      this.user = data.user || null;
      this.checked = true;
      return data;
    }catch(e){
      this.isAuthenticated = false;
      this.user = null;
      this.checked = true;
      return { success:false, authenticated:false, user:null };
    }
  }

  async getMe(){
    if(this.user) return this.user;
    const d = await this.check();
    return d.user || null;
  }

  async verifyShopOwner(shopId){
    try{
      const data = window.ApiCore
        ? await window.ApiCore.get(`/api/common/auth/verify/${shopId}`)
        : await (await fetch(`/api/common/auth/verify/${shopId}`, { credentials:'include' })).json();
      return !!data.isOwner;
    }catch(e){ return false; }
  }

  async protectDashboard(shopId){
    const d = await this.check();
    if(!d.authenticated){
      // Dashboard ko rokna nahi hai, sirf flag set karna hai - login baad me lagega
      console.warn('AuthCore: user not logged in');
      return false;
    }
    if(shopId) return this.verifyShopOwner(shopId);
    return true;
  }

  async logout(){
    try{
      if(window.ApiCore) await window.ApiCore.post('/api/common/auth/logout', {});
      else await fetch('/api/common/auth/logout', { method:'POST', credentials:'include' });
    }catch(e){}
    this.user = null;
    this.isAuthenticated = false;
    localStorage.removeItem('lm_token');
    window.location.href = '/profile.html';
  }

  getUser(){ return this.user; }
  isLoggedIn(){ return this.isAuthenticated; }
}

window.AuthCore = new AuthCore();