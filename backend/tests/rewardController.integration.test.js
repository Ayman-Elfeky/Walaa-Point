const request = require('supertest');
const express = require('express');
const sinon = require('sinon');
const { expect } = require('chai');
const cookieParser = require('cookie-parser');

// Create test app with proper middleware
const app = express();
app.use(express.json());
app.use(cookieParser());

// Mock the protect middleware before importing routes
const mockProtect = (req, res, next) => {
    // Create a mock merchant object for tests
    req.merchant = {
        _id: 'merchant1',
        merchantId: 'test_merchant_123',
        merchantName: 'Test Store',
        merchantUsername: 'teststore',
        loyaltySettings: {
            rewardThreshold: 100,
            pointsPerCurrency: 1
        },
        notificationSettings: {
            earnNewPoints: true,
            earnNewCoupon: true
        }
    };
    next();
};

// Replace the protect middleware
const protectPath = require.resolve('../middlewares/protect');
delete require.cache[protectPath];
require.cache[protectPath] = {
    exports: mockProtect,
    loaded: true
};

const rewardRouter = require('../routes/reward.route');
app.use('/api/rewards', rewardRouter);

const Customer = require('../models/customer.model');
const Merchant = require('../models/merchant.model');
const Reward = require('../models/reward.model');
const Coupon = require('../models/coupon.model');
const { sendEmail } = require('../utils/sendEmail');

describe('Reward Controller Integration Tests', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        // Setup comprehensive mocks
        sandbox.stub(Customer, 'findOne').resolves({
            _id: 'customer1',
            customerId: 'test_customer_123',
            merchant: 'merchant1',
            name: 'Test Customer',
            email: 'aywork73@gmail.com',
            points: 200,
            tier: 'silver',
            save: sandbox.stub().resolves()
        });

        sandbox.stub(Merchant, 'findOne').resolves({
            _id: 'merchant1',
            merchantId: 'test_merchant_123',
            merchantName: 'Test Store',
            merchantUsername: 'teststore',
            loyaltySettings: {
                rewardThreshold: 100,
                pointsPerCurrency: 1,
                purchasePoints: { enabled: true }
            },
            notificationSettings: {
                earnNewPoints: true,
                earnNewCoupon: true
            },
            save: sandbox.stub().resolves()
        });

        sandbox.stub(Reward, 'findOne').resolves({
            _id: 'reward1',
            merchant: 'merchant1',
            title: 'Test Reward',
            rewardType: 'fixed',
            pointsRequired: 100,
            discountType: 'percentage',
            discountValue: 15,
            isActive: true,
            enabled: true,
            save: sandbox.stub().resolves()
        });

        sandbox.stub(Coupon, 'findOne').resolves(null); // No existing coupon
        sandbox.stub(Coupon, 'create').resolves({
            _id: 'coupon1',
            code: 'TEST123COUPON',
            customer: 'customer1',
            merchant: 'merchant1',
            reward: 'reward1',
            isRedeemed: false,
            issuedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

        sandbox.stub(sendEmail, 'sendEmail').resolves();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Reward Application', () => {
        it('should apply reward to customer and generate coupon', async () => {
            const res = await request(app)
                .post('/api/rewards/apply')
                .send({
                    customerId: 'test_customer_123',
                    rewardType: 'fixed'
                });

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.message).to.include('successfully');

            // Verify email notification was sent
            expect(sendEmail.sendEmail.calledWith('aywork73@gmail.com')).to.be.true;

            // Verify coupon was created
            expect(Coupon.create.calledOnce).to.be.true;
        });

        it('should not apply reward if customer has insufficient points', async () => {
            // Mock customer with insufficient points
            Customer.findOne.resolves({
                _id: 'customer1',
                customerId: 'test_customer_123',
                merchant: 'merchant1',
                points: 50, // Less than required 100
                email: 'aywork73@gmail.com',
                save: sinon.stub().resolves()
            });

            const res = await request(app)
                .post('/api/rewards/apply')
                .send({
                    customerId: 'test_customer_123',
                    rewardType: 'fixed'
                });

            expect(res.status).to.equal(400);
            expect(res.body.success).to.be.false;
            expect(res.body.message).to.include('insufficient points');
        });

        it('should not apply reward if customer has unused coupon', async () => {
            // Mock existing unused coupon
            Coupon.findOne.resolves({
                _id: 'existing_coupon',
                code: 'EXISTING123',
                customer: 'customer1',
                isRedeemed: false,
                expiresAt: new Date(Date.now() + 1000000) // Future expiry
            });

            const res = await request(app)
                .post('/api/rewards/apply')
                .send({
                    customerId: 'test_customer_123',
                    rewardType: 'fixed'
                });

            expect(res.status).to.equal(400);
            expect(res.body.success).to.be.false;
            expect(res.body.message).to.include('unused coupon');
        });

        it('should handle non-existent customer', async () => {
            Customer.findOne.resolves(null);

            const res = await request(app)
                .post('/api/rewards/apply')
                .send({
                    customerId: 'non_existent_customer',
                    rewardType: 'fixed'
                });

            expect(res.status).to.equal(404);
            expect(res.body.success).to.be.false;
            expect(res.body.message).to.include('Customer not found');
        });

        it('should handle non-existent reward', async () => {
            Reward.findOne.resolves(null);

            const res = await request(app)
                .post('/api/rewards/apply')
                .send({
                    customerId: 'test_customer_123',
                    rewardType: 'non_existent'
                });

            expect(res.status).to.equal(404);
            expect(res.body.success).to.be.false;
            expect(res.body.message).to.include('Reward not found');
        });

        it('should handle inactive reward', async () => {
            Reward.findOne.resolves({
                _id: 'reward1',
                rewardType: 'fixed',
                pointsRequired: 100,
                isActive: false, // Inactive reward
                enabled: true
            });

            const res = await request(app)
                .post('/api/rewards/apply')
                .send({
                    customerId: 'test_customer_123',
                    rewardType: 'fixed'
                });

            expect(res.status).to.equal(400);
            expect(res.body.success).to.be.false;
            expect(res.body.message).to.include('not active');
        });
    });

    describe('Coupon Generation', () => {
        it('should generate coupon with correct structure', async () => {
            const res = await request(app)
                .post('/api/rewards/apply')
                .send({
                    customerId: 'test_customer_123',
                    rewardType: 'fixed'
                });

            expect(res.status).to.equal(200);

            // Verify coupon creation parameters
            const couponCreateCall = Coupon.create.getCall(0);
            expect(couponCreateCall.args[0]).to.include({
                customer: 'customer1',
                merchant: 'merchant1',
                reward: 'reward1'
            });
            expect(couponCreateCall.args[0].code).to.be.a('string');
            expect(couponCreateCall.args[0].isRedeemed).to.be.false;
        });

        it('should send notification email with coupon details', async () => {
            const res = await request(app)
                .post('/api/rewards/apply')
                .send({
                    customerId: 'test_customer_123',
                    rewardType: 'fixed'
                });

            expect(res.status).to.equal(200);

            // Verify email was sent
            expect(sendEmail.sendEmail.calledOnce).to.be.true;

            // Check email parameters
            const emailCall = sendEmail.sendEmail.getCall(0);
            expect(emailCall.args[0]).to.equal('aywork73@gmail.com'); // Customer email
            expect(emailCall.args[1]).to.be.a('string'); // Subject
            expect(emailCall.args[2]).to.be.a('string'); // HTML content
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors gracefully', async () => {
            Customer.findOne.rejects(new Error('Database connection failed'));

            const res = await request(app)
                .post('/api/rewards/apply')
                .send({
                    customerId: 'test_customer_123',
                    rewardType: 'fixed'
                });

            expect(res.status).to.equal(500);
            expect(res.body.success).to.be.false;
            expect(res.body.message).to.include('server error');
        });

        it('should handle email service failures', async () => {
            sendEmail.sendEmail.rejects(new Error('Email service unavailable'));

            const res = await request(app)
                .post('/api/rewards/apply')
                .send({
                    customerId: 'test_customer_123',
                    rewardType: 'fixed'
                });

            // Should still succeed even if email fails
            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
        });

        it('should handle coupon creation failures', async () => {
            Coupon.create.rejects(new Error('Failed to create coupon'));

            const res = await request(app)
                .post('/api/rewards/apply')
                .send({
                    customerId: 'test_customer_123',
                    rewardType: 'fixed'
                });

            expect(res.status).to.equal(500);
            expect(res.body.success).to.be.false;
        });
    });

    describe('Integration with Loyalty System', () => {
        it('should integrate with loyalty point system', async () => {
            const customerMock = {
                _id: 'customer1',
                customerId: 'test_customer_123',
                points: 200,
                tier: 'silver',
                email: 'aywork73@gmail.com',
                save: sandbox.stub().resolves()
            };

            Customer.findOne.resolves(customerMock);

            const res = await request(app)
                .post('/api/rewards/apply')
                .send({
                    customerId: 'test_customer_123',
                    rewardType: 'fixed'
                });

            expect(res.status).to.equal(200);

            // Verify points were deducted
            expect(customerMock.save.calledOnce).to.be.true;
        });

        it('should handle different reward types', async () => {
            // Test percentage reward
            Reward.findOne.resolves({
                _id: 'reward2',
                rewardType: 'percentage',
                pointsRequired: 150,
                discountType: 'percentage',
                discountValue: 20,
                isActive: true,
                enabled: true
            });

            const res = await request(app)
                .post('/api/rewards/apply')
                .send({
                    customerId: 'test_customer_123',
                    rewardType: 'percentage'
                });

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
        });
    });
});
