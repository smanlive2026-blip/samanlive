const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true, index: true },
    email: { type: String, sparse: true, unique: true }, // optional
    
    password: { type: String, required: true },
    
    role: { 
        type: String, 
        enum: ['customer', 'shop', 'admin'], 
        default: 'shop' 
    },

    // Shop owner ke liye
    shops: [{ type: String }], // ['furniture_ajay', 'fruit_ajay'] - uske sab shopId

    // Profile
    photoUrl: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    otp: String,
    otpExpiry: Date,

    createdAt: { type: Date, default: Date.now }
});

// Password hash karne ke liye
userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Password compare karne ke liye
userSchema.methods.comparePassword = async function(candidatePassword){
    return await bcrypt.compare(candidatePassword, this.password);
}

module.exports = mongoose.model('User', userSchema);