// LOCATION: public/shop-templates/common/products/product-manager.js - WORLD BOSS - 70 SHOP MANAGER - V15 FINAL
class WorldProductManager {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('last_shopId') || '';
    this.shopType = new URLSearchParams(location.search).get('type') || localStorage.getItem('shopType') || 'kirana';
    this.role = this.detectRole(); // dashboard / user / admin / area-manager / customer
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

  // ===== CORE METHODS - SAB YAHI SE HOGA =====
  
  // CREATE
  async addProduct(data){
    data.shopId = this.shopId;
    data.shopType = data.shopType || this.shopType;
    const res = await fetch(this.API, {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('token')||'')},
      body: JSON.stringify(data)
    }).then(r=>r.json());
    if(res.success){
      window.ApiCore?.clearCache(this.API);
      window.SocketCore?.emit('product-updated',{shopId:this.shopId, shopType:data.shopType});
    }
    return res;
  }

  // READ - Shop ke hisab se data bhejega
  async getProducts(filter={}){
    const shopType = filter.shopType || this.shopType;
    const shopId = filter.shopId || this.shopId;
    let url = `${this.API}?shopType=${shopType}`;
    if(this.role === 'dashboard' || this.role === 'customer') url += `&shopId=${shopId}`;
    if(this.role === 'admin') url += `&role=admin`; // admin ko sab dikhega
    if(this.role === 'area-manager') url += `&role=area-manager&areaId=${localStorage.getItem('areaId')}`;
    
    // Filter by role visibility
    const res = await fetch(url).then(r=>r.json()).catch(()=>({data:[]}));
    return this.filterByRole(res.data||[]);
  }

  filterByRole(products){
    if(this.role === 'customer') return products.filter(p=> p.isActive!==false && p.stock>0); // customer ko sirf active + stock
    if(this.role === 'dashboard') return products; // owner ko sab
    if(this.role === 'admin') return products; // admin ko sab
    if(this.role === 'area-manager') return products; // area manager ko apne area ka
    return products;
  }

  // UPDATE
  async updateProduct(id, data){
    const res = await fetch(`${this.API}/${id}`,{
      method:'PUT',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('token')||'')},
      body: JSON.stringify(data)
    }).then(r=>r.json());
    if(res.success) window.ApiCore?.clearCache(this.API);
    return res;
  }

  // DELETE
  async deleteProduct(id){
    const res = await fetch(`${this.API}/${id}`,{
      method:'DELETE',
      headers:{'Authorization':'Bearer '+(localStorage.getItem('token')||'')}
    }).then(r=>r.json());
    if(res.success) window.ApiCore?.clearCache(this.API);
    return res;
  }

  // SEED - Quick Add 100
  async seedProducts(shopType){
    const seedFile = await import(`./${shopType}.seed.js`).catch(()=>null);
    const products = seedFile?.default || seedFile?.PRODUCTS || [];
    let count=0;
    for(let p of products){
      p.shopId = this.shopId;
      p.shopType = shopType;
      await this.addProduct(p);
      count++;
    }
    return count;
  }

  // For admin/area-manager - get all shops products
  async getAllShopsProducts(){
    const res = await fetch(`${this.API}?role=${this.role}`).then(r=>r.json());
    return res.data||[];
  }
}

window.WorldProductManager = new WorldProductManager();
window.ProductManager = window.WorldProductManager; // alias