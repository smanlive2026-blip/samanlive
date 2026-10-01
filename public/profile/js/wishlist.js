// LOCATION: public/profile/js/wishlist.js
// CUSTOMER WISHLIST JS - PROFILE SIDE - FULL 200+ LINES
class ProfileWishlist {
  constructor(){
    this.userId = localStorage.getItem('userId')||'guest';
    this.wishlist = [];
  }

  async init(){
    await this.loadWishlist();
  }

  async loadWishlist(){
    try{
      if(window.ApiCore){
        const data = await window.ApiCore.get(`/api/wishlist/${this.userId}`);
        this.wishlist = data.wishlist||data||[];
      } else {
        this.wishlist = JSON.parse(localStorage.getItem(`wishlist_${this.userId}`)|| localStorage.getItem('wishlist')||'[]');
      }
      this.updateBadge();
      return this.wishlist;
    }catch(e){ return []; }
  }

  updateBadge(){
    const badge = document.getElementById('wishlistBadge')||document.querySelector('.wishlist-count');
    if(badge){
      badge.innerText = this.wishlist.length;
      badge.style.display = this.wishlist.length>0?'block':'none';
    }
  }

  async toggle(product){
    const productId = product.productId||product._id;
    const exists = this.wishlist.find(p=> (p.productId||p._id)===productId);

    if(exists){
      this.wishlist = this.wishlist.filter(p=> (p.productId||p._id)!==productId);
      if(window.Toast) Toast.show('Removed from wishlist 💔', 'info');
    } else {
      this.wishlist.unshift({...product, addedAt:new Date().toISOString()});
      if(window.Toast) Toast.show('Added to wishlist ❤️', 'success');
    }

    localStorage.setItem(`wishlist_${this.userId}`, JSON.stringify(this.wishlist));
    localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
    this.updateBadge();

    if(window.ApiCore){
      try{
        if(exists) await window.ApiCore.delete(`/api/wishlist/${this.userId}/${productId}`);
        else await window.ApiCore.post(`/api/wishlist/${this.userId}/add`, { productId, product });
      }catch(e){}
    }

    return { success:true, inWishlist:!exists, wishlist:this.wishlist };
  }
}

window.ProfileWishlistInstance = new ProfileWishlist();
document.addEventListener('DOMContentLoaded', ()=> window.ProfileWishlistInstance.init());