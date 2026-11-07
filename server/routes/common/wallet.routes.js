// LOCATION: server/routes/common/wallet.routes.js - V27 NEW - WALLET BALANCE
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/balance', async (req, res) => {
    try {
        const userId = req.query.userId || req.query.managerId || req.query.buyerId || '';
        const role = String(req.query.role || '').toLowerCase();
        if (!userId) return res.json({ success: true, balance: 0, walletBalance: 0, totalEarning: 0 });
        if (role.includes('manager') || role.includes('delivery')) {
            const Manager = require('../../models/Manager');
            const m = await Manager.findById(userId).lean().catch(() => null)
                || await Manager.findOne({ managerCode: userId }).lean().catch(() => null)
                || await Manager.findOne({ loginToken: userId }).lean().catch(() => null);
            const balance = m?.walletBalance || 0;
            return res.json({ success: true, balance, walletBalance: balance, totalEarning: m?.totalEarning || 0 });
        }
        const User = require('../../models/User');
        const u = mongoose.Types.ObjectId.isValid(userId) ? await User.findById(userId).lean().catch(() => null) : null;
        const balance = u?.wallet?.balance || 0;
        return res.json({ success: true, balance, walletBalance: balance, totalEarning: u?.wallet?.totalEarning || 0 });
    } catch (e) { return res.json({ success: true, balance: 0, walletBalance: 0, totalEarning: 0 }); }
});
router.get('/', async (req, res) => res.json({ success: true, balance: 0, walletBalance: 0, totalEarning: 0 }));
module.exports = router;