const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    // Basic Info
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    icon: {
        type: String,
        default: '📦'
    },
    color: {
        type: String,
        default: '#6366f1'
    },
    image: {
        type: String,
        default: ''
    },
    desc: {
        type: String,
        default: '',
        trim: true
    },

    // Relations
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: true,
        index: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    }, // Sub-category support

    // Grouping
    group: {
        type: String,
        default: 'General',
        trim: true,
        index: true
    }, // Food, Grocery, Electronics, etc

    // Area Targeting
    area: [{
        type: String,
        trim: true
    }], // ["Surat", "Ahmedabad"] ya [] for all areas

    // Status & Priority
    status: {
        type: String,
        enum: ['active', 'hidden', 'deleted'],
        default: 'active',
        index: true
    },
    priority: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }, // High priority pehle dikhega

    // Stats
    shopCount: {
        type: Number,
        default: 0
    },
    productCount: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },

    // SEO
    metaTitle: {
        type: String,
        default: ''
    },
    metaDescription: {
        type: String,
        default: ''
    },

    // Creator
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ==================== INDEXES ====================
categorySchema.index({ moduleId: 1, status: 1 });
categorySchema.index({ group: 1, status: 1 });
categorySchema.index({ priority: -1 });
categorySchema.index({ name: 'text', desc: 'text' }); // Text search

// ==================== VIRTUALS ====================
// Check if category is active
categorySchema.virtual('isActive').get(function() {
    return this.status === 'active';
});

// Full path - for subcategories
categorySchema.virtual('fullPath').get(async function() {
    if (!this.parentId) return this.name;
    const parent = await this.model('Category').findById(this.parentId);
    return parent? `${parent.name} > ${this.name}` : this.name;
});

// ==================== METHODS ====================
// Increment views
categorySchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Update shop count
categorySchema.methods.updateShopCount = async function() {
    const Shop = mongoose.model('Shop');
    this.shopCount = await Shop.countDocuments({
        serviceType: this._id.toString(),
        status: 'approved',
        isActive: true
    });
    return this.save();
};

// ==================== STATICS ====================
// Get active categories by module
categorySchema.statics.getByModule = async function(moduleId) {
    return await this.find({
        moduleId,
        status: 'active'
    })
   .sort({ priority: -1, name: 1 })
   .populate('moduleId', 'name icon');
};

// Get categories by group
categorySchema.statics.getByGroup = async function(group) {
    return await this.find({
        group,
        status: 'active'
    })
   .sort({ priority: -1 })
   .populate('moduleId', 'name icon');
};

// Get all active categories
categorySchema.statics.getActive = async function() {
    return await this.find({ status: 'active' })
   .sort({ priority: -1, name: 1 })
   .populate('moduleId', 'name icon');
};

// ==================== PRE SAVE ====================
categorySchema.pre('save', function(next) {
    // Auto-generate slug from name
    if (this.isModified('name') &&!this.slug) {
        this.slug = this.name
           .toLowerCase()
           .replace(/[^a-z0-9]+/g, '-')
           .replace(/^-+|-+$/g, '');
    }
    next();
});

// ==================== POST SAVE ====================
// Update Module.categoryDetails when Category changes
categorySchema.post('save', async function(doc) {
    try {
        const Module = mongoose.model('Module');
        const module = await Module.findById(doc.moduleId);

        if (module) {
            const categoryData = {
                id: doc._id.toString(),
                name: doc.name,
                icon: doc.icon,
                color: doc.color,
                group: doc.group,
                status: doc.status === 'active',
                desc: doc.desc,
                area: doc.area
            };

            // Update or add to module.categoryDetails
            const existingIdx = module.categoryDetails.findIndex(c => c.id === doc._id.toString());

            if (existingIdx >= 0) {
                module.categoryDetails[existingIdx] = categoryData;
            } else {
                module.categoryDetails.push(categoryData);
            }

            await module.save();
        }
    } catch (err) {
        console.error('Module sync error:', err);
    }
});

// ==================== POST REMOVE ====================
// Remove from Module.categoryDetails when Category deleted
categorySchema.post('remove', async function(doc) {
    try {
        const Module = mongoose.model('Module');
        await Module.findByIdAndUpdate(doc.moduleId, {
            $pull: { categoryDetails: { id: doc._id.toString() } }
        });
    } catch (err) {
        console.error('Module cleanup error:', err);
    }
});

module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema);