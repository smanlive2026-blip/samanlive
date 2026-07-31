// public/shop-templates/shop-core.js
// bhai iss file ko hath nhi lgana h ye golden rule h samjha na
// NOTE: Photo Local + Cloudinary dono. Har photo ka alag storage key
// CHANGED: 500KB tak compress

const browserImageCompression = window.imageCompression;

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

        // CHANGED: STEP 1 - IMAGE COMPRESS KARO 8MB ko 500KB tak
        let compressedFile = file;
        if(browserImageCompression){
            try{
                compressedFile = await browserImageCompression(file, {
                    maxSizeMB: 0.5, // ✅ 0.5 MB = 500KB target
                    maxWidthOrHeight: 1200, // ✅ thoda bada kar diya taaki quality na gire
                    useWebWorker: true,
                    initialQuality: 0.8 // 80% quality rakhega
                });
                console.log(`COMPRESSED: ${file.size/1024/1024}MB -> ${compressedFile.size/1024}KB`);
            }catch(err){
                console.error("Compress failed, original bhej rahe", err);
            }
        } else {
            console.warn("Compression lib nahi mili, original file bhej rahe");
        }

        const formData = new FormData();
        formData.append('image', compressedFile);
        formData.append('shopId', String(this.shopId));
        formData.append('template', String(this.template));
        formData.append('type', String(type));

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
        const defaultSrc = img.src;

        const savedCloud = localStorage.getItem(cloudKey);
        const savedLocal = localStorage.getItem(localKey);
        img.src = savedCloud || savedLocal || defaultSrc;

        img.onclick = () => input.click();

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if(!file) return;

            // A. TURANT LOCAL PREVIEW
            const reader = new FileReader();
            reader.onload = (ev) => {
                img.src = ev.target.result;
                localStorage.setItem(localKey, ev.target.result);
            }
            reader.readAsDataURL(file);

            // B. SAATH ME CLOUDINARY PE BHEJ DO
            const url = await this.uploadImage(file, type);
            if(url){
                img.src = url;
                localStorage.setItem(cloudKey, url);

                // DB ME BHI SAVE
                try{
                    let body = {};
                    if(type === 'profile') body.ownerPhotoUrl = url;
                    if(type === 'logo') body.logoUrl = url;
                    if(type === 'banner') body.bannerUrl = url;

                    await fetch(`/api/shops/${this.shopId}`, {
                        method: 'PUT',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(body)
                    });
                    console.log(`DB ME SAVE HO GAYA [${type}]:`, url);
                }catch(err){
                    console.error("DB Save failed", err);
                }
            }
        }
    }
}