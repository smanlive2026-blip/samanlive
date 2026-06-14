const mongoose = require('mongoose');

const shopHistorySchema = new mongoose.Schema({
    managerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Manager', 
        required: true 
    },
    shopId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Shop', 
        required: true 
    },
    shopName: { 
        type: String, 
        required: true,
        trim: true 
    },
    action: { 
        type: String, 
        enum: ['create', 'edit', 'delete', 'approve', 'reject', 'activate', 'deactivate'], 
        required: true 
    },
    oldData: { 
        type: mongoose.Schema.Types.Mixed, 
        default: {} 
    }, // ← Mixed use kiya - flexible
    newData: { 
        type: mongoose.Schema.Types.Mixed, 
        default: {} 
    }, // ← Mixed use kiya
    changedFields: [{ 
        type: String 
    }], // ← Naya add kiya - kaun se fields change hue
    area: { 
        type: String, 
        default: '',
        trim: true 
    },
    ipAddress: { 
        type: String, 
        default: '' 
    }, // ← Naya add kiya - kis IP se action hua
    userAgent: { 
        type: String, 
        default: '' 
    }, // ← Naya add kiya - browser info
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for fast queries
shopHistorySchema.index({ managerId: 1, createdAt: -1 });
shopHistorySchema.index({ shopId: 1, createdAt: -1 });
shopHistorySchema.index({ action: 1 });
shopHistorySchema.index({ area: 1 });
shopHistorySchema.index({ timestamp: -1 });

// Virtual for action display text
shopHistorySchema.virtual('actionText').get(function() {
    const actionMap = {
        'create': 'Shop Banayi',
        'edit': 'Shop Edit Ki',
        'delete': 'Shop Delete Ki',
        'approve': 'Shop Approve Ki',
        'reject': 'Shop Reject Ki',
        'activate': 'Shop Activate Ki',
        'deactivate': 'Shop Deactivate Ki'
    };
    return actionMap[this.action] || this.action;
});

// Static method to log action
shopHistorySchema.statics.logAction = async function(data) {
    return await this.create({
        managerId: data.managerId,
        shopId: data.shopId,
        shopName: data.shopName,
        action: data.action,
        oldData: data.oldData || {},
        newData: data.newData || {},
        changedFields: data.changedFields || [],
        area: data.area || '',
        ipAddress: data.ipAddress || '',
        userAgent: data.userAgent || ''
    });
};

module.exports = mongoose.models.ShopHistory || mongoose.model('ShopHistory', shopHistorySchema);