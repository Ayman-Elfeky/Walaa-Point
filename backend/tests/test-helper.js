const sinon = require('sinon');
const mongoose = require('mongoose');

/**
 * Test Helper Utilities
 * Provides common mock data, utilities, and setup functions for tests
 */

class TestHelper {
    constructor() {
        this.sandbox = null;
    }

    // Initialize test environment
    beforeEach() {
        this.sandbox = sinon.createSandbox();
        
        // Set test environment variables
        process.env.NODE_ENV = 'test';
        process.env.SALLA_WEBHOOK_SECRET = 'test_webhook_secret_key_for_testing';
        process.env.SALLA_CLIENT_ID = 'test_client_id';
        process.env.SALLA_CLIENT_SECRET = 'test_client_secret';
        process.env.SALLA_API_BASE_URL = 'https://api.salla.dev';
    }

    // Clean up after each test
    afterEach() {
        if (this.sandbox) {
            this.sandbox.restore();
        }
        
        // Clean up environment variables
        delete process.env.NODE_ENV;
        delete process.env.SALLA_WEBHOOK_SECRET;
        delete process.env.SALLA_CLIENT_ID;
        delete process.env.SALLA_CLIENT_SECRET;
        delete process.env.SALLA_API_BASE_URL;
    }

    // Get sandbox for creating stubs
    getSandbox() {
        return this.sandbox;
    }

    // Create mock merchant with comprehensive settings
    createMockMerchant(overrides = {}) {
        const defaultMerchant = {
            _id: new mongoose.Types.ObjectId(),
            merchantId: 'test_merchant_123',
            merchantName: 'Test Loyalty Store',
            merchantUsername: 'teststore',
            merchantDomain: 'https://teststore.salla.sa',
            installerEmail: 'merchant@teststore.com',
            customersPoints: 5000,
            loyaltySettings: {
                purchasePoints: { enabled: true },
                pointsPerCurrency: 1,
                rewardThreshold: 100,
                purchaseAmountThresholdPoints: {
                    enabled: true,
                    thresholdAmount: 500,
                    points: 50
                },
                birthdayPoints: { enabled: true, points: 100 },
                welcomePoints: { enabled: true, points: 50 },
                feedbackShippingPoints: { enabled: true, points: 20 },
                ratingAppPoints: { enabled: true, points: 25 },
                profileCompletionPoints: { enabled: true, points: 30 },
                repeatPurchasePoints: { enabled: true, points: 15 },
                shareReferralPoints: { enabled: true, points: 40 },
                installAppPoints: { enabled: true, points: 10 },
                tierBronze: 0,
                tierSilver: 100,
                tierGold: 500,
                tierPlatinum: 1000
            },
            notificationSettings: {
                earnNewPoints: true,
                earnNewCoupon: true,
                birthday: true,
                earnNewCouponForShare: true
            },
            accessToken: 'test_access_token',
            refreshToken: 'test_refresh_token',
            accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000),
            save: sinon.stub().resolves()
        };

        return { ...defaultMerchant, ...overrides };
    }

    // Create mock customer
    createMockCustomer(overrides = {}) {
        const defaultCustomer = {
            _id: new mongoose.Types.ObjectId(),
            customerId: 'test_customer_456',
            merchant: new mongoose.Types.ObjectId(),
            name: 'Test Customer',
            email: 'aywork73@gmail.com',
            phone: '+966501234567',
            points: 75,
            tier: 'bronze',
            dateOfBirth: new Date('1990-05-15'),
            metadata: {
                registrationDate: new Date(),
                lastLogin: new Date()
            },
            save: sinon.stub().resolves()
        };

        return { ...defaultCustomer, ...overrides };
    }

    // Create mock reward
    createMockReward(overrides = {}) {
        const defaultReward = {
            _id: new mongoose.Types.ObjectId(),
            merchant: new mongoose.Types.ObjectId(),
            title: 'Test Reward',
            description: 'Test reward for customers',
            discountType: 'percentage',
            discountValue: 15,
            isActive: true,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        return { ...defaultReward, ...overrides };
    }

    // Create mock coupon
    createMockCoupon(overrides = {}) {
        const defaultCoupon = {
            _id: new mongoose.Types.ObjectId(),
            code: 'TEST123COUPON',
            customer: new mongoose.Types.ObjectId(),
            merchant: new mongoose.Types.ObjectId(),
            reward: new mongoose.Types.ObjectId(),
            isRedeemed: false,
            issuedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        };

        return { ...defaultCoupon, ...overrides };
    }

    // Create mock loyalty activity
    createMockLoyaltyActivity(overrides = {}) {
        const defaultActivity = {
            _id: new mongoose.Types.ObjectId(),
            customerId: new mongoose.Types.ObjectId(),
            merchantId: new mongoose.Types.ObjectId(),
            event: 'purchase',
            points: 50,
            metadata: {
                orderId: 'test_order_123',
                amount: 100
            },
            createdAt: new Date()
        };

        return { ...defaultActivity, ...overrides };
    }

    // Create webhook payload for different events
    createWebhookPayload(event, data = {}, merchantId = 'test_merchant_123') {
        const payloads = {
            'order.created': {
                event: 'order.created',
                merchant: merchantId,
                data: {
                    id: 'order_123',
                    customer: { id: 'customer_123' },
                    amounts: { total: { amount: 200 } },
                    currency: 'SAR',
                    reference_id: 'ref_123',
                    ...data
                }
            },
            'order.updated': {
                event: 'order.updated',
                merchant: merchantId,
                data: {
                    id: 'order_123',
                    customer: { id: 'customer_123' },
                    amounts: { total: { amount: 250 } },
                    ...data
                }
            },
            'order.deleted': {
                event: 'order.deleted',
                merchant: merchantId,
                data: {
                    id: 'order_123',
                    customer_id: 'customer_123',
                    total: 200,
                    ...data
                }
            },
            'order.refunded': {
                event: 'order.refunded',
                merchant: merchantId,
                data: {
                    id: 'order_123',
                    customer_id: 'customer_123',
                    total: 200,
                    refund_amount: 100,
                    ...data
                }
            },
            'customer.created': {
                event: 'customer.created',
                merchant: merchantId,
                data: {
                    id: 'customer_123',
                    name: 'New Customer',
                    email: 'newcustomer@test.com',
                    mobile: '+966501234567',
                    date_of_birth: '1990-01-01',
                    ...data
                }
            },
            'customer.login': {
                event: 'customer.login',
                merchant: merchantId,
                data: {
                    customer: { id: 'customer_123' },
                    ...data
                }
            },
            'product.created': {
                event: 'product.created',
                merchant: merchantId,
                data: {
                    id: 'product_123',
                    name: 'Test Product',
                    price: 100,
                    ...data
                }
            },
            'product.updated': {
                event: 'product.updated',
                merchant: merchantId,
                data: {
                    id: 'product_123',
                    name: 'Updated Product',
                    price: 120,
                    ...data
                }
            },
            'review.added': {
                event: 'review.added',
                merchant: merchantId,
                data: {
                    id: 'review_123',
                    customer: { id: 'customer_123' },
                    rating: 5,
                    content: 'Great product!',
                    product: { id: 'product_123' },
                    ...data
                }
            },
            'app.feedback.created': {
                event: 'app.feedback.created',
                merchant: merchantId,
                data: {
                    id: 'feedback_123',
                    customer_id: 'customer_123',
                    rating: 4,
                    ...data
                }
            },
            'app.store.authorize': {
                event: 'app.store.authorize',
                merchant: merchantId,
                data: {
                    access_token: 'test_access_token',
                    refresh_token: 'test_refresh_token',
                    expires: Math.floor(Date.now() / 1000) + 3600,
                    scope: 'read write',
                    ...data
                }
            },
            'app.uninstalled': {
                event: 'app.uninstalled',
                merchant: merchantId,
                ...data
            }
        };

        return payloads[event] || null;
    }

    // Create mock Salla merchant details response
    createMockMerchantDetails(overrides = {}) {
        const defaultDetails = {
            data: {
                name: 'Test Store Owner',
                email: 'owner@teststore.com',
                mobile: '+966501234567',
                role: 'owner',
                id: 123,
                merchant: {
                    id: 456,
                    name: 'Test Store',
                    username: 'teststore',
                    avatar: 'avatar.jpg',
                    domain: 'teststore.salla.sa',
                    subscription: { plan: 'premium' },
                    created_at: '2023-01-01T00:00:00Z'
                },
                context: {
                    app: 789,
                    exp: Math.floor(Date.now() / 1000) + 3600
                }
            }
        };

        return this.mergeDeep(defaultDetails, overrides);
    }

    // Setup database model mocks
    setupDatabaseMocks(models = {}) {
        const {
            merchant = this.createMockMerchant(),
            customer = this.createMockCustomer(),
            reward = this.createMockReward(),
            coupon = this.createMockCoupon(),
            loyaltyActivity = this.createMockLoyaltyActivity()
        } = models;

        // Import models
        const Merchant = require('../models/merchant.model');
        const Customer = require('../models/customer.model');
        const Reward = require('../models/reward.model');
        const Coupon = require('../models/coupon.model');
        const CustomerLoyaltyActivity = require('../models/customerLoyalityActivitySchema.model');

        // Setup stubs
        const stubs = {
            merchantFindOne: this.sandbox.stub(Merchant, 'findOne').resolves(merchant),
            merchantFindById: this.sandbox.stub(Merchant, 'findById').resolves(merchant),
            customerFindOne: this.sandbox.stub(Customer, 'findOne').resolves(customer),
            rewardFindOne: this.sandbox.stub(Reward, 'findOne').resolves(reward),
            couponCreate: this.sandbox.stub(Coupon, 'create').resolves(coupon),
            loyaltyActivityCreate: this.sandbox.stub(CustomerLoyaltyActivity, 'create').resolves(loyaltyActivity)
        };

        return stubs;
    }

    // Setup email mock
    setupEmailMock() {
        const { sendEmail } = require('../utils/sendEmail');
        return this.sandbox.stub(sendEmail, 'sendEmail').resolves();
    }

    // Setup SallaSDK mock
    setupSallaSDKMock(mockResponses = {}) {
        const sallaSDK = require('../services/sallaSDK');
        
        const defaultResponses = {
            getMerchantInfo: this.createMockMerchantDetails(),
            getCustomers: { data: [], pagination: { total: 0 } },
            getOrders: { data: [], pagination: { total: 0 } },
            getProducts: { data: [], pagination: { total: 0 } }
        };

        const responses = { ...defaultResponses, ...mockResponses };
        const stubs = {};

        Object.keys(responses).forEach(method => {
            if (sallaSDK[method]) {
                stubs[method] = this.sandbox.stub(sallaSDK, method).resolves(responses[method]);
            }
        });

        return stubs;
    }

    // Deep merge utility
    mergeDeep(target, source) {
        if (typeof target !== 'object' || typeof source !== 'object') {
            return source;
        }

        const result = { ...target };

        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this.mergeDeep(target[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }

        return result;
    }

    // Generate test webhook signature
    createWebhookSignature(payload, secret = 'test_webhook_secret_key_for_testing') {
        const crypto = require('crypto');
        const rawBody = JSON.stringify(payload);
        return crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');
    }

    // Create test Express app with webhook routes
    createTestApp() {
        const express = require('express');
        const webhookRoute = require('../routes/webhook.route');
        
        const app = express();
        app.use(express.json());
        app.use('/webhook', webhookRoute);
        
        return app;
    }

    // Wait utility for testing async operations
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Assert webhook response structure
    assertWebhookResponse(response, expectedStatus = 200) {
        const { expect } = require('chai');
        
        expect(response.status).to.equal(expectedStatus);
        expect(response.body).to.be.an('object');
        
        if (expectedStatus === 200) {
            expect(response.body.message).to.be.a('string');
        } else {
            expect(response.body.error || response.body.message).to.be.a('string');
        }
        
        return response.body;
    }

    // Generate random test data
    generateRandomString(length = 10) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    generateRandomEmail() {
        return `test${this.generateRandomString(8)}@example.com`;
    }

    generateRandomPhone() {
        return `+96650${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
    }
}

// Export singleton instance
module.exports = new TestHelper(); 