// LOCATION: public/assets/js/nearby-shops.js - V3 - COMMON CIRCLE - HOME + NEARBY - FULL CODE
// WORLD CLASS NEARBY SHOPS - HOME PAGE + NEARBY PAGE - FULL
// RULE 1: Customer ka GPS aayega tabhi Circle wali dukaan dikhegi. GPS nahi diya toh saari dukaan dikha ke dhokha NAHI denge.
// RULE 2: 1 Shop = 1 Circle. Backend har Shop ka apna-apna Radius check karega - distance <= us Shop ka Radius hai toh hi dikhegi.
// RULE 3: Shop Create se Location ka koi lena-dena nahi hai. Jiski Location set nahi hai, wo yahan kabhi nahi dikhegi.
// RULE 4: Closed wali dukaan gayab NAHI hogi - Closed likh ke dikhegi, Order phir bhi aayega.
// RULE 5: Thela / Moving wali dukaan pe LIVE badge aayega - Fixed wali pe nahi aayega.
// RULE 6: Location sirf 1 jagah se aayegi = GET /api/location/shops/nearby?lat=&lng= - Kahi aur se nahi.
// FLOW: Page kholo -> GPS lo -> GET /api/location/shops/nearby?lat=&lng= -> #nearbyShopsGrid me Card banao -> Card dabao -> Uski customer-view kholo
// USE: Home Page (public/index.html) me bas ye 2 line daal do:
//      <div id="nearbyShopsGrid"></div>
//      <script src="/assets/js/nearby-shops.js"></script>
//      Baaki kaam ye file khud kar legi. Nearby Page (public/nearby-shops.html) me bhi yehi logic hai, 2 jagah alag code nahi hai.
(function(){
  // 2 baar load ho gaya toh dobara nahi chalega - Ek hi baar chalega
  if(window.__NearbyShopsLoaded) return;
  window.__NearbyShopsLoaded = true;

  var NearbyShopsHome = {
    lat: null,
    lng: null,
    shops: [],
    loading: false,
    gridId: 'nearbyShopsGrid',

    getToken: function(){
      try{ if(window.AuthCore && window.AuthCore.getToken) return window.AuthCore.getToken() || ''; }catch(e){}
      return window.USER_TOKEN || '';
    },
    getUserId: function(){
      try{ if(window.AuthCore && window.AuthCore.getUserId) return window.AuthCore.getUserId() || ''; }catch(e){}
      if(window.currentUser && window.currentUser._id) return window.currentUser._id;
      return '';
    },
    getHeaders: function(){
      return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.getToken(), 'x-buyer-id': this.getUserId() };
    },

    // Customer ka GPS - 1 hi baar mangenge
    getGPS: function(){
      return new Promise(function(resolve, reject){
        if(!navigator.geolocation){ reject(new Error('GPS nahi hai')); return; }
        navigator.geolocation.getCurrentPosition(function(pos){
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }, function(err){
          reject(err);
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
      });
    },

    escape: function(v){
      return String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    // Home pe CSS bhi yahin se laga denge - Alag CSS file banane ki zarurat nahi - Mobile + Laptop dono me sahi dikhega
    injectCSS: function(){
      if(document.getElementById('nearby-home-css')) return;
      var s = document.createElement('style');
      s.id = 'nearby-home-css';
      s.innerHTML = '.nearby-home-wrap{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}'
        + '.nearby-home-card{background:#fff;border:1px solid #f1f5f9;border-radius:16px;padding:14px;cursor:pointer;display:flex;flex-direction:column;gap:8px;transition:.2s}'
        + '.nearby-home-card:hover{box-shadow:0 8px 24px rgba(0,0,0,.08);transform:translateY(-1px)}'
        + '.nearby-home-top{display:flex;gap:10px;align-items:center}'
        + '.nearby-home-logo{width:48px;height:48px;border-radius:12px;background:#0f172a;color:#fff;display:grid;place-items:center;font-weight:900;font-size:20px;flex-shrink:0;overflow:hidden}'
        + '.nearby-home-logo img{width:100%;height:100%;object-fit:cover}'
        + '.nearby-home-name{flex:1;min-width:0}'
        + '.nearby-home-name b{display:block;font-weight:900;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
        + '.nearby-home-name span{font-size:11px;color:#64748b;font-weight:600;display:block;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
        + '.nearby-home-badge{font-size:10px;font-weight:900;padding:4px 8px;border-radius:999px;white-space:nowrap;flex-shrink:0}'
        + '.nearby-home-badge.open{background:#dcfce7;color:#166534}'
        + '.nearby-home-badge.closed{background:#fee2e2;color:#991b1b}'
        + '.nearby-home-live{font-size:10px;font-weight:900;padding:4px 8px;border-radius:999px;background:#fee2e2;color:#991b1b;white-space:nowrap;flex-shrink:0;animation:nearbyBlink 1s infinite}'
        + '@keyframes nearbyBlink{0%{opacity:1}50%{opacity:.5}100%{opacity:1}}'
        + '.nearby-home-addr{font-size:11px;color:#64748b;font-weight:600;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:30px}'
        + '.nearby-home-meta{display:flex;gap:6px;flex-wrap:wrap}'
        + '.nearby-home-pill{background:#f1f5f9;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:800;white-space:nowrap}'
        + '.nearby-home-pill.blue{background:#f0f9ff;color:#0369a1}'
        + '.nearby-home-pill.green{background:#f0fdf4;color:#166534}'
        + '.nearby-home-empty{background:#fff;border:1px solid #f1f5f9;border-radius:16px;padding:20px;text-align:center}'
        + '.nearby-home-empty b{display:block;font-weight:900;font-size:14px;margin-bottom:6px}'
        + '.nearby-home-empty span{font-size:12px;color:#64748b;font-weight:600;line-height:1.5;display:block}'
        + '.nearby-home-empty button{margin-top:12px;background:#0f172a;color:#fff;border:none;padding:10px 16px;border-radius:8px;font-weight:800;font-size:12px;cursor:pointer}'
        + '.nearby-home-skel{height:120px;background:#e2e8f0;border-radius:16px;animation:nearbyPulse 1s infinite}'
        + '@keyframes nearbyPulse{0%{opacity:.6}50%{opacity:1}100%{opacity:.6}}'
        + '@media(max-width:900px){.nearby-home-wrap{grid-template-columns:repeat(2,1fr)}}'
        + '@media(max-width:600px){.nearby-home-wrap{grid-template-columns:1fr;gap:10px}.nearby-home-card{padding:12px}}';
      document.head.appendChild(s);
    },

    render: function(grid){
      if(!grid) return;
      var self = this;

      // Koi dukaan nahi mili
      if(!this.shops || this.shops.length === 0){
        grid.className = '';
        grid.innerHTML = '<div class="nearby-home-empty"><b>😔 Aas-paas koi dukaan nahi mili</b><span>Tere Circle me abhi koi dukaan nahi hai.<br>Ho sakta hai aas-paas ki dukaan ne apni Location set hi nahi ki ho.</span><button id="nearbyHomeRetry">🔄 Dobara Dekho</button></div>';
        var rb = document.getElementById('nearbyHomeRetry');
        if(rb) rb.addEventListener('click', function(){ self.lat = null; self.lng = null; self.load(); });
        return;
      }

      var html = '<div class="nearby-home-wrap">';
      for(var i = 0; i < this.shops.length; i++){
        var s = this.shops[i];
        var name = s.shopName || s.name || 'Shop';
        var type = s.shopType || s.template || 'general';
        var addr = s.address || '';
        var dist = s.distanceText || (s.distanceKm !== undefined ? s.distanceKm + ' KM' : '');
        var radius = s.deliveryRange || s.radius || s.range || 5;
        var isOpen = s.isOpen !== false;
        var isLive = (s.locationType === 'dynamic' || s.type === 'dynamic');
        var logo = s.logo || (s.shop && (s.shop.logo || s.shop.shopLogo)) || '';
        var first = (name || 'S').charAt(0).toUpperCase();
        var logoHtml = logo && typeof logo === 'string' && logo.startsWith('http') ? '<img src="' + logo + '" alt="">' : first;
        var folder = String(type).toLowerCase().replace(/[^a-z0-9-]/g, '') || 'general';
        var link = '/shop-templates/' + folder + '/customer-view.html?shopId=' + encodeURIComponent(s.shopId);
        html += '<div class="nearby-home-card" data-link="' + link + '">'
          + '<div class="nearby-home-top">'
          + '<div class="nearby-home-logo">' + logoHtml + '</div>'
          + '<div class="nearby-home-name"><b>' + self.escape(name) + '</b><span>' + self.escape(type) + '</span></div>'
          + (isLive ? '<span class="nearby-home-live">🛺 LIVE</span>' : '')
          + '<span class="nearby-home-badge ' + (isOpen ? 'open' : 'closed') + '">' + (isOpen ? 'Open 🟢' : 'Closed 🔴') + '</span>'
          + '</div>'
          + '<div class="nearby-home-addr">' + self.escape(addr || 'Address nahi diya') + '</div>'
          + '<div class="nearby-home-meta">'
          + '<span class="nearby-home-pill blue">📍 ' + self.escape(dist || '-') + ' door</span>'
          + '<span class="nearby-home-pill green">⭕ ' + radius + ' KM Circle</span>'
          + '<span class="nearby-home-pill">🏪 ' + self.escape(type) + '</span>'
          + '</div>'
          + '</div>';
      }
      html += '</div>';
      grid.className = '';
      grid.innerHTML = html;
      grid.querySelectorAll('.nearby-home-card').forEach(function(card){
        card.addEventListener('click', function(){
          window.location.href = card.dataset.link;
        });
      });
    },

    showNoGPS: function(grid){
      if(!grid) return;
      var self = this;
      grid.className = '';
      grid.innerHTML = '<div class="nearby-home-empty"><b>📍 Location ON Karo</b><span>Teri Location ke bina hum nahi bata sakte kaunsi dukaan tere Circle me hai.<br>Location ON karo, phir Refresh dabao.</span><button id="nearbyHomeGps">🎯 Location ON Karo</button></div>';
      var b = document.getElementById('nearbyHomeGps');
      if(b) b.addEventListener('click', function(){ self.lat = null; self.lng = null; self.load(); });
    },

    showError: function(grid){
      if(!grid) return;
      var self = this;
      grid.className = '';
      grid.innerHTML = '<div class="nearby-home-empty"><b>❌ Load nahi hua</b><span>Server se dukaan nahi aayi. Dobara try karo.</span><button id="nearbyHomeErr">🔄 Dobara Try Karo</button></div>';
      var b = document.getElementById('nearbyHomeErr');
      if(b) b.addEventListener('click', function(){ self.load(); });
    },

    load: async function(){
      var grid = document.getElementById(this.gridId);
      if(!grid) return;
      if(this.loading) return;
      this.loading = true;
      this.injectCSS();
      grid.innerHTML = '<div class="nearby-home-wrap"><div class="nearby-home-skel"></div><div class="nearby-home-skel"></div><div class="nearby-home-skel"></div></div>';

      try{
        // GPS pehle - GPS nahi toh Nearby hi nahi dikhayenge
        if(this.lat === null || this.lng === null){
          try{
            var loc = await this.getGPS();
            this.lat = loc.lat;
            this.lng = loc.lng;
          }catch(e){
            this.showNoGPS(grid);
            return;
          }
        }

        // 1 hi jagah se aayega - GET /api/location/shops/nearby?lat=&lng= - Backend Circle check karega
        var data = null;
        if(window.ApiCore){
          try{ data = await window.ApiCore.get('/api/location/shops/nearby?lat=' + this.lat + '&lng=' + this.lng); }catch(e){ data = null; }
        }
        if(!data){
          var res = await fetch('/api/location/shops/nearby?lat=' + this.lat + '&lng=' + this.lng, { headers: this.getHeaders() }).then(function(r){ return r.json(); }).catch(function(){ return null; });
          data = res;
        }

        var list = (data && (data.data || data.shops || data)) || [];
        if(!Array.isArray(list)) list = [];
        this.shops = list;
        this.render(grid);

      }catch(e){
        this.showError(grid);
      }finally{
        this.loading = false;
      }
    },

    init: function(){
      // Home Page pe #nearbyShopsGrid hai tabhi chalega - Nahi hai toh chupchaap band ho jayega, error nahi dega
      if(!document.getElementById(this.gridId)) return;
      this.load();
      // Refresh button ho toh usko bhi jod denge
      var self = this;
      var refreshBtn = document.getElementById('refreshNearbyBtn') || document.getElementById('refreshBtn');
      if(refreshBtn){
        refreshBtn.addEventListener('click', function(){ self.lat = null; self.lng = null; self.load(); });
      }
    }
  };

  // loadNearbyShops naam se bhi chalega - Purane location.user.js wale ko bhi yehi milega - 2 jagah alag code nahi hai
  window.loadNearbyShops = function(lat, lng){
    if(lat && lng){
      NearbyShopsHome.lat = Number(lat);
      NearbyShopsHome.lng = Number(lng);
    }
    NearbyShopsHome.load();
  };
  window.NearbyShopsHome = NearbyShopsHome;

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ NearbyShopsHome.init(); });
  } else {
    NearbyShopsHome.init();
  }
})();