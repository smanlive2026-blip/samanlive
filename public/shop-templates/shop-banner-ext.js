// public/shop-templates/shop-banner-ext.js
// LOCATION: shop-core.js ko override karke naya API use karvayega

(function(){
    if(typeof ShopCore === 'undefined') { console.error("ShopCore not found"); return; }

    const originalUpload = ShopCore.uploadImage;

    // LOCATION: OVERRIDE UPLOAD - ab /api/media pe jayega
    ShopCore.uploadImage = async function(file, type = 'profile', refId = null) {
        if(!file) return null;
        if(!this.shopId ||!this.template){
            alert('Shop ID ya Template missing hai. Page reload karo');
            return null;
        }

        const loader = document.getElementById('uploadLoader');
        if(loader) loader.style.display = 'inline';

        const formData = new FormData();
        formData.append('image', file); // compression hata diya, middleware karega
        formData.append('shopId', String(this.shopId));
        formData.append('template', String(this.template));
        formData.append('type', String(type)); // 'banner', 'logo', 'product'
        if(refId) formData.append('refId', String(refId));

        try {
            // LOCATION: NAYA API HIT
            const res = await fetch('/api/media/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if(data.success && data.url){
                return data.url; // cloud url return
            } else {
                alert('Upload Failed: ' + (data.error || 'Server Error'));
                return null;
            }
        } catch(err) {
            alert('Upload Failed! ' + err.message);
            return null;
        } finally {
            if(loader) loader.style.display = 'none';
        }
    }

    // LOCATION: HELPER - KISI BHI JAGAH BANNER DIKHANE KE LIYE
    window.loadAndShowBanner = async function(shopId, imgElementId) {
        const img = document.getElementById(imgElementId);
        if(!img) return;
        try {
            const res = await fetch(`/api/media/${shopId}`);
            const data = await res.json();
            const banner = data.data.find(m => m.type === 'banner');
            img.src = banner?.url || '/assets/default-banner.jpg';
        } catch(e) { console.log(e) }
    }

    console.log('✅ Banner Extension Loaded - Media API');
})();