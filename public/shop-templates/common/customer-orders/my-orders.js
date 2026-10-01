// LOCATION: common/customer-orders/my-orders.js - WORLD CLASS MY ORDERS JS - FULL
class MyOrdersCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
    this.userId = window.currentUser?._id || '';
    this.orders = [];
    this.filteredOrders = [];
    this.filters = { status:'all', date:'all', shop:'all', search:'' };
    this.sortBy = 'newest';
    this.page = 1;
    this.limit = 20;
  }

  async init(){
    await this.loadUser();
    await this.loadOrders();
    this.bindSearch();
    this.initSocket();
  }

  async loadUser(){
    if(window.UserCore){
      const user = await window.UserCore.getUser();
      if(user) this.userId = user._id;
    }
  }

  async loadOrders(){
    try{
      if(window.Loader) Loader.show('Loading orders...');
      let data;

      if(this.shopId){
        data = await window.ApiCore.get(`/api/common/customer-orders/${this.shopId}/${this.userId}`);
      } else {
        data = await window.ApiCore.get('/api/user/orders');
      }

      this.orders = data.orders || data || [];
      this.filteredOrders = [...this.orders];

      this.render();
      this.updateCounts();

    }catch(e){
      console.error('Load orders failed', e);
      if(window.ErrorHandler) ErrorHandler.handleApiError(e, 'my-orders');
    }finally{
      if(window.Loader) Loader.hide();
    }
  }

  updateCounts(){
    const counts = { all:this.orders.length };
    this.orders.forEach(o=>{
      const s = o.status||'placed';
      counts[s] = (counts[s]||0)+1;
    });

    Object.entries(counts).forEach(([status,count])=>{
      const el = document.querySelector(`[data-count="${status}"]`);
      if(el) el.innerText = count;
    });
  }

  applyFilters(){
    let result = [...this.orders];

    // Status filter
    if(this.filters.status!=='all'){
      result = result.filter(o=> o.status===this.filters.status);
    }

    // Date filter
    if(this.filters.date!=='all'){
      const now = new Date();
      result = result.filter(o=>{
        const orderDate = new Date(o.createdAt);
        if(this.filters.date==='today') return orderDate.toDateString()===now.toDateString();
        if(this.filters.date==='week'){
          const weekAgo = new Date(); weekAgo.setDate(now.getDate()-7);
          return orderDate >= weekAgo;
        }
        if(this.filters.date==='month'){
          const monthAgo = new Date(); monthAgo.setMonth(now.getMonth()-1);
          return orderDate >= monthAgo;
        }
        return true;
      });
    }

    // Search filter
    if(this.filters.search){
      const q = this.filters.search.toLowerCase();
      result = result.filter(o=>
        (o.orderId||'').toLowerCase().includes(q) ||
        (o.shopName||'').toLowerCase().includes(q) ||
        (o.items||[]).some(i=> (i.name||'').toLowerCase().includes(q))
      );
    }

    // Sort
    if(this.sortBy==='newest') result.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
    if(this.sortBy==='oldest') result.sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt));
    if(this.sortBy==='amount_high') result.sort((a,b)=> (b.total||0) - (a.total||0));
    if(this.sortBy==='amount_low') result.sort((a,b)=> (a.total||0) - (b.total||0));

    this.filteredOrders = result;
    this.render();
  }

  render(){
    const container = document.getElementById('ordersList');
    if(!container) return;

    if(this.filteredOrders.length===0){
      container.innerHTML = '';
      document.getElementById('ordersEmpty').style.display='block';
      return;
    }

    document.getElementById('ordersEmpty').style.display='none';
    container.style.display='flex';

    // Use ProductCardRenderer if exists else simple
    container.innerHTML = this.filteredOrders.map(order=>`
      <div class="order-card" data-order-id="${order.orderId||order._id}">
        <div style="display:flex;justify-content:space-between">
          <div>
            <b>#${(order.orderId||order._id||'').toString().slice(-6).toUpperCase()}</b>
            <div style="font-size:11px;color:#64748b">${order.shopName||'Shop'} • ${new Date(order.createdAt).toLocaleDateString()}</div>
          </div>
          <span class="order-status ${order.status}">${order.status||'placed'}</span>
        </div>
        <div style="margin-top:8px;font-size:12px;color:#475569">${order.items?.length||1} items • ₹${order.total}</div>
      </div>
    `).join('');
  }

  bindSearch(){
    const searchInput = document.getElementById('ordersSearch');
    if(searchInput){
      searchInput.addEventListener('input', (e)=>{
        this.filters.search = e.target.value;
        this.applyFilters();
      });
    }
  }

  initSocket(){
    if(window.SocketCore){
      window.SocketCore.on('order-updated', (order)=>{
        const idx = this.orders.findIndex(o=> (o.orderId||o._id)===(order.orderId||order._id));
        if(idx>=0) this.orders[idx] = {...this.orders[idx],...order};
        else this.orders.unshift(order);
        this.applyFilters();
      });
    }
  }

  async cancelOrder(orderId, reason){
    try{
      await window.ApiCore.post(`/api/common/customer-orders/${orderId}/cancel`, { reason });
      if(window.Toast) Toast.show('Order cancelled', 'success');
      await this.loadOrders();
    }catch(e){
      if(window.Toast) Toast.show('Failed to cancel order', 'error');
    }
  }

  async reorder(orderId){
    try{
      const order = this.orders.find(o=> (o.orderId||o._id)===orderId);
      if(!order) return;

      if(window.CartCore){
        for(const item of order.items||[]){
          await window.CartCore.addItem(item);
        }
      }

      if(window.Toast) Toast.show('Items added to cart 🛒', 'success');
      setTimeout(()=> window.location.href=`/shop-templates/common/cart/cart.html?shopId=${this.shopId}`, 800);
    }catch(e){
      console.error(e);
    }
  }
}

window.MyOrdersCore = new MyOrdersCore();