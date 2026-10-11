// LOCATION: server/routes/common/cart.routes.js - CART API - WORLD CLASS - COOKIE BASED - NO LOCALSTORAGE
const express = require('express');
const router = express.Router();
const Cart = require('../../models/Cart');
const crypto = require('crypto');

// Guest pehchan - localStorage nahi, httpOnly cookie
function getUserKey(req, res){
  let key = req.cookies?.saman_guest;
  if(!key){
    key = 'guest_' + crypto.randomBytes(16).toString('hex');
    res.cookie('saman_guest', key, { httpOnly:true, maxAge: 30*24*60*60*1000, sameSite:'lax' });
  }
  if(req.user?._id) key = 'user_' + req.user._id;
  return key;
}
function parseCookies(req,res,next){
  req.cookies = {};
  (req.headers.cookie||'').split(';').forEach(c=>{ const [k,...v]=c.trim().split('='); if(k) req.cookies[k]=decodeURIComponent(v.join('=')); });
  next();
}
router.use(parseCookies);

async function getCart(userKey, shopId){
  let cart = await Cart.findOne({ userKey, shopId });
  if(!cart) cart = await Cart.create({ userKey, shopId, items: [] });
  return cart;
}
const sendCart = (res, cart) => res.json({ success:true, cart:{ shopId:cart.shopId, items:cart.items, total:cart.total, itemCount:cart.itemCount } });

// GET /api/common/cart/:shopId
router.get('/:shopId', async (req,res)=>{
  try{ const cart = await getCart(getUserKey(req,res), req.params.shopId); sendCart(res, cart); }
  catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

// POST /api/common/cart/:shopId/add {productId,name,price,mrp,image,unit,shopType,qty}
router.post('/:shopId/add', async (req,res)=>{
  try{
    const { productId, name, price, mrp=0, image='', unit='', shopType='', qty=1 } = req.body;
    if(!productId ||!name || price==null) return res.status(400).json({ success:false, message:'productId, name, price required' });
    const cart = await getCart(getUserKey(req,res), req.params.shopId);
    cart.shopType = shopType || cart.shopType;
    const ex = cart.items.find(i=> i.productId === String(productId));
    if(ex) ex.qty += Number(qty); else cart.items.push({ productId:String(productId), name, price:Number(price), mrp:Number(mrp), image, unit, shopType, qty:Number(qty) });
    await cart.save(); sendCart(res, cart);
  }catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

// POST /api/common/cart/:shopId/update {productId, qty}
router.post('/:shopId/update', async (req,res)=>{
  try{
    const { productId, qty } = req.body;
    const cart = await getCart(getUserKey(req,res), req.params.shopId);
    if(Number(qty) <= 0) cart.items = cart.items.filter(i=> i.productId!== String(productId));
    else { const it = cart.items.find(i=> i.productId === String(productId)); if(it) it.qty = Number(qty); }
    await cart.save(); sendCart(res, cart);
  }catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

// POST /api/common/cart/:shopId/remove {productId}
router.post('/:shopId/remove', async (req,res)=>{
  try{
    const cart = await getCart(getUserKey(req,res), req.params.shopId);
    cart.items = cart.items.filter(i=> i.productId!== String(req.body.productId));
    await cart.save(); sendCart(res, cart);
  }catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

// POST /api/common/cart/:shopId/clear
router.post('/:shopId/clear', async (req,res)=>{
  try{
    const cart = await getCart(getUserKey(req,res), req.params.shopId);
    cart.items = []; await cart.save(); sendCart(res, cart);
  }catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;