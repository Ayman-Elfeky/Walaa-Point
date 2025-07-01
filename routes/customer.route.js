const express = require('express');
const router = express.Router();

const {
    getCustomers,
    getCustomerById,
    // createCustomer,
    // updateCustomer,
    // deleteCustomer
} = require('../controllers/customer.controller');
const protect = require('../middlewares/protect');

router.get('/', protect, getCustomers);
router.get('/:id', protect, getCustomerById);
// router.post('/', protect, createCustomer);
// router.put('/:id', protect, updateCustomer); // changed from PATCH to PUT
// router.delete('/:id', protect, deleteCustomer);

module.exports = router;
