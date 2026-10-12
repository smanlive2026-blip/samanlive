// LOCATION: server/routes/common/connection.routes.js - OPTIONAL - AGAR SERVER SIDE FILE CHECK CHAHIYE TO
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

router.get('/connection-map', (req,res)=>{
  const root = path.join(__dirname,'../../public');
  const checks = [
    'shop-templates/common/cart/cart-core.js',
    'shop-templates/common/cart/cart-count.js',
    'shop-templates/common/products/product-manager.js',
    'shop-templates/common/checkout/checkout.js',
    'shop-templates/common/core/socket-core.js',
  ];
  const result = checks.map(p=>({ file:p, exists: fs.existsSync(path.join(root,p)) }));
  res.json({success:true, data:result});
});

module.exports = router;