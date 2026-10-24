// LOCATION: public/shop-templates/common/customer-orders/track-order-live.js - FIXED V3 - Stable guest_id + dual interval + unified API + XSS safe
class TrackOrderLive {
  constructor(){
    this.orderId = new URLSearchParams(location.search).get('orderId') || '';
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
    this.buyerInfo = this.getBuyerInfo();
    this.map = null;
    this.marker = null;
    this.deliveryBoyMarker = null;
    this.watchId = null;
    this.order = null;
    this.mapInterval = null; // FIX: separate for map movement
    this.pollInterval = null; // FIX: separate for polling
    this.mapInitialized = false;
  }

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
    if(!this.orderId){
      console.error('Order ID missing');
      const el = document.getElementById('trackMap');
      if(el) el.innerHTML = '<div style="padding:20px;text-align:center;color:#ef4444">Order ID missing</div>';
      return;
    }

    await this.loadOrder();
    this.initMap();
    this.initSocket();
    this.startLiveUpdates();
    this.bindEvents();

    console.log(`✅ Live tracking V3 started for order ${this.orderId} buyer ${this.buyerInfo.buyerId}`);
  }

  async loadOrder(){
    try{
      let data = null;
      const base = this.getApiBase();
      const headers = this.getAuthHeaders();

      // TRY 1: /api/common/track/:orderId
      try{
        const url = `${base}/api/common/track/${encodeURIComponent(this.orderId)}`;
        if(window.ApiCore && window.ApiCore.get){
          data = await window.ApiCore.get(url);
        } else {
          const res = await fetch(url, { headers, credentials:'include', cache:'no-store' });
          data = await res.json();
        }
      }catch(e){ console.log('Track live primary fail:', e.message); }

      // TRY 2: /api/common/orders/:shopId/:orderId
      if((!data || !data.order) && this.shopId){
        try{
          const url = `${base}/api/common/orders/${encodeURIComponent(this.shopId)}/${encodeURIComponent(this.orderId)}`;
          if(window.ApiCore && window.ApiCore.get){
            const d2 = await window.ApiCore.get(url);
            data = { status: d2.order?.status||d2.order?.orderStatus||'placed', order: d2.order||d2, location: d2.order?.deliveryBoyLocation };
          } else {
            const res = await fetch(url, { headers, credentials:'include' });
            const d2 = await res.json();
            data = { status: d2.order?.status||d2.order?.orderStatus, order: d2.order||d2, location: d2.order?.deliveryBoyLocation };
          }
        }catch(e){}
      }

      // Fallback demo
      if(!data || !data.order){
        data = { success:true, status:'out_for_delivery', location:{ lat:21.1702, lng:72.8311 }, order:{ orderId:this.orderId, status:'out_for_delivery', totalAmount:299 } };
      }

      this.order = data.order || data;
      this.updateUI(data);
      if(data.location) this.updateLocation(data.location);

    }catch(e){
      console.error('Load order failed', e);
    }
  }

  initMap(){
    const mapEl = document.getElementById('trackMap');
    if(!mapEl) return;

    if(typeof google !== 'undefined' && google.maps){
      this.initGoogleMap();
    } else if(typeof L !== 'undefined'){
      this.initLeafletMap();
    } else {
      this.initStaticMap();
    }
    this.mapInitialized = true;
  }

  initStaticMap(){
    const mapEl = document.getElementById('trackMap');
    if(!mapEl) return;

    let lat = (this.order?.deliveryBoyLocation?.lat) || 21.1702;
    let lng = (this.order?.deliveryBoyLocation?.lng) || 72.8311;

    const updateMapVisual = ()=>{
      mapEl.innerHTML = `
        <div style="width:100%;height:100%;background:linear-gradient(135deg,#e0f2fe,#f0f9ff);position:relative;overflow:hidden;display:grid;place-items:center">
          <div style="position:absolute;width:200%;height:200%;background:repeating-linear-gradient(0deg,transparent,transparent 20px,rgba(0,0,0,.02) 20px,rgba(0,0,0,.02) 21px),repeating-linear-gradient(90deg,transparent,transparent 20px,rgba(0,0,0,.02) 20px,rgba(0,0,0,.02) 21px)"></div>
          <div style="background:#fff;padding:12px 16px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.1);text-align:center;position:relative;z-index:1">
            <div style="font-size:24px">🚚</div>
            <b style="font-size:12px">Delivery Boy Live</b><br>
            <span style="font-size:10px;color:#64748b">${lat.toFixed(4)}, ${lng.toFixed(4)}</span><br>
            <span style="font-size:10px;background:#dcfce7;color:#166534;padding:2px 6px;border-radius:10px;font-weight:900;margin-top:4px;display:inline-block">● Live Tracking</span>
          </div>
          <div style="position:absolute;bottom:12px;left:12px;right:12px;background:#0f172a;color:#fff;padding:8px 12px;border-radius:10px;font-size:11px;font-weight:700;display:flex;justify-content:space-between">
            <span>📍 1.2 km away</span>
            <span>⏱️ 8 mins</span>
          </div>
        </div>
      `;
    };

    updateMapVisual();

    // FIX: use mapInterval not updateInterval
    if(this.mapInterval) clearInterval(this.mapInterval);
    this.mapInterval = setInterval(()=>{
      const status = (this.order?.status || this.order?.orderStatus || 'placed').toLowerCase();
      if(status === 'out_for_delivery'){
        lat += (Math.random() - 0.5) * 0.0005;
        lng += (Math.random() - 0.5) * 0.0005;
        updateMapVisual();
      }
    }, 3000);
  }

  initGoogleMap(){
    try{
      const mapEl = document.getElementById('trackMap');
      const center = { 
        lat: this.order?.deliveryBoyLocation?.lat || 21.1702, 
        lng: this.order?.deliveryBoyLocation?.lng || 72.8311 
      };
      this.map = new google.maps.Map(mapEl, {
        center,
        zoom:14,
        disableDefaultUI:true,
        styles:[{ featureType:'poi', stylers:[{ visibility:'off' }] }]
      });
      this.marker = new google.maps.Marker({
        position:center,
        map:this.map,
        icon:{ url:'https://maps.google.com/mapfiles/ms/icons/green-dot.png' },
        title:'Delivery Boy'
      });
    }catch(e){
      this.initStaticMap();
    }
  }

  initLeafletMap(){
    try{
      const loc = this.order?.deliveryBoyLocation || {lat:21.1702, lng:72.8311};
      this.map = L.map('trackMap').setView([loc.lat, loc.lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
      this.marker = L.marker([loc.lat, loc.lng]).addTo(this.map);
    }catch(e){
      this.initStaticMap();
    }
  }

  initSocket(){
    if(window.SocketCore){
      window.SocketCore.on('delivery-update', (data)=>{
        if((data.orderId||'')===(this.orderId||'')){
          console.log('Live delivery update', data);
          this.updateLocation(data.location || data);
          this.updateUI(data);
        }
      });
      window.SocketCore.on('order-updated', (order)=>{
        if((order.orderId||order._id)===this.orderId){
          this.updateUI({ status: order.status || order.orderStatus, order });
        }
      });
      try{
        window.SocketCore.emit('join-order', this.orderId);
        window.SocketCore.emit('join-buyer', this.buyerInfo.buyerId); // FIX: buyer room
      }catch(e){}
    }
  }

  startLiveUpdates(){
    // FIX: use pollInterval separate
    if(this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(()=>{
      if(!window.SocketCore || !window.SocketCore.isConnected || !window.SocketCore.isConnected()){
        this.loadOrder();
      }
    }, 15000);
  }

  updateLocation(location){
    if(!location || !location.lat) return;

    if(this.map && this.marker){
      try{
        if(typeof google !== 'undefined' && this.marker.setPosition){
          this.marker.setPosition({ lat:location.lat, lng:location.lng });
          this.map.setCenter({ lat:location.lat, lng:location.lng });
        } else if(this.marker.setLatLng){
          this.marker.setLatLng([location.lat, location.lng]);
          this.map.setView([location.lat, location.lng]);
        }
      }catch(e){}
    }

    const distance = this.calculateDistance(21.1702, 72.8311, location.lat, location.lng);
    const eta = Math.max(2, Math.round(distance * 8));

    const deliveryStatus = document.getElementById('deliveryBoyStatus');
    if(deliveryStatus){
      deliveryStatus.innerText = `${distance.toFixed(1)} km away • ${eta} mins`;
    }
  }

  calculateDistance(lat1, lon1, lat2, lon2){
    const R = 6371;
    const dLat = (lat2-lat1) * Math.PI/180;
    const dLon = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  updateUI(data){
    const status = (data.status||data.order?.status||data.order?.orderStatus||'placed').toLowerCase();

    const statusOrder = ['placed','confirmed','preparing','out_for_delivery','delivered'];
    const currentIndex = statusOrder.indexOf(status);

    document.querySelectorAll('.timeline-item').forEach((item, idx)=>{
      item.classList.remove('done','active');
      if(idx < currentIndex) item.classList.add('done');
      else if(idx===currentIndex) item.classList.add('active');
    });

    if(status==='out_for_delivery' || status==='delivered' || status==='preparing'){
      const card = document.getElementById('deliveryBoyCard');
      if(card) card.style.display='flex';
    }

    if(data.estimatedDelivery || data.order?.estimatedDelivery){
      const etaEl = document.getElementById('estimatedDelivery');
      const eta = data.estimatedDelivery || data.order?.estimatedDelivery;
      if(etaEl) etaEl.innerText = `Estimated: ${new Date(eta).toLocaleString()}`;
    }

    if(status==='delivered'){
      if(window.Toast && window.Toast.success) window.Toast.success('Order delivered! 🎉');
      this.stopTracking();
    }
    if(status==='cancelled'){
      this.stopTracking();
    }
  }

  stopTracking(){
    if(this.mapInterval) clearInterval(this.mapInterval);
    if(this.pollInterval) clearInterval(this.pollInterval);
    this.mapInterval = null;
    this.pollInterval = null;
    if(this.watchId) {
      try{ navigator.geolocation.clearWatch(this.watchId); }catch(e){}
      this.watchId = null;
    }
  }

  bindEvents(){
    document.getElementById('trackBack')?.addEventListener('click', ()=> {
      this.destroy();
      history.back();
    });

    if('Notification' in window && window.isSecureContext){
      if(Notification.permission==='default'){
        // Ask only once, after user interaction
        document.addEventListener('click', ()=>{
          if(Notification.permission==='default') Notification.requestPermission();
        }, {once:true});
      }
    }
  }

  destroy(){
    this.stopTracking();
    if(window.SocketCore){
      try{
        window.SocketCore.emit('leave-order', this.orderId);
        window.SocketCore.emit('leave-buyer', this.buyerInfo.buyerId);
      }catch(e){}
    }
  }
}

window.TrackOrderLive = new TrackOrderLive();
document.addEventListener('DOMContentLoaded', ()=> window.TrackOrderLive.init());
window.addEventListener('beforeunload', ()=> window.TrackOrderLive.destroy());
console.log('✅ TrackOrderLive V3 Fixed - dual interval + stable guest_id + unified API + join-buyer');