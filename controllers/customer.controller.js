const Customer = require('../models/customer.model');
const { getCustomerLoyaltyActivity } = require('../services/getCustomerLoyalityActivity');
// const { getCustomerPointsBalance } = require('../services/createLoyaltyActivity');

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

/**
 * Get customer loyalty activity records
 * GET /api/customers/:id/loyalty-activity
 */
const getCustomerLoyaltyActivityRecords = async (req, res) => {
    const { id } = req.params;
    const merchant = req.merchant; // Get merchant from protect middleware

    try {
        console.log('\n🔍 Getting loyalty activity for customer:', id, '\n');

        // First verify customer belongs to this merchant
        const customer = await Customer.findOne({
            _id: id,
            merchant: merchant._id
        });

        if (!customer) {
            return res.status(404).json({ 
                success: false,
                message: 'Customer not found or does not belong to this merchant' 
            });
        }

        // Extract query parameters for filtering and pagination
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            sortBy: req.query.sortBy || 'createdAt',
            sortOrder: req.query.sortOrder || 'desc',
            activityType: req.query.activityType,
            startDate: req.query.startDate,
            endDate: req.query.endDate
        };

        // Get loyalty activity using the service
        const result = await getCustomerLoyaltyActivity(id, merchant._id, options);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve loyalty activity',
                error: result.error
            });
        }

        console.log('\nLoyalty activity retrieved successfully\n');

        res.status(200).json({
            success: true,
            message: 'Customer loyalty activity retrieved successfully',
            ...result.data
        });

    } catch (error) {
        console.error('\nError fetching customer loyalty activity:', error, '\n');
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};

/**
 * Get customer loyalty summary
 * GET /api/customers/:id/loyalty-summary
 */
const getCustomerLoyaltySummaryData = async (req, res) => {
    const { id } = req.params;
    const merchant = req.merchant; // Get merchant from protect middleware

    try {
        console.log('\n📊 Getting loyalty summary for customer:', id, '\n');

        // First verify customer belongs to this merchant
        const customer = await Customer.findOne({
            _id: id,
            merchant: merchant._id
        });

        if (!customer) {
            return res.status(404).json({ 
                success: false,
                message: 'Customer not found or does not belong to this merchant' 
            });
        }

        // Get loyalty summary using the service
        const result = await getCustomerLoyaltySummary(id, merchant._id);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve loyalty summary',
                error: result.error
            });
        }

        console.log('\n✅ Loyalty summary retrieved successfully\n');

        res.status(200).json({
            success: true,
            message: 'Customer loyalty summary retrieved successfully',
            customer: {
                _id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone
            },
            ...result.data
        });

    } catch (error) {
        console.error('\n❌ Error fetching customer loyalty summary:', error, '\n');
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};

/**
 * Get customer points balance
 * GET /api/customers/:id/points-balance
 */
const getCustomerPointsBalanceData = async (req, res) => {
    const { id } = req.params;
    const merchant = req.merchant; // Get merchant from protect middleware

    try {
        console.log('\n💰 Getting points balance for customer:', id, '\n');

        // First verify customer belongs to this merchant
        const customer = await Customer.findOne({
            _id: id,
            merchant: merchant._id
        });

        if (!customer) {
            return res.status(404).json({ 
                success: false,
                message: 'Customer not found or does not belong to this merchant' 
            });
        }

        // Get points balance using the service
        // const result = await getCustomerPointsBalance(id, merchant._id);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve points balance',
                error: result.error
            });
        }

        console.log('\n✅ Points balance retrieved successfully\n');

        res.status(200).json({
            success: true,
            message: 'Customer points balance retrieved successfully',
            customer: {
                _id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone
            },
            balance: result.data
        });

    } catch (error) {
        console.error('\n❌ Error fetching customer points balance:', error, '\n');
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};

module.exports = {
    getCustomerById,
    getCustomers,
    getCustomerLoyaltyActivityRecords,
    getCustomerLoyaltySummaryData,
    getCustomerPointsBalanceData
}