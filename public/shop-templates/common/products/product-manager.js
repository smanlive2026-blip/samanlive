// LOCATION: public/shop-templates/common/products/product-manager.js - V20 FINAL - NO LOCALSTORAGE - NO TOKEN - BULK FAST - 401 + BUFFERING FIXED
class WorldProductManager {
  constructor(){
    const params = new URLSearchParams(location.search);
    this.shopId = params.get('shopId') || '';
    this.shopType = params.get('type') || params.get('shopType') || 'kirana';
    this.role = this.detectRole();
    this.API = '/api/world-products';
    console.log('WorldProductManager V20 BULK - shopId from URL:', this.shopId, 'shopType:', this.shopType, 'role:', this.role);
  }

  detectRole(){
    const path = location.pathname;
    if(path.includes('dashboard')) return 'dashboard';
    if(path.includes('user-view') || path.includes('customer-view') || path.includes('shop-view')) return 'customer';
    if(path.includes('admin-panel')) return 'admin';
    if(path.includes('area-manager') || path.includes('area-dashboard')) return 'area-manager';
    return 'dashboard';
  }

  // CREATE SINGLE - NO AUTH HEADER
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
      const j = await r.json();
      console.log(j.success ? '✅ Saved:' : '❌ Failed:', data.name, j.message||'');
      return j;
    }).catch(e=>{
      console.error('addProduct failed:', e);
      return {success:false, message:e.message};
    });

    return res;
  }

  // READ - NO AUTH
  async getProducts(filter={}){
    const shopType = filter.shopType || this.shopType;
    const shopId = filter.shopId || this.shopId;
    let url = `${this.API}?shopType=${shopType}&role=${this.role}`;
    if(shopId) url += `&shopId=${shopId}`;
    
    console.log('Fetching products NO AUTH:', url, 'role:', this.role);
    const res = await fetch(url).then(r=>r.json()).catch(()=>({data:[]}));
    console.log('API response count:', res.count||0, 'total:', res.total||0);
    const list = res.data || res.products || [];
    return this.filterByRole(list);
  }

  filterByRole(products){
    if(!Array.isArray(products)) return [];
    if(this.role === 'customer') return products.filter(p=> p.isActive!==false && (p.stock||0)>0);
    return products;
  }

  // UPDATE - NO AUTH
  async updateProduct(id, data){
    console.log('Updating NO AUTH:', id, data.name||'');
    const res = await fetch(`${this.API}/${id}`,{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(data)
    }).then(r=>r.json()).catch(e=>({success:false, message:e.message}));
    console.log('Update result:', res.success? '✅':'❌', res.message||'');
    return res;
  }

  // DELETE - soft delete - NO AUTH
  async deleteProduct(id){
    console.log('Deleting NO AUTH:', id);
    const res = await fetch(`${this.API}/${id}`,{
      method:'DELETE'
    }).then(r=>r.json()).catch(e=>({success:false, message:e.message}));
    console.log('Delete result:', res.success? '✅':'❌');
    return res;
  }

  // SEED - Quick Add - V20 BULK VERSION - 100 REQUEST KI JAGAH 1 REQUEST
  async seedProducts(shopType){
    try{
      const type = shopType || this.shopType;
      const url = `./${type}.seed.js?v=20&t=${Date.now()}`;
      console.log('Loading seed:', url);
      const text = await fetch(url).then(r=>r.text());
      console.log('Raw seed length:', text.length, 'has exports:', text.includes('export'));
      const cleaned = text.replace(/export\s+const\s+/g,'var ').replace(/export\s+default[\s\S]*$/gm,'');
      const fn = new Function(cleaned + `\n return {PRODUCTS};`);
      const {PRODUCTS} = fn();
      console.log('Converted to ESM - PRODUCTS:', PRODUCTS.length);

      if(!PRODUCTS || PRODUCTS.length===0){
        alert('Seed file empty');
        return 0;
      }

      // ===== NEW BULK LOGIC - Screenshot wala 100 loop bug fix =====
      if(PRODUCTS.length > 10){
        console.log(`BULK MODE: Sending ${PRODUCTS.length} products in 1 request to ${this.API}/bulk`);
        const payload = PRODUCTS.map(p=>({
          ...p,
          shopId: this.shopId,
          shopType: type,
          isActive: true,
          stock: p.stock || 50
        }));

        const res = await fetch(`${this.API}/bulk`, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ products: payload, shopId: this.shopId, shopType: type })
        }).then(async r=>{
          const j = await r.json();
          console.log('BULK API Response:', j);
          return j;
        }).catch(e=>{
          console.error('BULK failed, falling back to single:', e);
          return {success:false};
        });

        if(res.success){
          console.log(`✅ BULK SUCCESS: ${res.count} products added`);
          alert(`✅ ${res.count} products added - FAST BULK MODE`);
          return res.count;
        }else{
          console.log('Bulk failed, trying single mode...');
        }
      }

      // Fallback single mode for <10 products or bulk fail
      let count=0;
      for(let p of PRODUCTS){
        p.shopId = this.shopId;
        p.shopType = type;
        p.isActive = true;
        const res = await this.addProduct(p);
        if(res.success) count++;
        await new Promise(r=>setTimeout(r, 100)); // 100ms delay to avoid buffering timeout
      }
      console.log(`Single mode done: ${count}/${PRODUCTS.length}`);
      alert(`✅ ${count} products added`);
      return count;
    }catch(e){
      console.error('seedProducts failed', e);
      alert('Seed failed: '+e.message);
      return 0;
    }
  }

  async getAllShopsProducts(){
    const res = await fetch(`${this.API}?role=${this.role}`).then(r=>r.json()).catch(()=>({data:[]}));
    return res.data||[];
  }

  // Helper for product-form.html quick products Add button
  async bulkAdd(products){
    if(!Array.isArray(products)) products = [products];
    const payload = products.map(p=>({ ...p, shopId: this.shopId, shopType: this.shopType, isActive:true }));
    return fetch(`${this.API}/bulk`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ products: payload, shopId: this.shopId, shopType: this.shopType })
    }).then(r=>r.json());
  }
}

window.WorldProductManager = new WorldProductManager();
window.ProductManager = window.WorldProductManager;
console.log('✅ Product Manager V20 Loaded - BULK MODE READY');