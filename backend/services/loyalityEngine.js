const Merchant = require('../models/merchant.model');
const Customer = require('../models/customer.model');
const CustomerLoyaltyActivity = require('../models/customerLoyalityActivitySchema.model');
const Reward = require('../models/reward.model');
const Coupon = require('../models/coupon.model');
const { sendEmail } = require('../utils/sendEmail');
const { notification } = require('../utils/templates/notification.template');
const generateCouponCode = require('../utils/generateCouponCode');

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

// Utility to calculate purchase points
const calculatePurchasePoints = (amount, pointsPerCurrencyUnit) => {
    return Math.floor(amount / pointsPerCurrencyUnit);
};

// Reusable function to award points and save log
const awardPoints = async ({ merchant, customer, points, event, metadata = {} }) => {
    console.log(`🔍 DEBUG: awardPoints called - customerId: ${customer._id}, points: ${points}, event: ${event}`);

    if (!customer) {
        console.log(`❌ ERROR: Customer object not provided`);
        return;
    }

    console.log(`🔍 DEBUG: Customer found - before points: ${customer.points || 0}, adding: ${points}`);
    customer.points = (customer.points || 0) + points;

    // Calculate and update customer tier based on new points total
    const newTier = calculateCustomerTier(customer.points, merchant.loyaltySettings || {});
    const oldTier = customer.tier || 'bronze';
    customer.tier = newTier;

    merchant.customersPoints = (merchant.customersPoints || 0) + points; // Update total points for the merchant
    await customer.save();
    await merchant.save();

    // Log tier change if it occurred
    if (oldTier !== newTier) {
        console.log(`\n🎉 Customer ${customer._id} tier upgraded from ${oldTier} to ${newTier}!\n`);
    }

    await CustomerLoyaltyActivity.create({
        customerId: customer._id,
        merchantId: merchant._id,
        event,
        points,
        metadata,
        createdAt: new Date()
    });

    console.log(`\n${points} points awarded to customer ${customer._id} for ${event}\n`);

    // Send notification email if enabled
    await sendCustomerNotification({
        customer,
        merchant,
        event,
        points,
        metadata
    });

    // --- Automatic Coupon Generation Logic ---
    // Only trigger for point-earning events (not deduction)
    if (points > 0 && merchant.loyaltySettings && merchant.loyaltySettings.rewardThreshold) {
        const rewardThreshold = merchant.loyaltySettings.rewardThreshold;
        // Check if customer crossed the threshold with this award
        const prevPoints = customer.points - points;
        const prevCouponsCount = Math.floor(prevPoints / rewardThreshold);
        const newCouponsCount = Math.floor(customer.points / rewardThreshold);
        if (newCouponsCount > prevCouponsCount) {
            // For each new coupon earned (in case of large point award)
            for (let i = 0; i < newCouponsCount - prevCouponsCount; i++) {
                // Find the active reward for this merchant (could be more advanced logic)
                const reward = await Reward.findOne({ merchant: merchant._id, isActive: true });
                if (!reward) {
                    // Notify admin if no active reward exists
                    try {
                        const storeLink = merchant.merchantDomain || `https://${merchant.merchantUsername}.salla.sa`;
                        const emailHtml = notification(
                            storeLink,
                            `تنبيه: لا يوجد مكافأة نشطة للعميل ${customer.name || customer.email}`,
                            `Alert: No active reward found for customer ${customer.name || customer.email}`,
                            ''
                        );
                        await sendEmail('aywork73@gmail.com', 'No Active Reward Found', emailHtml);
                        console.log(`Admin notified: No active reward for merchant ${merchant._id}`);
                    } catch (err) {
                        console.error('Failed to notify admin about missing reward:', err.message);
                    }
                    continue;
                }

                // Create coupon with real Salla code (Flow 1: Immediate generation)
                // Generate Salla coupon code immediately when points are awarded
                let sallaCode = null;
                try {
                    // Calculate expiry date (30 days from now)
                    const startDate = new Date().toISOString().split('T')[0];
                    console.log(startDate)
                    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                    // Map reward types to Salla API format
                    let sallaType, sallaAmount, sallaMaxAmount, sallaFreeShipping = false;

                    switch (reward.rewardType) {
                        case 'percentage':
                        case 'discountOrderPercent':
                            sallaType = 'percentage';
                            sallaAmount = reward.rewardValue;
                            sallaMaxAmount = 999999;
                            break;
                        case 'fixed':
                        case 'discountOrderPrice':
                            sallaType = 'fixed';
                            sallaAmount = reward.rewardValue;
                            sallaMaxAmount = null;
                            break;
                        case 'shipping':
                        case 'discountShipping':
                            sallaType = 'fixed';
                            sallaAmount = reward.rewardValue;
                            sallaMaxAmount = null;
                            sallaFreeShipping = true;
                            break;
                        case 'cashback':
                            sallaType = 'fixed';
                            sallaAmount = reward.rewardValue;
                            sallaMaxAmount = null;
                            break;
                        default:
                            sallaType = 'percentage';
                            sallaAmount = reward.rewardValue;
                            sallaMaxAmount = 999999;
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
                        sallaCode = sallaResponse.data.code;
                        console.log(`✅ Generated Salla coupon code: ${sallaCode}`);
                    } else {
                        throw new Error('Salla API did not return a valid coupon code');
                    }
                } catch (codeGenError) {
                    console.error(`❌ CRITICAL ERROR: Failed to generate Salla coupon code: ${codeGenError.message}`);

                    // Send error notification to admin
                    try {
                        const storeLink = merchant.merchantDomain || `https://${merchant.merchantUsername}.salla.sa`;
                        const emailHtml = notification(
                            storeLink,
                            `خطأ في إنشاء كوبون: فشل في توليد كود كوبون من سلة للعميل ${customer.name || customer.email}. السبب: ${codeGenError.message}`,
                            `Coupon Generation Error: Failed to generate Salla coupon code for customer ${customer.name || customer.email}. Reason: ${codeGenError.message}`,
                            'ERROR'
                        );
                        await sendEmail('aywork73@gmail.com', 'Salla Coupon Generation Failed', emailHtml);
                        console.log(`❌ Admin notified about Salla API failure for customer ${customer._id}`);
                    } catch (notifyErr) {
                        console.error('Failed to notify admin about Salla API failure:', notifyErr.message);
                    }

                    // Skip coupon creation and continue to next iteration
                    console.log(`⚠️ Skipping coupon creation for customer ${customer._id} due to Salla API failure`);
                    continue; // Skip this coupon and move to the next one (if any)
                }

                // Only create coupon if we have a valid Salla code
                if (!sallaCode) {
                    console.log(`❌ No valid Salla code generated, skipping coupon creation`);
                    continue;
                }

                const coupon = await Coupon.create({
                    code: sallaCode, // Only create coupon with valid Salla code
                    customer: customer._id,
                    merchant: merchant._id,
                    reward: reward._id,
                    used: false,
                    createdAt: new Date(),
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
                });
                // Optionally, push coupon to customer (if you keep an array)
                // customer.coupons = customer.coupons || [];
                // customer.coupons.push(coupon._id);
                // await customer.save();

                // Log coupon generation in activity
                let res = await CustomerLoyaltyActivity.create({
                    customerId: customer._id, // Fixed: use customer._id instead of customerId
                    merchantId: merchant._id,
                    event: 'coupon_generated',
                    points: 0,
                    metadata: { couponId: coupon._id, rewardId: reward._id, couponCode: sallaCode },
                    createdAt: new Date()
                });

                console.log(`\n📄 Coupon ${coupon._id} created successfully for customer ${customer._id} with Salla code: ${sallaCode}\n`);

                // Send notification to customer
                await sendCustomerNotification({
                    customer,
                    merchant,
                    event: 'coupon_generated',
                    points: 0,
                    metadata: { couponId: coupon._id, rewardId: reward._id, couponCode: sallaCode }
                });

                // Send success notification to admin/user
                try {
                    const storeLink = merchant.merchantDomain || `https://${merchant.merchantUsername}.salla.sa`;
                    const emailHtml = notification(
                        storeLink,
                        `تم إنشاء كوبون جديد بنجاح للعميل ${customer.name || customer.email} برمز: ${sallaCode}`,
                        `A new coupon has been successfully generated for customer ${customer.name || customer.email} with code: ${sallaCode}`,
                        sallaCode
                    );
                    await sendEmail('aywork73@gmail.com', 'New Coupon Generated Successfully', emailHtml);
                    console.log(`✅ Admin notified about successful coupon generation: ${coupon._id}`);
                } catch (err) {
                    console.error('Failed to notify admin about successful coupon:', err.message);
                }
            }

            // Summary log after coupon generation loop
            console.log(`\n🎯 Coupon generation summary: Customer ${customer._id} earned ${newCouponsCount - prevCouponsCount} coupon(s). Points: ${customer.points}, Threshold: ${rewardThreshold}\n`);
        }
    }
};

// Reusable function to deduct points and save log
const deductPoints = async ({ merchant, customer, points, event, metadata = {} }) => {
    if (!customer) {
        console.log(`❌ ERROR: Customer object not provided for deduction`);
        return;
    }

    // Make sure we don't go below 0 points
    const pointsToDeduct = Math.min(points, customer.points);
    customer.points -= pointsToDeduct;

    // Calculate and update customer tier based on new points total
    const newTier = calculateCustomerTier(customer.points, merchant.loyaltySettings || {});
    const oldTier = customer.tier || 'bronze';
    customer.tier = newTier;

    // Update merchant's total points
    merchant.customersPoints = Math.max(0, (merchant.customersPoints || 0) - pointsToDeduct);
    await customer.save();
    await merchant.save();

    // Log tier change if it occurred
    if (oldTier !== newTier) {
        console.log(`\n📉 Customer ${customer._id} tier changed from ${oldTier} to ${newTier} due to point deduction\n`);
    }

    await CustomerLoyaltyActivity.create({
        customerId: customer._id,
        merchantId: merchant._id,
        event,
        points: -pointsToDeduct, // Negative points to indicate deduction
        metadata,
        createdAt: new Date()
    });

    console.log(`\n${pointsToDeduct} points deducted from customer ${customer._id} for ${event}\n`);

    // Send notification email if enabled
    await sendCustomerNotification({
        customer,
        merchant,
        event,
        points: pointsToDeduct,
        metadata
    });
};

// Function to send email notifications to customers
const sendCustomerNotification = async ({ customer, merchant, event, points, metadata = {} }) => {
    try {
        // Check if customer has email and merchant has notification settings
        if (!customer.email || !merchant.notificationSettings) {
            console.log(`\nSkipping email - Customer email: ${!!customer.email}, Merchant notifications: ${!!merchant.notificationSettings}\n`);
            return;
        }

        const notificationSettings = merchant.notificationSettings;
        let shouldSendEmail = false;
        let subjectArabic = '';
        let contentArabic = '';
        let contentEnglish = '';
        let code = '';

        // Determine if notification should be sent based on event and settings
        switch (event) {
            case 'purchase':
            case 'purchaseThreshold':
            case 'feedback':
            case 'rating':
            case 'profileCompletion':
            case 'repeatPurchase':
            case 'welcome':
            case 'installApp':
                if (notificationSettings.earnNewPoints) {
                    shouldSendEmail = true;
                    subjectArabic = 'حصلت على نقاط إضافية!';
                    contentArabic = `تهانينا! لقد حصلت على ${points} نقطة إضافية من متجر ${merchant.merchantName}`;
                    contentEnglish = `Congratulations! You earned ${points} additional points from ${merchant.merchantName} store`;
                }
                break;

            case 'manualReward':
                if (notificationSettings.earnNewCoupon && metadata && metadata.rewardId) {
                    shouldSendEmail = true;
                    subjectArabic = 'تم إنشاء كوبون خصم جديد (يدوي)!';
                    contentArabic = `تمت إضافة مكافأة يدوية لك من متجر ${merchant.merchantName}. تحقق من الكوبون الجديد في حسابك.`;
                    contentEnglish = `A manual reward has been added for you from ${merchant.merchantName}. Check your account for the new coupon.`;
                    code = metadata.couponCode || '';
                }
                break;

            case 'birthday':
                if (notificationSettings.birthday) {
                    shouldSendEmail = true;
                    subjectArabic = 'عيد ميلاد سعيد! 🎉';
                    contentArabic = `عيد ميلاد سعيد ${customer.name || 'عزيزنا العميل'}! حصلت على ${points} نقطة هدية من متجر ${merchant.merchantName}`;
                    contentEnglish = `Happy Birthday ${customer.name || 'Dear Customer'}! You received ${points} bonus points from ${merchant.merchantName} store`;
                }
                break;

            case 'shareReferral':
                if (notificationSettings.earnNewCouponForShare) {
                    shouldSendEmail = true;
                    subjectArabic = 'شكراً لمشاركة المتجر!';
                    contentArabic = `شكراً لك على مشاركة متجر ${merchant.merchantName}! حصلت على ${points} نقطة`;
                    contentEnglish = `Thank you for sharing ${merchant.merchantName} store! You earned ${points} points`;
                }
                break;

            case 'coupon_generated':
                if (notificationSettings.earnNewCoupon && metadata.couponCode) {
                    shouldSendEmail = true;
                    subjectArabic = 'تم إنشاء كوبون خصم جديد!';
                    contentArabic = `تهانينا! تم إنشاء كوبون خصم جديد لك من متجر ${merchant.merchantName}`;
                    contentEnglish = `Congratulations! A new discount coupon has been created for you from ${merchant.merchantName} store`;
                    code = metadata.couponCode;
                }
                break;

            case 'pointsDeduction':
                // Only send notification if enabled (check general settings)
                if (notificationSettings.earnNewPoints) {
                    shouldSendEmail = true;
                    const reason = metadata.reason || 'order_cancelled';
                    let reasonArabic = '';
                    let reasonEnglish = '';

                    switch (reason) {
                        case 'order_deleted':
                            reasonArabic = 'لحذف الطلب';
                            reasonEnglish = 'due to order deletion';
                            break;
                        case 'order_refunded':
                            reasonArabic = 'لاسترداد الطلب';
                            reasonEnglish = 'due to order refund';
                            break;
                        default:
                            reasonArabic = 'لإلغاء الطلب';
                            reasonEnglish = 'due to order cancellation';
                    }

                    subjectArabic = 'تم خصم نقاط من رصيدك';
                    contentArabic = `تم خصم ${points} نقطة من رصيدك ${reasonArabic} في متجر ${merchant.merchantName}`;
                    contentEnglish = `${points} points have been deducted from your account ${reasonEnglish} at ${merchant.merchantName} store`;
                }
                break;

            default:
                console.log(`\nNo notification template for event: ${event}\n`);
                return;
        }

        if (!shouldSendEmail) {
            console.log(`\nNotification disabled for event: ${event}\n`);
            return;
        }

        // Prepare store link
        const storeLink = merchant.merchantDomain || `https://${merchant.merchantUsername}.salla.sa`;

        // Generate email templates
        const emailHtml = notification(storeLink, contentArabic, contentEnglish, code);

        // Send email
        await sendEmail(customer.email, subjectArabic, emailHtml);
        console.log(`\nNotification email sent to ${customer.email} for event: ${event}\n`);

    } catch (error) {
        console.error(`\nError sending notification email: ${error.message}\n`);
        // Don't throw error to avoid breaking the main flow
    }
};

// Main engine to process events
const LoyaltyEngine = {
    async processEvent({ event, customerId, merchantId, data = {} }) {
        const merchant = await Merchant.findById(merchantId);
        if (!merchant || !merchant.loyaltySettings) {
            return { success: false, message: 'Merchant not found or loyalty settings not configured' };
        }

        const loyalty = merchant.loyaltySettings;
        let result = { success: true, event, customerId, pointsAwarded: 0, activities: [] };

        switch (event) {
            case 'purchase':
                if (loyalty.purchasePoints?.enabled) {
                    const amount = data.amount || 0;
                    const points = calculatePurchasePoints(amount, loyalty.pointsPerCurrencyUnit || 1);
                    if (points > 0) {
                        await awardPoints({ merchant, customerId, points, event: 'purchase', metadata: { amount, orderId: data.orderId } });
                        result.pointsAwarded += points;
                        result.activities.push({ type: 'purchase_points', points, amount });
                    }
                }

                if (loyalty.purchaseAmountThresholdPoints?.enabled) {
                    const thresholdAmount = loyalty.purchaseAmountThresholdPoints.thresholdAmount;
                    if (data.amount >= thresholdAmount) {
                        const thresholdPoints = loyalty.purchaseAmountThresholdPoints.points;
                        await awardPoints({
                            merchant,
                            customerId,
                            points: thresholdPoints,
                            event: 'purchaseThreshold',
                            metadata: { amount: data.amount, orderId: data.orderId }
                        });
                        result.pointsAwarded += thresholdPoints;
                        result.activities.push({ type: 'threshold_bonus', points: thresholdPoints, threshold: thresholdAmount });
                    }
                }
                break;

            case 'feedback':
            case 'feedbackShippingPoints': // Alias for feedback
                if (loyalty.feedbackShippingPoints?.enabled) {
                    const points = loyalty.feedbackShippingPoints.points;
                    await awardPoints({ merchant, customerId, points, event: 'feedback', metadata: data });
                    result.pointsAwarded = points;
                    result.activities.push({ type: 'feedback', points });
                }
                break;

            case 'birthday':
                if (loyalty.birthdayPoints?.enabled) {
                    const points = loyalty.birthdayPoints.points;
                    await awardPoints({ merchant, customerId, points, event: 'birthday', metadata: data });
                    result.pointsAwarded = points;
                    result.activities.push({ type: 'birthday', points });
                }
                break;

            case 'rating':
            case 'ratingProductPoints': // Alias for rating
                if (loyalty.ratingProductPoints?.enabled) {
                    const points = loyalty.ratingProductPoints.points;
                    await awardPoints({ merchant, customerId, points, event: 'rating', metadata: data });
                    result.pointsAwarded = points;
                    result.activities.push({ type: 'product_rating', points });
                }
                break;

            case 'profileCompletion':
                if (loyalty.profileCompletionPoints?.enabled) {
                    const points = loyalty.profileCompletionPoints.points;
                    await awardPoints({ merchant, customerId, points, event: 'profileCompletion', metadata: data });
                    result.pointsAwarded = points;
                    result.activities.push({ type: 'profile_completion', points });
                }
                break;

            case 'repeatPurchase':
                if (loyalty.repeatPurchasePoints?.enabled) {
                    const points = loyalty.repeatPurchasePoints.points;
                    await awardPoints({ merchant, customerId, points, event: 'repeatPurchase', metadata: data });
                    result.pointsAwarded = points;
                    result.activities.push({ type: 'repeat_purchase', points });
                }
                break;

            case 'welcome':
                if (loyalty.welcomePoints?.enabled) {
                    const points = loyalty.welcomePoints.points;
                    await awardPoints({ merchant, customerId, points, event: 'welcome', metadata: data });
                    result.pointsAwarded = points;
                    result.activities.push({ type: 'welcome', points });
                }
                break;

            case 'installApp':
                if (loyalty.installAppPoints?.enabled) {
                    const points = loyalty.installAppPoints.points;
                    await awardPoints({ merchant, customerId, points, event: 'installApp', metadata: data });
                    result.pointsAwarded = points;
                    result.activities.push({ type: 'install_app', points });
                }
                break;

            case 'shareReferral':
                if (loyalty.shareReferralPoints?.enabled) {
                    const points = loyalty.shareReferralPoints.points;
                    await awardPoints({ merchant, customerId, points, event: 'shareReferral', metadata: data });
                    result.pointsAwarded = points;
                    result.activities.push({ type: 'share_referral', points });
                }
                break;

            case 'pointsDeduction':
                const pointsToDeduct = data.pointsDeducted || 0;
                if (pointsToDeduct > 0) {
                    await deductPoints({ merchant, customerId, points: pointsToDeduct, event: 'pointsDeduction', metadata: data });
                    result.pointsAwarded = -pointsToDeduct; // Negative to indicate deduction
                    result.activities.push({ type: 'points_deduction', points: -pointsToDeduct, reason: data.reason });
                }
                break;

            default:
                console.log(`\n\nUnknown event: ${event}\n\n`);
                result.success = false;
                result.message = `Unknown event: ${event}`;
        }

        return result;
    }
};

// Wrapper function to match the interface used in controllers
const loyaltyEngineWrapper = async ({ event, merchant, customer, metadata = {} }) => {
    // Use the merchant and customer objects directly instead of fetching from DB
    if (!merchant || !merchant.loyaltySettings) {
        return { success: false, message: 'Merchant not found or loyalty settings not configured' };
    }

    const loyalty = merchant.loyaltySettings;
    const customerId = customer._id;
    let result = { success: true, event, customerId, pointsAwarded: 0, activities: [] };

    switch (event) {
        case 'purchase':
            const amount = metadata.amount || 0;
            let totalPointsToAward = 0;

            // Calculate base purchase points (amount divided by pointsPerCurrencyUnit)
            const basePoints = calculatePurchasePoints(amount, loyalty.pointsPerCurrencyUnit || 1);
            if (basePoints > 0) {
                totalPointsToAward += basePoints;
                result.activities.push({ type: 'base_purchase_points', points: basePoints, amount });
            }

            // Add bonus points per purchase if enabled
            if (loyalty.purchasePoints?.enabled) {
                const bonusPoints = loyalty.purchasePoints.points || 0;
                if (bonusPoints > 0) {
                    totalPointsToAward += bonusPoints;
                    result.activities.push({ type: 'purchase_bonus', points: bonusPoints });
                }
            }

            // Add threshold bonus if enabled and threshold met
            if (loyalty.purchaseAmountThresholdPoints?.enabled) {
                const thresholdAmount = loyalty.purchaseAmountThresholdPoints.thresholdAmount;
                if (amount >= thresholdAmount) {
                    const thresholdPoints = loyalty.purchaseAmountThresholdPoints.points;
                    if (thresholdPoints > 0) {
                        totalPointsToAward += thresholdPoints;
                        result.activities.push({ type: 'threshold_bonus', points: thresholdPoints, threshold: thresholdAmount });
                    }
                }
            }

            // Award all points in a single call to avoid database conflicts
            if (totalPointsToAward > 0) {
                await awardPoints({
                    merchant,
                    customer,
                    points: totalPointsToAward,
                    event: 'purchase',
                    metadata: {
                        amount,
                        orderId: metadata.orderId,
                        breakdown: result.activities
                    }
                });
                result.pointsAwarded = totalPointsToAward;
            }
            break;

        case 'feedback':
        case 'feedbackShippingPoints': // Alias for feedback
            if (loyalty.feedbackShippingPoints?.enabled) {
                const points = loyalty.feedbackShippingPoints.points;
                await awardPoints({ merchant, customer, points, event: 'feedback', metadata });
                result.pointsAwarded = points;
                result.activities.push({ type: 'feedback', points });
            }
            break;

        case 'birthday':
            if (loyalty.birthdayPoints?.enabled) {
                const points = loyalty.birthdayPoints.points;
                await awardPoints({ merchant, customer, points, event: 'birthday', metadata });
                result.pointsAwarded = points;
                result.activities.push({ type: 'birthday', points });
            }
            break;

        case 'rating':
        case 'ratingProductPoints': // Alias for rating
            if (loyalty.ratingProductPoints?.enabled) {
                const points = loyalty.ratingProductPoints.points;
                await awardPoints({ merchant, customer, points, event: 'rating', metadata });
                result.pointsAwarded = points;
                result.activities.push({ type: 'product_rating', points });
            }
            break;

        case 'profileCompletion':
            if (loyalty.profileCompletionPoints?.enabled) {
                const points = loyalty.profileCompletionPoints.points;
                await awardPoints({ merchant, customer, points, event: 'profileCompletion', metadata });
                result.pointsAwarded = points;
                result.activities.push({ type: 'profile_completion', points });
            }
            break;

        case 'repeatPurchase':
            if (loyalty.repeatPurchasePoints?.enabled) {
                const points = loyalty.repeatPurchasePoints.points;
                await awardPoints({ merchant, customer, points, event: 'repeatPurchase', metadata });
                result.pointsAwarded = points;
                result.activities.push({ type: 'repeat_purchase', points });
            }
            break;

        case 'welcome':
            if (loyalty.welcomePoints?.enabled) {
                const points = loyalty.welcomePoints.points;
                await awardPoints({ merchant, customer, points, event: 'welcome', metadata });
                result.pointsAwarded = points;
                result.activities.push({ type: 'welcome', points });
            }
            break;

        case 'installApp':
            if (loyalty.installAppPoints?.enabled) {
                const points = loyalty.installAppPoints.points;
                await awardPoints({ merchant, customer, points, event: 'installApp', metadata });
                result.pointsAwarded = points;
                result.activities.push({ type: 'install_app', points });
            }
            break;

        case 'shareReferral':
            if (loyalty.shareReferralPoints?.enabled) {
                const points = loyalty.shareReferralPoints.points;
                await awardPoints({ merchant, customer, points, event: 'shareReferral', metadata });
                result.pointsAwarded = points;
                result.activities.push({ type: 'share_referral', points });
            }
            break;

        case 'pointsDeduction':
            const pointsToDeduct = metadata.pointsDeducted || 0;
            if (pointsToDeduct > 0) {
                await deductPoints({ merchant, customer, points: pointsToDeduct, event: 'pointsDeduction', metadata });
                result.pointsAwarded = -pointsToDeduct; // Negative to indicate deduction
                result.activities.push({ type: 'points_deduction', points: -pointsToDeduct, reason: metadata.reason });
            }
            break;

        default:
            console.log(`\n\nUnknown event: ${event}\n\n`);
            result.success = false;
            result.message = `Unknown event: ${event}`;
    }

    console.log("DEBUG: Result from loyaltyEngine:", result);
    return result;
};

module.exports = loyaltyEngineWrapper;