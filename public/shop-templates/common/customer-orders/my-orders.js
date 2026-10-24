// LOCATION: common/customer-orders/my-orders.js - FIXED V3 - Matches CartCore V3 + Checkout V3 + Stable guest_id
// Depends: role-hierarchy.js, cart-core.js V3, api-core.js, auth-core.js
class MyOrdersCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
    this.supplierId = new URLSearchParams(location.search).get('supplierId') || this.shopId || '';
    this.buyerInfo = this.getBuyerInfo();
    this.userId = this.buyerInfo.buyerId;
    this.orders = [];
    this.filteredOrders = [];
    this.filters = { status:'all', date:'all', shop:'all', search:'' };
    this.sortBy = 'newest';
    this.page = 1;
    this.limit = 20;
  }

  // FIXED: Stable guest_id + RoleHierarchy
  getBuyerInfo(){
    let gid = sessionStorage.getItem('guest_id');
    if(!gid){
      gid = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2,5);
      try{ sessionStorage.setItem('guest_id', gid); }catch(e){}
    }
    const rh = window.RoleHierarchy;
    return {
      buyerId: (rh && rh.getMyId && rh.getMyId()) || (window.currentUser && window.currentUser._id) || gid,
      buyerRole: (rh && rh.getMyRole && rh.getMyRole()) || 'customer'
    };
  }

  getApiBase(){
    return window.API_BASE || window.EnvConfig?.API_BASE || window.location.origin;
  }

  getAuthHeaders(){
    const token = (window.AuthCore && window.AuthCore.getToken && window.AuthCore.getToken()) || localStorage.getItem('TOKEN') || localStorage.getItem('token') || '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      'x-buyer-id': this.buyerInfo.buyerId
    };
  }

  async init(){
    await this.loadUser();
    await this.loadOrders();
    this.bindSearch();
    this.initSocket();
    console.log('✅ MyOrdersCore V3 init - buyerId:', this.buyerInfo.buyerId);
  }

  async loadUser(){
    // Try UserCore, RoleHierarchy, currentUser
    if(window.UserCore && window.UserCore.getUser){
      try{
        const user = await window.UserCore.getUser();
        if(user && user._id){
          this.userId = user._id;
          this.buyerInfo.buyerId = user._id;
        }
      }catch(e){}
    }
    // Refresh buyerInfo after user load
    this.buyerInfo = this.getBuyerInfo();
    this.userId = this.buyerInfo.buyerId;
  }

  async loadOrders(){
    try{
      if(window.Loader && window.Loader.show) window.Loader.show('Loading orders...');
      
      let data = null;
      let orders = [];

      // TRY 1: New unified API - /api/common/checkout/orders/my?buyerId=xxx
      try{
        const url = `${this.getApiBase()}/api/common/checkout/orders/my?buyerId=${encodeURIComponent(this.buyerInfo.buyerId)}&t=${Date.now()}`;
        const headers = this.getAuthHeaders();
        if(window.ApiCore && window.ApiCore.get){
          data = await window.ApiCore.get(url);
        } else {
          const res = await fetch(url, { headers, credentials:'include', cache:'no-store' });
          data = await res.json();
        }
        orders = data.orders || data.data || data || [];
        if(orders.length > 0) throw new Error('found'); // break to catch to set
      }catch(e){
        if(e.message === 'found'){
          // orders already found
        } else {
          console.log('Primary my orders API empty, trying fallbacks:', e.message);
          // TRY 2: Old shop specific API
          if(this.shopId){
            try{
              const url2 = `${this.getApiBase()}/api/common/customer-orders/${this.shopId}/${this.userId}?t=${Date.now()}`;
              if(window.ApiCore && window.ApiCore.get){
                data = await window.ApiCore.get(url2);
              } else {
                const res = await fetch(url2, { headers: this.getAuthHeaders(), credentials:'include' });
                data = await res.json();
              }
              orders = data.orders || data || [];
              if(orders.length > 0) {
                // got from fallback
              }
            }catch(e2){ console.log('Fallback 2 fail:', e2.message); }
          }
          
          // TRY 3: /api/user/orders
          if(orders.length === 0){
            try{
              const url3 = `${this.getApiBase()}/api/user/orders?t=${Date.now()}`;
              if(window.ApiCore && window.ApiCore.get){
                data = await window.ApiCore.get(url3);
              } else {
                const res = await fetch(url3, { headers: this.getAuthHeaders(), credentials:'include' });
                data = await res.json();
              }
              orders = data.orders || data || [];
            }catch(e3){ console.log('Fallback 3 fail:', e3.message); }
          }

          // TRY 4: localStorage (offline demo)
          if(orders.length === 0){
            try{
              orders = JSON.parse(localStorage.getItem('myOrders') || '[]');
            }catch(e){}
          }
        }
      }

      this.orders = orders || [];
      this.filteredOrders = [...this.orders];

      this.render();
      this.updateCounts();

    }catch(e){
      console.error('Load orders failed', e);
      if(window.ErrorHandler && window.ErrorHandler.handleApiError) ErrorHandler.handleApiError(e, 'my-orders');
      this.orders = [];
      this.filteredOrders = [];
      this.render();
    }finally{
      if(window.Loader && window.Loader.hide) window.Loader.hide();
    }
  }

  updateCounts(){
    const counts = { all:this.orders.length };
    this.orders.forEach(o=>{
      const s = (o.status || o.orderStatus || 'placed').toLowerCase();
      counts[s] = (counts[s]||0)+1;
    });

    Object.entries(counts).forEach(([status,count])=>{
      const el = document.querySelector(`[data-count="${status}"]`);
      if(el) el.innerText = count;
      const el2 = document.getElementById('countAll');
      if(status === 'all' && el2) el2.innerText = count;
    });

    // Update header count
    const countEl = document.getElementById('ordersCount');
    if(countEl) countEl.innerText = `${this.orders.length} orders`;
  }

  applyFilters(){
    let result = [...this.orders];

    // Status filter - support both status and orderStatus
    if(this.filters.status !== 'all'){
      result = result.filter(o=>{
        const s = (o.status || o.orderStatus || 'placed').toLowerCase();
        return s === this.filters.status.toLowerCase();
      });
    }

    // Date filter
    if(this.filters.date !== 'all'){
      const now = new Date();
      result = result.filter(o=>{
        const orderDate = new Date(o.createdAt || o.created_at || Date.now());
        if(this.filters.date === 'today') return orderDate.toDateString() === now.toDateString();
        if(this.filters.date === 'week'){
          const weekAgo = new Date(); weekAgo.setDate(now.getDate()-7);
          return orderDate >= weekAgo;
        }
        if(this.filters.date === 'month'){
          const monthAgo = new Date(); monthAgo.setMonth(now.getMonth()-1);
          return orderDate >= monthAgo;
        }
        return true;
      });
    }

    // Shop filter
    if(this.filters.shop !== 'all'){
      result = result.filter(o=> (o.shopId || o.supplierId || '') === this.filters.shop);
    }

    // Search filter
    if(this.filters.search){
      const q = this.filters.search.toLowerCase();
      result = result.filter(o=>
        (o.orderId||'').toLowerCase().includes(q) ||
        (o.shopName||'').toLowerCase().includes(q) ||
        (o.shopId||'').toLowerCase().includes(q) ||
        (o.items||[]).some(i=> (i.name||'').toLowerCase().includes(q))
      );
    }

    // Sort
    if(this.sortBy === 'newest') result.sort((a,b)=> new Date(b.createdAt||b.created_at||0) - new Date(a.createdAt||a.created_at||0));
    if(this.sortBy === 'oldest') result.sort((a,b)=> new Date(a.createdAt||0) - new Date(b.createdAt||0));
    if(this.sortBy === 'amount_high') result.sort((a,b)=> (b.totalAmount||b.total||0) - (a.totalAmount||a.total||0));
    if(this.sortBy === 'amount_low') result.sort((a,b)=> (a.totalAmount||a.total||0) - (b.totalAmount||b.total||0));

    this.filteredOrders = result;
    this.render();
  }

  render(){
    const container = document.getElementById('ordersList');
    if(!container) return;

    const emptyEl = document.getElementById('ordersEmpty');

    if(this.filteredOrders.length === 0){
      container.innerHTML = '';
      container.style.display = 'none';
      if(emptyEl) emptyEl.style.display = 'block';
      return;
    }

    if(emptyEl) emptyEl.style.display = 'none';
    container.style.display = 'flex';

    const esc = (s)=> String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

    container.innerHTML = this.filteredOrders.map(order=>{
      const orderId = order.orderId || order._id || '';
      const shortId = orderId.toString().slice(-6).toUpperCase();
      const status = (order.status || order.orderStatus || 'placed').toLowerCase();
      const shopName = esc(order.shopName || order.supplierName || 'Shop');
      const dateStr = new Date(order.createdAt || order.created_at || Date.now()).toLocaleDateString();
      const total = order.totalAmount || order.total || 0;
      const itemsCount = order.items?.length || 1;
      const itemsPreview = (order.items||[]).slice(0,2).map(i=> esc(i.name||i.title||'')).join(', ') || 'Items';

      return `
      <div class="order-card" data-order-id="${esc(orderId)}" onclick="window.MyOrdersCore.openOrder('${esc(orderId)}')">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <b>#${esc(shortId)}</b>
            <div style="font-size:11px;color:#64748b">${shopName} • ${esc(dateStr)}</div>
          </div>
          <span class="order-status ${esc(status)}">${esc(status.toUpperCase().replace('_',' '))}</span>
        </div>
        <div style="margin-top:6px;font-size:11px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(itemsPreview)}</div>
        <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:12px;color:#475569;font-weight:700">${itemsCount} items • ₹${total}</span>
          <span style="font-size:11px;color:#64748b">${this.getRelativeTime(order.createdAt)}</span>
        </div>
      </div>`;
    }).join('');
  }

  getRelativeTime(date){
    if(!date) return 'Now';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff/60000);
    if(mins < 1) return 'Just now';
    if(mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins/60);
    if(hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs/24);
    return `${days}d ago`;
  }

  openOrder(orderId){
    const shopId = this.shopId ? `&shopId=${encodeURIComponent(this.shopId)}` : '';
    // Use track-order.html which is world class
    window.location.href = `/shop-templates/common/track/track-order.html?orderId=${encodeURIComponent(orderId)}${shopId}`;
    // Fallback to customer-orders track if track folder not exists
    // window.location.href = `/shop-templates/common/customer-orders/track-order.html?orderId=${orderId}${shopId}`;
  }

  bindSearch(){
    const searchInput = document.getElementById('ordersSearch');
    if(searchInput){
      searchInput.addEventListener('input', (e)=>{
        this.filters.search = e.target.value;
        this.applyFilters();
      });
    }
    // Tabs
    document.querySelectorAll('.order-tab').forEach(tab=>{
      tab.addEventListener('click', ()=>{
        document.querySelectorAll('.order-tab').forEach(t=> t.classList.remove('active'));
        tab.classList.add('active');
        this.filters.status = tab.dataset.filter || 'all';
        this.applyFilters();
      });
    });
  }

  initSocket(){
    if(window.SocketCore){
      window.SocketCore.on('order-updated', (order)=>{
        const idx = this.orders.findIndex(o=> (o.orderId||o._id) === (order.orderId||order._id));
        if(idx >= 0) this.orders[idx] = {...this.orders[idx], ...order};
        else this.orders.unshift(order);
        this.applyFilters();
        this.updateCounts();
      });
      // Join buyer room for live updates
      try{ window.SocketCore.emit('join-buyer', this.buyerInfo.buyerId); }catch(e){}
    }
  }

  // FIXED: Unified cancel endpoint
  async cancelOrder(orderId, reason='change_mind'){
    try{
      const url = `${this.getApiBase()}/api/common/orders/${encodeURIComponent(orderId)}/cancel`;
      const body = { 
        reason, 
        shopId: this.shopId,
        buyerId: this.buyerInfo.buyerId
      };
      if(window.ApiCore && window.ApiCore.post){
        await window.ApiCore.post(url, body);
      } else {
        const res = await fetch(url, {
          method:'POST',
          headers: this.getAuthHeaders(),
          credentials:'include',
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if(!data.success) throw new Error(data.message||'Cancel failed');
      }
      if(window.Toast) Toast.success('Order cancelled');
      await this.loadOrders();
      return {success:true};
    }catch(e){
      console.error('Cancel failed:', e);
      if(window.Toast) Toast.error('Failed to cancel order');
      return {success:false, message:e.message};
    }
  }

  // FIXED: Reorder uses CartCore.add (not addItem)
  async reorder(orderId){
    try{
      const order = this.orders.find(o=> (o.orderId||o._id) === orderId);
      if(!order || !order.items || order.items.length===0){
        if(window.Toast) Toast.error('No items to reorder');
        return;
      }

      if(!window.CartCore){
        alert('Cart not loaded');
        return;
      }

      // Ensure CartCore ready
      if(window.CartCore.ready){
        try{ await window.CartCore.ready; }catch(e){}
      }

      for(const item of order.items){
        // Convert order item to product format for CartCore.add
        const product = {
          _id: item.productId || item._id || item.id,
          id: item.productId || item._id || item.id,
          name: item.name || item.title,
          title: item.name || item.title,
          price: item.price || 0,
          image: item.image || '',
          ownerId: item.ownerId || order.supplierId || order.shopId,
          ownerRole: item.ownerRole || order.supplierRole || 'shop_owner',
          shopId: item.shopId || order.shopId || order.supplierId,
          shopName: item.shopName || order.shopName || 'Shop'
        };
        await window.CartCore.add(product, item.qty || item.quantity || 1);
      }

      if(window.Toast) Toast.success('Items added to cart 🛒');
      setTimeout(()=> {
        const sid = order.shopId || order.supplierId || this.shopId || '';
        window.location.href = `/shop-templates/common/cart/cart.html?shopId=${encodeURIComponent(sid)}&supplierId=${encodeURIComponent(sid)}`;
      }, 800);
    }catch(e){
      console.error('Reorder failed:', e);
      if(window.Toast) Toast.error('Reorder failed');
    }
  }
}

window.MyOrdersCore = new MyOrdersCore();
document.addEventListener('DOMContentLoaded', ()=> {
  // Auto init if on my-orders page
  if(document.getElementById('ordersList')){
    window.MyOrdersCore.init();
  }
});
console.log('✅ MyOrdersCore V3 Fixed - stable guest_id + unified API + CartCore.add');