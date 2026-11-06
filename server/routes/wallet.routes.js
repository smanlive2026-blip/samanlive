// LOCATION: server/routes/common/wallet.routes.js - V26 NEW - FILE MISSING THI, ISLIYE 404 AA RAHA THA
// Mount: /api/common/wallet/* via common/index.js (ALLOWED list me pehle se hai)
// Frontend call: GET /api/common/wallet/balance?userId=<managerId>&role=area_manager
// Manager ka wallet Manager model me hai - walletBalance + totalEarning
const express = require('express');
const router = express.Router();
const Manager = require('../../models/Manager');
const User = require('../../models/User');

// GET /api/common/wallet/balance?userId=...&role=area_manager
router.get('/balance', async (req, res) => {
    try {
        const userId = req.query.userId || req.query.managerId || req.query.buyerId || '';
        const role = String(req.query.role || '').toLowerCase();

        if (!userId) return res.json({ success: true, balance: 0, walletBalance: 0, totalEarning: 0 });

        // Area Manager / Delivery - Manager model se
        if (role === 'area_manager' || role === 'manager' || role === 'delivery_boy' || role === 'delivery-manager') {
            const m = await Manager.findById(userId).lean().catch(() => null)
                || await Manager.findOne({ managerCode: userId }).lean().catch(() => null)
                || await Manager.findOne({ loginToken: userId }).lean().catch(() => null);
            if (!m) return res.json({ success: true, balance: 0, walletBalance: 0, totalEarning: 0 });
            const balance = m.walletBalance || 0;
            const totalEarning = m.totalEarning || 0;
            return res.json({ success: true, balance, walletBalance: balance, totalEarning, wallet: { balance, totalEarning } });
        }

        // Customer - User model se
        const u = await User.findById(userId).lean().catch(() => null);
        const balance = u?.wallet?.balance || u?.walletBalance || 0;
        const totalEarning = u?.wallet?.totalEarning || 0;
        return res.json({ success: true, balance, walletBalance: balance, totalEarning, wallet: { balance, totalEarning } });
    } catch (err) {
        console.error('wallet/balance error:', err);
        return res.json({ success: true, balance: 0, walletBalance: 0, totalEarning: 0 });
    }
});

// GET /api/common/wallet/ - same, taaki /wallet pe bhi 404 na aaye
router.get('/', async (req, res) => {
    return res.json({ success: true, balance: 0, walletBalance: 0, totalEarning: 0 });
});

module.exports = router;