const express = require('express');
const router = express.Router();
const protect = require('../middlewares/protect');

const { 
    createReward,
    getAllRewards,
    getRewardById,
    updateReward,
    deleteReward,
    applyRewardToCustomer, 
    applyShareRewardToCustomer, 
    generateShareableLink 
} = require('../controllers/reward.controller');
const { redeemCoupon } = require('../controllers/redeemCoupon.controller');

// Reward CRUD operations
router.get('/', protect, getAllRewards);
router.post('/', protect, createReward);
router.get('/:id', protect, getRewardById);
router.put('/:id', protect, updateReward);
router.delete('/:id', protect, deleteReward);

// Reward application and redemption
router.post('/apply', protect, applyRewardToCustomer);
router.post('/redeem', protect, redeemCoupon);

// Share functionality
router.get('/generate-share-link/:customerId', protect, generateShareableLink);
router.get('/share/:customerId', applyShareRewardToCustomer); // Remove protect since this is a public share link

module.exports = router;
