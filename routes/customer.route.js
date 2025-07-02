const express = require('express');
const router = express.Router();

const {
    getCustomers,
    getCustomerById,
    getCustomerLoyaltyActivityRecords,
    // getCustomerLoyaltySummaryData
    // createCustomer,
    // updateCustomer,
    // deleteCustomer
} = require('../controllers/customer.controller');
const protect = require('../middlewares/protect');

router.get('/', protect, getCustomers);
router.get('/:id', protect, getCustomerById);
router.get('/:id/loyalty-activity', protect, getCustomerLoyaltyActivityRecords);
// router.get('/:id/loyalty-summary', protect, getCustomerLoyaltySummaryData);
// router.post('/', protect, createCustomer);
// router.put('/:id', protect, updateCustomer); // changed from PATCH to PUT
// router.delete('/:id', protect, deleteCustomer);

module.exports = router;
