const express = require('express');
const router = express.Router();
const protect = require('../middlewares/protect');

const {
    getDashboardAnalytics,
    getCustomerParticipation,
    getPointsAnalytics,
    getRewardPerformance,
    getCustomerGrowth,
    getEngagementLevels,
    getPointsFlow,
    getRedemptionTrends,
    getTopPerformingRewards,
    getCustomerSegmentation,
    getRealTimeStats,
    exportAnalyticsReport
} = require('../controllers/analytics.controller');

// Analytics endpoints
router.get('/dashboard', protect, getDashboardAnalytics);
router.get('/customer-participation', protect, getCustomerParticipation);
router.get('/points', protect, getPointsAnalytics);
router.get('/rewards', protect, getRewardPerformance);
router.get('/customer-growth', protect, getCustomerGrowth);
router.get('/engagement', protect, getEngagementLevels);
router.get('/points-flow', protect, getPointsFlow);
router.get('/redemption-trends', protect, getRedemptionTrends);
router.get('/top-rewards', protect, getTopPerformingRewards);
router.get('/customer-segmentation', protect, getCustomerSegmentation);
router.get('/realtime', protect, getRealTimeStats);
router.get('/export', protect, exportAnalyticsReport);

module.exports = router; 