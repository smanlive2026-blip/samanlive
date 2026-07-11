// ye clounary ke liye h    
const express = require('express');
const router = express.Router();
const { upload, uploadFromUrl } = require('../utils/cloudinary');

// Case 1: File upload form se
// frontend: formData me shopId, template, type, file bhejna
router.post('/upload', upload.single('file'), (req, res) => {
  res.json({
    success: true,
    url: req.file.path, // ye wala link DB me save kar dena
    public_id: req.file.filename
  });
});


// Case 2: Direct URL se upload - "keval link dalne se"
router.post('/upload-url', async (req, res) => {
  const { url, shopId, template, type } = req.body;
  const result = await uploadFromUrl(url, shopId, template, type);
  res.json({ success: true, url: result.secure_url });
});

module.exports = router;