const Merchant = require('../models/merchant.model');
const Customer = require('../models/customer.model');
const CustomerLoyaltyActivity = require('../models/customerLoyalityActivitySchema.model');
const { sendEmail } = require('../utils/sendEmail');
const { notification } = require('../utils/templates/notification.template');

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
const awardPoints = async ({ merchant, customerId, points, event, metadata = {} }) => {
    const customer = await Customer.findOne({ _id: customerId, merchant: merchant._id });
    if (!customer) return;

    customer.points += points;
    
    // Calculate and update customer tier based on new points total
    const newTier = calculateCustomerTier(customer.points, merchant.loyaltySettings || {});
    const oldTier = customer.tier || 'bronze';
    customer.tier = newTier;

    merchant.customersPoints = (merchant.customersPoints || 0) + points; // Update total points for the merchant
    await customer.save();
    await merchant.save();

    // Log tier change if it occurred
    if (oldTier !== newTier) {
        console.log(`\n🎉 Customer ${customerId} tier upgraded from ${oldTier} to ${newTier}!\n`);
    }

    await CustomerLoyaltyActivity.create({
        customerId,
        merchantId: merchant._id,
        event,
        points,
        metadata,
        createdAt: new Date()
    });

    console.log(`\n${points} points awarded to customer ${customerId} for ${event}\n`);

    // Send notification email if enabled
    await sendCustomerNotification({
        customer,
        merchant,
        event,
        points,
        metadata
    });
};

// Reusable function to deduct points and save log
const deductPoints = async ({ merchant, customerId, points, event, metadata = {} }) => {
    const customer = await Customer.findOne({ _id: customerId, merchant: merchant._id });
    if (!customer) return;

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
        console.log(`\n📉 Customer ${customerId} tier changed from ${oldTier} to ${newTier} due to point deduction\n`);
    }

    await CustomerLoyaltyActivity.create({
        customerId,
        merchantId: merchant._id,
        event,
        points: -pointsToDeduct, // Negative points to indicate deduction
        metadata,
        createdAt: new Date()
    });

    console.log(`\n${pointsToDeduct} points deducted from customer ${customerId} for ${event}\n`);

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
        if (!merchant || !merchant.loyaltySettings) return;

        const loyalty = merchant.loyaltySettings;

        switch (event) {
            case 'purchase':
                if (loyalty.purchasePoints?.enabled) {
                    const amount = data.amount || 0;
                    const points = calculatePurchasePoints(amount, loyalty.pointsPerCurrencyUnit || 1);
                    if (points > 0) {
                        await awardPoints({ merchant, customerId, points, event: 'purchase', metadata: { amount, orderId: data.orderId } });
                    }
                }

                if (loyalty.purchaseAmountThresholdPoints?.enabled) {
                    const thresholdAmount = loyalty.purchaseAmountThresholdPoints.thresholdAmount;
                    if (data.amount >= thresholdAmount) {
                        await awardPoints({
                            merchant,
                            customerId,
                            points: loyalty.purchaseAmountThresholdPoints.points,
                            event: 'purchaseThreshold',
                            metadata: { amount: data.amount, orderId: data.orderId }
                        });
                    }
                }
                break;

            case 'feedback':
                if (loyalty.feedbackShippingPoints?.enabled) {
                    await awardPoints({ merchant, customerId, points: loyalty.feedbackShippingPoints.points, event: 'feedback', metadata: data });
                }
                break;

            case 'birthday':
                if (loyalty.birthdayPoints?.enabled) {
                    await awardPoints({ merchant, customerId, points: loyalty.birthdayPoints.points, event: 'birthday', metadata: data });
                }
                break;

            case 'rating':
                if (loyalty.ratingAppPoints?.enabled) {
                    await awardPoints({ merchant, customerId, points: loyalty.ratingAppPoints.points, event: 'rating', metadata: data });
                }
                break;

            case 'profileCompletion':
                if (loyalty.profileCompletionPoints?.enabled) {
                    await awardPoints({ merchant, customerId, points: loyalty.profileCompletionPoints.points, event: 'profileCompletion', metadata: data });
                }
                break;

            case 'repeatPurchase':
                if (loyalty.repeatPurchasePoints?.enabled) {
                    await awardPoints({ merchant, customerId, points: loyalty.repeatPurchasePoints.points, event: 'repeatPurchase', metadata: data });
                }
                break;

            case 'welcome':
                if (loyalty.welcomePoints?.enabled) {
                    await awardPoints({ merchant, customerId, points: loyalty.welcomePoints.points, event: 'welcome', metadata: data });
                }
                break;

            case 'installApp':
                if (loyalty.installAppPoints?.enabled) {
                    await awardPoints({ merchant, customerId, points: loyalty.installAppPoints.points, event: 'installApp', metadata: data });
                }
                break;

            case 'shareReferral':
                if (loyalty.shareReferralPoints?.enabled) {
                    await awardPoints({ merchant, customerId, points: loyalty.shareReferralPoints.points, event: 'shareReferral', metadata: data });
                }
                break;

            case 'pointsDeduction':
                const pointsToDeduct = data.pointsDeducted || 0;
                if (pointsToDeduct > 0) {
                    await deductPoints({ merchant, customerId, points: pointsToDeduct, event: 'pointsDeduction', metadata: data });
                }
                break;

            default:
                console.log(`\n\nUnknown event: ${event}\n\n`);
        }
    }
};

// Wrapper function to match the interface used in controllers
const loyaltyEngineWrapper = async ({ event, merchant, customer, metadata = {} }) => {
    return await LoyaltyEngine.processEvent({
        event,
        customerId: customer._id,
        merchantId: merchant._id,
        data: metadata
    });
};

module.exports = loyaltyEngineWrapper;