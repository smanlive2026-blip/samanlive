// LOCATION: server/routes/common/auth.js
// V7 WORLD CLASS - COMMON AUTH - SEPARATE FOR SHOP-TEMPLATES/COMMON/AUTH
// Ye file sirf common/auth/ ke 2 frontend files (auth-core.js, logout.js) ke liye hai
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Models - safe require
let User, Shop;
try { User = require('../../models/User'); } catch(e){ User = null; }
try { Shop = require('../../models/Shop'); } catch(e){ Shop = null; }

// Middleware - safe require
let authMiddleware;
try { authMiddleware = require('../../middleware/auth'); } catch(e){ authMiddleware = (req,res,next)=> next(); }

const JWT_SECRET = process.env.JWT_SECRET || 'samanlive-secret-v7-2026';

// ========== 1. CHECK AUTH - /api/common/auth/check ==========
// Frontend auth-core.js isko call karta hai
router.get('/check', async (req,res)=>{
  try{
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1] || req.query.token;

    if(!token){
      return res.json({ success:false, authenticated:false, user:null, message:'No token' });
    }

    // Verify JWT
    let decoded;
    try{
      decoded = jwt.verify(token, JWT_SECRET);
    }catch(err){
      return res.json({ success:false, authenticated:false, user:null, message:'Invalid token' });
    }

    // Get user from DB if model exists
    let user = decoded;
    if(User){
      const dbUser = await User.findById(decoded.id || decoded._id).select('-password').lean();
      if(dbUser) user = dbUser;
    }

    res.json({
      success:true,
      authenticated:true,
      user: {
        _id: user._id || user.id,
        id: user._id || user.id,
        name: user.name || user.username || 'Shop Owner',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'shop_owner',
        shopId: user.shopId || user.shop_id || ''
      }
    });

  }catch(e){
    console.error('Common auth check error:', e);
    res.json({ success:false, authenticated:false, user:null, error:e.message });
  }
});

// ========== 2. GET ME - /api/common/auth/me ==========
router.get('/me', async (req,res)=>{
  try{
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if(!token) return res.status(401).json({ success:false, message:'Not logged in' });

    const decoded = jwt.verify(token, JWT_SECRET);
    let user = decoded;
    if(User){
      const dbUser = await User.findById(decoded.id || decoded._id).select('-password').lean();
      if(dbUser) user = dbUser;
    }

    res.json({ success:true, user });
  }catch(e){
    res.status(401).json({ success:false, message:'Auth failed', error:e.message });
  }
});

// ========== 3. VERIFY SHOP OWNER - /api/common/auth/verify/:shopId ==========
// Check if logged in user owns this shop
router.get('/verify/:shopId', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if(!token) return res.json({ success:false, isOwner:false, message:'Not logged in' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id || decoded._id;

    if(!Shop){
      // If Shop model not loaded, allow (dev mode)
      return res.json({ success:true, isOwner:true, message:'Dev mode - Shop model not found, allowing' });
    }

    const shop = await Shop.findOne({ shopId: shopId }).lean() || await Shop.findById(shopId).lean();

    if(!shop) return res.json({ success:false, isOwner:false, message:'Shop not found' });

    const ownerId = shop.owner?.toString() || shop.userId?.toString() || shop.ownerId?.toString() || '';
    const isOwner = ownerId === userId.toString() || shopId === decoded.shopId;

    res.json({
      success:true,
      isOwner,
      shopId,
      userId,
      message: isOwner? 'Owner verified' : 'Not owner'
    });

  }catch(e){
    res.json({ success:false, isOwner:false, error:e.message });
  }
});

// ========== 4. LOGOUT - /api/common/auth/logout ==========
router.post('/logout', (req,res)=>{
  try{
    res.clearCookie('token', {
      httpOnly:true,
      secure: process.env.NODE_ENV === 'production',
      sameSite:'lax',
      path:'/'
    });

    res.json({ success:true, message:'Logged out from common auth' });
  }catch(e){
    res.json({ success:false, message:'Logout failed', error:e.message });
  }
});

// ========== 5. ROLE CHECK - /api/common/auth/role ==========
router.get('/role', async (req,res)=>{
  try{
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if(!token) return res.json({ success:true, role:'guest' });

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success:true, role: decoded.role || 'shop_owner' });
  }catch(e){
    res.json({ success:true, role:'guest' });
  }
});

module.exports = router;