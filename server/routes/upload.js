// server/routes/upload.js

const express = require('express');
const router = express.Router();
const { upload, uploadFromUrl } = require('../utils/cloudinary');
const auth = require('../middleware/auth'); // auth middleware

// Case 1: Shop File upload - LOGIN WALA
router.post('/upload', auth, upload.single('file'), (req, res) => {
  res.json({
    success: true,
    url: req.file.path,
    public_id: req.file.filename
  });
});

// Case 2: Direct URL se upload
router.post('/upload-url', auth, async (req, res) => {
  try {
    const { url, shopId, template, type } = req.body;
    const result = await uploadFromUrl(url, shopId, template, type);
    res.json({ success: true, url: result.secure_url });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Case 3: User Profile Pic
router.post('/upload-pic', auth, upload.single('profilePic'), async (req, res) => {
  try {
    res.json({
      success: true,
      url: req.file.path,
      public_id: req.file.filename
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/*

  PREMIUM FEATURE: SHOP TEMPLATE UPLOAD - BINA LOGIN KE
  Isliye auth nahi lagaya. Shop owner dashboard se direct upload hoga

*/
router.post('/shop', upload.single('image'), (req, res) => {
  try {
    if(!req.file){
      return res.status(400).json({ success: false, message: 'No file received' });
    }
    
    console.log("✅ SHOP UPLOAD SUCCESS:", req.file.path); // Render log me dikhega

    res.json({
      success: true,
      url: req.file.path, // cloudinary url
      public_id: req.file.filename
    });
  } catch (err) {
    console.error("❌ SHOP UPLOAD ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;