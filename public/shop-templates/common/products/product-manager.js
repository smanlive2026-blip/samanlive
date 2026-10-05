// LOCATION: public/shop-templates/common/products/product-manager.js - V16 FIXED - SHOPID OVERWRITE BUG FIXED
class WorldProductManager {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('last_shopId') || '';
    this.shopType = new URLSearchParams(location.search).get('type') || new URLSearchParams(location.search).get('shopType') || localStorage.getItem('shopType') || 'kirana';
    this.role = this.detectRole();
    this.API = '/api/world-products';
  }

  detectRole(){
    const path = location.pathname;
    if(path.includes('dashboard')) return 'dashboard';
    if(path.includes('user-view') || path.includes('customer-view') || path.includes('shop-view')) return 'customer';
    if(path.includes('admin-panel')) return 'admin';
    if(path.includes('area-manager') || path.includes('area-dashboard')) return 'area-manager';
    return 'customer';
  }

  async addProduct(data){
    // FIXED: overwrite mat kar - agar data me already shopId hai to wahi rakho
    data.shopId = data.shopId || this.shopId;
    data.shopType = data.shopType || this.shopType;
    data.isActive = data.isActive !== undefined ? data.isActive : true;
    data.role = this.role;
    console.log('Saving product with shopId:', data.shopId, 'shopType:', data.shopType, data.name);
    const res = await fetch(this.API, {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('token')||'')},
      body: JSON.stringify(data)
    }).then(r=>r.json());
    if(res.success){
      window.ApiCore?.clearCache(this.API);
      window.SocketCore?.emit('product-updated',{shopId:data.shopId, shopType:data.shopType});
    }
    return res;
  }

  async getProducts(filter={}){
    const shopType = filter.shopType || this.shopType;
    const shopId = filter.shopId || this.shopId;
    let url = `${this.API}?shopType=${shopType}`;
    if(this.role === 'dashboard' || this.role === 'customer'){
      if(shopId) url += `&shopId=${shopId}`;
    }
    if(this.role === 'admin') url += `&role=admin`;
    if(this.role === 'area-manager') url += `&role=area-manager&areaId=${localStorage.getItem('areaId')}`;
    
    console.log('Fetching products:', url, 'role:', this.role);
    const res = await fetch(url).then(r=>r.json()).catch(()=>({data:[]}));
    console.log('API response:', res);
    return this.filterByRole(res.data||res.products||res||[]);
  }

  filterByRole(products){
    if(!Array.isArray(products)) return [];
    if(this.role === 'customer') return products.filter(p=> p.isActive!==false && (p.stock||0)>0);
    if(this.role === 'dashboard') return products;
    if(this.role === 'admin') return products;
    if(this.role === 'area-manager') return products;
    return products;
  }

  async updateProduct(id, data){
    const res = await fetch(`${this.API}/${id}`,{
      method:'PUT',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('token')||'')},
      body: JSON.stringify(data)
    }).then(r=>r.json());
    if(res.success) window.ApiCore?.clearCache(this.API);
    return res;
  }

  async deleteProduct(id){
    const res = await fetch(`${this.API}/${id}`,{
      method:'DELETE',
      headers:{'Authorization':'Bearer '+(localStorage.getItem('token')||'')}
    }).then(r=>r.json());
    if(res.success) window.ApiCore?.clearCache(this.API);
    return res;
  }

  async seedProducts(shopType){
    // FIXED: blob fetch method - no import error
    try{
      const url = `./${shopType}.seed.js?v=16&t=${Date.now()}`;
      const text = await fetch(url).then(r=>r.text());
      const fn = new Function(text.replace(/export\s+const\s+/g,'var ').replace(/export\s+default.*$/gm,'') + `\n return {PRODUCTS};`);
      const {PRODUCTS} = fn();
      let count=0;
      for(let p of PRODUCTS){
        p.shopId = this.shopId;
        p.shopType = shopType;
        p.isActive = true;
        await this.addProduct(p);
        count++;
      }
      return count;
    }catch(e){
      console.error('seedProducts failed', e);
      return 0;
    }
  }

  async getAllShopsProducts(){
    const res = await fetch(`${this.API}?role=${this.role}`).then(r=>r.json());
    return res.data||[];
  }
}

window.WorldProductManager = new WorldProductManager();
window.ProductManager = window.WorldProductManager;