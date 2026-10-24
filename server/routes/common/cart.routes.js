// LOCATION: server/routes/common/cart.routes.js - CART API V3 WORLD CLASS - COOKIE BASED + BUYER-ID HEADER - NO LOCALSTORAGE - FULL 250+ LINES
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Try to load Cart model, fallback to inline schema if not exists
let Cart;
try {
  Cart = require('../../models/Cart');
} catch (e) {
  console.log('⚠️ Cart model not found at ../../models/Cart, creating inline model');
  const mongoose = require('mongoose');
  const CartSchema = new mongoose.Schema({
    userKey: { type: String, required: true, index: true },
    shopId: { type: String, required: true, index: true },
    supplierId: String,
    buyerId: String,
    buyerRole: { type: String, default: 'customer' },
    buyerShopId: String,
    shopType: String,
    items: [{
      productId: String,
      _id: String,
      name: String,
      title: String,
      price: Number,
      mrp: Number,
      image: String,
      unit: String,
      qty: { type: Number, default: 1 },
      quantity: Number,
      shopId: String,
      ownerId: String,
      ownerRole: String,
      shopName: String,
      variant: String
    }],
    total: { type: Number, default: 0 },
    itemCount: { type: Number, default: 0 },
    totalAmount: Number
  }, { timestamps: true });
  CartSchema.index({ userKey: 1, shopId: 1 }, { unique: true });
  try {
    Cart = mongoose.model('Cart', CartSchema);
  } catch (err) {
    Cart = mongoose.model('Cart');
  }
}

// ---------- Guest Pehchan - WORLD CLASS - 3 layers ----------
// Layer 1: x-buyer-id header (CartCore V3 main) - sessionStorage guest_id + RoleHierarchy.getMyId()
// Layer 2: req.user._id (logged user)
// Layer 3: httpOnly cookie saman_guest (old compat + backup)
function getUserKey(req, res) {
  let key = null;

  // 1. Header - V3 MAIN - CartCore V3 bhejta hai
  if (req.headers['x-buyer-id']) key = req.headers['x-buyer-id'];
  // 2. Body / Query - fallback
  if (!key && req.body?.buyerId) key = req.body.buyerId;
  if (!key && req.query?.buyerId) key = req.query.buyerId;
  // 3. Logged user
  if (req.user?._id) {
    key = 'user_' + req.user._id;
  }
  // 4. Cookie - old compat
  if (!key) {
    key = req.cookies?.saman_guest;
    if (!key) {
      key = 'guest_' + crypto.randomBytes(16).toString('hex');
      try {
        res.cookie('saman_guest', key, { 
          httpOnly: true, 
          maxAge: 30 * 24 * 60 * 60 * 1000, 
          sameSite: 'lax',
          path: '/'
        });
      } catch (e) {}
    }
  }

  // Normalize: ensure prefix
  if (key && !key.startsWith('guest_') && !key.startsWith('user_')) {
    // If it's a plain mongo _id, treat as user_
    if (key.length === 24 || key.includes('_')) {
      // keep as is if already guest_xxx
      if (!key.startsWith('guest_')) key = 'guest_' + key;
    } else {
      key = 'guest_' + key;
    }
  }

  return key;
}

// Cookie parser - no need cookie-parser lib
function parseCookies(req, res, next) {
  req.cookies = {};
  try {
    const cookieHeader = req.headers.cookie || '';
    cookieHeader.split(';').forEach(c => {
      const parts = c.trim().split('=');
      const k = parts[0]?.trim();
      if (!k) return;
      const v = parts.slice(1).join('=');
      req.cookies[k] = decodeURIComponent(v || '');
    });
  } catch (e) {}
  next();
}
router.use(parseCookies);

// ---------- Helpers ----------
async function getCart(userKey, shopId) {
  if (!shopId) throw new Error('shopId required');
  let cart = await Cart.findOne({ userKey, shopId });
  if (!cart) {
    cart = await Cart.create({ userKey, shopId, items: [], total: 0, itemCount: 0 });
  }
  return cart;
}

function calcTotals(items) {
  const total = (items || []).reduce((s, i) => s + (Number(i.price || 0) * Number(i.qty || i.quantity || 1)), 0);
  const itemCount = (items || []).reduce((s, i) => s + Number(i.qty || i.quantity || 1), 0);
  return { total, itemCount, totalAmount: total };
}

const sendCart = (res, cart) => {
  const { total, itemCount } = calcTotals(cart.items);
  res.json({ 
    success: true, 
    cart: { 
      shopId: cart.shopId, 
      supplierId: cart.shopId, 
      items: cart.items, 
      total, 
      totalAmount: total, 
      itemCount,
      buyerId: cart.buyerId,
      buyerRole: cart.buyerRole
    },
    // For CartCore V3 compat - carts map
    carts: { [cart.shopId]: cart.items }
  });
};

const sendAllCarts = async (res, userKey) => {
  const carts = await Cart.find({ userKey });
  const map = {};
  let allItems = [];
  carts.forEach(c => {
    map[c.shopId] = c.items;
    allItems = allItems.concat(c.items || []);
  });
  const { total, itemCount } = calcTotals(allItems);
  res.json({ 
    success: true, 
    carts: map, 
    cart: { items: allItems, total, totalAmount: total, itemCount },
    total, totalAmount: total, itemCount
  });
};

// ================= V3 SYNC APIS - CartCore V3 USES THESE - MAIN =================

// POST /api/common/cart/sync {buyerId, buyerRole, buyerShopId, supplierId, shopId, items}
// This is the main API used by cart-core.js V3
router.post('/sync', async (req, res) => {
  try {
    const { buyerId, buyerRole, buyerShopId, supplierId, shopId, items, shopType } = req.body;
    const sid = supplierId || shopId;
    if (!sid) return res.status(400).json({ success: false, message: 'supplierId/shopId required' });
    
    const userKey = getUserKey(req, res);
    let cart = await Cart.findOne({ userKey, shopId: sid });
    if (!cart) cart = new Cart({ userKey, shopId: sid });
    
    cart.items = Array.isArray(items) ? items : [];
    cart.buyerId = buyerId || userKey;
    cart.buyerRole = buyerRole || 'customer';
    cart.buyerShopId = buyerShopId || '';
    cart.supplierId = sid;
    cart.shopType = shopType || cart.shopType || '';
    
    const { total, itemCount } = calcTotals(cart.items);
    cart.total = total;
    cart.itemCount = itemCount;
    cart.totalAmount = total;
    
    await cart.save();
    sendCart(res, cart);
  } catch (e) {
    console.error('Cart sync error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/common/cart?buyerId=xxx - V3 restore - CartCore V3 uses this
router.get('/', async (req, res) => {
  try {
    const userKey = getUserKey(req, res);
    return await sendAllCarts(res, userKey);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/common/cart/clear {buyerId, supplierId, shopId} - V3 clear
router.post('/clear', async (req, res) => {
  try {
    const userKey = getUserKey(req, res);
    const sid = req.body.supplierId || req.body.shopId;
    if (sid) {
      await Cart.deleteOne({ userKey, shopId: sid });
    } else {
      await Cart.deleteMany({ userKey });
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ================= OLD SHOPID APIS - Backward compat - Your old code =================

// GET /api/common/cart/:shopId
router.get('/:shopId', async (req, res) => {
  try {
    const cart = await getCart(getUserKey(req, res), req.params.shopId);
    sendCart(res, cart);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/common/cart/:shopId/add {productId,name,price,mrp,image,unit,shopType,qty, ownerId, ownerRole, shopName}
router.post('/:shopId/add', async (req, res) => {
  try {
    const { productId, name, title, price, mrp = 0, image = '', unit = '', shopType = '', qty = 1, ownerId, ownerRole, shopName, variant } = req.body;
    if (!productId || (!name && !title) || price == null) {
      return res.status(400).json({ success: false, message: 'productId, name/title, price required' });
    }
    const cart = await getCart(getUserKey(req, res), req.params.shopId);
    cart.shopType = shopType || cart.shopType;
    cart.supplierId = req.params.shopId;
    
    const ex = cart.items.find(i => String(i.productId) === String(productId));
    if (ex) {
      ex.qty = Number(ex.qty || ex.quantity || 0) + Number(qty);
      ex.quantity = ex.qty;
    } else {
      cart.items.push({ 
        productId: String(productId), 
        name: name || title, 
        title: title || name,
        price: Number(price), 
        mrp: Number(mrp), 
        image, 
        unit, 
        shopType, 
        qty: Number(qty),
        quantity: Number(qty),
        shopId: req.params.shopId,
        ownerId: ownerId || req.params.shopId,
        ownerRole: ownerRole || 'shop_owner',
        shopName: shopName || '',
        variant: variant || ''
      });
    }
    const { total, itemCount } = calcTotals(cart.items);
    cart.total = total;
    cart.itemCount = itemCount;
    await cart.save();
    sendCart(res, cart);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/common/cart/:shopId/update {productId, qty}
router.post('/:shopId/update', async (req, res) => {
  try {
    const { productId, qty } = req.body;
    const cart = await getCart(getUserKey(req, res), req.params.shopId);
    if (Number(qty) <= 0) {
      cart.items = cart.items.filter(i => String(i.productId) !== String(productId));
    } else {
      const it = cart.items.find(i => String(i.productId) === String(productId));
      if (it) {
        it.qty = Number(qty);
        it.quantity = Number(qty);
      }
    }
    const { total, itemCount } = calcTotals(cart.items);
    cart.total = total;
    cart.itemCount = itemCount;
    await cart.save();
    sendCart(res, cart);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/common/cart/:shopId/remove {productId}
router.post('/:shopId/remove', async (req, res) => {
  try {
    const cart = await getCart(getUserKey(req, res), req.params.shopId);
    cart.items = cart.items.filter(i => String(i.productId) !== String(req.body.productId));
    const { total, itemCount } = calcTotals(cart.items);
    cart.total = total;
    cart.itemCount = itemCount;
    await cart.save();
    sendCart(res, cart);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/common/cart/:shopId/clear
router.post('/:shopId/clear', async (req, res) => {
  try {
    const cart = await getCart(getUserKey(req, res), req.params.shopId);
    cart.items = [];
    cart.total = 0;
    cart.itemCount = 0;
    await cart.save();
    sendCart(res, cart);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;