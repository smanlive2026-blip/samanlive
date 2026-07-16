//  server/utils/cloudinary.js

const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // <-- YE CHANGE
  api_key: process.env.CLOUDINARY_API_KEY,       // <-- YE CHANGE
  api_secret: process.env.CLOUDINARY_API_SECRET  // <-- YE CHANGE
});

// Storage engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {

    // Case 1: Shop ka upload
    if(req.body.shopId) {
      const { shopId, template, type } = req.body;
      return {
        folder: `shops/${shopId}/${template}/${type}`,
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'pdf'],
        resource_type: 'auto',
        transformation: [{ width: 1200, crop: "limit", quality: "auto" }]
      };
    }

    // Case 2: User profile pic
    if(req.user && req.user.id) {
      return {
        folder: `users/${req.user.id}/profile`,
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        resource_type: 'image',
        transformation: [{ width: 500, height: 500, crop: "fill", quality: "auto" }]
      };
    }

    // Default
    return {
      folder: `misc`,
      allowed_formats: ['jpg', 'png', 'jpeg'],
      resource_type: 'auto'
    };
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// Direct URL se upload
const uploadFromUrl = async (url, shopId, template, type) => {
  return await cloudinary.uploader.upload(url, {
    folder: `shops/${shopId}/${template}/${type}`,
    resource_type: 'auto'
  });
}

module.exports = { cloudinary, upload, uploadFromUrl };