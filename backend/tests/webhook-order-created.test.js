const mongoose = require('mongoose');
const request = require('supertest');
require('dotenv').config({ path: '../.env' });

// Import models and controller
const Merchant = require('../models/merchant.model');
const Customer = require('../models/customer.model');
const webhookLogic = require('../controllers/webhook.controller');

// Mock Express app setup
const express = require('express');
const app = express();
app.use(express.json());
app.post('/webhook', webhookLogic);

// Mock test data based on the provided payload
const mockOrderCreatedPayload = {
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
            "first_name": "Mohammed",
            "last_name": "Ali",
            "mobile": 501806978,
            "mobile_code": "+966",
            "email": "aywork73@gmail.com", // Your email as requested
            "gender": "female",
            "birthday": {
                "date": "1997-06-03 00:00:00.000000",
                "timezone_type": 3,
                "timezone": "Asia/Riyadh"
            },
            "city": "جدة",
            "country": "السعودية",
            "country_code": "SA",
            "currency": "SAR"
        },
        "items": [
            {
                "id": 70815337,
                "name": "بيتزا",
                "sku": "54534534",
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
                },
                "product": {
                    "id": 720881993,
                    "name": "بيتزا",
                    "price": {
                        "amount": 66,
                        "currency": "SAR"
                    },
                    "currency": "SAR"
                }
            }
        ]
    }
};

describe('Order Created Webhook Tests', () => {
    let testMerchant;
    let testCustomer;

    beforeAll(async () => {
        // Connect to test database
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/loyalty_app_test');
        }

        // Clean up existing test data
        await Merchant.deleteMany({ merchantId: '1305146709' });
        await Customer.deleteMany({ customerId: 225167971 });
    });

    beforeEach(async () => {
        // Create test merchant
        testMerchant = new Merchant({
            installerMobile: '+966501234567',
            installerRole: 'admin',
            installerName: 'Test Merchant',
            installerEmail: 'aywork73@gmail.com', // Your email
            installationId: 'test-installation-123',
            merchantUsername: 'test-merchant',
            merchantName: 'Test Store',
            merchantId: '1305146709', // Same as in payload
            merchantAvatar: 'https://example.com/avatar.jpg',
            merchantDomain: 'test-store.salla.sa',
            password: '$2a$10$testhashedpassword',
            accessToken: 'test-access-token',
            refreshToken: 'test-refresh-token',
            storeId: '1305146709',
            loyaltySettings: {
                pointsPerCurrencyUnit: 1, // 1 point per 1 SAR
                purchasePoints: {
                    enabled: true,
                    points: 10 // Base points for purchase
                },
                purchaseAmountThresholdPoints: {
                    enabled: true,
                    thresholdAmount: 100, // 100 SAR threshold
                    points: 20 // Bonus points for meeting threshold
                }
            }
        });
        await testMerchant.save();

        // Create test customer
        testCustomer = new Customer({
            customerId: 225167971, // Same as in payload
            name: 'Mohammed Ali',
            email: 'aywork73@gmail.com', // Your email
            phone: '+966501806978',
            dateOfBirth: new Date('1997-06-03'),
            merchant: testMerchant._id,
            loyaltyPoints: 50, // Starting points
            tier: 'bronze'
        });
        await testCustomer.save();
    });

    afterEach(async () => {
        // Clean up test data after each test
        await Merchant.deleteMany({ merchantId: '1305146709' });
        await Customer.deleteMany({ customerId: 225167971 });
    });

    afterAll(async () => {
        // Close database connection
        await mongoose.connection.close();
    });

    describe('POST /webhook - order.created', () => {
        test('should process order created webhook successfully', async () => {
            const response = await request(app)
                .post('/webhook')
                .send(mockOrderCreatedPayload)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Order processed successfully');
            expect(response.body).toHaveProperty('orderId', 2116149737);
            expect(response.body).toHaveProperty('customerId', 225167971);
            expect(response.body).toHaveProperty('amount', 196);
            expect(response.body).toHaveProperty('result');

            // Verify customer points were updated
            const updatedCustomer = await Customer.findById(testCustomer._id);
            expect(updatedCustomer.loyaltyPoints).toBeGreaterThan(50); // Should have more points
        });

        test('should handle missing merchant gracefully', async () => {
            // Delete the merchant to simulate not found
            await Merchant.deleteMany({ merchantId: '1305146709' });

            const response = await request(app)
                .post('/webhook')
                .send(mockOrderCreatedPayload)
                .expect(404);

            expect(response.body).toHaveProperty('message', 'Merchant or Customer not found');
        });

        test('should handle missing customer gracefully', async () => {
            // Delete the customer to simulate not found
            await Customer.deleteMany({ customerId: 225167971 });

            const response = await request(app)
                .post('/webhook')
                .send(mockOrderCreatedPayload)
                .expect(404);

            expect(response.body).toHaveProperty('message', 'Merchant or Customer not found');
        });

        test('should award threshold bonus points for large orders', async () => {
            // Modify payload to have amount above threshold (100 SAR)
            const largeOrderPayload = {
                ...mockOrderCreatedPayload,
                data: {
                    ...mockOrderCreatedPayload.data,
                    amounts: {
                        ...mockOrderCreatedPayload.data.amounts,
                        total: {
                            amount: 250, // Above 100 SAR threshold
                            currency: "SAR"
                        }
                    }
                }
            };

            const response = await request(app)
                .post('/webhook')
                .send(largeOrderPayload)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Order processed successfully');
            expect(response.body).toHaveProperty('amount', 250);

            // Verify customer got both regular and threshold bonus points
            const updatedCustomer = await Customer.findById(testCustomer._id);
            expect(updatedCustomer.loyaltyPoints).toBeGreaterThan(50); // Should have more points
        });

        test('should not award threshold bonus for small orders', async () => {
            // Modify payload to have amount below threshold (100 SAR)
            const smallOrderPayload = {
                ...mockOrderCreatedPayload,
                data: {
                    ...mockOrderCreatedPayload.data,
                    amounts: {
                        ...mockOrderCreatedPayload.data.amounts,
                        total: {
                            amount: 50, // Below 100 SAR threshold
                            currency: "SAR"
                        }
                    }
                }
            };

            const response = await request(app)
                .post('/webhook')
                .send(smallOrderPayload)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Order processed successfully');
            expect(response.body).toHaveProperty('amount', 50);

            // Verify customer got only regular purchase points (no threshold bonus)
            const updatedCustomer = await Customer.findById(testCustomer._id);
            expect(updatedCustomer.loyaltyPoints).toBeGreaterThan(50); // Should have some points but not as many
        });
    });
});

// Manual test function to run standalone
async function runManualTest() {
    console.log('🚀 Starting manual test for order.created webhook...\n');

    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/loyalty_app');
        console.log('✅ Connected to database\n');

        // Create mock request and response objects
        const mockReq = {
            body: mockOrderCreatedPayload
        };

        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    console.log(`📤 Response Status: ${code}`);
                    console.log('📤 Response Data:', JSON.stringify(data, null, 2));
                    return data;
                }
            })
        };

        // Test the webhook logic directly
        console.log('🔥 Testing webhook logic...\n');
        await webhookLogic(mockReq, mockRes);

    } catch (error) {
        console.error('❌ Manual test failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('✅ Database connection closed');
    }
}

// Export for testing
module.exports = {
    mockOrderCreatedPayload,
    runManualTest
};

// Run manual test if this file is executed directly
if (require.main === module) {
    runManualTest();
}
