// public/shop-templates/shop-core.js
// bhai iss file ko hath nhi lgana h ye golden rule h samjha na
// NOTE: Photo Local + Cloudinary dono. Har photo ka alag storage key
// CHANGED: Added auto compress + DB save + SAFETY CHECK

const browserImageCompression = window.imageCompression; // CHANGED: CDN se aayega

const ShopCore = {
    shopId: null,
    template: null,

    init(shopId, template) {
        this.shopId = shopId;
        this.template = template;
        console.log("SHOPCORE INIT:", shopId, template);
    },

    // ===== CLOUDINARY UPLOAD VIA BACKEND =====
    async uploadImage(file, type = 'profile') {
        if(!file) return null;
        if(!this.shopId ||!this.template){
            alert('Shop ID ya Template missing hai. Page reload karo');
            return null;
        }

        const loader = document.getElementById('uploadLoader');
        if(loader) loader.style.display = 'inline';

        // CHANGED: STEP 1 - IMAGE COMPRESS KARO 10MB ko 50KB - WITH SAFETY
        let compressedFile = file;
        if(browserImageCompression){ // SAFETY CHECK: CDN mila ya nahi
            try{
                compressedFile = await browserImageCompression(file, {
                    maxSizeMB: 0.6, // 600KB target
                    maxWidthOrHeight: 800,
                    useWebWorker: true
                });
                console.log(`COMPRESSED: ${file.size/1024}KB -> ${compressedFile.size/1024}KB`);
            }catch(err){
                console.error("Compress failed, original bhej rahe", err);
            }
        } else {
            console.warn("Compression lib nahi mili, original file bhej rahe");
        }

        const formData = new FormData();
        formData.append('image', compressedFile); // CHANGED: file ki jagah compressedFile
        formData.append('shopId', String(this.shopId));
        formData.append('template', String(this.template));
        formData.append('type', String(type)); // profile, banner, product, offer

        try {
            console.log("UPLOADING:", {shopId: this.shopId, template: this.template, type});
            const res = await fetch('/api/upload/shop', { method: 'POST', body: formData });
            const data = await res.json();
            console.log("RESPONSE:", data);

            if(data.success && data.url){
                return data.url;
            } else {
                alert('Upload Failed: ' + (data.error || data.message || 'Server Error'));
                return null;
            }
        } catch(err) {
            console.error("UPLOAD ERROR:", err);
            alert('Upload Failed! Server/Internet check karo: ' + err.message);
            return null;
        } finally {
            if(loader) loader.style.display = 'none';
        }
    },

    // ===== GENERIC BIND FUNCTION - SABKE LIYE EK HI =====
    bindImageUpload(imgId, inputId, type, storageKey) {
        const img = document.getElementById(imgId);
        const input = document.getElementById(inputId);
        if(!img ||!input) {
            console.warn(`Element not found: ${imgId} or ${inputId}`);
            return;
        }

        const cloudKey = `photo_${this.shopId}_${storageKey}_cloud`;
        const localKey = `photo_${this.shopId}_${storageKey}`;
        const defaultSrc = img.src; // pehle se jo img hai use backup

        // 1. PAGE LOAD PE PHOTO LOAD KARO - PEHLE CLOUD, NA MILE TO LOCAL
        // CHANGED: Ab DB se bhi load karenge, isliye dashboard.js se call hoga
        const savedCloud = localStorage.getItem(cloudKey);
        const savedLocal = localStorage.getItem(localKey);
        img.src = savedCloud || savedLocal || defaultSrc;

        // 2. CLICK PE FILE PICKER
        img.onclick = () => input.click();

        // 3. FILE SELECT HOTE HI UPLOAD
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if(!file) return;

            // A. TURANT LOCAL PREVIEW - LAPTOP KE LIYE FAST
            const reader = new FileReader();
            reader.onload = (ev) => {
                img.src = ev.target.result;
                localStorage.setItem(localKey, ev.target.result); // BACKUP
            }
            reader.readAsDataURL(file);

            // B. SAATH ME CLOUDINARY PE BHEJ DO - MOBILE KE LIYE
            const url = await this.uploadImage(file, type);
            if(url){
                img.src = url; // CLOUD WALI SE REPLACE
                localStorage.setItem(cloudKey, url); // CLOUD URL SAVE

                // CHANGED: STEP 2 - DB ME BHI SAVE KARO TAKEY HAR DEVICE PE DIKHE
                try{
                    await fetch(`/api/shops/${this.shopId}`, { // note: /shops/ hai
                        method: 'PUT', // tere route me PUT hai
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ ownerPhotoUrl: url })
                    });
                    console.log(`DB ME SAVE HO GAYA [${type}]:`, url);
                }catch(err){
                    console.error("DB Save failed", err);
                }
            }
        }
    }
}

// ==========================================================
// ===== NEW ADDED: BANDWIDTH SAVER - COMMON MODULE LOADER ==
// ===== Iske upar ka code bilkul touch nahi kiya ===========
// ===== Ye common wale sab ek sath load na ho iske liye ===
// ==========================================================
(function() {
    const PAGE = document.body.dataset.page || 'customer';
    console.log("[ShopCore] Bandwidth Saver Active, Page:", PAGE);

    // Helper: script ko tabhi load karo jab jarurat ho
    function loadScript(path) {
        return new Promise((resolve, reject) => {
            // Already loaded check
            if (document.querySelector(`script[src*="${path}"]`)) {
                resolve();
                return;
            }
            const s = document.createElement('script');
            s.src = path;
            s.async = true;
            s.onload = resolve;
            s.onerror = reject;
            document.body.appendChild(s);
        });
    }

    async function initCommonLoader() {
        // Base path - common ka path auto-detect
        const basePath = '/shop-templates/common';

        // 1. Halke wale - sab page pe chahiye
        // Note: lazy-load aur currency formatter halke hai
        try {
            await loadScript(`${basePath}/utils/lazy-load.js`);
        } catch(e) {}

        // 2. PAGE ke hisab se load karo - sab ek sath nahi
        if (PAGE === 'customer') {
            // Customer ko sirf count chahiye, pura cart nahi
            await loadScript(`${basePath}/cart/cart-count.js`);
            // Wishlist bhi lazy
            if (document.querySelector('.wishlist-btn, #wishlist')) {
                await loadScript(`${basePath}/wishlist/wishlist.js`);
            }
        }

        if (PAGE === 'cart') {
            await loadScript(`${basePath}/cart/cart-core.js`);
        }

        if (PAGE === 'checkout') {
            await loadScript(`${basePath}/cart/cart-core.js`);
            await loadScript(`${basePath}/checkout/checkout.js`);
        }

        if (PAGE === 'dashboard') {
            await loadScript(`${basePath}/core/dashboard-core.js`);
            await loadScript(`${basePath}/orders/orders.js`);
        }

        // 3. On-demand functions - button dabane pe hi load hoga
        window.loadShareModule = () => loadScript(`${basePath}/share/whatsapp-share.js`);
        window.loadQrModule = () => loadScript(`${basePath}/share/qr-share.js`);
        window.loadChatbot = () => loadScript(`${basePath}/ai/chatbot.js`);

        console.log("[ShopCore] Common modules loaded conditionally for:", PAGE);
    }

    // Page load ke baad chalao
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCommonLoader);
    } else {
        initCommonLoader();
    }
})();