const Customer = require('../models/customer.model');
const CustomerLoyaltyActivity = require('../models/customerLoyalityActivitySchema.model');
const Merchant = require('../models/merchant.model');
const { getCustomerLoyaltyActivity } = require('../services/getCustomerLoyalityActivity');
// const { getCustomerPointsBalance } = require('../services/createLoyaltyActivity');

// Utility to calculate customer tier based on points and merchant thresholds
const calculateCustomerTier = (points, tierThresholds = {}) => {
    const thresholds = {
        bronze: tierThresholds.tierBronze || 0,
        silver: tierThresholds.tierSilver || 1000,
        gold: tierThresholds.tierGold || 5000,
        platinum: tierThresholds.tierPlatinum || 15000
    };

    if (points >= thresholds.platinum) {
        return 'platinum';
    } else if (points >= thresholds.gold) {
        return 'gold';
    } else if (points >= thresholds.silver) {
        return 'silver';
    } else {
        return 'bronze';
    }
};

const getCustomerById = async (req, res) => {
    const { id } = req.params;
    const merchant = req.merchant; // Get merchant from protect middleware

    try {
        // Find customer by both customer ID and merchant ID
        const customer = await Customer.findOne({
            _id: id,
            merchant: merchant._id  // Ensure customer belongs to this merchant
        }).populate('appliedRewards.reward');

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
        const customers = await Customer.find({ merchant: merchant._id })
            .populate('appliedRewards.reward')
            .sort({ createdAt: -1 });

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
 * Create a new customer
 * POST /api/customers
 */
const createCustomer = async (req, res) => {
    const merchant = req.merchant;
    const { customerId, name, email, phone, dateOfBirth } = req.body;

    try {
        // Check if customer already exists for this merchant
        const existingCustomer = await Customer.findOne({
            customerId,
            merchant: merchant._id
        });

        if (existingCustomer) {
            return res.status(400).json({
                success: false,
                message: 'Customer already exists'
            });
        }

        const newCustomer = new Customer({
            merchant: merchant._id,
            customerId,
            name,
            email,
            phone,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined
        });

        await newCustomer.save();

        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            customer: newCustomer
        });
    } catch (error) {
        console.error('Error creating customer:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }
};

/**
 * Update customer information
 * PUT /api/customers/:id
 */
const updateCustomer = async (req, res) => {
    const { id } = req.params;
    const merchant = req.merchant;
    const updates = req.body;

    try {
        const customer = await Customer.findOne({
            _id: id,
            merchant: merchant._id
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Update allowed fields
        const allowedFields = ['name', 'email', 'phone', 'dateOfBirth'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                if (field === 'dateOfBirth' && updates[field]) {
                    customer[field] = new Date(updates[field]);
                } else {
                    customer[field] = updates[field];
                }
            }
        });

        await customer.save();

        res.status(200).json({
            success: true,
            message: 'Customer updated successfully',
            customer
        });
    } catch (error) {
        console.error('Error updating customer:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }
};

/**
 * Manually adjust customer points
 * POST /api/customers/:id/adjust-points
 */
const adjustCustomerPoints = async (req, res) => {
    const { id } = req.params;
    const merchant = req.merchant;
    const { points, reason, type } = req.body; // type: 'add' or 'subtract'

    try {
        if (!points || typeof points !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Valid points amount is required'
            });
        }

        if (!['add', 'subtract'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Type must be either "add" or "subtract"'
            });
        }

        const customer = await Customer.findOne({
            _id: id,
            merchant: merchant._id
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        const pointsToAdjust = type === 'add' ? Math.abs(points) : -Math.abs(points);

        // Check if subtracting doesn't result in negative points
        if (type === 'subtract' && customer.points < Math.abs(points)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot subtract more points than customer has'
            });
        }

        // Update customer points
        customer.points += pointsToAdjust;

        // Calculate and update customer tier based on new points total
        const newTier = calculateCustomerTier(customer.points, merchant.loyaltySettings || {});
        const oldTier = customer.tier || 'bronze';
        customer.tier = newTier;

        // Update merchant total points
        if (type === 'add') {
            merchant.customersPoints = (merchant.customersPoints || 0) + Math.abs(points);
        }

        await customer.save();
        await merchant.save();

        // Log tier change if it occurred
        if (oldTier !== newTier) {
            console.log(`\n🎉 Customer ${customer._id} tier updated from ${oldTier} to ${newTier} after manual adjustment!\n`);
        }

        // Log the manual adjustment
        const loyaltyActivity = await CustomerLoyaltyActivity.create({
            customerId: customer._id,
            merchantId: merchant._id,
            event: 'manual_adjustment',
            points: pointsToAdjust,
            timestamp: new Date(),
            description: `Manual ${type === 'add' ? 'addition' : 'subtraction'} of ${Math.abs(points)} points`,
            metadata: {
                reason: reason || 'Manual adjustment by merchant',
                adjustedBy: 'merchant',
                originalPoints: customer.points - pointsToAdjust,
                newPoints: customer.points
            }
        });

        console.log('✅ Customer points adjusted successfully:', {
            customerId: customer._id,
            adjustment: pointsToAdjust,
            newBalance: customer.points,
            activityId: loyaltyActivity._id
        });

        res.status(200).json({
            success: true,
            message: `Points ${type === 'add' ? 'added' : 'subtracted'} successfully`,
            customer: {
                _id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                points: customer.points
            },
            adjustment: {
                points: pointsToAdjust,
                type,
                reason: reason || 'Manual adjustment by merchant'
            }
        });
    } catch (error) {
        console.error('Error adjusting customer points:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }
};

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
        }).populate('appliedRewards.reward');

        if (!customer) {
            return res.status(404).json({ 
                success: false,
                message: 'Customer not found or does not belong to this merchant' 
            });
        }

        // Get loyalty activity statistics
        const totalActivities = await CustomerLoyaltyActivity.countDocuments({
            customerId: customer._id,
            merchantId: merchant._id
        });

        const totalPointsEarned = await CustomerLoyaltyActivity.aggregate([
            {
                $match: {
                    customerId: customer._id,
                    merchantId: merchant._id,
                    points: { $gt: 0 }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$points' }
                }
            }
        ]);

        const totalPointsSpent = await CustomerLoyaltyActivity.aggregate([
            {
                $match: {
                    customerId: customer._id,
                    merchantId: merchant._id,
                    points: { $lt: 0 }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $abs: '$points' } }
                }
            }
        ]);

        // Get recent activities
        const recentActivities = await CustomerLoyaltyActivity.find({
            customerId: customer._id,
            merchantId: merchant._id
        }).sort({ createdAt: -1 }).limit(5);

        const summary = {
            currentPoints: customer.points,
            totalPointsEarned: totalPointsEarned[0]?.total || 0,
            totalPointsSpent: totalPointsSpent[0]?.total || 0,
            totalActivities,
            totalRewardsApplied: customer.appliedRewards.length,
            recentActivities,
            joinedDate: customer.createdAt
        };

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
            summary
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

        // Get points balance details
        const pointsBalance = {
            currentBalance: customer.points,
            lastUpdated: customer.updatedAt
        };

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
            balance: pointsBalance
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

/**
 * Delete customer (soft delete)
 * DELETE /api/customers/:id
 */
const deleteCustomer = async (req, res) => {
    const { id } = req.params;
    const merchant = req.merchant;

    try {
        const customer = await Customer.findOne({
            _id: id,
            merchant: merchant._id
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        await Customer.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting customer:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }
};

/**
 * Get recent customer activities for dashboard
 * GET /api/customers/recent-activities
 */
const getRecentActivities = async (req, res) => {
    const merchant = req.merchant;
    const { limit = 10 } = req.query;

    try {
        const activities = await CustomerLoyaltyActivity.find({
            merchantId: merchant._id
        })
        .populate('customerId', 'name email')
        .sort({ timestamp: -1 })
        .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            activities: activities || []
        });
    } catch (error) {
        console.error('Error fetching recent activities:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }
};

/**
 * Export customers data
 * GET /api/customers/export
 */
const exportCustomers = async (req, res) => {
    try {
        const merchant = req.merchant;
        const { format = 'csv', ...filters } = req.query;

        // Get all customers with filters
        const customers = await Customer.find({ 
            merchant: merchant._id,
            isDeleted: { $ne: true }
        }).select('customerId name email phone points tier totalOrders totalSpent createdAt');

        if (format === 'csv') {
            // Generate CSV
            const csvHeaders = ['Customer ID', 'Name', 'Email', 'Phone', 'Points', 'Tier', 'Total Orders', 'Total Spent', 'Join Date'];
            const csvRows = customers.map(customer => [
                customer.customerId || '',
                customer.name || '',
                customer.email || '',
                customer.phone || '',
                customer.points || 0,
                customer.tier || 'Bronze',
                customer.totalOrders || 0,
                customer.totalSpent || 0,
                customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : ''
            ]);

            const csvContent = [
                csvHeaders.join(','),
                ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
            ].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="customers-${new Date().toISOString().split('T')[0]}.csv"`);
            return res.send(csvContent);
        }

        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="customers-${new Date().toISOString().split('T')[0]}.json"`);
            return res.json({
                exportDate: new Date().toISOString(),
                totalCustomers: customers.length,
                customers: customers
            });
        }

        return res.status(400).json({
            success: false,
            message: 'Unsupported export format. Use csv or json.'
        });

    } catch (error) {
        console.error('Error exporting customers:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }
};

module.exports = {
    getCustomerById,
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    adjustCustomerPoints,
    getCustomerLoyaltyActivityRecords,
    getCustomerLoyaltySummaryData,
    getCustomerPointsBalanceData,
    getRecentActivities,
    exportCustomers
}