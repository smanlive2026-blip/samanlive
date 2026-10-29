// LOCATION: server/routes/media.js - V2 WORLD CLASS - Upload + Fetch + CLOUDINARY MANDATORY - USER PROFILE + SHOP MEDIA
const express = require('express');
const router = express.Router();
const Media = require('../models/Media');
const { upload } = require('../middleware/upload'); 
const { getShopId } = require('../utils/shopId'); // ✅ NAYA IMPORT
const { cloudinary } = require('../utils/cloudinary');
const multer = require('multer');

// MEMORY STORAGE FOR CLOUDINARY - USER PROFILE KE LIYE - VERCEL SAFE
const memoryStorage = multer.memoryStorage();
const memoryUpload = multer({ 
  storage: memoryStorage, 
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req,file,cb)=>{
    if(file.mimetype.startsWith('image/')) cb(null,true);
    else cb(new Error('Only images allowed'), false);
  }
});

// LOCATION: POST /api/media/upload  -> Photo upload karo - SHOP MEDIA + CLOUDINARY
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        let { shopId, template, type, refId } = req.body;
        if(!req.file) return res.status(400).json({ error: 'Image missing' });

        shopId = String(shopId); // ✅ HAMESHA STRING
        let url = `/uploads/${req.file.filename}`;

        // CLOUDINARY TRY - agar cloudinary config hai to cloudinary pe bhi upload karo
        try{
          if(process.env.CLOUDINARY_CLOUD_NAME && req.file.path){
            const { uploadToCloudinary } = require('../utils/cloudinary');
            const result = await uploadToCloudinary(req.file.path, `samanlive/shops/${shopId}`, {});
            if(result && result.success && result.url){
              url = result.url; // Cloudinary URL use karo
            }
          }
        }catch(e){
          console.log('Cloudinary shop upload fallback:', e.message);
          // fallback local url hi rahega
        }

        // LOCATION: Agar banner/logo hai to purana update, naya nahi banega
        const media = await Media.findOneAndUpdate(
            { shopId, type, refId: refId || null },
            { url, template },
            { upsert: true, new: true }
        );
        res.json({ success: true, url: media.url });
    } catch(e) { 
        console.error(e);
        res.status(500).json({ error: e.message }); 
    }
});

// LOCATION: GET /api/media/:shopId  -> 1 shop ki saari photo le aao
router.get('/:shopId', async (req,res) => {
    try {
        const shopId = getShopId(req); // ✅ HELPER USE KIYA
        const media = await Media.find({ shopId: shopId });
        res.json({ success: true, data: media });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// ================= NEW - USER PROFILE PHOTO - CLOUDINARY MANDATORY =================
// POST /api/media/upload-pic - LEGACY - public/profile/js/details.js isko call karta hai
router.post('/upload-pic', memoryUpload.single('profilePic'), async (req, res) => {
    try {
        if(!req.file) return res.status(400).json({ success: false, error: 'Image missing' });

        // Cloudinary upload from buffer - VERCEL SAFE
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'samanlive/users',
          resource_type: 'image',
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good', fetch_format: 'auto' }
          ]
        });

        const url = result.secure_url;

        // Agar buyerId hai to User model me bhi save kar do
        try{
          const buyerId = req.body.buyerId || req.headers['x-buyer-id'] || req.query.buyerId || '';
          let uid = null;
          if(buyerId){
            if(buyerId.startsWith('user_')) uid = buyerId.replace('user_','');
            else if(buyerId.length===24) uid = buyerId;
          }
          if(uid){
            const User = require('../models/User');
            await User.findByIdAndUpdate(uid, { avatar: url }).catch(()=>{});
          }
        }catch(e){}

        res.json({ success: true, url, profilePic: url, avatar: url, public_id: result.public_id });
    } catch(e) { 
        console.error('upload-pic error:', e);
        res.status(500).json({ success: false, error: e.message }); 
    }
});

// POST /api/media/user-avatar - NEW ALIAS - same as upload-pic
router.post('/user-avatar', memoryUpload.single('profilePic'), async (req, res) => {
    try {
        if(!req.file) return res.status(400).json({ success: false, error: 'Image missing' });
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'samanlive/users',
          resource_type: 'image',
          transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }, { quality: 'auto:good', fetch_format: 'auto' }]
        });
        res.json({ success: true, url: result.secure_url, profilePic: result.secure_url });
    } catch(e) { 
        console.error(e);
        res.status(500).json({ success: false, error: e.message }); 
    }
});

module.exports = router;