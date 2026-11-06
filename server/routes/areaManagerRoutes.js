// ========================================
// AREA MANAGER - EK HI FILE - V25 UNIFIED PROFILE - FULL CODE - NO CUT
// File: server/routes/areaManagerRoutes.js
// Mount: app.use('/api', require('./routes/areaManagerRoutes'))
// Frontend: area-manager.html
// Shop Create alag file me hai: managerShopCreate.js
// CHANGE V25: PUT /manager/update-profile me base64 REJECT, photo = avatar = profilePic sync, city/gender/pincode/coverPhoto save, Dashboard full manager bheje, Delivery Boy photo + vehicleNumber + DeliveryBoy model me bhi banega, Shop Edit logo sync
// RULE: DB me kabhi base64 nahi jayega, sirf Cloudinary URL jayega. Base64 aaya toh 400 dega.
// ========================================
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const Manager = require('../models/Manager');
const Shop = require('../models/Shop');
const Area = require('../models/Area');
const Module = require('../models/Module');

// ========== HELPER: Base64 check - V25 ==========
// Agar photo data:image se start hoti hai toh wo base64 hai - DB me nahi jani chahiye
function isBase64Image(val){
  if(!val || typeof val !== 'string') return false;
  const s = val.trim();
  return s.startsWith('data:image') || s.startsWith('data:application') || (s.length > 5000 && !s.startsWith('http') && !s.startsWith('/') && !s.startsWith('blob:'));
}
function isCloudinaryOrHttpUrl(val){
  if(!val || typeof val !== 'string') return false;
  const s = val.trim();
  if(s === '') return true; // empty = delete karna hai, allowed hai
  return s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/') || s.startsWith('blob:');
}

// ========== HELPER: publicManager - loginToken leak mat karo ==========
function publicManager(m){
  if(!m) return null;
  const o = m.toObject ? m.toObject() : m;
  const pic = o.photo || o.avatar || o.profilePic || '';
  // loginToken / password kabhi frontend ko mat bhejo - sirf delivery link ke liye alag se bhejte hai jahan jarurat hai
  delete o.loginToken;
  delete o.password;
  return {
    ...o,
    photo: pic,
    avatar: pic,
    profilePic: pic,
    coverPhoto: o.coverPhoto || '',
    city: o.city || '',
    state: o.state || '',
    pincode: o.pincode || '',
    address: o.address || '',
    gender: o.gender || '',
    dob: o.dob || null,
    areaName: o.areaName || '',
    areaCode: o.areaCode || '',
    managerCode: o.managerCode || '',
    role: o.role || 'area-manager',
    walletBalance: o.walletBalance || 0,
    totalEarning: o.totalEarning || 0,
    totalDeliveries: o.totalDeliveries || 0,
    isAvailable: o.isAvailable !== undefined ? o.isAvailable : true,
    isOnline: o.isOnline || false,
    isVerified: o.isVerified || false,
    status: o.status,
    isActive: o.isActive
  };
}

// ========== AUTH - Manager Token ==========
const authManager = async (req, res, next) => {
    try {
        const token = ((req.headers.authorization || '').replace('Bearer ', '').trim()
            || req.headers['x-manager-token']
            || req.headers['manager-token']
            || req.headers.token
            || req.query.token
            || req.query.managerToken
            || (req.body && (req.body.managerToken || req.body.token || req.body.loginToken || req.body.authToken)) || '').toString().trim();
        if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

        const manager = await Manager.findOne({ loginToken: token, status: true });
        if (!manager) return res.status(403).json({ success: false, error: 'Manager not found' });

        req.manager = manager;
        next();
    } catch (err) {
        res.status(401).json({ success: false, error: 'Auth failed: ' + err.message });
    }
};

// Shop filter - ek hi logic: pehle areaCode, purani shop ke liye managerCodes/controlledBy fallback
function managerShopFilter(manager) {
    return {
        $or: [
            { areaCode: manager.areaCode },
            { managerCodes: manager.managerCode },
            { controlledBy: manager._id }
        ],
        isActive: true
    };
}

// Dashboard folder check - jiska dashboard hai wahi, nahi hai to common
function fixShopFolder(shop) {
    const folder = shop.templateFolder || shop.folder || shop.template || shop.serviceType || shop.categoryId || 'common';
    const dashPath = path.join(__dirname, '../../public/shop-templates', folder, 'dashboard.html');
    if (!fs.existsSync(dashPath)) { shop.templateFolder = 'common'; shop.folder = 'common'; }
    return shop;
}

// ========== 1. DASHBOARD ==========
router.get('/manager/dashboard', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const area = await Area.findOne({ areaCode: manager.areaCode }).lean();

        const shops = await Shop.find(managerShopFilter(manager))
           .sort({ createdAt: -1 }).lean();
        shops.forEach(fixShopFolder);

        const modules = manager.moduleAccess && manager.moduleAccess.length
           ? await Module.find({ id: { $in: manager.moduleAccess }, status: true }).lean()
            : await Module.find({ status: true }).sort({ name: 1 }).lean();

        // V25: Full manager bhejo - avatar / profilePic / coverPhoto / city / pincode / gender bhi
        const pub = publicManager(manager);

        res.json({
            success: true,
            manager: {
                _id: manager._id, name: manager.name, email: manager.email,
                phone: manager.phone,
                photo: pub.photo, avatar: pub.avatar, profilePic: pub.profilePic, coverPhoto: pub.coverPhoto,
                areaCode: manager.areaCode, areaName: area?.areaName || manager.areaName,
                city: area?.city || manager.city || '', state: area?.state || manager.state || '',
                pincode: manager.pincode || area?.pincode || '',
                address: manager.address || '',
                gender: manager.gender || '',
                dob: manager.dob || null,
                managerCode: manager.managerCode, bucket: manager.bucket,
                role: manager.role || 'area-manager',
                serviceCharge: manager.serviceCharge || 0,
                maxShops: manager.maxShops || 10,
                centerLat: area?.centerLat, centerLng: area?.centerLng,
                radius: area?.radius || manager.radius || 50,
                modules: manager.moduleAccess || [],
                walletBalance: manager.walletBalance || 0,
                totalEarning: manager.totalEarning || 0,
                totalDeliveries: manager.totalDeliveries || 0,
                isAvailable: manager.isAvailable !== undefined ? manager.isAvailable : true,
                isVerified: manager.isVerified || false,
                vehicleType: manager.vehicleType || '',
                vehicleNumber: manager.vehicleNumber || ''
            },
            shops, categories: modules, area,
            stats: {
                totalShops: shops.length,
                activeShops: shops.filter(s => s.isActive).length
            }
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 2. MERI SHOPS LIST ==========
router.get('/manager/shops', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const shops = await Shop.find({
           ...managerShopFilter(manager),
            status: { $in: ['approved', 'active'] }
        }).sort({ createdAt: -1 }).lean();
        shops.forEach(fixShopFolder);

        res.json({ success: true, shops, total: shops.length, areaCode: manager.areaCode });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 3. TOKEN VERIFY (Dashboard load ke liye) ==========
router.get('/manager-by-token/:token', async (req, res) => {
    try {
        const manager = await Manager.findOne({ loginToken: req.params.token, status: true }).lean();
        if (!manager) return res.status(404).json({ success: false, error: 'Invalid token' });
        // V25: loginToken leak mat karo
        res.json({ success: true, manager: publicManager(manager) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/manager/verify-token', async (req, res) => {
    try {
        const token = req.body.token;
        if (!token) return res.json({ success: false, error: 'Token required' });
        const manager = await Manager.findOne({ loginToken: token, status: true }).lean();
        if (!manager) return res.json({ success: false, error: 'Invalid token' });
        res.json({ success: true, manager: publicManager(manager) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 4. PROFILE UPDATE - V26 FIX - NO manager.save(), NO next(), NO Validation 500 ==========
// PEHLE THA: manager.gender = b.gender (bina lowercase) + await manager.save() -> koi bhi purana field alag hua toh Mongoose ValidationError -> 500
// AB: gender toLowerCase + findByIdAndUpdate + runValidators:false + sirf bheje hue field update honge + photo khali hai toh purani photo nahi udegi + next() use hi nahi karenge, isliye "next is not a function" aa hi nahi sakta
router.put('/manager/update-profile', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const b = req.body || {};
        const update = {};

        if (b.name !== undefined) update.name = String(b.name || '').trim();
        if (b.phone !== undefined) update.phone = String(b.phone || '').trim();
        if (b.email !== undefined) update.email = String(b.email || '').toLowerCase().trim();
        if (b.city !== undefined) update.city = String(b.city || '').trim();
        if (b.state !== undefined) update.state = String(b.state || '').trim();
        if (b.pincode !== undefined) update.pincode = String(b.pincode || '').trim();
        if (b.address !== undefined) update.address = typeof b.address === 'string' ? b.address : (b.address?.line1 || '');
        // V26: Male -> male, Female -> female, "" -> "" - enum fail nahi hoga
        if (b.gender !== undefined) update.gender = String(b.gender || '').toLowerCase().trim();
        // V26: dob "" aaye toh null karo, warna Cast to Date failed -> 500
        if (b.dob !== undefined) update.dob = b.dob ? new Date(b.dob) : null;
        if (b.areaName !== undefined) update.areaName = String(b.areaName || '').trim();
        if (b.vehicleType !== undefined) update.vehicleType = b.vehicleType || 'bike';
        if (b.vehicleNumber !== undefined) update.vehicleNumber = String(b.vehicleNumber || '').toUpperCase().trim();
        if (b.isAvailable !== undefined) update.isAvailable = !!b.isAvailable;
        if (b.isOnline !== undefined) update.isOnline = !!b.isOnline;

        // PHOTO - sirf tab jab Cloudinary URL aaya ho, khali / base64 aaye toh ignore karo, purani photo mat udao
        const incomingPhoto = b.photo || b.avatar || b.profilePic || '';
        if (incomingPhoto && String(incomingPhoto).trim() !== '') {
            if (isBase64Image(incomingPhoto)) {
                return res.status(400).json({ success: false, error: 'Base64 photo not allowed - Cloudinary URL bhejo' });
            }
            if (!isCloudinaryOrHttpUrl(incomingPhoto)) {
                return res.status(400).json({ success: false, error: 'Invalid photo URL - http/https Cloudinary URL bhejo' });
            }
            const pic = String(incomingPhoto).trim();
            update.photo = pic;
            update.avatar = pic;
            update.profilePic = pic;
        }
        // Cover photo - alag se
        if (b.coverPhoto !== undefined && b.coverPhoto !== '') {
            if (isBase64Image(b.coverPhoto)) return res.status(400).json({ success: false, error: 'Base64 cover not allowed' });
            update.coverPhoto = String(b.coverPhoto).trim();
        }

        // V26: save() MAT use karo - save() pura Model validate karta hai aur pre-save hook chalata hai, wahi 500 deta tha
        // findByIdAndUpdate + runValidators:false -> sirf bheje hue field update honge, purana data fail nahi karega
        const updated = await Manager.findByIdAndUpdate(manager._id, { $set: update }, { new: true, runValidators: false });
        if (!updated) return res.status(404).json({ success: false, error: 'Manager not found' });

        res.json({ success: true, manager: publicManager(updated), message: 'Profile updated' });
    } catch (err) {
        console.error('Profile update error:', err);
        // V26: next(err) MAT likhna - isi se "next is not a function" aata tha, seedha response bhejo
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 4B. PROFILE PHOTO DELETE - V25 NEW ==========
router.delete('/manager/profile-photo', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        manager.photo = '';
        manager.avatar = '';
        manager.profilePic = '';
        await manager.save();
        res.json({ success: true, manager: publicManager(manager), message: 'Photo deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 5. SHOP EDIT (Sirf apni shop) ==========
router.put('/manager/shops/:id', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ success: false, error: 'Shop not found' });

        const isMine = shop.areaCode === manager.areaCode
            || (shop.managerCodes && shop.managerCodes.includes(manager.managerCode))
            || String(shop.controlledBy || '') === String(manager._id);
        if (!isMine) return res.status(403).json({ success: false, error: 'Access Denied: This shop is not assigned to you' });

        const { location, areaCode, ownerId, managerCodes, claimedBy, controlledBy, createdBy,...rest } = req.body;

        // Sirf allowed field hi update honge
        const allowed = {};
        ['shopName','icon','serviceType','categoryId','template','templateFolder','shopType','phone','contact','range','isActive','description'].forEach(k => {
            if (rest[k]!== undefined) allowed[k] = rest[k];
        });

        // V25: Logo sync - logo bhejoge toh 4 field me jayega - pehle sirf logo me jata tha
        const logoVal = rest.logo || rest.shopLogo || rest.uploadedLogo || rest.image || '';
        if (logoVal !== undefined && logoVal !== '') {
            if (isBase64Image(logoVal)) {
                return res.status(400).json({ success: false, error: 'Base64 logo not allowed - Cloudinary URL bhejo' });
            }
            allowed.logo = logoVal;
            allowed.shopLogo = logoVal;
            allowed.uploadedLogo = logoVal;
            allowed.image = logoVal;
        }

        // V25: Banner sync
        const bannerVal = rest.banner || rest.coverPhoto || rest.cover || '';
        if (bannerVal !== undefined && bannerVal !== '') {
            if (isBase64Image(bannerVal)) {
                return res.status(400).json({ success: false, error: 'Base64 banner not allowed - Cloudinary URL bhejo' });
            }
            allowed.banner = bannerVal;
            allowed.coverPhoto = bannerVal;
            allowed.cover = bannerVal;
        }

        // V25: Owner Photo sync
        const ownerVal = rest.ownerPhotoUrl || rest.ownerPhoto || rest.ownerAvatar || '';
        if (ownerVal !== undefined && ownerVal !== '') {
            if (isBase64Image(ownerVal)) {
                return res.status(400).json({ success: false, error: 'Base64 owner photo not allowed' });
            }
            allowed.ownerPhotoUrl = ownerVal;
            allowed.ownerPhoto = ownerVal;
            allowed.ownerAvatar = ownerVal;
        }

        if (rest.address) {
            allowed.address = (typeof rest.address === 'object')
               ? {...(shop.address?.toObject? shop.address.toObject() : shop.address || {}),...rest.address }
                : { line1: rest.address };
        }

        const updated = await Shop.findByIdAndUpdate(req.params.id, { $set: allowed }, { new: true, runValidators: true });
        res.json({ success: true, shop: updated, message: 'Shop updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 5B. SHOP DELETE (Sirf apni shop) ==========
router.delete('/manager/shops/:id', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ success: false, error: 'Shop not found' });

        const isMine = shop.areaCode === manager.areaCode
            || (shop.managerCodes && shop.managerCodes.includes(manager.managerCode))
            || String(shop.controlledBy || '') === String(manager._id);
        if (!isMine) return res.status(403).json({ success: false, error: 'Access Denied: This shop is not assigned to you' });

        await Shop.findByIdAndUpdate(req.params.id, { $set: { isActive: false, status: 'deleted' } });
        await Manager.findByIdAndUpdate(manager._id, { $inc: { currentShopCount: -1 } });
        res.json({ success: true, message: 'Shop deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 6. AREA INFO ==========
router.get('/manager/area-info', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const area = await Area.findOne({ areaCode: manager.areaCode }).lean();
        const totalShops = await Shop.countDocuments({ areaCode: manager.areaCode });
        const claimedShops = await Shop.countDocuments({ controlledBy: manager._id });
        res.json({ success: true, area, totalShops, claimedShops });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 7. MODULES (Services dropdown ke liye) ==========
router.get('/modules', async (req, res) => {
    try {
        const modules = await Module.find({ status: true }).sort({ name: 1 }).lean();
        res.json({ success: true, modules });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 8. DELIVERY BOY CREATE - V25: Photo + VehicleNumber + DeliveryBoy model ==========
router.post('/manager/create-delivery-manager', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        if (manager.role && manager.role!== 'area-manager') {
            return res.status(403).json({ success: false, message: 'Sirf Area Manager bana sakta hai' });
        }
        const { name, phone, email, vehicleType, vehicleNumber, photo, avatar, profilePic, aadhaarNumber, drivingLicense } = req.body;
        if (!name ||!phone) return res.status(400).json({ success: false, message: 'Name aur Phone zaruri hai' });

        // V25: Photo me base64 aaya toh reject karo
        const incomingPhoto = photo || avatar || profilePic || '';
        if (incomingPhoto && isBase64Image(incomingPhoto)) {
            return res.status(400).json({ success: false, message: 'Base64 photo not allowed - Cloudinary URL bhejo' });
        }
        const pic = incomingPhoto ? String(incomingPhoto).trim() : '';

        const exists = await Manager.findOne({ phone });
        if (exists) return res.status(400).json({ success: false, message: 'Phone already exist' });

        // DeliveryBoy collection me bhi check karo - dono me same phone nahi hona chahiye
        try{
          const DeliveryBoy = require('../models/DeliveryBoy');
          const exists2 = await DeliveryBoy.findOne({ phone: String(phone).trim() });
          if(exists2) return res.status(400).json({ success: false, message: 'Phone already exist in DeliveryBoy' });
        }catch(e){}

        const count = await Manager.countDocuments({ role: 'delivery-manager', areaCode: manager.areaCode });
        const managerCode = `DM-${manager.areaCode}-${count + 1}`;
        const loginToken = crypto.randomBytes(24).toString('hex');

        const dm = new Manager({
            name: String(name).trim(),
            phone: String(phone).trim(),
            email: email? String(email).toLowerCase().trim() : `${managerCode.toLowerCase()}@samanlive.local`,
            loginToken, role: 'delivery-manager',
            areaCode: manager.areaCode, areaName: manager.areaName,
            city: manager.city, state: manager.state,
            managerCode, parentManager: manager._id,
            vehicleType: vehicleType || 'bike',
            vehicleNumber: vehicleNumber ? String(vehicleNumber).toUpperCase().trim() : '',
            drivingLicense: drivingLicense || '',
            aadhaarNumber: aadhaarNumber || '',
            photo: pic, avatar: pic, profilePic: pic,
            status: true
        });
        await dm.save();

        // V25: DeliveryBoy model me bhi banado - taaki delivery-boy.html se login / profile dono jagah se mile
        try{
          const DeliveryBoy = require('../models/DeliveryBoy');
          await DeliveryBoy.create({
            name: String(name).trim(),
            phone: String(phone).trim(),
            email: email? String(email).toLowerCase().trim() : `${managerCode.toLowerCase()}@samanlive.local`,
            loginToken,
            areaCode: manager.areaCode, areaName: manager.areaName,
            city: manager.city, state: manager.state,
            managerId: manager._id, managerCode, parentManager: manager._id,
            vehicleType: vehicleType || 'bike',
            vehicleNumber: vehicleNumber ? String(vehicleNumber).toUpperCase().trim() : '',
            drivingLicense: drivingLicense || '',
            aadhaarNumber: aadhaarNumber || '',
            photo: pic, avatar: pic, profilePic: pic,
            status: true, isActive: true, isAvailable: true
          });
        }catch(e){ console.log('DeliveryBoy create warn - Manager me ban gaya, DeliveryBoy me nahi:', e.message); }

        // V25: loginToken wapas mat bhejo response me - frontend ko link banane ke liye alag se chahiye toh wo delivery-managers list se lega
        res.json({ success: true, message: 'Delivery Boy ban gaya', manager: publicManager(dm) });
    } catch (err) {
        console.error('Create DM error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== 9. DELIVERY BOY LIST - V25: Photo sync + DeliveryBoy bhi ==========
router.get('/manager/delivery-managers', authManager, async (req, res) => {
    try {
        const managers = await Manager.find({ role: 'delivery-manager', areaCode: req.manager.areaCode })
           .sort({ createdAt: -1 }).lean();
        // V25: photo / avatar / profilePic sync karke bhejo + loginToken sirf link ke liye rakho (frontend ko chahiye)
        const cleaned = managers.map(m => {
          const pic = m.photo || m.avatar || m.profilePic || '';
          return { ...m, photo: pic, avatar: pic, profilePic: pic };
        });
        // Agar Manager me koi nahi hai toh DeliveryBoy me dhoondo - fallback
        if(cleaned.length === 0){
          try{
            const DeliveryBoy = require('../models/DeliveryBoy');
            const dbs = await DeliveryBoy.find({ areaCode: req.manager.areaCode }).sort({ createdAt: -1 }).lean();
            if(dbs.length){
              const cleaned2 = dbs.map(m => {
                const pic = m.photo || m.avatar || m.profilePic || '';
                return { ...m, photo: pic, avatar: pic, profilePic: pic, role: 'delivery-manager', managerCode: m.managerCode || '' };
              });
              return res.json({ success: true, managers: cleaned2 });
            }
          }catch(e){}
        }
        res.json({ success: true, managers: cleaned });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== 10. DELIVERY BOY LOCATION UPDATE ==========
router.post('/manager/update-location', async (req, res) => {
    try {
        const { token, lat, lng } = req.body;
        if (!token) return res.status(400).json({ success: false, error: 'Token required' });
        await Manager.findOneAndUpdate({ loginToken: token }, { lastLat: lat, lastLng: lng, lastLocationAt: new Date() });
        // DeliveryBoy me bhi update karo
        try{
          const DeliveryBoy = require('../models/DeliveryBoy');
          await DeliveryBoy.findOneAndUpdate({ loginToken: token }, { currentLocation: { type: 'Point', coordinates: [Number(lng) || 0, Number(lat) || 0] }, lastLocationUpdate: new Date() });
        }catch(e){}
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;