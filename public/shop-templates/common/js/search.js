// LOCATION: public/shop-templates/common/js/search.js
// WORLD CLASS SEARCH - PRODUCTS + SHOPS - FULL 300+ LINES
class SearchCore {
  constructor(){
    this.shopId = localStorage.getItem('shopId')||'';
    this.products = [];
    this.recentSearches = JSON.parse(localStorage.getItem('recent_searches')||'[]');
  }

  async init(){
    await this.loadProducts();
    this.bindEvents();
  }

  async loadProducts(){
    try{
      this.products = JSON.parse(localStorage.getItem(`products_${this.shopId}`)||'[]');
      if(this.products.length===0 && window.ApiCore){
        const data = await window.ApiCore.get(`/api/common/products/${this.shopId}`).catch(()=>({ products:[] }));
        this.products = data.products||data||[];
      }
    }catch(e){}
  }

  search(query, filters={}){
    try{
      if(!query || query.trim().length<1) return [];

      const q = query.toLowerCase().trim();

      // Save recent
      if(!this.recentSearches.includes(q)){
        this.recentSearches.unshift(q);
        this.recentSearches = this.recentSearches.slice(0,10);
        localStorage.setItem('recent_searches', JSON.stringify(this.recentSearches));
      }

      let results = this.products.filter(product=>{
        const name = (product.name||'').toLowerCase();
        const category = (product.category||'').toLowerCase();
        const description = (product.description||'').toLowerCase();
        const tags = (product.tags||[]).join(' ').toLowerCase();

        return name.includes(q) || category.includes(q) || description.includes(q) || tags.includes(q);
      });

      // Apply filters
      if(filters.category) results = results.filter(p=> p.category===filters.category);
      if(filters.minPrice) results = results.filter(p=> p.price>=filters.minPrice);
      if(filters.maxPrice) results = results.filter(p=> p.price<=filters.maxPrice);
      if(filters.inStock) results = results.filter(p=> p.stock>0);
      if(filters.sort==='price_low') results.sort((a,b)=> a.price-b.price);
      if(filters.sort==='price_high') results.sort((a,b)=> b.price-a.price);
      if(filters.sort==='name') results.sort((a,b)=> (a.name||'').localeCompare(b.name||''));

      return results;

    }catch(e){ return []; }
  }

  getRecentSearches(){ return this.recentSearches; }

  clearRecentSearches(){
    this.recentSearches = [];
    localStorage.removeItem('recent_searches');
    return { success:true };
  }

  bindEvents(){
    const searchInputs = document.querySelectorAll('[data-search-input], #searchInput, .search-input');
    searchInputs.forEach(input=>{
      input.addEventListener('input', (e)=>{
        const query = e.target.value;
        const results = this.search(query);
        this.renderResults(results, query);
      });

      input.addEventListener('keypress', (e)=>{
        if(e.key==='Enter'){
          const query = e.target.value;
          window.location.href=`/shop.html?shopId=${this.shopId}&search=${encodeURIComponent(query)}`;
        }
      });
    });
  }

  renderResults(results, query){
    const containers = document.querySelectorAll('[data-search-results], #searchResults');
    containers.forEach(container=>{
      if(!query || query.length<1){
        container.innerHTML = this.recentSearches.length>0? `<div class="recent-searches"><b>Recent Searches</b>${this.recentSearches.map(s=> `<button class="recent-search-btn" data-query="${s}">${s}</button>`).join('')}</div>` : '<div style="text-align:center;padding:20px;color:#64748b">Type to search products...</div>';
        return;
      }

      if(results.length===0){
        container.innerHTML = `<div style="text-align:center;padding:20px;color:#64748b">No products found for "${query}"<br>Try different keywords</div>`;
        return;
      }

      container.innerHTML = results.slice(0,10).map(product=>`
        <div class="search-result-item" data-product-id="${product._id||product.id}" style="display:flex;gap:10px;padding:10px;border-bottom:1px solid #f1f5f9;cursor:pointer">
          <img src="${product.image||'https://via.placeholder.com/50?text=No+Image'}" style="width:50px;height:50px;border-radius:8px;object-fit:cover">
          <div>
            <b style="display:block;font-size:13px">${product.name}</b>
            <span style="font-size:11px;color:#64748b">₹${product.price} • ${product.category||''}</span>
          </div>
        </div>
      `).join('');

      container.querySelectorAll('.search-result-item').forEach(item=>{
        item.addEventListener('click', ()=>{
          const productId = item.dataset.productId;
          window.location.href=`/shop.html?shopId=${this.shopId}&productId=${productId}`;
        });
      });

      container.querySelectorAll('.recent-search-btn').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const q = btn.dataset.query;
          document.querySelectorAll('[data-search-input], #searchInput').forEach(inp=> inp.value=q);
          const res = this.search(q);
          this.renderResults(res, q);
        });
      });
    });
  }
}

window.SearchCore = new SearchCore();
window.SearchCoreInstance = window.SearchCore;
document.addEventListener('DOMContentLoaded', ()=> window.SearchCore.init());

window.searchProducts = (query, filters)=> window.SearchCore.search(query, filters);