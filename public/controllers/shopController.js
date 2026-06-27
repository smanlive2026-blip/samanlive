const Shop = require('../models/Shop');
const User = require('../models/User');
const ShopType = require('../models/ShopType');
const mongoose = require('mongoose');

// @desc Get all shops - Admin only
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

// @desc Get logged in user's shops
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

// @desc Get public shops by location - ✅ FIXED: Proper Range + LocationType Filter
const getPublicShops = async (req, res) => {
  try {
    const { lat, lng, radius = 10000, shopType, categoryId, serviceType } = req.query;

    // Validation
    if (!lat ||!lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
      return res.status(400).json({
        success: false,
        message: 'Valid lat and lng required'
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxRadius = parseInt(radius) || 10000; // 10km max search

    // Step 1: Broad area me sab shops nikalo
    let query = {
      status: { $in: ['approved', 'active'] },
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [userLng, userLat]
          },
          $maxDistance: maxRadius
        }
      }
    };

    // Filters
    if (shopType) query.shopType = shopType;
    if (categoryId) query.categoryId = categoryId;
    if (serviceType) query.serviceType = serviceType;

    console.log('🔍 Searching within', maxRadius, 'meters from', userLat, userLng);

    const shops = await Shop.find(query)
   .select('-ownerId -approvedBy -rejectionReason -email')
   .limit(100)
   .lean();

    // Step 2: Har shop ka distance nikal ke uske range se check karo
    const filteredShops = shops.filter(shop => {
      if (!shop.location?.coordinates || shop.location.coordinates.length!== 2) {
        return false;
      }

      const [shopLng, shopLat] = shop.location.coordinates;

      // Haversine - meters me
      const R = 6371e3;
      const φ1 = userLat * Math.PI / 180;
      const φ2 = shopLat * Math.PI / 180;
      const Δφ = (shopLat - userLat) * Math.PI / 180;
      const Δλ = (shopLng - userLng) * Math.PI / 180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distanceMeters = R * c;

      // ✅ Main Fix: Shop ke apne range se compare
      // Fixed shop: default 5000m agar range nahi hai
      const shopRange = shop.range || 5000;
      const isInRange = distanceMeters <= shopRange;

      // Distance add kar do response me
      shop.distance = Math.round(distanceMeters);
      shop.distanceKm = (distanceMeters / 1000).toFixed(2);

      if (isInRange) {
        console.log(`✅ ${shop.shopName} [${shop.locationType}]: ${shop.distance}m <= ${shopRange}m`);
      }

      return isInRange;
    });

    // Distance ke hisaab se sort
    filteredShops.sort((a, b) => a.distance - b.distance);

    console.log(`✅ Returning ${filteredShops.length} shops out of ${shops.length}`);

    res.status(200).json({
      success: true,
      count: filteredShops.length,
      userLocation: { lat: userLat, lng: userLng },
      data: filteredShops
    });

  } catch (error) {
    console.error('❌ Get public shops error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc Get single shop by ID - ✅ Logo ensure
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

// @desc Create new shop - ✅ Logo + LocationType support
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

    // ✅ Ensure locationType - default fixed
    if (!req.body.locationType) req.body.locationType = 'fixed';

    // ✅ Ensure range - default 5000m for fixed shops
    if (!req.body.range) req.body.range = 5000;

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

    // ✅ Set lastLocationUpdate for dynamic shops
    if (req.body.locationType === 'dynamic') {
      req.body.lastLocationUpdate = new Date();
    }

    const shop = await Shop.create(req.body);

    console.log(`✅ Shop created: ${shop.shopName} [${shop.locationType}] Range: ${shop.range}m`);

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

// @desc Update shop - ✅ Logo + Range support
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

    // ✅ Range update - Only Admin/Area Manager can increase above 5000
    if (req.body.range!== undefined) {
      const userRole = req.user?.role || 'user';
      const newRange = parseInt(req.body.range);

      // ✅ ADMIN/AREA MANAGER CHECK: Yahi pe logic daalna
      if (userRole!== 'admin' && userRole!== 'area_manager' && newRange > 5000) {
        return res.status(403).json({
          success: false,
          message: 'Only Admin/Area Manager can set range above 5KM'
        });
      }

      req.body.range = newRange;
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

// @desc Delete shop
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

// @desc Update shop location for dynamic shops - ✅ NEW
const updateShopLocation = async (req, res) => {
  try {
    const { coordinates } = req.body; // [lng, lat]

    if (!coordinates || coordinates.length!== 2) {
      return res.status(400).json({ error: 'coordinates [lng, lat] required' });
    }

    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    // Verify owner
    const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
    if (!isOwner && req.user.role!== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only update if dynamic
    if (shop.locationType!== 'dynamic') {
      return res.status(400).json({ error: 'Shop is not dynamic type' });
    }

    shop.location = {
      type: 'Point',
      coordinates: [parseFloat(coordinates[0]), parseFloat(coordinates[1])]
    };
    shop.lastLocationUpdate = new Date();

    await shop.save();

    console.log(`📍 Dynamic shop ${shop.shopName} updated:`, coordinates);
    res.json({
      success: true,
      message: 'Location updated',
      location: shop.location,
      updatedAt: shop.lastLocationUpdate
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllShops,
  getMyShops,
  getPublicShops,
  getShopById,
  createShop,
  updateShop,
  deleteShop,
  updateShopLocation // ✅ Add this
};