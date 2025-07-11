const express = require('express');
const router = express.Router();
const protect = require('../middlewares/protect');
const { refreshSubscriptionData } = require('../middlewares/subscription');
const { getCurrentSubscription, getBillingHistory, getUsageStatistics } = require('../controllers/merchant.controller');

const {
    getSubscriptionInfo,
    getAvailablePlans,
    checkFeatureAccess
} = require('../controllers/subscription.controller');

// Get subscription information (with automatic refresh)
router.get('/info', protect, refreshSubscriptionData, getSubscriptionInfo);

// Get available subscription plans
router.get('/plans', protect, getAvailablePlans);

// Check feature access
router.post('/check-feature', protect, checkFeatureAccess);

// Subscription routes
router.get('/current', protect, getCurrentSubscription);
router.get('/billing-history', protect, getBillingHistory);
router.get('/usage', protect, getUsageStatistics);

module.exports = router; 