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
    const userId = req.user? req.user.id : null;
    if (!userId) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    const shops = await Shop.find({ 
      $or: [
        { ownerId: userId },
        { createdBy: userId }
      ]
    });
    
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

// @desc    Get public shops by location - ✅ FIXED: Logo included + status fix
const getPublicShops = async (req, res) => {
  try {
    const { lat, lng, radius = 5000, shopType, categoryId, serviceType } = req.query;

    // ✅ Base query: approved aur active dono status wali shops
    let query = {
      status: { $in: ['approved', 'active'] }, // ✅ Purani shops bhi dikhegi
      isActive: true
    };

    // ✅ Geo query: lat/lng valid ho tabhi lagao
    if (lat && lng &&!isNaN(parseFloat(lat)) &&!isNaN(parseFloat(lng))) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)] // LNG pehle, LAT baad me
          },
          $maxDistance: parseInt(radius) || 5000
        }
      };
    }

    // Filters
    if (shopType) query.shopType = shopType;
    if (categoryId) query.categoryId = categoryId;
    if (serviceType) query.serviceType = serviceType;

    console.log('Public Shops Query:', JSON.stringify(query)); // Debug ke liye

    const shops = await Shop.find(query)
     .select('-ownerId -approvedBy -rejectionReason -email')
     .limit(50)
     .sort({ priority: -1, rating: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: shops.length,
      data: shops
    });
  } catch (error) {
    console.error('Get public shops error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// @desc    Get single shop by ID - ✅ Logo ensure
const getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
     .populate('ownerId', 'name email phone')
     .lean();
    
    if (!shop) {
      return res.status(404).json({ 
        success: false, 
        message: 'Shop not found' 
      });
    }

    // ✅ Ensure logo field exists
    if (!shop.logo) shop.logo = '';
    
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

// @desc    Create new shop - ✅ Logo support
const createShop = async (req, res) => {
  try {
    if (req.user && req.user.id) {
      req.body.ownerId = req.user.id;
    } else {
      req.body.ownerId = new mongoose.Types.ObjectId();
    }

    req.body.approvedBy = req.body.ownerId;
    req.body.approvedByName = 'System';
    
    // ✅ Ensure logo field
    if (req.body.logo === undefined) req.body.logo = '';
    
    // ✅ Ensure location is properly formatted
    if (req.body.location && req.body.location.coordinates) {
      req.body.location = {
        type: 'Point',
        coordinates: [
          parseFloat(req.body.location.coordinates[0]), // lng
          parseFloat(req.body.location.coordinates[1]) // lat
        ]
      };
    }
    
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

// @desc    Update shop - ✅ Logo support
const updateShop = async (req, res) => {
  try {
    let shop = await Shop.findById(req.params.id);
    
    if (!shop) {
      return res.status(404).json({ 
        success: false, 
        message: 'Shop not found' 
      });
    }
    
    if (req.user && shop.ownerId && shop.ownerId.toString()!== req.user.id && req.user.role!== 'admin') {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to update this shop' 
      });
    }
    
    // ✅ Ensure location is properly formatted on update
    if (req.body.location && req.body.location.coordinates) {
      req.body.location = {
        type: 'Point',
        coordinates: [
          parseFloat(req.body.location.coordinates[0]), // lng
          parseFloat(req.body.location.coordinates[1]) // lat
        ]
      };
    }

    // ✅ Logo update support
    if (req.body.logo!== undefined) {
      req.body.logo = req.body.logo;
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
    
    if (req.user && shop.ownerId.toString()!== req.user.id && req.user.role!== 'admin') {
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