// public/shop-templates/shop-core.js

const ShopCore = {
    shopId: null,
    template: null,

    // INIT - har dashboard.js me ye call karna hai
    init(shopId, template) {
        this.shopId = shopId;
        this.template = template;
        this.loadSavedData();
    },

    // CLOUDINARY UPLOAD - Profile, Product, Banner sab ke liye
    async uploadImage(file, type = 'profile') {
        if(!file) return null;

        const formData = new FormData();
        formData.append('image', file);
        formData.append('shopId', this.shopId);
        formData.append('template', this.template);
        formData.append('type', type); // profile, product, banner

        try {
            const res = await fetch('/api/upload/shop', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if(data.success){
                return data.url; // cloudinary url
            } else {
                throw new Error(data.message);
            }
        } catch(err) {
            alert('Upload Failed: ' + err.message);
            return null;
        }
    },

    // OWNER PHOTO UPLOAD BIND KARNA
    bindOwnerPhotoUpload(photoImgId, photoInputId) {
        const img = document.getElementById(photoImgId);
        const input = document.getElementById(photoInputId);

        if(!img ||!input) return;

        img.onclick = () => input.click();

        input.onchange = async (e) => {
            const file = e.target.files[0];
            const url = await this.uploadImage(file, 'profile');
            if(url){
                img.src = url;
                this.saveToDB({ ownerPhoto: url });
                localStorage.setItem('ownerPhoto_'+this.shopId, url);
            }
        }
    },

    // DB ME SAVE KARNA
    async saveToDB(updateData) {
        try {
            await fetch(`/api/shop/${this.shopId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(updateData)
            });
        } catch(err){
            console.error('DB Save Error', err);
        }
    },

    // LOAD SAVED PHOTO
    loadSavedData() {
        const savedPhoto = localStorage.getItem('ownerPhoto_'+this.shopId);
        if(savedPhoto) {
            const img = document.getElementById('ownerPhoto');
            if(img) img.src = savedPhoto;
        }
    }
}