const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Manager name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  area: {
    type: String,
    required: [true, 'Area is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Phone must be exactly 10 digits']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },

  serviceCharge: {
    type: Number,
    default: 5,
    min: [0, 'Service charge cannot be negative'],
    max: [50, 'Service charge cannot exceed 50%']
  },

  documents: {
    aadhar: {
      type: String,
      default: ''
    },
    pan: {
      type: String,
      default: ''
    },
    photo: {
      type: String,
      default: ''
    },
    addressProof: {
      type: String,
      default: ''
    }
  },

  moduleAccess: {
    type: [String],
    default: [],
    required: [true, 'Module access is required'],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'At least one module access is required'
    }
  },

  loginToken: {
    type: String,
    unique: true,
    sparse: true,
    default: undefined
  },
  tempPassword: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for faster queries
managerSchema.index({ area: 1, status: 1 });
managerSchema.index({ moduleAccess: 1 });
managerSchema.index({ phone: 1 });

// Pre-save hook to ensure email is lowercase
managerSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

module.exports = mongoose.model('Manager', managerSchema);