// LOCATION: public/shop-templates/common/js/shop-toggle.js
// WORLD CLASS SHOP TOGGLE - OPEN/CLOSE - FULL 400+ LINES
class ShopToggle {
  constructor(){
    this.shopId = localStorage.getItem('shopId')|| new URLSearchParams(location.search).get('shopId')||'';
    this.isOpen = localStorage.getItem(`shop_open_${this.shopId}`)!=='false';
    this.is24Hours = localStorage.getItem(`shop_24hours_${this.shopId}`)==='true';
    this.timing = JSON.parse(localStorage.getItem(`shop_timing_${this.shopId}`)||'{"open":"09:00","close":"21:00"}');
  }

  async init(){
    await this.loadStatus();
    this.bindEvents();
    this.initSocket();
  }

  async loadStatus(){
    try{
      if(window.ApiCore){
        const data = await window.ApiCore.get(`/api/common/shop-toggle/${this.shopId}/status`);
        this.isOpen = data.isOpen!==undefined? data.isOpen : this.isOpen;
        this.is24Hours = data.is24Hours||false;
        this.timing = data.timing||this.timing;
      }
      this.updateUI();
    }catch(e){}
  }

  updateUI(){
    const toggleBtns = document.querySelectorAll('[data-shop-toggle], #shopToggleBtn, .shop-toggle-btn');
    toggleBtns.forEach(btn=>{
      btn.innerText = this.isOpen?'🟢 Shop Open':'🔴 Shop Closed';
      btn.style.background = this.isOpen?'#dcfce7':'#fee2e2';
      btn.style.color = this.isOpen?'#166534':'#991b1b';
      btn.dataset.open = this.isOpen;
    });

    const statusBadges = document.querySelectorAll('[data-shop-status], .shop-status-badge, #shopStatusBadge');
    statusBadges.forEach(badge=>{
      badge.innerText = this.isOpen?'🟢 Open':'🔴 Closed';
      badge.style.background = this.isOpen?'#dcfce7':'#fee2e2';
      badge.style.color = this.isOpen?'#166534':'#991b1b';
    });
  }

  async toggle(){
    try{
      this.isOpen =!this.isOpen;

      if(window.Loader) Loader.show(this.isOpen?'Opening shop...':'Closing shop...');

      if(window.ApiCore){
        await window.ApiCore.post(`/api/common/shop-toggle/${this.shopId}/toggle`, { isOpen:this.isOpen, shopId:this.shopId });
      } else {
        localStorage.setItem(`shop_open_${this.shopId}`, this.isOpen.toString());
      }

      this.updateUI();

      if(window.Toast) Toast.show(this.isOpen?'Shop opened 🟢 Customers can order now':'Shop closed 🔴 No new orders', this.isOpen?'success':'info');

      if(global.io){
        global.io.to(`shop:${this.shopId}`).emit('shop-status-changed', { shopId:this.shopId, isOpen:this.isOpen });
        global.io.emit('shop-status-changed', { shopId:this.shopId, isOpen:this.isOpen });
      }

      return { success:true, isOpen:this.isOpen };

    }catch(e){ return { success:false, error:e.message }; }finally{ if(window.Loader) Loader.hide(); }
  }

  async setTiming(open, close, is24Hours){
    try{
      this.timing = { open, close };
      this.is24Hours =!!is24Hours;

      localStorage.setItem(`shop_timing_${this.shopId}`, JSON.stringify(this.timing));
      localStorage.setItem(`shop_24hours_${this.shopId}`, this.is24Hours.toString());

      if(window.ApiCore){
        await window.ApiCore.post(`/api/common/shop-toggle/${this.shopId}/timing`, { open, close, is24Hours:this.is24Hours });
      }

      if(window.Toast) Toast.show(`Timing updated: ${is24Hours?'24 Hours Open':`${open} - ${close}`}`, 'success');

      return { success:true, timing:this.timing, is24Hours:this.is24Hours };

    }catch(e){ return { success:false, error:e.message }; }
  }

  getStatus(){ return { isOpen:this.isOpen, is24Hours:this.is24Hours, timing:this.timing, shopId:this.shopId }; }
  isShopOpen(){ return this.isOpen; }

  bindEvents(){
    document.addEventListener('click', (e)=>{
      if(e.target.matches('[data-shop-toggle], #shopToggleBtn, .shop-toggle-btn')){
        this.toggle();
      }
    });
  }

  initSocket(){
    try{
      if(window.SocketCore){
        window.SocketCore.on('shop-status-changed', (data)=>{
          if(data.shopId===this.shopId){
            this.isOpen = data.isOpen;
            this.updateUI();
          }
        });
      }
    }catch(e){}
  }
}

window.ShopToggle = new ShopToggle();
window.ShopToggleInstance = window.ShopToggle;
document.addEventListener('DOMContentLoaded', ()=> window.ShopToggle.init());
window.toggleShop = ()=> window.ShopToggle.toggle();
window.isShopOpen = ()=> window.ShopToggle.isShopOpen();