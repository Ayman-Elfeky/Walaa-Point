const request = require('supertest');
const express = require('express');
const sinon = require('sinon');
const app = express();
app.use(express.json());

const rewardRouter = require('../routes/reward.route');
app.use('/api/rewards', rewardRouter);

const Customer = require('../models/customer.model');
const Merchant = require('../models/merchant.model');
const Reward = require('../models/reward.model');
const Coupon = require('../models/coupon.model');
const sendEmail = require('../utils/sendEmail');

// Mock protect middleware
sinon.stub(require('../middlewares/protect'), 'apply').callsFake((req, res, next) => next());

// Mock DB and email
sinon.stub(Customer, 'findOne').resolves({ _id: 'customer1', points: 200, email: 'aywork73@gmail.com', save: sinon.stub().resolves() });
sinon.stub(Merchant, 'findOne').resolves({ _id: 'merchant1', loyaltySettings: { rewardThreshold: 100 }, notificationSettings: { earnNewPoints: true, earnNewCoupon: true }, merchantName: 'Test Store', merchantUsername: 'teststore' });
sinon.stub(Reward, 'findOne').resolves({ _id: 'reward1', rewardType: 'fixed', pointsRequired: 100, isActive: true, enabled: true, save: sinon.stub().resolves() });
sinon.stub(Coupon, 'findOne').resolves(null);
sinon.stub(Coupon, 'create').resolves({ code: 'COUPON123', _id: 'coupon1' });
sinon.stub(sendEmail, 'sendEmail').resolves();


describe('Reward Controller Integration Tests', () => {
  after(() => sinon.restore());

  it('should apply reward to customer and generate coupon', async () => {
    const res = await request(app)
      .post('/api/rewards/apply')
      .send({ customerId: 'customer1', rewardType: 'fixed' });
    expect(res.status).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(sendEmail.sendEmail.calledWith('aywork73@gmail.com')).to.be.true;
  });

  it('should not apply reward if customer has unused coupon', async () => {
    Coupon.findOne.resolves({ code: 'COUPON123', used: false, expiresAt: new Date(Date.now() + 1000000) });
    const res = await request(app)
      .post('/api/rewards/apply')
      .send({ customerId: 'customer1', rewardType: 'fixed' });
    expect(res.status).to.equal(400);
    expect(res.body.success).to.be.false;
  });
});
