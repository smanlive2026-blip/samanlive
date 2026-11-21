// LOCATION: public/shop-templates/common/profile/profile-core.js - V25 - UNIFIED - FULL CODE - NO CUT
// ROLE: customer + shop_owner + shop_logo + shop_cover + shop_gallery + area_manager + executive + product_manager + delivery_boy
// FLOW: File -> Compress (800px, Browser pe hi) -> FormData File -> POST /api/common/profile/upload-avatar -> Server -> Cloudinary upload_stream -> URL wapas -> Sirf return hoga
// RULE 1: Photo SIRF Cloudinary pe jayegi - Website ke /uploads/ me kabhi nahi, Disk pe kabhi nahi, Base64 DB me kabhi nahi
// RULE 2: Is file me localStorage / sessionStorage KAHIN NAHI HOGA - Token sirf AuthCore se, shopId sirf opts / URL se, userId sirf AuthCore / currentUser se
// RULE 3: Upload ke baad URL KAHIN SAVE NAHI HOGA, sirf return hoga - Caller apne RAM wale variable me rakhega, localStorage me KABHI NAHI
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

    // URL se 1 value nikaalo - shopId / role / userId ke liye - localStorage se KABHI NAHI
    _fromUrl(key){
      try{
        var v = new URLSearchParams(location.search).get(key) || '';
        return v;
      }catch(e){ return ''; }
    },

    // Role - sirf opts / URL / window se - kahi aur se NAHI
    getCurrentRole(opts){
      opts = opts || {};
      if(opts.role) return opts.role;
      var fromUrl = this._fromUrl('role');
      if(fromUrl) return fromUrl;
      if(window.USER_ROLE) return window.USER_ROLE;
      if(window.currentUser && window.currentUser.role) return window.currentUser.role;
      return 'customer';
    },

    // IDs - sirf opts / URL / window.currentUser / AuthCore se - localStorage se KABHI NAHI
    getIds(opts){
      opts = opts || {};
      var userId = opts.userId || opts.buyerId || '';
      var shopId = opts.shopId || '';
      var managerId = opts.managerId || '';
      var executiveId = opts.executiveId || '';
      var pmId = opts.pmId || opts.productManagerId || '';
      var phone = opts.phone || '';

      if(!shopId) shopId = this._fromUrl('shopId') || window.SHOP_ID || window.shopId || '';
      if(!userId){
        try{
          if(window.AuthCore && window.AuthCore.getUserId) userId = window.AuthCore.getUserId() || '';
        }catch(e){}
      }
      if(!userId && window.currentUser && window.currentUser._id) userId = window.currentUser._id;
      if(!userId) userId = this._fromUrl('buyerId') || this._fromUrl('userId') || '';
      if(!managerId) managerId = this._fromUrl('managerId') || (window.currentUser && window.currentUser.managerId) || '';
      if(!executiveId) executiveId = this._fromUrl('executiveId') || '';
      if(!pmId) pmId = this._fromUrl('pmId') || this._fromUrl('productManagerId') || '';
      if(!phone && window.currentUser && window.currentUser.phone) phone = window.currentUser.phone;

      return {
        shopId: shopId || '',
        userId: userId || '',
        managerId: managerId || '',
        executiveId: executiveId || '',
        pmId: pmId || '',
        phone: phone || ''
      };
    },

    // Token - sirf AuthCore / window se - localStorage se KABHI NAHI - Token ka ek hi maalik hai = AuthCore
    getToken(){
      try{
        if(window.AuthCore && window.AuthCore.getToken) return window.AuthCore.getToken() || '';
      }catch(e){}
      if(window.USER_TOKEN) return window.USER_TOKEN;
      return '';
    },

    // Msg me likhne ke liye - alert() kabhi nahi karenge
    _setMsg(opts, text, color){
      try{
        if(!opts) return;
        if(opts.msgId){
          var m = document.getElementById(opts.msgId);
          if(m){ m.textContent = text; if(color) m.style.color = color; }
        }
      }catch(e){}
    },

    // Button wapas laane ke liye - Hamesha chalega, chahe success ho ya fail - Button Uploading... pe kabhi nahi atkega
    _restoreBtn(opts){
      try{
        if(!opts || !opts.btnId) return;
        var btn = document.getElementById(opts.btnId);
        if(btn){ btn.textContent = btn.dataset.oldText || 'Save'; btn.disabled = false; }
      }catch(e){}
    },

    // MAIN FUNCTION - har input isi ko call karega - Ek hi rasta hai Photo ka
    async handleFileInput(inputEl, opts){
      opts = opts || {};
      var file = inputEl && inputEl.files ? inputEl.files[0] : null;
      if(!file){
        this._setMsg(opts, 'Koi file select nahi hui', 'red');
        return { success: false, error: 'No file selected' };
      }
      if(!file.type || !file.type.startsWith('image/')){
        this._setMsg(opts, 'Sirf image allowed hai - JPG / PNG / WEBP', 'red');
        return { success: false, error: 'Only image' };
      }
      if(file.size > 5 * 1024 * 1024){
        this._setMsg(opts, 'Photo 5MB se chhoti honi chahiye', 'red');
        return { success: false, error: 'Max 5MB' };
      }

      var role = opts.role || this.getCurrentRole(opts);
      var ids = this.getIds(opts);
      var shopId = opts.shopId || ids.shopId;
      var field = opts.field || (this.ROLES[role] ? this.ROLES[role].field : 'profilePic');
      var type = opts.type || (role === 'shop_logo' ? 'logo' : role === 'shop_cover' ? 'banner' : role === 'shop_gallery' ? 'gallery' : 'avatar');

      // Shop wali photo ke liye shopId MUST hai - bina shopId ke upload nahi hoga, warna galat dukaan ki photo badal jayegi
      if((role === 'shop_logo' || role === 'shop_cover' || role === 'shop_gallery' || role === 'shop_owner') && !shopId){
        this._setMsg(opts, 'shopId nahi mila - URL me ?shopId=XXX hona chahiye. Shop List se dobara kholo.', 'red');
        return { success: false, error: 'shopId missing - URL se nahi mila' };
      }

      // 1. Preview turant - ObjectURL se, base64 se NAHI - Photo RAM me double nahi hogi
      var previewObjectUrl = '';
      try{
        previewObjectUrl = URL.createObjectURL(file);
        if(opts.previewSelector){
          document.querySelectorAll(opts.previewSelector).forEach(function(img){ img.src = previewObjectUrl; });
        }
        if(opts.previewId){
          var el = document.getElementById(opts.previewId);
          if(el) el.src = previewObjectUrl;
        }
      }catch(e){}

      // 2. Compress - 800px max, 0.85 quality - Browser pe hi chhota hoga, Server pe bada File kabhi nahi jayega, Website pe load nahi aayega
      var uploadFile = file;
      try{ uploadFile = await this._compress(file, 800); }catch(e){ uploadFile = file; }

      // 3. Loading state - Sirf Button + Msg, alert nahi
      if(opts.btnId){
        var btn = document.getElementById(opts.btnId);
        if(btn){ btn.dataset.oldText = btn.textContent; btn.textContent = 'Uploading... ⏳'; btn.disabled = true; }
      }
      this._setMsg(opts, 'Uploading to Cloudinary...', '');

      // 4. FormData - Cloudinary ke liye File hi jayegi, base64 NAHI
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
        var res = await fetch('/api/common/profile/upload-avatar', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token, 'x-buyer-id': ids.userId },
          body: fd
        });
        var data = await res.json().catch(function(){ return null; });

        // Preview wali ObjectURL ab khaali karo - RAM me Photo rehni nahi chahiye
        try{ if(previewObjectUrl) URL.revokeObjectURL(previewObjectUrl); }catch(e){}

        this._restoreBtn(opts);

        if(!data || !data.success){
          // Invalid Signature aaye toh ye Server ke .env ka dosh hai - Frontend ka nahi - Msg me saaf likhenge, alert nahi marenge
          this._setMsg(opts, 'Error: ' + ((data && (data.message || data.error)) || 'Upload fail - Server check karo'), 'red');
          return data || { success: false, error: 'Upload fail' };
        }

        // 5. NO SAVE HERE - URL kahin save NAHI hoga, sirf return hoga.
        //    Caller ko chahe toh apne RAM wale variable me rakhe, Server se dobara mang ke verify kare.
        //    localStorage me Photo / URL kabhi nahi jayega.

        // 6. Final preview - Cloudinary URL se - Ab ye asli Photo hai, ObjectURL wali nahi
        if(opts.previewSelector){
          document.querySelectorAll(opts.previewSelector).forEach(function(img){ img.src = data.url; });
        }
        if(opts.previewId){
          var el2 = document.getElementById(opts.previewId);
          if(el2) el2.src = data.url;
        }

        this._setMsg(opts, '✅ Saved! Photo Cloudinary pe save ho gayi', 'green');
        if(opts.onSuccess) opts.onSuccess(data);

        // 7. VERIFY - Shop wali Photo ke liye - Server me save hui ya nahi, turant dobara Server se mang ke check karo
        //    Customer ke liye verify nahi karenge, kyunki Customer ka Save uske Details wale Save pe hoga, yahan turant nahi
        if(shopId){
          try{
            var chk = await this.loadMyProfile({ shopId: shopId, role: role, userId: ids.userId });
            var s = (chk && (chk.shop || chk.user)) || {};
            var serverUrl = s.logo || s.shopLogo || s.banner || s.coverPhoto || s.ownerPhotoUrl || s.ownerPhoto || '';
            if(!serverUrl){
              this._setMsg(opts, '⚠️ Photo Cloudinary pe gayi, par Shop me save nahi hui! shopId galat hai - Shop List se dobara kholo.', 'red');
            }
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

    // Purani base64 wali pic ko bhi Cloudinary pe bhejne ke liye - Migration ke liye
    // Base64 ko yahin File me badal ke handleFileInput wale rasta se bhejenge - Base64 Server ko KABHI NAHI bhejenge
    async uploadBase64String(base64Str, opts){
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
      }catch(e){
        return { success: false, error: e.message };
      }
    },

    _compress(file, maxSize){
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
          c.toBlob(function(b){
            if(b) resolve(new File([b], file.name, { type: 'image/jpeg' }));
            else resolve(file);
          }, 'image/jpeg', 0.85);
        };
        img.onerror = function(){ URL.revokeObjectURL(url); resolve(file); };
        img.src = url;
      });
    },

    // Profile data load karo - 1 hi API sab role ke liye - HAMESHA Server se - localStorage se KABHI NAHI
    // opts = { shopId, userId / buyerId, role, managerId, executiveId, pmId }
    async loadMyProfile(opts){
      opts = opts || {};
      var ids = this.getIds(opts);
      var token = this.getToken();
      var role = opts.role || this.getCurrentRole(opts);
      var shopId = opts.shopId || ids.shopId;
      var userId = opts.userId || opts.buyerId || ids.userId;
      try{
        var res = await fetch('/api/common/profile/me?buyerId=' + encodeURIComponent(userId) + '&role=' + encodeURIComponent(role) + '&shopId=' + encodeURIComponent(shopId), {
          headers: { 'Authorization': 'Bearer ' + token, 'x-buyer-id': userId }
        });
        var data = await res.json();
        return data;
      }catch(e){ return { success: false, error: e.message }; }
    },

    // Shop ka Profile - Customer / Dashboard dono isi se mangenge - opts.shopId MUST hai
    async loadShopProfile(opts){
      opts = opts || {};
      var shopId = opts.shopId || this._fromUrl('shopId') || window.SHOP_ID || window.shopId || '';
      if(!shopId) return { success: false, error: 'shopId missing - URL me ?shopId=XXX chahiye' };
      return await this.loadMyProfile({ shopId: shopId, role: 'shop_owner', userId: opts.userId || opts.buyerId || '' });
    },

    // Shop ki details update karo - PUT /api/common/profile/shop/:shopId - HAMESHA Server pe
    async updateShopProfile(shopId, payload){
      if(!shopId) shopId = this._fromUrl('shopId') || window.SHOP_ID || window.shopId || '';
      if(!shopId) return { success: false, error: 'shopId missing' };
      var token = this.getToken();
      var ids = this.getIds({ shopId: shopId });
      try{
        var res = await fetch('/api/common/profile/shop/' + encodeURIComponent(shopId), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, 'x-buyer-id': ids.userId },
          body: JSON.stringify(Object.assign({ shopId: shopId }, payload || {}))
        });
        var data = await res.json();
        return data;
      }catch(e){ return { success: false, error: e.message }; }
    }
  };

  // Helper - HTML me seedha call karne ke liye
  // handleProfilePicChange(input, 'shop_logo', '#shopLogoPreview') - shopId URL se lega
  window.handleProfilePicChange = function(inputEl, role, previewSelector){
    return window.UnifiedProfile.handleFileInput(inputEl, { role: role, previewSelector: previewSelector });
  };

  console.log('✅ UnifiedProfile V25 loaded - All roles + Cloudinary - NO BROWSER STORAGE');
})();