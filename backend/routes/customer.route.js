const express = require('express');
const router = express.Router();

const {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    adjustCustomerPoints,
    getCustomerLoyaltyActivityRecords,
    getCustomerLoyaltySummaryData,
    getCustomerPointsBalanceData,
    getRecentActivities,
    exportCustomers
} = require('../controllers/customer.controller');
const protect = require('../middlewares/protect');

// Customer CRUD operations
router.get('/', protect, getCustomers);
router.get('/recent-activities', protect, getRecentActivities);
router.get('/export', protect, exportCustomers);
router.get('/:id', protect, getCustomerById);
router.post('/', protect, createCustomer);
router.put('/:id', protect, updateCustomer);
router.delete('/:id', protect, deleteCustomer);

// Points management
router.post('/:id/adjust-points', protect, adjustCustomerPoints);
router.get('/:id/points-balance', protect, getCustomerPointsBalanceData);

// Loyalty activities and summary
router.get('/:id/loyalty-activity', protect, getCustomerLoyaltyActivityRecords);
router.get('/:id/loyalty-summary', protect, getCustomerLoyaltySummaryData);

module.exports = router;
