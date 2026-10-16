// LOCATION: server/models/Wallet.js - HIERARCHY WALLET - COMMISSION SYSTEM
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  type: { type: String, enum: ['credit','debit'], required: true },
  amount: { type: Number, required: true },
  commission: { type: Number, default: 0 },
  fromRole: String, // customer, shop_owner, area_manager, admin
  toRole: String,
  fromId: String,
  toId: String,
  paymentMode: String, // wallet, upi, cod, online
  description: String,
  balanceAfter: Number,
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const walletSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true }, // UserId / ShopId / ManagerId
  role: { type: String, enum: ['shop_owner','area_manager','admin'], required: true },
  shopId: { type: String, default: null }, // if shop_owner
  areaId: { type: String, default: null }, // if area_manager
  balance: { type: Number, default: 0 },
  totalEarning: { type: Number, default: 0 }, // lifetime
  totalCommissionPaid: { type: Number, default: 0 }, // admin ko kitna diya
  transactions: [transactionSchema],
  isBlocked: { type: Boolean, default: false }
}, { timestamps: true });

walletSchema.index({ userId: 1, role: 1 }, { unique: true });

// Methods
walletSchema.methods.credit = function(orderId, amount, commission, fromRole, fromId, paymentMode){
  const earning = amount - (commission || 0);
  this.balance += earning;
  this.totalEarning += earning;
  this.transactions.push({
    orderId, type: 'credit', amount: earning, commission, fromRole, toRole: this.role,
    fromId, toId: this.userId, paymentMode,
    description: `Order ${orderId} se +${earning}`,
    balanceAfter: this.balance
  });
  return this.save();
};

walletSchema.methods.debit = function(orderId, amount, toRole, toId, paymentMode){
  if(this.balance < amount && this.role!== 'admin'){
    throw new Error('Insufficient wallet balance');
  }
  this.balance -= amount;
  this.transactions.push({
    orderId, type: 'debit', amount, fromRole: this.role, toRole,
    fromId: this.userId, toId, paymentMode,
    description: `Order ${orderId} ke liye -${amount}`,
    balanceAfter: this.balance
  });
  return this.save();
};

walletSchema.methods.addCommission = function(orderId, commissionAmount, fromRole, fromId){
  this.balance += commissionAmount;
  this.totalEarning += commissionAmount;
  this.transactions.push({
    orderId, type: 'credit', amount: commissionAmount, commission: 0,
    fromRole, toRole: 'admin', fromId, toId: this.userId, paymentMode: 'commission',
    description: `Commission ${commissionAmount} from ${fromRole} order ${orderId}`,
    balanceAfter: this.balance
  });
  return this.save();
};

module.exports = mongoose.model('Wallet', walletSchema);