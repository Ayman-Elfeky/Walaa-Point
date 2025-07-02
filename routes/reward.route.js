const express = require('express');
const router = express.Router();
const protect = require('../middlewares/protect');

const { applyRewardToCustomer, applyShareRewardToCustomer, generateShareableLink } = require('../controllers/reward.controller');
const { redeemCoupon } = require('../controllers/redeemCoupon.controller');

router.post('/rewards/applyReward', protect, applyRewardToCustomer);
router.post('/rewards/redeem', protect, redeemCoupon);
router.get('/rewards/generateShareLink/:customerId', protect, generateShareableLink);
router.get('/share/:customerId', applyShareRewardToCustomer); // Remove protect since this is a public share link

module.exports = router;
