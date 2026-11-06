// LOCATION: public/shop-templates/common/profile/shop-info.js - V23 UNIFIED - FULL CODE - NO CUT
// FLOW: Load -> /api/common/profile/me?role=shop_owner -> Fill -> Logo/Cover/Owner Photo -> UnifiedProfile -> Cloudinary -> Save Info

class ShopInfoCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('last_shopId') || localStorage.getItem('shopId') || '';
    if(this.shopId){ localStorage.setItem('last_shopId', this.shopId); localStorage.setItem('shopId', this.shopId); }
    this.shop = null;
    this.newLogoUrl = '';
    this.newCoverUrl = '';
    this.newOwnerPhotoUrl = '';
  }

  async init(){
    // Save button
    const saveBtn = document.getElementById('saveShopInfoBtn');
    if(saveBtn) saveBtn.onclick = () => this.handleSave();

    // Logo input - Cloudinary
    const logoInput = document.getElementById('shopInfoLogoInput');
    if(logoInput){
      logoInput.addEventListener('change', async () => {
        if(!logoInput.files[0]) return;
        const r = await window.UnifiedProfile.handleFileInput(logoInput, { role: 'shop_logo', field: 'logo', type: 'logo', shopId: this.shopId, previewSelector: '#shopInfoLogoPreview', msgId: 'shopInfoMsg' });
        if(r && r.success) this.newLogoUrl = r.url;
      });
    }
    // Cover input
    const coverInput = document.getElementById('shopInfoCoverInput');
    if(coverInput){
      coverInput.addEventListener('change', async () => {
        if(!coverInput.files[0]) return;
        const r = await window.UnifiedProfile.handleFileInput(coverInput, { role: 'shop_cover', field: 'banner', type: 'banner', shopId: this.shopId, previewSelector: '#shopInfoCoverPreview', msgId: 'shopInfoMsg' });
        if(r && r.success) this.newCoverUrl = r.url;
      });
    }
    // Owner Photo input
    const ownerInput = document.getElementById('shopOwnerPhotoInput');
    if(ownerInput){
      ownerInput.addEventListener('change', async () => {
        if(!ownerInput.files[0]) return;
        const r = await window.UnifiedProfile.handleFileInput(ownerInput, { role: 'shop_owner', field: 'ownerPhotoUrl', type: 'avatar', shopId: this.shopId, previewSelector: '#shopOwnerPhotoPreview', msgId: 'shopInfoMsg' });
        if(r && r.success) this.newOwnerPhotoUrl = r.url;
      });
    }

    await this.loadShop();
    this.fillForm();
  }

  async loadShop(){
    try{
      // Try 1: UnifiedProfile
      if(window.UnifiedProfile){
        try{
          const prof = await window.UnifiedProfile.loadMyProfile();
          if(prof && prof.success && (prof.shop || prof.user)) this.shop = prof.shop || prof.user;
        }catch(e){}
      }
      // Try 2: Direct API
      if(!this.shop || !this.shop.shopName){
        try{
          const token = localStorage.getItem('TOKEN') || localStorage.getItem('userToken') || '';
          const buyerId = localStorage.getItem('USER_ID') || '';
          const res = await fetch(`/api/common/profile/me?buyerId=${encodeURIComponent(buyerId)}&role=shop_owner&shopId=${encodeURIComponent(this.shopId)}`, { headers: { 'Authorization': 'Bearer ' + token, 'x-buyer-id': buyerId } });
          const data = await res.json();
          if(data.success && (data.shop || data.user)) this.shop = data.shop || data.user;
        }catch(e){}
      }
      // Try 3: Local cache
      if(!this.shop || !this.shop.shopName){
        try{
          const local = JSON.parse(localStorage.getItem(`shop_${this.shopId}`) || '{}');
          if(local && (local.shopName || local.name)) this.shop = { ...local, shopName: local.shopName || local.name };
        }catch(e){}
      }
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
    set('shopArea', s.area);
    set('shopCity', s.city || s.address?.city);
    set('shopPincode', s.address?.pincode || s.pincode);
    set('shopLandmark', s.address?.line2);
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
      const token = localStorage.getItem('TOKEN') || localStorage.getItem('userToken') || '';
      const buyerId = localStorage.getItem('USER_ID') || '';
      // Shop info update - /api/common/profile/me ke through nahi, direct shop update
      const res = await fetch(`/api/common/profile/shop/${this.shopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, 'x-buyer-id': buyerId },
        body: JSON.stringify(data)
      }).then(r=>r.json()).catch(()=>null);

      // Fallback - local save
      if(!res || !res.success){
        // Agar route nahi hai toh /api/shops pe try karo
        const res2 = await fetch(`/api/shops/${this.shopId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify(data)
        }).then(r=>r.json()).catch(()=>null);
        if(!res2 || (!res2.success && !res2.shop)){
          // Last fallback - local hi save kar do taaki dashboard update ho jaye
          localStorage.setItem(`shop_${this.shopId}`, JSON.stringify({ ...(this.shop||{}), ...data }));
          if(msg){ msg.textContent = '✅ Saved locally - Server route check karo'; msg.style.color = 'orange'; }
          if(btn){ btn.textContent = '💾 Save'; btn.disabled = false; }
          return;
        }
      }

      if(msg){ msg.textContent = '✅ Shop info saved!'; msg.style.color = 'green'; }
      try{ localStorage.setItem(`shop_${this.shopId}`, JSON.stringify({ ...(this.shop||{}), ...data })); }catch(e){}
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