const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['ad', 'video', 'campaign'], 
    required: true 
  },
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    default: '',
    trim: true 
  },
  buttonText: { 
    type: String, 
    default: 'Learn More',
    trim: true 
  },
  buttonLink: { 
    type: String, 
    default: '',
    trim: true 
  },
  color: { 
    type: String, 
    default: '#3b82f6' 
  },
  url: { 
    type: String, 
    default: '',
    trim: true 
  }, // Video URL ke liye
  thumbnail: { 
    type: String, 
    default: '' 
  }, // ← Naya add kiya - video thumbnail ke liye
  views: { 
    type: Number, 
    default: 0 
  }, // ← Naya add kiya - analytics
  clicks: { 
    type: Number, 
    default: 0 
  }, // ← Naya add kiya - button clicks
  priority: { 
    type: Number, 
    default: 0 
  },
  status: { 
    type: String, 
    enum: ['active', 'hidden'], 
    default: 'active' 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  } // ← Naya add kiya - kisne banaya
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for fast queries
contentSchema.index({ type: 1, status: 1 });
contentSchema.index({ priority: -1 }); // High priority first
contentSchema.index({ createdAt: -1 });
contentSchema.index({ status: 1 });

// Virtual for engagement rate
contentSchema.virtual('engagementRate').get(function() {
  if (this.views === 0) return 0;
  return ((this.clicks / this.views) * 100).toFixed(2);
});

module.exports = mongoose.models.Content || mongoose.model('Content', contentSchema);