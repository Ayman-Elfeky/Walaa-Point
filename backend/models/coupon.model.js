const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
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

// Optional: Expire coupon automatically if needed (e.g., using TTL index)
couponSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon; 
