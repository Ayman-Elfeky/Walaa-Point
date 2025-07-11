const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import models
const Merchant = require('../models/merchant.model');
const Customer = require('../models/customer.model');
const Reward = require('../models/reward.model');
const Transaction = require('../models/transaction.model');
const CustomerLoyaltyActivity = require('../models/customerLoyalityActivitySchema.model');
const Coupon = require('../models/coupon.model');

const connectDB = async () => {
    try {
        console.log('MONGO_URI:', process.env.MONGO_URI);
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI environment variable is not defined');
        }
        
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

const deleteTestData = async () => {
    try {
        console.log('🚀 Starting comprehensive test data deletion...\n');

        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await Promise.all([
            Merchant.deleteMany({}),
            Customer.deleteMany({}),
            Reward.deleteMany({}),
            Transaction.deleteMany({}),
            CustomerLoyaltyActivity.deleteMany({}),
            Coupon.deleteMany({})
        ]);
        console.log('✅ Existing data cleared\n');
    } catch (error) {
        console.error('Error clearing existing data:', error.message);
    }
}

connectDB().then(async () => {
    await deleteTestData();
    console.log('✅ Comprehensive test data deletion completed successfully');
    mongoose.connection.close();
}).catch((error) => {
    console.error('Error during comprehensive test data deletion:', error.message);
    mongoose.connection.close();
});