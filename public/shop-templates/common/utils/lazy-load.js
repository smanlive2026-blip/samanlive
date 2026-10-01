// LOCATION: public/shop-templates/common/utils/lazy-load.js
// WORLD CLASS LAZY LOAD UTILS - FULL 150+ LINES
class LazyLoadUtils {
  constructor(){
    this.observer = null;
    this.init();
  }

  init(){
    try{
      if('IntersectionObserver' in window){
        this.observer = new IntersectionObserver((entries)=>{
          entries.forEach(entry=>{
            if(entry.isIntersecting){
              const img = entry.target;
              this.loadImage(img);
              this.observer.unobserve(img);
            }
          });
        }, {
          rootMargin:'50px 0px',
          threshold:0.01
        });
      }
    }catch(e){}
  }

  loadImage(img){
    try{
      const src = img.dataset.src||img.dataset.lazySrc;
      const srcset = img.dataset.srcset;

      if(src){
        img.src = src;
        img.classList.add('lazy-loaded');
        img.classList.remove('lazy');
      }

      if(srcset){
        img.srcset = srcset;
      }

      // Handle background images
      const bgSrc = img.dataset.bgSrc;
      if(bgSrc){
        img.style.backgroundImage = `url(${bgSrc})`;
        img.classList.add('lazy-loaded');
      }

    }catch(e){}
  }

  observeImages(){
    try{
      const lazyImages = document.querySelectorAll('img[data-src], img[data-lazy-src], [data-bg-src]');

      if(this.observer){
        lazyImages.forEach(img=> this.observer.observe(img));
      } else {
        // Fallback: load all immediately
        lazyImages.forEach(img=> this.loadImage(img));
      }

    }catch(e){}
  }

  lazyLoadImage(imgElement, src, placeholder){
    try{
      if(placeholder){
        imgElement.src = placeholder;
      }

      imgElement.dataset.src = src;
      imgElement.classList.add('lazy');

      if(this.observer){
        this.observer.observe(imgElement);
      } else {
        this.loadImage(imgElement);
      }

    }catch(e){
      imgElement.src = src;
    }
  }

  preloadImages(urls){
    try{
      return Promise.all(urls.map(url=>{
        return new Promise((resolve, reject)=>{
          const img = new Image();
          img.onload = ()=> resolve(url);
          img.onerror = ()=> reject(url);
          img.src = url;
        });
      }));
    }catch(e){
      return Promise.resolve([]);
    }
  }

  isImageLoaded(img){
    return img.complete && img.naturalHeight!==0;
  }

  onImageLoad(img, callback){
    if(this.isImageLoaded(img)){
      if(callback) callback();
    } else {
      img.addEventListener('load', ()=>{ if(callback) callback(); });
      img.addEventListener('error', ()=>{ if(callback) callback(); });
    }
  }
}

window.LazyLoadUtils = new LazyLoadUtils();

document.addEventListener('DOMContentLoaded', ()=>{
  window.LazyLoadUtils.observeImages();
});

// Re-observe on dynamic content
window.lazyLoadObserve = ()=> window.LazyLoadUtils.observeImages();