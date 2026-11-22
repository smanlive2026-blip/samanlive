// LOCATION: public/shop-templates/common/profile/profile-core.js - V26 WORLD CLASS - UNIFIED - FULL CODE - NO CUT
// ROLE: customer + shop_owner + shop_logo + shop_cover + shop_gallery + area_manager + executive + product_manager + delivery_boy
// FLOW: File -> Compress (800px, Browser pe hi) -> FormData File -> POST /api/common/profile/upload-avatar -> Server -> Cloudinary -> URL wapas -> Sirf return hoga
// RULE 1: Photo SIRF Cloudinary pe jayegi - Website ke /uploads/ me kabhi nahi, Disk pe kabhi nahi, Base64 DB me kabhi nahi
// RULE 2: Token sirf AuthCore se, shopId sirf opts / URL se, userId sirf AuthCore / currentUser se
// RULE 3: Upload ke baad URL KAHIN SAVE NAHI HOGA, sirf return hoga - Caller apne RAM wale variable me rakhega
// RULE 4: alert() KABHI NAHI - Error sirf msgId me likhega, Button hamesha wapas enable hoga
// RULE 5: Preview base64 se NAHI hoga - ObjectURL se hoga, Upload ke baad revokeObjectURL se RAM khaali hoga
(function(){
  if(window.UnifiedProfile) return;
  window.UnifiedProfile = {
    ROLES: {
      customer: { folder: 'samanlive/users', field: 'profilePic', label: 'Customer' },
      shop_owner: { folder: 'samanlive/shops', field: 'ownerPhotoUrl', label: 'Shop Owner Photo' },
      shop_logo: { folder: 'samanlive/shops', field: 'logo', label: 'Shop Logo' },
      shop_cover: { folder: 'samanlive/shops', field: 'banner', label: 'Shop Cover' },
      shop_gallery: { folder: 'samanlive/shops', field: 'gallery', label: 'Shop Gallery' },
      area_manager: { folder: 'samanlive/managers', field: 'photo', label: 'Area Manager' },
      executive: { folder: 'samanlive/executives', field: 'photo', label: 'Executive' },
      product_manager: { folder: 'samanlive/product-managers', field: 'photo', label: 'Product Manager' },
      delivery_boy: { folder: 'samanlive/delivery', field: 'photo', label: 'Delivery Boy' }
    },
    _fromUrl: function(key){
      try{ return new URLSearchParams(location.search).get(key) || ''; }catch(e){ return ''; }
    },
    getCurrentRole: function(opts){
      opts = opts || {};
      if(opts.role) return opts.role;
      var fromUrl = this._fromUrl('role');
      if(fromUrl) return fromUrl;
      if(window.USER_ROLE) return window.USER_ROLE;
      if(window.currentUser && window.currentUser.role) return window.currentUser.role;
      return 'customer';
    },
    getIds: function(opts){
      opts = opts || {};
      var userId = opts.userId || opts.buyerId || '';
      var shopId = opts.shopId || '';
      var managerId = opts.managerId || '';
      var executiveId = opts.executiveId || '';
      var pmId = opts.pmId || opts.productManagerId || '';
      var phone = opts.phone || '';
      if(!shopId) shopId = this._fromUrl('shopId') || window.SHOP_ID || window.shopId || '';
      if(!userId){ try{ if(window.AuthCore && window.AuthCore.getUserId) userId = window.AuthCore.getUserId() || ''; }catch(e){} }
      if(!userId && window.currentUser && window.currentUser._id) userId = window.currentUser._id;
      if(!userId) userId = this._fromUrl('buyerId') || this._fromUrl('userId') || '';
      if(!managerId) managerId = this._fromUrl('managerId') || (window.currentUser && window.currentUser.managerId) || '';
      if(!executiveId) executiveId = this._fromUrl('executiveId') || '';
      if(!pmId) pmId = this._fromUrl('pmId') || this._fromUrl('productManagerId') || '';
      if(!phone && window.currentUser && window.currentUser.phone) phone = window.currentUser.phone;
      return { shopId: shopId || '', userId: userId || '', managerId: managerId || '', executiveId: executiveId || '', pmId: pmId || '', phone: phone || '' };
    },
    getToken: function(){
      try{ if(window.AuthCore && window.AuthCore.getToken) return window.AuthCore.getToken() || ''; }catch(e){}
      if(window.USER_TOKEN) return window.USER_TOKEN;
      return '';
    },
    _setMsg: function(opts, text, color){
      try{
        if(!opts) return;
        if(opts.msgId){
          var m = document.getElementById(opts.msgId);
          if(m){ m.textContent = text; if(color) m.style.color = color; }
        }
      }catch(e){}
    },
    _restoreBtn: function(opts){
      try{
        if(!opts || !opts.btnId) return;
        var btn = document.getElementById(opts.btnId);
        if(btn){ btn.textContent = btn.dataset.oldText || 'Save'; btn.disabled = false; }
      }catch(e){}
    },
    handleFileInput: async function(inputEl, opts){
      opts = opts || {};
      var file = inputEl && inputEl.files ? inputEl.files[0] : null;
      if(!file){ this._setMsg(opts, 'Koi file select nahi hui', 'red'); return { success: false, error: 'No file selected' }; }
      if(!file.type || !file.type.startsWith('image/')){ this._setMsg(opts, 'Sirf image allowed hai - JPG / PNG / WEBP', 'red'); return { success: false, error: 'Only image' }; }
      if(file.size > 5 * 1024 * 1024){ this._setMsg(opts, 'Photo 5MB se chhoti honi chahiye', 'red'); return { success: false, error: 'Max 5MB' }; }
      var role = opts.role || this.getCurrentRole(opts);
      var ids = this.getIds(opts);
      var shopId = opts.shopId || ids.shopId;
      var field = opts.field || (this.ROLES[role] ? this.ROLES[role].field : 'profilePic');
      var type = opts.type || (role === 'shop_logo' ? 'logo' : role === 'shop_cover' ? 'banner' : role === 'shop_gallery' ? 'gallery' : 'avatar');
      if((role === 'shop_logo' || role === 'shop_cover' || role === 'shop_gallery' || role === 'shop_owner') && !shopId){
        this._setMsg(opts, 'shopId nahi mila - URL me ?shopId=XXX hona chahiye. Shop List se dobara kholo.', 'red');
        return { success: false, error: 'shopId missing - URL se nahi mila' };
      }
      var previewObjectUrl = '';
      try{
        previewObjectUrl = URL.createObjectURL(file);
        if(opts.previewSelector){ document.querySelectorAll(opts.previewSelector).forEach(function(img){ img.src = previewObjectUrl; }); }
        if(opts.previewId){ var el = document.getElementById(opts.previewId); if(el) el.src = previewObjectUrl; }
      }catch(e){}
      var uploadFile = file;
      try{ uploadFile = await this._compress(file, 800); }catch(e){ uploadFile = file; }
      if(opts.btnId){
        var btn = document.getElementById(opts.btnId);
        if(btn){ btn.dataset.oldText = btn.textContent; btn.textContent = 'Uploading...'; btn.disabled = true; }
      }
      this._setMsg(opts, 'Uploading to Cloudinary...', '');
      var fd = new FormData();
      fd.append('profilePic', uploadFile, file.name);
      fd.append('role', role);
      fd.append('field', field);
      fd.append('type', type);
      fd.append('shopId', shopId);
      fd.append('buyerId', ids.userId);
      fd.append('userId', ids.userId);
      fd.append('managerId', ids.managerId);
      fd.append('executiveId', ids.executiveId);
      fd.append('pmId', ids.pmId);
      fd.append('productManagerId', ids.pmId);
      fd.append('phone', ids.phone);
      try{
        var token = this.getToken();
        var res = await fetch('/api/common/profile/upload-avatar', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token, 'x-buyer-id': ids.userId }, body: fd });
        var data = await res.json().catch(function(){ return null; });
        try{ if(previewObjectUrl) URL.revokeObjectURL(previewObjectUrl); }catch(e){}
        this._restoreBtn(opts);
        if(!data || !data.success){
          this._setMsg(opts, 'Error: ' + ((data && (data.message || data.error)) || 'Upload fail - Server check karo'), 'red');
          return data || { success: false, error: 'Upload fail' };
        }
        if(opts.previewSelector){ document.querySelectorAll(opts.previewSelector).forEach(function(img){ img.src = data.url; }); }
        if(opts.previewId){ var el2 = document.getElementById(opts.previewId); if(el2) el2.src = data.url; }
        this._setMsg(opts, 'Saved! Photo Cloudinary pe save ho gayi', 'green');
        if(opts.onSuccess) opts.onSuccess(data);
        if(shopId){
          try{
            var chk = await this.loadMyProfile({ shopId: shopId, role: role, userId: ids.userId });
            var s = (chk && (chk.shop || chk.user)) || {};
            var serverUrl = s.logo || s.shopLogo || s.banner || s.coverPhoto || s.ownerPhotoUrl || s.ownerPhoto || '';
            if(!serverUrl){ this._setMsg(opts, 'Photo Cloudinary pe gayi, par Shop me save nahi hui! shopId galat hai - Shop List se dobara kholo.', 'red'); }
          }catch(e){}
        }
        return { success: true, url: data.url, public_id: data.public_id, savedTo: data.savedTo, role: role };
      }catch(err){
        try{ if(previewObjectUrl) URL.revokeObjectURL(previewObjectUrl); }catch(e){}
        this._restoreBtn(opts);
        this._setMsg(opts, 'Upload error: ' + err.message, 'red');
        return { success: false, error: err.message };
      }
    },
    uploadBase64String: async function(base64Str, opts){
      opts = opts || {};
      try{
        if(!base64Str || typeof base64Str !== 'string') return { success: false, error: 'base64 missing' };
        if(base64Str.startsWith('http')) return { success: true, url: base64Str };
        var parts = base64Str.split(',');
        var mime = 'image/jpeg';
        try{ var m = parts[0].match(/data:(.*);base64/); if(m) mime = m[1]; }catch(e){}
        var bin = atob(parts[1] || '');
        var bytes = new Uint8Array(bin.length);
        for(var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        var blob = new Blob([bytes], { type: mime });
        var fakeFile = new File([blob], 'migrated.jpg', { type: mime });
        var fakeInput = { files: [fakeFile] };
        return await this.handleFileInput(fakeInput, opts);
      }catch(e){ return { success: false, error: e.message }; }
    },
    _compress: function(file, maxSize){
      return new Promise(function(resolve){
        var img = new Image();
        var url = URL.createObjectURL(file);
        img.onload = function(){
          var w = img.width, h = img.height;
          if(w > maxSize){ h = Math.round(h * maxSize / w); w = maxSize; }
          if(h > maxSize){ w = Math.round(w * maxSize / h); h = maxSize; }
          var c = document.createElement('canvas');
          c.width = w; c.height = h;
          var ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          URL.revokeObjectURL(url);
          c.toBlob(function(b){ if(b) resolve(new File([b], file.name, { type: 'image/jpeg' })); else resolve(file); }, 'image/jpeg', 0.85);
        };
        img.onerror = function(){ URL.revokeObjectURL(url); resolve(file); };
        img.src = url;
      });
    },
    loadMyProfile: async function(opts){
      opts = opts || {};
      var ids = this.getIds(opts);
      var token = this.getToken();
      var role = opts.role || this.getCurrentRole(opts);
      var shopId = opts.shopId || ids.shopId;
      var userId = opts.userId || opts.buyerId || ids.userId;
      try{
        var res = await fetch('/api/common/profile/me?buyerId=' + encodeURIComponent(userId) + '&role=' + encodeURIComponent(role) + '&shopId=' + encodeURIComponent(shopId), { headers: { 'Authorization': 'Bearer ' + token, 'x-buyer-id': userId } });
        var data = await res.json();
        return data;
      }catch(e){ return { success: false, error: e.message }; }
    },
    loadShopProfile: async function(opts){
      opts = opts || {};
      var shopId = opts.shopId || this._fromUrl('shopId') || window.SHOP_ID || window.shopId || '';
      if(!shopId) return { success: false, error: 'shopId missing - URL me ?shopId=XXX chahiye' };
      return await this.loadMyProfile({ shopId: shopId, role: 'shop_owner', userId: opts.userId || opts.buyerId || '' });
    },
    updateShopProfile: async function(shopId, payload){
      if(!shopId) shopId = this._fromUrl('shopId') || window.SHOP_ID || window.shopId || '';
      if(!shopId) return { success: false, error: 'shopId missing' };
      var token = this.getToken();
      var ids = this.getIds({ shopId: shopId });
      try{
        var res = await fetch('/api/common/profile/shop/' + encodeURIComponent(shopId), { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, 'x-buyer-id': ids.userId }, body: JSON.stringify(Object.assign({ shopId: shopId }, payload || {})) });
        var data = await res.json();
        return data;
      }catch(e){ return { success: false, error: e.message }; }
    }
  };
  window.handleProfilePicChange = function(inputEl, role, previewSelector){
    return window.UnifiedProfile.handleFileInput(inputEl, { role: role, previewSelector: previewSelector });
  };
  console.log('UnifiedProfile V26 loaded - All roles + Cloudinary');
})();