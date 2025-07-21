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

    name: { type: String },
    email: { type: String },
    phone: { type: String },
    dateOfBirth: { type: Date },

    orderCount: {
        type: Number,
        default: 0
    },
    
    points: {
        type: Number,
        default: 0
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
