// LOCATION: common/core/socket-core.js - WORLD CLASS SOCKET CORE - FULL PRODUCTION GRADE
class SocketCore {
  constructor(){
    this.socket = null;
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('currentShopId') || '';
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnect = 10;
    this.listeners = new Map();
    this.rooms = new Set();
    this.queuedEvents = [];
    this.connectionId = null;
    this.init();
  }

  init(){
    if(typeof io === 'undefined'){
      console.warn('Socket.io not loaded - retrying in 2 sec');
      setTimeout(()=> this.init(), 2000);
      return;
    }

    this.connect();
  }

  connect(){
    if(this.socket) this.socket.disconnect();

    console.log(`SocketCore connecting for shop ${this.shopId}`);

    this.socket = io('', {
      query: {
        shopId: this.shopId,
        userId: window.currentUser?._id || '',
        role: window.currentUser?.role || 'guest',
        page: location.pathname
      },
      transports: ['websocket','polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnect,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    this.bindSocketEvents();
  }

  bindSocketEvents(){
    this.socket.on('connect', ()=>{
      console.log(`Socket connected: ${this.socket.id}`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.connectionId = this.socket.id;

      // Join shop room
      if(this.shopId){
        this.socket.emit('join-shop', this.shopId);
        this.rooms.add(`shop:${this.shopId}`);
      }

      // Join user room
      if(window.currentUser?._id){
        this.socket.emit('join-user', window.currentUser._id);
        this.rooms.add(`user:${window.currentUser._id}`);
      }

      // Flush queued events
      this.flushQueuedEvents();

      // Notify listeners
      this.emitLocal('socket:connected', { id: this.socket.id });
      if(window.Toast) Toast.show('Live updates connected ✅', 'success');
    });

    this.socket.on('disconnect', (reason)=>{
      console.log(`Socket disconnected: ${reason}`);
      this.isConnected = false;
      this.emitLocal('socket:disconnected', { reason });

      if(reason === 'io server disconnect'){
        // Server kicked us, try reconnect manually
        setTimeout(()=> this.socket.connect(), 1000);
      }
    });

    this.socket.on('connect_error', (err)=>{
      console.warn('Socket connect error', err.message);
      this.reconnectAttempts++;

      if(this.reconnectAttempts >= this.maxReconnect){
        console.error('Max reconnect attempts reached');
        if(window.Toast) Toast.show('Live updates disconnected - refresh page', 'warning');
      }

      this.emitLocal('socket:connect_error', { error: err, attempt: this.reconnectAttempts });
    });

    // Business events
    this.socket.on('new-order', (order)=> this.handleNewOrder(order));
    this.socket.on('order-updated', (order)=> this.handleOrderUpdated(order));
    this.socket.on('order-cancelled', (order)=> this.handleOrderCancelled(order));
    this.socket.on('shop-status-changed', (data)=> this.handleShopStatusChanged(data));
    this.socket.on('inventory-low', (data)=> this.handleLowStock(data));
    this.socket.on('new-review', (review)=> this.handleNewReview(review));
    this.socket.on('payment-received', (payment)=> this.handlePaymentReceived(payment));
    this.socket.on('delivery-update', (data)=> this.handleDeliveryUpdate(data));

    // Chat events
    this.socket.on('new-message', (msg)=> this.handleNewMessage(msg));
    this.socket.on('typing', (data)=> this.handleTyping(data));

    // Live orders for dashboard
    this.socket.on('live-orders', (orders)=>{
      this.emitLocal('socket:live-orders', orders);
      if(window.DashboardCore) window.DashboardCore.renderLiveOrders?.(orders);
    });

    // Pong for ping
    this.socket.on('pong', (data)=>{
      console.log('Pong received', data);
    });
  }

  handleNewOrder(order){
    console.log('Socket: new-order', order);

    // Play sound
    try{
      const audio = document.getElementById('newOrderSound') || new Audio('/shop-templates/common/orders/new-order-sound.mp3');
      audio.volume = 0.8;
      audio.play().catch(()=>{});
    }catch(e){}

    // Vibrate
    if(navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);

    // Toast
    if(window.Toast){
      Toast.show(`🔔 New order #${(order.orderId||order._id||'').toString().slice(-6)} - ₹${order.total||0}`, 'success');
    }

    // Browser notification if permission granted
    if('Notification' in window && Notification.permission === 'granted'){
      new Notification('New Order! 🔔', {
        body: `Order #${(order.orderId||'').slice(-6)} - ₹${order.total} - ${order.customerName||'Customer'}`,
        icon: '/admin-panel/assets/logo.png',
        badge: '/admin-panel/assets/logo.png',
        vibrate: [100, 50, 100]
      });
    }

    // Show popup
    if(window.DashboardCore) window.DashboardCore.showNewOrderPopup(order);

    // Emit local
    this.emitLocal('socket:new-order', order);
    this.emitLocal('order:new', order);

    // Update dashboard
    if(window.DashboardCore){
      window.DashboardCore.loadRecentOrders();
      window.DashboardCore.fetchStats().then(s=> window.DashboardCore.renderStats(s));
    }

    // If orders page, reload
    if(location.pathname.includes('orders')){
      if(window.OrdersCore) window.OrdersCore.loadOrders();
    }
  }

  handleOrderUpdated(order){
    console.log('Socket: order-updated', order);
    if(window.Toast) Toast.show(`Order #${(order.orderId||'').slice(-6)} updated to ${order.status}`, 'info');
    this.emitLocal('socket:order-updated', order);
    this.emitLocal('order:updated', order);
  }

  handleOrderCancelled(order){
    console.log('Socket: order-cancelled', order);
    if(window.Toast) Toast.show(`Order #${(order.orderId||'').slice(-6)} cancelled`, 'warning');
    this.emitLocal('socket:order-cancelled', order);
  }

  handleShopStatusChanged(data){
    console.log('Shop status changed', data);
    this.emitLocal('shop:status-changed', data);
    // Update badge everywhere
    document.querySelectorAll('[data-shop-status], #shopStatusBadge, #shopHeaderStatus').forEach(el=>{
      el.innerText = data.isOpen? '● Open' : '● Closed';
      el.className = data.isOpen? 'open' : 'closed';
    });
  }

  handleLowStock(data){
    console.log('Low stock alert', data);
    if(window.Toast) Toast.show(`⚠️ Low stock: ${data.productName} - only ${data.stock} left`, 'warning');
    this.emitLocal('inventory:low', data);
  }

  handleNewReview(review){
    if(window.Toast) Toast.show(`⭐ New review: ${review.rating} stars`, 'success');
    this.emitLocal('review:new', review);
  }

  handlePaymentReceived(payment){
    if(window.Toast) Toast.show(`💰 Payment received: ₹${payment.amount}`, 'success');
    this.emitLocal('payment:received', payment);
  }

  handleDeliveryUpdate(data){
    this.emitLocal('delivery:update', data);
  }

  handleNewMessage(msg){
    this.emitLocal('chat:new-message', msg);
  }

  handleTyping(data){
    this.emitLocal('chat:typing', data);
  }

  emit(event, data){
    if(!this.isConnected){
      console.log(`Socket not connected - queueing ${event}`);
      this.queuedEvents.push({ event, data });
      return false;
    }

    this.socket.emit(event, data);
    return true;
  }

  on(event, callback){
    if(!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(callback);

    if(this.socket) this.socket.on(event, callback);
  }

  off(event, callback){
    if(this.socket) this.socket.off(event, callback);
    if(this.listeners.has(event)){
      const cbs = this.listeners.get(event);
      this.listeners.set(event, cbs.filter(cb=> cb!== callback));
    }
  }

  emitLocal(event, data){
    if(this.listeners.has(event)){
      this.listeners.get(event).forEach(cb=>{
        try{ cb(data); }catch(e){ console.error(`Error in socket listener ${event}`, e); }
      });
    }
    // Also dispatch as window event
    window.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  flushQueuedEvents(){
    while(this.queuedEvents.length > 0){
      const { event, data } = this.queuedEvents.shift();
      this.emit(event, data);
    }
  }

  joinRoom(room){ if(this.isConnected){ this.socket.emit('join', room); this.rooms.add(room); } }
  leaveRoom(room){ if(this.isConnected){ this.socket.emit('leave', room); this.rooms.delete(room); } }

  ping(){ if(this.isConnected) this.socket.emit('ping', { timestamp: Date.now(), shopId: this.shopId }); }

  disconnect(){ if(this.socket) this.socket.disconnect(); this.isConnected = false; }

  reconnect(){ this.connect(); }

  isConnectedStatus(){ return this.isConnected; }
  getConnectionId(){ return this.connectionId; }
}

window.SocketCore = new SocketCore();
window.socket = window.SocketCore;