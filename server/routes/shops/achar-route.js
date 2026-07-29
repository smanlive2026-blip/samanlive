const express = require('express');
const router = express.Router();
const Achar = require('../../models/shops/Achar');
const Shop = require('../../models/Shop');
const { getShopId } = require('../../utils/shopId'); // NUCLEAR FIX
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
        transformation: [{ width: 800, height: 800, crop: 'limit' }]
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

// 2. GET PURI SHOP DATA
router.get('/:shopId', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const shop = await Shop.findById(shopId).lean();
    if(!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    let achar = await Achar.findOne({ shopId: shopId });
    if(!achar) achar = await Achar.create({ shopId: shopId, items: [] });

    const normalizedItems = (achar.items || []).map(item => ({
   ...item,
      image: item.image || item.img || '',
      id: item.id
    }));

    const finalData = {
      shopId: shop._id,
      name: shop.name || 'Achar Shop',
      items: normalizedItems,
      orders: achar.orders || [],
      settings: achar.settings || {},
      isOpen: achar.settings?.isOpen?? true,
      announcement: achar.settings?.announcement || '',
      ownerPhotoUrl: achar.settings?.ownerPhotoUrl || '',
      bannerPhotoUrl: achar.settings?.bannerPhotoUrl || '',
      phone: achar.phone || ''
    }
    res.json({ success: true, shop: finalData });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// 3. GET SINGLE ITEM
router.get('/item/:id', async (req, res) => {
    try {
        const shopId = getShopId(req);
        const achar = await Achar.findOne({ shopId });
        const product = achar.items.find(i => i.id === req.params.id);
        if(!product) return res.status(404).json({ success: false, message: 'Achar nahi mila' });
        res.json({ success: true, product });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// 4. ADD NEW ACHAR ITEM - QUICK ADD YAHI MAREGA
router.post('/:shopId/item', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const itemData = req.body.item || req.body;

    if(!itemData.name) return res.status(400).json({ success: false, message: 'Product name is required' });

    const newItem = {
   ...itemData,
      id: itemData.id || Date.now().toString(),
      price: Number(itemData.price1kg), // auto sync
      image: itemData.image || itemData.img || '',
      img: itemData.image || itemData.img || '',
      createdAt: new Date()
    };

    let achar = await Achar.findOne({ shopId: shopId });
    if(!achar) achar = await Achar.create({ shopId: shopId, items: [newItem] });
    else { achar.items.push(newItem); await achar.save(); }

    res.status(201).json({ success: true, message: 'Achar add ho gaya', data: newItem });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// 5. UPDATE ACHAR ITEM
router.put('/:shopId/item/:itemId', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const itemData = req.body.item || req.body;
    if(itemData.price1kg!== undefined) itemData.price = itemData.price1kg;
    itemData.image = itemData.image || itemData.img || '';
    itemData.img = itemData.image || itemData.img || '';

    await Achar.findOneAndUpdate(
      { shopId: shopId, 'items.id': req.params.itemId },
      { $set: { 'items.$': itemData } },
      { new: true }
    );
    res.json({ success: true, message: 'Update ho gaya' });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// 6. DELETE ACHAR ITEM
router.delete('/:shopId/item/:itemId', async (req, res) => {
  try {
    const shopId = getShopId(req);
    await Achar.findOneAndUpdate({ shopId: shopId }, { $pull: { items: { id: req.params.itemId } } });
    res.json({ success: true, message: 'Delete ho gaya' });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// 7. UPDATE SHOP SETTINGS
router.put('/:shopId', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const updateData = req.body;
    let achar = await Achar.findOne({ shopId: shopId });
    if(!achar) achar = await Achar.create({ shopId: shopId });

    if(updateData.bannerPhotoUrl) achar.bannerPhotoUrl = updateData.bannerPhotoUrl;
    if(updateData.ownerPhotoUrl) achar.ownerPhotoUrl = updateData.ownerPhotoUrl;
    if('phone' in updateData) achar.phone = updateData.phone;
    if('isOpen' in updateData) achar.settings.isOpen = updateData.isOpen;
    if('announcement' in updateData) achar.settings.announcement = updateData.announcement;
    if(updateData.settings) achar.settings = {...achar.settings,...updateData.settings };

    await achar.save();
    res.json({ success: true, data: achar });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
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