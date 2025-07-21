const request = require('supertest');
const express = require('express');
const sinon = require('sinon');
const app = express();
app.use(express.json());

const customerController = require('../controllers/customer.controller');
const rewardController = require('../controllers/reward.controller');
const redeemCouponController = require('../controllers/redeemCoupon.controller');
const webhookController = require('../controllers/webhook.controller');

app.post('/api/webhook', webhookController);
app.post('/api/customers/apply-reward', rewardController.applyRewardToCustomer);
app.post('/api/customers/redeem-coupon', redeemCouponController);

const Merchant = require('../models/merchant.model');
const Customer = require('../models/customer.model');
const Reward = require('../models/reward.model');
const Coupon = require('../models/coupon.model');
const sendEmail = require('../utils/sendEmail');

sinon.stub(Merchant, 'findOne').resolves({ _id: 'merchant1', merchantId: 'merchant1', loyaltySettings: { purchasePoints: { enabled: true, pointsPerCurrencyUnit: 1 }, rewardThreshold: 100 }, notificationSettings: { earnNewPoints: true, earnNewCoupon: true }, merchantName: 'Test Store', merchantUsername: 'teststore' });
sinon.stub(Customer, 'findOne').resolves({ _id: 'customer1', customerId: 'customer1', merchant: 'merchant1', points: 100, email: 'aywork73@gmail.com', save: sinon.stub().resolves() });
sinon.stub(Reward, 'findOne').resolves({ _id: 'reward1', merchant: 'merchant1', threshold: 100, usageCount: 0, save: sinon.stub().resolves() });
sinon.stub(Coupon.prototype, 'save').resolves();
sinon.stub(sendEmail, 'sendEmail').resolves();

describe('Software E2E Test', () => {
  after(() => sinon.restore());

  it('should process webhook, generate coupon, and allow redemption', async () => {
    // Simulate order webhook
    await request(app)
      .post('/api/webhook')
      .send({ event: 'order.created', merchant: 'merchant1', data: { customer: { id: 'customer1' }, amounts: { total: { amount: 100 } }, id: 'order1', currency: 'SAR', reference_id: 'ref1' } });
    // Apply reward manually
    await request(app)
      .post('/api/customers/apply-reward')
      .send({ customerId: 'customer1', merchantId: 'merchant1' });
    // Redeem coupon
    const res = await request(app)
      .post('/api/customers/redeem-coupon')
      .send({ couponCode: 'TESTCOUPON', customerId: 'customer1' });
    expect(res.status).to.equal(200);
    expect(sendEmail.sendEmail.called).to.be.true;
  });
});
