const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
    merchant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant',
        required: true
    },

    name: {
        type: String,
        required: true
    },

    nameEn: {
        type: String
    },

    description: {
        type: String,
        required: true
    },

    descriptionEn: {
        type: String
    },

    pointsRequired: {
        type: Number,
        required: true,
        default: 100
    },
    
    rewardType: {
        type: String,
        enum: ['percentage', 'fixed', 'shipping', 'cashback', 'product'],
        required: true,
        default: 'percentage'
    },

    rewardValue: {
        type: Number,
        required: true,
        default: 10 // e.g., 10 => 10% off or 10 SAR discount
    },

    minOrderValue: {
        type: Number,
        default: 0
    },

    maxUsagePerCustomer: {
        type: Number,
        default: 1
    },

    maxTotalUsage: {
        type: Number,
        default: 1000
    },

    currentUsage: {
        type: Number,
        default: 0
    },

    isActive: {
        type: Boolean,
        default: true
    },

    validFrom: {
        type: Date,
        default: Date.now
    },

    validUntil: {
        type: Date
    },

    category: {
        type: String,
        default: 'general'
    },

    terms: [{
        type: String
    }],

    termsEn: [{
        type: String
    }],

    // Legacy field for backward compatibility
    enabled: {
        type: Boolean,
        default: function() {
            return this.isActive;
        }
    },

    // Legacy field names for backward compatibility
    expiresAt: {
        type: Date,
        get: function() {
            return this.validUntil;
        },
        set: function(value) {
            this.validUntil = value;
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
});

// Virtual for compatibility
rewardSchema.virtual('type').get(function() {
    return this.rewardType;
});

rewardSchema.virtual('value').get(function() {
    return this.rewardValue;
});

const Reward = mongoose.model('Reward', rewardSchema);
module.exports = Reward;
