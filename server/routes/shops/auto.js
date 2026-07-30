const express = require('express');
const router = express.Router();
const Auto = require('../../models/shops/Auto');
const Shop = require('../../models/Shop');
const { getShopId } = require('../../utils/shopId');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: { folder: 'auto-parts', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] }
});
const upload = multer({ storage: storage });

router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if(!req.file) return res.status(400).json({ success: false, message: 'Image nahi mili' });
        res.json({ success: true, url: req.file.path });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.get('/:shopId', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const shop = await Shop.findById(shopId).lean();
    if(!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    let auto = await Auto.findOne({ shopId: shopId });
    if(!auto) auto = await Auto.create({ shopId: shopId, parts: [], serviceJobs: [] });

    const stats = {
        vehicles: auto.serviceJobs.filter(s => s.status!== 'delivered').length,
        service: auto.serviceJobs.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString()).length,
        parts: auto.parts.length,
        revenue: auto.serviceJobs.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString()).reduce((sum, s) => sum + (s.totalAmount || 0), 0)
    };

    const lowStock = auto.parts.filter(p => p.stock < p.lowStockLimit);

    res.json({
        success: true,
        shop: {
            shopId: shop._id,
            shopName: shop.name,
            parts: auto.parts,
            serviceJobs: auto.serviceJobs.reverse(),
            services: auto.services,
            stats,
            lowStock,
            settings: auto.settings
        }
    });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:shopId/item', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const itemData = req.body.item;
    const newItem = {...itemData, id: Date.now().toString(), createdAt: new Date() };
    let auto = await Auto.findOne({ shopId });
    if(!auto) auto = await Auto.create({ shopId, parts: [newItem] });
    else { auto.parts.push(newItem); await auto.save(); }
    res.status(201).json({ success: true, data: newItem });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/:shopId/item/:itemId', async (req, res) => {
  try {
    const shopId = getShopId(req);
    await Auto.findOneAndUpdate({ shopId, 'parts.id': req.params.itemId }, { $set: { 'parts.$': {...req.body.item, id: req.params.itemId } } });
    res.json({ success: true });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/:shopId/item/:itemId', async (req, res) => {
  try {
    const shopId = getShopId(req);
    await Auto.findOneAndUpdate({ shopId }, { $pull: { parts: { id: req.params.itemId }}});
    res.json({ success: true });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:shopId/item/:id', async (req, res) => {
    try {
        const shopId = getShopId(req);
        const auto = await Auto.findOne({ shopId });
        const product = auto.parts.find(i => i.id === req.params.id);
        res.json({ success: true, product });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/:shopId/service/:jobId', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const { status } = req.body;
    await Auto.findOneAndUpdate({ shopId, 'serviceJobs._id': req.params.jobId }, { $set: { 'serviceJobs.$.status': status, 'serviceJobs.$.deliveredAt': status==='delivered'? new Date() : null } });
    res.json({ success: true });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:shopId/service', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const newJob = {...req.body, _id: Date.now().toString(), createdAt: new Date() };
    await Auto.findOneAndUpdate({ shopId }, { $push: { serviceJobs: newJob } }, { upsert: true });
    res.json({ success: true, data: newJob });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;