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
    name: String,
    email: String,
    phone: String,
    dateOfBirth: Date,

    points: {
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
