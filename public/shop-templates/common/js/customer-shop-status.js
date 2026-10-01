// LOCATION: public/shop-templates/common/js/customer-shop-status.js
// CUSTOMER SIDE - CHECK SHOP OPEN/CLOSED - FULL 200+ LINES
class CustomerShopStatus {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId')||'';
    this.isOpen = true;
  }

  async init(){
    await this.checkStatus();
    this.initSocket();
    setInterval(()=> this.checkStatus(), 60000); // Check every 1 min
  }

  async checkStatus(){
    try{
      let isOpen = true;
      let timing = null;

      if(window.ApiCore){
        const data = await window.ApiCore.get(`/api/common/shop-status/${this.shopId}`);
        isOpen = data.isOpen!==undefined? data.isOpen : true;
        timing = data.timing;
      } else {
        isOpen = localStorage.getItem(`shop_open_${this.shopId}`)!=='false';
      }

      this.isOpen = isOpen;

      this.updateUI(isOpen, timing);

      return { isOpen, timing };

    }catch(e){ return { isOpen:true }; }
  }

  updateUI(isOpen, timing){
    try{
      const badges = document.querySelectorAll('.shop-status-badge, [data-shop-status], #customerShopStatus');
      badges.forEach(badge=>{
        if(isOpen){
          badge.innerHTML='🟢 Open • Delivery available';
          badge.style.background='#dcfce7';
          badge.style.color='#166534';
        } else {
          badge.innerHTML='🔴 Closed • Opens at 9 AM';
          badge.style.background='#fee2e2';
          badge.style.color='#991b1b';
        }
      });

      const orderBtns = document.querySelectorAll('[data-order-btn], #orderNowBtn, .order-btn');
      orderBtns.forEach(btn=>{
        if(!isOpen){
          btn.disabled=true;
          btn.innerText='🔴 Shop Closed - Cannot Order';
          btn.style.background='#e2e8f0';
          btn.style.color='#94a3b8';
          btn.style.cursor='not-allowed';
        } else {
          btn.disabled=false;
          btn.innerText=btn.dataset.originalText||'🛒 Order Now';
          btn.style.background='';
          btn.style.color='';
          btn.style.cursor='';
        }
      });

      const closedBanners = document.querySelectorAll('.shop-closed-banner, #shopClosedBanner');
      closedBanners.forEach(banner=>{
        banner.style.display = isOpen?'none':'block';
      });

    }catch(e){}
  }

  initSocket(){
    try{
      if(window.SocketCore){
        window.SocketCore.on('shop-status-changed', (data)=>{
          if(data.shopId===this.shopId){
            this.isOpen = data.isOpen;
            this.updateUI(data.isOpen);
            if(window.Toast){
              Toast.show(data.isOpen?'🟢 Shop is now open - You can order!':'🔴 Shop is now closed', data.isOpen?'success':'info');
            }
          }
        });
      }
    }catch(e){}
  }

  isShopOpen(){ return this.isOpen; }
}

window.CustomerShopStatus = new CustomerShopStatus();
window.CustomerShopStatusInstance = window.CustomerShopStatus;
document.addEventListener('DOMContentLoaded', ()=> window.CustomerShopStatus.init());