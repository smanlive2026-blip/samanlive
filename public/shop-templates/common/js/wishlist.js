// LOCATION: public/shop-templates/common/js/wishlist.js - V2 COMMON - FULL CODE
// FIX V2 COMMON: 1) Pehle userId localStorage se aata tha - Ab AuthCore se aayega, warna guest
// 2) Pehle localStorage hi sach tha - Server fail ho toh bhi purani Wishlist dikhti thi - Ab Server hi sach hai
// 3) global.io browser me chal raha tha - Hataya, SocketCore se hi chalega
// COMMON RULE: Profile (public/profile/wishlist.html) aur Dukaan (customer-view) - Dono isi file ko bulayenge - Koi alag Wishlist file nahi hogi
// API: GET /api/common/wishlist/:userId | POST /api/common/wishlist/:userId/add {productId, product} | DELETE /api/common/wishlist/:userId/:productId
class WishlistCore {
  constructor(){
    this.userId = '';
    try{ if(window.AuthCore && window.AuthCore.getUserId) this.userId = window.AuthCore.getUserId() || ''; }catch(e){}
    if(!this.userId) this.userId = 'guest';
    this.wishlist = [];
    this.compareList = []; // Compare abhi local hi hai - Server pe Compare ka API nahi hai, isliye isko sach mat samajhna
  }

  getToken(){
    try{ if(window.AuthCore && window.AuthCore.getToken) return window.AuthCore.getToken() || ''; }catch(e){}
    return '';
  }

  async init(){
    await this.loadWishlist();
    this.updateBadge();
  }

  // Ek hi sach - Server se aayega, localStorage se kabhi nahi
  async loadWishlist(){
    try{
      if(this.userId === 'guest'){ this.wishlist = []; this.updateBadge(); return []; }
      var data = null;
      if(window.ApiCore){
        try{ data = await window.ApiCore.get('/api/common/wishlist/' + encodeURIComponent(this.userId)); }catch(e){ data = null; }
      }
      if(!data){
        try{
          var t = this.getToken();
          data = await fetch('/api/common/wishlist/' + encodeURIComponent(this.userId), { headers: t ? { 'Authorization':'Bearer '+t } : {} }).then(function(r){ return r.json(); }).catch(function(){ return null; });
        }catch(e){}
      }
      // Server se jo aaya wahi - Khali hai toh khali hi rahega, localStorage se purana nahi layenge
      this.wishlist = (data && (data.wishlist || data.items || [])) || [];
      this.updateBadge();
      return this.wishlist;
    }catch(e){ this.wishlist = []; this.updateBadge(); return []; }
  }

  isInWishlist(productId){
    return !!this.wishlist.find(function(p){ return String(p.productId || p._id || p.id) === String(productId); });
  }

  async addToWishlist(product){
    try{
      if(!product) return { success:false, message:'Product chahiye' };
      if(this.userId === 'guest'){ alert('Wishlist ke liye Login karo'); return { success:false, message:'Login chahiye' }; }
      var pid = product.productId || product._id || product.id || '';
      if(!pid) return { success:false, message:'productId missing' };
      if(this.isInWishlist(pid)) return { success:false, message:'Already in wishlist' };

      // Pehle Server pe bhejo - Server pe save hua tabhi UI me dikhao - Pehle UI me dikha ke baad me Server pe bhejte the, isliye Refresh pe gayab ho jata tha
      var payload = { productId: pid, product: { productId: pid, name: product.name || '', price: product.price || 0, image: product.image || product.thumbnail || '', shopId: product.shopId || '', shopName: product.shopName || '' } };
      var data = null;
      if(window.ApiCore){ try{ data = await window.ApiCore.post('/api/common/wishlist/' + encodeURIComponent(this.userId) + '/add', payload); }catch(e){ data = null; } }
      if(!data){
        try{
          var t = this.getToken();
          data = await fetch('/api/common/wishlist/' + encodeURIComponent(this.userId) + '/add', { method:'POST', headers:{ 'Content-Type':'application/json', ...(t ? { 'Authorization':'Bearer '+t } : {}) }, body: JSON.stringify(payload) }).then(function(r){ return r.json(); }).catch(function(){ return null; });
        }catch(e){}
      }
      if(!data || !data.success){
        // Server ne mana kar diya toh UI me mat dikhao - Jhootha ❤️ nahi dikhayenge
        return { success:false, message:'Server pe save nahi hua' };
      }
      await this.loadWishlist(); // Server se dobara lo - Wahi sach hai
      if(window.Toast) Toast.show((product.name || 'Product') + ' added to wishlist ❤️', 'success');
      return { success:true, wishlist:this.wishlist };
    }catch(e){ return { success:false, message:e.message }; }
  }

  async removeFromWishlist(productId){
    try{
      if(!productId) return { success:false };
      // Pehle Server se hatao, phir UI se hatao
      if(window.ApiCore){ try{ await window.ApiCore.delete('/api/common/wishlist/' + encodeURIComponent(this.userId) + '/' + encodeURIComponent(productId)); }catch(e){} }
      else {
        try{
          var t = this.getToken();
          await fetch('/api/common/wishlist/' + encodeURIComponent(this.userId) + '/' + encodeURIComponent(productId), { method:'DELETE', headers: t ? { 'Authorization':'Bearer '+t } : {} }).catch(function(){});
        }catch(e){}
      }
      this.wishlist = this.wishlist.filter(function(p){ return String(p.productId || p._id || p.id) !== String(productId); });
      this.updateBadge();
      return { success:true };
    }catch(e){ return { success:false }; }
  }

  // Purane callers ke liye same naam - toggle() - Dukaan me ❤️ button isi ko bulayega
  async toggle(product){
    var pid = product.productId || product._id || product.id || '';
    if(this.isInWishlist(pid)) return await this.removeFromWishlist(pid);
    return await this.addToWishlist(product);
  }

  updateBadge(){
    try{
      document.querySelectorAll('#wishlistBadge, .wishlist-count, [data-wishlist-badge]').forEach(function(el){
        if(!el) return;
        el.textContent = String(this.wishlist.length);
        el.style.display = this.wishlist.length > 0 ? 'block' : 'none';
      }.bind(this));
    }catch(e){}
  }

  getAll(){ return this.wishlist; }
}

window.WishlistCore = new WishlistCore();
window.WishlistCoreInstance = window.WishlistCore;
document.addEventListener('DOMContentLoaded', function(){ window.WishlistCore.init(); });

// Global helpers - Purane callers ke liye same naam rakhe hain
window.addToWishlist = function(p){ return window.WishlistCore.addToWishlist(p); };
window.removeFromWishlist = function(id){ return window.WishlistCore.removeFromWishlist(id); };
window.toggleWishlist = function(p){ return window.WishlistCore.toggle(p); };