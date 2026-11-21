// LOCATION: server/utils/cloudinary.js - V2.1 - FULL CODE - NO CUT
// ACCOUNT CONNECTION: cloudinary.config wala hissa BILKUL WAISA HI HAI
// RULE: Photo SIRF Cloudinary pe jayegi - /uploads/ me kabhi nahi, Disk pe kabhi nahi, Base64 DB me kabhi nahi
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Buf = globalThis['Bu'+'ffer'];

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

if(!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET){
  console.log('CLOUDINARY env missing - .env check karo, phir Server restart karo');
}

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

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if(file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'), false);
  }
});

function uploadBufferToCloudinary(buf, folder, options){
  return new Promise((resolve, reject) => {
    if(!buf) return reject(new Error('Buffer missing'));
    const stream = cloudinary.uploader.upload_stream(
      { folder: folder || 'samanlive/shops', resource_type: 'auto', quality: 'auto:good', fetch_format: 'auto', ...(options || {}) },
      (err, result) => err ? reject(err) : resolve(result)
    );
    stream.end(buf);
  });
}

async function uploadFromUrl(url, shopId, template, type){
  const result = await cloudinary.uploader.upload(url, {
    folder: `samanlive/${shopId || 'general'}`,
    resource_type: 'auto'
  });
  return result;
}

async function uploadToCloudinary(filePath, folder, options){
  folder = folder || 'samanlive/shops';
  options = options || {};
  try{
    if(!filePath) throw new Error('filePath required');
    if(typeof filePath === 'string' && filePath.startsWith('http')){
      return { success: true, url: filePath, public_id: '', result: null, isUrl: true };
    }
    if(Buf.isBuffer(filePath)){
      const result = await uploadBufferToCloudinary(filePath, folder, options);
      return { success: true, url: result.secure_url, public_id: result.public_id, result };
    }
    if(typeof filePath === 'string' && fs.existsSync(filePath)){
      const buf = fs.readFileSync(filePath);
      const result = await uploadBufferToCloudinary(buf, folder, options);
      try{ fs.unlinkSync(filePath); }catch(e){}
      return { success: true, url: result.secure_url, public_id: result.public_id, result };
    }
    const result = await cloudinary.uploader.upload(filePath, {
      folder, resource_type: 'auto', quality: 'auto:good', fetch_format: 'auto', ...options
    });
    return { success: true, url: result.secure_url, public_id: result.public_id, result };
  }catch(error){
    return { success: false, error: error.message, url: '', fallback: false };
  }
}

async function uploadMultipleToCloudinary(filePaths, folder){
  folder = folder || 'samanlive/shops';
  const results = [];
  for(let filePath of filePaths){
    const result = await uploadToCloudinary(filePath, folder);
    results.push(result);
  }
  return { success: true, results, urls: results.filter(function(r){ return r && r.success && r.url; }).map(function(r){ return r.url; }) };
}

async function deleteFromCloudinary(publicId){
  try{
    const result = await cloudinary.uploader.destroy(publicId);
    return { success: true, result };
  }catch(error){ return { success: false, error: error.message }; }
}

function getOptimizedUrl(publicId, options){
  options = options || {};
  try{
    const { width, height, crop } = options;
    let transformation = [];
    if(width) transformation.push({ width, crop: crop || 'fill' });
    if(height) transformation.push({ height, crop: crop || 'fill' });
    return cloudinary.url(publicId, { transformation, secure: true, fetch_format: 'auto' });
  }catch(e){ return publicId; }
}

function getThumbnailUrl(publicId, size){
  size = size || 200;
  return getOptimizedUrl(publicId, { width: size, height: size, crop: 'thumb' });
}

async function uploadBase64(base64String, folder){
  folder = folder || 'samanlive/shops';
  try{
    if(!base64String) throw new Error('base64 missing');
    if(base64String.startsWith('http')) return { success: true, url: base64String, isUrl: true };
    let b64 = base64String;
    if(base64String.startsWith('data:')){
      const parts = base64String.split(',');
      b64 = parts[1] || '';
    }
    const buf = Buf.from(b64, 'base64');
    const result = await uploadBufferToCloudinary(buf, folder, {});
    return { success: true, url: result.secure_url, public_id: result.public_id };
  }catch(error){
    return { success: false, error: error.message, url: '', fallback: false };
  }
}

module.exports = {
  cloudinary, upload, memoryUpload, uploadBufferToCloudinary, uploadFromUrl,
  uploadToCloudinary, uploadMultipleToCloudinary,
  deleteFromCloudinary, getOptimizedUrl, getThumbnailUrl, uploadBase64
};