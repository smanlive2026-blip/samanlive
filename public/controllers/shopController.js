const Shop = require('../models/Shop');
const User = require('../models/User');
const ShopType = require('../models/ShopType');
const mongoose = require('mongoose');

// @desc    Get all shops - Admin only
const getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find({})
      .populate('ownerId', 'name email')
      .populate('serviceType');
    
    res.status(200).json({
      success: true,
      count: shops.length,
      data: shops
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// @desc    Get logged in user's shops
const getMyShops = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    if (!userId) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    const shops = await Shop.find({ ownerId: userId });
    
    res.status(200).json({
      success: true,
      count: shops.length,
      data: shops
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// @desc    Get public shops by location - UPDATED
const getPublicShops = async (req, res) => {
  try {
    const { lat, lng, radius = 5000, shopType, categoryId, serviceType } = req.query;

    let query = {};

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      };
    }

    if (shopType) query.shopType = shopType;
    if (categoryId) query.categoryId = categoryId;
    if (serviceType) query.serviceType = serviceType;

    const shops = await Shop.find(query)
      .select('-ownerId -approvedBy -rejectionReason')
      .limit(50)
      .sort({ priority: -1, rating: -1 });

    res.status(200).json({
      success: true,
      count: shops.length,
      data: shops
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// @desc    Get single shop by ID
const getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
      .populate('ownerId', 'name email phone');
    
    if (!shop) {
      return res.status(404).json({ 
        success: false, 
        message: 'Shop not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: shop
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// @desc    Create new shop
const createShop = async (req, res) => {
  try {
    if (req.user && req.user.id) {
      req.body.ownerId = req.user.id;
    } else {
      req.body.ownerId = new mongoose.Types.ObjectId();
    }

    req.body.approvedBy = req.body.ownerId;
    req.body.approvedByName = 'System';
    
    const shop = await Shop.create(req.body);
    
    res.status(201).json({
      success: true,
      data: shop
    });
  } catch (error) {
    console.error('Shop creation error:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Shop creation failed', 
      error: error.message,
      details: error.errors 
    });
  }
};

// @desc    Update shop
const updateShop = async (req, res) => {
  try {
    let shop = await Shop.findById(req.params.id);
    
    if (!shop) {
      return res.status(404).json({ 
        success: false, 
        message: 'Shop not found' 
      });
    }
    
    if (req.user && shop.ownerId && shop.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to update this shop' 
      });
    }
    
    shop = await Shop.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: shop
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Update failed', 
      error: error.message 
    });
  }
};

// @desc    Delete shop
const deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    
    if (!shop) {
      return res.status(404).json({ 
        success: false, 
        message: 'Shop not found' 
      });
    }
    
    if (req.user && shop.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to delete this shop' 
      });
    }
    
    await shop.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Shop deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllShops,
  getMyShops,
  getPublicShops,
  getShopById,
  createShop,
  updateShop,
  deleteShop
};