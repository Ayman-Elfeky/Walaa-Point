const { getSubscriptionLimits } = require('../middlewares/subscription');
const Customer = require('../models/customer.model');
const Reward = require('../models/reward.model');
const Coupon = require('../models/coupon.model');

/**
 * Get subscription information and usage statistics
 * GET /api/subscription/info
 */
const getSubscriptionInfo = async (req, res) => {
    try {
        const merchant = req.merchant;
        const subscription = merchant.merchantSubscription;

        if (!subscription) {
            return res.status(200).json({
                success: true,
                message: 'No subscription found',
                subscription: null,
                isSubscribed: false,
                plan: 'free',
                features: ['basic_loyalty', 'customer_management_basic', 'points_tracking'],
                limits: getSubscriptionLimits('free')
            });
        }

        // Get current plan details
        const currentPlan = subscription.plan?.name?.toLowerCase() || 'free';
        const limits = getSubscriptionLimits(currentPlan);

        // Get current usage statistics
        const currentUsage = await getCurrentUsage(merchant._id);

        // Define feature access
        const planFeatures = {
            'free': ['basic_loyalty', 'customer_management_basic', 'points_tracking'],
            'basic': ['basic_loyalty', 'customer_management_basic', 'points_tracking', 'rewards_basic', 'email_notifications'],
            'premium': ['basic_loyalty', 'customer_management_basic', 'customer_management_advanced', 'points_tracking', 'rewards_basic', 'rewards_advanced', 'email_notifications', 'sms_notifications', 'analytics_basic', 'analytics_advanced', 'custom_branding', 'api_access']
        };

        const features = planFeatures[currentPlan] || planFeatures['free'];

        res.status(200).json({
            success: true,
            message: 'Subscription information retrieved successfully',
            subscription: {
                plan: currentPlan,
                isActive: subscription.active || false,
                createdAt: subscription.created_at,
                expiresAt: subscription.expires_at,
                isTrialing: subscription.is_trialing || false,
                trialEndsAt: subscription.trial_ends_at
            },
            isSubscribed: subscription.active || false,
            features,
            limits,
            currentUsage,
            usagePercentages: calculateUsagePercentages(currentUsage, limits)
        });
    } catch (error) {
        console.error('Error fetching subscription info:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};

/**
 * Get available subscription plans and features
 * GET /api/subscription/plans
 */
const getAvailablePlans = async (req, res) => {
    try {
        const plans = [
            {
                name: 'free',
                displayName: 'Free Plan',
                price: 0,
                currency: 'SAR',
                billingCycle: 'monthly',
                features: [
                    'Basic loyalty program',
                    'Up to 100 customers',
                    '1 reward type',
                    'Basic points tracking',
                    '50 coupons per month'
                ],
                limits: getSubscriptionLimits('free'),
                popular: false
            },
            {
                name: 'basic',
                displayName: 'Basic Plan',
                price: 49,
                currency: 'SAR',
                billingCycle: 'monthly',
                features: [
                    'All Free features',
                    'Up to 1,000 customers',
                    '5 reward types',
                    'Email notifications',
                    '500 coupons per month',
                    'Basic analytics (90 days)'
                ],
                limits: getSubscriptionLimits('basic'),
                popular: true
            },
            {
                name: 'premium',
                displayName: 'Premium Plan',
                price: 149,
                currency: 'SAR',
                billingCycle: 'monthly',
                features: [
                    'All Basic features',
                    'Unlimited customers',
                    'Unlimited rewards',
                    'SMS notifications',
                    'Unlimited coupons',
                    'Advanced analytics (1 year)',
                    'Custom branding',
                    'API access',
                    'Priority support'
                ],
                limits: getSubscriptionLimits('premium'),
                popular: false
            }
        ];

        res.status(200).json({
            success: true,
            message: 'Available plans retrieved successfully',
            plans
        });
    } catch (error) {
        console.error('Error fetching available plans:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};

/**
 * Check feature availability
 * POST /api/subscription/check-feature
 */
const checkFeatureAccess = async (req, res) => {
    try {
        const merchant = req.merchant;
        const { feature } = req.body;

        if (!feature) {
            return res.status(400).json({
                success: false,
                message: 'Feature name is required'
            });
        }

        const subscription = merchant.merchantSubscription;
        const currentPlan = subscription?.plan?.name?.toLowerCase() || 'free';

        const planFeatures = {
            'free': ['basic_loyalty', 'customer_management_basic', 'points_tracking'],
            'basic': ['basic_loyalty', 'customer_management_basic', 'points_tracking', 'rewards_basic', 'email_notifications'],
            'premium': ['basic_loyalty', 'customer_management_basic', 'customer_management_advanced', 'points_tracking', 'rewards_basic', 'rewards_advanced', 'email_notifications', 'sms_notifications', 'analytics_basic', 'analytics_advanced', 'custom_branding', 'api_access']
        };

        const allowedFeatures = planFeatures[currentPlan] || planFeatures['free'];
        const hasAccess = allowedFeatures.includes(feature);

        res.status(200).json({
            success: true,
            message: 'Feature access checked successfully',
            feature,
            hasAccess,
            currentPlan,
            requiredPlans: Object.keys(planFeatures).filter(plan => planFeatures[plan].includes(feature))
        });
    } catch (error) {
        console.error('Error checking feature access:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};

/**
 * Get usage statistics for current merchant
 */
const getCurrentUsage = async (merchantId) => {
    try {
        // Get current month start
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [customerCount, rewardCount, monthlyCouponCount] = await Promise.all([
            Customer.countDocuments({
                merchant: merchantId,
                isDeleted: { $ne: true }
            }),
            Reward.countDocuments({
                merchant: merchantId
            }),
            Coupon.countDocuments({
                merchant: merchantId,
                createdAt: { $gte: startOfMonth }
            })
        ]);

        return {
            customers: customerCount,
            rewards: rewardCount,
            monthlyCoupons: monthlyCouponCount
        };
    } catch (error) {
        console.error('Error getting current usage:', error);
        return {
            customers: 0,
            rewards: 0,
            monthlyCoupons: 0
        };
    }
};

/**
 * Calculate usage percentages
 */
const calculateUsagePercentages = (usage, limits) => {
    const percentages = {};

    Object.keys(usage).forEach(key => {
        const limitKey = key === 'customers' ? 'maxCustomers' : 
                        key === 'rewards' ? 'maxRewards' : 
                        key === 'monthlyCoupons' ? 'maxCouponsPerMonth' : null;

        if (limitKey && limits[limitKey] !== undefined) {
            if (limits[limitKey] === -1) {
                percentages[key] = 0; // Unlimited
            } else {
                percentages[key] = limits[limitKey] > 0 ? 
                    Math.round((usage[key] / limits[limitKey]) * 100) : 0;
            }
        }
    });

    return percentages;
};

module.exports = {
    getSubscriptionInfo,
    getAvailablePlans,
    checkFeatureAccess
}; 