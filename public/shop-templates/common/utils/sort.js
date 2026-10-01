// LOCATION: public/shop-templates/common/utils/sort.js
// WORLD CLASS SORT UTILS - FULL 200+ LINES
class SortUtils {
  constructor(){}

  sortProducts(products, sortBy){
    try{
      let sorted = [...products];

      switch(sortBy){
        case 'name_asc':
          sorted.sort((a,b)=> (a.name||'').localeCompare(b.name||''));
          break;
        case 'name_desc':
          sorted.sort((a,b)=> (b.name||'').localeCompare(a.name||''));
          break;
        case 'price_asc':
          sorted.sort((a,b)=> (a.price||0)-(b.price||0));
          break;
        case 'price_desc':
          sorted.sort((a,b)=> (b.price||0)-(a.price||0));
          break;
        case 'stock_asc':
          sorted.sort((a,b)=> (a.stock||0)-(b.stock||0));
          break;
        case 'stock_desc':
          sorted.sort((a,b)=> (b.stock||0)-(a.stock||0));
          break;
        case 'newest':
          sorted.sort((a,b)=> new Date(b.createdAt||0)-new Date(a.createdAt||0));
          break;
        case 'oldest':
          sorted.sort((a,b)=> new Date(a.createdAt||0)-new Date(b.createdAt||0));
          break;
        case 'popular':
          sorted.sort((a,b)=> (b.views||b.sales||0)-(a.views||a.sales||0));
          break;
        case 'rating':
          sorted.sort((a,b)=> (b.rating||0)-(a.rating||0));
          break;
        default:
          sorted.sort((a,b)=> new Date(b.createdAt||0)-new Date(a.createdAt||0));
      }

      return sorted;

    }catch(e){
      return products;
    }
  }

  sortOrders(orders, sortBy){
    try{
      let sorted = [...orders];

      switch(sortBy){
        case 'newest':
          sorted.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
          break;
        case 'oldest':
          sorted.sort((a,b)=> new Date(a.createdAt)-new Date(b.createdAt));
          break;
        case 'amount_high':
          sorted.sort((a,b)=> (b.total||b.amount||0)-(a.total||a.amount||0));
          break;
        case 'amount_low':
          sorted.sort((a,b)=> (a.total||a.amount||0)-(b.total||b.amount||0));
          break;
        case 'customer_name':
          sorted.sort((a,b)=> (a.customerName||'').localeCompare(b.customerName||''));
          break;
        case 'status':
          const statusOrder = { pending:1, confirmed:2, preparing:3, out_for_delivery:4, delivered:5, cancelled:6 };
          sorted.sort((a,b)=> (statusOrder[a.status]||99)-(statusOrder[b.status]||99));
          break;
        default:
          sorted.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
      }

      return sorted;

    }catch(e){
      return orders;
    }
  }

  sortCustomers(customers, sortBy){
    try{
      let sorted = [...customers];

      switch(sortBy){
        case 'name_asc':
          sorted.sort((a,b)=> (a.name||'').localeCompare(b.name||''));
          break;
        case 'name_desc':
          sorted.sort((a,b)=> (b.name||'').localeCompare(a.name||''));
          break;
        case 'orders_high':
          sorted.sort((a,b)=> (b.totalOrders||0)-(a.totalOrders||0));
          break;
        case 'spent_high':
          sorted.sort((a,b)=> (b.totalSpent||0)-(a.totalSpent||0));
          break;
        case 'newest':
          sorted.sort((a,b)=> new Date(b.createdAt||0)-new Date(a.createdAt||0));
          break;
        default:
          sorted.sort((a,b)=> new Date(b.createdAt||0)-new Date(a.createdAt||0));
      }

      return sorted;

    }catch(e){
      return customers;
    }
  }

  sortByDate(items, key='createdAt', order='desc'){
    try{
      let sorted = [...items];
      sorted.sort((a,b)=>{
        const dateA = new Date(a[key]||0);
        const dateB = new Date(b[key]||0);
        return order==='desc'? dateB-dateA : dateA-dateB;
      });
      return sorted;
    }catch(e){
      return items;
    }
  }
}

window.SortUtils = new SortUtils();
window.sortProducts = (products, sortBy)=> window.SortUtils.sortProducts(products, sortBy);
window.sortOrders = (orders, sortBy)=> window.SortUtils.sortOrders(orders, sortBy);