const request = require('supertest');
const express = require('express');
const sinon = require('sinon');
const app = express();
app.use(express.json());

const webhookController = require('../controllers/webhook.controller');
app.post('/api/webhook', webhookController);

const Merchant = require('../models/merchant.model');
const Customer = require('../models/customer.model');
const sendEmail = require('../utils/sendEmail');

sinon.stub(Merchant, 'findOne').resolves({ _id: 'merchant1', merchantId: 'merchant1', loyaltySettings: { purchasePoints: { enabled: true, pointsPerCurrencyUnit: 1 }, rewardThreshold: 100 }, notificationSettings: { earnNewPoints: true, earnNewCoupon: true }, merchantName: 'Test Store', merchantUsername: 'teststore' });
sinon.stub(Customer, 'findOne').resolves({ _id: 'customer1', customerId: 'customer1', merchant: 'merchant1', points: 0, email: 'aywork73@gmail.com', save: sinon.stub().resolves() });
sinon.stub(sendEmail, 'sendEmail').resolves();

describe('Webhook Simulation Tests', () => {
  after(() => sinon.restore());

  it('should process order.created webhook and award points', async () => {
    const res = await request(app)
      .post('/api/webhook')
      .send({ event: 'order.created', merchant: 'merchant1', data: { customer: { id: 'customer1' }, amounts: { total: { amount: 100 } }, id: 'order1', currency: 'SAR', reference_id: 'ref1' } });
    expect(res.status).to.equal(200);
    expect(sendEmail.sendEmail.calledWith('aywork73@gmail.com')).to.be.true;
  });
});
