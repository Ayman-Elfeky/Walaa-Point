const { expect } = require('chai');
const sinon = require('sinon');
const loyaltyEngine = require('../services/loyalityEngine');
const Customer = require('../models/customer.model');
const Merchant = require('../models/merchant.model');
const Reward = require('../models/reward.model');
const Coupon = require('../models/coupon.model');
const CustomerLoyaltyActivity = require('../models/customerLoyalityActivitySchema.model');
const sendEmail = require('../utils/sendEmail');

describe('Loyalty Engine Unit Tests', () => {
  let merchant, customer, reward;

  beforeEach(() => {
    merchant = { _id: 'merchant1', loyaltySettings: { rewardThreshold: 100 }, notificationSettings: { earnNewPoints: true, earnNewCoupon: true }, merchantName: 'Test Store', merchantUsername: 'teststore' };
    customer = { _id: 'customer1', points: 0, tier: 'bronze', email: 'aywork73@gmail.com', save: sinon.stub().resolves(), coupons: [] };
    reward = { _id: 'reward1', isActive: true, expiryDate: null };
    sinon.stub(Customer, 'findOne').resolves(customer);
    sinon.stub(Merchant, 'findById').resolves(merchant);
    sinon.stub(Reward, 'findOne').resolves(reward);
    sinon.stub(Coupon, 'create').resolves({ code: 'COUPON123', _id: 'coupon1' });
    sinon.stub(CustomerLoyaltyActivity, 'create').resolves();
    sinon.stub(sendEmail, 'sendEmail').resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should award points and generate coupon when threshold is reached', async () => {
    await loyaltyEngine({ event: 'purchase', merchant, customer, metadata: { amount: 100 } });
    expect(customer.points).to.be.greaterThan(0);
    expect(sendEmail.sendEmail.called).to.be.true;
  });

  it('should not generate coupon if no active reward', async () => {
    Reward.findOne.resolves(null);
    await loyaltyEngine({ event: 'purchase', merchant, customer, metadata: { amount: 100 } });
    expect(sendEmail.sendEmail.calledWith('aywork73@gmail.com', sinon.match('No Active Reward Found'))).to.be.true;
  });

  it('should send notification on coupon generation', async () => {
    await loyaltyEngine({ event: 'purchase', merchant, customer, metadata: { amount: 100 } });
    expect(sendEmail.sendEmail.calledWith(customer.email, sinon.match('تم إنشاء كوبون خصم جديد!'))).to.be.true;
  });
});
