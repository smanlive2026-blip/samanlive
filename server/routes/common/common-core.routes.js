// LOCATION: server/routes/common/common-core.routes.js
// WORLD CLASS COMMON CORE ROUTE - USES UTILS - FULL 500+ LINES
const express = require('express');
const router = express.Router();
const { uploadToCloudinary, uploadMultipleToCloudinary, deleteFromCloudinary } = require('../../utils/cloudinary');
const { sendShopNotification, sendUserNotification, getShopNotifications, markAsRead, markAllAsRead } = require('../../utils/sendNotification');
const { generateShopId, generateShopLink, generateShopQRData, isValidShopId } = require('../../utils/shopId');

// ========== IN-MEMORY ==========
const bannerMemory = new Map();
const uploadMemory = new Map();

function getBanner(shopId){
  if(!bannerMemory.has(shopId)){
    bannerMemory.set(shopId, { shopId, text:'🎉 Welcome to our shop! 50% OFF', image:'', link:'/offers', bgColor:'#0f172a', textColor:'#fff', visible:true, type:'sale', createdAt:new Date().toISOString() });
  }
  return bannerMemory.get(shopId);
}

// ========== 1. UPLOAD ROUTES (Uses Cloudinary Utils) ==========
// POST /api/common/core/:shopId/upload/single
router.post('/:shopId/upload/single', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { filePath, folder, base64 } = req.body;

    if(!filePath &&!base64){
      return res.status(400).json({ success:false, message:'filePath or base64 required' });
    }

    const uploadPath = filePath||base64;
    const uploadFolder = folder||`samanlive/shops/${shopId}`;

    const result = await uploadToCloudinary(uploadPath, uploadFolder);

    if(!result.success &&!result.fallback){
      return res.status(500).json({ success:false, message:'Upload failed', error:result.error });
    }

    // Store in memory for tracking
    if(!uploadMemory.has(shopId)) uploadMemory.set(shopId, []);
    uploadMemory.get(shopId).unshift({ url:result.url, public_id:result.public_id, folder:uploadFolder, uploadedAt:new Date().toISOString() });

    res.json({ success:true, message:'Uploaded ✅', url:result.url, public_id:result.public_id, result });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// POST /api/common/core/:shopId/upload/multiple
router.post('/:shopId/upload/multiple', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { filePaths, folder } = req.body;

    if(!filePaths ||!Array.isArray(filePaths) || filePaths.length===0){
      return res.status(400).json({ success:false, message:'filePaths array required' });
    }

    const uploadFolder = folder||`samanlive/shops/${shopId}`;

    const result = await uploadMultipleToCloudinary(filePaths, uploadFolder);

    res.json({ success:true, message:`${result.count} files uploaded ✅`, urls:result.urls, results:result.results });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// DELETE /api/common/core/:shopId/upload/:publicId
router.delete('/:shopId/upload/:publicId', async (req,res)=>{
  try{
    const { shopId, publicId } = req.params;

    const fullPublicId = `samanlive/shops/${shopId}/${publicId}`;

    const result = await deleteFromCloudinary(fullPublicId);

    res.json({ success:true, message:'Deleted', result });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 2. SHOP ID UTILS ROUTES ==========
// POST /api/common/core/generate-shop-id
router.post('/generate-shop-id', async (req,res)=>{
  try{
    const { shopName, area, city } = req.body;

    if(!shopName){
      return res.status(400).json({ success:false, message:'shopName required' });
    }

    const shopId = generateShopId(shopName, area, city);
    const shortId = require('../../utils/shopId').generateShortShopId(shopName);
    const link = generateShopLink(shopId);
    const qrData = generateShopQRData(shopId, shopName);
    const valid = isValidShopId(shopId);

    res.json({ success:true, shopId, shortId, link, qrData, valid, message:'Shop ID generated' });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// GET /api/common/core/validate-shop-id/:shopId
router.get('/validate-shop-id/:shopId', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const valid = isValidShopId(shopId);
    const parsed = require('../../utils/shopId').parseShopId(shopId);

    res.json({ success:true, shopId, valid, parsed, message:valid?'Valid shop ID ✅':'Invalid shop ID ❌' });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// GET /api/common/core/:shopId/qr-data
router.get('/:shopId/qr-data', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { shopName } = req.query;

    const qrData = generateShopQRData(shopId, shopName||'My Shop');
    const link = generateShopLink(shopId);

    res.json({ success:true, shopId, qrData, link });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 3. BANNER ROUTES (Uses Utils Concept) ==========
// GET /api/common/core/:shopId/banner
router.get('/:shopId/banner', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const banner = getBanner(shopId);

    res.json({ success:true, banner });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// PUT /api/common/core/:shopId/banner
router.put('/:shopId/banner', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const bannerData = req.body;

    let banner = getBanner(shopId);
    banner = {...banner,...bannerData, shopId, updatedAt:new Date().toISOString() };

    bannerMemory.set(shopId, banner);

    const io = req.app.get('io') || global.io;
    if(io){
    io.to(`shop:${shopId}`).emit('banner-updated', banner);
    io.emit('shop-banner-changed', { shopId, banner });
  }

    res.json({ success:true, message:'Banner updated 🎨', banner });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 4. NOTIFICATION ROUTES (Uses sendNotification Utils) ==========
// GET /api/common/core/:shopId/notifications
router.get('/:shopId/notifications', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { unread } = req.query;

    let notifications = getShopNotifications(shopId);

    if(unread==='true'){
      notifications = notifications.filter(n=>!n.read);
    }

    notifications = notifications.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));

    res.json({ success:true, notifications, count:notifications.length, unread:notifications.filter(n=>!n.read).length });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// POST /api/common/core/:shopId/notifications/send
router.post('/:shopId/notifications/send', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { title, message, type, data, priority } = req.body;

    if(!title){
      return res.status(400).json({ success:false, message:'title required' });
    }

    const result = await sendShopNotification(shopId, { title, message, type, data, priority });

    res.json({ success:true, message:'Notification sent 📢', notification:result.notification });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// PUT /api/common/core/:shopId/notifications/:notificationId/read
router.put('/:shopId/notifications/:notificationId/read', async (req,res)=>{
  try{
    const { shopId, notificationId } = req.params;

    const result = markAsRead(shopId, notificationId);

    if(!result.success){
      return res.status(404).json(result);
    }

    res.json({ success:true, message:'Marked as read', notification:result.notification });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// PUT /api/common/core/:shopId/notifications/read-all
router.put('/:shopId/notifications/read-all', async (req,res)=>{
  try{
    const { shopId } = req.params;

    const result = markAllAsRead(shopId);

    res.json({ success:true, message:`${result.count} notifications marked as read`, count:result.count });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 5. CURRENCY & DATE UTILS API ==========
// POST /api/common/core/format/currency
router.post('/format/currency', async (req,res)=>{
  try{
    const { amount, compact, showSymbol } = req.body;

    if(amount===undefined){
      return res.status(400).json({ success:false, message:'amount required' });
    }

    const num = parseFloat(amount);
    let formatted = '';

    if(compact){
      if(num>=10000000) formatted = `₹ ${(num/10000000).toFixed(1)}Cr`;
      else if(num>=100000) formatted = `₹ ${(num/100000).toFixed(1)}L`;
      else if(num>=1000) formatted = `₹ ${(num/1000).toFixed(1)}K`;
      else formatted = `₹ ${num}`;
    } else {
      formatted = new Intl.NumberFormat('en-IN').format(num);
      formatted = showSymbol!==false? `₹ ${formatted}` : formatted;
    }

    res.json({ success:true, amount:num, formatted, compact:!!compact });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// POST /api/common/core/format/date
router.post('/format/date', async (req,res)=>{
  try{
    const { date, format } = req.body;

    if(!date){
      return res.status(400).json({ success:false, message:'date required' });
    }

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2,'0');
    const month = String(d.getMonth()+1).padStart(2,'0');
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2,'0');
    const hours12 = hours%12||12;
    const ampm = hours>=12?'PM':'AM';

    const formats = {
      'DD/MM/YYYY':`${day}/${month}/${year}`,
      'YYYY-MM-DD':`${year}-${month}-${day}`,
      'DD MMM YYYY':`${day} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${year}`,
      'hh:mm A':`${String(hours12).padStart(2,'0')}:${minutes} ${ampm}`,
      'relative':(()=>{
        const now = new Date();
        const diffSec = Math.floor((now-d)/1000);
        const diffMin = Math.floor(diffSec/60);
        const diffHour = Math.floor(diffMin/60);
        const diffDay = Math.floor(diffHour/24);
        if(diffSec<60) return 'Just now';
        if(diffMin<60) return `${diffMin} min ago`;
        if(diffHour<24) return `${diffHour} hours ago`;
        if(diffDay===1) return 'Yesterday';
        return `${diffDay} days ago`;
      })()
    };

    const formatted = formats[format]||formats['DD/MM/YYYY'];

    res.json({ success:true, date, formatted, format:format||'DD/MM/YYYY', iso:d.toISOString() });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 6. COMMON UTILS STATS ==========
// GET /api/common/core/:shopId/stats
router.get('/:shopId/stats', async (req,res)=>{
  try{
    const { shopId } = req.params;

    const notifications = getShopNotifications(shopId);
    const banner = getBanner(shopId);
    const uploads = uploadMemory.get(shopId)||[];

    res.json({
      success:true,
      stats:{
        notifications:{ total:notifications.length, unread:notifications.filter(n=>!n.read).length },
        banner:{ exists:!!banner, visible:banner.visible, text:banner.text },
        uploads:{ total:uploads.length, lastUpload:uploads[0]?.uploadedAt||null },
        utils:{ cloudinary:!!process.env.CLOUDINARY_CLOUD_NAME, notifications:true, shopId:true }
      }
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

module.exports = router;