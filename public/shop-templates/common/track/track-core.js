// LOCATION: public/shop-templates/common/track/track-core.js
// WORLD CLASS TRACK CORE - FULL 400+ LINES - CUSTOMER + SHOP OWNER + DELIVERY
class TrackCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('shopId')||'';
    this.orderId = new URLSearchParams(location.search).get('orderId') || new URLSearchParams(location.search).get('id')||'';
    this.userId = localStorage.getItem('userId')||'guest';
    this.trackData = null;
    this.map = null;
    this.markers = [];
    this.polyline = null;
    this.watchId = null;
    this.socketConnected = false;
  }

  async init(){
    await this.loadTrackData();
    this.initSocket();
    this.startLiveTracking();
  }

  async loadTrackData(){
    try{
      if(!this.orderId){
        throw new Error('Order ID missing');
      }

      if(window.ApiCore){
        const data = await window.ApiCore.get(`/api/common/track/${this.orderId}?shopId=${this.shopId}`);
        this.trackData = data.track||data.order||data;
      } else {
        // Mock track data
        this.trackData = {
          orderId:this.orderId,
          _id:this.orderId,
          shopId:this.shopId,
          status:'out_for_delivery',
          paymentStatus:'paid',
          total:450,
          amount:450,
          customerName:'Ramesh Kumar',
          customerPhone:'9876543210',
          customerAddress:'Adajan, Surat - 395009',
          customerLocation:{ lat:21.1959, lng:72.7933 },
          shopLocation:{ lat:21.2120, lng:72.8300, name:'My Kirana Store', address:'Adajan Patiya, Surat' },
          deliveryBoy:{ name:'Amit Delivery', phone:'9876543211', photo:'https://via.placeholder.com/100?text=DB', vehicle:'Bike', number:'GJ05 AB 1234', rating:4.8 },
          deliveryBoyLocation:{ lat:21.2050, lng:72.8100 },
          items:[
            { name:'Fresh Apples', qty:2, price:120, image:'https://via.placeholder.com/80?text=Apple' },
            { name:'Bananas', qty:1, price:40, image:'https://via.placeholder.com/80?text=Banana' }
          ],
          timeline:[
            { status:'pending', title:'Order Placed', description:'Your order has been placed', time:new Date(Date.now()-40*60000).toISOString(), completed:true, icon:'📝' },
            { status:'confirmed', title:'Order Confirmed', description:'Shop confirmed your order', time:new Date(Date.now()-35*60000).toISOString(), completed:true, icon:'✅' },
            { status:'preparing', title:'Preparing', description:'Shop is preparing your order', time:new Date(Date.now()-20*60000).toISOString(), completed:true, icon:'👨‍🍳' },
            { status:'out_for_delivery', title:'Out for Delivery', description:'Delivery boy picked up order • On the way', time:new Date(Date.now()-5*60000).toISOString(), completed:true, icon:'🛵', active:true },
            { status:'delivered', title:'Delivered', description:'Order will be delivered soon', time:null, completed:false, icon:'📦' }
          ],
          estimatedDelivery:new Date(Date.now()+15*60000).toISOString(),
          distance:{ km:2.3, time:'15 mins' },
          otp:'1234',
          deliveryProof:null
        };
      }

      this.renderTimeline();
      this.renderOrderInfo();
      this.initMap();

      return this.trackData;

    }catch(e){
      console.error('Track load error:', e);
      this.showError(e.message);
      return null;
    }
  }

  renderTimeline(){
    try{
      const container = document.getElementById('trackTimeline');
      if(!container ||!this.trackData) return;

      const timeline = this.trackData.timeline||[];

      container.innerHTML = timeline.map((step, index)=>{
        const isCompleted = step.completed;
        const isActive = step.active;
        const isLast = index===timeline.length-1;

        return `
          <div class="timeline-step ${isCompleted?'completed':''} ${isActive?'active':''}">
            <div class="timeline-line ${isLast?'last':''} ${isCompleted?'completed':''}"></div>
            <div class="timeline-dot ${isCompleted?'completed':''} ${isActive?'active':''}">${isCompleted?'✓':step.icon||'•'}</div>
            <div class="timeline-content">
              <b>${step.title}</b>
              <span>${step.description}</span>
              <span class="timeline-time">${step.time? this.formatTime(step.time) : 'Pending'}</span>
              ${isActive? `<div class="active-badge">🔴 Live</div>` : ''}
            </div>
            ${isActive? `<div class="timeline-live-pulse"></div>` : ''}
          </div>
        `;
      }).join('');

    }catch(e){}
  }

  renderOrderInfo(){
    try{
      const orderIdEl = document.getElementById('trackOrderId');
      const statusEl = document.getElementById('trackStatus');
      const customerEl = document.getElementById('trackCustomer');
      const addressEl = document.getElementById('trackAddress');
      const estimatedEl = document.getElementById('trackEstimated');
      const otpEl = document.getElementById('trackOtp');
      const distanceEl = document.getElementById('trackDistance');

      if(orderIdEl) orderIdEl.innerText = `#${this.trackData.orderId||this.trackData._id}`;
      if(statusEl){
        statusEl.innerText = this.getStatusText(this.trackData.status);
        statusEl.className = `status-badge ${this.trackData.status}`;
      }
      if(customerEl) customerEl.innerText = `${this.trackData.customerName||'Customer'} • ${this.trackData.customerPhone||''}`;
      if(addressEl) addressEl.innerText = this.trackData.customerAddress||'Address';
      if(estimatedEl) estimatedEl.innerText = `Estimated: ${this.formatTime(this.trackData.estimatedDelivery)} • ${this.trackData.distance?.time||'15 mins'}`;
      if(otpEl) otpEl.innerText = `OTP: ${this.trackData.otp||'1234'}`;
      if(distanceEl) distanceEl.innerText = `${this.trackData.distance?.km||2.3}km away`;

      // Delivery boy info
      const dbNameEl = document.getElementById('deliveryBoyName');
      const dbPhoneEl = document.getElementById('deliveryBoyPhone');
      const dbVehicleEl = document.getElementById('deliveryBoyVehicle');
      const dbPhotoEl = document.getElementById('deliveryBoyPhoto');

      if(this.trackData.deliveryBoy){
        if(dbNameEl) dbNameEl.innerText = `${this.trackData.deliveryBoy.name} • ⭐ ${this.trackData.deliveryBoy.rating||4.8}`;
        if(dbPhoneEl) dbPhoneEl.innerText = this.trackData.deliveryBoy.phone;
        if(dbPhoneEl) dbPhoneEl.href = `tel:${this.trackData.deliveryBoy.phone}`;
        if(dbVehicleEl) dbVehicleEl.innerText = `${this.trackData.deliveryBoy.vehicle||'Bike'} • ${this.trackData.deliveryBoy.number||''}`;
        if(dbPhotoEl) dbPhotoEl.src = this.trackData.deliveryBoy.photo||'https://via.placeholder.com/100?text=DB';
      }

      // Items
      const itemsContainer = document.getElementById('trackItems');
      if(itemsContainer && this.trackData.items){
        itemsContainer.innerHTML = this.trackData.items.map(item=>`
          <div class="track-item">
            <img src="${item.image||'https://via.placeholder.com/60'}" alt="${item.name}">
            <div>
              <b>${item.name}</b>
              <span>Qty: ${item.qty} • ₹${item.price} each</span>
            </div>
            <b>₹${item.qty*item.price}</b>
          </div>
        `).join('');
      }

      const totalEl = document.getElementById('trackTotal');
      if(totalEl) totalEl.innerText = `₹ ${this.trackData.total||this.trackData.amount||0}`;

    }catch(e){}
  }

  initMap(){
    try{
      const mapContainer = document.getElementById('trackMap');
      if(!mapContainer) return;

      // If Google Maps available
      if(window.google && window.google.maps){
        const shopLoc = this.trackData.shopLocation||{ lat:21.2120, lng:72.8300 };
        const customerLoc = this.trackData.customerLocation||{ lat:21.1959, lng:72.7933 };
        const deliveryLoc = this.trackData.deliveryBoyLocation||{ lat:21.2050, lng:72.8100 };

        const center = deliveryLoc;

        this.map = new google.maps.Map(mapContainer, {
          center,
          zoom:14,
          styles:[
            { featureType:'poi', stylers:[{ visibility:'off' }] }
          ],
          disableDefaultUI:false,
          zoomControl:true,
          mapTypeControl:false,
          streetViewControl:false,
          fullscreenControl:true
        });

        // Shop marker
        const shopMarker = new google.maps.Marker({
          position:shopLoc,
          map:this.map,
          icon:{
            url:'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
          },
          title:this.trackData.shopLocation?.name||'Shop'
        });

        const shopInfo = new google.maps.InfoWindow({
          content:`<div style="font-family:Outfit,sans-serif;font-weight:700"><b>🏪 ${this.trackData.shopLocation?.name||'Shop'}</b><br><span style="font-size:11px;color:#64748b">${this.trackData.shopLocation?.address||''}</span></div>`
        });

        shopMarker.addListener('click', ()=> shopInfo.open(this.map, shopMarker));

        // Customer marker
        const customerMarker = new google.maps.Marker({
          position:customerLoc,
          map:this.map,
          icon:{
            url:'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
          },
          title:'Delivery Location'
        });

        const customerInfo = new google.maps.InfoWindow({
          content:`<div style="font-family:Outfit,sans-serif;font-weight:700"><b>📍 Delivery Location</b><br><span style="font-size:11px;color:#64748b">${this.trackData.customerAddress||''}</span></div>`
        });

        customerMarker.addListener('click', ()=> customerInfo.open(this.map, customerMarker));

        // Delivery boy marker with animation
        const deliveryMarker = new google.maps.Marker({
          position:deliveryLoc,
          map:this.map,
          icon:{
            url:'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize:new google.maps.Size(40,40)
          },
          title:'Delivery Boy',
          animation:google.maps.Animation.BOUNCE
        });

        setTimeout(()=> deliveryMarker.setAnimation(null), 2000);

        const deliveryInfo = new google.maps.InfoWindow({
          content:`<div style="font-family:Outfit,sans-serif;font-weight:700"><b>🛵 ${this.trackData.deliveryBoy?.name||'Delivery Boy'}</b><br><span style="font-size:11px;color:#64748b">${this.trackData.deliveryBoy?.phone||''} • ${this.trackData.distance?.km||2.3}km away</span></div>`
        });

        deliveryMarker.addListener('click', ()=> deliveryInfo.open(this.map, deliveryMarker));

        this.markers = [shopMarker, customerMarker, deliveryMarker];

        // Polyline from shop to customer via delivery boy
        const routePath = [shopLoc, deliveryLoc, customerLoc];

        this.polyline = new google.maps.Polyline({
          path:routePath,
          geodesic:true,
          strokeColor:'#0f172a',
          strokeOpacity:0.8,
          strokeWeight:4,
          icons:[{
            icon:{ path:google.maps.SymbolPath.FORWARD_CLOSED_ARROW, strokeColor:'#0f172a', scale:3 },
            offset:'100%',
            repeat:'100px'
          }]
        });

        this.polyline.setMap(this.map);

        // Fit bounds
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(shopLoc);
        bounds.extend(customerLoc);
        bounds.extend(deliveryLoc);
        this.map.fitBounds(bounds);

        // Delivery boy movement simulation if no socket
        if(!this.socketConnected){
          this.simulateDeliveryMovement(deliveryMarker);
        }

      } else {
        // Fallback: show static map image or text
        mapContainer.innerHTML = `
          <div style="background:#f1f5f9;height:300px;border-radius:16px;display:grid;place-items:center;text-align:center;padding:20px">
            <div>
              <div style="font-size:32px;margin-bottom:8px">🗺️</div>
              <b style="font-weight:900">Live Tracking Map</b>
              <span style="display:block;font-size:11px;color:#64748b;margin-top:4px">Shop → Delivery Boy → Customer</span>
              <span style="display:block;font-size:12px;font-weight:700;margin-top:8px">${this.trackData.distance?.km||2.3}km away • ${this.trackData.distance?.time||'15 mins'}</span>
              <div style="margin-top:12px;display:flex;gap:8px;justify-content:center">
                <span style="background:#dbeafe;color:#1e40af;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:800">🏪 Shop: ${this.trackData.shopLocation?.name||'Shop'}</span>
                <span style="background:#dcfce7;color:#166534;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:800">🛵 ${this.trackData.deliveryBoy?.name||'Delivery'}</span>
              </div>
            </div>
          </div>
        `;
      }

    }catch(e){ console.error('Map init error:', e); }
  }

  simulateDeliveryMovement(marker){
    try{
      if(!marker ||!this.trackData) return;

      let progress = 0;
      const shopLoc = this.trackData.shopLocation;
      const customerLoc = this.trackData.customerLocation;

      const interval = setInterval(()=>{
        progress += 0.02;

        if(progress>=1){
          clearInterval(interval);
          this.updateStatus('delivered');
          return;
        }

        // Interpolate between shop and customer
        const lat = shopLoc.lat + (customerLoc.lat - shopLoc.lat)*progress;
        const lng = shopLoc.lng + (customerLoc.lng - shopLoc.lng)*progress;

        if(window.google && window.google.maps && marker.setPosition){
          marker.setPosition({ lat, lng });
        }

        // Update distance
        const remaining = (1-progress)* (this.trackData.distance?.km||2.3);
        const distanceEl = document.getElementById('trackDistance');
        if(distanceEl) distanceEl.innerText = `${remaining.toFixed(1)}km away`;

        if(progress>0.8){
          this.updateStatus('delivered_soon');
        }

      }, 2000);

    }catch(e){}
  }

  initSocket(){
    try{
      if(window.SocketCore){
        window.SocketCore.on('delivery-location-updated', (data)=>{
          if(data.orderId===this.orderId){
            this.updateDeliveryLocation(data.location);
          }
        });

        window.SocketCore.on('order-status-updated', (data)=>{
          if(data.orderId===this.orderId){
            this.updateStatus(data.status, data);
          }
        });

        window.SocketCore.on('delivery-assigned', (data)=>{
          if(data.orderId===this.orderId){
            this.trackData.deliveryBoy = data.deliveryBoy;
            this.renderOrderInfo();
            if(window.Toast) Toast.show(`🛵 ${data.deliveryBoy.name} assigned for delivery`, 'success');
          }
        });

        this.socketConnected = true;
      }

      if(global.io || window.io){
        const socket = window.io||global.io;

        socket.on('delivery-location', (data)=>{
          if(data.orderId===this.orderId){
            this.updateDeliveryLocation(data.location||data);
          }
        });

        socket.on('order-status', (data)=>{
          if(data.orderId===this.orderId){
            this.updateStatus(data.status, data);
          }
        });

        this.socketConnected = true;
      }

    }catch(e){}
  }

  updateDeliveryLocation(location){
    try{
      this.trackData.deliveryBoyLocation = location;

      if(this.map && this.markers[2] && window.google){
        this.markers[2].setPosition(location);
        this.map.panTo(location);
      }

      const distanceEl = document.getElementById('trackDistance');
      if(distanceEl && location.distance){
        distanceEl.innerText = `${location.distance}km away`;
      }

      // Update estimated time
      const estimatedEl = document.getElementById('trackEstimated');
      if(estimatedEl && location.eta){
        estimatedEl.innerText = `Estimated: ${location.eta} • ${location.distance||''}km away`;
      }

    }catch(e){}
  }

  updateStatus(status, data={}){
    try{
      this.trackData.status = status;

      // Update timeline
      const timeline = this.trackData.timeline||[];
      const statusIndex = timeline.findIndex(t=> t.status===status);

      if(statusIndex!==-1){
        timeline.forEach((step,i)=>{
          if(i<=statusIndex){
            step.completed = true;
            step.time = step.time||new Date().toISOString();
          }
          if(i===statusIndex){
            step.active = true;
          } else {
            step.active = false;
          }
        });
      }

      this.trackData.timeline = timeline;

      this.renderTimeline();
      this.renderOrderInfo();

      const statusText = this.getStatusText(status);

      if(window.Toast) Toast.show(`📦 Order ${statusText}`, 'info');

      // If delivered
      if(status==='delivered'){
        this.onDelivered();
      }

      if(global.io){
        global.io.to(`user:${this.trackData.customerId||this.userId}`).emit('order-status-updated', { orderId:this.orderId, status, trackData:this.trackData });
      }

    }catch(e){}
  }

  onDelivered(){
    try{
      const otpEl = document.getElementById('trackOtp');
      if(otpEl) otpEl.style.display='none';

      const deliveredPopup = document.getElementById('deliveredPopup');
      if(deliveredPopup) deliveredPopup.style.display='block';

      // Stop watching
      this.stopLiveTracking();

      // Confetti effect
      if(window.confetti){
        window.confetti({ particleCount:100, spread:70, origin:{ y:0.6 } });
      }

      // Vibrate
      if(navigator.vibrate) navigator.vibrate([200,100,200]);

      // Play sound
      const audio = new Audio('/shop-templates/common/orders/new-order-sound.mp3');
      audio.play().catch(()=>{});

    }catch(e){}
  }

  startLiveTracking(){
    try{
      // Watch customer location if needed
      if(navigator.geolocation && this.trackData.status!=='delivered'){
        this.watchId = navigator.geolocation.watchPosition(
          (position)=>{
            const location = { lat:position.coords.latitude, lng:position.coords.longitude };

            // Send customer location to server for delivery optimization
            if(window.ApiCore){
              window.ApiCore.post(`/api/common/track/${this.orderId}/customer-location`, { location, shopId:this.shopId }).catch(()=>{});
            }
          },
          (error)=>{},
          { enableHighAccuracy:true, timeout:10000, maximumAge:0 }
        );
      }

      // Poll for updates every 10 seconds if socket not connected
      if(!this.socketConnected){
        this.pollInterval = setInterval(()=>{
          this.loadTrackData();
        }, 10000);
      }

    }catch(e){}
  }

  stopLiveTracking(){
    try{
      if(this.watchId!==null && navigator.geolocation){
        navigator.geolocation.clearWatch(this.watchId);
        this.watchId = null;
      }

      if(this.pollInterval){
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }

    }catch(e){}
  }

  getStatusText(status){
    const statusMap = {
      pending:'Order Placed',
      confirmed:'Confirmed',
      preparing:'Preparing',
      ready:'Ready for Pickup',
      out_for_delivery:'Out for Delivery',
      delivered:'Delivered',
      cancelled:'Cancelled',
      delivered_soon:'Arriving Soon'
    };

    return statusMap[status]||status;
  }

  formatTime(time){
    try{
      if(!time) return 'Pending';

      const d = new Date(time);
      const now = new Date();
      const diffMs = now-d;
      const diffMin = Math.floor(diffMs/60000);

      if(diffMin<1) return 'Just now';
      if(diffMin<60) return `${diffMin} min ago`;

      return d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true }) + ` • ${d.toLocaleDateString()}`;

    }catch(e){
      return time;
    }
  }

  showError(message){
    const container = document.getElementById('trackError');
    if(container){
      container.style.display='block';
      container.innerText = message;
    }
  }

  // Customer actions
  async cancelOrder(){
    try{
      if(!confirm('Cancel this order?')) return;

      if(window.ApiCore){
        const result = await window.ApiCore.post(`/api/common/track/${this.orderId}/cancel`, { shopId:this.shopId, reason:'Customer cancelled' });

        if(result.success){
          this.updateStatus('cancelled');
          if(window.Toast) Toast.show('Order cancelled', 'success');
        }
      } else {
        this.updateStatus('cancelled');
        if(window.Toast) Toast.show('Order cancelled (local)', 'success');
      }

    }catch(e){ if(window.Toast) Toast.show('Failed to cancel', 'error'); }
  }

  async contactShop(){
    try{
      const shopPhone = this.trackData.shopPhone||'9876543210';

      if(confirm(`Call shop? ${shopPhone}`)){
        window.location.href = `tel:${shopPhone}`;
      }

    }catch(e){}
  }

  async contactDeliveryBoy(){
    try{
      const phone = this.trackData.deliveryBoy?.phone;

      if(!phone){
        if(window.Toast) Toast.show('Delivery boy not assigned yet', 'info');
        return;
      }

      window.location.href = `tel:${phone}`;

    }catch(e){}
  }

  async shareTracking(){
    try{
      const url = window.location.href;

      if(navigator.share){
        await navigator.share({ title:`Track Order #${this.orderId}`, text:`Track my order from ${this.trackData.shopLocation?.name||'Shop'}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        if(window.Toast) Toast.show('Tracking link copied 📋', 'success');
      }

    }catch(e){}
  }
}

window.TrackCore = new TrackCore();
window.TrackCoreInstance = window.TrackCore;

document.addEventListener('DOMContentLoaded', ()=>{
  if(document.getElementById('trackRoot')){
    window.TrackCore.init();
  }
});

// Global functions
window.cancelTrackingOrder = ()=> window.TrackCore.cancelOrder();
window.contactShop = ()=> window.TrackCore.contactShop();
window.contactDeliveryBoy = ()=> window.TrackCore.contactDeliveryBoy();
window.shareTracking = ()=> window.TrackCore.shareTracking();