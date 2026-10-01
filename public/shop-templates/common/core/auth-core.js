// LOCATION: common/core/auth-core.js - WORLD CLASS AUTH CORE - FULL
class CoreAuthCore {
  constructor(){
    this.user = null;
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
    this.isChecking = false;
    this.listeners = [];
    this.init();
  }

  init(){
    // Check auth on load for dashboard pages
    if(location.pathname.includes('dashboard') || location.pathname.includes('admin')){
      this.checkAuthSilently();
    }
  }

  // Silent check without redirect
  async checkAuthSilently(){
    if(this.isChecking) return this.user;
    this.isChecking = true;

    try{
      if(!window.ApiCore) throw new Error('ApiCore not loaded');

      const data = await window.ApiCore.get('/api/common/auth/check');

      if(data.success && data.authenticated){
        this.user = data.user;
        window.currentUser = data.user;
        this.notifyListeners('login', data.user);
        return data.user;
      } else {
        this.user = null;
        window.currentUser = null;
        this.notifyListeners('logout', null);
        return null;
      }
    }catch(e){
      console.error('Auth check failed', e);
      this.user = null;
      return null;
    }finally{
      this.isChecking = false;
    }
  }

  // Strict check with redirect
  async requireAuth(redirectUrl = '/index.html'){
    const user = await this.checkAuthSilently();
    if(!user){
      this.showAuthModal(redirectUrl);
      return false;
    }
    return true;
  }

  showAuthModal(redirectUrl){
    // Create login required modal if not exists
    if(document.getElementById('authRequiredModal')) return;

    const modal = document.createElement('div');
    modal.id = 'authRequiredModal';
    modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:10000;display:grid;place-items:center;padding:20px;backdrop-filter:blur(8px);font-family:Outfit,sans-serif`;
    modal.innerHTML = `
      <div style="background:#fff;width:100%;max-width:380px;border-radius:24px;padding:24px;text-align:center;animation:pop.3s">
        <div style="width:64px;height:64px;background:#f1f5f9;border-radius:50%;display:grid;place-items:center;margin:0 auto 16px;font-size:28px">🔒</div>
        <h2 style="font-weight:900;margin:0 0 8px;font-size:20px">Login Required</h2>
        <p style="color:#64748b;font-size:13px;margin:0 0 20px">Please login to access dashboard and manage your shop</p>
        <button id="authGoLogin" style="width:100%;background:#0f172a;color:#fff;border:none;padding:14px;border-radius:12px;font-weight:900;font-size:15px">Go to Login</button>
        <button id="authCancel" style="width:100%;margin-top:8px;background:#f1f5f9;border:none;padding:12px;border-radius:12px;font-weight:800">Cancel</button>
      </div>
      <style>@keyframes pop{from{transform:scale(.9);opacity:0}to{transform:scale(1);opacity:1}}</style>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#authGoLogin').addEventListener('click', ()=>{
      window.location.href = redirectUrl + `?redirect=${encodeURIComponent(location.href)}`;
    });
    modal.querySelector('#authCancel').addEventListener('click', ()=>{
      modal.remove();
      history.back();
    });
  }

  async getUser(){
    if(this.user) return this.user;
    return await this.checkAuthSilently();
  }

  async getRole(){
    const user = await this.getUser();
    return user?.role || 'guest';
  }

  async isShopOwner(shopId){
    shopId = shopId || this.shopId;
    if(!shopId) return false;

    try{
      const data = await window.ApiCore.get(`/api/common/auth/verify/${shopId}`);
      return data.isOwner || false;
    }catch(e){
      return false;
    }
  }

  async protectDashboard(){
    const isOwner = await this.isShopOwner();
    const user = await this.getUser();

    if(!user){
      document.body.innerHTML = `
        <div style="height:100vh;display:grid;place-items:center;font-family:Outfit,sans-serif;text-align:center;padding:20px;background:#f8fafc">
          <div style="background:#fff;padding:32px;border-radius:24px;box-shadow:0 20px 40px rgba(0,0,0,.08);max-width:360px;width:100%">
            <div style="font-size:48px">🔒</div>
            <h2 style="font-weight:900;margin:12px 0 8px">Authentication Required</h2>
            <p style="color:#64748b;font-size:13px;margin:0 0 20px">You need to login to view dashboard</p>
            <a href="/index.html?redirect=${encodeURIComponent(location.href)}" style="display:block;background:#0f172a;color:#fff;padding:14px;border-radius:12px;text-decoration:none;font-weight:900">Login Now</a>
          </div>
        </div>
      `;
      return false;
    }

    if(!isOwner){
      document.body.innerHTML = `
        <div style="height:100vh;display:grid;place-items:center;font-family:Outfit,sans-serif;text-align:center;padding:20px;background:#f8fafc">
          <div style="background:#fff;padding:32px;border-radius:24px;box-shadow:0 20px 40px rgba(0,0,0,.08);max-width:360px;width:100%">
            <div style="font-size:48px">⛔</div>
            <h2 style="font-weight:900;margin:12px 0 8px">Access Denied</h2>
            <p style="color:#64748b;font-size:13px;margin:0 0 20px">You don't own this shop. You can only manage your own shop.</p>
            <a href="/" style="display:block;background:#0f172a;color:#fff;padding:14px;border-radius:12px;text-decoration:none;font-weight:900">Go Home</a>
          </div>
        </div>
      `;
      return false;
    }

    // Update UI with user info
    this.updateDashboardUI(user);
    return true;
  }

  updateDashboardUI(user){
    const avatar = document.getElementById('dashAvatar');
    const nameEl = document.getElementById('dashUserName');

    if(avatar && user.avatar) avatar.src = user.avatar;
    if(nameEl) nameEl.innerText = user.name || user.email || 'Owner';

    // Show owner badge
    const badge = document.createElement('span');
    badge.style.cssText = 'background:#dcfce7;color:#166534;font-size:10px;font-weight:900;padding:2px 6px;border-radius:6px;margin-left:6px';
    badge.innerText = 'OWNER';

    const title = document.querySelector('#dashHeader b');
    if(title &&!title.querySelector('span')) title.appendChild(badge);
  }

  // Observer pattern for auth changes
  onAuthChange(callback){
    this.listeners.push(callback);
  }

  notifyListeners(event, user){
    this.listeners.forEach(cb=> cb(event, user));
  }

  // Logout
  async logout(){
    try{
      await window.ApiCore.post('/api/common/auth/logout', {});
      this.user = null;
      window.currentUser = null;
      this.notifyListeners('logout', null);
      window.location.href = '/index.html?loggedOut=true';
    }catch(e){
      console.error('Logout failed', e);
      // Force logout
      window.location.href = '/index.html';
    }
  }
}

window.AuthCore = new CoreAuthCore();
window.CoreAuthCore = window.AuthCore;

// Global helper
window.requireAuth = ()=> window.AuthCore.requireAuth();
window.isShopOwner = (shopId)=> window.AuthCore.isShopOwner(shopId);