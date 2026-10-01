const express = require('express');
const router = express.Router();
const Order = require('../../models/Order');

// GET /api/common/orders/:shopId
router.get('/:shopId', async (req,res)=>{
  try{
    const orders = await Order.find({ shopId:req.params.shopId }).sort({ createdAt:-1 }).limit(50);
    res.json({ success:true, orders });
  }catch(e){
    res.json({ success:true, orders:[] });
  }
});

// GET /api/common/orders/:shopId/:orderId
router.get('/:shopId/:orderId', async (req,res)=>{
  try{
    const order = await Order.findOne({ orderId:req.params.orderId, shopId:req.params.shopId });
    res.json({ success:true, order: order || {} });
  }catch(e){
    res.json({ success:true, order:{} });
  }
});

module.exports = router;