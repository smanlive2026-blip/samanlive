// LOCATION: server/routes/common/cart.routes.js - WORLD CLASS CART API
const express = require('express');
const router = express.Router();

// In-memory cart (replace with DB Model later - Shop/Cart model)
const carts = new Map(); // key: shopId_userId -> { items, total, count }

function getCartKey(shopId, userId){ return `${shopId}_${userId||'guest'}`; }
function calc(cart){
  cart.count = cart.items.reduce((s,i)=> s + i.qty, 0);
  cart.total = cart.items.reduce((s,i)=> s + (i.price * i.qty), 0);
  return cart;
}

router.get('/:shopId', (req,res)=>{
  const { shopId } = req.params;
  const userId = req.query.userId || 'guest';
  const key = getCartKey(shopId, userId);
  const cart = carts.get(key) || { items:[], total:0, count:0 };
  res.json({ success:true, cart });
});

router.get('/:shopId/count', (req,res)=>{
  const { shopId } = req.params;
  const userId = req.query.userId || 'guest';
  const key = getCartKey(shopId, userId);
  const cart = carts.get(key) || { items:[], total:0, count:0 };
  res.json({ success:true, count: cart.items.reduce((s,i)=> s+i.qty, 0) });
});

router.post('/:shopId/add', (req,res)=>{
  const { shopId } = req.params;
  const { product, qty=1, productId, userId='guest' } = req.body;
  const key = getCartKey(shopId, userId);
  let cart = carts.get(key) || { items:[], total:0, count:0 };

  const prod = product || { _id: productId, productId, name:'Product', price:100, image:'' };
  const id = prod._id || prod.productId || productId;

  const existing = cart.items.find(i=> (i.productId===id || i._id===id));
  if(existing){
    existing.qty += qty;
  }else{
    cart.items.push({
      productId:id, _id:id,
      name: prod.name || 'Product',
      price: prod.price || 100,
      image: prod.image || prod.img || '',
      qty: qty
    });
  }
  calc(cart);
  carts.set(key, cart);
  res.json({ success:true, cart, count: cart.count });
});

router.post('/:shopId/remove', (req,res)=>{
  const { shopId } = req.params;
  const { productId, userId='guest' } = req.body;
  const key = getCartKey(shopId, userId);
  let cart = carts.get(key) || { items:[], total:0, count:0 };
  cart.items = cart.items.filter(i=> i.productId !== productId && i._id !== productId);
  calc(cart);
  carts.set(key, cart);
  res.json({ success:true, cart });
});

router.post('/:shopId/update', (req,res)=>{
  const { shopId } = req.params;
  const { productId, qty, userId='guest' } = req.body;
  const key = getCartKey(shopId, userId);
  let cart = carts.get(key) || { items:[], total:0, count:0 };
  const item = cart.items.find(i=> i.productId===productId || i._id===productId);
  if(item){ item.qty = qty; if(item.qty<=0) cart.items = cart.items.filter(i=> i!==item); }
  calc(cart);
  carts.set(key, cart);
  res.json({ success:true, cart });
});

router.get('/:shopId/saved', (req,res)=> res.json({ success:true, items:[] }));

module.exports = router;