// LOCATION: public/shop-templates/common/auth/auth-core.js - WORLD CLASS AUTH CORE - API ONLY, NO LOCALSTORAGE
class AuthCore {
  constructor(){
    this.api = '/api/common/auth';
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
  }

  // Check if shop owner is logged in - via API only
  async checkAuth(){
    try{
      const res = await fetch(`/api/auth/check?t=${Date.now()}`, {
        method:'GET',
        credentials:'include',
        cache:'no-store'
      });
      const data = await res.json();
      if(!data.success || !data.user){
        // Not logged in - redirect to login
        if(!location.pathname.includes('login') && !location.pathname.includes('index.html')){
          console.warn('Not authenticated, staying on page for dashboard check');
        }
        return { authenticated: false, user: null };
      }
      window.currentUser = data.user;
      return { authenticated: true, user: data.user };
    }catch(e){
      console.error('Auth check failed', e);
      return { authenticated: false, user: null };
    }
  }

  // Get current user role
  async getRole(){
    const auth = await this.checkAuth();
    return auth.user?.role || 'guest';
  }

  // Protect dashboard - if not owner, block
  async protectDashboard(){
    const result = await this.checkAuth();
    if(!result.authenticated){
      document.body.innerHTML = `
        <div style="height:100vh;display:grid;place-items:center;font-family:Outfit,sans-serif;text-align:center;padding:20px">
          <div>
            <h1 style="font-size:48px">🔒</h1>
            <h2 style="font-weight:900;margin:10px 0">Login Required</h2>
            <p style="color:#64748b">Dashboard dekhne ke liye login karo</p>
            <a href="/index.html" style="display:inline-block;margin-top:16px;background:#0f172a;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:800">Go to Login</a>
          </div>
        </div>
      `;
      return false;
    }
    return true;
  }

  // Get shop owner ID from auth
  getOwnerId(){
    return window.currentUser?._id || window.currentUser?.id || '';
  }
}

window.AuthCore = new AuthCore();

// Auto check on dashboard pages
if(location.pathname.includes('dashboard.html')){
  window.AuthCore.protectDashboard();
}