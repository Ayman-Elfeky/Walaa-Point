const express = require('express');
const router = express.Router();
const protect = require('../middlewares/protect');
const {
    loginMerchant,
    logoutMerchant,
    getMerchantDashboard,
    // updateMerchantProfile,
    getLoyaltySettings,
    updateLoyaltySettings,
    getRewardSettings,
    updateRewardSettings,
    getIdentityAndDesignSettings,
    updateIdentityAndDesignSettings,
    verifyAuth
} = require('../controllers/merchant.controller');

const {
    updateNotificationsSettings,
    getNotificationsSettings
} = require('../controllers/notification.controller');


// Auth
router.post('/login', loginMerchant);
router.post('/logout', logoutMerchant);
router.get('/verify-auth', protect, verifyAuth);

// Profile
router.get('/dashboard', protect, getMerchantDashboard);
// router.put('/profile', protect, updateMerchantProfile); 

// Loyalty Settings
router.get('/LoyaltySettings', protect, getLoyaltySettings);
router.put('/LoyaltySettings', protect, updateLoyaltySettings);

// Reward Settings
router.get('/rewardSettings', protect, getRewardSettings);
router.put('/rewardSettings', protect, updateRewardSettings);

// Identity and Design Settings
router.get('/identityAndDesign', protect, getIdentityAndDesignSettings);
router.put('/identityAndDesign', protect, updateIdentityAndDesignSettings);

// Notification Settings
router.get('/notifications', protect, getNotificationsSettings);
router.put('/notifications', protect, updateNotificationsSettings);

module.exports = router;
