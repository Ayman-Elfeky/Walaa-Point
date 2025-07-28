const Customer = require('../models/customer.model');
const CustomerLoyaltyActivity = require('../models/customerLoyalityActivitySchema.model');
const Reward = require('../models/reward.model');
const Coupon = require('../models/coupon.model');
const Merchant = require('../models/merchant.model');

/**
 * Get comprehensive analytics dashboard
 * GET /api/analytics/dashboard
 */
const getDashboardAnalytics = async (req, res) => {
    console.log("Get dashboard analytics request received");
    try {
        const merchant = req.merchant;

        // Date filter parameters
        const { startDate, endDate } = req.query;
        const dateFilter = {};

        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }

        // Customer Statistics
        const totalCustomers = await Customer.countDocuments({
            merchant: merchant._id,
            isDeleted: { $ne: true },
            ...dateFilter
        });

        const activeCustomers = await Customer.countDocuments({
            merchant: merchant._id,
            isDeleted: { $ne: true },
            points: { $gt: 0 }
        });

        // Points Statistics
        const pointsStats = await CustomerLoyaltyActivity.aggregate([
            {
                $match: {
                    merchantId: merchant._id,
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: null,
                    totalPointsIssued: {
                        $sum: {
                            $cond: [{ $gt: ["$points", 0] }, "$points", 0]
                        }
                    },
                    totalPointsRedeemed: {
                        $sum: {
                            $cond: [{ $lt: ["$points", 0] }, { $abs: "$points" }, 0]
                        }
                    },
                    totalActivities: { $sum: 1 }
                }
            }
        ]);

        const pointsData = pointsStats[0] || {
            totalPointsIssued: 0,
            totalPointsRedeemed: 0,
            totalActivities: 0
        };

        // Reward Performance
        const rewards = await Reward.find({ merchant: merchant._id });
        const rewardPerformance = await Promise.all(rewards.map(async (reward) => {
            const totalCoupons = await Coupon.countDocuments({
                reward: reward._id,
                merchant: merchant._id,
                ...dateFilter
            });

            const redeemedCoupons = await Coupon.countDocuments({
                reward: reward._id,
                merchant: merchant._id,
                used: true,
                ...dateFilter
            });

            return {
                rewardId: reward._id,
                rewardType: reward.rewardType,
                rewardValue: reward.rewardValue,
                pointsRequired: reward.pointsRequired,
                totalCoupons,
                redeemedCoupons,
                redemptionRate: totalCoupons > 0 ? ((redeemedCoupons / totalCoupons) * 100).toFixed(2) : 0
            };
        }));

        // Activity Breakdown
        const activityBreakdown = await CustomerLoyaltyActivity.aggregate([
            {
                $match: {
                    merchantId: merchant._id,
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: "$event",
                    count: { $sum: 1 },
                    totalPoints: { $sum: "$points" }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // Top Customers
        const topCustomers = await Customer.find({
            merchant: merchant._id,
            isDeleted: { $ne: true }
        })
            .sort({ points: -1 })
            .limit(10)
            .select('customerId name email phone points appliedRewards createdAt');

        // Recent Activities
        const recentActivities = await CustomerLoyaltyActivity.find({
            merchantId: merchant._id
        })
            .populate('customerId', 'name email customerId')
            .sort({ createdAt: -1 })
            .limit(20);

        res.status(200).json({
            success: true,
            message: 'Dashboard analytics retrieved successfully',
            data: {
                overview: {
                    totalCustomers,
                    activeCustomers,
                    participationRate: totalCustomers > 0 ? ((activeCustomers / totalCustomers) * 100).toFixed(2) : 0,
                    ...pointsData
                },
                rewardPerformance,
                activityBreakdown,
                topCustomers,
                recentActivities
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard analytics:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};

/**
 * Get customer participation analytics
 * GET /api/analytics/customer-participation
 */
const getCustomerParticipation = async (req, res) => {
    try {
        const merchant = req.merchant;
        const { period = '30d' } = req.query; // 7d, 30d, 90d, 1y

        // Calculate date range based on period
        const now = new Date();
        let startDate;

        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // Customer acquisition over time
        const customerAcquisition = await Customer.aggregate([
            {
                $match: {
                    merchant: merchant._id,
                    createdAt: { $gte: startDate },
                    isDeleted: { $ne: true }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    newCustomers: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Customer engagement levels
        const engagementLevels = await Customer.aggregate([
            {
                $match: {
                    merchant: merchant._id,
                    isDeleted: { $ne: true }
                }
            },
            {
                $addFields: {
                    engagementLevel: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$points", 0] }, then: "inactive" },
                                { case: { $and: [{ $gt: ["$points", 0] }, { $lt: ["$points", 100] }] }, then: "low" },
                                { case: { $and: [{ $gte: ["$points", 100] }, { $lt: ["$points", 500] }] }, then: "medium" },
                                { case: { $gte: ["$points", 500] }, then: "high" }
                            ],
                            default: "inactive"
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$engagementLevel",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Activity frequency
        const activityFrequency = await CustomerLoyaltyActivity.aggregate([
            {
                $match: {
                    merchantId: merchant._id,
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    totalActivities: { $sum: 1 },
                    uniqueCustomers: { $addToSet: "$customerId" }
                }
            },
            {
                $addFields: {
                    uniqueCustomerCount: { $size: "$uniqueCustomers" }
                }
            },
            {
                $project: {
                    uniqueCustomers: 0
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.status(200).json({
            success: true,
            message: 'Customer participation analytics retrieved successfully',
            data: {
                period,
                customerAcquisition,
                engagementLevels,
                activityFrequency
            }
        });
    } catch (error) {
        console.error('Error fetching customer participation analytics:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};

/**
 * Get points analytics
 * GET /api/analytics/points
 */
const getPointsAnalytics = async (req, res) => {
    try {
        const merchant = req.merchant;
        const { period = '30d' } = req.query;

        // Calculate date range
        const now = new Date();
        let startDate;

        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // Points flow over time
        const pointsFlow = await CustomerLoyaltyActivity.aggregate([
            {
                $match: {
                    merchantId: merchant._id,
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        date: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$createdAt"
                            }
                        }
                    },
                    pointsIssued: {
                        $sum: {
                            $cond: [{ $gt: ["$points", 0] }, "$points", 0]
                        }
                    },
                    pointsRedeemed: {
                        $sum: {
                            $cond: [{ $lt: ["$points", 0] }, { $abs: "$points" }, 0]
                        }
                    }
                }
            },
            {
                $sort: { "_id.date": 1 }
            }
        ]);

        // Points by event type
        const pointsByEvent = await CustomerLoyaltyActivity.aggregate([
            {
                $match: {
                    merchantId: merchant._id,
                    createdAt: { $gte: startDate },
                    points: { $gt: 0 }
                }
            },
            {
                $group: {
                    _id: "$event",
                    totalPoints: { $sum: "$points" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { totalPoints: -1 }
            }
        ]);

        // Current points distribution
        const pointsDistribution = await Customer.aggregate([
            {
                $match: {
                    merchant: merchant._id,
                    isDeleted: { $ne: true }
                }
            },
            {
                $addFields: {
                    pointsRange: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$points", 0] }, then: "0" },
                                { case: { $and: [{ $gt: ["$points", 0] }, { $lte: ["$points", 50] }] }, then: "1-50" },
                                { case: { $and: [{ $gt: ["$points", 50] }, { $lte: ["$points", 100] }] }, then: "51-100" },
                                { case: { $and: [{ $gt: ["$points", 100] }, { $lte: ["$points", 250] }] }, then: "101-250" },
                                { case: { $and: [{ $gt: ["$points", 250] }, { $lte: ["$points", 500] }] }, then: "251-500" },
                                { case: { $gt: ["$points", 500] }, then: "500+" }
                            ],
                            default: "0"
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$pointsRange",
                    count: { $sum: 1 },
                    totalPoints: { $sum: "$points" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.status(200).json({
            success: true,
            message: 'Points analytics retrieved successfully',
            data: {
                period,
                pointsFlow,
                pointsByEvent,
                pointsDistribution
            }
        });
    } catch (error) {
        console.error('Error fetching points analytics:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};

/**
 * Get reward performance analytics
 * GET /api/analytics/rewards
 */
const getRewardPerformance = async (req, res) => {
    try {
        const merchant = req.merchant;
        const { period = '30d' } = req.query;

        // Calculate date range
        const now = new Date();
        let startDate;

        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // Reward performance details
        const rewards = await Reward.find({ merchant: merchant._id });
        const rewardDetails = await Promise.all(rewards.map(async (reward) => {
            // Coupons generated over time
            const couponsOverTime = await Coupon.aggregate([
                {
                    $match: {
                        reward: reward._id,
                        merchant: merchant._id,
                        createdAt: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$createdAt"
                            }
                        },
                        generated: { $sum: 1 },
                        redeemed: {
                            $sum: {
                                $cond: ["$used", 1, 0]
                            }
                        }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]);

            // Total statistics
            const totalCoupons = await Coupon.countDocuments({
                reward: reward._id,
                merchant: merchant._id,
                createdAt: { $gte: startDate }
            });

            const redeemedCoupons = await Coupon.countDocuments({
                reward: reward._id,
                merchant: merchant._id,
                used: true,
                createdAt: { $gte: startDate }
            });

            const activeCoupons = await Coupon.countDocuments({
                reward: reward._id,
                merchant: merchant._id,
                used: false,
                expiresAt: { $gt: new Date() }
            });

            const expiredCoupons = await Coupon.countDocuments({
                reward: reward._id,
                merchant: merchant._id,
                used: false,
                expiresAt: { $lte: new Date() }
            });

            return {
                reward: {
                    _id: reward._id,
                    rewardType: reward.rewardType,
                    rewardValue: reward.rewardValue,
                    pointsRequired: reward.pointsRequired,
                    enabled: reward.enabled
                },
                statistics: {
                    totalCoupons,
                    redeemedCoupons,
                    activeCoupons,
                    expiredCoupons,
                    redemptionRate: totalCoupons > 0 ? ((redeemedCoupons / totalCoupons) * 100).toFixed(2) : 0
                },
                timeline: couponsOverTime
            };
        }));

        // Overall redemption trends
        const redemptionTrends = await Coupon.aggregate([
            {
                $match: {
                    merchant: merchant._id,
                    usedAt: { $gte: startDate, $ne: null }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$usedAt"
                        }
                    },
                    totalRedemptions: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.status(200).json({
            success: true,
            message: 'Reward performance analytics retrieved successfully',
            data: {
                period,
                rewardDetails,
                redemptionTrends
            }
        });
    } catch (error) {
        console.error('Error fetching reward performance analytics:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};

/**
 * Get customer growth analytics
 * GET /api/analytics/customer-growth
 */
const getCustomerGrowth = async (req, res) => {
    try {
        const merchant = req.merchant;
        const { period = '1year' } = req.query;

        // Calculate date range
        const now = new Date();
        let startDate;

        switch (period) {
            case '1month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '3months':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '6months':
                startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
                break;
            case '1year':
            default:
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        }

        const customerGrowth = await Customer.aggregate([
            {
                $match: {
                    merchant: merchant._id,
                    createdAt: { $gte: startDate },
                    isDeleted: { $ne: true }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    count: { $sum: 1 },
                    customers: {
                        $push: {
                            name: {
                                $ifNull: [
                                    "$name",
                                    {
                                        $ifNull: ["$metadata.full_name", "N/A"]
                                    }
                                ]
                            },
                            email: "$email",
                            customerId: "$customerId",
                            points: "$points",
                            createdAt: "$createdAt"
                        }
                    }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
            }
        ]);

        // Debug: Check a sample of raw customer data
        // const sampleCustomer = await Customer.findOne({ 
        //     merchant: merchant._id, 
        //     isDeleted: { $ne: true } 
        // }).select('name email customerId points createdAt metadata');
        // console.log("Sample customer from database:", JSON.stringify(sampleCustomer, null, 2));

        // Log customer data for debugging - safely handle empty results
        // if (customerGrowth.length > 0 && customerGrowth[0].customers) {
        //     console.log("Customer growth data sample:", JSON.stringify(customerGrowth[0].customers.slice(0, 2), null, 2));
        //     console.log("Total customers found:", customerGrowth.reduce((sum, day) => sum + day.count, 0));
        // } else {
        //     console.log("No customer growth data found for the specified period");
        // }

        res.status(200).json({
            success: true,
            data: customerGrowth
        });
    } catch (error) {
        console.error('Error fetching customer growth:', error.message);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

/**
 * Get engagement levels
 * GET /api/analytics/engagement
 */
const getEngagementLevels = async (req, res) => {
    try {
        const merchant = req.merchant;

        const engagementData = await Customer.aggregate([
            {
                $match: {
                    merchant: merchant._id,
                    isDeleted: { $ne: true }
                }
            },
            {
                $project: {
                    tier: 1,
                    points: 1,
                    totalOrders: 1,
                    engagementLevel: {
                        $cond: {
                            if: { $gte: ["$points", 1000] },
                            then: "high",
                            else: {
                                $cond: {
                                    if: { $gte: ["$points", 500] },
                                    then: "medium",
                                    else: "low"
                                }
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$engagementLevel",
                    count: { $sum: 1 },
                    avgPoints: { $avg: "$points" },
                    avgOrders: { $avg: "$totalOrders" }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: engagementData
        });
    } catch (error) {
        console.error('Error fetching engagement levels:', error.message);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

/**
 * Get points flow analytics
 * GET /api/analytics/points-flow
 */
const getPointsFlow = async (req, res) => {
    try {
        const merchant = req.merchant;
        const { period = '30days' } = req.query;

        const pointsFlow = await CustomerLoyaltyActivity.aggregate([
            {
                $match: {
                    merchantId: merchant._id,
                    timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: {
                        type: { $cond: [{ $gt: ["$points", 0] }, "earned", "redeemed"] },
                        date: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$timestamp"
                            }
                        }
                    },
                    totalPoints: { $sum: { $abs: "$points" } },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.date": 1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: pointsFlow
        });
    } catch (error) {
        console.error('Error fetching points flow:', error.message);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

/**
 * Get redemption trends
 * GET /api/analytics/redemption-trends
 */
const getRedemptionTrends = async (req, res) => {
    try {
        const merchant = req.merchant;

        const redemptionTrends = await Coupon.aggregate([
            {
                $match: {
                    merchant: merchant._id,
                    isUsed: true
                }
            },
            {
                $group: {
                    _id: {
                        date: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$usedAt"
                            }
                        }
                    },
                    count: { $sum: 1 },
                    totalDiscount: { $sum: "$discount" }
                }
            },
            {
                $sort: { "_id.date": 1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: redemptionTrends
        });
    } catch (error) {
        console.error('Error fetching redemption trends:', error.message);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

/**
 * Get top performing rewards
 * GET /api/analytics/top-rewards
 */
const getTopPerformingRewards = async (req, res) => {
    try {
        const merchant = req.merchant;
        const { limit = 10 } = req.query;

        const topRewards = await Coupon.aggregate([
            {
                $match: {
                    merchant: merchant._id,
                    isUsed: true
                }
            },
            {
                $group: {
                    _id: "$reward",
                    redemptions: { $sum: 1 },
                    totalDiscount: { $sum: "$discount" }
                }
            },
            {
                $lookup: {
                    from: "rewards",
                    localField: "_id",
                    foreignField: "_id",
                    as: "rewardDetails"
                }
            },
            {
                $unwind: "$rewardDetails"
            },
            {
                $project: {
                    name: "$rewardDetails.name",
                    nameEn: "$rewardDetails.nameEn",
                    rewardType: "$rewardDetails.rewardType",
                    rewardValue: "$rewardDetails.rewardValue",
                    redemptions: 1,
                    totalDiscount: 1
                }
            },
            {
                $sort: { redemptions: -1 }
            },
            {
                $limit: parseInt(limit)
            }
        ]);

        res.status(200).json({
            success: true,
            data: topRewards
        });
    } catch (error) {
        console.error('Error fetching top rewards:', error.message);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

/**
 * Get customer segmentation
 * GET /api/analytics/customer-segmentation
 */
const getCustomerSegmentation = async (req, res) => {
    try {
        const merchant = req.merchant;

        const segmentation = await Customer.aggregate([
            {
                $match: {
                    merchant: merchant._id,
                    isDeleted: { $ne: true }
                }
            },
            {
                $group: {
                    _id: "$tier",
                    count: { $sum: 1 },
                    avgPoints: { $avg: "$points" },
                    avgSpent: { $avg: "$totalSpent" },
                    avgOrders: { $avg: "$totalOrders" }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: segmentation
        });
    } catch (error) {
        console.error('Error fetching customer segmentation:', error.message);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

/**
 * Get real-time stats
 * GET /api/analytics/realtime
 */
const getRealTimeStats = async (req, res) => {
    try {
        const merchant = req.merchant;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const realTimeStats = {
            todayCustomers: await Customer.countDocuments({
                merchant: merchant._id,
                createdAt: { $gte: today },
                isDeleted: { $ne: true }
            }),
            todayActivities: await CustomerLoyaltyActivity.countDocuments({
                merchantId: merchant._id,
                timestamp: { $gte: today }
            }),
            todayRedemptions: await Coupon.countDocuments({
                merchant: merchant._id,
                usedAt: { $gte: today }
            }),
            activeCustomers: await Customer.countDocuments({
                merchant: merchant._id,
                points: { $gt: 0 },
                isDeleted: { $ne: true }
            })
        };

        res.status(200).json({
            success: true,
            data: realTimeStats
        });
    } catch (error) {
        console.error('Error fetching real-time stats:', error.message);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

/**
 * Export analytics report
 * GET /api/analytics/export
 */
const exportAnalyticsReport = async (req, res) => {
    try {
        const merchant = req.merchant;
        const { reportType = 'dashboard', period = '30days', format = 'csv' } = req.query;

        let reportData = {};

        switch (reportType) {
            case 'dashboard':
                reportData = await getDashboardData(merchant, period);
                break;
            case 'customers':
                reportData = await getCustomerReport(merchant, period);
                break;
            case 'rewards':
                reportData = await getRewardReport(merchant, period);
                break;
            case 'points':
                reportData = await getPointsReport(merchant, period);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid report type'
                });
        }

        if (format === 'csv') {
            const csvContent = generateCSV(reportData, reportType);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report-${new Date().toISOString().split('T')[0]}.csv"`);
            return res.send(csvContent);
        }

        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report-${new Date().toISOString().split('T')[0]}.json"`);
            return res.json({
                reportType,
                period,
                exportDate: new Date().toISOString(),
                data: reportData
            });
        }

        return res.status(400).json({
            success: false,
            message: 'Unsupported export format. Use csv or json.'
        });

    } catch (error) {
        console.error('Error exporting analytics report:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }
};

// Helper functions for export
const getDashboardData = async (merchant, period) => {
    const customers = await Customer.find({
        merchant: merchant._id,
        isDeleted: { $ne: true }
    }).select('name email points tier totalOrders totalSpent createdAt');

    const activities = await CustomerLoyaltyActivity.find({
        merchantId: merchant._id
    }).populate('customerId', 'name email').sort({ timestamp: -1 }).limit(100);

    return { customers, activities };
};

const getCustomerReport = async (merchant, period) => {
    return await Customer.find({
        merchant: merchant._id,
        isDeleted: { $ne: true }
    }).select('customerId name email phone points tier totalOrders totalSpent createdAt');
};

const getRewardReport = async (merchant, period) => {
    const rewards = await Reward.find({ merchant: merchant._id });
    const coupons = await Coupon.find({ merchant: merchant._id })
        .populate('reward', 'name rewardType rewardValue')
        .populate('customer', 'name email');

    return { rewards, coupons };
};

const getPointsReport = async (merchant, period) => {
    return await CustomerLoyaltyActivity.find({
        merchantId: merchant._id
    }).populate('customerId', 'name email').sort({ timestamp: -1 });
};

const generateCSV = (data, reportType) => {
    switch (reportType) {
        case 'customers':
            const headers = ['Customer ID', 'Name', 'Email', 'Phone', 'Points', 'Tier', 'Total Orders', 'Total Spent', 'Join Date'];
            const rows = data.map(customer => [
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
            return [headers.join(','), ...rows.map(row => row.map(field => `"${field}"`).join(','))].join('\n');

        case 'rewards':
            const rewardHeaders = ['Reward Name', 'Type', 'Value', 'Points Required', 'Usage Count', 'Created Date'];
            const rewardRows = data.rewards.map(reward => [
                reward.name || reward.description || '',
                reward.rewardType || '',
                reward.rewardValue || 0,
                reward.pointsRequired || 0,
                reward.currentUsage || 0,
                reward.createdAt ? new Date(reward.createdAt).toLocaleDateString() : ''
            ]);
            return [rewardHeaders.join(','), ...rewardRows.map(row => row.map(field => `"${field}"`).join(','))].join('\n');

        case 'points':
            const pointHeaders = ['Customer', 'Event', 'Points', 'Date'];
            const pointRows = data.map(activity => [
                activity.customerId?.name || 'Unknown',
                activity.event || '',
                activity.points || 0,
                activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : ''
            ]);
            return [pointHeaders.join(','), ...pointRows.map(row => row.map(field => `"${field}"`).join(','))].join('\n');

        default:
            return 'No data available';
    }
};

module.exports = {
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
}; 