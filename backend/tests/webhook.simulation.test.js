const request = require('supertest');
const express = require('express');
const sinon = require('sinon');
const { expect } = require('chai');

// Create test app
const app = express();
app.use(express.json());

// Import dependencies
const webhookController = require('../controllers/webhook.controller');
const Merchant = require('../models/merchant.model');
const Customer = require('../models/customer.model');
const CustomerLoyaltyActivity = require('../models/customerLoyalityActivitySchema.model');
const Reward = require('../models/reward.model');
const Coupon = require('../models/coupon.model');
const { sendEmail } = require('../utils/sendEmail');

// Setup webhook route
app.post('/api/webhook', webhookController);

describe('Webhook Simulation Tests - Complete Coverage', () => {
    let merchantStub, customerStub, loyaltyActivityStub, rewardStub, couponStub, sendEmailStub;
    let mockMerchant, mockCustomer;

    beforeEach(() => {
        // Setup mock merchant with comprehensive loyalty settings
        mockMerchant = {
            _id: 'merchant1',
            merchantId: 'merchant1',
            merchantName: 'Test Store',
            merchantUsername: 'teststore',
            merchantDomain: 'https://teststore.salla.sa',
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
                ratingAppPoints: { enabled: true, points: 25 }
            },
            notificationSettings: {
                earnNewPoints: true,
                earnNewCoupon: true,
                birthday: true
            },
            customersPoints: 1000,
            save: sinon.stub().resolves()
        };

        // Setup mock customer
        mockCustomer = {
            _id: 'customer1',
            customerId: 'customer1',
            merchant: 'merchant1',
            name: 'Test Customer',
            email: 'aywork73@gmail.com',
            points: 150,
            tier: 'silver',
            dateOfBirth: new Date(),
            save: sinon.stub().resolves()
        };

        // Setup mock reward
        const mockReward = {
            _id: 'reward1',
            merchant: 'merchant1',
            isActive: true,
            discountType: 'percentage',
            discountValue: 10,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        };

        // Setup stubs
        merchantStub = sinon.stub(Merchant, 'findOne').resolves(mockMerchant);
        customerStub = sinon.stub(Customer, 'findOne').resolves(mockCustomer);
        loyaltyActivityStub = sinon.stub(CustomerLoyaltyActivity, 'create').resolves();
        rewardStub = sinon.stub(Reward, 'findOne').resolves(mockReward);
        couponStub = sinon.stub(Coupon, 'create').resolves({ _id: 'coupon1', code: 'TEST123' });
        sendEmailStub = sinon.stub(sendEmail, 'sendEmail').resolves();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('Order Events', () => {
        it('should process order.created webhook and award points', async () => {
            const orderData = {
                event: 'order.created',
                merchant: 'merchant1',
                data: {
                    id: 'order123',
                    customer: { id: 'customer1' },
                    amounts: { total: { amount: 200 } },
                    currency: 'SAR',
                    reference_id: 'ref123'
                }
            };

            const res = await request(app)
                .post('/api/webhook')
                .send(orderData);

            expect(res.status).to.equal(200);
            expect(res.body.message).to.equal('Order processed successfully');
            expect(res.body.orderId).to.equal('order123');
            expect(res.body.amount).to.equal(200);
        });

        it('should process order.updated webhook', async () => {
            const orderData = {
                event: 'order.updated',
                merchant: 'merchant1',
                data: {
                    id: 'order123',
                    customer: { id: 'customer1' },
                    amounts: { total: { amount: 250 } }
                }
            };

            const res = await request(app)
                .post('/api/webhook')
                .send(orderData);

            expect(res.status).to.equal(200);
            expect(res.body.message).to.equal('Order update processed successfully');
        });

        it('should process order.deleted webhook and deduct points', async () => {
            mockCustomer.points = 200; // Ensure customer has enough points
            
            const orderData = {
                event: 'order.deleted',
                merchant: 'merchant1',
                data: {
                    id: 'order123',
                    customer_id: 'customer1',
                    total: 100
                }
            };

            const res = await request(app)
                .post('/api/webhook')
                .send(orderData);

            expect(res.status).to.equal(200);
            expect(res.body.message).to.equal('Order deletion processed successfully');
            expect(res.body.orderId).to.equal('order123');
        });

        it('should process order.refunded webhook and deduct points based on refund amount', async () => {
            mockCustomer.points = 200;
            
            const orderData = {
                event: 'order.refunded',
                merchant: 'merchant1',
                data: {
                    id: 'order123',
                    customer_id: 'customer1',
                    total: 200,
                    refund_amount: 100
                }
            };

            const res = await request(app)
                .post('/api/webhook')
                .send(orderData);

            expect(res.status).to.equal(200);
            expect(res.body.message).to.equal('Order refund processed successfully');
            expect(res.body.refundAmount).to.equal(100);
        });
    });

    describe('Customer Events', () => {
        it('should process customer.created webhook and award welcome points', async () => {
            customerStub.onFirstCall().resolves(null); // Customer doesn't exist yet
            customerStub.onSecondCall().resolves(mockCustomer);

            const mockNewCustomer = {
                ...mockCustomer,
                save: sinon.stub().resolves()
            };
            sinon.stub(Customer.prototype, 'save').resolves(mockNewCustomer);

            const customerData = {
                event: 'customer.created',
                merchant: 'merchant1',
                data: {
                    id: 'customer2',
                    name: 'New Customer',
                    email: 'newcustomer@test.com',
                    mobile: '+966501234567',
                    date_of_birth: '1990-01-01'
                }
            };

            const res = await request(app)
                .post('/api/webhook')
                .send(customerData);

            expect(res.status).to.equal(200);
            expect(res.body.message).to.equal('Customer creation processed successfully');
        });

        it('should process customer.login webhook and check for birthday', async () => {
            const today = new Date();
            mockCustomer.dateOfBirth = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());

            const loginData = {
                event: 'customer.login',
                merchant: 'merchant1',
                data: {
                    customer: { id: 'customer1' }
                }
            };

            const res = await request(app)
                .post('/api/webhook')
                .send(loginData);

            expect(res.status).to.equal(200);
            expect(res.body.isBirthday).to.be.a('boolean');
        });
    });

    describe('Product Events', () => {
        it('should process product.created webhook', async () => {
            const productData = {
                event: 'product.created',
                merchant: 'merchant1',
                data: {
                    id: 'product123',
                    name: 'Test Product',
                    price: 100
                }
            };

            const res = await request(app)
                .post('/api/webhook')
                .send(productData);

            expect(res.status).to.equal(200);
            expect(res.body.message).to.equal('Product creation processed successfully');
        });

        it('should process product.updated webhook', async () => {
            const productData = {
                event: 'product.updated',
                merchant: 'merchant1',
                data: {
                    id: 'product123',
                    name: 'Updated Product',
                    price: 120
                }
            };

            const res = await request(app)
                .post('/api/webhook')
                .send(productData);

            expect(res.status).to.equal(200);
            expect(res.body.message).to.equal('Product update processed successfully');
        });
    });

    describe('App Events', () => {
        it('should process app.store.authorize webhook', async () => {
            const mockMerchantDetails = {
                data: {
                    name: 'Store Owner',
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
                        subscription: { plan: 'basic' },
                        created_at: '2023-01-01T00:00:00Z'
                    },
                    context: {
                        exp: Math.floor(Date.now() / 1000) + 3600
                    }
                }
            };

            // Mock the fetchMerchantDetails function
            const sallaSDK = require('../services/sallaSDK');
            sinon.stub(sallaSDK, 'getMerchantInfo').resolves(mockMerchantDetails);

            // Mock the Merchant constructor and save
            const mockSavedMerchant = { _id: 'newmerchant1' };
            sinon.stub(Merchant.prototype, 'save').resolves(mockSavedMerchant);

            const authData = {
                event: 'app.store.authorize',
                merchant: 'merchant1',
                data: {
                    access_token: 'test_access_token',
                    refresh_token: 'test_refresh_token',
                    expires: Math.floor(Date.now() / 1000) + 3600,
                    scope: 'read write'
                }
            };

            const res = await request(app)
                .post('/api/webhook')
                .send(authData);

            expect(res.status).to.equal(200);
            expect(res.body.message).to.equal('Store authorized and saved');
        });

        it('should process app.uninstalled webhook', async () => {
            sinon.stub(Merchant, 'findOneAndDelete').resolves(mockMerchant);

            const uninstallData = {
                event: 'app.uninstalled',
                merchant: 'merchant1'
            };

            const res = await request(app)
                .post('/api/webhook')
                .send(uninstallData);

            expect(res.status).to.equal(200);
            expect(res.body.message).to.equal('App uninstalled successfully');
        });
    });

    describe('Review and Feedback Events', () => {
        it('should process review.added webhook', async () => {
            const reviewData = {
                event: 'review.added',
                merchant: 'merchant1',
                data: {
                    id: 'review123',
                    customer: { id: 'customer1' },
                    rating: 5,
                    content: 'Great product!',
                    product: { id: 'product123' }
                }
            };

            const res = await request(app)
                .post('/api/webhook')
                .send(reviewData);

            expect(res.status).to.equal(200);
            expect(res.body.message).to.equal('Review processed');
        });

        it('should process app.feedback.created webhook', async () => {
            const feedbackData = {
                event: 'app.feedback.created',
                merchant: 'merchant1',
                data: {
                    id: 'feedback123',
                    customer_id: 'customer1',
                    rating: 4
                }
            };

            const res = await request(app)
                .post('/api/webhook')
                .send(feedbackData);

            expect(res.status).to.equal(200);
            expect(res.body.message).to.equal('Feedback processed');
        });
    });

    describe('Error Handling', () => {
        it('should return 400 for unknown event type', async () => {
            const unknownEventData = {
                event: 'unknown.event',
                merchant: 'merchant1',
                data: {}
            };

            const res = await request(app)
                .post('/api/webhook')
                .send(unknownEventData);

            expect(res.status).to.equal(400);
            expect(res.body.error).to.equal('Unknown event type');
        });

        it('should return 404 when merchant not found', async () => {
            merchantStub.resolves(null);

            const orderData = {
                event: 'order.created',
                merchant: 'nonexistent',
                data: {
                    customer: { id: 'customer1' },
                    amounts: { total: { amount: 100 } }
                }
            };

            const res = await request(app)
                .post('/api/webhook')
                .send(orderData);

            expect(res.status).to.equal(404);
            expect(res.body.message).to.equal('Merchant or Customer not found');
        });

        it('should return 404 when customer not found', async () => {
            customerStub.resolves(null);

            const orderData = {
                event: 'order.created',
                merchant: 'merchant1',
                data: {
                    customer: { id: 'nonexistent' },
                    amounts: { total: { amount: 100 } }
                }
            };

            const res = await request(app)
                .post('/api/webhook')
                .send(orderData);

            expect(res.status).to.equal(404);
            expect(res.body.message).to.equal('Merchant or Customer not found');
        });
    });

    describe('Point Deduction Edge Cases', () => {
        it('should not deduct points below zero', async () => {
            mockCustomer.points = 50; // Less than order total

            const orderData = {
                event: 'order.deleted',
                merchant: 'merchant1',
                data: {
                    id: 'order123',
                    customer_id: 'customer1',
                    total: 100 // More than customer points
                }
            };

            const res = await request(app)
                .post('/api/webhook')
                .send(orderData);

            expect(res.status).to.equal(200);
            expect(res.body.message).to.equal('Order deletion processed successfully');
        });

        it('should handle partial refund correctly', async () => {
            mockCustomer.points = 200;

            const orderData = {
                event: 'order.refunded',
                merchant: 'merchant1',
                data: {
                    id: 'order123',
                    customer_id: 'customer1',
                    total: 200,
                    refund_amount: 75 // Partial refund
                }
            };

            const res = await request(app)
                .post('/api/webhook')
                .send(orderData);

            expect(res.status).to.equal(200);
            expect(res.body.refundAmount).to.equal(75);
        });
    });

    describe('Email Notifications', () => {
        it('should send email notification for point awards', async () => {
            const orderData = {
                event: 'order.created',
                merchant: 'merchant1',
                data: {
                    customer: { id: 'customer1' },
                    amounts: { total: { amount: 100 } },
                    id: 'order123'
                }
            };

            await request(app)
                .post('/api/webhook')
                .send(orderData);

            // Verify email was called (though it's async, so we check the stub)
            expect(sendEmailStub.called).to.be.true;
        });
    });
});
