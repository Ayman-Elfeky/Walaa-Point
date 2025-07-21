const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import models
const Merchant = require('../models/merchant.model');
const Customer = require('../models/customer.model');

// Import webhook controller
const webhookLogic = require('../controllers/webhook.controller');

// Mock order created payload with your email
const mockOrderPayload = {
    "event": "order.created",
    "merchant": 1305146709,
    "created_at": "Sun Jun 26 2022 12:21:48 GMT+0300",
    "data": {
        "id": 2116149737,
        "reference_id": 41027662,
        "currency": "SAR",
        "amounts": {
            "sub_total": {
                "amount": 186,
                "currency": "SAR"
            },
            "shipping_cost": {
                "amount": 15,
                "currency": "SAR"
            },
            "total": {
                "amount": 196,
                "currency": "SAR"
            }
        },
        "customer": {
            "id": 225167971,
            "first_name": "Ayman",
            "last_name": "Elfeky",
            "mobile": 501806978,
            "mobile_code": "+966",
            "email": "aywork73@gmail.com", // Your email
            "gender": "male",
            "birthday": {
                "date": "1990-01-15 00:00:00.000000",
                "timezone_type": 3,
                "timezone": "Asia/Riyadh"
            },
            "city": "الرياض",
            "country": "السعودية",
            "country_code": "SA",
            "currency": "SAR"
        },
        "items": [
            {
                "id": 70815337,
                "name": "Test Product",
                "sku": "TEST-SKU-001",
                "quantity": 1,
                "currency": "SAR",
                "weight": 0.25,
                "amounts": {
                    "price_without_tax": {
                        "amount": 186,
                        "currency": "SAR"
                    },
                    "total": {
                        "amount": 186,
                        "currency": "SAR"
                    }
                }
            }
        ]
    }
};

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ Database connection error:', error);
        process.exit(1);
    }
}

async function setupTestData() {
    try {
        console.log('🧹 Cleaning up existing test data...');

        // Clean up existing test data
        await Merchant.deleteMany({ merchantId: '1305146709' });
        await Customer.deleteMany({ customerId: 225167971 });

        console.log('👤 Creating test merchant...');

        // Create test merchant
        const testMerchant = new Merchant({
            installerMobile: '+966501234567',
            installerRole: 'admin',
            installerName: 'Ayman Elfeky',
            installerEmail: 'aywork73@gmail.com',
            installationId: 'test-installation-' + Date.now(),
            merchantUsername: 'test-merchant-ayman',
            merchantName: 'Ayman Test Store',
            merchantId: '1305146709', // Match the payload
            merchantAvatar: 'https://example.com/avatar.jpg',
            merchantDomain: 'ayman-test-store.salla.sa',
            password: '$2a$10$hashedPasswordForTesting',
            accessToken: 'test-access-token-' + Date.now(),
            refreshToken: 'test-refresh-token-' + Date.now(),
            storeId: '1305146709',
            loyaltySettings: {
                pointsPerCurrencyUnit: 1, // 1 point per 1 SAR
                purchasePoints: {
                    enabled: true,
                    points: 10 // 10 points per purchase
                },
                purchaseAmountThresholdPoints: {
                    enabled: true,
                    thresholdAmount: 100, // 100 SAR threshold
                    points: 50 // 50 bonus points for orders above 100 SAR
                }
            }
        });

        await testMerchant.save();
        console.log(`✅ Test merchant created: ${testMerchant.merchantName}`);

        console.log('👥 Creating test customer...');

        // Create test customer
        const testCustomer = new Customer({
            customerId: 225167971, // Match the payload
            name: 'Ayman Elfeky',
            email: 'aywork73@gmail.com',
            phone: '+966501806978',
            dateOfBirth: new Date('1990-01-15'),
            merchant: testMerchant._id,
            loyaltyPoints: 100, // Starting with 100 points
            tier: 'bronze'
        });

        await testCustomer.save();
        console.log(`✅ Test customer created: ${testCustomer.name} with ${testCustomer.loyaltyPoints} points`);

        return { testMerchant, testCustomer };

    } catch (error) {
        console.error('❌ Error setting up test data:', error);
        throw error;
    }
}

async function testOrderCreatedWebhook() {
    try {
        console.log('\n🚀 Testing order.created webhook...\n');

        // Mock Express request and response objects
        const mockReq = {
            body: mockOrderPayload
        };

        let responseData = null;
        let responseStatus = null;

        const mockRes = {
            status: (code) => {
                responseStatus = code;
                return {
                    json: (data) => {
                        responseData = data;
                        console.log(`📤 Response Status: ${code}`);
                        console.log('📤 Response Data:', JSON.stringify(data, null, 2));
                        return data;
                    }
                };
            }
        };

        // Call the webhook logic
        console.log('🔄 Processing webhook...');
        await webhookLogic(mockReq, mockRes);

        // Check if the response was successful
        if (responseStatus === 200) {
            console.log('\n✅ Webhook processed successfully!');

            // Verify customer points were updated
            const updatedCustomer = await Customer.findOne({ customerId: 225167971 });
            if (updatedCustomer) {
                console.log(`🎉 Customer loyalty points updated: ${updatedCustomer.loyaltyPoints} points`);
                console.log(`📊 Points gained: ${updatedCustomer.loyaltyPoints - 100} points`);
            }
        } else {
            console.log('\n❌ Webhook processing failed!');
        }

        return { responseStatus, responseData };

    } catch (error) {
        console.error('❌ Error testing webhook:', error);
        throw error;
    }
}

async function runTest() {
    console.log('🧪 Starting Order Created Webhook Mock Test\n');
    console.log('📧 Using email: aywork73@gmail.com\n');

    try {
        // Connect to database
        await connectDB();

        // Setup test data
        const { testMerchant, testCustomer } = await setupTestData();

        // Test the webhook
        const result = await testOrderCreatedWebhook();

        console.log('\n📋 Test Summary:');
        console.log(`   Merchant: ${testMerchant.merchantName} (ID: ${testMerchant.merchantId})`);
        console.log(`   Customer: ${testCustomer.name} (ID: ${testCustomer.customerId})`);
        console.log(`   Order Amount: ${mockOrderPayload.data.amounts.total.amount} SAR`);
        console.log(`   Response Status: ${result.responseStatus}`);
        console.log(`   Success: ${result.responseStatus === 200 ? '✅ YES' : '❌ NO'}`);

        console.log('\n🎯 Test completed successfully!');

    } catch (error) {
        console.error('\n💥 Test failed:', error);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run the test
if (require.main === module) {
    runTest();
}

module.exports = {
    mockOrderPayload,
    runTest
};
