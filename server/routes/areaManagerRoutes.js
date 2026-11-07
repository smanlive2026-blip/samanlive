// ========================================
// AREA MANAGER - EK HI FILE - V27 FINAL - FULL CODE - NO CUT
// File: server/routes/areaManagerRoutes.js
// Mount: app.use('/api', require('./routes/areaManagerRoutes'))
// Frontend: area-manager.html
// Shop Create alag file me hai: managerShopCreate.js
// CHANGE V27: 1) update-profile me phone normalize (10 digit) + email/phone duplicate check -> 409 Hindi me, 500 nahi 2) profile-photo delete me save() hataya, findByIdAndUpdate lagaya 3) create-delivery-manager me phone normalize + dono model me duplicate check + E11000 -> 409 4) delivery-managers list me loginToken leak band 5) update-location me Manager ka currentLocation geo use kiya
// RULE: DB me kabhi base64 nahi jayega, sirf Cloudinary URL jayega. Pehchan = Phone (10 digit). Update hamesha _id se, areaCode se kabhi nahi.
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

// ========== HELPER: Normalize - V27 ==========
// findByIdAndUpdate pe Model setter nahi chalta, isliye yahan haath se normalize karna padega - warna +91 wala phone aise hi save ho jayega
function normPhone(v) {
    if (v === undefined || v === null) return '';
    const d = String(v).replace(/\D/g, '');
    if (!d) return '';
    return d.length > 10 ? d.slice(-10) : d;
}
function normEmail(v) {
    if (v === undefined || v === null) return '';
    return String(v).toLowerCase().trim();
}
function dupError(res, field, val, who) {
    return res.status(409).json({ success: false, error: `Ye ${field} (${val}) pehle se kisi aur Manager (${who || ''}) ka hai. Dusra ${field} use karo.` });
}
function handleDupErr(res, err) {
    if (err && (err.code === 11000 || String(err.message || '').includes('E11000'))) {
        const f = Object.keys(err.keyValue || {})[0] || 'phone/email';
        return res.status(409).json({ success: false, error: `Ye ${f} (${err.keyValue ? err.keyValue[f] : ''}) pehle se kisi aur ka hai. Dusra ${f} use karo.` });
    }
    return null;
}

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

// ========== 4. PROFILE UPDATE - V27 FINAL - Duplicate -> 409 Hindi, 500 nahi ==========
router.put('/manager/update-profile', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const b = req.body || {};
        const update = {};

        if (b.name !== undefined) update.name = String(b.name || '').trim();
        // V27: Phone - normalize + duplicate check - apni hi phone dobara dalne pe duplicate mat bolna
        if (b.phone !== undefined && String(b.phone || '').trim() !== '') {
            const ph = normPhone(b.phone);
            const other = await Manager.findOne({ phone: ph, _id: { $ne: manager._id } }).lean();
            if (other) return dupError(res, 'phone', ph, other.name || other.managerCode);
            update.phone = ph;
        }
        // V27: Email - normalize + duplicate check - apni hi email dobara dalne pe duplicate mat bolna
        if (b.email !== undefined && String(b.email || '').trim() !== '') {
            const em = normEmail(b.email);
            const other = await Manager.findOne({ email: em, _id: { $ne: manager._id } }).lean();
            if (other) return dupError(res, 'email', em, other.name || other.managerCode);
            update.email = em;
        }
        if (b.city !== undefined) update.city = String(b.city || '').trim();
        if (b.state !== undefined) update.state = String(b.state || '').trim();
        if (b.pincode !== undefined) update.pincode = String(b.pincode || '').trim();
        if (b.address !== undefined) update.address = typeof b.address === 'string' ? b.address : (b.address?.line1 || '');
        // V27: Male -> male, Female -> female, "" -> "" - enum fail nahi hoga
        if (b.gender !== undefined) update.gender = String(b.gender || '').toLowerCase().trim();
        // V27: dob "" aaye toh null karo, warna Cast to Date failed -> 500
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

        // V27: save() MAT use karo - save() pura Model validate karta hai, wahi 500 deta tha
        // findByIdAndUpdate + runValidators:false -> sirf bheje hue field update honge
        const updated = await Manager.findByIdAndUpdate(manager._id, { $set: update }, { new: true, runValidators: false });
        if (!updated) return res.status(404).json({ success: false, error: 'Manager not found' });

        res.json({ success: true, manager: publicManager(updated), message: 'Profile updated' });
    } catch (err) {
        console.error('Profile update error:', err);
        const dup = handleDupErr(res, err);
        if (dup) return dup;
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 4B. PROFILE PHOTO DELETE - V27: save() hataya ==========
router.delete('/manager/profile-photo', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        // V27: Pehle tha manager.save() - purana data alag hua toh photo delete karte time bhi 500 aata tha
        const updated = await Manager.findByIdAndUpdate(manager._id, { $set: { photo: '', avatar: '', profilePic: '' } }, { new: true, runValidators: false });
        res.json({ success: true, manager: publicManager(updated), message: 'Photo deleted' });
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

        const { location, areaCode, ownerId, managerCodes, claimedBy, controlledBy, createdBy, ...rest } = req.body;

        // Sirf allowed field hi update honge
        const allowed = {};
        ['shopName','icon','serviceType','categoryId','template','templateFolder','shopType','phone','contact','range','isActive','description'].forEach(k => {
            if (rest[k] !== undefined) allowed[k] = rest[k];
        });
        if (allowed.phone) allowed.phone = normPhone(allowed.phone);

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
               ? { ...(shop.address?.toObject ? shop.address.toObject() : shop.address || {}), ...rest.address }
                : { line1: rest.address };
        }

        const updated = await Shop.findByIdAndUpdate(req.params.id, { $set: allowed }, { new: true, runValidators: false });
        res.json({ success: true, shop: updated, message: 'Shop updated successfully' });
    } catch (err) {
        const dup = handleDupErr(res, err);
        if (dup) return dup;
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

// ========== 8. DELIVERY BOY CREATE - V27: Phone normalize + dono model check + loginToken leak band ==========
router.post('/manager/create-delivery-manager', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        if (manager.role && manager.role !== 'area-manager') {
            return res.status(403).json({ success: false, message: 'Sirf Area Manager bana sakta hai' });
        }
        const { name, phone, email, vehicleType, vehicleNumber, photo, avatar, profilePic, aadhaarNumber, drivingLicense } = req.body;
        if (!name || !phone) return res.status(400).json({ success: false, message: 'Name aur Phone zaruri hai' });

        // V27: Phone normalize - +91 wala aur bina +91 wala same lagega
        const normPh = normPhone(phone);
        const normEm = email ? normEmail(email) : '';

        // V27: Photo me base64 aaya toh reject karo
        const incomingPhoto = photo || avatar || profilePic || '';
        if (incomingPhoto && isBase64Image(incomingPhoto)) {
            return res.status(400).json({ success: false, message: 'Base64 photo not allowed - Cloudinary URL bhejo' });
        }
        const pic = incomingPhoto ? String(incomingPhoto).trim() : '';

        // V27: Dono model me normalized phone se check karo - pehle raw phone se check hota tha, isliye +91 wala duplicate ban jata tha
        const exists = await Manager.findOne({ phone: normPh }).lean();
        if (exists) return res.status(409).json({ success: false, message: `Phone (${normPh}) pehle se hai - ${exists.name || exists.managerCode}` });
        try {
          const DeliveryBoy = require('../models/DeliveryBoy');
          const exists2 = await DeliveryBoy.findOne({ phone: normPh }).lean();
          if (exists2) return res.status(409).json({ success: false, message: `Phone (${normPh}) pehle se DeliveryBoy me hai - ${exists2.name || ''}` });
        } catch (e) {}

        // V27: managerCode unique banao - count + time, taaki delete ke baad dobara banane pe takraye nahi
        let managerCode = '';
        for (let attempt = 0; attempt < 5; attempt++) {
            const count = await Manager.countDocuments({ role: 'delivery-manager', areaCode: manager.areaCode });
            const cand = `DM-${String(manager.areaCode).toUpperCase()}-${count + 1 + attempt}`;
            const taken = await Manager.findOne({ managerCode: cand }).lean();
            if (!taken) { managerCode = cand; break; }
        }
        if (!managerCode) managerCode = `DM-${String(manager.areaCode).toUpperCase()}-${Date.now().toString().slice(-6)}`;
        const loginToken = crypto.randomBytes(24).toString('hex');
        const finalEmail = normEm || `${managerCode.toLowerCase()}@samanlive.local`;

        const dm = new Manager({
            name: String(name).trim(),
            phone: normPh,
            email: finalEmail,
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

        // V27: DeliveryBoy model me bhi banado - taaki delivery-boy.html se login / profile dono jagah se mile
        try {
          const DeliveryBoy = require('../models/DeliveryBoy');
          await DeliveryBoy.create({
            name: String(name).trim(),
            phone: normPh,
            email: finalEmail,
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
        } catch (e) { console.log('DeliveryBoy create warn - Manager me ban gaya, DeliveryBoy me nahi:', e.message); }

        // V27: loginToken wapas mat bhejo response me - frontend ko link banane ke liye alag se chahiye toh wo delivery-managers list se lega
        res.json({ success: true, message: 'Delivery Boy ban gaya', manager: publicManager(dm) });
    } catch (err) {
        console.error('Create DM error:', err);
        const dup = handleDupErr(res, err);
        if (dup) return dup;
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== 9. DELIVERY BOY LIST - V27: loginToken leak band ==========
router.get('/manager/delivery-managers', authManager, async (req, res) => {
    try {
        const managers = await Manager.find({ role: 'delivery-manager', areaCode: req.manager.areaCode })
           .sort({ createdAt: -1 }).lean();
        // V27: Pehle ...m me loginToken bhi aa jata tha - ab publicManager se saaf karke bhejenge
        const cleaned = managers.map(m => publicManager(m));
        // Agar Manager me koi nahi hai toh DeliveryBoy me dhoondo - fallback
        if (cleaned.length === 0) {
          try {
            const DeliveryBoy = require('../models/DeliveryBoy');
            const dbs = await DeliveryBoy.find({ areaCode: req.manager.areaCode }).sort({ createdAt: -1 }).lean();
            if (dbs.length) {
              const cleaned2 = dbs.map(m => {
                const pic = m.photo || m.avatar || m.profilePic || '';
                const { loginToken, password, ...rest } = m;
                return { ...rest, photo: pic, avatar: pic, profilePic: pic, role: 'delivery-manager', managerCode: m.managerCode || '' };
              });
              return res.json({ success: true, managers: cleaned2 });
            }
          } catch (e) {}
        }
        res.json({ success: true, managers: cleaned });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 10. DELIVERY BOY LOCATION UPDATE ==========
router.post('/manager/update-location', async (req, res) => {
    try {
        const { token, lat, lng } = req.body;
        if (!token) return res.status(400).json({ success: false, error: 'Token required' });
        const la = Number(lat) || 0;
        const lo = Number(lng) || 0;
        // V27: Pehle tha lastLat/lastLng - wo field Model me hai hi nahi, isliye update hota hi nahi tha. Ab currentLocation geo pe karenge
        await Manager.findOneAndUpdate(
            { loginToken: token },
            { $set: { currentLocation: { type: 'Point', coordinates: [lo, la] }, lastLocationUpdate: new Date() } }
        );
        // DeliveryBoy me bhi update karo
        try {
          const DeliveryBoy = require('../models/DeliveryBoy');
          await DeliveryBoy.findOneAndUpdate({ loginToken: token }, { currentLocation: { type: 'Point', coordinates: [lo, la] }, lastLocationUpdate: new Date() });
        } catch (e) {}
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;