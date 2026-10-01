// LOCATION: public/shop-templates/common/utils/shop-banner-ext.js
// WORLD CLASS SHOP BANNER EXT - FULL 200+ LINES
class ShopBannerExt {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('shopId') || '';
    this.banner = null;
  }

  async init(){
    await this.loadBanner();
  }

  async loadBanner(){
    try{
      if(window.ApiCore){
        const data = await window.ApiCore.get(`/api/common/banner/${this.shopId}`);
        this.banner = data.banner||data;
      } else {
        this.banner = JSON.parse(localStorage.getItem(`banner_${this.shopId}`)||'null')||{
          text:'🎉 Diwali Sale - 50% OFF on all products!',
          image:'',
          link:'/offers',
          bgColor:'#0f172a',
          textColor:'#ffffff',
          visible:true,
          type:'sale'
        };
      }

      this.renderBanner();
      return this.banner;

    }catch(e){
      return null;
    }
  }

  renderBanner(){
    try{
      const bannerContainer = document.getElementById('shopBanner');
      if(!bannerContainer) return;

      if(!this.banner ||!this.banner.visible){
        bannerContainer.style.display='none';
        return;
      }

      bannerContainer.style.display='block';
      bannerContainer.style.background = this.banner.bgColor||'#0f172a';
      bannerContainer.style.color = this.banner.textColor||'#fff';

      if(this.banner.image){
        bannerContainer.style.backgroundImage = `url(${this.banner.image})`;
        bannerContainer.style.backgroundSize='cover';
        bannerContainer.style.backgroundPosition='center';
      }

      bannerContainer.innerHTML = `
        <div class="banner-content">
          <span class="banner-text">${this.banner.text||'Welcome to our shop!'}</span>
          ${this.banner.link? `<a href="${this.banner.link}?shopId=${this.shopId}" class="banner-link">Shop Now →</a>` : ''}
          <button class="banner-close" onclick="this.parentElement.parentElement.style.display='none'">✕</button>
        </div>
      `;

      if(this.banner.link){
        bannerContainer.style.cursor='pointer';
        bannerContainer.addEventListener('click', (e)=>{
          if(!e.target.classList.contains('banner-close')){
            window.location.href = `${this.banner.link}?shopId=${this.shopId}`;
          }
        });
      }

    }catch(e){}
  }

  async updateBanner(bannerData){
    try{
      this.banner = {...this.banner,...bannerData, shopId:this.shopId, updatedAt:new Date().toISOString() };

      if(window.ApiCore){
        await window.ApiCore.put(`/api/common/banner/${this.shopId}`, this.banner);
      } else {
        localStorage.setItem(`banner_${this.shopId}`, JSON.stringify(this.banner));
      }

      this.renderBanner();

      if(window.Toast) Toast.show('Banner updated 🎨', 'success');

      return { success:true, banner:this.banner };

    }catch(e){
      return { success:false, error:e.message };
    }
  }

  async hideBanner(){
    return await this.updateBanner({ visible:false });
  }

  async showBanner(){
    return await this.updateBanner({ visible:true });
  }

  getBanner(){
    return this.banner;
  }

  generateBannerHtml(banner){
    try{
      const bg = banner.bgColor||'#0f172a';
      const color = banner.textColor||'#fff';
      const text = banner.text||'Welcome!';

      return `
        <div style="background:${bg};color:${color};padding:12px 16px;border-radius:10px;display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:13px">
          <span>${text}</span>
          ${banner.link? `<a href="${banner.link}" style="background:#fff;color:${bg};padding:6px 12px;border-radius:6px;text-decoration:none;font-weight:900;font-size:11px">Shop Now →</a>` : ''}
        </div>
      `;

    }catch(e){
      return '';
    }
  }
}

window.ShopBannerExt = new ShopBannerExt();
document.addEventListener('DOMContentLoaded', ()=> window.ShopBannerExt.init());