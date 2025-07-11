const mongoose = require('mongoose');

const customerLoyaltyActivitySchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    merchantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant',
        required: true
    },
    event: {
        type: String,
        required: true
    }, // e.g., 'feedback', 'birthday', 'purchase'
    points: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: Object
    }
});

module.exports = mongoose.model('CustomerLoyaltyActivity', customerLoyaltyActivitySchema);
