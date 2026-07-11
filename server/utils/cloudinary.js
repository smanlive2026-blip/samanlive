// server/utils/cloudinary.js
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// Storage engine - folder auto ban jayega: shops/shop_123/cloth/
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const { shopId, template, type } = req.body; // frontend se bhejna padega

    return {
      folder: `shops/${shopId}/${template}/${type}`, // logo, product, bill
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'pdf'],
      resource_type: 'auto', // photo, video, pdf sab auto detect
      transformation: [
        { width: 1200, crop: "limit", quality: "auto" } // auto compress
      ]
    };
  },
});


const upload = multer({ storage: storage });

// Direct URL se bhi upload karne ka function
const uploadFromUrl = async (url, shopId, template, type) => {
  return await cloudinary.uploader.upload(url, {
    folder: `shops/${shopId}/${template}/${type}`,
    resource_type: 'auto'
  });
}

module.exports = { cloudinary, upload, uploadFromUrl };