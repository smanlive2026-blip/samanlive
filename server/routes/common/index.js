// LOCATION: server/routes/common/index.js - V11 FINAL - CRASH FIX
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const ALLOWED_ROUTE_FILES = [
  'common-core.routes.js','auth.js','shop-toggle.js','upload.js',
  'cart.routes.js','checkout.routes.js','customer-orders.routes.js',
  'wishlist.routes.js','reviews.routes.js','track.js','share.routes.js','legal.routes.js',
  'orders.routes.js','inventory.routes.js','banner.routes.js','delivery.routes.js',
  'analytics.routes.js','finance.routes.js','wallet.routes.js','marketing.routes.js',
  'notifications.routes.js','profile.routes.js','settings.routes.js','staff.routes.js',
  'subscription.routes.js','support.routes.js','live.routes.js','ai.routes.js','seo.routes.js','pwa.routes.js'
];

function safeLoad(fileName){
  const fullPath = path.join(__dirname, fileName);
  if(!fs.existsSync(fullPath)){
    const r = express.Router();
    r.all('/*', (req,res)=> res.json({ success:true, message:`${fileName} pending - dummy`, mock:true, data:[] }));
    return r;
  }
  try{
    delete require.cache[require.resolve(fullPath)];
    let route = require(fullPath);
    route = route.default || route.router || route;
    // Agar object hai toh uske andar se router nikalo
    if(typeof route !== 'function' && route && typeof route === 'object'){
      // agar ye router jaisa dikhe toh theek hai
      if(route.stack) return route;
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

ALLOWED_ROUTE_FILES.forEach(file=>{
  try{
    const mountPath = getMountPath(file);
    const loaded = safeLoad(file);
    if(loaded && (typeof loaded === 'function' || loaded.stack)){
      router.use(mountPath, loaded);
      console.log(`✅ ${mountPath} -> ${file}`);
    } else {
      console.log(`⚠️ Skipped ${file}`);
    }
  }catch(e){ console.log(`⚠️ Skip ${file}: ${e.message}`); }
});

router.get('/health', (req,res)=>{
  res.json({ success:true, version:'V11-CRASH-FIX', total:ALLOWED_ROUTE_FILES.length, timestamp:new Date().toISOString() });
});

module.exports = router;