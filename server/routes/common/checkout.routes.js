// LOCATION: server/routes/common/checkout.routes.js - CHECKOUT API - WORLD CLASS - NO LOCALSTORAGE - ORDER + SOCKET LIVE - MY ORDERS ADDED
const express = require('express');
const router = express.Router();
const Cart = require('../../models/Cart');
const Order = require('../../models/Order');
const crypto = require('crypto');

function parseCookies(req,res,next){
  req.cookies = {};
  (req.headers.cookie||'').split(';').forEach(c=>{ const [k,...v]=c.trim().split('='); if(k) req.cookies[k]=decodeURIComponent(v.join('=')); });
  next();
}
router.use(parseCookies);

function getUserKey(req){
  if(req.user?._id) return 'user_' + req.user._id;
  return req.cookies?.saman_guest || null;
}

// GET /api/common/checkout/orders/my - mere orders list - :shopId wali route se PEHLE rakhna zaroori hai warna Express 'orders' ko shopId samajh lega
router.get('/orders/my', async (req,res)=>{
  try{
    const userKey = getUserKey(req);
    if(!userKey) return res.status(401).json({ success:false, message:'Login required' });
    const q = { userKey: String(userKey) };
    if(req.query.shopId) q.shopId = String(req.query.shopId);
    const orders = await Order.find(q).sort({ createdAt:-1 }).limit(50).lean();
    res.json({ success:true, orders });
  }catch(e){
    console.error('My orders error:', e);
    res.status(500).json({ success:false, message:e.message });
  }
});

// POST /api/common/checkout/:shopId/place
// Body: { address:{name,phone,line1,line2,city,state,pincode}, paymentMethod:'cod'|'upi' }
router.post('/:shopId/place', async (req,res)=>{
  try{
    const shopId = req.params.shopId;
    const userKey = getUserKey(req);
    if(!userKey) return res.status(400).json({ success:false, message:'Cart session not found. Pehle cart me item add karo.' });

    const cart = await Cart.findOne({ userKey, shopId });
    if(!cart ||!cart.items.length) return res.status(400).json({ success:false, message:'Cart empty' });

    const { address, paymentMethod='cod' } = req.body || {};
    if(!address?.name ||!address?.phone ||!address?.line1 ||!address?.city ||!address?.pincode){
      return res.status(400).json({ success:false, message:'Full address required: name, phone, line1, city, pincode' });
    }

    const total = cart.items.reduce((s,i)=> s + (i.price * i.qty), 0);
    const orderId = 'SL' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();

    const order = await Order.create({
      orderId,
      userId: userKey,
      userKey,
      shopId,
      shopType: cart.shopType || '',
      items: cart.items.map(i=>({ productId:i.productId, name:i.name, price:i.price, quantity:i.qty, qty:i.qty, image:i.image })),
      totalAmount: total,
      total: total,
      deliveryAddress: {
        name: address.name, phone: address.phone,
        line1: address.line1, line2: address.line2 || '',
        city: address.city, state: address.state || '', pincode: address.pincode
      },
      paymentMethod,
      paymentStatus: paymentMethod === 'cod'? 'pending' : 'pending',
      orderStatus: 'placed'
    });

    // Order ban gaya, cart khali karo
    cart.items = [];
    await cart.save();

    // Dukaan ke dashboard pe live ghanti bajao
    try{
      if(global.io) global.io.to(`shop:${shopId}`).emit('new-order', { orderId: order.orderId, shopId, total, itemCount: order.items.length });
    }catch(e){}

    res.json({ success:true, orderId: order.orderId, order: { orderId: order.orderId, total, totalAmount: total }, total });
  }catch(e){
    console.error('Checkout place error:', e);
    res.status(500).json({ success:false, message:e.message });
  }
});

// GET /api/common/checkout/:shopId/summary - checkout page pe cart dikhane ke liye
router.get('/:shopId/summary', async (req,res)=>{
  try{
    const userKey = getUserKey(req);
    if(!userKey) return res.json({ success:true, cart:{ items:[], total:0, itemCount:0 } });
    const cart = await Cart.findOne({ userKey, shopId: req.params.shopId });
    if(!cart) return res.json({ success:true, cart:{ items:[], total:0, itemCount:0 } });
    res.json({ success:true, cart:{ shopId:cart.shopId, items:cart.items, total:cart.total, itemCount:cart.itemCount } });
  }catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;