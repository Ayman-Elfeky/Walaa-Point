const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
    merchant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant',
        required: true
    },

    enabled: {
        type: Boolean,
        required: true,
        default: false
    },

    description: String,

    pointsRequired: {
        type: Number,
        default: 150,
        required: true
    },
    
    rewardType: {
        type: String,
        enum: ['discountOrderPrice', 'discountShipping', 'discountOrderPercent', 'cashback', 'freeProduct'],
        default: 'discountOrderPrice'
    },

    rewardValue: {
        type: Number,
        default: 10,
        required: true // e.g., 10 => 10% off or 10 EGP
    },

    expiresAt: Date,

    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Reward = mongoose.model('Reward', rewardSchema);
module.exports = Reward;
