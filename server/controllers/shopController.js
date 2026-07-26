const path = require('path');
const fs = require('fs');
const Shop = require('../models/Shop');

exports.getShopUserView = async (req, res) => {
    try {
        const { shopId } = req.params;
        const shop = await Shop.findById(shopId);
        
        if(!shop) return res.status(404).send("Shop not found");
        
        // 1. PEHLE template dekho. NAHI HAI TO serviceType se lo. USKE BAAD general
        const template = shop.template || shop.serviceType || 'general'; 
        
        const templatePath = path.join(__dirname, '../../public/shop-templates', template);

        // YEH 3 NAAM CHECK KAREGA
        const possibleFiles = ['customer-view.html', 'user-view.html', 'shop-view.html'];
        let viewFile = null;

        for(let file of possibleFiles) {
            const filePath = path.join(templatePath, file);
            if(fs.existsSync(filePath)) {
                viewFile = filePath;
                break;
            }
        }

        // agar template me nahi mila to general wala
        if(!viewFile) {
            console.log(`⚠️ ${template} folder not found. Using general`);
            viewFile = path.join(__dirname, '../../public/shop-templates/general/user-view.html');
        }
        
        console.log(`✅ Serving: ${shop.shopName} | Template: ${template}`);
        res.sendFile(viewFile);

    } catch(err) {
        console.error(err);
        res.status(500).send(err.message);
    }
}