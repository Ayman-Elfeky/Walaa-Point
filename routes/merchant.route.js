const express = require('express');
const router = express.Router();
const protect = require('../middlewares/protect');
const { 
    loginMerchant, 
    getMerchantDashboard,
    // updateMerchantProfile,
    getLoyaltySettings,
    updateLoyaltySettings,
} = require('../controllers/merchant.controller');

// Auth
router.post('/login', loginMerchant);

// Profile
router.get('/dashboard', protect, getMerchantDashboard);
// router.put('/profile', protect, updateMerchantProfile); 

// Loyalty Settings
router.get('/settings', protect, getLoyaltySettings);
router.put('/settings', protect, updateLoyaltySettings); 

module.exports = router;
