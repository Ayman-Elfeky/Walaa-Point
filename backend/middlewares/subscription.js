const fetch = require('node-fetch');

/**
 * Middleware to check subscription status and feature access
 * Usage: requireSubscription(['feature1', 'feature2'])
 */
const requireSubscription = (requiredFeatures = []) => {
    return async (req, res, next) => {
        try {
            const merchant = req.merchant;

            if (!merchant) {
                return res.status(401).json({
                    success: false,
                    message: 'Merchant authentication required'
                });
            }

            // Get subscription details from merchant
            const subscription = merchant.merchantSubscription;

            if (!subscription) {
                return res.status(403).json({
                    success: false,
                    message: 'No subscription found. Please subscribe to a plan to access this feature.',
                    requiresSubscription: true
                });
            }

            // Check if subscription is active
            if (!subscription.active) {
                return res.status(403).json({
                    success: false,
                    message: 'Subscription is not active. Please renew your subscription.',
                    subscriptionStatus: 'inactive'
                });
            }

            // Define feature access based on subscription plans
            const planFeatures = {
                'free': [
                    'basic_loyalty',
                    'customer_management_basic',
                    'points_tracking'
                ],
                'basic': [
                    'basic_loyalty',
                    'customer_management_basic',
                    'points_tracking',
                    'rewards_basic',
                    'email_notifications'
                ],
                'premium': [
                    'basic_loyalty',
                    'customer_management_basic',
                    'customer_management_advanced',
                    'points_tracking',
                    'rewards_basic',
                    'rewards_advanced',
                    'email_notifications',
                    'sms_notifications',
                    'analytics_basic',
                    'analytics_advanced',
                    'custom_branding',
                    'api_access'
                ]
            };

            // Get current plan name (normalize to lowercase)
            const currentPlan = subscription.plan?.name?.toLowerCase() || 'free';
            const allowedFeatures = planFeatures[currentPlan] || planFeatures['free'];

            // Check if required features are available in current plan
            const missingFeatures = requiredFeatures.filter(feature => !allowedFeatures.includes(feature));

            if (missingFeatures.length > 0) {
                return res.status(403).json({
                    success: false,
                    message: `This feature requires a higher subscription plan. Missing features: ${missingFeatures.join(', ')}`,
                    currentPlan,
                    missingFeatures,
                    upgradeRequired: true
                });
            }

            // Add subscription info to request for use in controllers
            req.subscription = {
                plan: currentPlan,
                features: allowedFeatures,
                isActive: subscription.active,
                expiresAt: subscription.expires_at
            };

            next();
        } catch (error) {
            console.error('Error checking subscription:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking subscription status'
            });
        }
    };
};

/**
 * Middleware to refresh subscription data from Salla
 */
const refreshSubscriptionData = async (req, res, next) => {
    try {
        const merchant = req.merchant;

        if (!merchant || !merchant.accessToken) {
            return next(); // Skip if no merchant or token
        }

        // Fetch latest subscription data from Salla API
        const response = await fetch(`${process.env.SALLA_API_BASE_URL}/oauth2/user/info`, {
            headers: {
                'Authorization': `Bearer ${merchant.accessToken}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            // Update merchant subscription data if it has changed
            if (data.data?.merchant?.subscription) {
                const newSubscription = data.data.merchant.subscription;
                
                // Only update if subscription data has changed
                if (JSON.stringify(merchant.merchantSubscription) !== JSON.stringify(newSubscription)) {
                    merchant.merchantSubscription = newSubscription;
                    await merchant.save();
                    console.log('Subscription data refreshed for merchant:', merchant.merchantName);
                }
            }
        } else {
            console.warn('Failed to refresh subscription data:', response.status);
        }

        next();
    } catch (error) {
        console.error('Error refreshing subscription data:', error);
        // Don't block the request, just log the error
        next();
    }
};

/**
 * Utility function to get subscription limits
 */
const getSubscriptionLimits = (plan) => {
    const limits = {
        'free': {
            maxCustomers: 100,
            maxRewards: 1,
            maxCouponsPerMonth: 50,
            analyticsRetentionDays: 30
        },
        'basic': {
            maxCustomers: 1000,
            maxRewards: 5,
            maxCouponsPerMonth: 500,
            analyticsRetentionDays: 90
        },
        'premium': {
            maxCustomers: -1, // unlimited
            maxRewards: -1, // unlimited
            maxCouponsPerMonth: -1, // unlimited
            analyticsRetentionDays: 365
        }
    };

    return limits[plan] || limits['free'];
};

/**
 * Middleware to check usage limits
 */
const checkUsageLimits = (limitType) => {
    return async (req, res, next) => {
        try {
            const merchant = req.merchant;
            const subscription = req.subscription || { plan: 'free' };
            const limits = getSubscriptionLimits(subscription.plan);

            let currentUsage = 0;
            let limit = 0;

            switch (limitType) {
                case 'customers':
                    currentUsage = await require('../models/customer.model').countDocuments({
                        merchant: merchant._id,
                        isDeleted: { $ne: true }
                    });
                    limit = limits.maxCustomers;
                    break;

                case 'rewards':
                    currentUsage = await require('../models/reward.model').countDocuments({
                        merchant: merchant._id
                    });
                    limit = limits.maxRewards;
                    break;

                case 'coupons':
                    const startOfMonth = new Date();
                    startOfMonth.setDate(1);
                    startOfMonth.setHours(0, 0, 0, 0);
                    
                    currentUsage = await require('../models/coupon.model').countDocuments({
                        merchant: merchant._id,
                        createdAt: { $gte: startOfMonth }
                    });
                    limit = limits.maxCouponsPerMonth;
                    break;

                default:
                    return next();
            }

            // Check if limit is exceeded (unlimited if limit is -1)
            if (limit !== -1 && currentUsage >= limit) {
                return res.status(429).json({
                    success: false,
                    message: `${limitType} limit exceeded for your subscription plan`,
                    currentUsage,
                    limit,
                    plan: subscription.plan,
                    upgradeRequired: true
                });
            }

            req.usageInfo = {
                currentUsage,
                limit,
                limitType
            };

            next();
        } catch (error) {
            console.error('Error checking usage limits:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking usage limits'
            });
        }
    };
};

module.exports = {
    requireSubscription,
    refreshSubscriptionData,
    checkUsageLimits,
    getSubscriptionLimits
}; 