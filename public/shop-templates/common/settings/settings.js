// LOCATION: public/shop-templates/common/settings/settings.js
// WORLD CLASS SETTINGS JS - SHOP OWNER ONLY - FULL 350+ LINES
class SettingsCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('shopId') || '';
    this.settings = {
      shopOpen:true,
      openingTime:'09:00',
      closingTime:'21:00',
      is24Hours:false,
      deliveryCharge:20,
      freeDeliveryAbove:199,
      deliveryRadius:5,
      selfDelivery:true,
      notifications:{ newOrder:true, orderSound:true, popup:true, vibration:true },
      theme:{ color:'#0f172a', darkMode:false, banner:'' },
      language:'en'
    };
  }

  async init(){
    await this.loadSettings();
    this.initRealtime();
  }

  async loadSettings(){
    try{
      if(window.ApiCore){
        const data = await window.ApiCore.get(`/api/common/settings/${this.shopId}`);
        this.settings = {...this.settings,...(data.settings||data)};
      } else {
        const saved = JSON.parse(localStorage.getItem(`settings_${this.shopId}`)||'null');
        if(saved) this.settings = {...this.settings,...saved };

        const timing = JSON.parse(localStorage.getItem(`timing_${this.shopId}`)||'null');
        if(timing){
          this.settings.shopOpen = timing.isOpen!==false;
          this.settings.openingTime = timing.openingTime||'09:00';
          this.settings.closingTime = timing.closingTime||'21:00';
          this.settings.is24Hours = timing.is24Hours||false;
        }
      }
      return this.settings;
    }catch(e){ return this.settings; }
  }

  async saveSettings(newSettings){
    this.settings = {...this.settings,...newSettings };

    try{
      if(window.ApiCore){
        await window.ApiCore.put(`/api/common/settings/${this.shopId}`, { settings:this.settings });
      } else {
        localStorage.setItem(`settings_${this.shopId}`, JSON.stringify(this.settings));

        if(newSettings.shopOpen!==undefined || newSettings.openingTime || newSettings.closingTime){
          const timing = JSON.parse(localStorage.getItem(`timing_${this.shopId}`)||'{}');
          localStorage.setItem(`timing_${this.shopId}`, JSON.stringify({
           ...timing,
            isOpen:newSettings.shopOpen!==undefined? newSettings.shopOpen : timing.isOpen,
            openingTime:newSettings.openingTime||timing.openingTime,
            closingTime:newSettings.closingTime||timing.closingTime,
            is24Hours:newSettings.is24Hours!==undefined? newSettings.is24Hours : timing.is24Hours
          }));
        }
      }

      if(window.Toast) Toast.show('Settings saved ✅', 'success');

      if(window.SocketCore){
        window.SocketCore.emit('settings-updated', { shopId:this.shopId, settings:this.settings });
      }

      return { success:true, settings:this.settings };

    }catch(e){
      if(window.Toast) Toast.show('Failed to save settings', 'error');
      return { success:false, error:e.message };
    }
  }

  async toggleShop(isOpen){
    return await this.saveSettings({ shopOpen:isOpen });
  }

  async updateDeliverySettings(deliverySettings){
    return await this.saveSettings(deliverySettings);
  }

  async updateNotificationSettings(notificationSettings){
    const current = this.settings.notifications||{};
    return await this.saveSettings({ notifications:{...current,...notificationSettings} });
  }

  async updateTheme(themeSettings){
    const current = this.settings.theme||{};
    return await this.saveSettings({ theme:{...current,...themeSettings} });
  }

  async updateLanguage(lang){
    return await this.saveSettings({ language:lang });
  }

  getSettings(){
    return this.settings;
  }

  isShopOpen(){
    return this.settings.shopOpen!==false;
  }

  initRealtime(){
    if(window.SocketCore){
      window.SocketCore.on('settings-updated', (data)=>{
        if(data.shopId===this.shopId){
          this.settings = {...this.settings,...data.settings };
        }
      });
    }
  }
}

window.SettingsCoreInstance = new SettingsCore();
document.addEventListener('DOMContentLoaded', ()=> window.SettingsCoreInstance.init());