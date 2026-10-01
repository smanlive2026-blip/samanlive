// LOCATION: common/auth/logout.js - WORLD CLASS LOGOUT - API ONLY
class LogoutCore {
  constructor(){
    this.api = '/api/auth/logout';
  }

  async logout(){
    const btn = document.getElementById('logoutBtn');
    if(btn){ btn.innerText = 'Logging out...'; btn.disabled = true; }

    try{
      const res = await fetch(this.api, {
        method:'POST',
        credentials:'include',
        headers:{'Content-Type':'application/json'},
        cache:'no-store'
      });
      const data = await res.json();
      
      // Clear any app cache via API timestamp (no localStorage)
      if(window.StorageCore) window.StorageCore.clearShopCache();

      // Redirect to home
      window.location.href = '/index.html?loggedOut=true';
    }catch(e){
      console.error('Logout failed', e);
      alert('Logout failed, try again');
      if(btn){ btn.innerText = 'Logout'; btn.disabled = false; }
    }
  }

  // Attach to button
  init(){
    const btn = document.getElementById('logoutBtn');
    if(btn){
      btn.addEventListener('click', (e)=>{
        e.preventDefault();
        if(confirm('Logout karna hai?')) this.logout();
      });
    }
    // Also support data-logout attribute
    document.querySelectorAll('[data-logout]').forEach(el=>{
      el.addEventListener('click', ()=> { if(confirm('Logout?')) this.logout(); });
    });
  }
}

window.LogoutCore = new LogoutCore();
document.addEventListener('DOMContentLoaded', ()=> window.LogoutCore.init());

// Global function for onclick="logout()"
window.logout = () => window.LogoutCore.logout();