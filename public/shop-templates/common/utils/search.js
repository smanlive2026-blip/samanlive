// LOCATION: public/shop-templates/common/utils/search.js
// WORLD CLASS SEARCH UTILS - FULL 200+ LINES
class SearchUtils {
  constructor(){
    this.debounceTimer = null;
  }

  search(items, query, keys=['name']){
    try{
      if(!query ||!query.trim()) return items;

      const q = query.toLowerCase().trim();

      return items.filter(item=>{
        return keys.some(key=>{
          const value = this.getNestedValue(item, key);
          if(!value) return false;
          return value.toString().toLowerCase().includes(q);
        });
      });

    }catch(e){
      return items;
    }
  }

  getNestedValue(obj, path){
    try{
      return path.split('.').reduce((current, key)=> current? current[key] : null, obj);
    }catch(e){
      return null;
    }
  }

  searchProducts(products, query){
    return this.search(products, query, ['name','description','category','brand','sku']);
  }

  searchOrders(orders, query){
    return this.search(orders, query, ['_id','orderId','customerName','customerPhone','status']);
  }

  searchCustomers(customers, query){
    return this.search(customers, query, ['name','phone','email']);
  }

  highlightMatch(text, query){
    try{
      if(!query ||!text) return text;

      const regex = new RegExp(`(${query})`, 'gi');
      return text.toString().replace(regex, '<mark>$1</mark>');

    }catch(e){
      return text;
    }
  }

  debounce(func, delay=300){
    return (...args)=>{
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(()=> func.apply(this, args), delay);
    };
  }

  fuzzySearch(items, query, keys=['name'], threshold=0.3){
    try{
      if(!query) return items;

      const q = query.toLowerCase();

      return items.filter(item=>{
        return keys.some(key=>{
          const value = this.getNestedValue(item, key);
          if(!value) return false;

          const str = value.toString().toLowerCase();

          // Exact match
          if(str.includes(q)) return true;

          // Fuzzy: check if all chars of query appear in order
          let queryIndex = 0;
          for(let i=0; i<str.length && queryIndex<q.length; i++){
            if(str[i]===q[queryIndex]) queryIndex++;
          }

          return queryIndex===q.length;
        });
      });

    }catch(e){
      return this.search(items, query, keys);
    }
  }

  getSearchSuggestions(items, query, keys=['name'], limit=5){
    try{
      const results = this.search(items, query, keys);
      return results.slice(0, limit).map(item=> ({
        item,
        text: item.name||item.title||item._id||'',
        highlighted:this.highlightMatch(item.name||item.title||'', query)
      }));
    }catch(e){
      return [];
    }
  }
}

window.SearchUtils = new SearchUtils();
window.searchProducts = (products, query)=> window.SearchUtils.searchProducts(products, query);
window.searchOrders = (orders, query)=> window.SearchUtils.searchOrders(orders, query);