const Coupon = require('../models/coupon.model');
const Reward = require('../models/reward.model');
const Customer = require('../models/customer.model');
const CustomerLoyaltyActivity = require('../models/customerLoyalityActivitySchema.model');
const mongoose = require('mongoose');

const redeemCoupon = async (req, res) => {
    try {
        console.log('\nRedeeming coupon\n');
        console.log('\nRequest body:', JSON.stringify(req.body, null, 2), '\n');

        const { code, orderId } = req.body;
        const merchant = req.merchant;

        if (!code) {
            console.log('\nMissing coupon code\n');
            return res.status(400).json({ success: false, message: 'Coupon code is required' });
        }
        const coupon = await Coupon.findOne({ code, merchant: merchant._id })
            .populate('reward')
            .populate('customer');

        if (!coupon) {
            console.log(`\nCoupon not found: ${code}\n`);
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        console.log(`\nCoupon found: ${coupon.code}\n`);

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
