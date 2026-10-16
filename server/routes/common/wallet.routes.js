// LOCATION: server/routes/common/wallet.routes.js - V13 WALLET API - FINAL
const express = require('express');
const router = express.Router();
const Wallet = require('../../models/Wallet');

// GET /api/common/wallet/balance?userId=xxx&role=shop_owner|area_manager|admin
router.get('/balance', async (req, res) => {
  try {
    const { userId, role, shopId, areaId } = req.query;
    if (!userId || !role) {
      return res.status(400).json({ success: false, message: 'userId & role required' });
    }

    let wallet = await Wallet.findOne({ userId, role });
    if (!wallet) {
      wallet = new Wallet({ userId, role, shopId: shopId || null, areaId: areaId || null, balance: 0, totalEarning: 0 });
      await wallet.save();
    }

    res.json({
      success: true,
      wallet: {
        userId: wallet.userId,
        role: wallet.role,
        balance: wallet.balance,
        totalEarning: wallet.totalEarning,
        totalCommissionPaid: wallet.totalCommissionPaid,
        isBlocked: wallet.isBlocked,
        shopId: wallet.shopId,
        areaId: wallet.areaId
      },
      balance: wallet.balance,
      totalEarning: wallet.totalEarning,
      // For old frontend
      data: wallet
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/common/wallet/transactions?userId=xxx&role=yyy&limit=50
router.get('/transactions', async (req, res) => {
  try {
    const { userId, role, limit = 50 } = req.query;
    if (!userId || !role) return res.status(400).json({ success: false, message: 'userId & role required' });

    const wallet = await Wallet.findOne({ userId, role });
    if (!wallet) return res.json({ success: true, transactions: [], balance: 0 });

    const transactions = wallet.transactions
     .sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt))
     .slice(0, parseInt(limit));

    res.json({ success: true, transactions, balance: wallet.balance, totalEarning: wallet.totalEarning });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/common/wallet/all?role=admin - Admin sabka wallet dekhega
router.get('/all', async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};
    if (role) query.role = role;
    const wallets = await Wallet.find(query).sort({ balance: -1 }).limit(100);
    const totalBalance = wallets.reduce((s,w)=> s + w.balance, 0);
    const totalEarning = wallets.reduce((s,w)=> s + w.totalEarning, 0);

    res.json({
      success: true,
      totalWallets: wallets.length,
      totalBalance,
      totalEarning,
      wallets
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/common/wallet/add-money - Manual add (for testing / admin credit)
router.post('/add-money', async (req, res) => {
  try {
    const { userId, role, amount, description } = req.body;
    if (!userId || !role || !amount) return res.status(400).json({ success: false, message: 'userId, role, amount required' });

    let wallet = await Wallet.findOne({ userId, role });
    if (!wallet) {
      wallet = new Wallet({ userId, role, balance: 0 });
    }

    wallet.balance += Number(amount);
    wallet.totalEarning += Number(amount);
    wallet.transactions.push({
      type: 'credit',
      amount: Number(amount),
      fromRole: 'admin',
      toRole: role,
      fromId: 'admin',
      toId: userId,
      paymentMode: 'manual',
      description: description || `Manual credit ${amount}`,
      balanceAfter: wallet.balance
    });

    await wallet.save();
    res.json({ success: true, message: `₹${amount} added`, wallet });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/common/wallet/block - Admin block
router.post('/block', async (req, res) => {
  try {
    const { userId, role, isBlocked } = req.body;
    const wallet = await Wallet.findOneAndUpdate({ userId, role }, { isBlocked }, { new: true });
    res.json({ success: true, wallet });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;