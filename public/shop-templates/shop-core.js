// public/shop-templates/shop-core.js
// NOTE: Photo local + Cloudinary dono support.

const ShopCore = {
    shopId: null,
    template: null,

    init(shopId, template) {
        this.shopId = shopId;
        this.template = template;
        console.log("SHOPCORE INIT:", shopId, template); // DEBUG
        this.loadSavedPhoto(); // PAGE LOAD PE PHOTO LOAD KAREGA
    },

    // CLOUDINARY UPLOAD VIA BACKEND
    async uploadImage(file, type = 'profile') {
        if(!file) return null;
        if(!this.shopId ||!this.template){
            alert('Shop ID ya Template missing hai. Page reload karo');
            return null;
        }
        
        const loader = document.getElementById('uploadLoader');
        if(loader) loader.style.display = 'inline';

        const formData = new FormData();
        formData.append('image', file); 
        formData.append('shopId', String(this.shopId)); // STRING ME BHEJ
        formData.append('template', String(this.template)); // STRING ME BHEJ
        formData.append('type', String(type)); // STRING ME BHEJ

        try {
            console.log("UPLOADING TO: /api/upload/shop", {shopId: this.shopId, template: this.template, type}); // DEBUG
            const res = await fetch('/api/upload/shop', { method: 'POST', body: formData });

            console.log("RESPONSE STATUS:", res.status); // DEBUG
            const data = await res.json();
            console.log("RESPONSE DATA:", data); // DEBUG

            if(data.success && data.url){
                return data.url;
            } else {
                alert('Upload Failed: ' + (data.error || data.message || 'Server Error'));
                return null;
            }
        } catch(err) {
            console.error("UPLOAD CATCH ERROR:", err); // DEBUG
            alert('Upload Failed! Server/Internet check karo: ' + err.message);
            return null;
        } finally {
            if(loader) loader.style.display = 'none';
        }
    },

    // OWNER PHOTO BIND - LOCAL + CLOUDINARY DONO
    bindOwnerPhotoUpload(photoImgId, photoInputId) {
        const img = document.getElementById(photoImgId);
        const input = document.getElementById(photoInputId);
        if(!img ||!input) return;

        img.onclick = () => input.click();
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if(!file) return;

            // 1. TURANT LOCAL ME DIKHADO - LAPTOP KE LIYE
            const reader = new FileReader();
            reader.onload = (ev) => {
                img.src = ev.target.result;
                localStorage.setItem('ownerPhoto_'+this.shopId, ev.target.result); // BACKUP
            }
            reader.readAsDataURL(file);

            // 2. SAATH ME CLOUDINARY PE BHEJ DO - MOBILE KE LIYE
            const url = await this.uploadImage(file, 'profile');
            if(url){
                img.src = url; // CLOUDINARY WALI URL SE REPLACE KAR DE
                localStorage.setItem('ownerPhoto_'+this.shopId+'_cloud', url); // CLOUD URL SAVE
                console.log("CLOUD URL SAVED:", url);
            }
        }
    },

    // LOAD SAVED PHOTO - PEHLE CLOUD WALI DEKHEGA, NA MILE TO LOCAL WALI
    loadSavedPhoto() {
        if(!this.shopId) return; // shopId na ho to mat chal
        const cloudPhoto = localStorage.getItem('ownerPhoto_'+this.shopId+'_cloud');
        const localPhoto = localStorage.getItem('ownerPhoto_'+this.shopId);

        const img = document.getElementById('ownerPhoto');
        if(img){
            img.src = cloudPhoto || localPhoto || 'https://ui-avatars.com/api/?name=Owner&background=22c55e&color=fff&size=128';
        }
    }
}