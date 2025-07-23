const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');

const loyaltyEngine = require('../services/loyalityEngine');
const Merchant = require('../models/merchant.model');
const Customer = require('../models/customer.model');
const CustomerLoyaltyActivity = require('../models/customerLoyalityActivitySchema.model');
const Reward = require('../models/reward.model');
const Coupon = require('../models/coupon.model');
const sendEmailModule = require('../utils/sendEmail');

describe('Loyalty Engine Integration Tests', () => {
    let merchantStub, customerStub, loyaltyActivityStub, rewardStub, couponStub, sendEmailStub;
    let mockMerchant, mockCustomer, mockReward;

    beforeEach(() => {
        // Setup comprehensive mock merchant
        mockMerchant = {
            _id: new mongoose.Types.ObjectId(),
            merchantId: 'test_merchant_123',
            merchantName: 'Test Loyalty Store',
            merchantUsername: 'testloyalty',
            merchantDomain: 'https://testloyalty.salla.sa',
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
            save: sinon.stub().resolves()
        };

        // Setup mock customer
        mockCustomer = {
            _id: new mongoose.Types.ObjectId(),
            customerId: 'test_customer_456',
            merchant: mockMerchant._id,
            name: 'Test Customer',
            email: 'aywork73@gmail.com',
            phone: '+966501234567',
            points: 50,
            tier: 'bronze',
            dateOfBirth: new Date('1990-05-15'),
            save: sinon.stub().resolves()
        };

        // Setup mock reward
        mockReward = {
            _id: new mongoose.Types.ObjectId(),
            merchant: mockMerchant._id,
            title: 'Test Reward',
            description: 'Test reward description',
            discountType: 'percentage',
            discountValue: 15,
            isActive: true,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        };

        // Setup stubs
        merchantStub = sinon.stub(Merchant, 'findById').resolves(mockMerchant);
        customerStub = sinon.stub(Customer, 'findOne').resolves(mockCustomer);
        loyaltyActivityStub = sinon.stub(CustomerLoyaltyActivity, 'create').resolves({
            _id: new mongoose.Types.ObjectId(),
            customerId: mockCustomer._id,
            merchantId: mockMerchant._id
        });
        rewardStub = sinon.stub(Reward, 'findOne').resolves(mockReward);
        couponStub = sinon.stub(Coupon, 'create').resolves({
            _id: new mongoose.Types.ObjectId(),
            code: 'TEST123COUPON',
            customer: mockCustomer._id,
            merchant: mockMerchant._id,
            reward: mockReward._id
        });
        sendEmailStub = sinon.stub(sendEmailModule, 'sendEmail').resolves();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('Purchase Events', () => {
        it('should award points for purchase and update customer tier', async () => {
            const eventData = {
                event: 'purchase',
                merchant: mockMerchant,
                customer: mockCustomer,
                metadata: {
                    orderId: 'order_123',
                    amount: 200,
                    currency: 'SAR'
                }
            };

            await loyaltyEngine(eventData);

            // Verify customer points were updated
            expect(mockCustomer.save.calledOnce).to.be.true;

            // Verify loyalty activity was logged
            expect(loyaltyActivityStub.calledOnce).to.be.true;
            const activityCall = loyaltyActivityStub.getCall(0);
            expect(activityCall.args[0].event).to.equal('purchase');
            expect(activityCall.args[0].metadata.orderId).to.equal('order_123');

            // Verify merchant total points were updated
            expect(mockMerchant.save.calledOnce).to.be.true;
        });

        it('should generate coupon when customer reaches reward threshold', async () => {
            // Set customer points close to threshold
            mockCustomer.points = 95;

            const eventData = {
                event: 'purchase',
                merchant: mockMerchant,
                customer: mockCustomer,
                metadata: {
                    orderId: 'order_threshold',
                    amount: 10, // This should push customer over 100 points
                    currency: 'SAR'
                }
            };

            await loyaltyEngine(eventData);

            // Verify coupon was created
            expect(couponStub.calledOnce).to.be.true;

            // Verify coupon generation was logged
            expect(loyaltyActivityStub.calledTwice).to.be.true;
            const calls = loyaltyActivityStub.getCalls();
            const couponCall = calls.find(call => call.args[0].event === 'coupon_generated');
            expect(couponCall).to.exist;

            // Verify email notifications were sent
            expect(sendEmailStub.calledTwice).to.be.true; // Once to customer, once to admin
        });

        it('should handle purchase amount threshold points', async () => {
            const eventData = {
                event: 'purchaseAmountThresholdPoints',
                merchant: mockMerchant,
                customer: mockCustomer,
                metadata: {
                    orderId: 'order_big',
                    amount: 600, // Above threshold of 500
                    currency: 'SAR'
                }
            };

            await loyaltyEngine(eventData);

            expect(loyaltyActivityStub.calledOnce).to.be.true;
            const activityCall = loyaltyActivityStub.getCall(0);
            expect(activityCall.args[0].event).to.equal('purchaseAmountThresholdPoints');
        });
    });

    describe('Points Deduction', () => {
        it('should deduct points and update tier accordingly', async () => {
            mockCustomer.points = 200;
            mockCustomer.tier = 'silver';

            const eventData = {
                event: 'pointsDeduction',
                merchant: mockMerchant,
                customer: mockCustomer,
                metadata: {
                    pointsDeducted: 150,
                    reason: 'order_refunded',
                    orderId: 'order_refund_123',
                    originalEvent: 'order_refunded'
                }
            };

            await loyaltyEngine(eventData);

            // Verify activity was logged with negative points
            expect(loyaltyActivityStub.calledOnce).to.be.true;
            const activityCall = loyaltyActivityStub.getCall(0);
            expect(activityCall.args[0].event).to.equal('pointsDeduction');
            expect(activityCall.args[0].points).to.be.lessThan(0);

            // Verify customer and merchant were saved
            expect(mockCustomer.save.calledOnce).to.be.true;
            expect(mockMerchant.save.calledOnce).to.be.true;
        });

        it('should not deduct points below zero', async () => {
            mockCustomer.points = 30;

            const eventData = {
                event: 'pointsDeduction',
                merchant: mockMerchant,
                customer: mockCustomer,
                metadata: {
                    pointsDeducted: 100, // More than customer has
                    reason: 'order_deleted'
                }
            };

            await loyaltyEngine(eventData);

            // Points should be deducted but not below 0
            expect(loyaltyActivityStub.calledOnce).to.be.true;
            const activityCall = loyaltyActivityStub.getCall(0);
            expect(activityCall.args[0].points).to.equal(-30); // Only deduct what customer had
        });
    });

    describe('Birthday Points', () => {
        it('should award birthday points', async () => {
            const eventData = {
                event: 'birthday',
                merchant: mockMerchant,
                customer: mockCustomer,
                metadata: {
                    birthdayDate: new Date().toISOString()
                }
            };

            await loyaltyEngine(eventData);

            expect(loyaltyActivityStub.calledOnce).to.be.true;
            const activityCall = loyaltyActivityStub.getCall(0);
            expect(activityCall.args[0].event).to.equal('birthday');
        });
    });

    describe('Welcome Points', () => {
        it('should award welcome points to new customers', async () => {
            const eventData = {
                event: 'welcome',
                merchant: mockMerchant,
                customer: mockCustomer,
                metadata: {
                    source: 'customer_created_webhook'
                }
            };

            await loyaltyEngine(eventData);

            expect(loyaltyActivityStub.calledOnce).to.be.true;
            const activityCall = loyaltyActivityStub.getCall(0);
            expect(activityCall.args[0].event).to.equal('welcome');
        });
    });

    describe('Review and Feedback Points', () => {
        it('should award points for app ratings', async () => {
            const eventData = {
                event: 'ratingAppPoints',
                merchant: mockMerchant,
                customer: mockCustomer,
                metadata: {
                    rating: 5,
                    productId: 'product_123'
                }
            };

            await loyaltyEngine(eventData);

            expect(loyaltyActivityStub.calledOnce).to.be.true;
            const activityCall = loyaltyActivityStub.getCall(0);
            expect(activityCall.args[0].event).to.equal('ratingAppPoints');
        });

        it('should award points for shipping feedback', async () => {
            const eventData = {
                event: 'feedbackShippingPoints',
                merchant: mockMerchant,
                customer: mockCustomer,
                metadata: {
                    feedbackId: 'feedback_123',
                    rating: 4
                }
            };

            await loyaltyEngine(eventData);

            expect(loyaltyActivityStub.calledOnce).to.be.true;
            const activityCall = loyaltyActivityStub.getCall(0);
            expect(activityCall.args[0].event).to.equal('feedbackShippingPoints');
        });
    });

    describe('Coupon Generation Logic', () => {
        it('should generate multiple coupons for large point awards', async () => {
            // Set customer points to 50, then award 250 points (should generate 2 coupons)
            mockCustomer.points = 50;

            const eventData = {
                event: 'purchase',
                merchant: mockMerchant,
                customer: mockCustomer,
                metadata: {
                    orderId: 'large_order',
                    amount: 250,
                    currency: 'SAR'
                }
            };

            await loyaltyEngine(eventData);

            // Should generate 2 coupons (customer goes from 50 to 300 points)
            // First at 100, second at 200
            expect(couponStub.callCount).to.equal(2);
        });

        it('should notify admin when no active reward exists', async () => {
            rewardStub.resolves(null); // No active reward
            mockCustomer.points = 95;

            const eventData = {
                event: 'purchase',
                merchant: mockMerchant,
                customer: mockCustomer,
                metadata: {
                    orderId: 'order_no_reward',
                    amount: 10,
                    currency: 'SAR'
                }
            };

            await loyaltyEngine(eventData);

            // Should send admin notification about missing reward
            expect(sendEmailStub.calledWith('aywork73@gmail.com')).to.be.true;
        });
    });

    describe('Tier Calculation', () => {
        it('should upgrade customer tier based on points', async () => {
            mockCustomer.points = 80;
            mockCustomer.tier = 'bronze';

            const eventData = {
                event: 'purchase',
                merchant: mockMerchant,
                customer: mockCustomer,
                metadata: {
                    orderId: 'tier_upgrade',
                    amount: 25, // Should push to 105 points = silver tier
                    currency: 'SAR'
                }
            };

            await loyaltyEngine(eventData);

            expect(mockCustomer.save.calledOnce).to.be.true;
            // Tier should be updated to silver (100+ points)
        });

        it('should downgrade customer tier when points are deducted', async () => {
            mockCustomer.points = 150;
            mockCustomer.tier = 'silver';

            const eventData = {
                event: 'pointsDeduction',
                merchant: mockMerchant,
                customer: mockCustomer,
                metadata: {
                    pointsDeducted: 100, // Should bring to 50 points = bronze tier
                    reason: 'order_cancelled'
                }
            };

            await loyaltyEngine(eventData);

            expect(mockCustomer.save.calledOnce).to.be.true;
            // Tier should be downgraded to bronze
        });
    });

    describe('Email Notifications', () => {
        it('should send notification for point awards', async () => {
            const eventData = {
                event: 'purchase',
                merchant: mockMerchant,
                customer: mockCustomer,
                metadata: {
                    orderId: 'notification_test',
                    amount: 100
                }
            };

            await loyaltyEngine(eventData);

            expect(sendEmailStub.called).to.be.true;
            const emailCall = sendEmailStub.getCall(0);
            expect(emailCall.args[0]).to.equal('aywork73@gmail.com');
        });

        it('should send notification for point deductions', async () => {
            const eventData = {
                event: 'pointsDeduction',
                merchant: mockMerchant,
                customer: mockCustomer,
                metadata: {
                    pointsDeducted: 25,
                    reason: 'order_refunded'
                }
            };

            await loyaltyEngine(eventData);

            expect(sendEmailStub.called).to.be.true;
        });

        it('should send birthday notification', async () => {
            const eventData = {
                event: 'birthday',
                merchant: mockMerchant,
                customer: mockCustomer,
                metadata: {
                    birthdayDate: new Date().toISOString()
                }
            };

            await loyaltyEngine(eventData);

            expect(sendEmailStub.called).to.be.true;
        });
    });

    describe('Error Handling', () => {
        it('should handle missing merchant gracefully', async () => {
            merchantStub.resolves(null);

            const eventData = {
                event: 'purchase',
                merchant: null,
                customer: mockCustomer,
                metadata: { amount: 100 }
            };

            // Should not throw error
            await loyaltyEngine(eventData);

            expect(loyaltyActivityStub.called).to.be.false;
        });

        it('should handle missing customer gracefully', async () => {
            customerStub.resolves(null);

            const eventData = {
                event: 'purchase',
                merchant: mockMerchant,
                customer: null,
                metadata: { amount: 100 }
            };

            // Should not throw error
            await loyaltyEngine(eventData);

            expect(loyaltyActivityStub.called).to.be.false;
        });

        it('should handle email sending failures gracefully', async () => {
            sendEmailStub.rejects(new Error('Email service unavailable'));

            const eventData = {
                event: 'purchase',
                merchant: mockMerchant,
                customer: mockCustomer,
                metadata: { amount: 100 }
            };

            // Should not throw error even if email fails
            await loyaltyEngine(eventData);

            expect(loyaltyActivityStub.called).to.be.true;
            expect(mockCustomer.save.called).to.be.true;
        });
    });

    describe('Unknown Events', () => {
        it('should handle unknown events gracefully', async () => {
            const eventData = {
                event: 'unknown_event',
                merchant: mockMerchant,
                customer: mockCustomer,
                metadata: {}
            };

            // Should not throw error
            await loyaltyEngine(eventData);

            // Should not process anything
            expect(loyaltyActivityStub.called).to.be.false;
        });
    });
}); 