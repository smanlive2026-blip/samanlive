// LOCATION: public/shop-templates/common/checkout/address-select.js - V2 COMMON - FULL CODE
// FIX V2 COMMON: 1) Pehle Authorization header hi nahi bhejte the, sirf credentials:include - Isliye Bearer wale Customer ka Address Checkout me nahi aata tha
// 2) Address na aaye toh localStorage userLocation se Dummy Address bana dete the - Ab Dummy kabhi nahi banega
// 3) Shape ek kiya - Profile wala hi shape: name / phone / line1 / line2 / city / state / pincode / type / isDefault - Checkout me alag shape nahi chalega
// COMMON RULE: Profile (public/profile/js/addresses.js) aur Checkout (ye file) - Dono ka Address ek hi jagah se aayega = GET/POST /api/user/addresses - Koi dusri jagah se nahi
// FLOW: init -> loadAddresses (Server se) -> Select -> window.CHECKOUT_ADDRESS me rakho -> Continue -> checkout.js ko event bhejo
class AddressSelect {
  constructor(){
    // shopId SIRF URL se - localStorage se kabhi nahi
    this.shopId = new URLSearchParams(location.search).get('shopId') || window.SHOP_ID || '';
    this.selected = null; // Poora address object - Sirf RAM me, localStorage me Address kabhi save nahi karenge
    this.addresses = [];
    this.api = '/api/user/addresses'; // Profile wala hi API - Common
  }

  getToken(){
    try{ if(window.AuthCore && window.AuthCore.getToken) return window.AuthCore.getToken() || ''; }catch(e){}
    try{ return localStorage.getItem('TOKEN') || localStorage.getItem('userToken') || localStorage.getItem('token') || ''; }catch(e){ return ''; }
  }

  getHeaders(){
    var t = this.getToken();
    var h = { 'Content-Type':'application/json' };
    if(t) h['Authorization'] = 'Bearer ' + t;
    return h;
  }

  // Profile wala shape hi ek sach hai - Purane alag-alag naam ko isi me badal do
  normAddr(a){
    if(!a) return null;
    return {
      _id: a._id || a.id || '',
      name: a.name || a.fullName || a.receiverName || '',
      phone: a.phone || a.mobile || a.phoneNumber || '',
      line1: a.line1 || a.addressLine1 || a.street || a.address || '',
      line2: a.line2 || a.addressLine2 || a.landmark || a.area || '',
      city: a.city || '',
      state: a.state || '',
      pincode: a.pincode || a.pinCode || a.zip || '',
      type: a.type || a.label || 'Home',
      isDefault: !!a.isDefault,
      lat: a.lat || a.latitude || '',
      lng: a.lng || a.longitude || ''
    };
  }

  esc(s){ var d=document.createElement('div'); d.textContent=String(s==null?'':s); return d.innerHTML; }

  async init(){
    await this.loadAddresses();
    var btn = document.getElementById('addrContinue');
    if(btn) btn.addEventListener('click', ()=> this.continueToPayment());
  }

  async loadAddresses(){
    var list = document.getElementById('addressList');
    try{
      if(list) list.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>';

      // COMMON - Profile wala hi API + Profile wala hi Auth - Koi alag rasta nahi
      var res = await fetch(this.api + '?t=' + Date.now(), { headers: this.getHeaders(), cache:'no-store' });
      var data = await res.json().catch(function(){ return null; });

      // 401 aaya toh matlab Login nahi hai - Dummy mat dikhao, saaf bolo Login karo
      if(res.status === 401 || (data && data.success === false && res.status === 401)){
        this.addresses = [];
        if(list) list.innerHTML = '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;text-align:center;font-weight:700;font-size:13px;line-height:1.5">🔐 Login karo<br><span style="color:#64748b;font-weight:600;font-size:12px">Address dekhne ke liye pehle login karo</span></div>';
        return [];
      }

      var raw = (data && (data.addresses || data.data || [])) || [];
      this.addresses = raw.map(function(a){ return this.normAddr(a); }.bind(this)).filter(function(a){ return a && (a.line1 || a.city); });

      // NO DUMMY - Pehle yahan localStorage userLocation se Dummy ban jata tha - Ab khaali hai toh khaali hi rahega
      if(this.addresses.length === 0){
        this.selected = null;
        window.CHECKOUT_ADDRESS = null;
        if(list) list.innerHTML = '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;text-align:center;font-weight:700;font-size:13px;line-height:1.5">📍 No Address Saved<br><span style="color:#64748b;font-weight:600;font-size:12px">+ Add dabake apna asli Address jodo - GPS se nakli Address nahi banayenge</span></div>';
        this.updateContinueBtn();
        return [];
      }

      // Default wala pehle se select karo - Nahi hai toh pehla wala
      var def = this.addresses.find(function(a){ return a.isDefault; }) || this.addresses[0];
      this.selected = def;
      window.CHECKOUT_ADDRESS = def;
      this.render();
      return this.addresses;
    }catch(e){
      this.addresses = [];
      if(list) list.innerHTML = '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;text-align:center;font-weight:700;font-size:13px;line-height:1.5">❌ Address load nahi hua<br><span style="color:#64748b;font-weight:600;font-size:12px">Server check karo - Dummy Address nahi dikhayenge</span></div>';
      return [];
    }
  }

  render(){
    var list = document.getElementById('addressList');
    if(!list) return;
    list.innerHTML = this.addresses.map(function(a){
      var isSel = this.selected && String(this.selected._id) === String(a._id);
      return '<div class="addr-card" data-id="' + this.esc(a._id) + '" style="background:#fff;border:1px solid ' + (isSel ? '#0f172a' : '#e2e8f0') + ';border-radius:12px;padding:12px;margin-bottom:8px;cursor:pointer">'
        + '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><b style="font-size:13px">' + this.esc(a.name || 'Customer') + ' • ' + this.esc(a.type) + '</b>'
        + (a.isDefault ? '<span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:900">DEFAULT</span>' : '') + '</div>'
        + '<p style="font-size:12px;color:#64748b;margin:4px 0 0;line-height:1.4">' + this.esc(a.line1) + (a.line2 ? ', ' + this.esc(a.line2) : '') + '<br>' + this.esc(a.city) + ', ' + this.esc(a.state) + ' - ' + this.esc(a.pincode) + '<br>📞 ' + this.esc(a.phone) + '</p>'
        + '<div style="display:flex;gap:8px;margin-top:8px"><button data-set-default="' + this.esc(a._id) + '" style="background:#f1f5f9;border:1px solid #e2e8f0;padding:6px 10px;border-radius:8px;font-weight:800;font-size:11px">✅ Set Default</button>'
        + '<button data-del="' + this.esc(a._id) + '" style="background:#fff;border:1px solid #fecaca;color:#991b1b;padding:6px 10px;border-radius:8px;font-weight:800;font-size:11px">🗑️ Delete</button></div>'
        + '</div>';
    }.bind(this)).join('');

    list.querySelectorAll('.addr-card').forEach(function(card){
      card.addEventListener('click', function(e){
        if(e.target.closest('[data-set-default]') || e.target.closest('[data-del]')) return;
        this.selectAddress(card.dataset.id);
      }.bind(this));
    }.bind(this));

    list.querySelectorAll('[data-set-default]').forEach(function(btn){
      btn.addEventListener('click', function(e){ e.stopPropagation(); this.setDefault(btn.dataset.setDefault); }.bind(this));
    }.bind(this));

    list.querySelectorAll('[data-del]').forEach(function(btn){
      btn.addEventListener('click', function(e){ e.stopPropagation(); this.deleteAddress(btn.dataset.del); }.bind(this));
    }.bind(this));

    this.updateContinueBtn();
  }

  selectAddress(id){
    var found = this.addresses.find(function(a){ return String(a._id) === String(id); });
    if(!found) return;
    this.selected = found;
    window.CHECKOUT_ADDRESS = found; // Checkout.js yahi se padhega - localStorage se nahi
    this.render();
  }

  updateContinueBtn(){
    var btn = document.getElementById('addrContinue');
    if(!btn) return;
    btn.disabled = !this.selected;
    btn.textContent = this.selected ? ('Deliver to this Address → ' + (this.selected.city || '')) : 'Pehle Address Select Karo';
  }

  continueToPayment(){
    if(!this.selected){ alert('Pehle Address select karo'); return null; }
    window.CHECKOUT_ADDRESS = this.selected;
    // Checkout.js ko event se bata do - Wo localStorage se Address nahi padhega, isi event / window se lega
    try{ document.dispatchEvent(new CustomEvent('address-selected', { detail: this.selected })); }catch(e){}
    return this.selected;
  }

  openAddModal(){
    var m = document.getElementById('addAddrModal');
    if(m) m.style.display = 'grid';
  }

  closeAddModal(){
    var m = document.getElementById('addAddrModal');
    if(m) m.style.display = 'none';
  }

  // Naya Address - Profile wala hi API + Profile wala hi shape - Alag shape me kabhi save nahi hoga
  async saveNewAddress(payload){
    // payload: { name, phone, line1, line2, city, state, pincode, type, isDefault } - Modal se aayega
    try{
      if(!payload || !payload.line1 || !payload.city || !payload.pincode){
        alert('Address Line 1 + City + Pincode chahiye');
        return null;
      }
      if(!payload.phone || String(payload.phone).length < 10){
        alert('Sahi 10 digit Phone chahiye');
        return null;
      }
      var body = {
        name: payload.name || '',
        phone: String(payload.phone || ''),
        line1: payload.line1 || '',
        line2: payload.line2 || '',
        city: payload.city || '',
        state: payload.state || '',
        pincode: String(payload.pincode || ''),
        type: payload.type || 'Home',
        isDefault: !!payload.isDefault,
        // GPS hai toh bhej do, nahi hai toh khaali - GPS se Address kabhi nahi banayenge
        lat: payload.lat || '',
        lng: payload.lng || ''
      };
      var res = await fetch(this.api, { method:'POST', headers: this.getHeaders(), body: JSON.stringify(body) });
      var data = await res.json().catch(function(){ return null; });
      if(!data || !data.success){
        alert('❌ Address save nahi hua - ' + ((data && (data.message || data.error)) || 'Server check karo'));
        return null;
      }
      this.closeAddModal();
      await this.loadAddresses();
      // Naya wala hi select kar do
      var newest = this.addresses[this.addresses.length - 1];
      if(newest) this.selectAddress(newest._id);
      return data;
    }catch(e){ alert('❌ Address save nahi hua - ' + e.message); return null; }
  }

  async setDefault(id){
    try{
      var res = await fetch(this.api + '/' + encodeURIComponent(id) + '/default', { method:'PUT', headers: this.getHeaders() });
      var data = await res.json().catch(function(){ return null; });
      if(data && data.success){
        this.addresses.forEach(function(a){ a.isDefault = String(a._id) === String(id); });
        this.render();
      } else alert('❌ Default set nahi hua');
    }catch(e){ alert('❌ Default set nahi hua'); }
  }

  async deleteAddress(id){
    if(!confirm('Ye Address delete karna hai?')) return;
    try{
      var res = await fetch(this.api + '/' + encodeURIComponent(id), { method:'DELETE', headers: this.getHeaders() });
      var data = await res.json().catch(function(){ return null; });
      if(data && data.success){
        this.addresses = this.addresses.filter(function(a){ return String(a._id) !== String(id); });
        if(this.selected && String(this.selected._id) === String(id)){ this.selected = this.addresses.find(function(a){ return a.isDefault; }) || this.addresses[0] || null; window.CHECKOUT_ADDRESS = this.selected; }
        this.render();
      } else alert('❌ Delete nahi hua');
    }catch(e){ alert('❌ Delete nahi hua'); }
  }

  getSelected(){ return this.selected; }
  getAll(){ return this.addresses; }
}

// Global - Checkout.js isi ko bulayega
window.AddressSelect = new AddressSelect();
window.AddressSelectClass = AddressSelect;

// Add Modal wale button - HTML me jo + Add / Save button hai, usko isi se jodo
document.addEventListener('DOMContentLoaded', function(){
  // Agar ye file Checkout page pe hai toh auto init, warna Checkout khud init karega
  if(document.getElementById('addressList')) window.AddressSelect.init();
});