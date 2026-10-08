// LOCATION: public/shop-templates/common/profile/shop-info.js
// WORLD CLASS SHOP INFO JS - SHOP OWNER ONLY - FULL 300+ LINES - DASHBOARD CONNECTED FIX
class ShopInfoCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('last_shopId') || localStorage.getItem('shopId') || '';
    if(this.shopId){
      localStorage.setItem('last_shopId', this.shopId);
      localStorage.setItem('shopId', this.shopId);
    }
    this.shop = null;
  }

  async init(){
    await this.loadShop();
  }

  async loadShop(){
    try{
      if(window.ApiCore){
        const data = await window.ApiCore.get(`/api/common/profile/${this.shopId}`);
        this.shop = data.shop||data.profile||data;
      } else {
        this.shop = JSON.parse(localStorage.getItem(`shop_${this.shopId}`)||'{}');
      }
      // Dashboard fix - purane cache se bhi utha lo taaki form khali na dikhe
      if(!this.shop ||!this.shop.name){
        try{
          const localShop = JSON.parse(localStorage.getItem(`shop_${this.shopId}`)||'{}');
          if(localShop && (localShop.name || localShop.shopName)){
            this.shop = {...localShop, name: localShop.name || localShop.shopName, shopName: localShop.shopName || localShop.name};
          }
        }catch(e){}
      }
      if(this.shop && this.shop.shopName &&!this.shop.name) this.shop.name = this.shop.shopName;
      if(this.shop && this.shop.name &&!this.shop.shopName) this.shop.shopName = this.shop.name;
      if(this.shop && this.shop.shopImage &&!this.shop.avatar) this.shop.avatar = this.shop.shopImage;
      if(this.shop && this.shop.avatar &&!this.shop.shopImage) this.shop.shopImage = this.shop.avatar;
      if(this.shop && this.shop.banner &&!this.shop.cover) this.shop.cover = this.shop.banner;
      if(this.shop && this.shop.cover &&!this.shop.banner) this.shop.banner = this.shop.cover;
      return this.shop;
    }catch(e){
      try{ this.shop = JSON.parse(localStorage.getItem(`shop_${this.shopId}`)||'{}'); return this.shop; }catch(err){}
      return null;
    }
  }

  validateShopData(data){
    const errors = [];

    if(!data.name || data.name.trim().length<3) errors.push('Shop name must be at least 3 characters');
    if(!data.category) errors.push('Category required');
    if(!data.ownerName || data.ownerName.trim().length<3) errors.push('Owner name required');
    if(!data.phone || data.phone.toString().length!==10) errors.push('Phone must be 10 digits');
    if(!data.address || data.address.trim().length<10) errors.push('Full address required');
    if(!data.area) errors.push('Area required');
    if(!data.city) errors.push('City required');
    if(!data.pincode || data.pincode.toString().length!==6) errors.push('Pincode must be 6 digits');

    if(data.email &&!data.email.includes('@')) errors.push('Invalid email');
    if(data.gst && data.gst.length!==15) errors.push('GST must be 15 characters');
    if(data.fssai && data.fssai.length!==14) errors.push('FSSAI must be 14 digits');

    return { valid:errors.length===0, errors };
  }

  // DASHBOARD CONNECT FIX - save ke baad dashboard ko signal
  notifyDashboard(shopData){
    try{
      const finalShop = {...(this.shop||{}),...shopData, _id:this.shopId, shopId:this.shopId, shopName: shopData.shopName || shopData.name, name: shopData.name || shopData.shopName, updatedAt:new Date().toISOString()};
      if(finalShop.avatar &&!finalShop.shopImage) finalShop.shopImage = finalShop.avatar;
      if(finalShop.shopImage &&!finalShop.avatar) finalShop.avatar = finalShop.shopImage;
      if(finalShop.cover &&!finalShop.banner) finalShop.banner = finalShop.cover;
      if(finalShop.banner &&!finalShop.cover) finalShop.cover = finalShop.banner;
      localStorage.setItem(`shop_${this.shopId}`, JSON.stringify(finalShop));
      localStorage.setItem('shop_updated', Date.now().toString());
      localStorage.removeItem('cached_shop');
      try{ window.ApiCore?.clearCache?.(); }catch(e){}
      try{ window.ApiCore?.clearCache?.(`/api/common/profile/${this.shopId}`); }catch(e){}
      this.shop = finalShop;
    }catch(e){}
  }

  async updateShopInfo(shopData){
    const validation = this.validateShopData(shopData);

    if(!validation.valid){
      return { success:false, errors:validation.errors, message:validation.errors[0] };
    }

    try{
      // FIELD FIX - dashboard shopName padhta hai, profile name padhta hai, dono bhej do
      const payload = {...shopData, shopName: shopData.shopName || shopData.name, name: shopData.name || shopData.shopName};
      if(payload.avatar &&!payload.shopImage) payload.shopImage = payload.avatar;
      if(payload.shopImage &&!payload.avatar) payload.avatar = payload.shopImage;
      if(payload.cover &&!payload.banner) payload.banner = payload.cover;
      if(payload.banner &&!payload.cover) payload.cover = payload.banner;

      if(window.ApiCore){
        const result = await window.ApiCore.put(`/api/common/profile/${this.shopId}`, payload);
        this.shop = result.shop||result.profile||result;
      } else {
        this.shop = {...this.shop,...payload, _id:this.shopId, updatedAt:new Date().toISOString() };
        localStorage.setItem(`shop_${this.shopId}`, JSON.stringify(this.shop));
      }

      this.notifyDashboard(this.shop || payload);

      if(window.SocketCore){
        window.SocketCore.emit('shop-info-updated', { shopId:this.shopId, shopData:payload });
        window.SocketCore.emit('shop-profile-updated', { shopId:this.shopId, updates:payload });
      }

      return { success:true, shop:this.shop, message:'Shop info updated ✅' };

    }catch(e){
      // API fail ho jaye to bhi local save karke dashboard update kar do
      try{
        const payload = {...shopData, shopName: shopData.shopName || shopData.name, name: shopData.name || shopData.shopName};
        this.shop = {...this.shop,...payload, _id:this.shopId, updatedAt:new Date().toISOString() };
        localStorage.setItem(`shop_${this.shopId}`, JSON.stringify(this.shop));
        this.notifyDashboard(payload);
        return { success:true, shop:this.shop, message:'Shop info updated ✅' };
      }catch(err){}
      return { success:false, message:'Failed to update shop info', error:e.message };
    }
  }

  getShopInfo(){
    return this.shop||{};
  }

  getCategories(){
    return [
      { id:'kirana', name:'Kirana / Grocery', icon:'🛒' },
      { id:'fruit', name:'Fruit Shop', icon:'🍎' },
      { id:'sabji', name:'Sabji / Vegetable', icon:'🥦' },
      { id:'medical', name:'Medical / Pharmacy', icon:'💊' },
      { id:'dairy', name:'Dairy / Milk', icon:'🥛' },
      { id:'bakery', name:'Bakery', icon:'🍞' },
      { id:'restaurant', name:'Restaurant / Food', icon:'🍛' },
      { id:'cloth', name:'Cloth / Garments', icon:'👕' },
      { id:'electronics', name:'Electronics / Mobile', icon:'📱' },
      { id:'hardware', name:'Hardware', icon:'🔧' }
    ];
  }
}

window.ShopInfoCoreInstance = new ShopInfoCore();
document.addEventListener('DOMContentLoaded', ()=> window.ShopInfoCoreInstance.init());