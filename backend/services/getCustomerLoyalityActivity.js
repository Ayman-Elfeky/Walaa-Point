const CustomerLoyaltyActivity = require('../models/customerLoyalityActivitySchema.model');

/**
 * Get customer loyalty activity records
 * @param {String} customerId - The customer ID
 * @param {String} merchantId - The merchant ID (optional, for filtering)
 * @param {Object} options - Query options
 * @param {Number} options.page - Page number (default: 1)
 * @param {Number} options.limit - Records per page (default: 10)
 * @param {String} options.sortBy - Sort field (default: 'createdAt')
 * @param {String} options.sortOrder - Sort order 'asc' or 'desc' (default: 'desc')
 * @param {String} options.activityType - Filter by activity type
 * @param {Date} options.startDate - Filter from this date
 * @param {Date} options.endDate - Filter to this date
 * @returns {Object} - Activity records with pagination info
 */
const getCustomerLoyaltyActivity = async (customerId, merchantId = null, options = {}) => {
    try {
        console.log('\n📊 Fetching loyalty activity for customer:', customerId, '\n');

        // Set default options
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            activityType = null,
            startDate = null,
            endDate = null
        } = options;

        // Build query
        const query = { customerId };

        // Add merchant filter if provided
        if (merchantId) {
            query.merchantId = merchantId;
        }

        // Add activity type filter if provided
        if (activityType) {
            query.activityType = activityType;
        }

        // Add date range filter if provided
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }

        console.log('\n🔍 Query filters:', query, '\n');

        // Calculate pagination
        const skip = (page - 1) * limit;
        const sortOption = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        // Execute query with pagination
        const [activities, totalCount] = await Promise.all([
            CustomerLoyaltyActivity.find(query)
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean(),
            CustomerLoyaltyActivity.countDocuments(query)
        ]);

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        console.log('\n✅ Found', activities.length, 'activities out of', totalCount, 'total\n');

        return {
            success: true,
            data: {
                activities,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalRecords: totalCount,
                    recordsPerPage: limit,
                    hasNextPage,
                    hasPrevPage
                }
            }
        };

    } catch (error) {
        console.error('\n❌ Error fetching customer loyalty activity:', error, '\n');
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get customer loyalty activity summary
 * @param {String} customerId - The customer ID
 * @param {String} merchantId - The merchant ID (optional)
 * @returns {Object} - Activity summary
 */
const getCustomerLoyaltySummary = async (customerId, merchantId = null) => {
    try {
        console.log('\n📈 Generating loyalty summary for customer:', customerId, '\n');

        const query = { customerId };
        if (merchantId) {
            query.merchantId = merchantId;
        }

        // Aggregate activity summary
        const summary = await CustomerLoyaltyActivity.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalActivities: { $sum: 1 },
                    totalPointsEarned: {
                        $sum: {
                            $cond: [
                                { $gt: ['$pointsEarned', 0] },
                                '$pointsEarned',
                                0
                            ]
                        }
                    },
                    totalPointsSpent: {
                        $sum: {
                            $cond: [
                                { $lt: ['$pointsEarned', 0] },
                                { $abs: '$pointsEarned' },
                                0
                            ]
                        }
                    },
                    activitiesByType: {
                        $push: {
                            type: '$activityType',
                            points: '$pointsEarned',
                            date: '$createdAt'
                        }
                    }
                }
            }
        ]);

        // Get activity type breakdown
        const activityBreakdown = await CustomerLoyaltyActivity.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$activityType',
                    count: { $sum: 1 },
                    totalPoints: { $sum: '$pointsEarned' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        console.log('\n✅ Summary generated successfully\n');

        return {
            success: true,
            data: {
                summary: summary[0] || {
                    totalActivities: 0,
                    totalPointsEarned: 0,
                    totalPointsSpent: 0
                },
                activityBreakdown
            }
        };

    } catch (error) {
        console.error('\n❌ Error generating loyalty summary:', error, '\n');
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    getCustomerLoyaltyActivity,
    getCustomerLoyaltySummary
};
