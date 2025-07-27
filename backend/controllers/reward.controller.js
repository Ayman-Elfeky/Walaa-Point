const Customer = require('../models/customer.model');
const Reward = require('../models/reward.model');
const Coupon = require('../models/coupon.model');
const CustomerLoyaltyActivity = require('../models/customerLoyalityActivitySchema.model');
const loyaltyEngine = require('../services/loyalityEngine');
const { sendEmail } = require('../utils/sendEmail');
const { notification } = require('../utils/templates/notification.template');
const generateCouponCode = require('../utils/generateCouponCode');

/**
 * Create a new reward rule
 * POST /api/rewards
 */
const createReward = async (req, res) => {
    try {
        const merchant = req.merchant;
        const {
            name,
            nameEn,
            description,
            descriptionEn,
            pointsRequired,
            rewardType,
            rewardValue,
            minOrderValue,
            maxUsagePerCustomer,
            maxTotalUsage,
            validUntil,
            category,
            terms,
            termsEn
        } = req.body;

        // Validate required fields
        if (!name || !description || !pointsRequired || !rewardType || rewardValue === undefined) {
            return res.status(400).json({
                success: false,
                message: 'name, description, pointsRequired, rewardType, and rewardValue are required'
            });
        }

        // Validate rewardType
        const validRewardTypes = ['percentage', 'fixed', 'shipping', 'cashback', 'product'];
        if (!validRewardTypes.includes(rewardType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reward type. Valid types: ' + validRewardTypes.join(', ')
            });
        }

        // Validate rewardValue based on type
        if (rewardType === 'percentage' && (rewardValue <= 0 || rewardValue > 100)) {
            return res.status(400).json({
                success: false,
                message: 'Percentage rewards must be between 1 and 100'
            });
        }

        if ((rewardType === 'fixed' || rewardType === 'cashback') && rewardValue <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Fixed amount and cashback rewards must be greater than 0'
            });
        }

        const newReward = new Reward({
            merchant: merchant._id,
            name,
            nameEn: nameEn || name,
            description,
            descriptionEn: descriptionEn || description,
            pointsRequired: parseInt(pointsRequired),
            rewardType,
            rewardValue: parseFloat(rewardValue),
            minOrderValue: minOrderValue ? parseFloat(minOrderValue) : 0,
            maxUsagePerCustomer: maxUsagePerCustomer ? parseInt(maxUsagePerCustomer) : 1,
            maxTotalUsage: maxTotalUsage ? parseInt(maxTotalUsage) : 1000,
            currentUsage: 0,
            isActive: true,
            validFrom: new Date(),
            validUntil: validUntil ? new Date(validUntil) : null,
            category: category || 'general',
            terms: terms || [],
            termsEn: termsEn || []
        });

        await newReward.save();

        res.status(201).json({
            success: true,
            message: 'Reward rule created successfully',
            reward: newReward
        });
    } catch (error) {
        console.error('Error creating reward:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};

/**
 * Get all reward rules for merchant
 * GET /api/rewards
 */
const getAllRewards = async (req, res) => {
    try {
        const merchant = req.merchant;

        const rewards = await Reward.find({ merchant: merchant._id })
            .sort({ createdAt: -1 });

        // Get statistics for each reward
        const rewardsWithStats = await Promise.all(rewards.map(async (reward) => {
            const rewardObj = reward.toObject();

            // Count total coupons generated for this reward
            const totalCoupons = await Coupon.countDocuments({
                reward: reward._id,
                merchant: merchant._id
            });

            // Count redeemed coupons
            const redeemedCoupons = await Coupon.countDocuments({
                reward: reward._id,
                merchant: merchant._id,
                used: true
            });

            // Count active (unused and not expired) coupons
            const activeCoupons = await Coupon.countDocuments({
                reward: reward._id,
                merchant: merchant._id,
                used: false,
                expiresAt: { $gt: new Date() }
            });

            rewardObj.statistics = {
                totalCoupons,
                redeemedCoupons,
                activeCoupons,
                redemptionRate: totalCoupons > 0 ? ((redeemedCoupons / totalCoupons) * 100).toFixed(2) : 0
            };

            return rewardObj;
        }));

        res.status(200).json({
            success: true,
            message: 'Rewards retrieved successfully',
            rewards: rewardsWithStats
        });
    } catch (error) {
        console.log("Hhihih");
        console.error('Error fetching rewards:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};

/**
 * Get single reward rule by ID
 * GET /api/rewards/:id
 */
// Cast to ObjectId failed for value "coupons" (type string) at path "_id" for model "Reward"
const getRewardById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id)
        const merchant = req.merchant;
        
        console.log("The problem may be here: reward");
        const reward = await Reward.findOne({
            _id: id,
            merchant: merchant._id
        });
        
        if (!reward) {
            return res.status(404).json({
                success: false,
                message: 'Reward not found'
            });
        }
        
        console.log("The problem may be here: totalCoupons");
        // Get detailed statistics
        const totalCoupons = await Coupon.countDocuments({
            reward: reward._id,
            merchant: merchant._id
        });
        
        console.log("The problem may be here: redeemedCoupons");
        const redeemedCoupons = await Coupon.countDocuments({
            reward: reward._id,
            merchant: merchant._id,
            used: true
        });

        console.log("The problem may be here: activeCoupons");
        const activeCoupons = await Coupon.countDocuments({
            reward: reward._id,
            merchant: merchant._id,
            used: false,
            expiresAt: { $gt: new Date() }
        });

        console.log("The problem may be here: recentCoupons");
        const recentCoupons = await Coupon.find({
            reward: reward._id,
            merchant: merchant._id
        })
        .populate('customer', 'name email phone customerId')
        .sort({ createdAt: -1 })
        .limit(10);

        console.log("NOOOOOO")
        
        res.status(200).json({
            success: true,
            message: 'Reward retrieved successfully',
            reward: {
                ...reward.toObject(),
                statistics: {
                    totalCoupons,
                    redeemedCoupons,
                    activeCoupons,
                    redemptionRate: totalCoupons > 0 ? ((redeemedCoupons / totalCoupons) * 100).toFixed(2) : 0
                },
                recentCoupons
            }
        });
    } catch (error) {
        console.error('Error fetching reward:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};

/**
 * Update reward rule
 * PUT /api/rewards/:id
 */
const updateReward = async (req, res) => {
    try {
        const { id } = req.params;
        const merchant = req.merchant;
        const updates = req.body;

        const reward = await Reward.findOne({
            _id: id,
            merchant: merchant._id
        });

        if (!reward) {
            return res.status(404).json({
                success: false,
                message: 'Reward not found'
            });
        }

        // Validate rewardType if being updated
        if (updates.rewardType) {
            const validRewardTypes = ['discountOrderPrice', 'discountShipping', 'discountOrderPercent', 'cashback', 'freeProduct'];
            if (!validRewardTypes.includes(updates.rewardType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid reward type. Valid types: ' + validRewardTypes.join(', ')
                });
            }

            // Check if another reward with this type exists
            if (updates.rewardType !== reward.rewardType) {
                const existingReward = await Reward.findOne({
                    merchant: merchant._id,
                    rewardType: updates.rewardType
                });

                if (existingReward) {
                    return res.status(400).json({
                        success: false,
                        message: 'A reward with this type already exists'
                    });
                }
            }
        }

        // Update allowed fields
        const allowedFields = ['description', 'pointsRequired', 'rewardType', 'rewardValue', 'enabled', 'expiresAt'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                if (field === 'expiresAt' && updates[field]) {
                    reward[field] = new Date(updates[field]);
                } else {
                    reward[field] = updates[field];
                }
            }
        });

        await reward.save();

        res.status(200).json({
            success: true,
            message: 'Reward updated successfully',
            reward
        });
    } catch (error) {
        console.error('Error updating reward:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};

/**
 * Delete reward rule
 * DELETE /api/rewards/:id
 */
const deleteReward = async (req, res) => {
    try {
        const { id } = req.params;
        const merchant = req.merchant;

        const reward = await Reward.findOne({
            _id: id,
            merchant: merchant._id
        });

        if (!reward) {
            return res.status(404).json({
                success: false,
                message: 'Reward not found'
            });
        }

        // Check if there are active coupons for this reward
        const activeCoupons = await Coupon.countDocuments({
            reward: reward._id,
            merchant: merchant._id,
            used: false,
            expiresAt: { $gt: new Date() }
        });

        if (activeCoupons > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete reward. There are ${activeCoupons} active coupons. Disable the reward instead or wait for coupons to expire.`
            });
        }

        await Reward.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Reward deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting reward:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};

const applyShareRewardToCustomer = async (req, res) => {
    try {
        console.log('\nProcessing share reward for customer\n');

        const { customerId } = req.params;

        if (!customerId) {
            console.log('\nMissing customer ID in share request\n');
            return res.status(400).send('Customer ID is required');
        }

        // Find customer with populated merchant data
        const customer = await Customer.findOne({ customerId }).populate('merchant');

        if (!customer) {
            console.log(`\nCustomer not found: ${customerId}\n`);
            return res.status(404).send('Customer not found');
        }

        if (!customer.merchant) {
            console.log('\nMerchant not found for customer\n');
            return res.status(404).send('Merchant not found for this customer');
        }

        console.log(`\nCustomer found: ${customer.name || customer.customerId}\n`);
        console.log(`\nMerchant: ${customer.merchant.merchantName}\n`);

        // Check if merchant has share reward points enabled
        const shareSettings = customer.merchant.loyaltySettings?.shareReferralPoints;

        if (!shareSettings || !shareSettings.enabled) {
            console.log('\nShare referral points are not enabled for this merchant\n');
            // Still redirect to merchant store even if points are not enabled
            return res.redirect(`${customer.merchant.merchantDomain}`);
        }

        // Initialize shareCount if it doesn't exist
        if (!customer.shareCount) {
            customer.shareCount = 0;
        }

        // Increment share count
        customer.shareCount += 1;

        console.log(`\nShare count incremented to: ${customer.shareCount}\n`);

        // Check if customer should receive points (e.g., only first share or every share based on business logic)
        let shouldAwardPoints = false;
        const pointsToAward = shareSettings.points || 0;

        // Business logic: Award points only for first share (you can modify this logic)
        if (customer.shareCount === 1) {
            shouldAwardPoints = true;
            console.log('\nFirst share detected - awarding points\n');
        }

        // Save customer with updated share count
        await customer.save();

        // Award points if conditions are met
        if (shouldAwardPoints && pointsToAward > 0) {
            try {
                await loyaltyEngine({
                    event: 'shareReferral',
                    merchant: customer.merchant,
                    customer: customer,
                    metadata: {
                        shareCount: customer.shareCount,
                        shareDate: new Date().toISOString()
                    }
                });

                console.log(`\nPoints awarded: ${pointsToAward} points for sharing\n`);
            } catch (pointsError) {
                console.error('\nError awarding share points:', pointsError, '\n');
                // Continue with redirect even if points awarding fails
            }
        }

        // Redirect to the merchant's Salla store
        const redirectUrl = customer.merchant.merchantDomain || `https://${customer.merchant.merchantUsername}.salla.sa`;
        console.log(`\nRedirecting to: ${redirectUrl}\n`);

        return res.redirect(redirectUrl);

    } catch (err) {
        console.error('\nError in share redirect:', err, '\n');
        return res.status(500).send('Something went wrong');
    }
};

const generateShareableLink = async (req, res) => {
    try {
        console.log('\nGenerating shareable link for customer\n');

        const { customerId } = req.params;
        const merchant = req.merchant;

        if (!customerId) {
            console.log('\nMissing customer ID\n');
            return res.status(400).json({ success: false, message: 'Customer ID is required' });
        }

        // Find the customer by ID and ensure they belong to this merchant
        const customer = await Customer.findOne({ customerId, merchant: merchant._id });
        if (!customer) {
            console.log(`\nCustomer not found: ${customerId}\n`);
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // Check if merchant has share referral points enabled
        if (!merchant.loyaltySettings?.shareReferralPoints?.enabled) {
            console.log('\nShare referral points not enabled for this merchant\n');
            return res.status(400).json({
                success: false,
                message: 'Share referral feature is not enabled for this merchant'
            });
        }

        // Generate a shareable link for the customer
        const shareableLink = `${req.protocol}://${req.get('host')}/api/share/${customer.customerId}`;

        console.log(`\nShareable link generated: ${shareableLink}\n`);

        return res.status(200).json({
            success: true,
            message: 'Shareable link generated successfully',
            shareableLink,
            customer: {
                name: customer.name || customer.customerId,
                shareCount: customer.shareCount || 0
            },
            rewardInfo: {
                pointsPerShare: merchant.loyaltySettings.shareReferralPoints.points || 0,
                enabled: merchant.loyaltySettings.shareReferralPoints.enabled
            }
        });
    } catch (err) {
        console.error('\nError generating shareable link:', err, '\n');
        return res.status(500).json({ success: false, message: 'Something went wrong', error: err.message });
    }
};

const applyRewardToCustomer = async (req, res) => {
    try {
        console.log('\nApplying reward to customer (manual flow, now using loyaltyEngine)\n');
        console.log('\nRequest body:', JSON.stringify(req.body, null, 2), '\n');

        const { customerId, rewardType } = req.body;
        const merchant = req.merchant;

        if (!customerId || !rewardType) {
            console.log('\nMissing required fields: customerId or rewardType\n');
            return res.status(400).json({ success: false, message: 'customerId and rewardType are required' });
        }

        const customer = await Customer.findOne({ customerId, merchant: merchant._id });
        const reward = await Reward.findOne({ rewardType, merchant: merchant._id });

        if (!customer) {
            console.log(`\nCustomer not found: ${customerId}\n`);
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        if (!reward) {
            console.log(`\nReward not found: ${rewardType}\n`);
            return res.status(404).json({ success: false, message: 'Reward not found' });
        }

        if (!reward.enabled && !reward.isActive) {
            console.log('\nReward is not active\n');
            return res.status(400).json({ success: false, message: 'Reward is not active' });
        }

        if (customer.points < reward.pointsRequired) {
            return res.status(400).json({ success: false, message: 'Not enough points to apply reward' });
        }

        // Check if customer has any unused coupons for this reward type
        const existingCoupon = await Coupon.findOne({
            customer: customer._id,
            merchant: merchant._id,
            reward: reward._id,
            used: false,
            expiresAt: { $gt: new Date() }
        });

        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: 'You already have an unused coupon for this reward',
                existingCoupon: {
                    code: existingCoupon.code,
                    expiresAt: existingCoupon.expiresAt
                }
            });
        }

        // Use loyaltyEngine to process manual reward application for consistency
        await loyaltyEngine({
            event: 'manualReward',
            merchant,
            customer,
            metadata: {
                rewardType: reward.rewardType,
                rewardId: reward._id,
                manual: true
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Reward applied and coupon generated (if eligible) using loyalty engine.'
        });

    } catch (err) {
        console.error('\nError applying reward:', err, '\n');
        return res.status(500).json({ success: false, message: 'Something went wrong', error: err.message });
    }
};

const getCoupons = async (req, res) => {
    try {
        const accessToken = req.headers.authorization?.split(' ')[1];
        if (!accessToken) {
            return res.status(401).json({ success: false, message: 'Access token is required' });
        }

        const options = req.query || {};
        const coupons = await loyaltyEngine.getCoupons(accessToken, options);

        return res.status(200).json({
            success: true,
            message: 'Coupons retrieved successfully',
            data: coupons
        });
    } catch (error) {
        console.error('Error fetching coupons:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};

module.exports = {
    createReward,
    getAllRewards,
    getRewardById,
    updateReward,
    deleteReward,
    applyRewardToCustomer,
    applyShareRewardToCustomer,
    generateShareableLink,
    getCoupons
};
