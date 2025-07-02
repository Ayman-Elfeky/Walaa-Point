const Customer = require('../models/customer.model');
const Reward = require('../models/reward.model');
const Coupon = require('../models/coupon.model');
const CustomerLoyaltyActivity = require('../models/customerLoyalityActivitySchema.model');
const loyaltyEngine = require('../services/loyalityEngine');
const generateCouponCode = require('../utils/generateCouponCode');

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
        console.log('\nApplying reward to customer\n');
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

        console.log(`\nCustomer found: ${customer.name || customer.customerId}\n`);
        console.log(`\nReward found: ${reward.rewardType} (${reward.rewardValue})\n`);

        if (!reward.enabled) {
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

        // Generate coupon without deducting points yet
        const code = generateCouponCode(reward.rewardType.toUpperCase().slice(0, 4));
        const expiresAt = reward.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // default 7 days

        const coupon = new Coupon({
            code,
            reward: reward._id,
            customer: customer._id,
            merchant: merchant._id,
            expiresAt
        });

        await coupon.save();

        // Log the coupon generation activity
        await CustomerLoyaltyActivity.create({
            customerId: customer._id,
            merchantId: merchant._id,
            event: 'coupon_generated',
            points: 0, // No points change yet, just coupon generation
            metadata: {
                rewardType: reward.rewardType,
                rewardValue: reward.rewardValue,
                pointsRequired: reward.pointsRequired,
                couponCode: coupon.code,
                expiresAt: coupon.expiresAt
            }
        });

        console.log(`\nCoupon generated for customer ${customer.name || customer.customerId}\n`);
        console.log(`\nCoupon code: ${coupon.code}\n`);
        console.log(`\nReward: ${reward.rewardType} (${reward.rewardValue})\n`);
        console.log(`\nPoints required: ${reward.pointsRequired}\n`);

        return res.status(200).json({
            success: true,
            message: 'Coupon created successfully. Redeem to finalize reward.',
            coupon: {
                code: coupon.code,
                expiresAt: coupon.expiresAt,
                rewardType: reward.rewardType,
                rewardValue: reward.rewardValue,
                pointsRequired: reward.pointsRequired
            }
        });

    } catch (err) {
        console.error('\nError applying reward:', err, '\n');
        return res.status(500).json({ success: false, message: 'Something went wrong', error: err.message });
    }
};

module.exports = {
    applyRewardToCustomer,
    applyShareRewardToCustomer,
    generateShareableLink
};
