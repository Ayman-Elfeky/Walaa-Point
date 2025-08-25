const generateToken = require('../services/generateToken');
const Merchant = require('../models/merchant.model');
const bcrypt = require('bcryptjs');
const { randomPasswordTemplate } = require('../utils/templates/randomPass.template');
const { sendEmail } = require('../utils/sendEmail');
const { generateSecurePassword } = require('../config/crypto');
const refreshToken = require('../services/refreshAccessToken');
const getCustomers = require('../services/getCustomers');
// const getLoyaltyPoints = require('../services/getLoyalityPoints');
const getOrders = require('../services/getOrders');
const Reward = require('../models/reward.model');

const loginMerchant = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Use findOne instead of find to get a single merchant
        const merchant = await Merchant.findOne({ installerEmail: email });

        // Check if merchant exists
        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: 'Merchant not found'
            });
        }

        console.log("Login password: ", password)
        // Check if password matches
        if (await bcrypt.compare(password, merchant.password)) {            // Generate JWT token
            const token = generateToken(merchant);

            // Set JWT in HTTP-only cookie
            res.cookie('jwt', token, {
                httpOnly: true, // Prevents JavaScript access and mitigates XSS attacks
                secure: process.env.NODE_ENV === 'production', // cookies will only be sent over HTTPS in production
                sameSite: 'strict', // Protection against CSRF
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
                path: '/' // Cookie is valid for all paths
            });

            res.status(200).json({ 
                success: true,
                merchant: {
                    name: merchant.merchantName,
                    email: merchant.installerEmail,
                    phone: merchant.installerMobile,
                    avatar: merchant.merchantAvatar,
                    storeName: merchant.merchantDomain,
                    storeLocation: merchant.storeLocation
                },
                message: 'Merchant Login Successfully'
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
    } catch (err) {
        console.log('Error From merchant Controller: ', err.message);
        res.status(500).json({
            success: false,
            message: 'Something Went Wrong'
        });
    }
}

const logoutMerchant = async (req, res) => {
    try {
        // Clear the JWT cookie
        res.clearCookie('jwt', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/'
        });

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Error during logout:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong during logout'
        });
    }
};

const getLoyaltySettings = async (req, res) => {
    try {
        const merchant = req.merchant; // Get the merchant from the request object
        if (!merchant) {
            return res.status(404).json({ message: 'Merchant not found' });
        }

        // Assuming loyalty settings are stored in the merchant document
        const loyaltySettings = merchant.loyaltySettings || {};

        res.status(200).json({
            success: true,
            loyaltySettings
        });
    } catch (error) {
        console.error('Error fetching loyalty settings:', error.message);
        res.status(500).json({ message: 'Something went wrong' });
    }
}

// from frontend check if there is specific option or not
// if not then this just enable the setting 
// if there specific then there is change in an reward system
// from the frontend if the client click in the specific software save then this will specific object
const updateRewardSettings = async (req, res) => {
    const merchant = req.merchant;
    const settings = req.body;

    const reward = await Reward.findOne({ merchant: merchant._id, rewardType: settings.rewardType });

    try {
        if (!settings.specific) {
            if (reward.enabled) {
                console.log("\nReward already enabled, specific is required\n")
                return res.status(400).json({ success: false, message: "Reward already enabled, specific settings is required" });
            } else {
                console.log("\nEnabling reward\n");
                reward.enabled = settings.enabled;
                await reward.save()
                return res.status(200).json({ success: true, message: "Reward enabled successfully" });
            }
        } else {
            console.log("\nReward specific is changing: ", reward, '\n');
            reward = {
                ...reward,
                ...settings.specific
            }
            console.log("\nReward After save:", reward, '\n');
            await reward.save();
            return res.status(200).json({ success: true, message: "Reward updated successfully" });
        }
    } catch (err) {
        console.error("\nThere is an error in update reward settings: ", err.message, '\n');
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
}

const getRewardSettings = async (req, res) => {
    const merchant = req.merchant;
    const reward = await Reward.findOne({ merchant: merchant._id, enabled: true });

    if (!reward) {
        console.log("\nNo reward Found\n");
        return res.status(404).json({ success: false, message: `No reward has found for merchant` });
    }

    return res.status(200).json({ success: true, message: "Reward fetched successfully", data: reward });
}

const updateLoyaltySettings = async (req, res) => {
    const merchantId = req.merchant._id;
    const updates = req.body;

    try {
        // Build dot-notation object for deep merge
        const updateFields = {};
        for (const [key, value] of Object.entries(updates)) {
            updateFields[`loyaltySettings.${key}`] = value;
        }

        const merchant = await Merchant.findByIdAndUpdate(
            merchantId,
            { $set: updateFields },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Loyalty settings updated successfully',
            loyaltySettings: merchant.loyaltySettings
        });
    } catch (error) {
        console.error('Error updating loyalty settings:', error.message);
        res.status(500).json({ message: 'Something went wrong' });
    }
};

// Update merchant profile (store information)
const updateMerchantProfile = async (req, res) => {
    try {
        const merchantId = req.merchant._id;
        const updates = req.body;

        // Validate and sanitize updates
        const allowedFields = ['merchantName', 'installerEmail', 'installerMobile', 'merchantDomain'];
        const updateFields = {};
        
        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key) && value !== undefined && value !== null) {
                updateFields[key] = value;
            }
        }

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        const merchant = await Merchant.findByIdAndUpdate(
            merchantId,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: 'Merchant not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            merchant: {
                name: merchant.merchantName,
                email: merchant.installerEmail,
                phone: merchant.installerMobile,
                website: merchant.merchantDomain
            }
        });
    } catch (error) {
        console.error('Error updating merchant profile:', error.message);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationErrors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }
};

// Update appearance settings (stored in merchant preferences)
const updateAppearanceSettings = async (req, res) => {
    try {
        console.log('\nUpdating appearance settings:', req.body);
        const merchantId = req.merchant._id;
        const updates = req.body;

        // For now, we'll store appearance settings in merchant document
        // In future, this could be moved to a separate preferences collection
        const updateFields = {};
        
        if (updates.currency) updateFields['preferences.currency'] = updates.currency;
        if (updates.dateFormat) updateFields['preferences.dateFormat'] = updates.dateFormat;
        if (updates.language) updateFields['preferences.language'] = updates.language;

        const merchant = await Merchant.findByIdAndUpdate(
            merchantId,
            { $set: updateFields },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Appearance settings updated successfully',
            preferences: merchant.preferences || {}
        });
    } catch (error) {
        console.error('Error updating appearance settings:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }
};

// Update security settings
const updateSecuritySettings = async (req, res) => {
    try {
        const merchantId = req.merchant._id;
        const { currentPassword, newPassword, confirmPassword, twoFactorEnabled, loginNotifications } = req.body;

        const merchant = await Merchant.findById(merchantId);
        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: 'Merchant not found'
            });
        }

        // If updating password
        if (currentPassword && newPassword) {
            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, merchant.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Validate new password
            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'New passwords do not match'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 6 characters long'
                });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            merchant.password = hashedPassword;
        }

        // Update security preferences
        const updateFields = {};
        if (typeof twoFactorEnabled === 'boolean') {
            updateFields['securitySettings.twoFactorEnabled'] = twoFactorEnabled;
        }
        if (typeof loginNotifications === 'boolean') {
            updateFields['securitySettings.loginNotifications'] = loginNotifications;
        }

        // Apply updates
        if (Object.keys(updateFields).length > 0) {
            await Merchant.findByIdAndUpdate(merchantId, { $set: updateFields });
        }
        
        await merchant.save();

        res.status(200).json({
            success: true,
            message: 'Security settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating security settings:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }
};

// i will make this to get the dashboard of the merchant
// but i need to get the access token and refresh token from the merchant model
// but this will make me fetch the merchant profile again from the database
// so i will use redis to cache the merchant profile

const getMerchantDashboard = async (req, res) => {
    try {
        const merchant = req.merchant;

        if (!merchant) {
            return res.status(404).json({ message: 'Merchant not found' })
        }

        // Get basic dashboard metrics from our local database
        const Customer = require('../models/customer.model');
        const Transaction = require('../models/transaction.model');
        const Reward = require('../models/reward.model');

        const [
            totalCustomers,
            activeCustomers,
            totalTransactions,
            totalRewards
        ] = await Promise.all([
            Customer.countDocuments({ merchant: merchant._id }),
            Customer.countDocuments({ merchant: merchant._id }), // For now, treat all as active
            Transaction.countDocuments({ merchant: merchant._id }),
            Reward.countDocuments({ merchant: merchant._id })
        ]);

        // Get total points from transactions
        const pointsData = await Transaction.aggregate([
            { $match: { merchant: merchant._id } },
            { $group: { _id: null, totalPoints: { $sum: "$points" } } }
        ]);

        const totalPoints = pointsData.length > 0 ? pointsData[0].totalPoints : 0;

        res.status(200).json({
            success: true,
            message: 'Dashboard data fetched successfully',
            totalCustomers,
            activeCustomers,
            totalTransactions,
            totalRewards,
            totalPoints,
            customersDataLength: totalCustomers,
            transactionsDataLength: totalTransactions
        });

    } catch (error) {
        console.error('Error fetching merchant dashboard:', error.message);
        res.status(500).json({ message: 'Something went wrong' });
    }
}

// const updateMerchantProfile = async (req, res) => {
//     const { name, email, phone } = req.body;
//     try {
//         const merchant = req.merchant;

//         if(!merchant) {
//             return res.status(404).json({message: 'Merchant not found'});
//         }

//         // Update the merchant profile
//         merchant.name = name || merchant.name;
//         merchant.email = email || merchant.email;
//         merchant.phone = phone || merchant.phone;

//         await merchant.save();

//         res.status(200).json({
//             success: true,
//             message: 'Merchant Profile Updated Successfully',
//             profile: {
//                 name: merchant.name,
//                 email: merchant.email,
//                 phone: merchant.phone
//             }
//         });
//     } catch (error) {
//         console.error('Error updating merchant profile:', error.message);
//         res.status(500).json({ message: 'Something went wrong' });
//     }
// }

const sendMail = async (req, res) => {
    const { email } = req.body;
    try {
        const password = generateSecurePassword();
        const template = randomPasswordTemplate(email, password);
        await sendEmail(email, 'سجل الدخول إلى حسابك', template);
        console.log("Email is sended successfully");
        res.status(200).json({
            success: true,
            message: 'Email send succesfully'
        })
    } catch (error) {
        console.error("Error from merchant controller at sendMail: ", error.message);
        res.status(500).json({
            success: false,
            message: 'Something Went Wrong',
        })
    }
}

const getIdentityAndDesignSettings = async (req, res) => {
    try {
        console.log('\nFetching identity and design settings\n');

        const merchant = req.merchant;
        if (!merchant) {
            console.log('\nMerchant not found\n');
            return res.status(404).json({ success: false, message: 'Merchant not found' });
        }

        const identityAndDesign = merchant.identityAndDesign || {};

        console.log('\nIdentity and design settings fetched successfully\n');

        res.status(200).json({
            success: true,
            message: 'Identity and design settings fetched successfully',
            identityAndDesign
        });
    } catch (error) {
        console.error('\nError fetching identity and design settings:', error, '\n');
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

const updateIdentityAndDesignSettings = async (req, res) => {
    try {
        console.log('\nUpdating identity and design settings\n');
        console.log('\nRequest body:', JSON.stringify(req.body, null, 2), '\n');

        const merchantId = req.merchant._id;
        const updates = req.body;

        // Validate color format for hex colors if provided
        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

        if (updates.globalIdentity?.primaryColor && !hexColorRegex.test(updates.globalIdentity.primaryColor)) {
            console.log('\nInvalid primary color format\n');
            return res.status(400).json({ success: false, message: 'Invalid primary color format. Use hex format (e.g., #596581)' });
        }

        if (updates.globalIdentity?.secondaryColor && !hexColorRegex.test(updates.globalIdentity.secondaryColor)) {
            console.log('\nInvalid secondary color format\n');
            return res.status(400).json({ success: false, message: 'Invalid secondary color format. Use hex format (e.g., #ffffff)' });
        }

        // Build dot-notation object for deep merge
        const updateFields = {};
        for (const [key, value] of Object.entries(updates)) {
            if (typeof value === 'object' && value !== null) {
                // Handle nested objects like globalIdentity, windowProgram, windowOpenButton
                for (const [nestedKey, nestedValue] of Object.entries(value)) {
                    updateFields[`identityAndDesign.${key}.${nestedKey}`] = nestedValue;
                }
            } else {
                updateFields[`identityAndDesign.${key}`] = value;
            }
        }

        console.log('\nUpdate fields:', JSON.stringify(updateFields, null, 2), '\n');

        const merchant = await Merchant.findByIdAndUpdate(
            merchantId,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!merchant) {
            console.log('\nMerchant not found during update\n');
            return res.status(404).json({ success: false, message: 'Merchant not found' });
        }

        console.log('\nIdentity and design settings updated successfully\n');

        res.status(200).json({
            success: true,
            message: 'Identity and design settings updated successfully',
            identityAndDesign: merchant.identityAndDesign
        });
    } catch (error) {
        console.error('\nError updating identity and design settings:', error, '\n');

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationErrors
            });
        }

        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

/**
 * Verify authentication - simple endpoint for auth checks
 * GET /api/merchant/verify-auth
 */
const verifyAuth = async (req, res) => {
    try {
        const merchant = req.merchant; // From protect middleware
        
        res.status(200).json({
            success: true,
            message: 'Authentication verified',
            merchant: {
                _id: merchant._id,
                name: merchant.name,
                email: merchant.email,
                storeName: merchant.storeName
            }
        });
    } catch (error) {
        console.error('Auth verification error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Authentication verification failed'
        });
    }
};

/**
 * Get current subscription (mock implementation)
 * GET /api/subscription/current
 */
const getCurrentSubscription = async (req, res) => {
    try {
        // Mock subscription data for now
        const mockSubscription = {
            plan: 'pro',
            status: 'active',
            price: 49.99,
            nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            features: ['unlimited_customers', 'advanced_analytics', 'email_marketing']
        };

        const mockUsage = {
            customers: { used: 1250, limit: 5000 },
            apiCalls: { used: 8500, limit: 10000 },
            emails: { used: 320, limit: 1000 },
            rewards: { used: 12, limit: 50 },
            storage: { used: 2.1, limit: 10 }
        };

        const mockPlans = [
            {
                id: 'starter',
                name: 'Starter',
                price: 19.99,
                description: 'Perfect for small businesses',
                features: [
                    { name: 'Up to 1,000 customers', included: true },
                    { name: '5,000 API calls/month', included: true },
                    { name: '500 emails/month', included: true },
                    { name: 'Basic analytics', included: true },
                    { name: 'Advanced analytics', included: false }
                ]
            },
            {
                id: 'pro',
                name: 'Professional',
                price: 49.99,
                description: 'For growing businesses',
                popular: true,
                features: [
                    { name: 'Up to 5,000 customers', included: true },
                    { name: '10,000 API calls/month', included: true },
                    { name: '1,000 emails/month', included: true },
                    { name: 'Advanced analytics', included: true },
                    { name: 'Priority support', included: true }
                ]
            },
            {
                id: 'enterprise',
                name: 'Enterprise',
                price: 99.99,
                description: 'For large organizations',
                features: [
                    { name: 'Unlimited customers', included: true },
                    { name: 'Unlimited API calls', included: true },
                    { name: 'Unlimited emails', included: true },
                    { name: 'Custom integrations', included: true },
                    { name: 'Dedicated support', included: true }
                ]
            }
        ];

        const mockBillingHistory = [
            { id: 1, date: new Date('2024-01-01'), plan: 'Professional', amount: 49.99, status: 'paid', invoice: 'INV-2024-001' },
            { id: 2, date: new Date('2023-12-01'), plan: 'Professional', amount: 49.99, status: 'paid', invoice: 'INV-2023-012' },
            { id: 3, date: new Date('2023-11-01'), plan: 'Professional', amount: 49.99, status: 'paid', invoice: 'INV-2023-011' }
        ];

        res.status(200).json({
            success: true,
            subscription: mockSubscription,
            usage: mockUsage,
            plans: mockPlans,
            billingHistory: mockBillingHistory
        });
    } catch (error) {
        console.error('Error getting subscription:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }
};

/**
 * Get billing history (mock implementation)
 * GET /api/subscription/billing-history
 */
const getBillingHistory = async (req, res) => {
    try {
        const mockBillingHistory = [
            { id: 1, date: new Date('2024-01-01'), plan: 'Professional', amount: 49.99, status: 'paid', invoice: 'INV-2024-001' },
            { id: 2, date: new Date('2023-12-01'), plan: 'Professional', amount: 49.99, status: 'paid', invoice: 'INV-2023-012' },
            { id: 3, date: new Date('2023-11-01'), plan: 'Professional', amount: 49.99, status: 'paid', invoice: 'INV-2023-011' },
            { id: 4, date: new Date('2023-10-01'), plan: 'Professional', amount: 49.99, status: 'paid', invoice: 'INV-2023-010' },
            { id: 5, date: new Date('2023-09-01'), plan: 'Professional', amount: 49.99, status: 'paid', invoice: 'INV-2023-009' }
        ];

        res.status(200).json({
            success: true,
            billingHistory: mockBillingHistory
        });
    } catch (error) {
        console.error('Error getting billing history:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }
};

/**
 * Get usage statistics (mock implementation)
 * GET /api/subscription/usage
 */
const getUsageStatistics = async (req, res) => {
    try {
        const mockUsage = {
            customers: { used: 1250, limit: 5000 },
            apiCalls: { used: 8500, limit: 10000 },
            emails: { used: 320, limit: 1000 },
            rewards: { used: 12, limit: 50 },
            storage: { used: 2.1, limit: 10 }
        };

        res.status(200).json({
            success: true,
            usage: mockUsage
        });
    } catch (error) {
        console.error('Error getting usage statistics:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }
};

module.exports = {
    loginMerchant,
    logoutMerchant,
    getLoyaltySettings,
    updateLoyaltySettings,
    // updateMerchantProfile,
    getRewardSettings,
    updateRewardSettings,
    getMerchantDashboard,
    sendMail,
    getIdentityAndDesignSettings,
    updateIdentityAndDesignSettings,
    verifyAuth,
    getCurrentSubscription,
    getBillingHistory,
    getUsageStatistics,
    updateMerchantProfile,
    updateAppearanceSettings,
    updateSecuritySettings
};