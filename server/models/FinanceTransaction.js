// LOCATION: server/models/FinanceTransaction.js - V1 FINAL - UNIFIED FINANCE
// RULE 1: Expense / Earning / GST / Payout - Sab isi ek model se. Alag model nahi.
// RULE 2: Paisa browser me kabhi + / - nahi hoga. Sirf Server is model se karega.
// RULE 3: Demo / Fake / Sample data kabhi nahi. Nahi hai toh 0 + "No data yet".
// RULE 4: Ek hi model sabke liye - shop / area_manager / delivery_boy
// FLOW: Expense Add -> FinanceTransaction (expense) -> Profit-Loss me auto ghat jayega
//       Order Complete -> WalletTransaction (credit) -> Profit-Loss me auto jud jayega

const mongoose = require('mongoose');

const FinanceTransactionSchema = new mongoose.Schema({
  // ============ KISKA HISAB HAI ============
  ownerType: {
    type: String,
    required: true,
    enum: ['shop', 'area_manager', 'delivery_boy'],
    index: true,
  },
  ownerId: { type: String, required: true, index: true }, // Shop._id / Manager._id
  shopId: { type: String, default: '', index: true },
  areaId: { type: String, default: '', index: true },

  // ============ KIS TYPE KA HISAB HAI ============
  kind: {
    type: String,
    required: true,
    enum: ['expense', 'earning', 'payout', 'gst', 'refund'],
    index: true,
    // expense = Kharcha - Rent, Stock, Salary, etc.
    // earning = Order se aaya - Wallet se link hoga
    // payout = Withdraw - Wallet se link hoga
    // gst = GST Invoice - Bill kata
    // refund = Customer ko wapas diya
  },
  type: {
    type: String,
    required: true,
    enum: ['credit', 'debit'],
    // expense / payout / refund = debit (gaya)
    // earning / gst = credit (aaya)
  },
  amount: { type: Number, required: true, min: [0.01, 'Amount 0 se bada hona chahiye'] },

  // ============ KYA HAI ============
  title: { type: String, default: '', trim: true }, // "Shop Rent" / "Vegetables Purchase"
  description: { type: String, default: '', trim: true },
  category: {
    type: String,
    default: 'other',
    enum: ['stock', 'rent', 'delivery', 'salary', 'utility', 'marketing', 'maintenance', 'other', 'order', 'commission', 'payout', 'gst', 'refund'],
    index: true,
  },
  paymentMethod: {
    type: String,
    default: 'cash',
    enum: ['cash', 'UPI', 'bank', 'card', 'wallet', 'COD'],
  },

  // ============ GST WALA ============
  gst: {
    invoiceNo: { type: String, default: '' }, // INV-001 - Auto banega
    gstin: { type: String, default: '', uppercase: true, trim: true }, // Shop ka asli GSTIN, hardcode kabhi nahi
    gstRate: { type: Number, default: 0 }, // 0 / 5 / 12 / 18 / 28
    gstAmount: { type: Number, default: 0 }, // Kitna GST laga
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 }, // Bina GST wala amount
    totalAmount: { type: Number, default: 0 }, // GST ke saath total
    customerName: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    items: { type: Array, default: [] }, // [{ name, qty, rate, gstRate, amount }]
  },

  // ============ LINK ============
  orderId: { type: String, default: '', index: true },
  walletTransactionId: { type: String, default: '' }, // Wallet se juda hai toh
  referenceId: { type: String, default: '' },

  // ============ KISNE KIYA ============
  createdBy: { type: String, default: 'system' },
  createdByRole: { type: String, default: 'system' },

  status: {
    type: String,
    default: 'completed',
    enum: ['completed', 'pending', 'failed', 'cancelled'],
    index: true,
  },
}, {
  timestamps: true,
  collection: 'financetransactions',
});

// ============ INDEX ============
FinanceTransactionSchema.index({ ownerType: 1, ownerId: 1, createdAt: -1 });
FinanceTransactionSchema.index({ shopId: 1, kind: 1, createdAt: -1 });
FinanceTransactionSchema.index({ shopId: 1, category: 1, createdAt: -1 });

// ============ STATIC - PROFIT-LOSS NIKALNA - SABSE IMPORTANT ============
// Revenue = earning (credit) | Expense = expense (debit) | Profit = Revenue - Expense
FinanceTransactionSchema.statics.getProfitLoss = async function (shopId, startDate, endDate) {
  const match = { shopId, status: 'completed' };
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  const agg = await this.aggregate([
    { $match: match },
    { $group: { _id: '$kind', total: { $sum: '$amount' } } },
  ]);
  let revenue = 0, expense = 0, payout = 0, refund = 0, gstTotal = 0;
  agg.forEach(a => {
    if (a._id === 'earning') revenue += a.total;
    if (a._id === 'expense') expense += a.total;
    if (a._id === 'payout') payout += a.total;
    if (a._id === 'refund') refund += a.total;
    if (a._id === 'gst') gstTotal += a.total;
  });

  // Category wise expense - Chart ke liye
  const byCategory = await this.aggregate([
    { $match: { ...match, kind: 'expense' } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
  ]);

  // Payment method wise revenue - COD / UPI / Card
  const byMethod = await this.aggregate([
    { $match: { ...match, kind: 'earning' } },
    { $group: { _id: '$paymentMethod', total: { $sum: '$amount' } } },
  ]);

  const totalOrders = await this.countDocuments({ ...match, kind: 'earning' });

  return {
    revenue, expense, payout, refund, gstTotal,
    profit: revenue - expense - refund,
    netProfit: revenue - expense - refund - payout,
    totalOrders,
    avgOrderValue: totalOrders > 0 ? Math.round(revenue / totalOrders) : 0,
    expenseByCategory: byCategory.map(c => ({ category: c._id, total: c.total })),
    revenueByMethod: byMethod.map(m => ({ method: m._id, total: m.total })),
  };
};

module.exports = mongoose.model('FinanceTransaction', FinanceTransactionSchema);