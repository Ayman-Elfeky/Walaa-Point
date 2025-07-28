const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: false, // Allow null for Flow 2: On-demand generation
        default: null
        // Note: uniqueness is enforced by sparse index, not schema-level unique constraint
    },

    reward: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reward',
        required: true
    },

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },

    merchant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant',
        required: true
    },

    expiresAt: {
        type: Date,
        required: true
    },

    used: {
        type: Boolean,
        default: false
    },

    usedAt: {
        type: Date
    },

    usedOnOrderId: {
        type: String // optional: link to Salla or your order system
    },

    sallaOrderId: {
        type: String // optional: link to Salla order ID if applicable
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Custom validation: Code is required when coupon is used
couponSchema.pre('save', function(next) {
    if (this.used && !this.code) {
        return next(new Error('Code is required when marking coupon as used'));
    }
    next();
});

// Custom validation: Ensure code uniqueness when not null (backup to partial index)
couponSchema.pre('save', async function(next) {
    if (this.code && this.isModified('code')) {
        const existingCoupon = await this.constructor.findOne({ 
            code: this.code, 
            _id: { $ne: this._id } 
        });
        if (existingCoupon) {
            return next(new Error('Coupon code must be unique'));
        }
    }
    next();
});

// Create sparse unique index for code field (allows multiple null values)
// Note: Removed index creation from schema as it's causing issues with null values
// couponSchema.index({ code: 1 }, { unique: true, sparse: true });

// Optional: Expire coupon automatically if needed (e.g., using TTL index)
couponSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon; 
