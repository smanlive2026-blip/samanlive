//   server/routes/upload.js

const express = require('express');
const router = express.Router();
const { upload, uploadFromUrl } = require('../utils/cloudinary');
const auth = require('../middleware/auth'); // auth middleware

// Case 1: Shop File upload
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

// Case 4: NAYA - Shop Template wala - BINA LOGIN KE
router.post('/shop', upload.single('image'), (req, res) => {
  res.json({
    success: true,
    url: req.file.path, // cloudinary url
    public_id: req.file.filename
  });
});

module.exports = router;