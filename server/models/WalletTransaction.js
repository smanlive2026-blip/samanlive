// LOCATION: server/models/WalletTransaction.js - V1 FINAL - UNIFIED WALLET
// RULE 1: Balance kabhi browser me + / - nahi hoga. Balance sirf isi model se banega.
// RULE 2: Har transaction ka ek record banega. Bina record ke paisa kabhi move nahi hoga.
// RULE 3: Ek hi model sabke liye - Shop / Customer / Area Manager / Delivery Boy / Admin (read-only)
// RULE 4: ownerType + ownerId se pata chalega paisa kiska hai. Dusre ka paisa kabhi nahi dikhega.

const mongoose = require('mongoose');

const WalletTransactionSchema = new mongoose.Schema({
  // ============ KISKA PAISA HAI ============
  ownerType: {
    type: String,
    required: true,
    enum: ['shop', 'customer', 'area_manager', 'delivery_boy', 'admin'],
    index: true,
    // shop = Dukaan wala - Earning Wallet
    // customer = User - Cashback / Refund Wallet
    // area_manager = Commission Wallet
    // delivery_boy = Delivery Earning Wallet
    // admin = Sirf dekhne ke liye, iska wallet kabhi move nahi hoga
  },
  ownerId: {
    type: String,
    required: true,
    index: true,
    // shop hai toh Shop._id
    // customer hai toh User._id
    // area_manager / delivery_boy hai toh Manager / DeliveryBoy._id
  },
  // Shop wale ke liye extra - kis dukaan ka hai, taaki Area Manager ko filter kar sake
  shopId: { type: String, default: '', index: true },
  areaId: { type: String, default: '', index: true },

  // ============ KITNA PAISA, KIDHAR GAYA ============
  type: {
    type: String,
    required: true,
    enum: ['credit', 'debit'],
    // credit = Paisa aaya - + 
    // debit = Paisa gaya - -
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount 0 se bada hona chahiye'],
  },
  // Is transaction ke BAAD balance kitna bacha - Yehi asli sach hai
  // Frontend isi ko dikhayega, khud calculate kabhi nahi karega
  balanceAfter: {
    type: Number,
    required: true,
    default: 0,
  },

  // ============ KYU AAYA / GAYA ============
  reason: {
    type: String,
    required: true,
    enum: [
      'order_earning',      // Shop ko order se mila
      'order_payment',      // Customer ne wallet se order pay kiya
      'refund',             // Order cancel - Customer ko wapas
      'cashback',           // Coupon / Offer ka cashback
      'commission',         // Area Manager ko commission mila
      'delivery_earning',   // Delivery Boy ko delivery ka paisa mila
      'payout',             // Withdraw - Paisa bank me bheja
      'payout_reject',      // Payout reject hua - Paisa wapas wallet me
      'expense',            // Shop ne kharcha likha
      'adjustment',         // Admin ne galti sudhari - Sirf Admin kar sakta hai
    ],
    index: true,
  },
  title: { type: String, default: '' }, // "Order Payment #ORD123" jaisa dikhne wala naam
  description: { type: String, default: '' },

  // ============ LINK - KIS ORDER SE JUDA HAI ============
  orderId: { type: String, default: '', index: true },
  paymentMethod: {
    type: String,
    default: 'wallet',
    enum: ['wallet', 'COD', 'UPI', 'card', 'bank', 'cash'],
  },
  referenceId: { type: String, default: '' }, // UPI / Bank Transaction ID

  // ============ PAYOUT - WITHDRAW WALA ============
  payout: {
    status: {
      type: String,
      default: 'none',
      enum: ['none', 'pending', 'approved', 'rejected', 'completed'],
    },
    method: { type: String, default: '' }, // upi / bank
    upiId: { type: String, default: '' },
    bankAccount: { type: String, default: '' }, // Sirf last 4 digit save karenge, pura kabhi nahi
    bankIfsc: { type: String, default: '' },
    requestedAt: { type: Date, default: null },
    processedAt: { type: Date, default: null },
    processedBy: { type: String, default: '' }, // Kis Admin ne approve kiya
    rejectReason: { type: String, default: '' },
  },

  // ============ KISNE KIYA ============
  createdBy: { type: String, default: 'system' }, // userId ya 'system' - Order se auto aaya toh system
  createdByRole: { type: String, default: 'system' },

  status: {
    type: String,
    default: 'completed',
    enum: ['completed', 'pending', 'failed', 'reversed'],
    index: true,
  },
}, {
  timestamps: true, // createdAt + updatedAt auto banega
  collection: 'wallettransactions',
});

// ============ INDEX - FAST SEARCH KE LIYE ============
// Ek bande ka pura history jaldi nikle
WalletTransactionSchema.index({ ownerType: 1, ownerId: 1, createdAt: -1 });
// Shop ka history
WalletTransactionSchema.index({ shopId: 1, createdAt: -1 });
// Order se history
WalletTransactionSchema.index({ orderId: 1 });

// ============ STATIC - BALANCE NIKALNA - SABSE IMPORTANT ============
// Balance = Last transaction ka balanceAfter
// Agar koi transaction nahi hai toh 0 - Fake 12450 kabhi nahi
WalletTransactionSchema.statics.getBalance = async function (ownerType, ownerId) {
  const last = await this.findOne({ ownerType, ownerId, status: 'completed' })
    .sort({ createdAt: -1 })
    .select('balanceAfter')
    .lean();
  return last ? Number(last.balanceAfter || 0) : 0;
};

// ============ STATIC - PAISA ADD / GHATANA - SIRF SERVER YAHAN SE KAREGA ============
// Frontend kabhi balance nahi badlayega, sirf ye function bulayega
// amount > 0 hona chahiye, type se pata chalega + hai ya -
WalletTransactionSchema.statics.addTransaction = async function (data) {
  const { ownerType, ownerId, type, amount, reason } = data || {};
  if (!ownerType || !ownerId) throw new Error('ownerType + ownerId chahiye');
  if (!['credit', 'debit'].includes(type)) throw new Error('type credit ya debit hona chahiye');
  const amt = Number(amount);
  if (!amt || amt <= 0) throw new Error('Amount 0 se bada hona chahiye');
  if (!reason) throw new Error('reason chahiye');

  const currentBalance = await this.getBalance(ownerType, ownerId);

  // Debit hai aur paisa kam hai toh rok do - Balance kabhi minus nahi hoga
  if (type === 'debit' && currentBalance < amt) {
    throw new Error('Insufficient balance');
  }

  const balanceAfter = type === 'credit'
    ? currentBalance + amt
    : currentBalance - amt;

  const doc = await this.create({
    ownerType,
    ownerId,
    shopId: data.shopId || '',
    areaId: data.areaId || '',
    type,
    amount: amt,
    balanceAfter,
    reason,
    title: data.title || '',
    description: data.description || '',
    orderId: data.orderId || '',
    paymentMethod: data.paymentMethod || 'wallet',
    referenceId: data.referenceId || '',
    payout: data.payout || { status: 'none' },
    createdBy: data.createdBy || 'system',
    createdByRole: data.createdByRole || 'system',
    status: data.status || 'completed',
  });

  return { transaction: doc, balance: balanceAfter };
};

module.exports = mongoose.model('WalletTransaction', WalletTransactionSchema);