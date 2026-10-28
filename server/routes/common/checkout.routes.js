// LOCATION: server/routes/common/checkout.routes.js - FULL WORKING - ORDER CREATE + ADDRESS SHOP OWNER TAK
const express = require('express');
const router = express.Router();
const Order = require('../../models/Order');
const User = require('../../models/User');

// Helper buyerId se user nikalna
async function getUserByBuyerId(buyerId){
  if(!buyerId) return null;
  if(buyerId.startsWith('guest_')) return null;
  let id = buyerId;
  if(id.startsWith('user_')) id = id.replace('user_','');
  try{
    if(id.length===24){
      const u = await User.findById(id);
      if(u) return u;
    }
    const phone = id.split('_')[0].replace(/\D/g,'').slice(-10);
    if(phone.length>=10){
      return await User.findOne({ phone });
    }
  }catch(e){}
  return null;
}

// POST /api/common/checkout/:shopId/place - Dairy + All Shops ke liye
router.post('/:shopId/place', async (req,res)=>{
  try{
    const shopId = req.params.shopId;
    const {
      buyerId, buyerRole, buyerShopId,
      items, total, totalAmount, subtotal,
      addressId, addressText, deliveryAddress,
      paymentMethod, paymentMode,
      commissionAmount, isBulkOrder
    } = req.body;

    if(!items || items.length===0){
      return res.status(400).json({ success: false, message: 'Cart khali hai' });
    }

    // User ka pura address nikal lo agar sirf ID aaya hai
    let finalDeliveryAddress = deliveryAddress || {};
    if(!finalDeliveryAddress.full && addressText){
      finalDeliveryAddress.full = addressText;
      finalDeliveryAddress.fullAddress = addressText;
    }
    if(buyerId){
      const user = await getUserByBuyerId(buyerId);
      if(user && addressId){
        const addr = user.addresses.id(addressId) || user.addresses.find(a=>a._id.toString()===addressId);
        if(addr){
          finalDeliveryAddress = {
            name: addr.name || user.name,
            phone: addr.phone || user.phone,
            line1: addr.line1,
            line2: addr.line2,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
            label: addr.label,
            full: `${addr.line1}${addr.line2?', '+addr.line2:''}, ${addr.city}, ${addr.state} - ${addr.pincode}`,
            fullAddress: `${addr.line1}${addr.line2?', '+addr.line2:''}, ${addr.city}, ${addr.state} - ${addr.pincode}`
          };
        }
      } else if(user){
        // default address
        const def = user.addresses.find(a=>a.isDefault) || user.addresses[0];
        if(def){
          finalDeliveryAddress = {
            name: def.name || user.name,
            phone: def.phone || user.phone,
            line1: def.line1,
            line2: def.line2,
            city: def.city,
            state: def.state,
            pincode: def.pincode,
            full: `${def.line1}, ${def.city} - ${def.pincode}`,
            fullAddress: `${def.line1}, ${def.city} - ${def.pincode}`
          };
        }
      }
    }

    const orderId = 'ORD' + Date.now() + Math.floor(Math.random()*1000);

    const order = await Order.create({
      orderId,
      shopId: shopId,
      supplierId: req.body.supplierId || shopId,
      buyerId: buyerId || 'guest',
      buyerRole: buyerRole || 'customer',
      buyerShopId: buyerShopId || '',
      items: items.map(i=>({
        productId: i.productId,
        name: i.name || i.title,
        price: Number(i.price||0),
        qty: Number(i.qty||i.quantity||1),
        quantity: Number(i.qty||i.quantity||1),
        image: i.image || '',
        unit: i.unit || '',
        shopId: i.shopId || shopId
      })),
      totalAmount: Number(totalAmount||total||0),
      total: Number(total||totalAmount||0),
      subtotal: Number(subtotal||total||0),
      commissionAmount: Number(commissionAmount||0),
      addressId: addressId || '',
      addressText: addressText || finalDeliveryAddress.full || '',
      deliveryAddress: finalDeliveryAddress,
      paymentMethod: paymentMethod || paymentMode || 'cod',
      status: 'placed',
      orderStatus: 'placed',
      isBulkOrder: !!isBulkOrder,
      gstInvoiceNeeded: req.body.gstInvoiceNeeded || false,
      gstNumber: req.body.gstNumber || '',
      createdAt: new Date()
    });

    // Socket se shop owner ko live bhejo
    if(global.io){
      global.io.to(`shop:${shopId}`).emit('new-order', order);
      global.io.to(`shop:${order.supplierId}`).emit('new-order', order);
    }

    console.log(`✅ Order placed: ${orderId} Shop: ${shopId} Buyer: ${buyerId} Address: ${finalDeliveryAddress.full||addressText}`);

    res.json({ success: true, orderId: order.orderId, order, message: 'Order placed - Address shop owner ko chala gaya' });

  }catch(e){
    console.error('Checkout place error', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/common/checkout/orders/my?buyerId=xxx
router.get('/orders/my', async (req,res)=>{
  try{
    const buyerId = req.headers['x-buyer-id'] || req.query.buyerId || req.user?._id;
    if(!buyerId) return res.json({ success: true, orders: [] });
    const orders = await Order.find({ $or: [{ buyerId }, { buyerId: buyerId.replace('user_','') }, { buyerId: buyerId.replace('guest_','') }] }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, orders });
  }catch(e){
    res.json({ success: true, orders: [] });
  }
});

// GET /api/common/checkout/orders/shop/:shopId
router.get('/orders/shop/:shopId', async (req,res)=>{
  try{
    const shopId = req.params.shopId;
    const orders = await Order.find({ $or: [{ shopId }, { supplierId: shopId }] }).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, orders });
  }catch(e){
    res.json({ success: true, orders: [] });
  }
});

module.exports = router;