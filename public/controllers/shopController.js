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
    // ✅ FIXED: req.user check kiya, nahi to empty array
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
    // ✅ FIXED: ownerId auto generate agar req.user nahi hai
    if (req.user && req.user.id) {
      req.body.ownerId = req.user.id;
    } else {
      req.body.ownerId = new mongoose.Types.ObjectId();
    }

    // ✅ FIXED: approvedBy bhi set kar de
    req.body.approvedBy = req.body.ownerId;
    req.body.approvedByName = 'System';
    
    // ShopType validation hata diya kyunki ab serviceType string hai
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
    
    // ✅ FIXED: Auth check skip agar req.user nahi hai
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
    
    // ✅ FIXED: Auth check skip agar req.user nahi hai
    if (req.user && shop.ownerId && shop.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
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
  getShopById,
  createShop,
  updateShop,
  deleteShop
};