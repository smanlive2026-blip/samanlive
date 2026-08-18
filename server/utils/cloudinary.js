//  server/utils/cloudinary.js
// ye golden rule h isko hath nhi lgana h  
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
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
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'avif', 'mp4', 'pdf'],
        resource_type: 'auto',
        transformation: [{ width: 1200, crop: "limit", quality: "auto" }]
      };
    }

    // Case 2: User profile pic
    if(req.user && req.user.id) {
      return {
        folder: `users/${req.user.id}/profile`,
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'avif'],
        resource_type: 'image',
        transformation: [{ width: 500, height: 500, crop: "fill", quality: "auto" }]
      };
    }

    // ========== Case 3: BANNER UPLOAD - VIDEO SUPPORT ==========
    if(req.route.path === '/upload/banner') {
      const isVideo = file.mimetype.startsWith('video/');
      
      return {
        folder: `samanlive/banner`,
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'avif', 'mp4', 'mov', 'webm'],
        resource_type: 'auto', // VIDEO + IMAGE DONO
        
        // SIRF IMAGE PE TRANSFORMATION LAGAO
        ...(isVideo ? {} : { 
          transformation: [{ width: 1200, crop: "limit", quality: "auto" }]
        })
      };
    }

    // Default
    return {
      folder: `misc`,
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'avif'],
      resource_type: 'auto'
    };
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB KIYA - VIDEO KE LIYE
});

// Direct URL se upload
const uploadFromUrl = async (url, shopId, template, type) => {
  return await cloudinary.uploader.upload(url, {
    folder: `shops/${shopId}/${template}/${type}`,
    resource_type: 'auto'
  });
}

module.exports = { cloudinary, upload, uploadFromUrl };