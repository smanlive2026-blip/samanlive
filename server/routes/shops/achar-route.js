const express = require('express');
const router = express.Router();
const Achar = require('../../models/shops/Achar');
const Shop = require('../../models/Shop');
const { getShopId } = require('../../utils/shopId');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// ========================================
// CLOUDINARY CONFIG
// ========================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// MULTER STORAGE FOR ACHAR IMAGES
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'achar-shop/products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    }
});
const upload = multer({ storage: storage });

// ========================================
// ACHAR ROUTES - /api/shops/achar
// ========================================

// 1. UPLOAD IMAGE
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if(!req.file) return res.status(400).json({ success: false, message: 'Image nahi mili' });
        res.json({ success: true, url: req.file.path, message: 'Upload ho gaya' });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// 1.5 GET LOCATION
router.get('/:shopId/location', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const achar = await Achar.findOne({ shopId }).lean();
    if(!achar) return res.json({ success: true, data: null });

    res.json({
      success: true,
      data: {
        locationType: achar.locationType,
        deliveryRange: achar.deliveryRange,
        address: achar.shopAddress,
        lat: achar.location?.coordinates[1] || '',
        lng: achar.location?.coordinates[0] || ''
      }
    });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// 1.6 SAVE LOCATION
router.post('/:shopId/location', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const { lat, lng, type, range, address } = req.body;

    let achar = await Achar.findOne({ shopId });
    if(!achar) achar = await Achar.create({ shopId });

    achar.locationType = type;
    achar.deliveryRange = Number(range);
    achar.shopAddress = address;
    if(lat && lng) {
        achar.location = { type: 'Point', coordinates: [Number(lng), Number(lat)] };
    }

    await achar.save();
    res.json({ success: true, message: 'Location saved' });

  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// 1.7 GET PROFILE
router.get('/:shopId/profile', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const achar = await Achar.findOne({ shopId }).lean();
    if(!achar) return res.json({ success: true, data: null });

    res.json({
      success: true,
      data: {
        ownerName: achar.ownerName,
        ownerPhotoUrl: achar.ownerPhotoUrl,
        bannerPhotoUrl: achar.bannerPhotoUrl,
        fullAddress: achar.fullAddress,
        shopAddress: achar.shopAddress,
        lat: achar.location?.coordinates[1] || '',
        lng: achar.location?.coordinates[0] || ''
      }
    });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// 1.8 SAVE PROFILE
router.post('/:shopId/profile', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const { ownerName, ownerPhotoUrl, bannerPhotoUrl, fullAddress, lat, lng, shopAddress } = req.body;

    let achar = await Achar.findOne({ shopId });
    if(!achar) achar = await Achar.create({ shopId });

    if(ownerName) achar.ownerName = ownerName;
    if(fullAddress) achar.fullAddress = fullAddress;
    if(shopAddress) achar.shopAddress = shopAddress;
    if(ownerPhotoUrl) achar.ownerPhotoUrl = ownerPhotoUrl;
    if(bannerPhotoUrl) achar.bannerPhotoUrl = bannerPhotoUrl;
    if(lat && lng) {
        achar.location = { type: 'Point', coordinates: [Number(lng), Number(lat)] };
    }

    await achar.save();
    res.json({ success: true, message: 'Profile saved' });

  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// 2. GET PURI SHOP DATA - FIXED
router.get('/:shopId', async (req, res) => {
  try {
    const shopId = getShopId(req);
    if(!shopId || shopId.length < 20) return res.status(400).json({ success: false, message: 'Invalid ShopId' });

    const shop = await Shop.findById(shopId).lean();
    if(!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    let achar = await Achar.findOne({ shopId: shopId });
    if(!achar) achar = await Achar.create({ shopId: shopId, items: [] });

    const normalizedItems = (achar.items || []).map(item => {
        const obj = item.toObject? item.toObject() : item;
        return {
           ...obj,
            image: obj.image || obj.img || 'https://placehold.co/400/eab308/fff?text=Achar', // <-- YE LINE
            category: obj.category || 'Other',
            id: obj.id
        }
    });

    const finalData = {
      shopId: shop._id,
      name: shop.name || 'Achar Shop',
      items: normalizedItems,
      orders: achar.orders || [],
      settings: achar.settings || {},
      isOpen: achar.settings?.isOpen?? true,
      announcement: achar.settings?.announcement || achar.announcement || '',
      ownerPhotoUrl: achar.settings?.ownerPhotoUrl || achar.ownerPhotoUrl || '',
      bannerPhotoUrl: achar.settings?.bannerPhotoUrl || achar.bannerPhotoUrl || '', 
      updatedAt: achar.updatedAt, // <-- YE NAYI LINE ADD KAR
      phone: achar.phone || ''
    }

    res.json({ success: true, shop: finalData });
  } catch(err) {
    console.log('GET SHOP ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GET SINGLE ITEM
router.get('/:shopId/item/:id', async (req, res) => {
    try {
        const shopId = getShopId(req);
        const achar = await Achar.findOne({ shopId });
        if(!achar) return res.status(404).json({ success: false, message: 'Shop nahi mila' });
        const product = achar.items.find(i => i.id === req.params.id);
        if(!product) return res.status(404).json({ success: false, message: 'Achar nahi mila' });
        res.json({ success: true, product });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// 4. ADD NEW ACHAR ITEM
router.post('/:shopId/item', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const itemData = req.body.item || req.body;

    const newItem = {
      id: Date.now().toString(),
      name: itemData.name,
      category: itemData.category || 'Other',
      description: itemData.description || '',
      jarType: itemData.jarType || 'Glass',
      spiceLevel: itemData.spiceLevel || 'Medium',
      price500: Number(itemData.price500),
      price1kg: Number(itemData.price1kg),
      price: Number(itemData.price1kg),
      stock: Number(itemData.stock),
      image: itemData.image || 'https://placehold.co/400/eab308/fff?text=Achar',
      img: itemData.image || '',
      isActive: true,
      createdAt: new Date()
    };

    let achar = await Achar.findOne({ shopId: shopId });
    if(!achar) achar = await Achar.create({ shopId: shopId, items: [newItem] });
    else { achar.items.push(newItem); await achar.save(); }

    res.status(201).json({ success: true, message: 'Achar add ho gaya', data: newItem });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// 5. UPDATE ACHAR ITEM - FIELD BY FIELD
router.put('/:shopId/item/:itemId', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const itemData = req.body.item || req.body;

    const result = await Achar.findOneAndUpdate(
      { shopId: shopId, 'items.id': req.params.itemId },
      {
        $set: {
          'items.$.name': itemData.name,
          'items.$.category': itemData.category,
          'items.$.description': itemData.description,
          'items.$.jarType': itemData.jarType,
          'items.$.spiceLevel': itemData.spiceLevel,
          'items.$.price500': Number(itemData.price500),
          'items.$.price1kg': Number(itemData.price1kg),
          'items.$.price': Number(itemData.price1kg),
          'items.$.stock': Number(itemData.stock),
          'items.$.image': itemData.image, // <-- YE LINE SABSE IMPORTANT
          'items.$.img': itemData.image
        }
      },
      { new: true }
    );
    if(!result) return res.status(404).json({ success: false, message: 'Item nahi mila' });
    res.json({ success: true, message: 'Update ho gaya' });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// 6. DELETE ACHAR ITEM
router.delete('/:shopId/item/:itemId', async (req, res) => {
  try {
    const shopId = getShopId(req);
    await Achar.findOneAndUpdate({ shopId: shopId }, { $pull: { items: { id: req.params.itemId }}});
    res.json({ success: true, message: 'Delete ho gaya' });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// 7. UPDATE SHOP SETTINGS - TOGGLE FIX
// 7. UPDATE SHOP SETTINGS - PROFILE FIX
router.put('/:shopId', async (req, res) => {
  try {
    const shopId = getShopId(req);
    if(!shopId || shopId.length < 20) return res.status(400).json({ success: false, message: 'Invalid ShopId' });
    const updateData = req.body;
    let achar = await Achar.findOne({ shopId: shopId });
    if(!achar) achar = await Achar.create({ shopId: shopId });

    // YE 5 LINE NAYI ADD KI HAI
    if(updateData.ownerName) achar.ownerName = updateData.ownerName;
    if(updateData.fullAddress) achar.fullAddress = updateData.fullAddress;
    if(updateData.shopAddress) achar.shopAddress = updateData.shopAddress;
    if(updateData.bannerPhotoUrl) achar.bannerPhotoUrl = updateData.bannerPhotoUrl;
    if(updateData.ownerPhotoUrl) achar.ownerPhotoUrl = updateData.ownerPhotoUrl;
    if('phone' in updateData) achar.phone = updateData.phone;

    if(!achar.settings) achar.settings = {};
    if('isOpen' in updateData) {
        achar.settings.isOpen = updateData.isOpen;
        achar.isOpen = updateData.isOpen; 
    }
    if('announcement' in updateData) achar.settings.announcement = updateData.announcement;
    if(updateData.settings) achar.settings = {...achar.settings,...updateData.settings };

    await achar.save();
    res.json({ success: true, data: achar });
  } catch(err) {
    console.log('UPDATE SHOP ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. GET ORDERS
router.get('/:shopId/orders', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const achar = await Achar.findOne({ shopId: shopId }).lean();
    if(!achar) return res.json({ success: true, data: [] });
    res.json({ success: true, data: (achar.orders || []).reverse() });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// 9. POST NEW ORDER
router.post('/:shopId/order', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const orderData = req.body;
    const trackingId = 'ACH' + Date.now().toString().slice(-8);
    const newOrder = {...orderData, trackingId, status: 'pending', createdAt: new Date() };
    await Achar.findOneAndUpdate({ shopId: shopId }, { $push: { orders: newOrder } }, { new: true, upsert: true });
    res.json({ success: true, trackingId });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;