require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const Merchant = require('../models/merchant.model');
const Customer = require('../models/customer.model');
const Reward = require('../models/reward.model');
const Transaction = require('../models/transaction.model');
const Coupon = require('../models/coupon.model');
const CustomerLoyaltyActivity = require('../models/customerLoyalityActivitySchema.model');

const createTestData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/loyalty-app');
        console.log('✅ Connected to MongoDB');

        // Clear existing test data
        console.log('🧹 Clearing existing test data...');
        await Merchant.deleteMany({ installerEmail: 'test@loyalfy.io' });
        await Customer.deleteMany({});
        await Reward.deleteMany({});
        await Transaction.deleteMany({});
        await Coupon.deleteMany({});
        await CustomerLoyaltyActivity.deleteMany({});

        // Hash the password
        const hashedPassword = await bcrypt.hash('testpassword123', 10);

        // Create test merchant with correct schema
        const testMerchant = new Merchant({
            installerMobile: '+966501234567',
            installerRole: 'admin',
            installerName: 'Ahmed Electronics Admin',
            installerEmail: 'test@loyalfy.io',
            installationId: 'test_installation_001',
            merchantUsername: 'ahmed_electronics',
            merchantName: 'متجر أحمد للألكترونيات',
            merchantId: 'test_merchant_001',
            merchantAvatar: 'https://via.placeholder.com/150',
            merchantDomain: 'ahmed-electronics.salla.sa',
            merchantSubscription: {
                id: 'premium_plan',
                name: 'Premium Plan',
                active: true,
                features: ['unlimited_customers', 'advanced_analytics', 'custom_branding'],
                expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            },
            accessToken: 'test_access_token_12345',
            refreshToken: 'test_refresh_token_12345',
            accessTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            refreshTokenExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            scope: ['store.read', 'orders.read', 'customers.read'],
            password: hashedPassword,
            storeId: 'test_store_001',
            isActive: true,
            customersPoints: 25000,
            loyaltySettings: {
                pointsPerCurrencyUnit: 1,
                rewardThreshold: 100,
                rewardType: 'discount',
                rewardValue: 10,
                redemptionLimitPerMonth: 5,
                expiryMonths: 12,
                purchasePoints: { enabled: true, points: 10 },
                welcomePoints: { enabled: true, points: 100 },
                birthdayPoints: { enabled: true, points: 200 },
                ratingAppPoints: { enabled: true, points: 50 },
                installAppPoints: { enabled: false, points: 0 },
                feedbackShippingPoints: { enabled: true, points: 25 },
                repeatPurchasePoints: { enabled: true, points: 30 },
                shareReferralPoints: { enabled: true, points: 50 },
                profileCompletionPoints: { enabled: true, points: 75 },
                purchaseAmountThresholdPoints: {
                    enabled: true,
                    thresholdAmount: 500,
                    points: 100
                }
            },
            notificationSettings: {
                earnNewPoints: true,
                earnNewCoupon: true,
                earnNewCouponForShare: true,
                birthday: true
            },
            identityAndDesign: {
                globalIdentity: {
                    primaryColor: '#3B82F6',
                    secondaryColor: '#ffffff'
                },
                windowProgram: {
                    backgroundColor: 'primary',
                    textColor: 'white'
                },
                windowOpenButton: {
                    name: 'برنامج الولاء',
                    backgroundColor: 'primary',
                    textColor: 'white',
                    buttonPlaceVertically: 'bottom',
                    buttonPlaceHorizontally: 'right',
                    size: 'medium',
                    enableButton: true
                }
            }
        });

        await testMerchant.save();
        console.log('✅ Test merchant created');

        // Create 50 test customers
        console.log('👥 Creating 50 test customers...');
        const customerNames = [
            'أحمد محمد علي', 'فاطمة أحمد سالم', 'محمد عبدالله خالد', 'نورا أحمد محمد', 'عبدالله سالم أحمد',
            'سارة محمد علي', 'خالد عبدالرحمن سالم', 'منى عبدالله أحمد', 'سلمان أحمد محمد', 'ريم محمد علي',
            'عبدالرحمن سالم خالد', 'هند خالد أحمد', 'فهد عبدالله محمد', 'ندى محمد علي', 'طلال أحمد سالم',
            'لولوة عبدالله خالد', 'بندر محمد أحمد', 'شهد خالد محمد', 'ماجد سالم علي', 'رند عبدالله أحمد',
            'يوسف أحمد محمد', 'دانة محمد علي', 'نواف عبدالله سالم', 'غدير خالد أحمد', 'سعد سالم محمد',
            'جود عبدالله علي', 'فيصل أحمد سالم', 'رهف محمد خالد', 'عمر عبدالله أحمد', 'لين خالد محمد',
            'تركي سالم علي', 'ريان عبدالله أحمد', 'زياد أحمد محمد', 'مريم محمد علي', 'حمد خالد سالم',
            'عائشة عبدالله أحمد', 'راشد سالم محمد', 'نوف أحمد علي', 'وليد محمد خالد', 'حصة خالد أحمد',
            'عبدالعزيز عبدالله محمد', 'أمل سالم علي', 'سطام أحمد خالد', 'جواهر محمد أحمد', 'عبدالمجيد خالد محمد',
            'شروق عبدالله علي', 'مشعل سالم أحمد', 'رغد أحمد محمد', 'علي محمد خالد', 'وفاء خالد عبدالله'
        ];

        const customers = [];
        for (let i = 0; i < 50; i++) {
            const basePoints = Math.floor(Math.random() * 2000) + 100;
            const customer = new Customer({
                merchant: testMerchant._id,
                customerId: `CUST_${String(i + 1).padStart(3, '0')}`,
                name: customerNames[i],
                email: `customer${i + 1}@example.com`,
                phone: `+96650${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
                points: basePoints,
                totalSpent: Math.floor(Math.random() * 10000) + 500,
                totalOrders: Math.floor(Math.random() * 20) + 1,
                dateOfBirth: new Date(1980 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                tier: basePoints > 1500 ? 'platinum' : basePoints > 1000 ? 'gold' : basePoints > 500 ? 'silver' : 'bronze'
            });
            customers.push(customer);
        }
        await Customer.insertMany(customers);
        console.log('✅ Created 50 test customers');

        // Create test rewards with correct schema
        console.log('🎁 Creating test rewards...');
        const rewardsData = [
            {
                name: 'خصم 10% على الطلب',
                nameEn: '10% Order Discount',
                description: 'احصل على خصم 10% على إجمالي قيمة طلبك',
                descriptionEn: 'Get 10% discount on your total order value',
                pointsRequired: 500,
                rewardType: 'percentage',
                rewardValue: 10,
                minOrderValue: 50
            },
            {
                name: 'خصم ثابت 50 ريال',
                nameEn: '50 SAR Fixed Discount',
                description: 'خصم ثابت 50 ريال على طلبك القادم',
                descriptionEn: 'Fixed 50 SAR discount on your next order',
                pointsRequired: 1000,
                rewardType: 'fixed',
                rewardValue: 50,
                minOrderValue: 100
            },
            {
                name: 'شحن مجاني',
                nameEn: 'Free Shipping',
                description: 'استمتع بالشحن المجاني على طلبك',
                descriptionEn: 'Enjoy free shipping on your order',
                pointsRequired: 300,
                rewardType: 'shipping',
                rewardValue: 0,
                minOrderValue: 0
            },
            {
                name: 'استرداد نقدي 25 ريال',
                nameEn: '25 SAR Cashback',
                description: 'احصل على كاش باك 25 ريال في محفظتك',
                descriptionEn: 'Get 25 SAR cashback in your wallet',
                pointsRequired: 750,
                rewardType: 'cashback',
                rewardValue: 25,
                minOrderValue: 200
            },
            {
                name: 'منتج مجاني',
                nameEn: 'Free Product',
                description: 'احصل على منتج مجاني من المجموعة المختارة',
                descriptionEn: 'Get a free product from selected collection',
                pointsRequired: 2000,
                rewardType: 'product',
                rewardValue: 100,
                minOrderValue: 300
            }
        ];

        const rewards = [];
        for (const rewardInfo of rewardsData) {
            const reward = new Reward({
                merchant: testMerchant._id,
                name: rewardInfo.name,
                nameEn: rewardInfo.nameEn,
                description: rewardInfo.description,
                descriptionEn: rewardInfo.descriptionEn,
                pointsRequired: rewardInfo.pointsRequired,
                rewardType: rewardInfo.rewardType,
                rewardValue: rewardInfo.rewardValue,
                minOrderValue: rewardInfo.minOrderValue,
                isActive: true,
                validFrom: new Date(),
                validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                maxUsagePerCustomer: 3,
                maxTotalUsage: 1000,
                currentUsage: Math.floor(Math.random() * 100)
            });

            await reward.save();
            rewards.push(reward);
        }
        console.log('✅ Created 5 test rewards');

        // Create test transactions and loyalty activities
        console.log('💳 Creating 200 test transactions and activities...');
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        for (let i = 0; i < 200; i++) {
            const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
            const randomDate = new Date(sixMonthsAgo.getTime() + Math.random() * (Date.now() - sixMonthsAgo.getTime()));
            const orderAmount = Math.floor(Math.random() * 1500) + 50;
            const pointsEarned = Math.floor(orderAmount * testMerchant.loyaltySettings.pointsPerCurrencyUnit);

            // Create transaction
            const transaction = new Transaction({
                merchant: testMerchant._id,
                customer: randomCustomer._id,
                type: 'earn',
                points: pointsEarned,
                description: `نقاط من طلب #ORD_${String(i + 1).padStart(6, '0')}`,
                orderId: `ORD_${String(i + 1).padStart(6, '0')}`,
                createdAt: randomDate
            });

            await transaction.save();

            // Create loyalty activity
            const activity = new CustomerLoyaltyActivity({
                merchantId: testMerchant._id,
                customerId: randomCustomer._id,
                event: 'purchase',
                points: pointsEarned,
                timestamp: randomDate,
                metadata: {
                    description: `نقاط من طلب #${transaction.orderId}`,
                    transactionId: transaction._id,
                    orderAmount: orderAmount
                }
            });

            await activity.save();
        }

        // Create some reward redemptions
        console.log('🎫 Creating 50 test coupon redemptions...');
        for (let i = 0; i < 50; i++) {
            const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
            const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
            const randomDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);

            if (randomCustomer.points >= randomReward.pointsRequired) {
                // Create coupon
                const coupon = new Coupon({
                    merchant: testMerchant._id,
                    customer: randomCustomer._id,
                    reward: randomReward._id,
                    code: `LOYALTY${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
                    used: Math.random() > 0.3,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    usedAt: Math.random() > 0.3 ? randomDate : undefined
                });

                await coupon.save();

                // Create redemption activity
                const activity = new CustomerLoyaltyActivity({
                    merchantId: testMerchant._id,
                    customerId: randomCustomer._id,
                    event: 'redemption',
                    points: -randomReward.pointsRequired,
                    timestamp: randomDate,
                    metadata: {
                        description: `استخدام ${randomReward.pointsRequired} نقطة لـ ${randomReward.name}`,
                        rewardId: randomReward._id,
                        couponId: coupon._id
                    }
                });

                await activity.save();
            }
        }

        console.log('✅ Test transactions and activities created');

        console.log('\n🎉 COMPREHENSIVE TEST DATA CREATION COMPLETED!');
        console.log('\n📝 Test Account Details:');
        console.log('📧 Email: test@loyalfy.io');
        console.log('🔑 Password: testpassword123');
        console.log('🏪 Store: متجر أحمد للألكترونيات');
        console.log('🆔 Merchant ID: test_merchant_001');
        console.log('\n📊 Data Summary:');
        console.log(`👤 Merchants: 1`);
        console.log(`👥 Customers: 50`);
        console.log(`🎁 Rewards: 5`);
        console.log(`💳 Transactions: 200`);
        console.log(`🎫 Coupons: 50`);
        console.log(`📊 Activities: 250`);
        console.log('\n✨ You can now login to the frontend and see real data!');

    } catch (error) {
        console.error('❌ Error creating test data:', error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
};

// Run the script
createTestData();
