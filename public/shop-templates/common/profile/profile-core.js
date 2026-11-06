// LOCATION: public/shop-templates/common/profile/profile-core.js - V23 UNIFIED - FULL CODE - NO CUT
// ROLE: customer + shop_owner + shop_logo + area_manager + executive + product_manager
// FLOW: File -> Compress -> Cloudinary via /api/common/profile/upload-avatar -> URL -> Model + Media
// RULE: DB me kabhi base64 nahi jayega, sirf Cloudinary URL jayega. Base64 sirf preview ke liye.

(function(){
  if(window.UnifiedProfile) return;

  window.UnifiedProfile = {
    ROLES: {
      customer: { folder: 'samanlive/users', field: 'profilePic', storageKey: 'userPic', label: 'Customer' },
      shop_owner: { folder: 'samanlive/shops', field: 'ownerPhotoUrl', storageKey: 'ownerPhoto', label: 'Shop Owner Photo' },
      shop_logo: { folder: 'samanlive/shops', field: 'logo', storageKey: 'shopLogo', label: 'Shop Logo' },
      shop_cover: { folder: 'samanlive/shops', field: 'banner', storageKey: 'shopCover', label: 'Shop Cover' },
      shop_gallery: { folder: 'samanlive/shops', field: 'gallery', storageKey: 'shopGallery', label: 'Shop Gallery' },
      area_manager: { folder: 'samanlive/managers', field: 'photo', storageKey: 'managerPhoto', label: 'Area Manager' },
      executive: { folder: 'samanlive/executives', field: 'photo', storageKey: 'executivePhoto', label: 'Executive' },
      product_manager: { folder: 'samanlive/product-managers', field: 'photo', storageKey: 'pmPhoto', label: 'Product Manager' },
      delivery_boy: { folder: 'samanlive/delivery', field: 'photo', storageKey: 'deliveryPhoto', label: 'Delivery Boy' }
    },

    getCurrentRole(){
      if(localStorage.getItem('executiveToken')) return 'executive';
      if(localStorage.getItem('productManagerToken')) return 'product_manager';
      if(localStorage.getItem('managerToken') || localStorage.getItem('areaManagerToken') || localStorage.getItem('areaManagerId')) return 'area_manager';
      if(localStorage.getItem('last_shopId') || localStorage.getItem('shopId') || localStorage.getItem('MY_SHOP_ID')) return 'shop_owner';
      return 'customer';
    },

    getIds(){
      return {
        shopId: localStorage.getItem('last_shopId') || localStorage.getItem('shopId') || localStorage.getItem('MY_SHOP_ID') || '',
        userId: localStorage.getItem('USER_ID') || localStorage.getItem('userId') || localStorage.getItem('USER_ID') || '',
        managerId: localStorage.getItem('areaManagerId') || localStorage.getItem('managerId') || '',
        executiveId: localStorage.getItem('executiveId') || '',
        pmId: localStorage.getItem('productManagerId') || localStorage.getItem('pmId') || '',
        phone: localStorage.getItem('USER_PHONE') || localStorage.getItem('userPhone') || localStorage.getItem('managerPhone') || ''
      };
    },

    getToken(){
      return localStorage.getItem('userToken') || localStorage.getItem('TOKEN') || localStorage.getItem('token') || localStorage.getItem('managerToken') || localStorage.getItem('areaManagerToken') || localStorage.getItem('executiveToken') || localStorage.getItem('productManagerToken') || '';
    },

    // MAIN FUNCTION - har input isi ko call karega
    async handleFileInput(inputEl, opts){
      opts = opts || {};
      const file = inputEl && inputEl.files ? inputEl.files[0] : null;
      if(!file) return { success: false, error: 'No file selected' };
      if(!file.type || !file.type.startsWith('image/')){ alert('Sirf image allowed hai - JPG / PNG / WEBP'); return { success: false, error: 'Only image' }; }
      if(file.size > 5 * 1024 * 1024){ alert('Photo 5MB se chhoti honi chahiye'); return { success: false, error: 'Max 5MB' }; }

      const role = opts.role || this.getCurrentRole();
      const ids = this.getIds();
      const shopId = opts.shopId || ids.shopId;
      const field = opts.field || (this.ROLES[role] ? this.ROLES[role].field : 'profilePic');
      const type = opts.type || (role === 'shop_logo' ? 'logo' : role === 'shop_cover' ? 'banner' : role === 'shop_gallery' ? 'gallery' : 'avatar');

      // 1. Preview turant - base64 sirf screen ke liye
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

        // 5. Sirf URL save karo local me - base64 nahi
        const key = (this.ROLES[role] && this.ROLES[role].storageKey) || 'userPic';
        try{
          localStorage.setItem(key, data.url);
          localStorage.setItem('USER_PIC', data.url);
          if(role === 'customer') localStorage.setItem('userPic', data.url);
          if(role === 'shop_logo') localStorage.setItem('shopLogo', data.url);
        }catch(e){}

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
      const role = opts.role || this.getCurrentRole();
      const ids = this.getIds();
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

    // Profile data load karo - 1 hi API sab role ke liye
    async loadMyProfile(){
      const ids = this.getIds();
      const token = this.getToken();
      const role = this.getCurrentRole();
      try{
        const res = await fetch('/api/common/profile/me?buyerId=' + encodeURIComponent(ids.userId) + '&role=' + role + '&shopId=' + encodeURIComponent(ids.shopId), {
          headers: { 'Authorization': 'Bearer ' + token, 'x-buyer-id': ids.userId }
        });
        const data = await res.json();
        return data;
      }catch(e){ return { success: false, error: e.message }; }
    }
  };

  // Helper - HTML me seedha call karne ke liye
  window.handleProfilePicChange = function(inputEl, role, previewSelector){
    return window.UnifiedProfile.handleFileInput(inputEl, { role: role, previewSelector: previewSelector });
  };

  console.log('✅ UnifiedProfile V23 loaded - All roles + Cloudinary');
})();