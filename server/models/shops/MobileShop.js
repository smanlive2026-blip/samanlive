// LOCATION: server/models/shops/MobileShop.js
// MOBILE SHOP - SINGLE MODEL FILE - 4 MODELS IN ONE FILE - PRODUCT + REPAIR + EXCHANGE + EMI
const mongoose = require('mongoose');

// ============ 1. MOBILE PRODUCT MODEL ============
const MobileProductSchema = new mongoose.Schema({
  shopId: { type: String, required: true, index: true },
  
  // Basic
  name: { type: String, required: true, trim: true },
  brand: { type: String, required: true, enum: ['Apple','Samsung','OnePlus','Xiaomi','Vivo','Oppo','Realme','Nokia','Boat','Anker','Other'], default:'Other', index: true },
  category: { type: String, required: true, enum: ['smartphone','feature','accessories','repair'], default:'smartphone', index: true },
  description: { type: String, default:'' },
  
  // Price
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, default:0 },
  costPrice: { type: Number, default:0 },
  discount: { type: Number, default:0 },
  
  // Stock
  stock: { type: Number, required: true, default:0, min:0 },
  lowStockAlert: { type: Number, default:3 },
  stockStatus: { type: String, enum: ['in_stock','low_stock','out_of_stock'], default:'in_stock' },
  
  // Mobile Specs
  ram: { type: String, enum: ['2GB','3GB','4GB','6GB','8GB','12GB','16GB','N/A'], default:'N/A' },
  storage: { type: String, enum: ['16GB','32GB','64GB','128GB','256GB','512GB','1TB','N/A'], default:'N/A' },
  color: { type: String, default:'' },
  colorCode: { type: String, default:'' },
  processor: { type: String, default:'' },
  display: { type: String, default:'' },
  camera: { type: String, default:'' },
  battery: { type: String, default:'' },
  os: { type: String, default:'' },
  network: { type: String, enum: ['4G','5G','Both','N/A'], default:'5G' },
  sim: { type: String, enum: ['Single','Dual','eSIM+Physical','N/A'], default:'Dual' },
  specs: { type: String, default:'' },
  
  // Images
  image: { type: String, default:'' },
  images: [{ type: String }],
  video: { type: String, default:'' },
  
  // IMEI / Barcode - common/inventory/barcode-scanner.html
  imei: { type: String, default:'', sparse:true, index:true },
  imei2: { type: String, default:'' },
  barcode: { type: String, default:'', index:true },
  serialNumber: { type: String, default:'' },
  
  // Warranty
  warranty: { type: String, enum: ['3 Months','6 Months','1 Year','2 Years','No Warranty'], default:'1 Year' },
  warrantyMonths: { type: Number, default:12 },
  warrantyTill: { type: Date },
  
  // Offers
  emi: { type: Boolean, default:true },
  exchange: { type: Boolean, default:true },
  exchangeBonus: { type: Number, default:1000 },
  isFeatured: { type: Boolean, default:false },
  tags: [{ type: String }],
  
  // Ratings - common/reviews/*
  rating: { type: Number, default:0, min:0, max:5 },
  ratingCount: { type: Number, default:0 },
  reviewCount: { type: Number, default:0 },
  totalSold: { type: Number, default:0 },
  
  // Status
  isActive: { type: Boolean, default:true },
  isPublished: { type: Boolean, default:true },
  
  // SEO
  slug: { type: String, index:true },
  
  createdAt: { type: Date, default:Date.now },
  updatedAt: { type: Date, default:Date.now }
}, { timestamps: true });

MobileProductSchema.index({ shopId:1, brand:1 });
MobileProductSchema.index({ shopId:1, category:1 });
MobileProductSchema.index({ shopId:1, price:1 });
MobileProductSchema.index({ name:'text', brand:'text', specs:'text' });

MobileProductSchema.pre('save', function(next){
  if(this.price && this.originalPrice && this.originalPrice>this.price){
    this.discount = Math.round(((this.originalPrice-this.price)/this.originalPrice)*100);
  }
  if(this.stock===0) this.stockStatus='out_of_stock';
  else if(this.stock<=this.lowStockAlert) this.stockStatus='low_stock';
  else this.stockStatus='in_stock';
  if(this.warrantyMonths && !this.warrantyTill){
    this.warrantyTill = new Date(Date.now()+this.warrantyMonths*30*24*3600000);
  }
  if(this.name && !this.slug){
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+Date.now().toString().substr(-4);
  }
  this.updatedAt=new Date();
  next();
});

// ============ 2. MOBILE REPAIR MODEL ============
const MobileRepairSchema = new mongoose.Schema({
  shopId: { type: String, required: true, index: true },
  
  // Customer
  customerId: { type: String, default:'guest', index:true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true, index:true },
  customerEmail: { type: String, default:'' },
  pickupAddress: { type: String, default:'' },
  
  // Device
  deviceBrand: { type: String, required: true },
  deviceModel: { type: String, required: true },
  deviceColor: { type: String, default:'' },
  deviceImei: { type: String, default:'' },
  
  // Issue
  issue: { type: String, required: true, enum: ['screen','battery','charging','software','water','speaker','camera','motherboard','mic','button','other'], index:true },
  description: { type: String, default:'' },
  images: [{ type: String }],
  
  // Booking
  repairId: { type: String, unique:true, index:true },
  bookingDate: { type: Date, default:Date.now },
  preferredDate: { type: Date, default:Date.now },
  pickupRequired: { type: Boolean, default:true },
  
  // Status - common/delivery/delivery-status.html
  status: { type: String, enum: ['pending','confirmed','picked','diagnosing','waiting_for_parts','repairing','testing','ready','out_for_delivery','delivered','cancelled','returned'], default:'pending', index:true },
  statusHistory: [{ status: String, timestamp: { type: Date, default:Date.now }, notes: String, updatedBy: String }],
  
  // Cost - common/wallet/*
  estimatedCost: { type: Number, default:0 },
  partsCost: { type: Number, default:0 },
  serviceCharge: { type: Number, default:200 },
  actualCost: { type: Number, default:0 },
  discount: { type: Number, default:0 },
  finalCost: { type: Number, default:0 },
  
  // Time
  estimatedTime: { type: String, default:'2-3 days' },
  estimatedDelivery: { type: Date },
  actualDelivery: { type: Date },
  
  // Staff
  assignedStaff: { type: String, default:'' },
  deliveryBoyId: { type: String, default:'' },
  
  // Warranty on repair
  repairWarranty: { type: String, default:'30 Days' },
  repairWarrantyTill: { type: Date },
  
  createdAt: { type: Date, default:Date.now },
  updatedAt: { type: Date, default:Date.now }
}, { timestamps: true });

MobileRepairSchema.index({ shopId:1, status:1 });
MobileRepairSchema.index({ repairId:1 });
MobileRepairSchema.pre('save', function(next){
  if(!this.repairId){ this.repairId=`REP-${Date.now().toString().substr(-6)}${Math.random().toString(36).substr(2,3).toUpperCase()}`; }
  if(this.estimatedCost &&!this.finalCost){ this.finalCost=this.estimatedCost-this.discount; }
  if(this.actualCost){ this.finalCost=this.actualCost-this.discount; }
  this.updatedAt=new Date();
  next();
});

// ============ 3. MOBILE EXCHANGE MODEL ============
const MobileExchangeSchema = new mongoose.Schema({
  shopId: { type: String, required: true, index: true },
  
  // Customer
  customerId: { type: String, default:'guest', index:true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true, index:true },
  
  // Old phone
  oldBrand: { type: String, required: true },
  oldModel: { type: String, required: true },
  oldVariant: { type: String, default:'' },
  oldCondition: { type: String, enum: ['excellent','good','fair','poor'], default:'good', index:true },
  oldImei: { type: String, default:'' },
  oldImages: [{ type: String }],
  
  // New phone
  newProductId: { type: String, required: true, index:true },
  newProductName: { type: String, required: true },
  newProductPrice: { type: Number, required: true },
  
  // Exchange calculation
  exchangeId: { type: String, unique:true, index:true },
  exchangeValue: { type: Number, default:0 },
  bonus: { type: Number, default:1000 },
  totalExchangeValue: { type: Number, default:0 },
  finalPrice: { type: Number, default:0 },
  saving: { type: Number, default:0 },
  
  // Status
  status: { type: String, enum: ['quoted','accepted','pending_pickup','picked','inspected','approved','rejected','completed','cancelled'], default:'quoted', index:true },
  statusHistory: [{ status: String, timestamp: { type: Date, default:Date.now }, notes: String }],
  
  // Inspection
  inspectedBy: { type: String, default:'' },
  inspectedAt: { type: Date },
  finalExchangeValue: { type: Number, default:0 },
  
  // Pickup
  pickupAddress: { type: String, default:'' },
  pickupDate: { type: Date },
  deliveryBoyId: { type: String, default:'' },
  
  // Valid
  quotedAt: { type: Date, default:Date.now },
  validTill: { type: Date, default:()=> new Date(Date.now()+7*24*3600000) },
  
  createdAt: { type: Date, default:Date.now },
  updatedAt: { type: Date, default:Date.now }
}, { timestamps: true });

MobileExchangeSchema.index({ shopId:1, status:1 });
MobileExchangeSchema.index({ exchangeId:1 });
MobileExchangeSchema.pre('save', function(next){
  if(!this.exchangeId){ this.exchangeId=`EX-${Date.now().toString().substr(-6)}`; }
  if(this.exchangeValue &&!this.totalExchangeValue){ this.totalExchangeValue=this.exchangeValue+this.bonus; }
  if(this.newProductPrice && this.totalExchangeValue &&!this.finalPrice){ this.finalPrice=this.newProductPrice-this.totalExchangeValue; this.saving=this.totalExchangeValue; }
  this.updatedAt=new Date();
  next();
});

// ============ 4. MOBILE EMI MODEL ============
const MobileEmiSchema = new mongoose.Schema({
  shopId: { type: String, required: true, index: true },
  
  // Customer
  customerId: { type: String, default:'guest', index:true },
  customerPhone: { type: String, default:'', index:true },
  
  // Product
  productId: { type: String, required: true, index:true },
  productName: { type: String, required: true },
  productPrice: { type: Number, required: true },
  
  // EMI
  emiId: { type: String, unique:true, index:true },
  downPayment: { type: Number, default:0 },
  loanAmount: { type: Number, required: true },
  tenure: { type: Number, required: true, enum: [3,6,9,12,18,24,36], default:12, index:true },
  interestRate: { type: Number, default:12 },
  monthlyRate: { type: Number, default:0.01 },
  emi: { type: Number, required: true },
  totalPayment: { type: Number, required: true },
  totalInterest: { type: Number, required: true },
  
  // Breakdown
  breakdown: [{ month: Number, emi: Number, principal: Number, interest: Number, balance: Number, dueDate: Date, status: { type: String, enum: ['pending','paid','overdue'], default:'pending' } }],
  
  // Offer
  isNoCostEmi: { type: Boolean, default:false },
  bank: { type: String, default:'' },
  applicationStatus: { type: String, enum: ['calculated','applied','pending','approved','rejected','active','completed','cancelled'], default:'calculated', index:true },
  
  // Valid
  calculatedAt: { type: Date, default:Date.now },
  validTill: { type: Date, default:()=> new Date(Date.now()+7*24*3600000) },
  
  createdAt: { type: Date, default:Date.now },
  updatedAt: { type: Date, default:Date.now }
}, { timestamps: true });

MobileEmiSchema.index({ shopId:1, productId:1 });
MobileEmiSchema.index({ emiId:1 });
MobileEmiSchema.pre('save', function(next){
  if(!this.emiId){ this.emiId=`EMI-${Date.now().toString().substr(-6)}`; }
  if(!this.monthlyRate && this.interestRate){ this.monthlyRate=this.interestRate/(12*100); }
  if(this.loanAmount && this.tenure && this.monthlyRate &&!this.emi){
    const emi=this.loanAmount*this.monthlyRate*Math.pow(1+this.monthlyRate, this.tenure)/(Math.pow(1+this.monthlyRate, this.tenure)-1);
    this.emi=Math.round(emi); this.totalPayment=Math.round(emi*this.tenure); this.totalInterest=Math.round(this.totalPayment-this.loanAmount);
  }
  this.updatedAt=new Date();
  next();
});

// ============ EXPORT ALL MODELS FROM SINGLE FILE ============
const MobileProduct = mongoose.models.MobileProduct || mongoose.model('MobileProduct', MobileProductSchema);
const MobileRepair = mongoose.models.MobileRepair || mongoose.model('MobileRepair', MobileRepairSchema);
const MobileExchange = mongoose.models.MobileExchange || mongoose.model('MobileExchange', MobileExchangeSchema);
const MobileEmi = mongoose.models.MobileEmi || mongoose.model('MobileEmi', MobileEmiSchema);

module.exports = {
  MobileProduct,
  MobileRepair,
  MobileExchange,
  MobileEmi,
  MobileProductSchema,
  MobileRepairSchema,
  MobileExchangeSchema,
  MobileEmiSchema
};