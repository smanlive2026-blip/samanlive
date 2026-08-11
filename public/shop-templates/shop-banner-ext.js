// /public/shop-templates/shop-banner-ext.js
// ye golden rule h  
// SABHI SHOPS KE LIYE BANNER + LOGO FETCHER

window.ShopBannerExt = {

    // HD IMAGE FUNCTION
    getHDImage: function(url, width = 800) {
        if(!url || url.includes('placehold')) return url;
        return url.replace('/upload/', `/upload/q_auto:best,f_auto,w_${width}/`);
    },

    // KISI BHI SHOP KA DATA LE AAO - TEMPLATE KE HISAB SE
    getShopData: async function(shopId, template) {
        try {
            if(!shopId ||!template) return null;

            const res = await fetch(`/api/shops/${template}/${shopId}`);
            const data = await res.json();

            if(!data.success) return null;

            let shop = data.shop || data.data || {};

            // Cache todne ke liye timestamp
            let bannerUrl = shop.bannerPhotoUrl || '';
            if(bannerUrl && bannerUrl.includes('cloudinary')) {
                bannerUrl = bannerUrl.split('?')[0] + `?v=${shop.updatedAt || Date.now()}`;
            }

            let logoUrl = shop.ownerPhotoUrl || '';
            if(logoUrl && logoUrl.includes('cloudinary')) {
                logoUrl = logoUrl.split('?')[0] + `?v=${shop.updatedAt || Date.now()}`;
            }

            return {
                shopId: shop.shopId,
                shopName: shop.ownerName? `${shop.ownerName} ki Dukaan` : shop.name,
                banner: this.getHDImage(bannerUrl, 1400),
                logo: this.getHDImage(logoUrl, 200),
                updatedAt: shop.updatedAt
            };

        } catch(e) {
            console.log('ShopBannerExt Error:', e);
            return null;
        }
    },

    // MAIN APP KE LIYE: SAARI SHOPS KE BANNER EK SAATH
    loadBannersForMainApp: async function(shopArray) {
        await Promise.all(shopArray.map(async (shop) => {
            try {
                const data = await this.getShopData(shop._id, shop.template);
                if(data) {
                    shop.banner = data.banner;
                    shop.logo = data.logo || shop.logo;
                    shop.shopName = data.shopName || shop.shopName;
                }
            } catch(e) { console.log('Banner load fail', shop._id) }
        }));
        return shopArray;
    }
}