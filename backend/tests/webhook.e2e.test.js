const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const express = require('express');
const crypto = require('crypto');

// Import the actual server modules
const webhookRoute = require('../routes/webhook.route');
const Merchant = require('../models/merchant.model');
const Customer = require('../models/customer.model');
const CustomerLoyaltyActivity = require('../models/customerLoyalityActivitySchema.model');
const Reward = require('../models/reward.model');
const Coupon = require('../models/coupon.model');
const { sendEmail } = require('../utils/sendEmail');

describe('Webhook E2E Tests - Complete Flow', () => {
    let app;
    let sandbox;

    beforeEach(() => {
        // Create sandbox for sinon stubs
        sandbox = sinon.createSandbox();

        // Create test Express app
        app = express();
        app.use(express.json());
        app.use('/webhook', webhookRoute);

        // Set environment variables for testing
        process.env.SALLA_WEBHOOK_SECRET = 'test_webhook_secret_key';
    });

    afterEach(() => {
        sandbox.restore();
        delete process.env.SALLA_WEBHOOK_SECRET;
    });

    const createWebhookSignature = (payload, secret) => {
        const rawBody = JSON.stringify(payload);
        return crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');
    };

    const setupMockData = () => {
        const mockMerchant = {
            _id: 'merchant_id_123',
            merchantId: 'salla_merchant_456',
            merchantName: 'E2E Test Store',
            merchantUsername: 'e2etest',
            merchantDomain: 'https://e2etest.salla.sa',
            customersPoints: 2000,
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
                tierBronze: 0,
                tierSilver: 100,
                tierGold: 500,
                tierPlatinum: 1000
            },
            notificationSettings: {
                earnNewPoints: true,
                earnNewCoupon: true,
                birthday: true
            },
            save: sandbox.stub().resolves()
        };

        const mockCustomer = {
            _id: 'customer_id_789',
            customerId: 'salla_customer_101',
            merchant: 'merchant_id_123',
            name: 'E2E Test Customer',
            email: 'aywork73@gmail.com',
            phone: '+966501234567',
            points: 75,
            tier: 'bronze',
            dateOfBirth: new Date('1990-08-20'),
            save: sandbox.stub().resolves()
        };

        const mockReward = {
            _id: 'reward_id_456',
            merchant: 'merchant_id_123',
            title: 'E2E Test Reward',
            discountType: 'percentage',
            discountValue: 20,
            isActive: true,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        };

        return { mockMerchant, mockCustomer, mockReward };
    };

    describe('Complete Webhook Security and Processing', () => {
        it('should reject webhook without signature', async () => {
            const payload = {
                event: 'order.created',
                merchant: 'salla_merchant_456',
                data: { id: 'order123' }
            };

            const res = await request(app)
                .post('/webhook')
                .send(payload);

            expect(res.status).to.equal(401);
            expect(res.body.error).to.equal('Webhook signature missing');
        });

        it('should reject webhook with invalid signature', async () => {
            const payload = {
                event: 'order.created',
                merchant: 'salla_merchant_456',
                data: { id: 'order123' }
            };

            const res = await request(app)
                .post('/webhook')
                .set('x-salla-signature', 'sha256=invalid_signature')
                .send(payload);

            expect(res.status).to.equal(401);
            expect(res.body.error).to.equal('Invalid signature');
        });

        it('should process valid webhook with correct signature', async () => {
            const { mockMerchant, mockCustomer } = setupMockData();

            // Setup database mocks
            sandbox.stub(Merchant, 'findOne').resolves(mockMerchant);
            sandbox.stub(Customer, 'findOne').resolves(mockCustomer);
            sandbox.stub(CustomerLoyaltyActivity, 'create').resolves({});
            sandbox.stub(sendEmail, 'sendEmail').resolves();

            const payload = {
                event: 'order.created',
                merchant: 'salla_merchant_456',
                data: {
                    id: 'order_e2e_123',
                    customer: { id: 'salla_customer_101' },
                    amounts: { total: { amount: 150 } },
                    currency: 'SAR',
                    reference_id: 'ref_e2e_123'
                }
            };

            const signature = createWebhookSignature(payload, process.env.SALLA_WEBHOOK_SECRET);

            const res = await request(app)
                .post('/webhook')
                .set('x-salla-signature', `sha256=${signature}`)
                .send(payload);

            expect(res.status).to.equal(200);
            expect(res.body.message).to.equal('Order processed successfully');
            expect(res.body.orderId).to.equal('order_e2e_123');
        });
    });

    describe('Complete Order Lifecycle E2E', () => {
        it('should handle complete order lifecycle: create -> update -> refund', async () => {
            const { mockMerchant, mockCustomer } = setupMockData();
            mockCustomer.points = 200; // Ensure enough points for refund test

            // Setup database mocks
            sandbox.stub(Merchant, 'findOne').resolves(mockMerchant);
            sandbox.stub(Customer, 'findOne').resolves(mockCustomer);
            sandbox.stub(CustomerLoyaltyActivity, 'create').resolves({});
            sandbox.stub(sendEmail, 'sendEmail').resolves();

            // 1. Create Order
            const createPayload = {
                event: 'order.created',
                merchant: 'salla_merchant_456',
                data: {
                    id: 'order_lifecycle_123',
                    customer: { id: 'salla_customer_101' },
                    amounts: { total: { amount: 200 } },
                    currency: 'SAR'
                }
            };

            const createSignature = createWebhookSignature(createPayload, process.env.SALLA_WEBHOOK_SECRET);

            const createRes = await request(app)
                .post('/webhook')
                .set('x-salla-signature', `sha256=${createSignature}`)
                .send(createPayload);

            expect(createRes.status).to.equal(200);
            expect(createRes.body.message).to.equal('Order processed successfully');

            // 2. Update Order
            const updatePayload = {
                event: 'order.updated',
                merchant: 'salla_merchant_456',
                data: {
                    id: 'order_lifecycle_123',
                    customer: { id: 'salla_customer_101' },
                    amounts: { total: { amount: 250 } }
                }
            };

            const updateSignature = createWebhookSignature(updatePayload, process.env.SALLA_WEBHOOK_SECRET);

            const updateRes = await request(app)
                .post('/webhook')
                .set('x-salla-signature', `sha256=${updateSignature}`)
                .send(updatePayload);

            expect(updateRes.status).to.equal(200);
            expect(updateRes.body.message).to.equal('Order update processed successfully');

            // 3. Refund Order
            const refundPayload = {
                event: 'order.refunded',
                merchant: 'salla_merchant_456',
                data: {
                    id: 'order_lifecycle_123',
                    customer_id: 'salla_customer_101',
                    total: 250,
                    refund_amount: 100
                }
            };

            const refundSignature = createWebhookSignature(refundPayload, process.env.SALLA_WEBHOOK_SECRET);

            const refundRes = await request(app)
                .post('/webhook')
                .set('x-salla-signature', `sha256=${refundSignature}`)
                .send(refundPayload);

            expect(refundRes.status).to.equal(200);
            expect(refundRes.body.message).to.equal('Order refund processed successfully');
            expect(refundRes.body.refundAmount).to.equal(100);
        });
    });

    describe('Customer Journey E2E', () => {
        it('should handle complete customer journey: create -> login -> birthday', async () => {
            const { mockMerchant, mockCustomer } = setupMockData();

            // Setup database mocks
            sandbox.stub(Merchant, 'findOne').resolves(mockMerchant);
            
            // For customer creation, first call returns null (doesn't exist), second returns created customer
            const customerStub = sandbox.stub(Customer, 'findOne');
            customerStub.onFirstCall().resolves(null);
            customerStub.onSecondCall().resolves(mockCustomer);
            
            sandbox.stub(Customer.prototype, 'save').resolves(mockCustomer);
            sandbox.stub(CustomerLoyaltyActivity, 'create').resolves({});
            sandbox.stub(sendEmail, 'sendEmail').resolves();

            // 1. Create Customer
            const createCustomerPayload = {
                event: 'customer.created',
                merchant: 'salla_merchant_456',
                data: {
                    id: 'salla_customer_new',
                    name: 'New Customer',
                    email: 'newcustomer@test.com',
                    mobile: '+966501234567',
                    date_of_birth: '1990-08-20'
                }
            };

            const createCustomerSignature = createWebhookSignature(createCustomerPayload, process.env.SALLA_WEBHOOK_SECRET);

            const createCustomerRes = await request(app)
                .post('/webhook')
                .set('x-salla-signature', `sha256=${createCustomerSignature}`)
                .send(createCustomerPayload);

            expect(createCustomerRes.status).to.equal(200);
            expect(createCustomerRes.body.message).to.equal('Customer creation processed successfully');

            // 2. Customer Login (on birthday)
            const today = new Date();
            mockCustomer.dateOfBirth = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());

            const loginPayload = {
                event: 'customer.login',
                merchant: 'salla_merchant_456',
                data: {
                    customer: { id: 'salla_customer_101' }
                }
            };

            const loginSignature = createWebhookSignature(loginPayload, process.env.SALLA_WEBHOOK_SECRET);

            const loginRes = await request(app)
                .post('/webhook')
                .set('x-salla-signature', `sha256=${loginSignature}`)
                .send(loginPayload);

            expect(loginRes.status).to.equal(200);
            expect(loginRes.body.isBirthday).to.be.true;
        });
    });

    describe('Coupon Generation E2E', () => {
        it('should generate coupon when customer reaches threshold', async () => {
            const { mockMerchant, mockCustomer, mockReward } = setupMockData();
            mockCustomer.points = 95; // Just below threshold

            // Setup database mocks
            sandbox.stub(Merchant, 'findOne').resolves(mockMerchant);
            sandbox.stub(Customer, 'findOne').resolves(mockCustomer);
            sandbox.stub(CustomerLoyaltyActivity, 'create').resolves({});
            sandbox.stub(Reward, 'findOne').resolves(mockReward);
            sandbox.stub(Coupon, 'create').resolves({
                _id: 'coupon_123',
                code: 'GENERATED123',
                customer: mockCustomer._id,
                merchant: mockMerchant._id,
                reward: mockReward._id
            });
            sandbox.stub(sendEmail, 'sendEmail').resolves();

            const payload = {
                event: 'order.created',
                merchant: 'salla_merchant_456',
                data: {
                    id: 'order_coupon_threshold',
                    customer: { id: 'salla_customer_101' },
                    amounts: { total: { amount: 10 } }, // Should push customer to 105 points
                    currency: 'SAR'
                }
            };

            const signature = createWebhookSignature(payload, process.env.SALLA_WEBHOOK_SECRET);

            const res = await request(app)
                .post('/webhook')
                .set('x-salla-signature', `sha256=${signature}`)
                .send(payload);

            expect(res.status).to.equal(200);
            
            // Verify coupon was created
            expect(Coupon.create.calledOnce).to.be.true;
            
            // Verify multiple emails sent (customer + admin notification)
            expect(sendEmail.sendEmail.callCount).to.be.greaterThan(1);
        });

        it('should notify admin when no active reward exists', async () => {
            const { mockMerchant, mockCustomer } = setupMockData();
            mockCustomer.points = 95;

            // Setup database mocks
            sandbox.stub(Merchant, 'findOne').resolves(mockMerchant);
            sandbox.stub(Customer, 'findOne').resolves(mockCustomer);
            sandbox.stub(CustomerLoyaltyActivity, 'create').resolves({});
            sandbox.stub(Reward, 'findOne').resolves(null); // No active reward
            sandbox.stub(sendEmail, 'sendEmail').resolves();

            const payload = {
                event: 'order.created',
                merchant: 'salla_merchant_456',
                data: {
                    id: 'order_no_reward',
                    customer: { id: 'salla_customer_101' },
                    amounts: { total: { amount: 10 } },
                    currency: 'SAR'
                }
            };

            const signature = createWebhookSignature(payload, process.env.SALLA_WEBHOOK_SECRET);

            const res = await request(app)
                .post('/webhook')
                .set('x-salla-signature', `sha256=${signature}`)
                .send(payload);

            expect(res.status).to.equal(200);

            // Verify admin notification was sent
            const adminEmailCall = sendEmail.sendEmail.getCalls().find(
                call => call.args[0] === 'aywork73@gmail.com' && call.args[1].includes('No Active Reward')
            );
            expect(adminEmailCall).to.exist;
        });
    });

    describe('App Lifecycle E2E', () => {
        it('should handle app installation and store authorization', async () => {
            const mockMerchantDetails = {
                data: {
                    name: 'Store Owner',
                    email: 'owner@e2etest.com',
                    mobile: '+966501234567',
                    role: 'owner',
                    id: 123,
                    merchant: {
                        id: 456,
                        name: 'E2E Test Store',
                        username: 'e2etest',
                        avatar: 'avatar.jpg',
                        domain: 'e2etest.salla.sa',
                        subscription: { plan: 'premium' },
                        created_at: '2023-01-01T00:00:00Z'
                    },
                    context: {
                        exp: Math.floor(Date.now() / 1000) + 3600
                    }
                }
            };

            // Mock SallaSDK
            const sallaSDK = require('../services/sallaSDK');
            sandbox.stub(sallaSDK, 'getMerchantInfo').resolves(mockMerchantDetails);
            sandbox.stub(Merchant.prototype, 'save').resolves({ _id: 'new_merchant_123' });
            sandbox.stub(sendEmail, 'sendEmail').resolves();

            const authPayload = {
                event: 'app.store.authorize',
                merchant: 'salla_merchant_456',
                data: {
                    access_token: 'test_access_token_e2e',
                    refresh_token: 'test_refresh_token_e2e',
                    expires: Math.floor(Date.now() / 1000) + 3600,
                    scope: 'read write orders customers products'
                }
            };

            const signature = createWebhookSignature(authPayload, process.env.SALLA_WEBHOOK_SECRET);

            const res = await request(app)
                .post('/webhook')
                .set('x-salla-signature', `sha256=${signature}`)
                .send(authPayload);

            expect(res.status).to.equal(200);
            expect(res.body.message).to.equal('Store authorized and saved');

            // Verify welcome email was sent
            expect(sendEmail.sendEmail.calledWith('owner@e2etest.com')).to.be.true;
        });

        it('should handle app uninstallation', async () => {
            const { mockMerchant } = setupMockData();

            sandbox.stub(Merchant, 'findOneAndDelete').resolves(mockMerchant);

            const uninstallPayload = {
                event: 'app.uninstalled',
                merchant: 'salla_merchant_456'
            };

            const signature = createWebhookSignature(uninstallPayload, process.env.SALLA_WEBHOOK_SECRET);

            const res = await request(app)
                .post('/webhook')
                .set('x-salla-signature', `sha256=${signature}`)
                .send(uninstallPayload);

            expect(res.status).to.equal(200);
            expect(res.body.message).to.equal('App uninstalled successfully');

            // Verify merchant was deleted
            expect(Merchant.findOneAndDelete.calledWith({ merchantId: 'salla_merchant_456' })).to.be.true;
        });
    });

    describe('Error Scenarios E2E', () => {
        it('should handle database connection errors gracefully', async () => {
            // Simulate database error
            sandbox.stub(Merchant, 'findOne').rejects(new Error('Database connection failed'));

            const payload = {
                event: 'order.created',
                merchant: 'salla_merchant_456',
                data: {
                    customer: { id: 'salla_customer_101' },
                    amounts: { total: { amount: 100 } }
                }
            };

            const signature = createWebhookSignature(payload, process.env.SALLA_WEBHOOK_SECRET);

            const res = await request(app)
                .post('/webhook')
                .set('x-salla-signature', `sha256=${signature}`)
                .send(payload);

            expect(res.status).to.equal(500);
            expect(res.body.message).to.equal('Internal server error');
        });

        it('should handle missing webhook secret configuration', async () => {
            delete process.env.SALLA_WEBHOOK_SECRET;

            const payload = {
                event: 'order.created',
                merchant: 'salla_merchant_456',
                data: { id: 'order123' }
            };

            const res = await request(app)
                .post('/webhook')
                .set('x-salla-signature', 'sha256=test')
                .send(payload);

            expect(res.status).to.equal(500);
            expect(res.body.error).to.equal('Server configuration error');
        });

        it('should validate required webhook payload fields', async () => {
            const invalidPayload = {
                // Missing event field
                merchant: 'salla_merchant_456',
                data: { id: 'order123' }
            };

            const signature = createWebhookSignature(invalidPayload, 'test_secret');
            process.env.SALLA_WEBHOOK_SECRET = 'test_secret';

            const res = await request(app)
                .post('/webhook')
                .set('x-salla-signature', `sha256=${signature}`)
                .send(invalidPayload);

            expect(res.status).to.equal(400);
            expect(res.body.error).to.equal('Invalid payload');
            expect(res.body.message).to.equal('Event type is required');
        });
    });

    describe('Performance and Concurrency E2E', () => {
        it('should handle multiple concurrent webhooks', async () => {
            const { mockMerchant, mockCustomer } = setupMockData();

            sandbox.stub(Merchant, 'findOne').resolves(mockMerchant);
            sandbox.stub(Customer, 'findOne').resolves(mockCustomer);
            sandbox.stub(CustomerLoyaltyActivity, 'create').resolves({});
            sandbox.stub(sendEmail, 'sendEmail').resolves();

            const webhookPromises = [];

            for (let i = 0; i < 5; i++) {
                const payload = {
                    event: 'order.created',
                    merchant: 'salla_merchant_456',
                    data: {
                        id: `order_concurrent_${i}`,
                        customer: { id: 'salla_customer_101' },
                        amounts: { total: { amount: 100 + i * 10 } },
                        currency: 'SAR'
                    }
                };

                const signature = createWebhookSignature(payload, process.env.SALLA_WEBHOOK_SECRET);

                const promise = request(app)
                    .post('/webhook')
                    .set('x-salla-signature', `sha256=${signature}`)
                    .send(payload);

                webhookPromises.push(promise);
            }

            const responses = await Promise.all(webhookPromises);

            responses.forEach((res, index) => {
                expect(res.status).to.equal(200);
                expect(res.body.orderId).to.equal(`order_concurrent_${index}`);
            });

            // Verify all webhooks were processed
            expect(CustomerLoyaltyActivity.create.callCount).to.equal(5);
        });
    });
}); 