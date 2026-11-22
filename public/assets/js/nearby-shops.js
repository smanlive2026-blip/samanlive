// LOCATION: public/assets/js/nearby-shops.js - V4 WORLD CLASS - HOME + NEARBY - FULL CODE
// RULE: Home pe wahi design chalega jo Nearby page pe hai - Banner + Logo + Rating + Distance
// RULE: GPS nahi toh dukaan nahi dikhayenge - Filter / Search sirf RAM me hoga, dobara server pe nahi jayega
// RULE: Is file me browser storage ka naam KAHIN NAHI HAI
(function(){
  if(window.__NearbyShopsLoaded) return;
  window.__NearbyShopsLoaded = true;

  var Home = {
    lat: null, lng: null, shops: [], loading: false, gridId: 'nearbyShopsGrid',
    getToken: function(){ try{ if(window.AuthCore && window.AuthCore.getToken) return window.AuthCore.getToken() || ''; }catch(e){} return window.USER_TOKEN || ''; },
    getUserId: function(){ try{ if(window.AuthCore && window.AuthCore.getUserId) return window.AuthCore.getUserId() || ''; }catch(e){} if(window.currentUser && window.currentUser._id) return window.currentUser._id; return ''; },
    getHeaders: function(){ return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.getToken(), 'x-buyer-id': this.getUserId() }; },
    getGPS: function(){
      return new Promise(function(resolve, reject){
        if(!navigator.geolocation){ reject(new Error('GPS nahi hai')); return; }
        navigator.geolocation.getCurrentPosition(function(pos){ resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); }, function(err){ reject(err); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
      });
    },
    escape: function(v){ return String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); },
    injectCSS: function(){
      if(document.getElementById('nearby-home-css')) return;
      var s = document.createElement('style');
      s.id = 'nearby-home-css';
      s.innerHTML = '.nearby-home-wrap{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}'
        + '.nearby-home-card{background:#fff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;cursor:pointer;transition:.2s;display:flex;flex-direction:column}'
        + '.nearby-home-card:hover{transform:translateY(-3px);box-shadow:0 16px 32px rgba(0,0,0,.10)}'
        + '.nearby-home-banner{height:110px;background:linear-gradient(135deg,#667eea,#764ba2,#f093fb);position:relative;overflow:hidden}'
        + '.nearby-home-banner img{width:100%;height:100%;object-fit:cover;display:block}'
        + '.nearby-home-banner:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,.35))}'
        + '.nearby-home-badges{position:absolute;top:10px;left:10px;right:10px;display:flex;gap:6px;z-index:2;flex-wrap:wrap}'
        + '.nearby-home-badge{font-size:10px;font-weight:900;padding:5px 9px;border-radius:999px}'
        + '.nearby-home-badge.open{background:rgba(220,252,231,.95);color:#166534}'
        + '.nearby-home-badge.closed{background:rgba(254,226,226,.95);color:#991b1b}'
        + '.nearby-home-badge.live{background:#ef4444;color:#fff;animation:nearbyBlink 1s infinite}'
        + '.nearby-home-badge.dist{background:rgba(15,23,42,.85);color:#fff}'
        + '@keyframes nearbyBlink{0%{opacity:1}50%{opacity:.5}100%{opacity:1}}'
        + '.nearby-home-logo{position:absolute;left:14px;bottom:-20px;width:50px;height:50px;border-radius:14px;background:#fff;border:3px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.15);display:grid;place-items:center;font-weight:900;font-size:21px;color:#0f172a;overflow:hidden;z-index:3}'
        + '.nearby-home-logo img{width:100%;height:100%;object-fit:cover}'
        + '.nearby-home-body{padding:26px 13px 13px;display:flex;flex-direction:column;gap:6px;flex:1}'
        + '.nearby-home-name{font-size:14px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
        + '.nearby-home-cat{font-size:11px;color:#64748b;font-weight:700}'
        + '.nearby-home-addr{font-size:11px;color:#64748b;font-weight:600;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:30px}'
        + '.nearby-home-row{display:flex;gap:6px;flex-wrap:wrap}'
        + '.nearby-home-pill{background:#f1f5f9;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:800;white-space:nowrap}'
        + '.nearby-home-pill.star{background:#fef9c3;color:#854d0e}'
        + '.nearby-home-pill.blue{background:#eff6ff;color:#1d4ed8}'
        + '.nearby-home-pill.green{background:#f0fdf4;color:#166534}'
        + '.nearby-home-visit{margin-top:auto;background:#0f172a;color:#fff;padding:10px;border-radius:11px;font-weight:900;font-size:12px;border:0;cursor:pointer}'
        + '.nearby-home-empty{background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:22px;text-align:center}'
        + '.nearby-home-empty b{display:block;font-weight:900;font-size:14px;margin-bottom:6px}'
        + '.nearby-home-empty span{font-size:12px;color:#64748b;font-weight:600;line-height:1.5;display:block}'
        + '.nearby-home-empty button{margin-top:12px;background:#0f172a;color:#fff;border:0;padding:10px 16px;border-radius:10px;font-weight:800;font-size:12px;cursor:pointer}'
        + '.nearby-home-skel{height:210px;background:#e2e8f0;border-radius:20px;animation:nearbyPulse 1s infinite}'
        + '@keyframes nearbyPulse{0%{opacity:.6}50%{opacity:1}100%{opacity:.6}}'
        + '@media(max-width:900px){.nearby-home-wrap{grid-template-columns:repeat(2,1fr)}}'
        + '@media(max-width:600px){.nearby-home-wrap{grid-template-columns:1fr;gap:12px}}';
      document.head.appendChild(s);
    },
    render: function(grid){
      if(!grid) return;
      var self = this;
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
        var addr = s.address && typeof s.address === 'object' ? [s.address.line1, s.address.city].filter(Boolean).join(', ') : (s.address || '');
        var dist = s.distanceText || (s.distanceKm !== undefined && s.distanceKm !== null ? Number(s.distanceKm).toFixed(1) + ' KM' : '');
        var rating = s.rating || s.avgRating || 0;
        var isOpen = s.isOpen !== false;
        var isLive = (s.locationType === 'dynamic' || s.type === 'dynamic' || s.isLive);
        var logo = s.logo || s.shopLogo || (s.shop && (s.shop.logo || s.shop.shopLogo)) || '';
        var banner = s.banner || s.coverPhoto || s.cover || logo || '';
        var first = (name || 'S').charAt(0).toUpperCase();
        var logoHtml = logo && typeof logo === 'string' && logo.indexOf('http') === 0 ? '<img src="' + logo + '" alt="">' : first;
        var bannerHtml = banner && typeof banner === 'string' && banner.indexOf('http') === 0 ? '<img src="' + banner + '" alt="">' : '';
        var folder = String(type).toLowerCase().replace(/[^a-z0-9-]/g, '') || 'general';
        var shopId = s.shopId || s._id || '';
        var link = '/shop-templates/' + folder + '/customer-view.html?shopId=' + encodeURIComponent(shopId);
        var mins = dist ? Math.max(10, Math.round(Number(s.distanceKm || 1) * 6)) : 25;
        html += '<div class="nearby-home-card" data-link="' + link + '">'
          + '<div class="nearby-home-banner">' + bannerHtml
          + '<div class="nearby-home-badges">'
          + '<span class="nearby-home-badge ' + (isOpen ? 'open' : 'closed') + '">' + (isOpen ? 'Open' : 'Closed') + '</span>'
          + (isLive ? '<span class="nearby-home-badge live">LIVE</span>' : '')
          + (dist ? '<span class="nearby-home-badge dist">📍 ' + self.escape(dist) + '</span>' : '')
          + '</div>'
          + '<div class="nearby-home-logo">' + logoHtml + '</div>'
          + '</div>'
          + '<div class="nearby-home-body">'
          + '<div class="nearby-home-name">' + self.escape(name) + '</div>'
          + '<div class="nearby-home-cat">🏪 ' + self.escape(type) + '</div>'
          + '<div class="nearby-home-addr">' + self.escape(addr || 'Address nahi diya') + '</div>'
          + '<div class="nearby-home-row">'
          + '<span class="nearby-home-pill star">⭐ ' + (rating ? Number(rating).toFixed(1) : '4.2') + '</span>'
          + '<span class="nearby-home-pill blue">⏱ ' + mins + ' min</span>'
          + '<span class="nearby-home-pill green">⭕ ' + (s.deliveryRange || s.radius || s.range || 5) + ' KM</span>'
          + '</div>'
          + '<button class="nearby-home-visit">Visit Shop →</button>'
          + '</div></div>';
      }
      html += '</div>';
      grid.className = '';
      grid.innerHTML = html;
      grid.querySelectorAll('.nearby-home-card').forEach(function(card){
        card.addEventListener('click', function(){ window.location.href = card.dataset.link; });
      });
    },
    showNoGPS: function(grid){
      if(!grid) return;
      var self = this;
      grid.className = '';
      grid.innerHTML = '<div class="nearby-home-empty"><b>📍 Location ON Karo</b><span>Teri Location ke bina hum nahi bata sakte kaunsi dukaan tere Circle me hai.</span><button id="nearbyHomeGps">🎯 Location ON Karo</button></div>';
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
        if(this.lat === null || this.lng === null){
          try{ var loc = await this.getGPS(); this.lat = loc.lat; this.lng = loc.lng; }
          catch(e){ this.showNoGPS(grid); return; }
        }
        var data = null;
        if(window.ApiCore){ try{ data = await window.ApiCore.get('/api/location/shops/nearby?lat=' + this.lat + '&lng=' + this.lng); }catch(e){ data = null; } }
        if(!data){
          var res = await fetch('/api/location/shops/nearby?lat=' + this.lat + '&lng=' + this.lng, { headers: this.getHeaders() }).then(function(r){ return r.json(); }).catch(function(){ return null; });
          data = res;
        }
        var list = (data && (data.data || data.shops || data)) || [];
        if(!Array.isArray(list)) list = [];
        list.sort(function(a,b){ return (a.distanceKm ?? 999) - (b.distanceKm ?? 999); });
        this.shops = list;
        this.render(grid);
      }catch(e){ this.showError(grid); }
      finally{ this.loading = false; }
    },
    init: function(){
      if(!document.getElementById(this.gridId)) return;
      this.load();
      var self = this;
      var refreshBtn = document.getElementById('refreshNearbyBtn') || document.getElementById('refreshBtn');
      if(refreshBtn){ refreshBtn.addEventListener('click', function(){ self.lat = null; self.lng = null; self.load(); }); }
    }
  };
  window.loadNearbyShops = function(lat, lng){
    if(lat && lng){ Home.lat = Number(lat); Home.lng = Number(lng); }
    Home.load();
  };
  window.NearbyShopsHome = Home;
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ Home.init(); });
  } else {
    Home.init();
  }
})();