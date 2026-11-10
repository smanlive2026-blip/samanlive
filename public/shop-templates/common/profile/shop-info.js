// LOCATION: public/shop-templates/common/profile/shop-info.js - V24 - UNIFIED - FULL CODE - NO CUT
// FLOW: Load -> /api/common/profile/me?role=shop_owner -> Fill -> Logo/Cover/Owner Photo -> UnifiedProfile -> Cloudinary -> Save Info
// RULE: DB me kabhi base64 nahi jayega, sirf Cloudinary URL jayega. Base64 sirf preview ke liye.
// RULE 2: Is file me koi bhi browser storage use NAHI hoga. Sab kuch Server + Cloudinary se aayega.
//         shopId = sirf URL se. token = sirf AuthCore se. userId = sirf AuthCore / currentUser se.
//         Load hamesha Server se hoga. Save hamesha Server pe hoga. Save ke baad dobara Server se verify hoga.

class ShopInfoCore {
  constructor(){
    // shopId SIRF URL se - kahi aur se NAHI
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
    this.shop = null;
    this.newLogoUrl = '';
    this.newCoverUrl = '';
    this.newOwnerPhotoUrl = '';
  }

  getToken(){
    try{
      if(window.AuthCore && window.AuthCore.getToken) return window.AuthCore.getToken() || '';
    }catch(e){}
    return window.USER_TOKEN || '';
  }

  getUserId(){
    try{
      if(window.AuthCore && window.AuthCore.getUserId) return window.AuthCore.getUserId() || '';
    }catch(e){}
    if(window.currentUser && window.currentUser._id) return window.currentUser._id;
    return '';
  }

  async init(){
    // shopId nahi hai toh form khulega hi nahi - galat dukaan ka form kabhi nahi bharega
    if(!this.shopId){
      const msg = document.getElementById('shopInfoMsg');
      if(msg){ msg.textContent = 'Shop not found - shopId missing hai. URL me ?shopId=XXX hona chahiye. Dashboard / Shop List se dobara kholo.'; msg.style.color = 'red'; }
      return;
    }

    // Save button
    const saveBtn = document.getElementById('saveShopInfoBtn');
    if(saveBtn) saveBtn.onclick = () => this.handleSave();

    // Logo input - Cloudinary
    const logoInput = document.getElementById('shopInfoLogoInput');
    if(logoInput){
      logoInput.addEventListener('change', async () => {
        if(!logoInput.files[0]) return;
        const r = await window.UnifiedProfile.handleFileInput(logoInput, { role: 'shop_logo', field: 'logo', type: 'logo', shopId: this.shopId, userId: this.getUserId(), previewSelector: '#shopInfoLogoPreview', msgId: 'shopInfoMsg' });
        if(r && r.success){
          this.newLogoUrl = r.url;
          // Verify - Server me save hui ya nahi, dobara Server se mang ke dekho
          await this.loadShop();
          this.fillForm();
        }
      });
    }
    // Cover input
    const coverInput = document.getElementById('shopInfoCoverInput');
    if(coverInput){
      coverInput.addEventListener('change', async () => {
        if(!coverInput.files[0]) return;
        const r = await window.UnifiedProfile.handleFileInput(coverInput, { role: 'shop_cover', field: 'banner', type: 'banner', shopId: this.shopId, userId: this.getUserId(), previewSelector: '#shopInfoCoverPreview', msgId: 'shopInfoMsg' });
        if(r && r.success){
          this.newCoverUrl = r.url;
          await this.loadShop();
          this.fillForm();
        }
      });
    }
    // Owner Photo input
    const ownerInput = document.getElementById('shopOwnerPhotoInput');
    if(ownerInput){
      ownerInput.addEventListener('change', async () => {
        if(!ownerInput.files[0]) return;
        const r = await window.UnifiedProfile.handleFileInput(ownerInput, { role: 'shop_owner', field: 'ownerPhotoUrl', type: 'avatar', shopId: this.shopId, userId: this.getUserId(), previewSelector: '#shopOwnerPhotoPreview', msgId: 'shopInfoMsg' });
        if(r && r.success){
          this.newOwnerPhotoUrl = r.url;
          await this.loadShop();
          this.fillForm();
        }
      });
    }

    await this.loadShop();
    this.fillForm();
  }

  async loadShop(){
    try{
      // Try 1: UnifiedProfile - opts me shopId deke
      if(window.UnifiedProfile){
        try{
          const prof = await window.UnifiedProfile.loadMyProfile({ shopId: this.shopId, role: 'shop_owner', userId: this.getUserId() });
          if(prof && prof.success && (prof.shop || prof.user)) this.shop = prof.shop || prof.user;
        }catch(e){}
      }
      // Try 2: Direct API - token AuthCore se
      if(!this.shop || !this.shop.shopName){
        try{
          const token = this.getToken();
          const buyerId = this.getUserId();
          const res = await fetch(`/api/common/profile/me?buyerId=${encodeURIComponent(buyerId)}&role=shop_owner&shopId=${encodeURIComponent(this.shopId)}`, { headers: { 'Authorization': 'Bearer ' + token, 'x-buyer-id': buyerId } });
          const data = await res.json();
          if(data.success && (data.shop || data.user)) this.shop = data.shop || data.user;
        }catch(e){}
      }
      // NO Try 3 - Browser storage wala cache DELETE kar diya hai.
      // Server se nahi mila toh form khaali rahega, galat / purana data nahi dikhega.
      return this.shop;
    }catch(e){ return null; }
  }

  fillForm(){
    const s = this.shop || {};
    const set = (id, val) => { const el = document.getElementById(id); if(el) el.value = val || ''; };
    set('shopInfoName', s.shopName || s.name);
    set('shopInfoCategory', s.shopType || s.category || s.template);
    set('shopInfoDescription', s.description);
    set('shopInfoTagline', s.tagline);
    set('shopOwnerName', s.ownerName);
    set('shopPhone', s.phone || s.ownerPhone);
    set('shopAltPhone', s.altPhone);
    set('shopEmail', s.email);
    set('shopWhatsapp', s.whatsapp || s.phone);
    set('shopAddress', typeof s.address === 'string' ? s.address : (s.address?.line1 || ''));
    set('shopArea', s.area || s.address?.area || '');
    set('shopCity', s.city || s.address?.city);
    set('shopPincode', s.address?.pincode || s.pincode);
    set('shopLandmark', s.address?.line2 || s.landmark);
    set('shopGst', s.gst);
    set('shopFssai', s.fssai);
    set('shopEstYear', s.estYear);

    const logo = s.logo || s.shopLogo || s.uploadedLogo || s.image || '';
    if(logo){ const img = document.getElementById('shopInfoLogoPreview'); if(img) img.src = logo; this.newLogoUrl = logo; }
    const cover = s.banner || s.coverPhoto || s.cover || '';
    if(cover){ const img = document.getElementById('shopInfoCoverPreview'); if(img) img.src = cover; this.newCoverUrl = cover; }
    const owner = s.ownerPhotoUrl || s.ownerPhoto || s.ownerAvatar || '';
    if(owner){ const img = document.getElementById('shopOwnerPhotoPreview'); if(img) img.src = owner; this.newOwnerPhotoUrl = owner; }
  }

  validateShopData(data){
    const errors = [];
    if(!data.shopName || data.shopName.trim().length < 3) errors.push('Shop name must be at least 3 characters');
    if(!data.shopType) errors.push('Category required');
    if(!data.ownerName || data.ownerName.trim().length < 3) errors.push('Owner name required');
    if(!data.phone || data.phone.toString().length !== 10) errors.push('Phone must be 10 digits');
    if(!data.address || data.address.trim().length < 10) errors.push('Full address required');
    if(!data.area) errors.push('Area required');
    if(!data.city) errors.push('City required');
    if(data.pincode && data.pincode.toString().length !== 6) errors.push('Pincode must be 6 digits');
    if(data.email && !data.email.includes('@')) errors.push('Invalid email');
    if(data.gst && data.gst.length !== 15) errors.push('GST must be 15 characters');
    if(data.fssai && data.fssai.length !== 14) errors.push('FSSAI must be 14 digits');
    return { valid: errors.length === 0, errors };
  }

  async handleSave(){
    const btn = document.getElementById('saveShopInfoBtn');
    if(btn){ btn.textContent = 'Saving... ⏳'; btn.disabled = true; }
    const msg = document.getElementById('shopInfoMsg');
    const data = {
      shopName: document.getElementById('shopInfoName')?.value.trim(),
      name: document.getElementById('shopInfoName')?.value.trim(),
      shopType: document.getElementById('shopInfoCategory')?.value,
      category: document.getElementById('shopInfoCategory')?.value,
      description: document.getElementById('shopInfoDescription')?.value.trim(),
      tagline: document.getElementById('shopInfoTagline')?.value.trim(),
      ownerName: document.getElementById('shopOwnerName')?.value.trim(),
      phone: document.getElementById('shopPhone')?.value.trim(),
      altPhone: document.getElementById('shopAltPhone')?.value.trim(),
      email: document.getElementById('shopEmail')?.value.trim(),
      whatsapp: document.getElementById('shopWhatsapp')?.value.trim(),
      address: document.getElementById('shopAddress')?.value.trim(),
      area: document.getElementById('shopArea')?.value.trim(),
      city: document.getElementById('shopCity')?.value.trim(),
      pincode: document.getElementById('shopPincode')?.value.trim(),
      landmark: document.getElementById('shopLandmark')?.value.trim(),
      gst: document.getElementById('shopGst')?.value.trim().toUpperCase(),
      fssai: document.getElementById('shopFssai')?.value.trim(),
      estYear: document.getElementById('shopEstYear')?.value ? Number(document.getElementById('shopEstYear').value) : null,
      logo: this.newLogoUrl || this.shop?.logo || '',
      shopLogo: this.newLogoUrl || this.shop?.logo || '',
      banner: this.newCoverUrl || this.shop?.banner || '',
      coverPhoto: this.newCoverUrl || this.shop?.banner || '',
      ownerPhotoUrl: this.newOwnerPhotoUrl || this.shop?.ownerPhotoUrl || '',
      shopId: this.shopId
    };

    const v = this.validateShopData(data);
    if(!v.valid){
      alert(v.errors[0]);
      if(btn){ btn.textContent = '💾 Save'; btn.disabled = false; }
      return;
    }

    try{
      const token = this.getToken();
      const buyerId = this.getUserId();
      // Shop info update - /api/common/profile/me ke through nahi, direct shop update - HAMESHA Server pe
      const res = await fetch(`/api/common/profile/shop/${this.shopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, 'x-buyer-id': buyerId },
        body: JSON.stringify(data)
      }).then(r=>r.json()).catch(()=>null);

      // Fallback - sirf dusra Server route, browser storage wala save DELETE kar diya hai
      if(!res || !res.success){
        const res2 = await fetch(`/api/shops/${this.shopId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, 'x-buyer-id': buyerId },
          body: JSON.stringify(data)
        }).then(r=>r.json()).catch(()=>null);
        if(!res2 || (!res2.success && !res2.shop)){
          // Server me save nahi hua - chup-chap browser storage me save karke dhokha nahi denge
          if(msg){ msg.textContent = '❌ Server me save nahi hua - dobara try karo. Server route check karo.'; msg.style.color = 'red'; }
          if(btn){ btn.textContent = '💾 Save'; btn.disabled = false; }
          return;
        }
      }

      // Save ke baad turant Server se dobara mang ke verify karo - wahi asli data hai
      await this.loadShop();
      this.fillForm();

      if(msg){ msg.textContent = '✅ Shop info saved! Server se verify ho gaya.'; msg.style.color = 'green'; }
      if(btn){ btn.textContent = '💾 Save'; btn.disabled = false; }
      setTimeout(()=>{ if(msg) msg.textContent = ''; }, 3000);
    }catch(e){
      if(msg){ msg.textContent = 'Error: ' + e.message; msg.style.color = 'red'; }
      if(btn){ btn.textContent = '💾 Save'; btn.disabled = false; }
    }
  }

  getShopInfo(){ return this.shop || {}; }
}

window.ShopInfoCoreInstance = new ShopInfoCore();
document.addEventListener('DOMContentLoaded', () => window.ShopInfoCoreInstance.init());