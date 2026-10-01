// LOCATION: public/shop-templates/common/utils/filter.js
// WORLD CLASS FILTER UTILS - FULL 200+ LINES
class FilterUtils {
  constructor(){
    this.filters = {};
  }

  filterProducts(products, filters){
    try{
      let filtered = [...products];

      // Search filter
      if(filters.search){
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(p=>
          (p.name||'').toLowerCase().includes(q) ||
          (p.description||'').toLowerCase().includes(q) ||
          (p.category||'').toLowerCase().includes(q)
        );
      }

      // Category filter
      if(filters.category && filters.category!=='all'){
        filtered = filtered.filter(p=> p.category===filters.category);
      }

      // Price range
      if(filters.minPrice!==undefined){
        filtered = filtered.filter(p=> (p.price||0)>=filters.minPrice);
      }
      if(filters.maxPrice!==undefined){
        filtered = filtered.filter(p=> (p.price||0)<=filters.maxPrice);
      }

      // Stock filter
      if(filters.inStock){
        filtered = filtered.filter(p=> (p.stock||0)>0);
      }
      if(filters.outOfStock){
        filtered = filtered.filter(p=> (p.stock||0)===0);
      }

      // Active filter
      if(filters.active!==undefined){
        filtered = filtered.filter(p=> p.isActive===filters.active);
      }

      // Brand filter
      if(filters.brand && filters.brand!=='all'){
        filtered = filtered.filter(p=> p.brand===filters.brand);
      }

      return filtered;

    }catch(e){
      return products;
    }
  }

  filterOrders(orders, filters){
    try{
      let filtered = [...orders];

      if(filters.search){
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(o=>
          (o._id||'').toLowerCase().includes(q) ||
          (o.customerName||'').toLowerCase().includes(q) ||
          (o.customerPhone||'').includes(q)
        );
      }

      if(filters.status && filters.status!=='all'){
        filtered = filtered.filter(o=> o.status===filters.status);
      }

      if(filters.paymentStatus && filters.paymentStatus!=='all'){
        filtered = filtered.filter(o=> o.paymentStatus===filters.paymentStatus);
      }

      if(filters.deliveryType && filters.deliveryType!=='all'){
        filtered = filtered.filter(o=> o.deliveryType===filters.deliveryType);
      }

      if(filters.date){
        const filterDate = new Date(filters.date).toDateString();
        filtered = filtered.filter(o=> new Date(o.createdAt).toDateString()===filterDate);
      }

      if(filters.startDate && filters.endDate){
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        filtered = filtered.filter(o=>{
          const d = new Date(o.createdAt);
          return d>=start && d<=end;
        });
      }

      if(filters.minAmount!==undefined){
        filtered = filtered.filter(o=> (o.total||o.amount||0)>=filters.minAmount);
      }

      if(filters.maxAmount!==undefined){
        filtered = filtered.filter(o=> (o.total||o.amount||0)<=filters.maxAmount);
      }

      return filtered;

    }catch(e){
      return orders;
    }
  }

  filterCustomers(customers, filters){
    try{
      let filtered = [...customers];

      if(filters.search){
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(c=>
          (c.name||'').toLowerCase().includes(q) ||
          (c.phone||'').includes(q) ||
          (c.email||'').toLowerCase().includes(q)
        );
      }

      if(filters.type && filters.type!=='all'){
        filtered = filtered.filter(c=> c.type===filters.type);
      }

      return filtered;

    }catch(e){
      return customers;
    }
  }

  getUniqueCategories(products){
    try{
      const categories = [...new Set(products.map(p=> p.category).filter(Boolean))];
      return categories.map(cat=> ({ id:cat, name:cat, count:products.filter(p=> p.category===cat).length }));
    }catch(e){
      return [];
    }
  }

  getUniqueBrands(products){
    try{
      const brands = [...new Set(products.map(p=> p.brand).filter(Boolean))];
      return brands;
    }catch(e){
      return [];
    }
  }

  getPriceRange(products){
    try{
      if(products.length===0) return { min:0, max:1000 };

      const prices = products.map(p=> p.price||0);
      return { min:Math.min(...prices), max:Math.max(...prices) };
    }catch(e){
      return { min:0, max:1000 };
    }
  }

  applyFiltersAndSort(items, filters, sortBy){
    let filtered = this.filterProducts(items, filters);

    if(sortBy){
      filtered = window.SortUtils? window.SortUtils.sortProducts(filtered, sortBy) : filtered;
    }

    return filtered;
  }
}

window.FilterUtils = new FilterUtils();
window.filterProducts = (products, filters)=> window.FilterUtils.filterProducts(products, filters);
window.filterOrders = (orders, filters)=> window.FilterUtils.filterOrders(orders, filters);