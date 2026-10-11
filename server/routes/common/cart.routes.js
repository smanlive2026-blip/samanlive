// LOCATION: server/routes/common/cart.routes.js - SERVER CART API
const express = require('express');
const router = express.Router();
const Cart = require('../../models/Cart');

async function getOrCreate(shopId, userId){
  let cart = await Cart.findOne({ shopId, userId });
  if(!cart) cart = await Cart.create({ shopId, userId, items: [], total: 0, count: 0 });
  return cart;
}
function sendCart(res, cart){
  return res.json({ success: true, cart: { shopId: cart.shopId, userId: cart.userId, items: cart.items, total: cart.total, count: cart.count } });
}

// GET /api/common/cart/:shopId?userId=xxx
router.get('/:shopId', async (req, res) => {
  try {
    const userId = req.query.userId || req.user?._id || 'guest';
    const cart = await getOrCreate(req.params.shopId, String(userId));
    cart.recalc(); await cart.save();
    sendCart(res, cart);
  } catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

// POST /api/common/cart/:shopId/add {product, qty, userId}
router.post('/:shopId/add', async (req, res) => {
  try {
    const { product, qty = 1, userId = 'guest' } = req.body || {};
    if(!product ||!(product.productId || product._id)) return res.status(400).json({ success:false, message:'Product missing' });
    const cart = await getOrCreate(req.params.shopId, String(userId));
    const pid = String(product.productId || product._id);
    const old = cart.items.find(i => i.productId === pid);
    if(old) old.qty += qty;
    else cart.items.push({ productId: pid, name: product.name||'', price: product.price||0, mrp: product.mrp||product.price||0, thumbnail: product.thumbnail||product.image||'', image: product.image||product.thumbnail||'', unit: product.unit||'', qty });
    cart.recalc(); await cart.save();
    sendCart(res, cart);
  } catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

// POST /api/common/cart/:shopId/update {productId, qty, userId}
router.post('/:shopId/update', async (req, res) => {
  try {
    const { productId, qty, userId = 'guest' } = req.body || {};
    const cart = await getOrCreate(req.params.shopId, String(userId));
    const it = cart.items.find(i => i.productId === String(productId));
    if(it) it.qty = qty;
    cart.items = cart.items.filter(i => i.qty > 0);
    cart.recalc(); await cart.save();
    sendCart(res, cart);
  } catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

// POST /api/common/cart/:shopId/remove {productId, userId}
router.post('/:shopId/remove', async (req, res) => {
  try {
    const { productId, userId = 'guest' } = req.body || {};
    const cart = await getOrCreate(req.params.shopId, String(userId));
    cart.items = cart.items.filter(i => i.productId!== String(productId));
    cart.recalc(); await cart.save();
    sendCart(res, cart);
  } catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;