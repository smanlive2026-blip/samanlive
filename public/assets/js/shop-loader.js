// public/assets/js/shop-loader.js
const ShopLoader = {

    // SHOP CARD BANAYEGA
    createShopCard: function(shop) {
        const template = (shop.template || shop.shopType || '').toLowerCase().trim();
        
        return `
            <div class="shop-card" onclick="ShopLoader.openShop('${template}', '${shop._id}')">
                <img src="${shop.bannerPhotoUrl || 'https://placehold.co/300x150/92400e/fff'}" alt="${shop.shopName}">
                <div class="shop-info">
                    <h3>${shop.shopName || shop.name}</h3>
                    <p>${shop.shopType} • ${shop.distance ? shop.distance.toFixed(1)+'km' : ''}</p>
                    <span class="${shop.isOpen ? 'open' : 'closed'}">${shop.isOpen ? 'Open' : 'Closed'}</span>
                </div>
            </div>
        `;
    },

    // SAB SHOPS RENDER KAREGA
    renderShops: function(shops, containerId = 'shopsContainer') {
        const container = document.getElementById(containerId);
        if(!container) return;
        if(!shops || !shops.length) {
            container.innerHTML = '<p>Koi shop nahi mili</p>';
            return;
        }
        container.innerHTML = shops.map(shop => this.createShopCard(shop)).join('');
    },

    // SEEDHA TEMPLATE KA VIEW KHULEGA
    openShop: function(template, shopId) {
        // check karega customer-view hai ya user-view
        const userViewTemplates = ['kirana', 'medical', 'restaurant', 'cloth'];
        
        const fileName = userViewTemplates.includes(template) 
            ? 'user-view.html' 
            : 'customer-view.html';
        
        window.location.href = `/shop-templates/${template}/${fileName}?shopId=${shopId}`;
    }
};