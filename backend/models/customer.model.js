const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    merchant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant',
        required: true
    },

    customerId: {
        type: String,
        required: true
    },

    appliedRewards: [{
        reward: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Reward'
        },
        appliedAt: {
            type: Date,
            default: Date.now
        }
    }],

    name: { 
        type: String,
        required: true,
     },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    dateOfBirth: { type: Date },

    orderCount: {
        type: Number,
        default: 0
    },
    
    // Total amount spent by customer (in merchant's currency)
    totalSpent: {
        type: Number,
        default: 0
    },
    
    points: {
        type: Number,
        default: 0
    },

    // Customer loyalty tier based on points/spending
    tier: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum'],
        default: 'bronze'
    },

    avatar: {
        type: String
    },

    shareCount: {
        type: Number,
        default: 0
    },

    metadata: { type: Object }, // optional for extra Salla info

    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true // adds createdAt and updatedAt
});

// Prevent duplicate customerId for same merchant
customerSchema.index({ customerId: 1, merchant: 1 }, { unique: true });

module.exports = mongoose.model('Customer', customerSchema);
