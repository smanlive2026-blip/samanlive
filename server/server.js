require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MONGODB CONNECTION ====================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/samanlive')
.then(() => console.log('MongoDB Connected ✅'))
.catch(err => console.log('MongoDB Error:', err));

// ==================== MIDDLEWARE ====================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/admin-panel', express.static(path.join(__dirname, 'admin-panel')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads folder if not exists
const uploadsDir = path.join(__dirname, 'public/uploads/managers');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ==================== MODELS ====================
const Manager = require('./models/Manager');
const Shop = require('./models/Shop');
const Module = require('./models/Module');
const Content = require('./models/Content');
const ShopHistory = require('./models/ShopHistory');
const Setting = require('./models/Setting');

const User = mongoose.model('User', new mongoose.Schema({
  userId: { type: String, unique: true },
  name: { type: String, required: true },
  phone: String,
  email: String,
  password: String,
  profilePic: { type: String, default: '/assets/default-avatar.png' },
  bio: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  addresses: [],
  payments: [],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  notifications: [],
  settings: {
    notifOrders: { type: Boolean, default: true },
    notifPromos: { type: Boolean, default: true },
    notifPush: { type: Boolean, default: true },
    notifEmail: { type: Boolean, default: false },
    privacyLocation: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false }
  },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null },
  language: { type: String, default: 'hi' },
  qrCodeData: String,
  hasShop: { type: Boolean, default: false },
  googleId: String
}, { timestamps: true }));

const Product = mongoose.model('Product', new mongoose.Schema({
  name: String,
  price: Number,
  oldPrice: Number,
  image: String,
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  category: String,
  stock: { type: Number, default: 0 },
  status: { type: Boolean, default: true }
}, { timestamps: true }));

const Order = mongoose.model('Order', new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId, 
  orderId: String,
  items: [{ productId: String, name: String, image: String, price: Number, quantity: Number }],
  totalAmount: Number, 
  status: { type: String, default: 'pending' }, 
  shopName: String, 
  createdAt: { type: Date, default: Date.now }
}));

// ==================== MIDDLEWARE IMPORTS ====================
const authenticateToken = require('./middleware/authenticateToken');

// ==================== ROUTES IMPORT ====================
const managerRoutes = require('./routes/managers');
const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api', managerRoutes);
app.use('/api', shopRoutes);
app.use('/api', adminRoutes);
app.use('/api/market', require('./routes/market'));
app.use('/api/area-managers', require('./routes/area-manager'));
app.use('/api', require('./routes/userAddresses'));
app.use('/api', require('./routes/userPayments'));
app.use('/api', require('./routes/wishlist'));
app.use('/api', require('./routes/orders'));
app.use('/api', require('./routes/notifications'));

// ==================== HELPER FUNCTIONS ====================
async function generateUserId() {
    const count = await User.countDocuments();
    return `USER${String(count + 1).padStart(3, '0')}`;
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function isPointInPolygon(point, vs) {
    const x = point[0], y = point[1];
    let inside = false;
    for(let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];
        const intersect = ((yi > y)!== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if(intersect) inside =!inside;
    }
    return inside;
}

function checkModuleInArea(module, userLat, userLng) {
    if(!module.areas || module.areas.length === 0) return { inArea: true, distance: 0 };
    for(let area of module.areas) {
        if(area.type === 'circle') {
            const dist = getDistance(userLat, userLng, area.lat, area.lng);
            if(dist <= area.radius) return { inArea: true, distance: Math.round(dist) };
        }
        if(area.type === 'polygon') {
            if(isPointInPolygon([userLat, userLng], area.coordinates)) return { inArea: true, distance: 0 };
        }
    }
    return { inArea: false, distance: 0 };
}

// ==================== HTML ROUTES ====================
const htmlFiles = ['/', '/index.html', '/profile.html', '/profile/addresses.html', '/profile/create-shop.html',
  '/profile/details.html', '/profile/help.html', '/profile/wishlist.html', '/profile/orders.html',
  '/profile/payments.html', '/profile/settings.html'];

htmlFiles.forEach(route => {
  app.get(route, (req, res) => {
    const file = route === '/'? 'index.html' : route.substring(1);
    res.sendFile(path.join(__dirname, file));
  });
});

app.get('/admin-panel/', (req, res) => res.sendFile(path.join(__dirname, 'admin-panel/index.html')));

// ==================== USER AUTH ====================
app.post('/api/user/send-otp', async (req, res) => {
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  let user = await User.findOne({ phone });
  if (!user) user = new User({ phone });
  user.otp = otp; user.otpExpiry = Date.now() + 300000;
  await user.save();
  res.json({ success: true, message: 'OTP sent' });
});

app.post('/api/user/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  const user = await User.findOne({ phone, otp, otpExpiry: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ error: 'Invalid OTP' });
  user.otp = null; user.otpExpiry = null; await user.save();
  const token = jwt.sign({ userId: user._id, role: 'user' }, process.env.JWT_SECRET || 'samanlive_secret_key');
  res.json({ success: true, token, user });
});

app.post('/api/user/google-login', async (req, res) => {
  const { googleId, email, name, picture } = req.body;
  let user = await User.findOne({ $or: [{ googleId }, { email }] });
  if (!user) {
    const userId = await generateUserId();
    user = await new User({ userId, googleId, email, name, profilePic: picture }).save();
  }
  const token = jwt.sign({ userId: user._id, role: 'user' }, process.env.JWT_SECRET || 'samanlive_secret_key');
  res.json({ success: true, token, user });
});

app.get('/api/user/profile', authenticateToken, async (req, res) => {
  const user = await User.findById(req.userId).select('-password -otp');
  res.json({ success: true, user });
});

app.put('/api/user/update', authenticateToken, async (req, res) => {
  await User.findByIdAndUpdate(req.userId, req.body);
  res.json({ success: true });
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  const user = await User.findById(req.userId).select('name email phone profilePic role shopId hasShop');
  res.json({ success: true, user });
});

// ==================== HOME PAGE APIS ====================
app.get('/api/top-ads', async (req, res) => {
  const { area } = req.query;
  const query = { type: 'ad', status: 'active' };
  if (area && area!== 'all') query.area = { $in: [area, 'all'] };
  const ads = await Content.find(query).sort({ priority: -1 }).limit(50);
  res.json({ success: true, ads });
});

app.get('/api/shops/nearby', async (req, res) => {
  const { area } = req.query;
  let query = { status: 'approved', isActive: true };
  if (area) query.area = area;
  const shops = await Shop.find(query).limit(20);
  const shopsData = shops.map(shop => {
    const shopObj = shop.toObject();
    if (!shop.bannerApproved) shopObj.banner = '';
    return shopObj;
  });
  res.json({ success: true, shops: shopsData });
});

app.get('/api/videos/live', async (req, res) => {
  const { area } = req.query;
  const query = { type: 'video', status: 'active' };
  if (area && area!== 'all') query.area = { $in: [area, 'all'] };
  const videos = await Content.find(query).sort({ priority: -1 }).limit(20);
  res.json({ success: true, videos });
});

app.get('/api/services', async (req, res) => {
  res.json({ success: true, services: [] });
});

app.get('/api/campaigns', async (req, res) => {
  const { area } = req.query;
  const query = { type: 'campaign', status: 'active' };
  if (area && area!== 'all') query.area = { $in: [area, 'all'] };
  const campaigns = await Content.find(query).sort({ priority: -1 });
  res.json({ success: true, campaigns });
});

// ==================== MODULES ====================
app.get('/api/modules', async (req, res) => {
  const { area } = req.query;
  let modules = await Module.find({ status: true }).sort({ priority: -1 });

  if (area && area!== 'all') {
    modules = modules.filter(m => {
      if (!m.areas || m.areas.length === 0) return true;
      return m.areas.some(a => a.areaId === area && a.status === true);
    });

    modules = modules.map(m => {
      const filteredCategories = m.categories.filter(cat => {
        if (!cat.areas || cat.areas.length === 0) return cat.status;
        return cat.status && cat.areas.some(a => a.areaId === area && a.status === true);
      });
      return {...m.toObject(), categories: filteredCategories };
    });
  }

  res.json(modules);
});

app.post('/api/modules', async (req, res) => {
  const module = new Module(req.body);
  await module.save();
  res.json({ success: true, module });
});

app.put('/api/modules/:id', async (req, res) => {
  const module = await Module.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, module });
});

app.delete('/api/modules/:id', async (req, res) => {
  await Module.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ==================== CONTENT ====================
app.get('/api/content', async (req, res) => {
  const content = await Content.find().sort({ createdAt: -1 });
  res.json(content);
});

app.post('/api/content', authenticateToken, async (req, res) => {
  const content = new Content(req.body);
  await content.save();
  res.json({ success: true, data: content });
});

app.put('/api/content/:id', authenticateToken, async (req, res) => {
  const content = await Content.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!content) return res.status(404).json({ error: 'Content nahi mila' });
  res.json({ success: true, data: content });
});

app.delete('/api/content/:id', authenticateToken, async (req, res) => {
  const content = await Content.findByIdAndDelete(req.params.id);
  if (!content) return res.status(404).json({ error: 'Content nahi mila' });
  res.json({ success: true });
});

// ==================== STATS ====================
app.get('/api/stats', async (req, res) => {
  const [users, shops, modules, content, managers] = await Promise.all([
    User.countDocuments(), Shop.countDocuments(), Module.countDocuments(),
    Content.countDocuments(), Manager.countDocuments()
  ]);
  res.json({ users, shops, modules, content, managers });
});

// ==================== SETTINGS ====================
app.get('/api/settings/mongo', async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({
        logoText: 'SAMANLIVE',
        headerColor: '#1e40af',
        footerColor: '#1e293b',
        footerText: '© 2026 SAMANLIVE',
        footerAbout: 'Best services in your city',
        footerLinks: [],
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: ''
      });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings/mongo', async (req, res) => {
  try {
    const settings = await Setting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== AREA MANAGER ====================
app.post('/api/area-manager/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const manager = await Manager.findOne({ email });
    if (!manager ||!await bcrypt.compare(password, manager.password)) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    manager.lastLogin = new Date();
    await manager.save();
    const token = jwt.sign({ managerId: manager._id, role: 'manager' }, process.env.JWT_SECRET || 'samanlive_secret_key');
    res.json({ success: true, token, manager });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/manager/dashboard', authenticateToken, async (req, res) => {
  try {
    const manager = await Manager.findById(req.userId);
    const shops = await Shop.find({ managerId: req.userId });
    const categories = await Module.find({ status: true });
    res.json({ success: true, manager, shops, categories });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== 404 & ERROR HANDLER ====================
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found', path: req.originalUrl });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-panel', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});