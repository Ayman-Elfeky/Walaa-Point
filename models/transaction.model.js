const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    merchant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    type: {
        type: String,
        enum: ['earn', 'redeem'],
        required: true
    },
    points: {
        type: Number,
        required: true
    },
    description: {
        type: String
    },
    orderId: { // If linked to a specific order in Salla
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);
