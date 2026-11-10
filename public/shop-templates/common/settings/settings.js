// LOCATION: public/shop-templates/common/settings/settings.js - V25 - UNIFIED - FULL CODE
// WORLD CLASS SETTINGS JS - SHOP OWNER ONLY - FULL
// RULE: Settings = Server se hi aayega, Server pe hi save hoga. Is file me koi bhi browser storage use NAHI hoga.
// RULE 2: shopId SIRF URL se aayega. URL me nahi hai toh galat shop ki setting kabhi nahi kholega.
// RULE 3: DB me kabhi base64 nahi jayega, sirf Cloudinary URL jayega.
// FLOW: Load -> GET /api/common/settings/:shopId -> Save -> PUT /api/common/settings/:shopId -> Socket emit
// FIX V25: Pehle is file me shopId + settings + timing browser storage se aate the, aur save bhi browser storage me hota tha. Ab FULL Server only hai.
class SettingsCore {
  constructor(){
    // shopId SIRF URL se - kahi aur se NAHI
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
    this.settings = {
      shopOpen: true,
      openingTime: '09:00',
      closingTime: '21:00',
      is24Hours: false,
      deliveryCharge: 20,
      freeDeliveryAbove: 199,
      deliveryRadius: 5,
      selfDelivery: true,
      notifications: { newOrder: true, orderSound: true, popup: true, vibration: true },
      theme: { color: '#0f172a', darkMode: false, banner: '' },
      language: 'en'
    };
  }

  getToken(){
    try{ if(window.AuthCore && window.AuthCore.getToken) return window.AuthCore.getToken() || ''; }catch(e){}
    return window.USER_TOKEN || '';
  }
  getUserId(){
    try{ if(window.AuthCore && window.AuthCore.getUserId) return window.AuthCore.getUserId() || ''; }catch(e){}
    if(window.currentUser && window.currentUser._id) return window.currentUser._id;
    return '';
  }
  getHeaders(){
    return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.getToken(), 'x-buyer-id': this.getUserId() };
  }

  // Banner me base64 aaya toh usko hata do - DB me base64 kabhi nahi jayega
  sanitizeSettings(s){
    if(!s) return s;
    const out = { ...s };
    if(out.theme){
      out.theme = { ...out.theme };
      const b = out.theme.banner || out.theme.bannerUrl || '';
      out.theme.banner = (typeof b === 'string' && b.startsWith('http')) ? b : '';
      if(out.theme.bannerUrl && !out.theme.banner.startsWith('http')) delete out.theme.bannerUrl;
    }
    if(out.banner){
      out.banner = (typeof out.banner === 'string' && out.banner.startsWith('http')) ? out.banner : '';
    }
    return out;
  }

  async init(){
    await this.loadSettings();
    this.initRealtime();
  }

  async loadSettings(){
    try{
      if(!this.shopId){
        // shopId URL me nahi hai toh galat shop ki setting kabhi nahi kholega - default hi rahega
        return this.settings;
      }

      let fetched = null;

      // 1. ApiCore se - HAMESHA Server se
      if(window.ApiCore){
        try{
          const data = await window.ApiCore.get(`/api/common/settings/${this.shopId}`);
          fetched = data.settings || data || null;
        }catch(e){ fetched = null; }
      }
      // 2. Direct fetch se - ApiCore na chale toh bhi Server se hi mangenge
      if(!fetched){
        try{
          const res = await fetch(`/api/common/settings/${this.shopId}`, { headers: this.getHeaders() }).then(r=>r.json()).catch(()=>null);
          if(res) fetched = res.settings || res;
        }catch(e){}
      }
      // 3. NO Browser storage fallback - Server se nahi mila toh default hi rahega, purani galat setting KABHI nahi aayegi
      if(fetched){
        fetched = this.sanitizeSettings(fetched);
        this.settings = { ...this.settings, ...fetched };
        // Nested objects ko merge karo - warna theme / notifications overwrite ho jayenge
        if(fetched.notifications) this.settings.notifications = { ...{ newOrder:true, orderSound:true, popup:true, vibration:true }, ...fetched.notifications };
        if(fetched.theme) this.settings.theme = { ...{ color:'#0f172a', darkMode:false, banner:'' }, ...fetched.theme };
      }
      return this.settings;
    }catch(e){ return this.settings; }
  }

  async saveSettings(newSettings){
    const cleanNew = this.sanitizeSettings(newSettings || {});
    this.settings = { ...this.settings, ...cleanNew };
    // Nested merge - theme / notifications ka purana data na ude
    if(cleanNew.notifications) this.settings.notifications = { ...(this.settings.notifications||{}), ...cleanNew.notifications };
    if(cleanNew.theme) this.settings.theme = { ...(this.settings.theme||{}), ...cleanNew.theme };
    this.settings = this.sanitizeSettings(this.settings);

    if(!this.shopId){
      if(window.Toast) Toast.show('Shop not found - URL me ?shopId=XXX hona chahiye', 'error');
      return { success: false, error: 'Shop not found' };
    }

    try{
      let saved = false;

      // 1. ApiCore se - HAMESHA Server pe
      if(window.ApiCore){
        try{ await window.ApiCore.put(`/api/common/settings/${this.shopId}`, { settings: this.settings, shopId: this.shopId }); saved = true; }catch(e){ saved = false; }
      }
      // 2. Direct fetch se - ApiCore na chale toh bhi Server pe hi save hoga
      if(!saved){
        const res = await fetch(`/api/common/settings/${this.shopId}`, { method:'PUT', headers: this.getHeaders(), body: JSON.stringify({ settings: this.settings, shopId: this.shopId }) }).then(r=>r.json()).catch(()=>null);
        if(res && (res.success || res.settings || !res.error)) saved = true;
      }
      // 3. Server pe save nahi hua toh dhokha nahi denge - browser storage me save karke "saved" nahi bolenge
      if(!saved){
        if(window.Toast) Toast.show('❌ Server me save nahi hua - dobara try karo', 'error');
        return { success: false, error: 'Server save failed' };
      }

      if(window.Toast) Toast.show('Settings saved ✅', 'success');

      if(window.SocketCore){
        try{ window.SocketCore.emit('settings-updated', { shopId: this.shopId, settings: this.settings }); }catch(e){}
      }

      return { success: true, settings: this.settings };

    }catch(e){
      if(window.Toast) Toast.show('Failed to save settings - Server error', 'error');
      return { success: false, error: e.message };
    }
  }

  async toggleShop(isOpen){
    return await this.saveSettings({ shopOpen: isOpen });
  }

  async updateDeliverySettings(deliverySettings){
    return await this.saveSettings(deliverySettings);
  }

  async updateNotificationSettings(notificationSettings){
    const current = this.settings.notifications || {};
    return await this.saveSettings({ notifications: { ...current, ...notificationSettings } });
  }

  async updateTheme(themeSettings){
    const current = this.settings.theme || {};
    const merged = { ...current, ...themeSettings };
    // Banner me base64 aaya toh hata do
    if(merged.banner && typeof merged.banner === 'string' && !merged.banner.startsWith('http')) merged.banner = '';
    return await this.saveSettings({ theme: merged });
  }

  async updateLanguage(lang){
    return await this.saveSettings({ language: lang });
  }

  getSettings(){
    return this.settings;
  }

  isShopOpen(){
    return this.settings.shopOpen !== false;
  }

  initRealtime(){
    if(window.SocketCore){
      try{
        window.SocketCore.on('settings-updated', (data)=>{
          if(data && data.shopId === this.shopId){
            const incoming = this.sanitizeSettings(data.settings || {});
            this.settings = { ...this.settings, ...incoming };
            if(incoming.notifications) this.settings.notifications = { ...(this.settings.notifications||{}), ...incoming.notifications };
            if(incoming.theme) this.settings.theme = { ...(this.settings.theme||{}), ...incoming.theme };
          }
        });
      }catch(e){}
    }
  }
}

window.SettingsCoreInstance = new SettingsCore();
document.addEventListener('DOMContentLoaded', ()=> window.SettingsCoreInstance.init());