// LOCATION: server/routes/common/index.js - V17 FINAL - V14 SAME + NO SIZE LIMIT - 260 LINE SAME LOGIC
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const ALLOWED_ROUTE_FILES = [
  'common-core.routes.js','auth.js','shop-toggle.js','upload.js','code-export.routes.js',
  'cart.routes.js','checkout.routes.js','customer-orders.routes.js',
  'wishlist.routes.js','reviews.routes.js','track.js','share.routes.js','legal.routes.js',
  'orders.routes.js','inventory.routes.js','banner.routes.js','delivery.routes.js',
  'analytics.routes.js','finance.routes.js','wallet.routes.js','marketing.routes.js',
  'notifications.routes.js','profile.routes.js','settings.routes.js','staff.routes.js',
  'subscription.routes.js','support.routes.js','live.routes.js','ai.routes.js','seo.routes.js','pwa.routes.js'
];

// CODE-EXPORT KE LIYE WALK FUNCTION - MODIFIED FOR FULL PROJECT - NO SIZE LIMIT
const PROJECT_ROOT = path.join(__dirname, '../../');
const IGNORE_DIRS = ['node_modules', '.git', '.vercel'];
const IGNORE_FILES = [];
function walk(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (!IGNORE_DIRS.includes(file)) walk(fullPath, fileList);
        } else {
          if (!IGNORE_FILES.includes(file)) fileList.push(fullPath);
        }
      } catch(e){}
    });
  } catch(e){}
  return fileList;
}

function safeLoad(fileName){
  const fullPath = path.join(__dirname, fileName);
  if(!fs.existsSync(fullPath)){
    return null;
  }
  try{
    delete require.cache[require.resolve(fullPath)];
    let route = require(fullPath);
    route = route.default || route.router || route;
    if(typeof route !== 'function' && route && typeof route === 'object'){
      if(route.stack) return route;
      if(route.router && route.router.stack) return route.router;
    }
    return route;
  }catch(e){
    console.error(`❌ ${fileName}: ${e.message}`);
    const r = express.Router();
    r.all('/*', (req,res)=> res.status(500).json({ success:false, error:e.message, file:fileName }));
    return r;
  }
}

function getMountPath(f){
  if(f==='shop-toggle.js') return '/shop-toggle';
  if(f==='common-core.routes.js') return '/core';
  return `/${f.replace('.routes.js','').replace('.js','')}`;
}

function getInlineFallback(fileName){
  const express = require('express');
  if(fileName === 'code-export.routes.js'){
    const r = express.Router();
    r.get('/files', (req,res)=>{
      try{
        const files = walk(PROJECT_ROOT);
        const relative = files.map(f=>{
          const stat = fs.statSync(f);
          return { fullPath:f, relativePath:path.relative(PROJECT_ROOT,f).replace(/\\/g,'/'), size:stat.size, modified:stat.mtime };
        }).sort((a,b)=> a.relativePath.localeCompare(b.relativePath));
        res.json({ success:true, total:relative.length, files:relative });
      }catch(e){ res.status(500).json({ success:false, message:e.message }); }
    });
    r.get('/file-content', (req,res)=>{
      try{
        const relPath = req.query.path;
        if(!relPath || relPath.includes('..')) return res.status(400).json({ success:false });
        const full = path.join(PROJECT_ROOT, relPath);
        if(!fs.existsSync(full)) return res.status(404).json({ success:false });
        const content = fs.readFileSync(full,'utf8');
        res.json({ success:true, path:relPath, content:content });
      }catch(e){ res.status(500).json({ success:false }); }
    });
    r.get('/download-all', (req,res)=>{
      try{
        const files = walk(PROJECT_ROOT);
        let combined = `PROJECT CODE EXPORT - ${new Date().toISOString()}\nTotal: ${files.length}\n========================================\n\n`;
        files.forEach(fp=>{
          const rel = path.relative(PROJECT_ROOT,fp).replace(/\\/g,'/');
          try{
            const content = fs.readFileSync(fp,'utf8');
            combined += `\n// LOCATION: ${rel}\n${content}\n// END: ${rel}\n`;
          }catch(e){}
        });
        res.setHeader('Content-Type','text/plain');
        res.setHeader('Content-Disposition',`attachment; filename="full-project-${Date.now()}.txt"`);
        res.send(combined);
      }catch(e){ res.status(500).json({ success:false }); }
    });
    return r;
  }
  
  if(fileName === 'cart.routes.js'){
    try{
      const realPath = path.join(__dirname, 'cart.routes.js');
      if(fs.existsSync(realPath)){
        delete require.cache[require.resolve(realPath)];
        return require(realPath);
      }
    }catch(e){}
    const r = express.Router();
    r.all('/*', (req,res)=> res.status(404).json({ success:false, message:'cart.routes.js file missing - create server/routes/common/cart.routes.js with V3 code I gave you', file:fileName }));
    return r;
  }

  if(fileName === 'checkout.routes.js'){
    const r = express.Router();
    r.post('/', async (req,res)=>{
      try{
        const Order = require('../../models/Order');
        const { buyerId, supplierId, items, total } = req.body;
        if(!buyerId || !supplierId || !items?.length) return res.status(400).json({ success:false, message:'buyerId, supplierId, items required' });
        const order = await Order.create({
          orderId: 'ORD'+Date.now()+Math.floor(Math.random()*1000),
          buyerId, supplierId, shopId: req.body.shopId||supplierId,
          items, totalAmount: total, total,
          status: 'placed', orderStatus: 'placed',
          paymentMethod: req.body.paymentMode||req.body.paymentMethod||'cod',
          deliveryAddress: req.body.address||req.body.addressText||{},
          addressId: req.body.addressId||'',
          createdAt: new Date()
        });
        res.json({ success:true, orderId: order.orderId, order });
      }catch(e){ res.status(500).json({ success:false, message:e.message }); }
    });
    r.get('/orders/my', async (req,res)=>{
      try{
        const Order = require('../../models/Order');
        const buyerId = req.headers['x-buyer-id'] || req.query.buyerId || req.user?._id;
        if(!buyerId) return res.json({ success:true, orders:[] });
        const orders = await Order.find({ buyerId }).sort({ createdAt:-1 }).limit(50);
        res.json({ success:true, orders });
      }catch(e){ res.json({ success:true, orders:[] }); }
    });
    r.post('/:shopId/place', async (req,res)=>{
      try{
        const Order = require('../../models/Order');
        const { buyerId, items, total } = req.body;
        const finalItems = items || [];
        if(!finalItems.length) return res.status(400).json({ success:false, message:'Cart empty' });
        const order = await Order.create({
          orderId: 'ORD'+Date.now(),
          buyerId: buyerId||req.headers['x-buyer-id']||'guest',
          supplierId: req.params.shopId,
          shopId: req.params.shopId,
          items: finalItems,
          totalAmount: total||req.body.totalAmount||0,
          status: 'placed',
          paymentMethod: req.body.paymentMethod||'cod'
        });
        res.json({ success:true, orderId: order.orderId, order });
      }catch(e){ res.status(500).json({ success:false, message:e.message }); }
    });
    return r;
  }

  if(fileName === 'customer-orders.routes.js'){
    const r = express.Router();
    r.get('/track/:orderId', async (req,res)=>{
      try{
        const Order = require('../../models/Order');
        const order = await Order.findOne({ orderId: req.params.orderId });
        if(!order) return res.status(404).json({ success:false, message:'Order not found' });
        res.json({ success:true, status: order.status, order, estimatedDelivery: order.estimatedDelivery, location: order.deliveryBoyLocation });
      }catch(e){ res.status(500).json({ success:false }); }
    });
    r.get('/orders/:shopId/:orderId', async (req,res)=>{
      try{
        const Order = require('../../models/Order');
        const order = await Order.findOne({ orderId: req.params.orderId, $or:[{shopId:req.params.shopId},{supplierId:req.params.shopId}] });
        if(!order) return res.status(404).json({ success:false });
        res.json({ success:true, order });
      }catch(e){ res.status(500).json({ success:false }); }
    });
    r.post('/orders/:orderId/cancel', async (req,res)=>{
      try{
        const Order = require('../../models/Order');
        const order = await Order.findOne({ orderId: req.params.orderId });
        if(!order) return res.status(404).json({ success:false, message:'Order not found' });
        if(['delivered','cancelled'].includes(order.status)) return res.status(400).json({ success:false, message:'Cannot cancel' });
        order.status='cancelled'; order.cancelledAt=new Date(); order.cancelReason=req.body.reason; order.extraText=req.body.extraText||'';
        await order.save();
        if(global.io){
          global.io.to(`order_${req.params.orderId}`).emit('order-updated', order);
          global.io.to(`buyer_${req.body.buyerId||order.buyerId}`).emit('order-updated', order);
        }
        res.json({ success:true, order });
      }catch(e){ res.status(500).json({ success:false, message:e.message }); }
    });
    r.post('/orders/:orderId/return', async (req,res)=>{
      try{
        const Order = require('../../models/Order');
        const order = await Order.findOne({ orderId: req.params.orderId });
        if(!order) return res.status(404).json({ success:false });
        order.returnRequest={ items:req.body.items||[], reason:req.body.reason||'', comments:req.body.comments||'', images:(req.body.images||[]).slice(0,4), status:'pending', createdAt:new Date() };
        order.status='returned'; await order.save();
        res.json({ success:true, order });
      }catch(e){ res.status(500).json({ success:false, message:e.message }); }
    });
    r.get('/:orderId', async (req,res)=>{
      try{
        const Order = require('../../models/Order');
        const order = await Order.findOne({ orderId: req.params.orderId });
        if(!order) return res.status(404).json({ success:false });
        res.json({ success:true, order });
      }catch(e){ res.status(500).json({ success:false }); }
    });
    return r;
  }

  if(fileName === 'orders.routes.js'){
    const r = express.Router();
    r.get('/', async (req,res)=>{
      try{
        const Order = require('../../models/Order');
        const shopId = req.query.shopId || req.headers['x-shop-id'];
        const query = shopId ? { $or:[{shopId},{supplierId:shopId}] } : {};
        const orders = await Order.find(query).sort({ createdAt:-1 }).limit(100);
        res.json({ success:true, orders });
      }catch(e){ res.json({ success:true, orders:[] }); }
    });
    return r;
  }

  const r = express.Router();
  r.all('/*', (req,res)=> res.status(404).json({ success:false, message:`${fileName} not implemented yet`, pending:true, file:fileName }));
  return r;
}

ALLOWED_ROUTE_FILES.forEach(file=>{
  try{
    const mountPath = getMountPath(file);
    let loaded = safeLoad(file);
    if(!loaded){
      loaded = getInlineFallback(file);
      console.log(`🔄 ${mountPath} -> ${file} (inline real fallback)`);
    } else {
      console.log(`✅ ${mountPath} -> ${file} (real file)`);
    }
    if(loaded && (typeof loaded === 'function' || loaded.stack)){
      router.use(mountPath, loaded);
    } else {
      console.log(`⚠️ Skipped ${file}`);
    }
  }catch(e){ console.log(`⚠️ Skip ${file}: ${e.message}`); }
});

router.get('/health', (req,res)=>{
  res.json({ success:true, version:'V17-V14-SAME-NO-SIZE-LIMIT', total:ALLOWED_ROUTE_FILES.length, timestamp:new Date().toISOString() });
});

router.use('/connection', require('./connection.routes'));

module.exports = router;