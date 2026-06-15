// 1. Manager Login
app.post('/api/area-manager/login', async (req, res) => {
    const { email, password } = req.body;
    const manager = await Manager.findOne({ email });
    if (!manager || manager.password!== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({
        success: true,
        token: manager.loginToken,
        manager: manager
    });
});

// 2. Manager Dashboard Data - AREA CODE + BUCKET BHI BHEJO
app.get('/api/manager/dashboard', authenticateManager, async (req, res) => {
    const manager = req.manager; // middleware se aayega
    const shops = await Shop.find({
        areaCode: manager.areaCode,
        moduleId: { $in: manager.moduleAccess }
    });
    const categories = await Category.find({ id: { $in: manager.moduleAccess } });

    res.json({
        success: true,
        manager: {
            name: manager.name,
            email: manager.email,
            area: manager.areaName || manager.area,
            areaCode: manager.areaCode, // NEW
            managerCode: manager.managerCode, // NEW
            bucket: manager.bucket, // NEW
            serviceCharge: manager.serviceCharge, // NEW
            modules: manager.moduleAccess
        },
        shops,
        categories
    });
});

// 3. Add Shop - AREA CODE AUTO ADD HOGA
app.post('/api/manager/shop', authenticateManager, async (req, res) => {
    const manager = req.manager;
    const shopData = {
       ...req.body,
        areaCode: manager.areaCode, // Auto add
        areaName: manager.areaName, // Auto add
        managerId: manager._id, // Auto add
        bucket: manager.bucket, // Auto add
        status: true
    };
    const shop = await Shop.create(shopData);
    res.json({ success: true, shop });
});

// 4. Edit/Delete Shop - Sirf apne area ki shop
app.put('/api/manager/shop/:id', authenticateManager, async (req, res) => {
    const shop = await Shop.findOne({
        _id: req.params.id,
        areaCode: req.manager.areaCode // Security check
    });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    Object.assign(shop, req.body);
    await shop.save();
    res.json({ success: true, shop });
});

app.delete('/api/manager/shop/:id', authenticateManager, async (req, res) => {
    await Shop.deleteOne({
        _id: req.params.id,
        areaCode: req.manager.areaCode
    });
    res.json({ success: true });
});

// Middleware - Token se manager nikalna
async function authenticateManager(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    const manager = await Manager.findOne({ loginToken: token });
    if (!manager) return res.status(401).json({ error: 'Invalid token' });

    req.manager = manager;
    next();
}