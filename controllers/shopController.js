const Shop = require('../models/Shop');
const User = require('../models/User');
const Area = require('../models/Area');

exports.getAllShops = async (req, res) => {
    try {
        const { category, status, search } = req.query;
        let filter = {};

        if (category) filter.category = category;
        if (status) filter.status = status;
        if (search) filter.shopName = { $regex: search, $options: 'i' };

        const shops = await Shop.find(filter)
           .populate('area', 'name')
           .populate('createdBy', 'name')
           .sort({ createdAt: -1 });

        const result = shops.map(shop => ({
           ...shop._doc,
            areaName: shop.area?.name,
            createdByName: shop.createdBy?.name
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

exports.getMyShops = async (req, res) => {
    try {
        const shops = await Shop.find({ createdBy: req.user._id }).populate('area', 'name');
        res.json(shops);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

exports.getShopById = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id).populate('area', 'name');
        if (!shop) return res.status(404).json({ msg: 'Shop not found' });
        res.json(shop);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

exports.createShop = async (req, res) => {
    try {
        const { shopName, ownerName, mobile, category, area, status } = req.body;

        const newShop = new Shop({
            shopName,
            ownerName,
            mobile,
            category,
            shopType: category, // category hi shopType hai
            area,
            status: status || 'pending',
            createdBy: req.user._id // <-- Yahi rule tha tera
        });

        await newShop.save();
        res.status(201).json(newShop);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

exports.updateShop = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ msg: 'Shop not found' });

        // Check: Sirf owner ya admin hi update kar sakta hai
        if (shop.createdBy.toString()!== req.user._id && req.user.role!== 'admin') {
            return res.status(403).json({ msg: 'Not allowed' });
        }

        const updated = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

exports.deleteShop = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ msg: 'Shop not found' });

        // Check: Sirf owner ya admin hi delete kar sakta hai
        if (shop.createdBy.toString()!== req.user._id && req.user.role!== 'admin') {
            return res.status(403).json({ msg: 'Not allowed' });
        }

        await Shop.findByIdAndDelete(req.params.id);
        // Yaha product bhi delete karne ka code lagega baad me
        res.json({ msg: 'Shop deleted' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};