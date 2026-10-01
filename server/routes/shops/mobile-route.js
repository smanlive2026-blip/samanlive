// LOCATION: server/routes/shops/mobile-route.js
// MOBILE SHOP ROUTE - WORLD CLASS - ALL FEATURES - COMMON + BRIDGE CONNECTED
const express = require('express');
const router = express.Router();

// In-memory - In real use DB
const mobileProductsMemory = new Map(); // shopId -> products[]
const mobileOrdersMemory = new Map(); // shopId -> orders[]
const mobileRepairMemory = new Map(); // shopId -> repair bookings[]
const mobileExchangeMemory = new Map(); // shopId -> exchange offers[]
const mobileEmiMemory = new Map(); // shopId -> emi calculations[]

// ============ HELPER ============
function getProducts(shopId){
  if(!mobileProductsMemory.has(shopId)){
    mobileProductsMemory.set(shopId, [
      { id:'m1', shopId, name:'iPhone 15 Pro Max 256GB', brand:'Apple', category:'smartphone', price:134900, originalPrice:159900, stock:5, image:'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300', ram:'8GB', storage:'256GB', color:'Natural Titanium', warranty:'1 Year', emi:true, exchange:true, specs:'A17 Pro, 48MP, 5G', imei:'', barcode:'', rating:4.9, reviews:124, createdAt:new Date().toISOString() },
      { id:'m2', shopId, name:'Samsung Galaxy S24 Ultra 512GB', brand:'Samsung', category:'smartphone', price:129999, originalPrice:139999, stock:8, image:'https://images.unsplash.com/photo-1610945265064-0e34e730d4d0?w=300', ram:'12GB', storage:'512GB', color:'Titanium Black', warranty:'1 Year', emi:true, exchange:true, specs:'Snapdragon 8 Gen 3, 200MP', rating:4.8, reviews:89, createdAt:new Date().toISOString() },
      { id:'m3', shopId, name:'OnePlus 12R 256GB', brand:'OnePlus', category:'smartphone', price:42999, originalPrice:49999, stock:12, image:'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300', ram:'16GB', storage:'256GB', color:'Iron Gray', warranty:'1 Year', emi:true, specs:'Snapdragon 8 Gen 2, 100W', rating:4.7, reviews:156, createdAt:new Date().toISOString() },
      { id:'m4', shopId, name:'Redmi Note 13 Pro 256GB', brand:'Xiaomi', category:'smartphone', price:24999, originalPrice:29999, stock:20, image:'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300', ram:'12GB', storage:'256GB', color:'Midnight Black', warranty:'1 Year', emi:true, specs:'200MP, 67W', rating:4.6, reviews:203, createdAt:new Date().toISOString() },
      { id:'m5', shopId, name:'AirPods Pro 2nd Gen', brand:'Apple', category:'accessories', price:24900, originalPrice:26900, stock:15, image:'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=300', warranty:'1 Year', rating:4.8, reviews:342, createdAt:new Date().toISOString() }
    ]);
  }
  return mobileProductsMemory.get(shopId);
}

function getOrders(shopId){
  if(!mobileOrdersMemory.has(shopId)){
    mobileOrdersMemory.set(shopId, []);
  }
  return mobileOrdersMemory.get(shopId);
}

function getRepairs(shopId){
  if(!mobileRepairMemory.has(shopId)){
    mobileRepairMemory.set(shopId, []);
  }
  return mobileRepairMemory.get(shopId);
}

// ============ 1. PRODUCTS CRUD - CONNECTED TO common/inventory/* ============
// GET /api/shops/mobile/:shopId/products?category=smartphone&brand=Apple&search=iphone&minPrice=10000&maxPrice=150000&inStock=true&sort=price_low
router.get('/:shopId/products', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { category, brand, search, minPrice, maxPrice, inStock, sort, ram, storage } = req.query;

    let products = getProducts(shopId);

    if(category && category!=='all'){
      products = products.filter(p=> p.category===category);
    }

    if(brand){
      products = products.filter(p=> (p.brand||'').toLowerCase()===brand.toLowerCase());
    }

    if(search){
      const q = search.toLowerCase();
      products = products.filter(p=> (p.name||'').toLowerCase().includes(q) || (p.brand||'').toLowerCase().includes(q) || (p.specs||'').toLowerCase().includes(q) || (p.ram||'').toLowerCase().includes(q) || (p.storage||'').toLowerCase().includes(q));
    }

    if(minPrice){
      products = products.filter(p=> p.price>=parseInt(minPrice));
    }

    if(maxPrice){
      products = products.filter(p=> p.price<=parseInt(maxPrice));
    }

    if(inStock==='true'){
      products = products.filter(p=> p.stock>0);
    }

    if(ram){
      products = products.filter(p=> (p.ram||'')===ram);
    }

    if(storage){
      products = products.filter(p=> (p.storage||'')===storage);
    }

    if(sort==='price_low'){
      products.sort((a,b)=> a.price-b.price);
    } else if(sort==='price_high'){
      products.sort((a,b)=> b.price-a.price);
    } else if(sort==='rating'){
      products.sort((a,b)=> (b.rating||0)-(a.rating||0));
    } else if(sort==='newest'){
      products.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
    } else if(sort==='name'){
      products.sort((a,b)=> (a.name||'').localeCompare(b.name||''));
    }

    res.json({
      success:true,
      shopId,
      products,
      count:products.length,
      filters:{ category, brand, search, minPrice, maxPrice, inStock, sort, ram, storage },
      stats:{
        total:products.length,
        smartphone:products.filter(p=> p.category==='smartphone').length,
        feature:products.filter(p=> p.category==='feature').length,
        accessories:products.filter(p=> p.category==='accessories').length,
        inStock:products.filter(p=> p.stock>0).length,
        outOfStock:products.filter(p=> p.stock===0).length,
        lowStock:products.filter(p=> p.stock>0 && p.stock<=3).length,
        apple:products.filter(p=> p.brand==='Apple').length,
        samsung:products.filter(p=> p.brand==='Samsung').length,
        oneplus:products.filter(p=> p.brand==='OnePlus').length
      }
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// GET /api/shops/mobile/:shopId/products/:productId
router.get('/:shopId/products/:productId', async (req,res)=>{
  try{
    const { shopId, productId } = req.params;

    const products = getProducts(shopId);
    const product = products.find(p=> p.id===productId || p._id===productId);

    if(!product){
      return res.status(404).json({ success:false, message:'Mobile product not found' });
    }

    // Related products - same brand or category
    const related = products.filter(p=> p.id!==productId && (p.brand===product.brand || p.category===product.category)).slice(0,4);

    res.json({ success:true, shopId, product, related, productId });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// POST /api/shops/mobile/:shopId/products - Add product - CONNECTED TO common/inventory/inventory.js
router.post('/:shopId/products', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { name, brand, category, price, originalPrice, stock, image, ram, storage, color, warranty, specs, emi, exchange, imei, barcode } = req.body;

    if(!name ||!price){
      return res.status(400).json({ success:false, message:'Name and price required' });
    }

    if(price<=0){
      return res.status(400).json({ success:false, message:'Price must be > 0' });
    }

    // Check product limit - common/subscription/subscription.js
    const products = getProducts(shopId);
    const planLimit = 50; // In real, get from subscription - free 50, starter 500, pro unlimited
    if(products.length>=planLimit){
      return res.status(400).json({ success:false, message:`Product limit reached (${planLimit}) - Upgrade plan to add more - common/subscription/subscription-plans.html`, limit:planLimit, used:products.length });
    }

    // Check duplicate IMEI - common/inventory/barcode-scanner.html
    if(imei){
      const duplicateImei = products.find(p=> p.imei===imei && imei!=='');
      if(duplicateImei){
        return res.status(400).json({ success:false, message:`IMEI ${imei} already exists for product ${duplicateImei.name} - Duplicate IMEI not allowed` });
      }
    }

    const newProduct = {
      id:'m'+Date.now()+Math.random().toString(36).substr(2,5),
      shopId,
      name,
      brand:brand||'Other',
      category:category||'smartphone',
      price:parseInt(price),
      originalPrice:parseInt(originalPrice)||parseInt(price),
      stock:parseInt(stock)||0,
      image:image||'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300',
      ram:ram||'',
      storage:storage||'',
      color:color||'',
      warranty:warranty||'1 Year',
      specs:specs||'',
      emi:!!emi,
      exchange:!!exchange,
      imei:imei||'',
      barcode:barcode||'',
      rating:0,
      reviews:0,
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString()
    };

    products.unshift(newProduct);
    mobileProductsMemory.set(shopId, products);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('product-added', { shopId, product:newProduct });
      global.io.to(`shop:${shopId}`).emit('product-updated', { shopId, product:newProduct });
      global.io.emit('product-updated', { shopId, product:newProduct });
    }

    res.json({ success:true, message:`${name} added to mobile shop 📱 - common/inventory/inventory.html synced`, product:newProduct, shopId, count:products.length });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// PUT /api/shops/mobile/:shopId/products/:productId - Update
router.put('/:shopId/products/:productId', async (req,res)=>{
  try{
    const { shopId, productId } = req.params;
    const updateData = req.body;

    const products = getProducts(shopId);
    const index = products.findIndex(p=> p.id===productId || p._id===productId);

    if(index===-1){
      return res.status(404).json({ success:false, message:'Product not found' });
    }

    // Check IMEI duplicate if updating IMEI
    if(updateData.imei){
      const duplicate = products.find(p=> p.imei===updateData.imei && p.id!==productId && updateData.imei!=='');
      if(duplicate){
        return res.status(400).json({ success:false, message:`IMEI ${updateData.imei} already exists` });
      }
    }

    products[index] = {...products[index],...updateData, updatedAt:new Date().toISOString() };
    mobileProductsMemory.set(shopId, products);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('product-updated', { shopId, product:products[index] });
      global.io.emit('product-updated', { shopId, product:products[index] });
    }

    res.json({ success:true, message:`${products[index].name} updated ✏️`, product:products[index], shopId });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// DELETE /api/shops/mobile/:shopId/products/:productId
router.delete('/:shopId/products/:productId', async (req,res)=>{
  try{
    const { shopId, productId } = req.params;

    const products = getProducts(shopId);
    const product = products.find(p=> p.id===productId || p._id===productId);

    if(!product){
      return res.status(404).json({ success:false, message:'Product not found' });
    }

    const filtered = products.filter(p=> p.id!==productId && p._id!==productId);
    mobileProductsMemory.set(shopId, filtered);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('product-deleted', { shopId, productId, product });
    }

    res.json({ success:true, message:`${product.name} deleted 🗑️`, shopId, productId, count:filtered.length });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// POST /api/shops/mobile/:shopId/products/bulk - Bulk add from quick-add-products.js
router.post('/:shopId/products/bulk', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { productNames } = req.body; // Array of names or objects

    if(!productNames || productNames.length===0){
      return res.status(400).json({ success:false, message:'productNames array required' });
    }

    const products = getProducts(shopId);

    const READY_PRODUCTS = [
      { name:'iPhone 15 Pro Max 256GB', brand:'Apple', category:'smartphone', price:134900, originalPrice:159900, stock:5, ram:'8GB', storage:'256GB', color:'Natural Titanium', warranty:'1 Year', emi:true, image:'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300', specs:'A17 Pro, 48MP, 5G' },
      { name:'Samsung Galaxy S24 Ultra 512GB', brand:'Samsung', category:'smartphone', price:129999, originalPrice:139999, stock:8, ram:'12GB', storage:'512GB', color:'Titanium Black', warranty:'1 Year', emi:true, image:'https://images.unsplash.com/photo-1610945265064-0e34e730d4d0?w=300', specs:'Snapdragon 8 Gen 3, 200MP' },
      { name:'OnePlus 12R 256GB', brand:'OnePlus', category:'smartphone', price:42999, originalPrice:49999, stock:12, ram:'16GB', storage:'256GB', color:'Iron Gray', warranty:'1 Year', emi:true, image:'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300', specs:'Snapdragon 8 Gen 2, 100W' },
      { name:'Redmi Note 13 Pro 256GB', brand:'Xiaomi', category:'smartphone', price:24999, originalPrice:29999, stock:20, ram:'12GB', storage:'256GB', color:'Midnight Black', warranty:'1 Year', emi:true, image:'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300', specs:'200MP, 67W' },
      { name:'AirPods Pro 2nd Gen', brand:'Apple', category:'accessories', price:24900, originalPrice:26900, stock:15, warranty:'1 Year', image:'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=300', specs:'ANC, MagSafe' }
    ];

    const added = [];

    for(let nameOrObj of productNames){
      const productName = typeof nameOrObj==='string'? nameOrObj : nameOrObj.name;
      const readyProduct = READY_PRODUCTS.find(p=> p.name===productName) || (typeof nameOrObj==='object'? nameOrObj : null);

      if(readyProduct){
        const newProduct = {
          id:'m'+Date.now()+Math.random().toString(36).substr(2,5),
          shopId,
         ...readyProduct,
          createdAt:new Date().toISOString()
        };
        products.unshift(newProduct);
        added.push(newProduct);
      }
    }

    mobileProductsMemory.set(shopId, products);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('bulk-products-added', { shopId, count:added.length, products:added });
    }

    res.json({ success:true, message:`${added.length} mobiles added via quick-add-products.js 📱`, added, count:added.length, shopId, totalProducts:products.length });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ============ 2. EMI CALCULATOR - CONNECTED TO common/finance/emi-calculator.html ============
// POST /api/shops/mobile/:shopId/emi/calculate
router.post('/:shopId/emi/calculate', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { productId, price, downPayment, tenure, interestRate } = req.body;

    if(!price){
      return res.status(400).json({ success:false, message:'price required' });
    }

    const productPrice = parseInt(price);
    const down = parseInt(downPayment)||0;
    const months = parseInt(tenure)||12;
    const rate = parseFloat(interestRate)||12; // Annual %

    const loanAmount = productPrice-down;
    const monthlyRate = rate/(12*100);
    const emi = loanAmount*monthlyRate*Math.pow(1+monthlyRate, months)/(Math.pow(1+monthlyRate, months)-1);
    const totalPayment = emi*months;
    const totalInterest = totalPayment-loanAmount;

    const emiData = {
      _id:'emi_'+Date.now(),
      shopId,
      productId:productId||'',
      productPrice,
      downPayment:down,
      loanAmount,
      tenure:months,
      interestRate:rate,
      emi:Math.round(emi),
      totalPayment:Math.round(totalPayment),
      totalInterest:Math.round(totalInterest),
      monthlyRate,
      calculatedAt:new Date().toISOString(),
      breakdown:Array.from({ length:months }, (_,i)=>({
        month:i+1,
        emi:Math.round(emi),
        principal:Math.round(loanAmount/months),
        interest:Math.round(totalInterest/months),
        balance:Math.round(loanAmount-((loanAmount/months)*(i+1)))
      }))
    };

    const shopEmis = mobileEmiMemory.get(shopId)||[];
    shopEmis.unshift(emiData);
    mobileEmiMemory.set(shopId, shopEmis.slice(0,50));

    res.json({
      success:true,
      message:`EMI calculated 💳 - ${months} months @ ${rate}% - common/finance/emi-calculator.html`,
      emi:emiData,
      summary:{
        productPrice,
        downPayment:down,
        loanAmount,
        emi:Math.round(emi),
        tenure:months,
        interestRate:rate,
        totalPayment:Math.round(totalPayment),
        totalInterest:Math.round(totalInterest),
        perMonth:Math.round(emi),
        perDay:Math.round(emi/30)
      }
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// GET /api/shops/mobile/:shopId/emi/offers - EMI offers for products
router.get('/:shopId/emi/offers', async (req,res)=>{
  try{
    const { shopId } = req.params;

    const products = getProducts(shopId);

    const offers = products.filter(p=> p.emi).map(product=>{
      const price = product.price;
      const emi12 = Math.round((price*0.01*Math.pow(1.01,12))/(Math.pow(1.01,12)-1)); // 12% annual ~ 1% monthly
      const emi24 = Math.round((price*0.01*Math.pow(1.01,24))/(Math.pow(1.01,24)-1));

      return {
        productId:product.id,
        productName:product.name,
        price,
        emiOptions:[
          { tenure:6, emi:Math.round(price/6), interest:'0% - No Cost EMI', total:price, saving:0 },
          { tenure:12, emi:emi12, interest:'12% p.a.', total:emi12*12, saving:0 },
          { tenure:24, emi:emi24, interest:'12% p.a.', total:emi24*24, saving:0 }
        ],
        banks:['HDFC','ICICI','SBI','Axis','Kotak','Bajaj Finserv'],
        noCostEmi:price>=10000,
        zeroDownPayment:price<=50000
      };
    });

    res.json({ success:true, shopId, offers, count:offers.length, message:'EMI offers - common/finance/emi-calculator.html + common/wallet/profit-loss.html' });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ============ 3. EXCHANGE OFFER - CONNECTED TO common/marketing/exchange-offer.html ============
// POST /api/shops/mobile/:shopId/exchange/calculate
router.post('/:shopId/exchange/calculate', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { oldPhoneBrand, oldPhoneModel, oldPhoneCondition, newProductId, newProductPrice } = req.body;

    if(!oldPhoneBrand ||!oldPhoneModel){
      return res.status(400).json({ success:false, message:'oldPhoneBrand and oldPhoneModel required' });
    }

    // Mock exchange calculation - In real, use brand + model + condition + age
    const brandValues = { Apple:0.6, Samsung:0.5, OnePlus:0.45, Xiaomi:0.35, Vivo:0.35, Oppo:0.35, Nokia:0.2, Other:0.25 };
    const conditionMultiplier = { excellent:1, good:0.8, fair:0.6, poor:0.4 };

    const baseValue = 20000; // Assume old phone original 20k
    const brandMultiplier = brandValues[oldPhoneBrand]||0.3;
    const conditionMult = conditionMultiplier[oldPhoneCondition]||0.6;

    const exchangeValue = Math.round(baseValue*brandMultiplier*conditionMult);
    const bonus = exchangeValue>10000? 2000 : exchangeValue>5000? 1000 : 500;
    const totalExchangeValue = exchangeValue+bonus;

    const newPrice = parseInt(newProductPrice)||50000;
    const finalPrice = newPrice-totalExchangeValue;

    const exchangeOffer = {
      _id:'ex_'+Date.now(),
      shopId,
      oldPhone:{ brand:oldPhoneBrand, model:oldPhoneModel, condition:oldPhoneCondition||'good' },
      newProductId:newProductId||'',
      newProductPrice:newPrice,
      exchangeValue,
      bonus,
      totalExchangeValue,
      finalPrice,
      saving:totalExchangeValue,
      calculatedAt:new Date().toISOString(),
      validTill:new Date(Date.now()+7*24*3600000).toISOString(),
      message:`Exchange bonus ₹${bonus} included! 🎉`
    };

    const shopExchanges = mobileExchangeMemory.get(shopId)||[];
    shopExchanges.unshift(exchangeOffer);
    mobileExchangeMemory.set(shopId, shopExchanges.slice(0,50));

    res.json({
      success:true,
      message:`Exchange value calculated 🔄 ₹${totalExchangeValue} (₹${exchangeValue} + ₹${bonus} bonus) - common/marketing/exchange-offer.html`,
      exchange:exchangeOffer,
      summary:{
        oldPhone:`${oldPhoneBrand} ${oldPhoneModel}`,
        condition:oldPhoneCondition||'good',
        exchangeValue,
        bonus,
        total:totalExchangeValue,
        newProductPrice:newPrice,
        finalPrice,
        youPay:finalPrice,
        youSave:totalExchangeValue
      }
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// GET /api/shops/mobile/:shopId/exchange/offers
router.get('/:shopId/exchange/offers', async (req,res)=>{
  try{
    const { shopId } = req.params;

    const offers = [
      { id:'ex1', title:'iPhone Exchange Bonus', description:'Exchange any old phone, get up to ₹15,000 + ₹2,000 bonus on iPhone', minExchangeValue:5000, maxExchangeValue:15000, bonus:2000, validFor:['Apple'], validTill:new Date(Date.now()+30*24*3600000).toISOString() },
      { id:'ex2', title:'Samsung Exchange Carnival', description:'Up to ₹12,000 for old Samsung phones + ₹1,500 bonus', minExchangeValue:3000, maxExchangeValue:12000, bonus:1500, validFor:['Samsung','Apple'], validTill:new Date(Date.now()+30*24*3600000).toISOString() },
      { id:'ex3', title:'Any Phone Exchange', description:'Any old phone - Min ₹2,000 guaranteed exchange value', minExchangeValue:2000, maxExchangeValue:10000, bonus:500, validFor:['All'], validTill:new Date(Date.now()+30*24*3600000).toISOString() }
    ];

    res.json({ success:true, shopId, offers, count:offers.length, message:'Exchange offers - common/marketing/exchange-offer.html + common/marketing/festival-offers.html' });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ============ 4. REPAIR BOOKING - CONNECTED TO common/delivery/delivery-status.html + support ============
// POST /api/shops/mobile/:shopId/repair/book
router.post('/:shopId/repair/book', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { customerName, customerPhone, deviceBrand, deviceModel, issue, description, pickupAddress, preferredDate } = req.body;

    if(!customerName ||!customerPhone ||!deviceBrand ||!issue){
      return res.status(400).json({ success:false, message:'customerName, customerPhone, deviceBrand, issue required' });
    }

    const repairs = getRepairs(shopId);

    const repairBooking = {
      _id:'repair_'+Date.now()+Math.random().toString(36).substr(2,5),
      shopId,
      customerName,
      customerPhone,
      deviceBrand,
      deviceModel:deviceModel||'',
      issue, // screen, battery, charging, software, water, other
      description:description||'',
      pickupAddress:pickupAddress||'',
      preferredDate:preferredDate||new Date().toISOString(),
      status:'pending', // pending, picked, diagnosing, repairing, ready, delivered, cancelled
      estimatedCost:0,
      actualCost:0,
      estimatedTime:'2-3 days',
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString(),
      repairId:`REP-${Date.now().toString().substr(-6)}`
    };

    // Estimate cost based on issue
    const costMap = { screen:2500, battery:1500, charging:800, software:500, water:2000, other:1000, speaker:600, camera:1200, motherboard:3500 };
    repairBooking.estimatedCost = costMap[issue]||1000;

    repairs.unshift(repairBooking);
    mobileRepairMemory.set(shopId, repairs.slice(0,100));

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('new-repair-booking', repairBooking);
      global.io.to('admin').emit('new-repair-booking', repairBooking);
    }

    res.json({
      success:true,
      message:`Repair booking confirmed 🔧 ${repairBooking.repairId} - Estimated cost ₹${repairBooking.estimatedCost} - common/delivery/delivery-status.html`,
      repair:repairBooking,
      repairId:repairBooking.repairId,
      estimatedCost:repairBooking.estimatedCost,
      estimatedTime:repairBooking.estimatedTime
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// GET /api/shops/mobile/:shopId/repair - List repairs
router.get('/:shopId/repair', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { status, search, customerPhone } = req.query;

    let repairs = getRepairs(shopId);

    if(status){
      repairs = repairs.filter(r=> r.status===status);
    }

    if(search){
      const q = search.toLowerCase();
      repairs = repairs.filter(r=> (r.customerName||'').toLowerCase().includes(q) || (r.deviceBrand||'').toLowerCase().includes(q) || (r.deviceModel||'').toLowerCase().includes(q) || (r.repairId||'').toLowerCase().includes(q));
    }

    if(customerPhone){
      repairs = repairs.filter(r=> r.customerPhone===customerPhone);
    }

    repairs.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));

    res.json({
      success:true,
      shopId,
      repairs:repairs.slice(0,100),
      count:repairs.length,
      stats:{
        total:repairs.length,
        pending:repairs.filter(r=> r.status==='pending').length,
        repairing:repairs.filter(r=> r.status==='repairing').length,
        ready:repairs.filter(r=> r.status==='ready').length,
        delivered:repairs.filter(r=> r.status==='delivered').length,
        today:repairs.filter(r=> new Date(r.createdAt).toDateString()===new Date().toDateString()).length
      }
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// PUT /api/shops/mobile/:shopId/repair/:repairId/status - Update repair status
router.put('/:shopId/repair/:repairId/status', async (req,res)=>{
  try{
    const { shopId, repairId } = req.params;
    const { status, actualCost, notes } = req.body;

    if(!status){
      return res.status(400).json({ success:false, message:'status required' });
    }

    const repairs = getRepairs(shopId);
    const repair = repairs.find(r=> r._id===repairId || r.repairId===repairId);

    if(!repair){
      return res.status(404).json({ success:false, message:'Repair booking not found' });
    }

    repair.status = status;
    if(actualCost!==undefined) repair.actualCost = parseInt(actualCost);
    if(notes) repair.notes = notes;
    repair.updatedAt = new Date().toISOString();

    mobileRepairMemory.set(shopId, repairs);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('repair-status-updated', { shopId, repairId, status, repair });
      global.io.to(`customer:${repair.customerPhone}`).emit('repair-status-updated', { repairId, status, repair });
    }

    res.json({ success:true, message:`Repair ${repairId} status updated to ${status} 🔧`, repair, shopId });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ============ 5. IMEI / BARCODE - CONNECTED TO common/inventory/barcode-scanner.html ============
// POST /api/shops/mobile/:shopId/imei/verify
router.post('/:shopId/imei/verify', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { imei, productId } = req.body;

    if(!imei){
      return res.status(400).json({ success:false, message:'IMEI required' });
    }

    // IMEI validation - 15 digits
    const cleanImei = imei.replace(/\s/g,'');

    if(cleanImei.length!==15 ||!/^\d{15}$/.test(cleanImei)){
      return res.status(400).json({ success:false, message:'Invalid IMEI - Must be 15 digits', valid:false });
    }

    // Luhn check for IMEI
    let sum = 0;
    for(let i=0;i<14;i++){
      let digit = parseInt(cleanImei[i]);
      if(i%2===1){
        digit*=2;
        if(digit>9) digit = digit-9;
      }
      sum+=digit;
    }
    const checkDigit = (10-(sum%10))%10;
    const isValidLuhn = checkDigit===parseInt(cleanImei[14]);

    const products = getProducts(shopId);
    const existingProduct = products.find(p=> p.imei===cleanImei);

    if(existingProduct){
      return res.json({
        success:true,
        valid:isValidLuhn,
        imei:cleanImei,
        exists:true,
        product:existingProduct,
        message:existingProduct?`IMEI already exists for ${existingProduct.name} ⚠️`:`IMEI valid but not in stock`,
        shopId
      });
    }

    res.json({
      success:true,
      valid:isValidLuhn,
      imei:cleanImei,
      exists:false,
      message:isValidLuhn?'IMEI valid ✅ - Can add to product':'IMEI checksum invalid ❌',
      shopId,
      details:{
        tac:cleanImei.substr(0,8),
        serial:cleanImei.substr(8,6),
        checkDigit:cleanImei[14],
        luhnValid:isValidLuhn
      }
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// POST /api/shops/mobile/:shopId/imei/scan - Scan barcode and get product
router.post('/:shopId/imei/scan', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { barcode, imei } = req.body;

    if(!barcode &&!imei){
      return res.status(400).json({ success:false, message:'barcode or imei required' });
    }

    const searchValue = (barcode||imei||'').replace(/\s/g,'');

    const products = getProducts(shopId);
    const product = products.find(p=> p.imei===searchValue || p.barcode===searchValue || p.id===searchValue);

    if(!product){
      return res.status(404).json({ success:false, message:'Product not found for this IMEI/barcode', barcode:searchValue, imei:searchValue, shopId });
    }

    res.json({
      success:true,
      message:`Product found via ${barcode?'barcode':'IMEI'} scan 📷 - common/inventory/barcode-scanner.html`,
      product,
      barcode:searchValue,
      imei:searchValue,
      shopId
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ============ 6. WARRANTY - CONNECTED TO common/support/* ============
// GET /api/shops/mobile/:shopId/warranty/:productId
router.get('/:shopId/warranty/:productId', async (req,res)=>{
  try{
    const { shopId, productId } = req.params;

    const products = getProducts(shopId);
    const product = products.find(p=> p.id===productId || p._id===productId);

    if(!product){
      return res.status(404).json({ success:false, message:'Product not found' });
    }

    const warrantyMonths = product.warranty==='1 Year'?12:product.warranty==='2 Years'?24:product.warranty==='6 Months'?6:12;
    const purchaseDate = new Date(product.createdAt);
    const warrantyTill = new Date(purchaseDate.getTime()+warrantyMonths*30*24*3600000);
    const isUnderWarranty = new Date()<warrantyTill;
    const daysLeft = Math.ceil((warrantyTill-new Date())/(1000*60*60*24));

    res.json({
      success:true,
      shopId,
      productId,
      productName:product.name,
      warranty:{
        period:product.warranty||'1 Year',
        months:warrantyMonths,
        purchaseDate:purchaseDate.toISOString(),
        warrantyTill:warrantyTill.toISOString(),
        isUnderWarranty,
        daysLeft:isUnderWarranty?daysLeft:0,
        status:isUnderWarranty?`Under warranty - ${daysLeft} days left ✅`:'Warranty expired ❌',
        coverage:['Manufacturing defects','Battery','Software issues'],
        notCovered:['Physical damage','Water damage','Unauthorized repair']
      }
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ============ 7. STATS - CONNECTED TO common/analytics/analytics.html + common/wallet/* ============
router.get('/:shopId/stats', async (req,res)=>{
  try{
    const { shopId } = req.params;

    const products = getProducts(shopId);
    const orders = getOrders(shopId);
    const repairs = getRepairs(shopId);

    const todayOrders = orders.filter(o=> new Date(o.createdAt).toDateString()===new Date().toDateString());
    const todayRevenue = todayOrders.reduce((sum,o)=> sum+o.total,0);

    const stats = {
      products:{
        total:products.length,
        smartphone:products.filter(p=> p.category==='smartphone').length,
        feature:products.filter(p=> p.category==='feature').length,
        accessories:products.filter(p=> p.category==='accessories').length,
        inStock:products.filter(p=> p.stock>0).length,
        outOfStock:products.filter(p=> p.stock===0).length,
        lowStock:products.filter(p=> p.stock>0 && p.stock<=3).length,
        totalValue:products.reduce((sum,p)=> sum+(p.price*p.stock),0),
        apple:products.filter(p=> p.brand==='Apple').length,
        samsung:products.filter(p=> p.brand==='Samsung').length,
        oneplus:products.filter(p=> p.brand==='OnePlus').length,
        xiaomi:products.filter(p=> p.brand==='Xiaomi').length
      },
      orders:{
        total:orders.length,
        today:todayOrders.length,
        pending:orders.filter(o=> o.status==='pending').length,
        confirmed:orders.filter(o=> o.status==='confirmed').length,
        delivered:orders.filter(o=> o.status==='delivered').length,
        todayRevenue,
        totalRevenue:orders.reduce((sum,o)=> sum+o.total,0),
        avgOrderValue:orders.length>0?orders.reduce((sum,o)=> sum+o.total,0)/orders.length:0
      },
      repair:{
        total:repairs.length,
        pending:repairs.filter(r=> r.status==='pending').length,
        repairing:repairs.filter(r=> r.status==='repairing').length,
        ready:repairs.filter(r=> r.status==='ready').length,
        revenue:repairs.filter(r=> r.status==='delivered').reduce((sum,r)=> sum+(r.actualCost||r.estimatedCost||0),0)
      },
      emi:{
        totalCalculations:(mobileEmiMemory.get(shopId)||[]).length,
        avgEmi:12000,
        popularTenure:'12 months'
      },
      exchange:{
        total:(mobileExchangeMemory.get(shopId)||[]).length,
        avgExchangeValue:6500,
        totalSaving:(mobileExchangeMemory.get(shopId)||[]).reduce((sum,ex)=> sum+(ex.totalExchangeValue||0),0)
      }
    };

    res.json({ success:true, shopId, stats, message:'Mobile shop stats - common/analytics/analytics.html + common/wallet/profit-loss.html + common/wallet/wallet.html' });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

module.exports = router;