// LOCATION: public/shop-templates/mobile/quick-add-products.js
// MOBILE READY PRODUCTS - QUICK ADD - CONNECTED TO common/inventory/barcode-scanner.html

const MOBILE_QUICK_PRODUCTS = [
  // iPhones
  { name:'iPhone 15 Pro Max 256GB', brand:'Apple', category:'smartphone', price:134900, originalPrice:159900, stock:5, ram:'8GB', storage:'256GB', color:'Natural Titanium', warranty:'1 Year', emi:true, image:'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300', specs:'A17 Pro, 48MP, 5G, iOS 17' },
  { name:'iPhone 15 Pro 128GB', brand:'Apple', category:'smartphone', price:119900, originalPrice:134900, stock:8, ram:'8GB', storage:'128GB', color:'Blue Titanium', warranty:'1 Year', emi:true, image:'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300', specs:'A17 Pro, 48MP, 5G' },
  { name:'iPhone 14 128GB', brand:'Apple', category:'smartphone', price:59999, originalPrice:79900, stock:10, ram:'6GB', storage:'128GB', color:'Midnight', warranty:'1 Year', emi:true, image:'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300', specs:'A15 Bionic, 12MP' },

  // Samsung
  { name:'Samsung Galaxy S24 Ultra 512GB', brand:'Samsung', category:'smartphone', price:129999, originalPrice:139999, stock:8, ram:'12GB', storage:'512GB', color:'Titanium Black', warranty:'1 Year', emi:true, image:'https://images.unsplash.com/photo-1610945265064-0e34e730d4d0?w=300', specs:'Snapdragon 8 Gen 3, 200MP, S-Pen' },
  { name:'Samsung Galaxy S24 256GB', brand:'Samsung', category:'smartphone', price:79999, originalPrice:89999, stock:12, ram:'8GB', storage:'256GB', color:'Marble Gray', warranty:'1 Year', emi:true, image:'https://images.unsplash.com/photo-1610945265064-0e34e730d4d0?w=300', specs:'Exynos 2400, 50MP' },
  { name:'Samsung Galaxy M34 128GB', brand:'Samsung', category:'smartphone', price:16999, originalPrice:24999, stock:20, ram:'8GB', storage:'128GB', color:'Waterfall Blue', warranty:'1 Year', emi:true, image:'https://images.unsplash.com/photo-1610945265064-0e34e730d4d0?w=300', specs:'Dimensity 1080, 50MP' },

  // OnePlus
  { name:'OnePlus 12R 256GB', brand:'OnePlus', category:'smartphone', price:42999, originalPrice:49999, stock:12, ram:'16GB', storage:'256GB', color:'Iron Gray', warranty:'1 Year', emi:true, image:'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300', specs:'Snapdragon 8 Gen 2, 50MP, 100W' },
  { name:'OnePlus Nord 3 256GB', brand:'OnePlus', category:'smartphone', price:33999, originalPrice:37999, stock:15, ram:'12GB', storage:'256GB', color:'Misty Green', warranty:'1 Year', emi:true, image:'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300', specs:'Dimensity 9000, 50MP' },

  // Xiaomi
  { name:'Redmi Note 13 Pro 256GB', brand:'Xiaomi', category:'smartphone', price:24999, originalPrice:29999, stock:20, ram:'12GB', storage:'256GB', color:'Midnight Black', warranty:'1 Year', emi:true, image:'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300', specs:'Snapdragon 7s Gen 2, 200MP' },
  { name:'Redmi 12 128GB', brand:'Xiaomi', category:'smartphone', price:10999, originalPrice:14999, stock:25, ram:'6GB', storage:'128GB', color:'Pastel Blue', warranty:'1 Year', emi:true, image:'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300', specs:'Helio G88, 50MP' },

  // Vivo/Oppo
  { name:'Vivo V30 Pro 256GB', brand:'Vivo', category:'smartphone', price:41999, originalPrice:46999, stock:6, ram:'12GB', storage:'256GB', color:'Peacock Green', warranty:'1 Year', emi:true, image:'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300', specs:'Dimensity 8200, 50MP Zeiss' },
  { name:'Oppo Reno 11 Pro 256GB', brand:'Oppo', category:'smartphone', price:39999, originalPrice:44999, stock:8, ram:'12GB', storage:'256GB', color:'Wave Green', warranty:'1 Year', emi:true, image:'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300', specs:'Dimensity 8200, 50MP' },

  // Accessories
  { name:'AirPods Pro 2nd Gen', brand:'Apple', category:'accessories', price:24900, originalPrice:26900, stock:15, warranty:'1 Year', image:'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=300', specs:'ANC, MagSafe, H2 Chip' },
  { name:'Samsung Galaxy Watch 6 44mm', brand:'Samsung', category:'accessories', price:29999, originalPrice:32999, stock:10, warranty:'1 Year', image:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300', specs:'Bluetooth, GPS, Health' },
  { name:'OnePlus Buds Pro 2', brand:'OnePlus', category:'accessories', price:11999, originalPrice:13999, stock:20, warranty:'1 Year', image:'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=300', specs:'ANC, 39H battery' },
  { name:'Boat Rockerz 255 Pro+', brand:'Boat', category:'accessories', price:1499, originalPrice:2990, stock:40, warranty:'1 Year', image:'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=300', specs:'40H battery, Fast charge' },
  { name:'Anker Power Bank 20000mAh', brand:'Anker', category:'accessories', price:2999, originalPrice:3999, stock:25, warranty:'1 Year', image:'https://images.unsplash.com/photo-1609098715600-b8fe47f65d2c?w=300', specs:'PD Fast Charge, 2 ports' },

  // Feature Phones
  { name:'Nokia 105 Single SIM', brand:'Nokia', category:'feature', price:1499, originalPrice:1999, stock:30, warranty:'1 Year', image:'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=300', specs:'FM Radio, Torch, 1.8"' },
  { name:'Nokia 110 4G', brand:'Nokia', category:'feature', price:2499, originalPrice:2999, stock:25, warranty:'1 Year', image:'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=300', specs:'4G, Camera, Internet' },
  { name:'Samsung Guru Music 2', brand:'Samsung', category:'feature', price:1999, originalPrice:2499, stock:20, warranty:'1 Year', image:'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=300', specs:'Music, FM, Dual SIM' }
];

class MobileQuickAdd {
  constructor(){
    this.shopId = localStorage.getItem('shopId')||'';
    this.products = MOBILE_QUICK_PRODUCTS;
  }

  getAll(){ return this.products; }

  getByCategory(category){
    return this.products.filter(p=> p.category===category);
  }

  getByBrand(brand){
    return this.products.filter(p=> p.brand===brand);
  }

  async addToShop(productData){
    try{
      const shopProducts = JSON.parse(localStorage.getItem(`products_${this.shopId}`)||'[]');

      const newProduct = {
        id:'m'+Date.now()+Math.random().toString(36).substr(2,5),
        ...productData,
        createdAt:new Date().toISOString(),
        shopId:this.shopId
      };

      shopProducts.unshift(newProduct);
      localStorage.setItem(`products_${this.shopId}`, JSON.stringify(shopProducts));

      // Use common inventory - common/inventory/inventory.js
      if(window.InventoryCore){
        await window.InventoryCore.addProduct(newProduct);
      }

      // Use common API - common/core/api-core.js
      if(window.ApiCore){
        await window.ApiCore.post(`/api/common/inventory/${this.shopId}/add`, newProduct).catch(()=>{});
      }

      return { success:true, product:newProduct, message:`${productData.name} added ✅` };

    }catch(e){ return { success:false, error:e.message }; }
  }

  async addMultiple(productIds){
    try{
      const results = [];
      for(let id of productIds){
        const product = this.products.find(p=> p.name===id || p.id===id);
        if(product){
          const result = await this.addToShop(product);
          results.push(result);
        }
      }

      return { success:true, count:results.length, results, message:`${results.length} mobiles added ✅` };

    }catch(e){ return { success:false, error:e.message }; }
  }

  renderQuickAddList(containerId, category='all'){
    const container = document.getElementById(containerId);
    if(!container) return;

    let filtered = category==='all'? this.products : this.products.filter(p=> p.category===category);

    container.innerHTML = filtered.map(product=>`
      <div class="quick-product-item" data-product-name="${product.name}" style="display:flex;gap:10px;padding:10px;border:1px solid #f1f5f9;border-radius:12px;margin-bottom:8px;cursor:pointer;background:#fff">
        <img src="${product.image}" style="width:60px;height:60px;border-radius:8px;object-fit:cover" onerror="this.src='https://via.placeholder.com/60?text=📱'">
        <div style="flex:1">
          <b style="display:block;font-size:12px;font-weight:800">${product.name}</b>
          <span style="display:block;font-size:10px;color:#64748b">${product.brand} • ${product.ram||''} ${product.storage||''} • ${product.specs||''}</span>
          <div style="display:flex;gap:6px;margin-top:4px"><b style="font-size:12px">₹${product.price.toLocaleString('en-IN')}</b><span style="font-size:10px;text-decoration:line-through;color:#94a3b8">₹${product.originalPrice.toLocaleString('en-IN')}</span></div>
        </div>
        <button class="add-quick-btn" data-product-name="${product.name}" style="background:#0f172a;color:#fff;border:none;padding:8px 12px;border-radius:20px;font-weight:800;font-size:11px;cursor:pointer;align-self:center">+ Add</button>
      </div>
    `).join('');

    container.querySelectorAll('.add-quick-btn').forEach(btn=>{
      btn.addEventListener('click', async (e)=>{
        e.stopPropagation();
        const productName = btn.dataset.productName;
        const product = this.products.find(p=> p.name===productName);
        if(product){
          btn.innerText='Adding...';
          btn.disabled=true;
          const result = await this.addToShop(product);
          if(result.success){
            btn.innerText='✅ Added';
            btn.style.background='#10b981';
            if(window.Toast) Toast.show(`${product.name} added ✅`, 'success');
          } else {
            btn.innerText='+ Add';
            btn.disabled=false;
          }
        }
      });
    });
  }
}

window.MobileQuickAdd = new MobileQuickAdd();
window.MobileQuickAddInstance = window.MobileQuickAdd;
window.MOBILE_QUICK_PRODUCTS = MOBILE_QUICK_PRODUCTS;

document.addEventListener('DOMContentLoaded', ()=>{
  // Auto render if container exists
  if(document.getElementById('quickAddList')){
    window.MobileQuickAdd.renderQuickAddList('quickAddList', 'all');
  }
});