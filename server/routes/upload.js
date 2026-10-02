// LOCATION: server/routes/upload.js
const express = require('express');
const router = express.Router();

// Yahi fix hai - sahi import
const { cloudinary, upload } = require('../utils/cloudinary');

router.post('/single', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    res.json({ 
      success: true, 
      url: req.file.path || req.file.secure_url,
      public_id: req.file.filename || req.file.public_id,
      file: req.file 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/multiple', upload.array('images', 10), async (req, res) => {
  try {
    const urls = req.files.map(f => f.path || f.secure_url);
    res.json({ success: true, urls, files: req.files });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;