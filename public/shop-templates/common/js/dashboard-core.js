// LOCATION: public/shop-templates/common/js/dashboard-core.js - V13 LIVE ORDER + WALLET + ROLE
// Ye har shop dashboard pe load hoga - kirana, cloth, medical sab me

(function(){
  let socket = null;
  let shopId = null;
  let shopRole = 'shop_owner';

  function getShopId(){
    const url = new URLSearchParams(window.location.search);
    return url.get('shopId') || url.get('id') || window.MY_SHOP_ID || window.SHOP_ID || null;
  }

  function getApiBase(){
    return window.API_BASE || window.location.origin;
  }

  function getAuthHeaders(){
    const token = (window.AuthCore && window.AuthCore.getToken && window.AuthCore.getToken()) || '';
    return { 'Content-Type': 'application/json',...(token? { 'Authorization': `Bearer ${token}` } : {}) };
  }

  async function loadWalletBalance(){
    shopId = getShopId();
    if(!shopId) return;
    try {
      const res = await fetch(`${getApiBase()}/api/common/wallet/balance?userId=${shopId}&role=shop_owner&shopId=${shopId}`);
      const data = await res.json();
      if(data.success){
        const balEl = document.getElementById('walletBalance') || document.getElementById('shopWalletBalance') || document.getElementById('wallet-balance');
        if(balEl) balEl.textContent = `₹${data.balance || 0}`;
        const earnEl = document.getElementById('totalEarning') || document.getElementById('shopTotalEarning');
        if(earnEl) earnEl.textContent = `₹${data.totalEarning || 0}`;
        // Dashboard header wallet
        const headerWallet = document.getElementById('headerWallet');
        if(headerWallet) headerWallet.textContent = `₹${data.balance || 0}`;
      }
    } catch(e){ console.log('Wallet load skip', e.message); }
  }

  function initSocket(){
    shopId = getShopId();
    if(!shopId) {
      console.warn('No shopId for socket');
      return;
    }
    // Socket.IO client - server.js ne global.io set kiya hai
    if(typeof io === 'undefined'){
      console.log('Socket.IO client not loaded, trying /socket.io/socket.io.js');
      const script = document.createElement('script');
      script.src = '/socket.io/socket.io.js';
      script.onload = ()=> initSocket();
      document.head.appendChild(script);
      return;
    }

    socket = io(getApiBase(), {
      transports: ['websocket','polling'],
      query: { shopId }
    });

    window.shopSocket = socket;

    socket.on('connect', ()=>{
      console.log(`✅ Socket connected: ${socket.id} for shop:${shopId}`);
      socket.emit('join-shop', shopId);
      // Area manager code bhi join kar lo agar hai
      if(window.AreaManagerCode) socket.emit('join-shop', window.AreaManagerCode);
    });

    socket.on('pong', (data)=>{
      console.log('🏓 Pong:', data);
    });

    // NEW ORDER POPUP - YAHI MAIN HAI
    socket.on('new-order', (order)=>{
      console.log('🔔 NEW ORDER RECEIVED:', order);
      // Sound bajao
      playOrderSound();

      // Badge
      const badge = document.getElementById('newOrderCount') || document.getElementById('orderBadge') || document.getElementById('newOrderBadge');
      if(badge){
        badge.style.display = 'block';
        const current = parseInt(badge.textContent||'0')+1;
        badge.textContent = current > 9? '9+' : current;
      }

      // Popup
      showNewOrderPopup(order);

      // Wallet refresh
      setTimeout(()=> loadWalletBalance(), 1000);

      // Orders table refresh if exists
      if(window.loadOrders) window.loadOrders();
      if(window.ProductManager && window.ProductManager.loadMyProducts) window.ProductManager.loadMyProducts();
    });

    socket.on('shop-status-changed', (data)=>{
      console.log('Shop status:', data);
      // Update UI toggle
      const toggle = document.getElementById('shopStatusToggle');
      if(toggle && data.shopId === shopId){
        toggle.checked = data.isOpen;
      }
    });

    socket.on('disconnect', (reason)=>{
      console.log('Socket disconnected:', reason);
    });
  }

  function playOrderSound(){
    try {
      const audio = new Audio('/assets/sounds/new-order.mp3');
      audio.play().catch(()=>{});
    } catch(e){}
    // Fallback beep via Web Audio
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 800;
      osc.connect(ctx.destination);
      osc.start();
      setTimeout(()=>{ osc.stop(); ctx.close(); }, 500);
    } catch(e){}
  }

  function showNewOrderPopup(order){
    // Agar pehle se popup hai toh hatao
    const old = document.getElementById('newOrderPopup');
    if(old) old.remove();

    const div = document.createElement('div');
    div.id = 'newOrderPopup';
    div.style.cssText = `
      position:fixed;top:20px;right:20px;z-index:99999;
      background:#fff;border-left:5px solid #22c55e;
      box-shadow:0 10px 30px rgba(0,0,0,0.2);
      border-radius:12px;padding:16px;min-width:300px;max-width:400px;
      animation:slideIn 0.4s ease;
      font-family:system-ui;
    `;
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-weight:800;font-size:16px;color:#16a34a">🔔 New Order!</div>
        <button onclick="this.parentElement.parentElement.remove()" style="border:0;background:none;font-size:20px;cursor:pointer">×</button>
      </div>
      <div style="margin-top:8px;font-size:13px">
        <div><b>Order ID:</b> ${order.orderId || order._id}</div>
        <div><b>Buyer:</b> ${order.buyerRole} (${order.buyerId})</div>
        <div><b>Items:</b> ${order.items?.length || 1} • <b>Total:</b> ₹${order.totalAmount || order.total}</div>
        <div><b>Earning:</b> ₹${order.supplierEarning || order.totalAmount} (Commission: ₹${order.commissionAmount||0})</div>
        <div style="margin-top:4px;color:#666;font-size:11px">${new Date(order.createdAt||Date.now()).toLocaleString()}</div>
      </div>
      <div style="margin-top:12px;display:flex;gap:8px">
        <a href="/shop-templates/common/orders/order-detail.html?orderId=${order._id||order.orderId}" style="flex:1;background:#000;color:#fff;text-align:center;padding:8px;border-radius:8px;text-decoration:none;font-size:13px">View Order</a>
        <button onclick="this.closest('#newOrderPopup').remove()" style="flex:1;background:#f1f5f9;border:0;padding:8px;border-radius:8px;font-size:13px">Close</button>
      </div>
    `;
    document.body.appendChild(div);

    // Auto remove after 15 sec
    setTimeout(()=>{ const el=document.getElementById('newOrderPopup'); if(el) el.remove(); }, 15000);

    // Add animation CSS once
    if(!document.getElementById('orderPopupStyle')){
      const style = document.createElement('style');
      style.id='orderPopupStyle';
      style.textContent = `@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`;
      document.head.appendChild(style);
    }
  }

  // Shop open/close toggle emit
  window.emitShopStatus = function(isOpen){
    if(socket && shopId){
      socket.emit('shop-status-changed', { shopId, isOpen, timestamp: Date.now() });
    }
  };

  // Init on dashboard
  document.addEventListener('DOMContentLoaded', ()=>{
    if(window.location.pathname.includes('dashboard.html')){
      shopId = getShopId();
      console.log('Dashboard Core init for shop:', shopId);
      setTimeout(()=>{ loadWalletBalance(); initSocket(); }, 800);
      // Wallet auto refresh every 30 sec
      setInterval(loadWalletBalance, 30000);
    }
  });

  window.DashboardCore = {
    initSocket,
    loadWalletBalance,
    showNewOrderPopup,
    playOrderSound
  };

  console.log('✅ dashboard-core.js V13 loaded');
})();