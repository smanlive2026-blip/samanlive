// LOCATION: public/shop-templates/common/profile/profile-core.js - V24 - UNIFIED - FULL CODE - NO CUT
// ROLE: customer + shop_owner + shop_logo + area_manager + executive + product_manager
// FLOW: File -> Compress -> Cloudinary via /api/common/profile/upload-avatar -> URL -> Model + Media
// RULE: DB me kabhi base64 nahi jayega, sirf Cloudinary URL jayega. Base64 sirf preview ke liye.
// RULE 2: Is file me koi bhi browser storage use NAHI hoga. Sab kuch Server + Cloudinary se aayega.
//         shopId = sirf opts / URL se. token = sirf AuthCore se. userId = sirf AuthCore / currentUser se.
//         Upload ke baad URL kahin save NAHI hoga, sirf return hoga. Load hamesha Server se hoga.

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

    // URL se 1 value nikaalo - shopId / role / userId ke liye
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

    // IDs - sirf opts / URL / window.currentUser / AuthCore se - kahi aur se NAHI
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

    // Token - sirf AuthCore / window se - kahi aur se NAHI
    getToken(){
      try{
        if(window.AuthCore && window.AuthCore.getToken) return window.AuthCore.getToken() || '';
      }catch(e){}
      if(window.USER_TOKEN) return window.USER_TOKEN;
      return '';
    },

    // MAIN FUNCTION - har input isi ko call karega
    async handleFileInput(inputEl, opts){
      opts = opts || {};
      const file = inputEl && inputEl.files ? inputEl.files[0] : null;
      if(!file) return { success: false, error: 'No file selected' };
      if(!file.type || !file.type.startsWith('image/')){ alert('Sirf image allowed hai - JPG / PNG / WEBP'); return { success: false, error: 'Only image' }; }
      if(file.size > 5 * 1024 * 1024){ alert('Photo 5MB se chhoti honi chahiye'); return { success: false, error: 'Max 5MB' }; }

      const role = opts.role || this.getCurrentRole(opts);
      const ids = this.getIds(opts);
      const shopId = opts.shopId || ids.shopId;
      const field = opts.field || (this.ROLES[role] ? this.ROLES[role].field : 'profilePic');
      const type = opts.type || (role === 'shop_logo' ? 'logo' : role === 'shop_cover' ? 'banner' : role === 'shop_gallery' ? 'gallery' : 'avatar');

      // Shop wali photo ke liye shopId MUST hai - bina shopId ke upload nahi hoga
      if((role === 'shop_logo' || role === 'shop_cover' || role === 'shop_gallery' || role === 'shop_owner') && !shopId){
        alert('shopId nahi mila - URL me ?shopId=XXX hona chahiye. Shop List se dobara kholo.');
        return { success: false, error: 'shopId missing - URL se nahi mila' };
      }

      // 1. Preview turant - base64 sirf screen ke liye, kahin save NAHI hoga
      let previewUrl = '';
      try{
        previewUrl = await this._readAsDataURL(file);
        if(opts.previewSelector){
          document.querySelectorAll(opts.previewSelector).forEach(function(img){ img.src = previewUrl; });
        }
        if(opts.previewId){
          const el = document.getElementById(opts.previewId);
          if(el) el.src = previewUrl;
        }
      }catch(e){}

      // 2. Compress - 800px max, 0.85 quality
      let uploadFile = file;
      try{ uploadFile = await this._compress(file, 800); }catch(e){ uploadFile = file; }

      // 3. Loading state
      if(opts.btnId){
        const btn = document.getElementById(opts.btnId);
        if(btn){ btn.dataset.oldText = btn.textContent; btn.textContent = 'Uploading... ⏳'; btn.disabled = true; }
      }
      if(opts.msgId){
        const m = document.getElementById(opts.msgId);
        if(m) m.textContent = 'Uploading to Cloudinary...';
      }

      // 4. FormData - Cloudinary ke liye file hi jayegi, base64 nahi
      const fd = new FormData();
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
        const token = this.getToken();
        const res = await fetch('/api/common/profile/upload-avatar', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token, 'x-buyer-id': ids.userId },
          body: fd
        });
        const data = await res.json();

        if(opts.btnId){
          const btn = document.getElementById(opts.btnId);
          if(btn){ btn.textContent = btn.dataset.oldText || 'Save'; btn.disabled = false; }
        }

        if(!data.success){
          if(opts.msgId){ const m = document.getElementById(opts.msgId); if(m){ m.textContent = 'Error: ' + (data.message || data.error); m.style.color = 'red'; } }
          alert('Upload fail: ' + (data.message || data.error || 'unknown'));
          return data;
        }

        // 5. NO SAVE HERE - URL kahin save NAHI hoga, sirf return hoga.
        //    Caller ko chahe toh apne RAM wale variable me rakhe, Server se dobara mang ke verify kare.
        //    Mobile me dikh rahi hai, Laptop me nahi - wala dhokha ab khatam, kyunki kahin save hi nahi ho raha.

        // 6. Final preview - Cloudinary URL se
        if(opts.previewSelector){
          document.querySelectorAll(opts.previewSelector).forEach(function(img){ img.src = data.url; });
        }
        if(opts.previewId){
          const el = document.getElementById(opts.previewId);
          if(el) el.src = data.url;
        }

        if(opts.msgId){
          const m = document.getElementById(opts.msgId);
          if(m){ m.textContent = '✅ Saved! Photo Cloudinary pe save ho gayi'; m.style.color = 'green'; }
        }
        if(opts.onSuccess) opts.onSuccess(data);

        // 7. VERIFY - Server me save hui ya nahi, turant dobara Server se mang ke check karo
        //    Agar Server se wahi URL nahi aaya toh alert de do - chup-chap local wali photo mat dikhao
        if(shopId){
          try{
            var chk = await this.loadMyProfile({ shopId: shopId, role: role, userId: ids.userId });
            var s = (chk && (chk.shop || chk.user)) || {};
            var serverUrl = s.logo || s.shopLogo || s.banner || s.coverPhoto || s.ownerPhotoUrl || s.ownerPhoto || '';
            if(!serverUrl){
              alert('⚠️ Photo Cloudinary pe gayi, par Shop me save nahi hui! shopId galat hai - Shop List se dobara kholo.');
            }
          }catch(e){}
        }

        return { success: true, url: data.url, public_id: data.public_id, savedTo: data.savedTo, role: role };

      }catch(err){
        if(opts.btnId){
          const btn = document.getElementById(opts.btnId);
          if(btn){ btn.textContent = btn.dataset.oldText || 'Save'; btn.disabled = false; }
        }
        alert('Upload error: ' + err.message);
        return { success: false, error: err.message };
      }
    },

    // Purani base64 wali pic ko bhi Cloudinary pe bhejne ke liye - migration ke liye
    async uploadBase64String(base64Str, opts){
      opts = opts || {};
      const role = opts.role || this.getCurrentRole(opts);
      const ids = this.getIds(opts);
      const token = this.getToken();
      const res = await fetch('/api/common/profile/upload-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, 'x-buyer-id': ids.userId },
        body: JSON.stringify({ role: role, field: opts.field || 'profilePic', type: opts.type || 'avatar', shopId: opts.shopId || ids.shopId, profilePic: base64Str, buyerId: ids.userId })
      });
      return await res.json();
    },

    _readAsDataURL(file){
      return new Promise(function(resolve, reject){
        const r = new FileReader();
        r.onload = function(e){ resolve(e.target.result); };
        r.onerror = reject;
        r.readAsDataURL(file);
      });
    },

    _compress(file, maxSize){
      return new Promise(function(resolve){
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = function(){
          let w = img.width, h = img.height;
          if(w > maxSize){ h = Math.round(h * maxSize / w); w = maxSize; }
          if(h > maxSize){ w = Math.round(w * maxSize / h); h = maxSize; }
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          const ctx = c.getContext('2d');
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

    // Profile data load karo - 1 hi API sab role ke liye - HAMESHA Server se
    // opts = { shopId, userId / buyerId, role, managerId, executiveId, pmId }
    async loadMyProfile(opts){
      opts = opts || {};
      const ids = this.getIds(opts);
      const token = this.getToken();
      const role = opts.role || this.getCurrentRole(opts);
      const shopId = opts.shopId || ids.shopId;
      const userId = opts.userId || opts.buyerId || ids.userId;
      try{
        const res = await fetch('/api/common/profile/me?buyerId=' + encodeURIComponent(userId) + '&role=' + encodeURIComponent(role) + '&shopId=' + encodeURIComponent(shopId), {
          headers: { 'Authorization': 'Bearer ' + token, 'x-buyer-id': userId }
        });
        const data = await res.json();
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

  console.log('✅ UnifiedProfile V24 loaded - All roles + Cloudinary - NO BROWSER STORAGE');
})();