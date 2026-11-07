// LOCATION: server/utils/shopId.js
// WORLD CLASS SHOP ID UTILS - FULL 150+ LINES - PRODUCTION READY
// V27 FINAL CHANGE: 1) getShopId() ADD kiya - ye function tha hi nahi, par achar-route.js / media.js isko maang rahe the, isliye sab 500 tha 2) checkShopIdExists() ab asli DB check karega, mock nahi 3) getShopId sirf URL param se lega, body/query se kabhi nahi - warna koi dusri shop ka data badal dega
// RULE: shopId = Shop._id (Mongo ObjectId). URL me ?shopId=xxx aayega toh wahi shopId hai.

// Generate shop ID from name
function generateShopId(shopName, area, city){
  try{
    if(!shopName){
      return 'shop_'+Date.now()+Math.random().toString(36).substr(2,5);
    }

    // Clean shop name: lowercase, replace spaces with -, remove special chars
    const cleanName = shopName
     .toLowerCase()
     .trim()
     .replace(/[^a-z0-9\s-]/g,'')
     .replace(/\s+/g,'-')
     .replace(/-+/g,'-')
     .substring(0,20);

    // Clean area and city
    const cleanArea = area? area.toLowerCase().trim().replace(/[^a-z0-9]/g,'').substring(0,10) : '';
    const cleanCity = city? city.toLowerCase().trim().replace(/[^a-z0-9]/g,'').substring(0,10) : '';

    // Generate unique suffix
    const suffix = Date.now().toString().slice(-4) + Math.random().toString(36).substr(2,3);

    // Combine: name-area-city-suffix
    let shopId = cleanName;

    if(cleanArea) shopId += `-${cleanArea}`;
    if(cleanCity) shopId += `-${cleanCity}`;

    shopId += `-${suffix}`;

    // Ensure max 50 chars
    if(shopId.length>50){
      shopId = shopId.substring(0,50);
    }

    return shopId;

  }catch(error){
    return 'shop_'+Date.now()+Math.random().toString(36).substr(2,9);
  }
}

// Generate short shop ID (for display)
function generateShortShopId(shopName){
  try{
    if(!shopName) return 'SHOP'+Date.now().toString().slice(-6);

    const initials = shopName
     .split(' ')
     .map(word=> word.charAt(0).toUpperCase())
     .join('')
     .substring(0,4);

    const number = Date.now().toString().slice(-4);

    return `${initials}${number}`;

  }catch(error){
    return 'SHOP'+Date.now().toString().slice(-6);
  }
}

// Validate shop ID
function isValidShopId(shopId){
  if(!shopId) return false;
  if(typeof shopId!=='string') return false;
  if(shopId.length<3) return false;
  if(shopId.length>100) return false;

  // Allow alphanumeric, -, _
  const validPattern = /^[a-zA-Z0-9-_]+$/;

  return validPattern.test(shopId);
}

// Extract info from shop ID
function parseShopId(shopId){
  try{
    if(!shopId) return null;

    const parts = shopId.split('-');

    return {
      original:shopId,
      name:parts[0]||'',
      area:parts[1]||'',
      city:parts[2]||'',
      suffix:parts[parts.length-1]||'',
      parts
    };

  }catch(error){
    return { original:shopId, name:shopId, area:'', city:'', suffix:'' };
  }
}

// Generate shop slug for URL
function generateShopSlug(shopName, shopId){
  try{
    if(!shopName) return shopId||'shop';

    const slug = shopName
     .toLowerCase()
     .trim()
     .replace(/[^a-z0-9\s-]/g,'')
     .replace(/\s+/g,'-')
     .replace(/-+/g,'-')
     .substring(0,30);

    return `${slug}-${shopId? shopId.slice(-6) : Date.now().toString().slice(-6)}`;

  }catch(error){
    return shopId||'shop';
  }
}

// Generate shop link
function generateShopLink(shopId, baseUrl='https://samanlive.com'){
  try{
    if(!shopId) return baseUrl;

    return `${baseUrl}/shop/${shopId}`;

  }catch(error){
    return baseUrl;
  }
}

// Generate QR code data for shop
function generateShopQRData(shopId, shopName){
  try{
    const shopLink = generateShopLink(shopId);

    return {
      shopId,
      shopName:shopName||'My Shop',
      link:shopLink,
      qrText:shopLink,
      vCard:`BEGIN:VCARD\nFN:${shopName||'My Shop'}\nURL:${shopLink}\nEND:VCARD`
    };

  }catch(error){
    return { shopId, link:shopId, qrText:shopId };
  }
}

// Check if shop ID exists - V27: Ab asli DB check karega, mock nahi
async function checkShopIdExists(shopId){
  try{
    if(!shopId) return false;
    // Agar Mongo ObjectId hai toh Shop collection me dhoondho
    const mongoose = require('mongoose');
    if(mongoose.Types.ObjectId.isValid(String(shopId))){
      const Shop = require('../models/Shop');
      const shop = await Shop.findById(shopId).select('_id').lean();
      return !!shop;
    }
    // Agar slug jaisa shopId hai toh shopName/slug se dhoondho - purana code ke liye
    const Shop = require('../models/Shop');
    const shop2 = await Shop.findOne({ $or: [{ shopName: shopId }] }).select('_id').lean();
    return !!shop2;
  }catch(error){
    return false;
  }
}

// Generate unique shop ID with DB check
async function generateUniqueShopId(shopName, area, city){
  try{
    let attempts = 0;
    let shopId = generateShopId(shopName, area, city);

    while(attempts<5){
      const exists = await checkShopIdExists(shopId);
      if(!exists) break;

      // If exists, generate new one with different suffix
      shopId = generateShopId(shopName, area, city) + Math.random().toString(36).substr(2,2);
      attempts++;
    }

    return shopId;

  }catch(error){
    return generateShopId(shopName, area, city);
  }
}

// ============================================================================
// V27 NEW - getShopId - YE FUNCTION THA HI NAHI, ISILIYE ACHAR SAB 500 THA
// ============================================================================
// RULE: shopId hamesha URL param se aayega - /api/shops/achar/:shopId
// Body / query se kabhi mat lo - warna koi body me dusri shopId bhej ke dusri shop ka data badal dega
// Return: String (trimmed) ya '' agar nahi hai
function getShopId(req){
  try{
    if(!req || !req.params) return '';
    const id = req.params.shopId || req.params.id || req.params.shopid || '';
    return String(id || '').trim();
  }catch(e){
    return '';
  }
}

module.exports = {
  generateShopId,
  generateShortShopId,
  isValidShopId,
  parseShopId,
  generateShopSlug,
  generateShopLink,
  generateShopQRData,
  checkShopIdExists,
  generateUniqueShopId,
  getShopId
};