// LOCATION: server/routes/common/share.routes.js
// WORLD CLASS SHARE ROUTE - FULL 500+ LINES - WHATSAPP + INSTAGRAM + QR + LINK
const express = require('express');
const router = express.Router();

// In-memory tracking
const shareMemory = new Map(); // shopId -> shares[]
const qrScanMemory = new Map(); // shopId -> scans[]
const clickMemory = new Map(); // shopId -> clicks[]
const linkMemory = new Map(); // shortId -> longUrl

function getShares(shopId){
  if(!shareMemory.has(shopId)){
    shareMemory.set(shopId, []);
  }
  return shareMemory.get(shopId);
}

function getQrScans(shopId){
  if(!qrScanMemory.has(shopId)){
    qrScanMemory.set(shopId, []);
  }
  return qrScanMemory.get(shopId);
}

function getClicks(shopId){
  if(!clickMemory.has(shopId)){
    clickMemory.set(shopId, []);
  }
  return clickMemory.get(shopId);
}

// ========== 1. TRACK SHARE ==========
// POST /api/common/share/track
router.post('/track', async (req,res)=>{
  try{
    const { type, shopId, data, link, productId } = req.body;

    if(!shopId){
      return res.status(400).json({ success:false, message:'shopId required' });
    }

    if(!type){
      return res.status(400).json({ success:false, message:'type required - whatsapp_shop, instagram_story, qr, link, etc' });
    }

    const share = {
      _id:'share_'+Date.now()+Math.random().toString(36).substr(2,5),
      shopId,
      type, // whatsapp_shop, whatsapp_product, instagram_story, instagram_product, qr_shop, qr_product, shop_link, offer, etc
      data:data||{},
      link:link||'',
      productId:productId||data?.productId||'',
      userId:req.body.userId||'guest',
      userAgent:req.headers['user-agent']||'',
      ip:req.ip||req.headers['x-forwarded-for']||'',
      timestamp:new Date().toISOString(),
      createdAt:new Date().toISOString()
    };

    const shares = getShares(shopId);
    shares.unshift(share);
    shareMemory.set(shopId, shares.slice(0,1000)); // Keep last 1000

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('shop-shared', { shopId, type, share });
      global.io.emit('share-tracked', { shopId, type });
    }

    res.json({
      success:true,
      message:`Share tracked - ${type} 📤`,
      share,
      stats:{
        totalShares:shares.length,
        whatsappShares:shares.filter(s=> s.type.includes('whatsapp')).length,
        instagramShares:shares.filter(s=> s.type.includes('instagram')).length,
        qrShares:shares.filter(s=> s.type.includes('qr')).length
      }
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// GET /api/common/share/stats/:shopId
router.get('/stats/:shopId', async (req,res)=>{
  try{
    const { shopId } = req.params;

    const shares = getShares(shopId);
    const qrScans = getQrScans(shopId);
    const clicks = getClicks(shopId);

    const stats = {
      totalShares:shares.length,
      whatsappShares:shares.filter(s=> s.type.includes('whatsapp')).length,
      whatsappShop:shares.filter(s=> s.type==='whatsapp_shop').length,
      whatsappProduct:shares.filter(s=> s.type==='whatsapp_product').length,
      whatsappOffer:shares.filter(s=> s.type==='whatsapp_offer').length,
      instagramShares:shares.filter(s=> s.type.includes('instagram')).length,
      instagramStory:shares.filter(s=> s.type==='instagram_story').length,
      instagramProduct:shares.filter(s=> s.type==='instagram_product').length,
      qrShares:shares.filter(s=> s.type.includes('qr')).length,
      qrShop:shares.filter(s=> s.type==='qr_shop').length,
      qrProduct:shares.filter(s=> s.type==='qr_product').length,
      linkShares:shares.filter(s=> s.type.includes('link')).length,
      shopLinkShares:shares.filter(s=> s.type==='shop_link').length,
      totalQrScans:qrScans.length,
      totalClicks:clicks.length,
      todayShares:shares.filter(s=> new Date(s.createdAt).toDateString()===new Date().toDateString()).length,
      todayScans:qrScans.filter(s=> new Date(s.createdAt).toDateString()===new Date().toDateString()).length,
      todayClicks:clicks.filter(s=> new Date(s.createdAt).toDateString()===new Date().toDateString()).length,
      topSharedProducts:(()=>{
        const productMap = {};
        shares.filter(s=> s.productId).forEach(s=>{ productMap[s.productId] = (productMap[s.productId]||0)+1; });
        return Object.entries(productMap).sort((a,b)=> b[1]-a[1]).slice(0,5).map(([productId, count])=>({ productId, count }));
      })(),
      shareTrend:(()=>{
        const last7Days = [];
        for(let i=6;i>=0;i--){
          const date = new Date();
          date.setDate(date.getDate()-i);
          const dateStr = date.toDateString();
          const count = shares.filter(s=> new Date(s.createdAt).toDateString()===dateStr).length;
          last7Days.push({ date:date.toISOString().split('T')[0], count, day:date.toLocaleDateString('en-IN',{ weekday:'short' }) });
        }
        return last7Days;
      })()
    };

    // Estimated conversions
    const estimatedOrders = Math.floor(stats.totalShares*0.15 + stats.totalQrScans*0.25 + stats.totalClicks*0.1);
    const estimatedRevenue = estimatedOrders*300;

    res.json({
      success:true,
      shopId,
      stats:{
       ...stats,
        estimatedOrders,
        estimatedRevenue,
        conversionRate: stats.totalShares>0? ((estimatedOrders/stats.totalShares)*100).toFixed(1)+'%' : '0%'
      },
      recentShares:shares.slice(0,20),
      recentScans:qrScans.slice(0,20),
      recentClicks:clicks.slice(0,20)
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 2. QR CODE ROUTES ==========
// POST /api/common/share/qr-scan
router.post('/qr-scan', async (req,res)=>{
  try{
    const { shopId, type, data, productId, table, offer, userId } = req.body;

    if(!shopId){
      return res.status(400).json({ success:false, message:'shopId required' });
    }

    const scan = {
      _id:'scan_'+Date.now()+Math.random().toString(36).substr(2,5),
      shopId,
      type:type||'shop', // shop, product, offer, table, order
      data:data||{},
      productId:productId||'',
      table:table||'',
      offer:offer||'',
      userId:userId||'guest',
      userAgent:req.headers['user-agent']||'',
      ip:req.ip||'',
      location:req.body.location||null,
      timestamp:new Date().toISOString(),
      createdAt:new Date().toISOString()
    };

    const scans = getQrScans(shopId);
    scans.unshift(scan);
    qrScanMemory.set(shopId, scans.slice(0,1000));

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('qr-scanned', { shopId, type, scan, productId, table });
      global.io.to(`shop:${shopId}`).emit('qr-scan', scan);
      global.io.emit('qr-scanned', { shopId, type });
    }

    // If table QR, create table session
    if(type==='table' && table){
      if(global.io){
        global.io.to(`shop:${shopId}`).emit('table-qr-scanned', { shopId, table, scan });
      }
    }

    res.json({
      success:true,
      message:`QR scanned - ${type} 📱`,
      scan,
      redirectUrl:(()=>{
        const base = `/shop.html?shopId=${shopId}`;
        if(type==='product' && productId) return `${base}&productId=${productId}`;
        if(type==='offer' && offer) return `${base}&offer=${offer}`;
        if(type==='table' && table) return `${base}&table=${table}`;
        return base;
      })(),
      stats:{
        totalScans:scans.length,
        todayScans:scans.filter(s=> new Date(s.createdAt).toDateString()===new Date().toDateString()).length
      }
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// GET /api/common/share/qr-stats/:shopId
router.get('/qr-stats/:shopId', async (req,res)=>{
  try{
    const { shopId } = req.params;

    const scans = getQrScans(shopId);

    if(scans.length===0){
      // Mock
      return res.json({
        success:true,
        shopId,
        stats:{
          totalScans:24,
          todayScans:5,
          shopScans:15,
          productScans:6,
          offerScans:2,
          tableScans:1,
          topScannedProducts:[
            { productId:'p1', name:'Fresh Apples', scans:8 },
            { productId:'p2', name:'Mango', scans:5 }
          ],
          scanTrend:(()=>{ const arr=[]; for(let i=6;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); arr.push({ date:d.toISOString().split('T')[0], scans:Math.floor(Math.random()*5), day:d.toLocaleDateString('en-IN',{weekday:'short'}) }); } return arr; })(),
          estimatedOrders:Math.floor(24*0.25),
          estimatedRevenue:24*0.25*300
        },
        recentScans:scans.slice(0,20),
        mock:true
      });
    }

    const stats = {
      totalScans:scans.length,
      todayScans:scans.filter(s=> new Date(s.createdAt).toDateString()===new Date().toDateString()).length,
      shopScans:scans.filter(s=> s.type==='shop').length,
      productScans:scans.filter(s=> s.type==='product').length,
      offerScans:scans.filter(s=> s.type==='offer').length,
      tableScans:scans.filter(s=> s.type==='table').length,
      topScannedProducts:(()=>{ const map={}; scans.filter(s=> s.productId).forEach(s=>{ map[s.productId]=(map[s.productId]||0)+1; }); return Object.entries(map).sort((a,b)=> b[1]-a[1]).slice(0,5).map(([productId, scans])=>({ productId, scans })); })()
    };

    res.json({ success:true, shopId, stats, recentScans:scans.slice(0,50) });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// POST /api/common/share/qr-generate
router.post('/qr-generate', async (req,res)=>{
  try{
    const { shopId, type, data, size, template } = req.body;

    if(!shopId){
      return res.status(400).json({ success:false, message:'shopId required' });
    }

    const baseUrl = req.headers.origin||`https://${req.headers.host}`||'https://samanlive.com';

    let qrText = '';

    switch(type){
      case 'shop':
        qrText = `${baseUrl}/shop.html?shopId=${shopId}`;
        break;
      case 'product':
        qrText = `${baseUrl}/shop.html?shopId=${shopId}&productId=${data?.productId||'p1'}`;
        break;
      case 'offer':
        qrText = `${baseUrl}/shop.html?shopId=${shopId}&offer=${data?.code||'OFFER50'}`;
        break;
      case 'table':
        qrText = `${baseUrl}/shop.html?shopId=${shopId}&table=${data?.table||1}`;
        break;
      case 'order':
        qrText = `${baseUrl}/shop-templates/common/track/track-order.html?orderId=${data?.orderId}&shopId=${shopId}`;
        break;
      default:
        qrText = `${baseUrl}/shop.html?shopId=${shopId}`;
    }

    // In real, generate QR image server-side using qrcode library
    // Here return text and let frontend generate

    res.json({
      success:true,
      qrText,
      qrData:qrText,
      type:type||'shop',
      shopId,
      data,
      size:size||300,
      template:template||'default',
      downloadUrl:qrText, // Frontend will generate canvas
      message:`QR generated for ${type} 📱`
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 3. LINK SHORTENER + CLICK TRACKING ==========
// POST /api/common/share/shorten
router.post('/shorten', async (req,res)=>{
  try{
    const { longUrl, shopId, type, productId } = req.body;

    if(!longUrl){
      return res.status(400).json({ success:false, message:'longUrl required' });
    }

    const shortId = Math.random().toString(36).substr(2,6);
    const shortUrl = `${req.headers.origin||'https://samanlive.com'}/s/${shortId}`;

    linkMemory.set(shortId, {
      longUrl,
      shortUrl,
      shortId,
      shopId:shopId||'',
      type:type||'shop',
      productId:productId||'',
      clicks:0,
      createdAt:new Date().toISOString()
    });

    res.json({
      success:true,
      shortId,
      shortUrl,
      longUrl,
      qrText:shortUrl,
      message:'Short link created 🔗'
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// GET /api/common/share/click/:shortId - Redirect and track
router.get('/click/:shortId', async (req,res)=>{
  try{
    const { shortId } = req.params;

    if(!linkMemory.has(shortId)){
      return res.status(404).json({ success:false, message:'Short link not found' });
    }

    const linkData = linkMemory.get(shortId);
    linkData.clicks += 1;
    linkData.lastClickedAt = new Date().toISOString();
    linkMemory.set(shortId, linkData);

    const clicks = getClicks(linkData.shopId);
    clicks.unshift({
      _id:'click_'+Date.now(),
      shopId:linkData.shopId,
      shortId,
      longUrl:linkData.longUrl,
      type:linkData.type,
      productId:linkData.productId,
      userAgent:req.headers['user-agent']||'',
      ip:req.ip||'',
      timestamp:new Date().toISOString()
    });
    clickMemory.set(linkData.shopId, clicks.slice(0,1000));

    if(global.io){
      global.io.to(`shop:${linkData.shopId}`).emit('link-clicked', { shortId, shopId:linkData.shopId, clicks:linkData.clicks });
    }

    // Redirect to long URL
    return res.redirect(linkData.longUrl);

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// POST /api/common/share/link-click
router.post('/link-click', async (req,res)=>{
  try{
    const { shopId, type, link, productId, userId } = req.body;

    if(!shopId){
      return res.status(400).json({ success:false, message:'shopId required' });
    }

    const click = {
      _id:'click_'+Date.now()+Math.random().toString(36).substr(2,5),
      shopId,
      type:type||'shop_link',
      link:link||'',
      productId:productId||'',
      userId:userId||'guest',
      userAgent:req.headers['user-agent']||'',
      ip:req.ip||'',
      timestamp:new Date().toISOString(),
      createdAt:new Date().toISOString()
    };

    const clicks = getClicks(shopId);
    clicks.unshift(click);
    clickMemory.set(shopId, clicks.slice(0,1000));

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('link-clicked', click);
    }

    res.json({ success:true, message:'Click tracked 🔗', click, totalClicks:clicks.length });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 4. WHATSAPP & SOCIAL SHARE ANALYTICS ==========
// GET /api/common/share/whatsapp-stats/:shopId
router.get('/whatsapp-stats/:shopId', async (req,res)=>{
  try{
    const { shopId } = req.params;

    const shares = getShares(shopId);
    const whatsappShares = shares.filter(s=> s.type.includes('whatsapp'));

    const stats = {
      totalWhatsappShares:whatsappShares.length,
      shopShares:whatsappShares.filter(s=> s.type==='whatsapp_shop').length,
      productShares:whatsappShares.filter(s=> s.type==='whatsapp_product').length,
      offerShares:whatsappShares.filter(s=> s.type==='whatsapp_offer').length,
      orderShares:whatsappShares.filter(s=> s.type==='whatsapp_order').length,
      cartShares:whatsappShares.filter(s=> s.type==='whatsapp_cart').length,
      todayShares:whatsappShares.filter(s=> new Date(s.createdAt).toDateString()===new Date().toDateString()).length,
      topSharedProducts:(()=>{ const map={}; whatsappShares.filter(s=> s.productId).forEach(s=>{ map[s.productId]=(map[s.productId]||0)+1; }); return Object.entries(map).sort((a,b)=> b[1]-a[1]).slice(0,5).map(([productId,count])=>({ productId, count })); })(),
      estimatedOrders:Math.floor(whatsappShares.length*0.15),
      estimatedRevenue:Math.floor(whatsappShares.length*0.15*300)
    };

    res.json({ success:true, shopId, stats, recentShares:whatsappShares.slice(0,20) });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// GET /api/common/share/instagram-stats/:shopId
router.get('/instagram-stats/:shopId', async (req,res)=>{
  try{
    const { shopId } = req.params;

    const shares = getShares(shopId);
    const instagramShares = shares.filter(s=> s.type.includes('instagram'));

    const stats = {
      totalInstagramShares:instagramShares.length,
      storyShares:instagramShares.filter(s=> s.type==='instagram_story').length,
      productStoryShares:instagramShares.filter(s=> s.type==='instagram_product').length,
      offerStoryShares:instagramShares.filter(s=> s.type==='instagram_offer').length,
      todayShares:instagramShares.filter(s=> new Date(s.createdAt).toDateString()===new Date().toDateString()).length,
      estimatedReach:instagramShares.length*150,
      estimatedOrders:Math.floor(instagramShares.length*0.08),
      estimatedRevenue:Math.floor(instagramShares.length*0.08*300)
    };

    res.json({ success:true, shopId, stats, recentShares:instagramShares.slice(0,20) });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 5. BULK SHARE MESSAGE GENERATOR ==========
router.post('/generate-message', async (req,res)=>{
  try{
    const { shopId, type, productId, offerCode, customData } = req.body;

    if(!shopId){
      return res.status(400).json({ success:false, message:'shopId required' });
    }

    const baseUrl = req.headers.origin||'https://samanlive.com';
    const shopLink = `${baseUrl}/shop.html?shopId=${shopId}`;

    // Mock shop data
    const shopName = customData?.shopName||'My Kirana Store';
    const productName = customData?.productName||'Fresh Apples';
    const price = customData?.price||120;

    let messages = {};

    switch(type){
      case 'shop':
        messages = {
          whatsapp:`🛍️ *${shopName}* - Aapka apna local shop!\n\n🏪 Fresh products\n🚚 Fast delivery (30 mins)\n💰 Best prices\n⭐ 4.8 rating\n\n🔗 Shop now: ${shopLink}\n\n📍 Adajan, Surat\n\nOrder karo! 🙏`,
          instagram_caption:`🛍️ ${shopName} - Aapka apna local shop!\n\n✅ Fresh products\n🚚 Fast delivery\n💰 Best prices\n📍 Surat\n\n🔗 Link in bio: ${shopLink}\n\n#LocalShop #Surat #FreshProducts #ShopLocal`,
          facebook:`🛍️ ${shopName} - Aapka apna local shop! 🏪\n\nFresh products, fast delivery, best prices in Surat!\n\n✅ 500+ products\n👥 1200+ happy customers\n⭐ 4.8 rating\n🚚 30 mins delivery\n\n🔗 Shop now: ${shopLink}\n\n#SupportLocal #ShopLocal #Surat`,
          sms:`${shopName}: Fresh products available! Shop now: ${shopLink} - Fast delivery, best prices!`
        };
        break;

      case 'product':
        const productLink = `${shopLink}&productId=${productId||'p1'}`;
        messages = {
          whatsapp:`🛒 *${productName}* - ₹${price}\n\n📸 Fresh & Best Quality\n🚚 Fast Delivery\n✅ Best Price\n\n🛍️ Shop: ${shopName}\n🔗 Buy now: ${productLink}\n\nOrder now! 🛍️`,
          instagram_caption:`🛒 ${productName} - ₹${price}\n\n📸 Fresh & Best Quality\n🚚 Fast Delivery\n✅ Best Price\n\n🛍️ Shop: ${shopName}\n🔗 Link in bio\n\n#ShopNow #NewArrival #Fresh`,
          facebook:`🛒 New Product: ${productName} - ₹${price}\n\nFresh and best quality from ${shopName}!\n\n🔗 Buy now: ${productLink}\n\n#NewProduct #Fresh #ShopNow`,
          sms:`${shopName}: ${productName} - ₹${price} - Buy now: ${productLink}`
        };
        break;

      case 'offer':
        const offerLink = `${shopLink}&offer=${offerCode||'OFFER50'}`;
        messages = {
          whatsapp:`🎉 *Special Offer - ${shopName}*\n\n🏷️ ${customData?.offerTitle||'50% OFF'}\n💰 ${customData?.offerDescription||'On all products'}\n${offerCode?`🔖 Code: *${offerCode}*`:''}\n⏰ Valid till: ${customData?.validTill||'Limited time'}\n\n🔗 Shop now: ${offerLink}\n\nDon't miss! 🛍️`,
          instagram_caption:`🎉 SPECIAL OFFER - ${shopName}\n\n🏷️ ${customData?.offerTitle||'50% OFF'}\n${offerCode?`🔖 Code: ${offerCode}`:''}\n⏰ Limited time!\n\n🔗 Shop now - Link in bio\n${offerLink}\n\n#Offer #Sale #Discount`,
          facebook:`🎉 OFFER ALERT - ${shopName}!\n\n🏷️ ${customData?.offerTitle||'50% OFF'}\n${offerCode?`🔖 Use Code: ${offerCode}`:''}\n\n🔗 Shop: ${offerLink}\n\nLimited time! Don't miss! 🛍️`,
          sms:`${shopName}: ${customData?.offerTitle||'50% OFF'} - Code: ${offerCode||'OFFER50'} - Shop: ${offerLink}`
        };
        break;

      default:
        messages = {
          whatsapp:`Check ${shopName}: ${shopLink}`,
          instagram_caption:`Check ${shopName} - Link in bio: ${shopLink}`,
          facebook:`Check ${shopName}: ${shopLink}`,
          sms:`${shopName}: ${shopLink}`
        };
    }

    res.json({ success:true, shopId, type, messages, shopLink, productLink: type==='product'? `${shopLink}&productId=${productId}` : null });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

module.exports = router;