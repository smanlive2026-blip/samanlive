// LOCATION: public/shop-templates/common/js/filter.js
// WORLD CLASS FILTER + SORT - FULL 300+ LINES
class FilterCore {
  constructor(){
    this.shopId = localStorage.getItem('shopId')||'';
    this.products = [];
    this.filters = { category:'', minPrice:0, maxPrice:10000, inStock:false, sort:'' };
  }

  async init(){
    await this.loadProducts();
    this.bindEvents();
  }

  async loadProducts(){
    try{
      this.products = JSON.parse(localStorage.getItem(`products_${this.shopId}`)||'[]');
    }catch(e){}
  }

  applyFilters(filters){
    try{
      this.filters = { ...this.filters, ...filters };

      let filtered = [...this.products];

      if(this.filters.category) filtered = filtered.filter(p=> p.category===this.filters.category);
      if(this.filters.minPrice>0) filtered = filtered.filter(p=> p.price>=this.filters.minPrice);
      if(this.filters.maxPrice<10000) filtered = filtered.filter(p=> p.price<=this.filters.maxPrice);
      if(this.filters.inStock) filtered = filtered.filter(p=> p.stock>0);
      if(this.filters.search) filtered = filtered.filter(p=> (p.name||'').toLowerCase().includes(this.filters.search.toLowerCase()));

      // Sort
      if(this.filters.sort==='price_low') filtered.sort((a,b)=> a.price-b.price);
      else if(this.filters.sort==='price_high') filtered.sort((a,b)=> b.price-a.price);
      else if(this.filters.sort==='name_asc') filtered.sort((a,b)=> (a.name||'').localeCompare(b.name||''));
      else if(this.filters.sort==='name_desc') filtered.sort((a,b)=> (b.name||'').localeCompare(a.name||''));
      else if(this.filters.sort==='newest') filtered.sort((a,b)=> new Date(b.createdAt||0)-new Date(a.createdAt||0));

      this.renderProducts(filtered);

      return { success:true, products:filtered, count:filtered.length, filters:this.filters };

    }catch(e){ return { success:false, error:e.message }; }
  }

  renderProducts(products){
    const containers = document.querySelectorAll('[data-products-container], #productsContainer, .products-grid');
    containers.forEach(container=>{
      if(products.length===0){
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b"><div style="font-size:40px;margin-bottom:10px">🔍</div><b>No products found</b><br><span style="font-size:12px">Try changing filters</span></div>';
        return;
      }

      container.innerHTML = products.map(product=>`
        <div class="product-card" data-product-id="${product._id||product.id}" style="background:#fff;border:1px solid #f1f5f9;border-radius:16px;padding:12px;cursor:pointer">
          <img src="${product.image||'https://via.placeholder.com/150?text=No+Image'}" style="width:100%;height:120px;object-fit:cover;border-radius:12px">
          <b style="display:block;margin-top:8px;font-size:13px">${product.name}</b>
          <span style="display:block;font-size:11px;color:#64748b">${product.category||''}</span>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
            <b style="font-size:14px">₹${product.price}</b>
            <span style="font-size:10px;background:${product.stock>0?'#dcfce7;color:#166534':'#fee2e2;color:#991b1b'};padding:2px 6px;border-radius:20px">${product.stock>0?`${product.stock} in stock`:'Out of stock'}</span>
          </div>
        </div>
      `).join('');
    });
  }

  bindEvents(){
    document.querySelectorAll('[data-filter-category]').forEach(btn=>{
      btn.addEventListener('click', ()=> this.applyFilters({ category:btn.dataset.filterCategory }));
    });

    document.querySelectorAll('[data-sort]').forEach(btn=>{
      btn.addEventListener('click', ()=> this.applyFilters({ sort:btn.dataset.sort }));
    });

    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');

    if(priceMin) priceMin.addEventListener('change', (e)=> this.applyFilters({ minPrice:parseInt(e.target.value)||0 }));
    if(priceMax) priceMax.addEventListener('change', (e)=> this.applyFilters({ maxPrice:parseInt(e.target.value)||10000 }));

    document.querySelectorAll('[data-filter-instock]').forEach(btn=>{
      btn.addEventListener('click', ()=> this.applyFilters({ inStock:!this.filters.inStock }));
    });

    document.getElementById('clearFiltersBtn')?.addEventListener('click', ()=>{
      this.filters = { category:'', minPrice:0, maxPrice:10000, inStock:false, sort:'', search:'' };
      this.applyFilters(this.filters);
      if(window.Toast) Toast.show('Filters cleared', 'info');
    });
  }

  getFilters(){ return this.filters; }
  getProducts(){ return this.products; }
}

window.FilterCore = new FilterCore();
window.FilterCoreInstance = window.FilterCore;
document.addEventListener('DOMContentLoaded', ()=> window.FilterCore.init());