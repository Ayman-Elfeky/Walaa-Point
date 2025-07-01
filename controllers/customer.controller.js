const Customer = require('../models/customer.model');

const getCustomerById = async (req, res) => {
    const { id } = req.params;
    const merchant = req.merchant; // Get merchant from protect middleware

    try {
        // Find customer by both customer ID and merchant ID
        const customer = await Customer.findOne({
            _id: id,
            merchant: merchant._id  // Ensure customer belongs to this merchant
        });

        if (!customer) {
            return res.status(404).json({ 
                success: false,
                message: 'Customer not found or does not belong to this merchant' 
            });
        }

        res.status(200).json({ 
            success: true, 
            customer 
        });
    } catch (error) {
        console.error('Error fetching customer by ID:', error.message);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong' 
        });
    }
}
const getCustomers = async (req, res) => {
    const merchant = req.merchant; // Assuming you pass merchantId as a query parameter

    if (!merchant) {
        return res.status(400).json({ message: 'Merchant ID is required' });
    }
    try {
        const customers = await Customer.find({ merchant: merchant._id });
        res.status(200).json({
            success: true,
            message: 'Customers fetched successfully',
            customers
        });
    } catch (error) {
        console.error('Error fetching customers:', error.message);
        res.status(500).json({ message: 'Something went wrong' });
    }
}

module.exports = {
    getCustomerById,
    getCustomers
}