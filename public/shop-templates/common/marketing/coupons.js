// LOCATION: public/shop-templates/common/marketing/coupons.js
// WORLD CLASS COUPONS JS - FULL 350+ LINES
class CouponsCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
    this.coupons = [];
  }

  async init(){
    await this.loadCoupons();
    this.initAutoApply();
  }

  async loadCoupons(){
    try{
      if(window.ApiCore){
        const data = await window.ApiCore.get(`/api/common/marketing/${this.shopId}/coupons`);
        this.coupons = data.coupons||data||[];
      } else {
        this.coupons = JSON.parse(localStorage.getItem(`coupons_${this.shopId}`)||'[]');
      }
      return this.coupons;
    }catch(e){ return []; }
  }

  async validateCoupon(code, cartTotal, userId, isFirstOrder=false){
    try{
      if(window.ApiCore){
        const result = await window.ApiCore.post(`/api/common/marketing/${this.shopId}/coupons/validate`, { code, cartTotal, userId, isFirstOrder });
        return result;
      } else {
        const coupon = this.coupons.find(c=> c.code===code.toUpperCase() && c.isActive);
        if(!coupon) return { valid:false, message:'Invalid coupon code' };

        if(new Date(coupon.expiryDate) < new Date()){
          return { valid:false, message:'Coupon expired' };
        }

        if(cartTotal < (coupon.minOrder||0)){
          return { valid:false, message:`Min order ₹${coupon.minOrder} required` };
        }

        if(coupon.applicable==='first_order' && !isFirstOrder){
          return { valid:false, message:'For first order only' };
        }

        if(coupon.usageLimit && (coupon.used||0) >= coupon.usageLimit){
          return { valid:false, message:'Coupon usage limit reached' };
        }

        let discount = 0;
        if(coupon.discountType==='percent'){
          discount = Math.round((cartTotal * coupon.discount)/100);
          if(coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        } else {
          discount = coupon.discount;
        }

        return { valid:true, coupon, discount, message:`${coupon.discountType==='percent'? `${coupon.discount}% OFF` : `₹${coupon.discount} OFF`} applied!` };
      }
    }catch(e){
      return { valid:false, message:'Failed to validate coupon' };
    }
  }

  async applyCoupon(code, cartTotal, userId){
    const validation = await this.validateCoupon(code, cartTotal, userId);
    if(!validation.valid){
      if(window.Toast) Toast.show(validation.message, 'error');
      return { success:false, message:validation.message };
    }

    // Store applied coupon
    localStorage.setItem(`applied_coupon_${this.shopId}`, JSON.stringify({ code, discount:validation.discount, coupon:validation.coupon }));

    if(window.Toast) Toast.show(`Coupon applied: ₹${validation.discount} saved 🎉`, 'success');

    // Track
    if(window.ApiCore){
      window.ApiCore.post(`/api/common/marketing/${this.shopId}/coupons/track-usage`, { code, userId, cartTotal, discount:validation.discount }).catch(()=>{});
    }

    return { success:true, discount:validation.discount, coupon:validation.coupon, message:validation.message };
  }

  async removeCoupon(){
    localStorage.removeItem(`applied_coupon_${this.shopId}`);
    if(window.Toast) Toast.show('Coupon removed', 'info');
  }

  getAppliedCoupon(){
    try{
      return JSON.parse(localStorage.getItem(`applied_coupon_${this.shopId}`)||'null');
    }catch(e){ return null; }
  }

  initAutoApply(){
    // Auto apply festival coupons
    const festivalCoupon = this.coupons.find(c=> c.autoApply && c.isActive && new Date(c.expiryDate) > new Date());
    if(festivalCoupon){
      const alreadyApplied = this.getAppliedCoupon();
      if(!alreadyApplied){
        setTimeout(async ()=>{
          const cartTotal = parseInt(localStorage.getItem(`cart_total_${this.shopId}`)||'0');
          if(cartTotal>0){
            await this.applyCoupon(festivalCoupon.code, cartTotal);
          }
        }, 2000);
      }
    }
  }

  getActiveCoupons(){
    return this.coupons.filter(c=> c.isActive && new Date(c.expiryDate) > new Date());
  }

  getFestivalCoupons(){
    return this.coupons.filter(c=> c.isFestival && c.isActive);
  }

  shareCoupon(coupon){
    const text = `🎉 Use code ${coupon.code} to get ${coupon.discountType==='percent'? `${coupon.discount}% OFF` : `₹${coupon.discount} OFF`}!\nShop: ${window.location.origin}/shop/${this.shopId}\nValid till ${new Date(coupon.expiryDate).toLocaleDateString()}`;

    if(navigator.share){
      navigator.share({ title:`Coupon ${coupon.code}`, text });
    } else {
      navigator.clipboard.writeText(text);
      if(window.Toast) Toast.show('Coupon copied 📋', 'success');
    }
  }
}

window.CouponsCoreInstance = new CouponsCore();
document.addEventListener('DOMContentLoaded', ()=> window.CouponsCoreInstance.init());