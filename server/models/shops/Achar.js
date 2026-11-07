// LOCATION: server/models/shops/Achar.js - ACHAR SHOP MODEL - V27 FINAL - SHOP 1
// RULE: shopId = Shop._id (String). Phone hamesha 10 digit. Price kabhi NaN nahi. Image = img hamesha sync.

const mongoose = require('mongoose');

function normPhone(v){
  if(v === undefined || v === null) return v;
  const d = String(v).replace(/\D/g, '');
  if(!d) return v;
  return d.length > 10 ? d.slice(-10) : d;
}
function num(v, fallback){
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const acharItemSchema = new mongoose.Schema({
    id: { type: String, default: () => Date.now().toString() + Math.random().toString(36).slice(2,6) },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ['Aam', 'Nimbu', 'Mix', 'Murabba', 'Gajar', 'Lahsun', 'Mirchi', 'Other'], default: 'Aam' },
    description: { type: String, default: '' },
    price500: { type: Number, default: 0 },
    price1kg: { type: Number, required: true, default: 0 },
    price: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    jarType: { type: String, enum: ['Glass', 'Plastic', 'Ceramic'], default: 'Glass' },
    spiceLevel: { type: String, enum: ['Mild', 'Medium', 'Teekha'], default: 'Medium' },
    image: { type: String, default: 'https://placehold.co/400/eab308/fff?text=Achar' },
    img: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const acharOrderSchema = new mongoose.Schema({
    trackingId: String,
    customerName: String,
    phone: { type: String, set: normPhone },
    address: String,
    items: [Object],
    total: Number,
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const acharSchema = new mongoose.Schema({
    shopId: { type: String, required: true, unique: true, index: true },
    items: [acharItemSchema],
    orders: [acharOrderSchema],

     // YE LOCATION WALE FIELD ADD KAR
    ownerName: { type: String, default: '' },
    fullAddress: { type: String, default: '' },
    shopAddress: { type: String, default: '' },
    locationType: { type: String, enum: ['fixed', 'dynamic'], default: 'fixed' },
    deliveryRange: { type: Number, default: 5 },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0,0] } // [lng, lat]
    },

    settings: {
        isOpen: { type: Boolean, default: true },
        announcement: { type: String, default: '' },
        bannerPhotoUrl: { type: String, default: '' },
        ownerPhotoUrl: { type: String, default: '' },
        openTime: { type: String, default: '9:00 AM' },
        closeTime: { type: String, default: '9:00 PM' }
    },
    bannerPhotoUrl: { type: String, default: '' },
    ownerPhotoUrl: { type: String, default: '' },
    phone: { type: String, default: '', set: normPhone },
    announcement: { type: String, default: '' },
}, { timestamps: true });

// V27: 2dsphere index sahi jagah - schema level pe, coordinates ke andar nahi
acharSchema.index({ location: '2dsphere' });
acharSchema.index({ updatedAt: -1 });

// V27 NEW - PRE SAVE HOOK - Pehle koi hook tha hi nahi
// Price kabhi NaN nahi, image/img sync, phone normalize, id unique
acharSchema.pre('save', function(next){
  try{
    if(this.phone) this.phone = normPhone(this.phone);
    (this.orders || []).forEach(o => {
      if(o.phone) o.phone = normPhone(o.phone);
      if(o.total !== undefined) o.total = num(o.total, 0);
    });
    (this.items || []).forEach(it => {
      it.price500 = num(it.price500, 0);
      it.price1kg = num(it.price1kg, 0);
      it.price = num(it.price, it.price1kg || 0);
      it.stock = num(it.stock, 0);
      if(it.image) it.img = it.image;
      else if(it.img) it.image = it.img;
      if(!it.id) it.id = Date.now().toString() + Math.random().toString(36).slice(2,6);
    });
    if(this.deliveryRange !== undefined) this.deliveryRange = num(this.deliveryRange, 5);
  }catch(e){}
  next();
});

module.exports = mongoose.models.Achar || mongoose.model('Achar', acharSchema);