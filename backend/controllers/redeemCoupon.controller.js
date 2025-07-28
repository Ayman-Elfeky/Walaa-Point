const Coupon = require('../models/coupon.model');
const Reward = require('../models/reward.model');
const Customer = require('../models/customer.model');
const CustomerLoyaltyActivity = require('../models/customerLoyalityActivitySchema.model');
const generateCouponCode = require('../utils/generateCouponCode');
const mongoose = require('mongoose');

const redeemCoupon = async (req, res) => {
    try {
        console.log('\nRedeeming coupon\n');
        console.log('\nRequest body:', JSON.stringify(req.body, null, 2), '\n');

        const { couponId, orderId } = req.body;
        const merchant = req.merchant;
        
        if (!couponId) {
            console.log('\nMissing coupon ID\n');
            return res.status(400).json({ success: false, message: 'Coupon ID is required' });
        }
        
        const coupon = await Coupon.findOne({ _id: couponId, merchant: merchant._id })
            .populate('reward')
            .populate('customer');

        if (!coupon) {
            console.log(`\nCoupon not found: ${couponId}\n`);
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        console.log(`\nCoupon found: ${coupon._id} (Code: ${coupon.code || 'PENDING'})\n`);

        if (coupon.used) {
            console.log('\nCoupon already used\n');
            return res.status(400).json({ success: false, message: 'Coupon has already been used' });
        }

        if (new Date() > new Date(coupon.expiresAt)) {
            console.log('\nCoupon expired\n');
            return res.status(400).json({ success: false, message: 'Coupon has expired' });
        }

        const reward = coupon.reward;
        const customer = coupon.customer;

        // Check if customer still has enough points
        if (customer.points < reward.pointsRequired) {
            console.log(`\nInsufficient points: has ${customer.points}, needs ${reward.pointsRequired}\n`);
            return res.status(400).json({ success: false, message: 'Customer does not have enough points to redeem this reward' });
        }

        console.log(`\nCustomer has ${customer.points} points, reward requires ${reward.pointsRequired} points\n`);

        // Generate Salla coupon code if not already generated (Flow 2: On-demand generation)
        if (!coupon.code) {
            console.log('\nCoupon code is null, generating Salla coupon code now...\n');
            
            try {
                // Calculate expiry date (30 days from now)
                const startDate = new Date().toISOString().split('T')[0];
                const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                
                // Map reward types to Salla API format
                let sallaType, sallaAmount, sallaMaxAmount, sallaFreeShipping = false;
                
                switch (reward.rewardType) {
                    case 'percentage':
                        sallaType = 'percentage';
                        sallaAmount = reward.rewardValue;
                        sallaMaxAmount = 1000; // Default max amount for percentage discounts
                        break;
                    case 'fixed':
                        sallaType = 'fixed';
                        sallaAmount = reward.rewardValue;
                        sallaMaxAmount = null;
                        break;
                    case 'shipping':
                        sallaType = 'fixed';
                        sallaAmount = 0;
                        sallaFreeShipping = true;
                        break;
                    case 'cashback':
                        sallaType = 'fixed';
                        sallaAmount = reward.rewardValue;
                        sallaMaxAmount = null;
                        break;
                    default:
                        sallaType = 'percentage';
                        sallaAmount = 10;
                        sallaMaxAmount = 100;
                }
                
                // Generate Salla coupon code
                const sallaResponse = await generateCouponCode(
                    merchant.accessToken,
                    sallaType,
                    sallaAmount,
                    sallaMaxAmount,
                    sallaFreeShipping,
                    startDate,
                    expiryDate,
                    'LOYALTY'
                );
                
                if (sallaResponse && sallaResponse.data && sallaResponse.data.code) {
                    coupon.code = sallaResponse.data.code;
                    console.log(`\nSalla coupon code generated: ${coupon.code}\n`);
                } else {
                    throw new Error('Failed to generate Salla coupon code');
                }
                
            } catch (codeGenError) {
                console.error('\nError generating Salla coupon code:', codeGenError.message, '\n');
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to generate coupon code from Salla',
                    error: codeGenError.message 
                });
            }
        }

        // Start a MongoDB session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Deduct points from customer
            customer.points -= reward.pointsRequired;

            // Add reward to customer's applied rewards history
            customer.appliedRewards.push({
                reward: reward._id,
                appliedAt: new Date()
            });

            // Mark coupon as used
            coupon.used = true;
            coupon.usedAt = new Date();
            if (orderId) coupon.usedOnOrderId = orderId;

            // Update reward usage stats
            reward.currentUsage = (reward.currentUsage || 0) + 1;
            await reward.save({ session });

            // Save customer and coupon changes within transaction
            await customer.save({ session });
            await coupon.save({ session });

            // Log the reward redemption activity
            await CustomerLoyaltyActivity.create([{
                customerId: customer._id,
                merchantId: merchant._id,
                event: 'reward_redeemed',
                points: -reward.pointsRequired, // Negative points for redemption
                metadata: {
                    rewardType: reward.rewardType,
                    rewardValue: reward.rewardValue,
                    couponCode: coupon.code,
                    orderId: orderId || null
                }
            }], { session });

            // Commit the transaction
            await session.commitTransaction();

            // Send notification to customer
            try {
                const storeLink = merchant.merchantDomain || `https://${merchant.merchantUsername}.salla.sa`;
                const subjectArabic = 'تم تفعيل كوبون مكافأة!';
                const contentArabic = `تم تفعيل كوبون مكافأة (${coupon.code}) بنجاح في متجر ${merchant.merchantName}, يمكنكم استخدامه في طلبكم القادم قبل ${new Date(coupon.expiresAt).toLocaleDateString('ar-EG')}`;
                const contentEnglish = `Your reward coupon (${coupon.code}) was successfully redeemed at ${merchant.merchantName}, you can use it on your next order before ${new Date(coupon.expiresAt).toLocaleDateString('en-US')}`;
                const emailHtml = require('../utils/templates/notification.template').notification(storeLink, contentArabic, contentEnglish, coupon.code);
                if (customer.email) {
                    await require('../utils/sendEmail').sendEmail(customer.email, subjectArabic, emailHtml);
                }
            } catch (notifyErr) {
                console.error('Failed to send redemption notification to customer:', notifyErr.message);
            }

            // Send notification to admin
            try {
                const storeLink = merchant.merchantDomain || `https://${merchant.merchantUsername}.salla.sa`;
                const emailHtml = require('../utils/templates/notification.template').notification(
                    storeLink,
                    `تم استخدام كوبون مكافأة للعميل ${customer.name || customer.email}: ${coupon.code}`,
                    `A reward coupon was redeemed for customer ${customer.name || customer.email}: ${coupon.code}`,
                    coupon.code
                );
                await require('../utils/sendEmail').sendEmail('aywork73@gmail.com', 'Reward Coupon Redeemed', emailHtml);
            } catch (err) {
                console.error('Failed to notify admin about coupon redemption:', err.message);
            }

            console.log(`\nReward redeemed successfully for customer ${customer.name || customer.customerId}\n`);
            console.log(`\nReward: ${reward.rewardType} (${reward.rewardValue})\n`);
            console.log(`\nPoints deducted: ${reward.pointsRequired}\n`);
            console.log(`\nCoupon code: ${coupon.code}\n`);

        } catch (transactionError) {
            // Rollback transaction on error
            await session.abortTransaction();
            console.error('\nTransaction failed, rolling back:', transactionError, '\n');
            throw transactionError;
        } finally {
            // End session
            session.endSession();
        }

        let benefit = '';
        switch (reward.rewardType) {
            case 'discountOrderPercent':
                benefit = `${reward.rewardValue}% off the order`;
                break;
            case 'discountOrderPrice':
                benefit = `${reward.rewardValue} SA off the order`;
                break;
            case 'cashback':
                benefit = `Customer will receive ${reward.rewardValue} SA cashback`;
                break;
            case 'freeProduct':
                benefit = `Customer gets a free product`;
                break;
            case 'discountShipping':
                benefit = `${reward.rewardValue} SA off shipping`;
                break;
            default:
                benefit = `Reward applied`;
        }

        return res.status(200).json({
            success: true,
            message: 'Coupon redeemed successfully',
            benefit,
            customer: {
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                remainingPoints: customer.points
            },
            reward: {
                type: reward.rewardType,
                value: reward.rewardValue,
                pointsRequired: reward.pointsRequired
            },
            appliedRewardsCount: customer.appliedRewards.length
        });

    } catch (err) {
        console.error('\nError redeeming coupon:', err, '\n');
        return res.status(500).json({ success: false, message: 'Something went wrong', error: err.message });
    }
};

module.exports = {
    redeemCoupon
};
