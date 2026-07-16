// public/shop-templates/shop-core.js

const ShopCore = {
    shopId: null,
    template: null,

    init(shopId, template) {
        this.shopId = shopId;
        this.template = template;
        this.loadSavedPhoto(); // PAGE LOAD PE PHOTO LOAD KAREGA
    },

    // CLOUDINARY UPLOAD
    async uploadImage(file, type = 'profile') {
        if(!file) return null;
        const loader = document.getElementById('uploadLoader');
        if(loader) loader.style.display = 'inline';

        const formData = new FormData();
        formData.append('image', file);
        formData.append('shopId', this.shopId);
        formData.append('template', this.template);
        formData.append('type', type);

        try {
            const res = await fetch('/api/upload/shop', { method: 'POST', body: formData });
            const data = await res.json();
            return data.success? data.url : null;
        } catch(err) {
            alert('Upload Failed: ' + err.message);
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
            }
        }
    },

    // LOAD SAVED PHOTO - PEHLE CLOUD WALI DEKHEGA, NA MILE TO LOCAL WALI
    loadSavedPhoto() {
        const cloudPhoto = localStorage.getItem('ownerPhoto_'+this.shopId+'_cloud');
        const localPhoto = localStorage.getItem('ownerPhoto_'+this.shopId);

        const img = document.getElementById('ownerPhoto');
        if(img){
            img.src = cloudPhoto || localPhoto || 'https://ui-avatars.com/api/?name=Owner&background=22c55e&color=fff&size=128';
        }
    }
}