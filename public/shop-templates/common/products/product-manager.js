// LOCATION: public/shop-templates/common/products/product-manager.js - V18 FINAL - NO LOCALSTORAGE - NO TOKEN - 401 FIXED
class WorldProductManager {
  constructor(){
    const params = new URLSearchParams(location.search);
    this.shopId = params.get('shopId') || '';
    this.shopType = params.get('type') || params.get('shopType') || 'kirana';
    this.role = this.detectRole();
    this.API = '/api/world-products';
    console.log('WorldProductManager V18 - shopId from URL:', this.shopId, 'shopType:', this.shopType, 'role:', this.role);
  }

  detectRole(){
    const path = location.pathname;
    if(path.includes('dashboard')) return 'dashboard';
    if(path.includes('user-view') || path.includes('customer-view') || path.includes('shop-view')) return 'customer';
    if(path.includes('admin-panel')) return 'admin';
    if(path.includes('area-manager') || path.includes('area-dashboard')) return 'area-manager';
    return 'dashboard';
  }

  // CREATE - NO AUTH HEADER
  async addProduct(data){
    data.shopId = data.shopId || this.shopId;
    data.shopType = data.shopType || this.shopType;
    data.isActive = true;
    data.role = this.role;

    if(!data.shopId){
      alert('shopId missing - URL me ?shopId=xxx lagao');
      throw new Error('shopId missing');
    }

    console.log('Saving NO AUTH - shopId:', data.shopId, 'shopType:', data.shopType, data.name);

    const res = await fetch(this.API, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(data)
    }).then(async r=>{
      if(!r.ok){
        const txt = await r.text();
        throw new Error(`HTTP ${r.status}: ${txt.slice(0,200)}`);
      }
      return r.json();
    }).catch(e=>{
      console.error('addProduct failed:', e);
      return {success:false, message:e.message};
    });

    return res;
  }

  // READ
  async getProducts(filter={}){
    const shopType = filter.shopType || this.shopType;
    const shopId = filter.shopId || this.shopId;
    let url = `${this.API}?shopType=${shopType}`;
    if(shopId) url += `&shopId=${shopId}`;
    
    console.log('Fetching products NO AUTH:', url, 'role:', this.role);
    const res = await fetch(url).then(r=>r.json()).catch(()=>({data:[]}));
    console.log('API response:', res);
    const list = res.data || res.products || [];
    return this.filterByRole(list);
  }

  filterByRole(products){
    if(!Array.isArray(products)) return [];
    if(this.role === 'customer') return products.filter(p=> p.isActive!==false && (p.stock||0)>0);
    return products; // dashboard, admin, area-manager ko sab
  }

  // UPDATE
  async updateProduct(id, data){
    const res = await fetch(`${this.API}/${id}`,{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(data)
    }).then(r=>r.json()).catch(e=>({success:false, message:e.message}));
    return res;
  }

  // DELETE - soft delete
  async deleteProduct(id){
    const res = await fetch(`${this.API}/${id}`,{
      method:'DELETE'
    }).then(r=>r.json()).catch(e=>({success:false, message:e.message}));
    return res;
  }

  // SEED - Quick Add
  async seedProducts(shopType){
    try{
      const type = shopType || this.shopType;
      const url = `./${type}.seed.js?v=18&t=${Date.now()}`;
      const text = await fetch(url).then(r=>r.text());
      const cleaned = text.replace(/export\s+const\s+/g,'var ').replace(/export\s+default[\s\S]*$/gm,'');
      const fn = new Function(cleaned + `\n return {PRODUCTS};`);
      const {PRODUCTS} = fn();
      let count=0;
      for(let p of PRODUCTS){
        p.shopId = this.shopId;
        p.shopType = type;
        p.isActive = true;
        const res = await this.addProduct(p);
        if(res.success) count++;
      }
      return count;
    }catch(e){
      console.error('seedProducts failed', e);
      return 0;
    }
  }

  async getAllShopsProducts(){
    const res = await fetch(`${this.API}?role=${this.role}`).then(r=>r.json()).catch(()=>({data:[]}));
    return res.data||[];
  }
}

window.WorldProductManager = new WorldProductManager();
window.ProductManager = window.WorldProductManager;