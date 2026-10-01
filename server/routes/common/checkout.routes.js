// LOCATION: server/routes/common/checkout.routes.js
const express = require('express');
const router = express.Router();

let Order;
try{ Order = require('../../models/Order'); }catch(e){ Order=null; }

const ordersMemory = [];

router.post('/:shopId/place', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { items, total, addressId, paymentMethod='cod', userId } = req.body;
    const orderId = 'ORD' + Date.now() + Math.random().toString(36).slice(2,5).toUpperCase();

    const order = {
      orderId, shopId, items: items||[], total: total||0, addressId, paymentMethod, userId: userId||'guest',
      status:'placed', paymentStatus: paymentMethod==='cod'? 'pending' : 'paid',
      createdAt: new Date()
    };

    if(Order){
      const dbOrder = await Order.create({...order, shop: shopId });
      return res.json({ success:true, orderId: dbOrder.orderId || orderId, order: dbOrder });
    }

    ordersMemory.push(order);
    res.json({ success:true, orderId, order });
  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

router.post('/:shopId/create-razorpay-order', (req,res)=>{
  res.json({ success:true, orderId:'order_'+Date.now(), key: process.env.RAZORPAY_KEY || 'rzp_test_dummy' });
});

router.post('/:shopId/verify-payment', (req,res)=>{
  res.json({ success:true, orderId:'ORD'+Date.now() });
});

module.exports = router;