const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// 1. CLOUDINARY CONFIG
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. MULTER STORAGE
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'shop_uploads', // cloudinary me folder
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit' }]
    }
});

const upload = multer({ storage: storage });

// 3. UPLOAD ROUTE - shop-core.js isi ko call karega
router.post('/shop', upload.single('image'), async (req, res) => {
    try {
        if(!req.file){
            return res.status(400).json({ success: false, message: 'File nahi mili' });
        }

        const { shopId, template, type } = req.body;

        // yaha DB me bhi save kar sakte ho agar chaho
        // await Shop.findOneAndUpdate({shopId}, {$set: {[type]: req.file.path}})

        res.json({ 
            success: true, 
            url: req.file.path, // cloudinary ka url
            public_id: req.file.filename 
        });

    } catch (err) {
        console.error("UPLOAD ERROR:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;