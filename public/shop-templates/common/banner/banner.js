// LOCATION: common/banner/banner.js - WORLD CLASS BANNER LOGIC - API ONLY
class CommonBanner {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('currentShopId') || '';
    this.currentIndex = 0;
    this.banners = [];
    this.autoPlayInterval = null;
    this.api = `/api/common/banner`;
  }

  async init(){
    if(!this.shopId){
      console.warn('Banner: No shopId');
      this.showEmpty();
      return;
    }
    await this.loadBanners();
    this.bindEvents();
  }

  async loadBanners(){
    const loader = document.getElementById('bannerLoader');
    const slider = document.getElementById('bannerSlider');
    try{
      const res = await fetch(`${this.api}/list/${this.shopId}?t=${Date.now()}`, { cache:'no-store', credentials:'include' });
      const data = await res.json();

      // API returns banners or use dummy if empty
      this.banners = data.banners || data.data || [];

      // If no banners from API, show promotional default (frontend only)
      if(this.banners.length === 0){
        this.banners = this.getDefaultBanners();
      }

      this.render();
      if(loader) loader.style.display='none';
      if(slider) slider.style.display='block';
      this.startAutoPlay();
    }catch(e){
      console.error('Banner load failed', e);
      this.banners = this.getDefaultBanners();
      this.render();
      if(loader) loader.style.display='none';
      if(slider) slider.style.display='block';
    }
  }

  getDefaultBanners(){
    // Default festival banners - will be replaced by API data when admin adds
    return [
      { id:1, title:'Free Delivery Today 🚚', subtitle:'On orders above ₹199', image:'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800', badge:'OFFER', link:'' },
      { id:2, title:'Fresh Stock Arrived', subtitle:'Check new products', image:'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800', badge:'NEW', link:'' },
      { id:3, title:'20% OFF on First Order', subtitle:'Use code FIRST20', image:'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=800', badge:'20% OFF', link:'' }
    ];
  }

  render(){
    const track = document.getElementById('bannerTrack');
    const dots = document.getElementById('bannerDots');
    if(!track ||!dots) return;

    track.innerHTML = this.banners.map(b=>`
      <div class="banner-slide" style="background-image:url('${b.image}')" data-link="${b.link || ''}" data-id="${b.id}">
        ${b.badge? `<span class="banner-badge">${b.badge}</span>` : ''}
        <div class="banner-content">
          <h3>${b.title}</h3>
          <p>${b.subtitle || ''}</p>
        </div>
      </div>
    `).join('');

    dots.innerHTML = this.banners.map((_,i)=>`<div class="banner-dot ${i===0?'active':''}" data-index="${i}"></div>`).join('');

    // Click to open link or product
    track.querySelectorAll('.banner-slide').forEach(slide=>{
      slide.addEventListener('click', ()=>{
        const link = slide.dataset.link;
        if(link) window.location.href = link;
      });
    });

    dots.querySelectorAll('.banner-dot').forEach(dot=>{
      dot.addEventListener('click', ()=> this.goTo(parseInt(dot.dataset.index)));
    });
  }

  goTo(index){
    this.currentIndex = index;
    const track = document.getElementById('bannerTrack');
    if(track) track.style.transform = `translateX(-${index*100}%)`;

    document.querySelectorAll('.banner-dot').forEach((d,i)=>{
      d.classList.toggle('active', i===index);
    });
  }

  next(){
    this.currentIndex = (this.currentIndex + 1) % this.banners.length;
    this.goTo(this.currentIndex);
  }

  prev(){
    this.currentIndex = (this.currentIndex - 1 + this.banners.length) % this.banners.length;
    this.goTo(this.currentIndex);
  }

  startAutoPlay(){
    this.stopAutoPlay();
    this.autoPlayInterval = setInterval(()=> this.next(), 3500);
  }

  stopAutoPlay(){
    if(this.autoPlayInterval) clearInterval(this.autoPlayInterval);
  }

  bindEvents(){
    document.getElementById('bannerNext')?.addEventListener('click', ()=> { this.next(); this.startAutoPlay(); });
    document.getElementById('bannerPrev')?.addEventListener('click', ()=> { this.prev(); this.startAutoPlay(); });

    const slider = document.getElementById('bannerSlider');
    if(slider){
      slider.addEventListener('mouseenter', ()=> this.stopAutoPlay());
      slider.addEventListener('mouseleave', ()=> this.startAutoPlay());

      // Touch swipe
      let startX = 0;
      slider.addEventListener('touchstart', e=> startX = e.touches[0].clientX, {passive:true});
      slider.addEventListener('touchend', e=>{
        const diff = startX - e.changedTouches[0].clientX;
        if(Math.abs(diff) > 50){
          diff > 0? this.next() : this.prev();
          this.startAutoPlay();
        }
      }, {passive:true});
    }
  }

  showEmpty(){
    document.getElementById('bannerLoader').style.display='none';
    document.getElementById('bannerEmpty').style.display='block';
  }
}

window.CommonBanner = new CommonBanner();
document.addEventListener('DOMContentLoaded', ()=> window.CommonBanner.init());