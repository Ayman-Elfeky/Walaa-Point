const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    merchant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant',
        required: true
    },
    customerId: { // from Salla (external)
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

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Customer', customerSchema);
