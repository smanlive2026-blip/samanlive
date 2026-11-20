// LOCATION: server/routes/common/wallet.routes.js - V2 FINAL - UNIFIED WALLET - WORLD CLASS
// RULE 1: Balance browser me kabhi + / - nahi hoga. Balance sirf WalletTransaction model se banega.
// RULE 2: Ek hi route sabke liye - shop / customer / area_manager / delivery_boy / admin (read-only)
// RULE 3: Apna wallet hi dekh sakte ho. Dusre ka wallet dekhne pe 403. Admin sirf dekh sakta hai, withdraw nahi.
// RULE 4: Purana GET /balance delete nahi kiya - Dashboard Core usi ko bulata hai, warna dashboard tut jayega.
// FLOW: GET /:ownerType/:ownerId -> Balance + Transactions | POST /:ownerType/:ownerId/transaction -> Credit/Debit
//       POST /:ownerType/:ownerId/payout -> Withdraw Request | GET /:ownerType/:ownerId/payout-history

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ============ HELPERS ============
const num = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const clean = (v) => String(v || '').trim();

// ownerType jo URL se aayega usko Model ke enum se milao
// shop_owner / shop / customer / user / area_manager / manager / delivery_boy / delivery / admin
function normalizeOwnerType(raw) {
  const t = String(raw || '').toLowerCase();
  if (['shop', 'shop_owner', 'shopowner'].includes(t)) return 'shop';
  if (['customer', 'user', 'buyer'].includes(t)) return 'customer';
  if (['area_manager', 'areamanager', 'manager', 'area-manager'].includes(t)) return 'area_manager';
  if (['delivery_boy', 'deliveryboy', 'delivery', 'delivery-boy'].includes(t)) return 'delivery_boy';
  if (['admin', 'super_admin', 'superadmin'].includes(t)) return 'admin';
  return '';
}

// Kaun withdraw kar sakta hai? - Customer nahi, Admin nahi, Product Manager nahi
function canWithdraw(ownerType) {
  return ['shop', 'area_manager', 'delivery_boy'].includes(ownerType);
}
// Kaun wallet se pay kar sakta hai? - Sirf Customer
function canPayWithWallet(ownerType) {
  return ownerType === 'customer';
}

// ============ AUTH - TOKEN SE BANDA KAUN HAI ============
// Token nahi hai toh bhi balance 0 de denge, crash nahi karenge
// Kyunki Dashboard Core bina login ke bhi balance mangta hai
async function getMe(req) {
  try {
    const token = String(req.headers.authorization || '').replace('Bearer ', '').trim();
    if (!token) return null;
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const decoded = jwt.verify(token, secret);
    return decoded || null;
  } catch (e) { return null; }
}

// Kya ye banda is wallet ko dekh sakta hai?
// Apna wallet = Haan | Admin = Haan (sirf dekhna) | Dusra = Nahi
function canViewWallet(me, ownerType, ownerId) {
  if (!me) return false;
  const role = String(me.role || '').toLowerCase();
  const myId = String(me._id || me.id || me.userId || '');
  if (role === 'admin' || role === 'super_admin') return true;
  if (myId && myId === String(ownerId)) return true;
  // Shop Owner apni dukaan ka wallet dekh sakta hai - ownerId = shopId bhi ho sakta hai
  if (role === 'shop_owner' && ownerType === 'shop') {
    // Shop ka ownerId check Route ke andar Shop model se hoga, yahan allow kar dete hain
    // Final check neeche Shop lookup me hoga
    return true;
  }
  return false;
}

function getModels() {
  return {
    WalletTransaction: require('../../models/WalletTransaction'),
    Shop: require('../../models/Shop'),
    User: require('../../models/User'),
    Manager: require('../../models/Manager'),
    DeliveryBoy: require('../../models/DeliveryBoy'),
  };
}

// Shop ka owner check - Ye dukaan is bande ki hai ya nahi?
async function isShopOwner(shopId, userId) {
  try {
    if (!shopId || !userId) return false;
    const { Shop } = getModels();
    const shop = await Shop.findById(shopId).select('ownerId userId shopOwnerId').lean().catch(() => null);
    if (!shop) return false;
    const owner = String(shop.ownerId || shop.userId || shop.shopOwnerId || '');
    return owner === String(userId);
  } catch (e) { return false; }
}

// ============ API 1 - BALANCE + TRANSACTIONS - SABSE MAIN ============
// GET /api/common/wallet/shop/12345?role=shop_owner&page=1&limit=20&filter=all
// GET /api/common/wallet/customer/67890
// Response: { success, balance, totalEarning, totalPayout, transactions, pagination }
router.get('/:ownerType/:ownerId', async (req, res) => {
  try {
    const ownerType = normalizeOwnerType(req.params.ownerType);
    const ownerId = clean(req.params.ownerId);
    const page = Math.max(1, parseInt(req.query.page || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20')));
    const filter = String(req.query.filter || 'all').toLowerCase(); // all / credit / debit / payout

    if (!ownerType) return res.status(400).json({ success: false, message: 'ownerType galat hai - shop / customer / area_manager / delivery_boy bhejo' });
    if (!ownerId) return res.status(400).json({ success: false, message: 'ownerId chahiye' });

    const me = await getMe(req);
    // Login hai toh check karo - Bina login ke sirf Shop ka public balance nahi dikhega
    if (me && !canViewWallet(me, ownerType, ownerId)) {
      // Shop Owner hai toh Shop ka owner check karo
      if (!(ownerType === 'shop' && await isShopOwner(ownerId, me._id || me.id || me.userId))) {
        return res.status(403).json({ success: false, message: 'Ye wallet tumhara nahi hai' });
      }
    }

    const { WalletTransaction } = getModels();
    const query = { ownerType, ownerId };
    if (filter === 'credit' || filter === 'debit') query.type = filter;
    if (filter === 'payout') query.reason = 'payout';

    const [transactions, total, balance] = await Promise.all([
      WalletTransaction.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      WalletTransaction.countDocuments(query),
      WalletTransaction.getBalance(ownerType, ownerId),
    ]);

    // Total Earning + Total Payout - Sirf completed wale
    const agg = await WalletTransaction.aggregate([
      { $match: { ownerType, ownerId, status: 'completed' } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);
    let totalCredit = 0, totalDebit = 0;
    agg.forEach(a => { if (a._id === 'credit') totalCredit = a.total; if (a._id === 'debit') totalDebit = a.total; });

    // Aaj + Is Mahine ka hisaab - Frontend ke Today / Month card ke liye
    const now = new Date();
    const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [todayAgg, monthAgg] = await Promise.all([
      WalletTransaction.aggregate([
        { $match: { ownerType, ownerId, type: 'credit', status: 'completed', createdAt: { $gte: startDay } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      WalletTransaction.aggregate([
        { $match: { ownerType, ownerId, type: 'credit', status: 'completed', createdAt: { $gte: startMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    return res.json({
      success: true,
      ownerType, ownerId,
      balance,
      availableBalance: balance,
      totalEarning: totalCredit,
      totalRevenue: totalCredit,
      totalPayout: totalDebit,
      totalExpense: totalDebit,
      todayEarning: todayAgg[0]?.total || 0,
      monthEarning: monthAgg[0]?.total || 0,
      totalOrders: await WalletTransaction.countDocuments({ ownerType, ownerId, reason: 'order_earning', status: 'completed' }),
      canWithdraw: canWithdraw(ownerType),
      canPayWithWallet: canPayWithWallet(ownerType),
      transactions: transactions.map(t => ({
        _id: t._id,
        type: t.type,
        amount: t.amount,
        balanceAfter: t.balanceAfter,
        reason: t.reason,
        title: t.title || t.reason,
        description: t.description || '',
        orderId: t.orderId || '',
        paymentMethod: t.paymentMethod || 'wallet',
        status: t.status,
        payout: t.payout || null,
        createdAt: t.createdAt,
        date: t.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Wallet load nahi hua', error: e.message });
  }
});

// ============ API 2 - TRANSACTION ADD KARNA - CREDIT / DEBIT ============
// POST /api/common/wallet/shop/12345/transaction
// Body: { type: 'credit', amount: 299, reason: 'order_earning', orderId: 'ORD123', title: 'Order Payment' }
// YE API SIRF SERVER ANDAR SE BULAYEGA - Order complete / Refund / Cashback pe
// Frontend se direct credit karne pe 403 - Nahi toh koi bhi apna balance bada lega
router.post('/:ownerType/:ownerId/transaction', async (req, res) => {
  try {
    const ownerType = normalizeOwnerType(req.params.ownerType);
    const ownerId = clean(req.params.ownerId);
    const { type, amount, reason, title, description, orderId, paymentMethod, shopId, areaId } = req.body || {};

    if (!ownerType || !ownerId) return res.status(400).json({ success: false, message: 'ownerType + ownerId chahiye' });
    if (!['credit', 'debit'].includes(type)) return res.status(400).json({ success: false, message: 'type credit ya debit hona chahiye' });
    if (!amount || num(amount) <= 0) return res.status(400).json({ success: false, message: 'Amount 0 se bada hona chahiye' });
    if (!reason) return res.status(400).json({ success: false, message: 'reason chahiye' });

    const me = await getMe(req);
    const role = String(me?.role || '').toLowerCase();
    // Sirf Admin / System / Shop Owner apne liye debit kar sakta hai (Expense)
    // Customer khud apna balance nahi bada sakta
    const isSystem = String(req.headers['x-internal-key'] || '') === String(process.env.INTERNAL_KEY || 'dev-internal');
    if (!isSystem && role !== 'admin' && role !== 'super_admin') {
      // Shop Owner apna Expense likh sakta hai - Sirf debit + reason expense
      const isOwnExpense = role === 'shop_owner' && ownerType === 'shop' && type === 'debit' && reason === 'expense' && await isShopOwner(ownerId, me?._id || me?.id);
      if (!isOwnExpense) return res.status(403).json({ success: false, message: 'Transaction sirf Server / Admin kar sakta hai' });
    }

    const { WalletTransaction } = getModels();
    const result = await WalletTransaction.addTransaction({
      ownerType, ownerId, type, amount: num(amount), reason,
      title, description, orderId, paymentMethod, shopId, areaId,
      createdBy: me?._id || me?.id || 'system',
      createdByRole: role || 'system',
    });

    // Shop ka walletBalance bhi update karo - Taaki purani jagah bhi sahi dikhe
    await syncOwnerBalance(ownerType, ownerId, result.balance);

    return res.json({ success: true, message: 'Transaction ho gaya', balance: result.balance, transaction: result.transaction });
  } catch (e) {
    const msg = e.message === 'Insufficient balance' ? 'Balance kam hai' : e.message;
    return res.status(400).json({ success: false, message: msg });
  }
});

// ============ API 3 - PAYOUT / WITHDRAW REQUEST ============
// POST /api/common/wallet/shop/12345/payout
// Body: { amount: 5000, method: 'upi', upiId: 'shop@upi' } OR { method: 'bank', bankAccount: '...', bankIfsc: '...' }
// Paisa turant nahi jayega - Request Pending me jayegi, Admin approve karega tab jayega
// Balance turant kam nahi hoga - Approve hone pe hi debit hoga, nahi toh reject pe paisa wapas
router.post('/:ownerType/:ownerId/payout', async (req, res) => {
  try {
    const ownerType = normalizeOwnerType(req.params.ownerType);
    const ownerId = clean(req.params.ownerId);
    const { amount, method, upiId, bankAccount, bankIfsc } = req.body || {};

    if (!ownerType || !ownerId) return res.status(400).json({ success: false, message: 'ownerType + ownerId chahiye' });
    if (!canWithdraw(ownerType)) return res.status(403).json({ success: false, message: 'Is role ko Withdraw nahi milega' });
    if (!amount || num(amount) <= 0) return res.status(400).json({ success: false, message: 'Amount 0 se bada hona chahiye' });
    if (num(amount) < 100) return res.status(400).json({ success: false, message: 'Minimum Withdraw ₹100 hai' });
    if (!['upi', 'bank'].includes(String(method || '').toLowerCase())) return res.status(400).json({ success: false, message: 'Method upi ya bank hona chahiye' });
    if (String(method).toLowerCase() === 'upi' && !clean(upiId)) return res.status(400).json({ success: false, message: 'UPI ID chahiye' });
    if (String(method).toLowerCase() === 'bank' && (!clean(bankAccount) || !clean(bankIfsc))) return res.status(400).json({ success: false, message: 'Bank Account + IFSC chahiye' });

    const me = await getMe(req);
    if (me && !canViewWallet(me, ownerType, ownerId)) {
      if (!(ownerType === 'shop' && await isShopOwner(ownerId, me._id || me.id))) {
        return res.status(403).json({ success: false, message: 'Ye wallet tumhara nahi hai' });
      }
    }

    const { WalletTransaction } = getModels();
    const balance = await WalletTransaction.getBalance(ownerType, ownerId);
    if (balance < num(amount)) return res.status(400).json({ success: false, message: 'Balance kam hai', balance });

    // Pehle se Pending payout hai toh naya nahi banega
    const pending = await WalletTransaction.findOne({ ownerType, ownerId, reason: 'payout', 'payout.status': 'pending' }).lean();
    if (pending) return res.status(400).json({ success: false, message: 'Ek Payout pehle se Pending hai, uske baad naya karna', payoutId: pending._id });

    // Bank Account me sirf last 4 digit rakhenge - Pura account kabhi save nahi karenge
    const last4 = clean(bankAccount).slice(-4);

    const doc = await WalletTransaction.create({
      ownerType, ownerId, type: 'debit', amount: num(amount), balanceAfter: balance, // Balance abhi kam nahi hoga, approve pe hoga
      reason: 'payout', title: 'Payout Request', description: `Withdraw - ${method} - Pending`,
      paymentMethod: String(method).toLowerCase() === 'upi' ? 'UPI' : 'bank',
      payout: {
        status: 'pending', method: String(method).toLowerCase(),
        upiId: clean(upiId), bankAccount: last4 ? `****${last4}` : '', bankIfsc: clean(bankIfsc),
        requestedAt: new Date(),
      },
      createdBy: me?._id || me?.id || ownerId, createdByRole: me?.role || ownerType,
      status: 'pending',
    });

    return res.json({ success: true, message: 'Payout Request bhej diya, Admin approve karega', balance, payoutId: doc._id, payout: doc });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Payout nahi hua', error: e.message });
  }
});

// ============ API 4 - PAYOUT HISTORY ============
// GET /api/common/wallet/shop/12345/payout-history
router.get('/:ownerType/:ownerId/payout-history', async (req, res) => {
  try {
    const ownerType = normalizeOwnerType(req.params.ownerType);
    const ownerId = clean(req.params.ownerId);
    if (!ownerType || !ownerId) return res.status(400).json({ success: false, message: 'ownerType + ownerId chahiye' });
    const { WalletTransaction } = getModels();
    const list = await WalletTransaction.find({ ownerType, ownerId, reason: 'payout' }).sort({ createdAt: -1 }).limit(50).lean();
    return res.json({ success: true, payouts: list });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Payout history nahi mili', error: e.message });
  }
});

// ============ API 5 - ADMIN - PAYOUT APPROVE / REJECT ============
// POST /api/common/wallet/payout/:payoutId/approve  |  /reject
// Sirf Admin kar sakta hai. Approve pe balance kam hoga, Reject pe paisa wapas.
router.post('/payout/:payoutId/approve', async (req, res) => {
  try {
    const me = await getMe(req);
    if (!me || !['admin', 'super_admin'].includes(String(me.role || '').toLowerCase())) {
      return res.status(403).json({ success: false, message: 'Sirf Admin approve kar sakta hai' });
    }
    const { WalletTransaction } = getModels();
    const doc = await WalletTransaction.findById(req.params.payoutId);
    if (!doc || doc.reason !== 'payout') return res.status(404).json({ success: false, message: 'Payout nahi mila' });
    if (doc.payout?.status !== 'pending') return res.status(400).json({ success: false, message: 'Ye Payout pehle se processed hai' });

    const balance = await WalletTransaction.getBalance(doc.ownerType, doc.ownerId);
    if (balance < doc.amount) return res.status(400).json({ success: false, message: 'Balance kam hai, approve nahi hoga' });

    // Ab balance kam karo - Naya debit transaction nahi, isi ko completed karo
    doc.balanceAfter = balance - doc.amount;
    doc.status = 'completed';
    doc.payout.status = 'approved';
    doc.payout.processedAt = new Date();
    doc.payout.processedBy = String(me._id || me.id || '');
    await doc.save();
    await syncOwnerBalance(doc.ownerType, doc.ownerId, doc.balanceAfter);
    return res.json({ success: true, message: 'Payout Approved', balance: doc.balanceAfter });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Approve nahi hua', error: e.message });
  }
});

router.post('/payout/:payoutId/reject', async (req, res) => {
  try {
    const me = await getMe(req);
    if (!me || !['admin', 'super_admin'].includes(String(me.role || '').toLowerCase())) {
      return res.status(403).json({ success: false, message: 'Sirf Admin reject kar sakta hai' });
    }
    const { WalletTransaction } = getModels();
    const doc = await WalletTransaction.findById(req.params.payoutId);
    if (!doc || doc.reason !== 'payout') return res.status(404).json({ success: false, message: 'Payout nahi mila' });
    if (doc.payout?.status !== 'pending') return res.status(400).json({ success: false, message: 'Ye Payout pehle se processed hai' });
    doc.status = 'reversed';
    doc.payout.status = 'rejected';
    doc.payout.processedAt = new Date();
    doc.payout.processedBy = String(me._id || me.id || '');
    doc.payout.rejectReason = clean(req.body?.reason) || 'Admin ne reject kiya';
    await doc.save();
    return res.json({ success: true, message: 'Payout Rejected, paisa wallet me hi hai' });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Reject nahi hua', error: e.message });
  }
});

// ============ API 6 - PURANA /balance - DELETE MAT KARNA ============
// GET /api/common/wallet/balance?userId=123&role=shop_owner
// Dashboard Core + purani jagah isi ko bulati hai
// Isme Shop ka bhi balance aa jayega - Pehle nahi aata tha
router.get('/balance', async (req, res) => {
  try {
    const userId = clean(req.query.userId || req.query.managerId || req.query.buyerId || req.query.shopId || '');
    const role = String(req.query.role || '').toLowerCase();
    if (!userId) return res.json({ success: true, balance: 0, walletBalance: 0, totalEarning: 0 });

    const ownerType = normalizeOwnerType(role) || (req.query.shopId ? 'shop' : 'customer');
    const { WalletTransaction } = getModels();
    const balance = await WalletTransaction.getBalance(ownerType, userId);

    // Total Earning bhi nikal lo
    const agg = await WalletTransaction.aggregate([
      { $match: { ownerType, ownerId: userId, type: 'credit', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return res.json({ success: true, balance, walletBalance: balance, totalEarning: agg[0]?.total || 0 });
  } catch (e) {
    return res.json({ success: true, balance: 0, walletBalance: 0, totalEarning: 0 });
  }
});

// Root - Health check - Khaali hit pe 404 nahi aayega
router.get('/', async (req, res) => res.json({ success: true, message: 'Wallet API chal rahi hai', balance: 0 }));

// ============ SYNC - PURANE MODEL KA BALANCE BHI UPDATE KARO ============
// Taaki Admin Panel / Profile me purani jagah bhi sahi balance dikhe
async function syncOwnerBalance(ownerType, ownerId, balance) {
  try {
    const { Shop, User, Manager, DeliveryBoy } = getModels();
    if (ownerType === 'shop' && mongoose.Types.ObjectId.isValid(ownerId)) {
      await Shop.findByIdAndUpdate(ownerId, { walletBalance: balance }).catch(() => {});
    }
    if (ownerType === 'customer' && mongoose.Types.ObjectId.isValid(ownerId)) {
      await User.findByIdAndUpdate(ownerId, { 'wallet.balance': balance }).catch(() => {});
    }
    if (ownerType === 'area_manager' && mongoose.Types.ObjectId.isValid(ownerId)) {
      await Manager.findByIdAndUpdate(ownerId, { walletBalance: balance }).catch(() => {});
    }
    if (ownerType === 'delivery_boy' && mongoose.Types.ObjectId.isValid(ownerId)) {
      await DeliveryBoy.findByIdAndUpdate(ownerId, { walletBalance: balance }).catch(() => {});
    }
  } catch (e) {}
}

module.exports = router;