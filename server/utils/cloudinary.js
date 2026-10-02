// LOCATION: server/utils/cloudinary.js
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// MULTER STORAGE FOR VERCEL - YEHI CHAHIYE THA
let storage;
try {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'samanlive/shops',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      resource_type: 'auto'
    }
  });
} catch(e){
  console.log("Storage fallback", e.message);
  storage = multer.memoryStorage();
}

const upload = multer({ storage });

async function uploadFromUrl(url, shopId, template, type){
  const result = await cloudinary.uploader.upload(url, {
    folder: `samanlive/${shopId || 'general'}`,
    resource_type: 'auto'
  });
  return result;
}

async function uploadToCloudinary(filePath, folder='samanlive/shops', options={}){
  try{
    if(!filePath) throw new Error('filePath required');
    const result = await cloudinary.uploader.upload(filePath, {
      folder, resource_type: 'auto', quality: 'auto:good', fetch_format: 'auto', ...options
    });
    try{ if(fs.existsSync(filePath)) fs.unlinkSync(filePath); }catch(e){}
    return { success:true, url:result.secure_url, public_id:result.public_id, result };
  }catch(error){
    return { success:false, error:error.message, url: filePath, fallback:true };
  }
}

async function uploadMultipleToCloudinary(filePaths, folder='samanlive/shops'){
  const results = [];
  for(let filePath of filePaths){
    const result = await uploadToCloudinary(filePath, folder);
    results.push(result);
  }
  return { success:true, results, urls: results.map(r=> r.url) };
}

async function deleteFromCloudinary(publicId){
  try{
    const result = await cloudinary.uploader.destroy(publicId);
    return { success:true, result };
  }catch(error){ return { success:false, error:error.message }; }
}

function getOptimizedUrl(publicId, options={}){
  try{
    const { width, height, quality='auto:good', crop='fill' } = options;
    let transformation = [];
    if(width) transformation.push({ width, crop });
    if(height) transformation.push({ height, crop });
    return cloudinary.url(publicId, { transformation, secure:true, fetch_format:'auto' });
  }catch(e){ return publicId; }
}

function getThumbnailUrl(publicId, size=200){
  return getOptimizedUrl(publicId, { width:size, height:size, crop:'thumb' });
}

async function uploadBase64(base64String, folder='samanlive/shops'){
  try{
    if(base64String.startsWith('http')) return { success:true, url:base64String, isUrl:true };
    const result = await cloudinary.uploader.upload(base64String, { folder, resource_type:'auto' });
    return { success:true, url:result.secure_url, public_id:result.public_id };
  }catch(error){ return { success:false, error:error.message, url:base64String, fallback:true }; }
}

module.exports = {
  cloudinary, upload, uploadFromUrl,
  uploadToCloudinary, uploadMultipleToCloudinary,
  deleteFromCloudinary, getOptimizedUrl, getThumbnailUrl, uploadBase64
};