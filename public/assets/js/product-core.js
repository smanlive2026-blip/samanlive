// LOCATION: public/assets/js/product-core.js - V21 - WORLD - 50 MODES - NO ENUM - FULL CODE
class WorldProductManager {
  constructor(){
    this.shopId = localStorage.getItem('shopId') || localStorage.getItem('last_shopId') || window.shopId || '';
    this.shopType = (localStorage.getItem('shopType') || window.shopType || window.CURRENT_SHOP_TYPE || 'kirana').toLowerCase();
    this.mode = window.getModeForShop ? window.getModeForShop(this.shopType) : {id:'retail',name:'Retail',icon:'🛒',color:'#10b981'};
    console.log(`🌍 WorldProductManager V21 - shopId:${this.shopId} shopType:${this.shopType} mode:${this.mode.id}`);
  }

  async getProducts({ shopId, shopType, role='dashboard', businessMode, search, page=1, limit=100 } = {}){
    const finalShopId = shopId || this.shopId;
    const finalShopType = (shopType || this.shopType).toLowerCase();
    const finalMode = businessMode || this.mode.id;
    const url = `/api/world-products?shopId=${finalShopId}&shopType=${finalShopType}&role=${role}&businessMode=${finalMode}&page=${page}&limit=${limit}&t=${Date.now()}`;
    try{
      const res = await fetch(url).then(r=>r.json());
      return res.data || res.products || [];
    }catch(e){ console.error('getProducts failed', e); return []; }
  }

  async createProduct(formData){
    formData.append('shopId', this.shopId);
    formData.append('shopType', this.shopType);
    formData.append('businessMode', this.mode.id);
    const res = await fetch('/api/world-products', { method:'POST', body: formData }).then(r=>r.json());
    return res;
  }

  async updateProduct(id, data){
    data.shopType = this.shopType;
    data.businessMode = this.mode.id;
    const res = await fetch(`/api/world-products/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)}).then(r=>r.json());
    return res;
  }

  async deleteProduct(id){
    const res = await fetch(`/api/world-products/${id}`, { method:'DELETE' }).then(r=>r.json());
    return res;
  }

  getModeFields(){
    if(window.getModeFieldsForShop) return window.getModeFieldsForShop(this.shopType);
    return [{key:'weight',label:'Weight',type:'text',required:true}];
  }

  renderProductForm(containerId){
    const container = document.getElementById(containerId);
    if(!container) return;
    const fields = this.getModeFields();
    container.innerHTML = fields.map(f=>{
      if(f.type==='select') return `<div class="field"><label>${f.label}</label><select name="${f.key}" ${f.required?'required':''}><option value="">Select ${f.label}</option>${(f.options||[]).map(o=>`<option value="${o}">${o}</option>`).join('')}</select></div>`;
      if(f.type==='textarea') return `<div class="field"><label>${f.label}</label><textarea name="${f.key}" placeholder="${f.placeholder||''}" ${f.required?'required':''}></textarea></div>`;
      if(f.type==='color') return `<div class="field"><label>${f.label}</label><input type="color" name="${f.key}" ${f.required?'required':''}></div>`;
      return `<div class="field"><label>${f.label}</label><input type="${f.type}" name="${f.key}" placeholder="${f.placeholder||''}" ${f.required?'required':''}></div>`;
    }).join('') + `<div style="margin-top:12px;padding:10px;background:${this.mode.color}15;border-radius:10px;font-size:12px;color:${this.mode.color};font-weight:800">${this.mode.icon} Mode: ${this.mode.name} | Shop: ${this.shopType} | No enum block</div>`;
  }
}

window.WorldProductManager = WorldProductManager;
console.log('✅ product-core.js V21 loaded - 50 modes - world connected');