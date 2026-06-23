const Shop = require('../models/Shop');
const User = require('../models/User');
const ShopType = require('../models/ShopType');

// @desc    Get all shops - Admin only
const getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find({})
      .populate('owner', 'name email')
      .populate('shopType', 'name');
    
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
    const shops = await Shop.find({ owner: req.user.id })
      .populate('shopType', 'name');
    
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
      .populate('owner', 'name email phone')
      .populate('shopType', 'name description');
    
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
    req.body.owner = req.user.id;
    
    if (req.body.shopType) {
      const shopTypeExists = await ShopType.findById(req.body.shopType);
      if (!shopTypeExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid shop type'
        });
      }
    }
    
    const shop = await Shop.create(req.body);
    await shop.populate('shopType', 'name');
    
    res.status(201).json({
      success: true,
      data: shop
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Shop creation failed', 
      error: error.message 
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
    
    if (shop.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to update this shop' 
      });
    }
    
    shop = await Shop.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('shopType', 'name');
    
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
    
    if (shop.owner.toString() !== req.user.id && req.user.role !== 'admin') {
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