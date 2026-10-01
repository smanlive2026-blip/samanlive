// LOCATION: public/shop-templates/common/profile/shop-info.js
// WORLD CLASS SHOP INFO JS - SHOP OWNER ONLY - FULL 300+ LINES
class ShopInfoCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('shopId') || '';
    this.shop = null;
  }

  async init(){
    await this.loadShop();
  }

  async loadShop(){
    try{
      if(window.ApiCore){
        const data = await window.ApiCore.get(`/api/shops/${this.shopId}`);
        this.shop = data.shop||data;
      } else {
        this.shop = JSON.parse(localStorage.getItem(`shop_${this.shopId}`)||'{}');
      }
      return this.shop;
    }catch(e){ return null; }
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

  async updateShopInfo(shopData){
    const validation = this.validateShopData(shopData);

    if(!validation.valid){
      return { success:false, errors:validation.errors, message:validation.errors[0] };
    }

    try{
      if(window.ApiCore){
        const result = await window.ApiCore.put(`/api/shops/${this.shopId}`, shopData);
        this.shop = result.shop||result;
      } else {
        this.shop = {...this.shop,...shopData, _id:this.shopId, updatedAt:new Date().toISOString() };
        localStorage.setItem(`shop_${this.shopId}`, JSON.stringify(this.shop));
      }

      if(window.SocketCore){
        window.SocketCore.emit('shop-info-updated', { shopId:this.shopId, shopData });
      }

      return { success:true, shop:this.shop, message:'Shop info updated ✅' };

    }catch(e){
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