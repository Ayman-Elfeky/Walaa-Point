const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
    merchant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant',
        required: true
    },

    title: {
        type: String,
        required: true
    },

    description: String,

    pointsRequired: {
        type: Number,
        required: true
    },

    rewardType: {
        type: String,
        enum: ['discount', 'coupon'],
        default: 'discount'
    },

    rewardValue: {
        type: Number,
        required: true // e.g., 10 => 10% off or 10 EGP
    },

    expiresAt: Date,

    isActive: {
        type: Boolean,
        default: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Reward', rewardSchema);
