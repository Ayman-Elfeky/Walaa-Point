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
        console.log('Connected to MongoDB');

        // Clear existing test data
        console.log('🧹 Clearing existing test data...');
        await Merchant.deleteMany({ installerEmail: 'test@loyalfy.io' });
        
        // Delete all data for a clean test environment
        await Customer.deleteMany({});
        await Reward.deleteMany({});
        await Transaction.deleteMany({});
        await Coupon.deleteMany({});
        await CustomerLoyaltyActivity.deleteMany({});

        // Hash the password
        const hashedPassword = await bcrypt.hash('testpassword123', 10);

        // Create test merchant with all required fields
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

        // Create test customers
        console.log('👥 Creating test customers...');
        const customers = [];
        const customerData = [
            {
                name: 'أحمد محمد علي',
                email: 'ahmed.customer@example.com',
                phone: '+966501234567',
                points: 1250,
                totalSpent: 5600,
                tier: 'gold',
                orders: 12
            },
            {
                name: 'فاطمة أحمد',
                email: 'fatima@example.com',
                phone: '+966501234568',
                points: 890,
                totalSpent: 3200,
                tier: 'silver',
                orders: 8
            },
            {
                name: 'محمد عبدالله',
                email: 'mohammed@example.com',
                phone: '+966501234569',
                points: 2100,
                totalSpent: 8900,
                tier: 'platinum',
                orders: 18
            },
            {
                name: 'سارة خالد',
                email: 'sara@example.com',
                phone: '+966501234570',
                points: 450,
                totalSpent: 1800,
                tier: 'bronze',
                orders: 4
            },
            {
                name: 'عمر حسن',
                email: 'omar@example.com',
                phone: '+966501234571',
                points: 1680,
                totalSpent: 7100,
                tier: 'silver',
                orders: 14
            },
            {
                name: 'نورا عبدالرحمن',
                email: 'nora@example.com',
                phone: '+966501234572',
                points: 3200,
                totalSpent: 12500,
                tier: 'platinum',
                orders: 25
            },
            {
                name: 'خالد أحمد',
                email: 'khalid@example.com',
                phone: '+966501234573',
                points: 750,
                totalSpent: 2800,
                tier: 'silver',
                orders: 6
            },
            {
                name: 'هند محمد',
                email: 'hind@example.com',
                phone: '+966501234574',
                points: 1950,
                totalSpent: 6700,
                tier: 'gold',
                orders: 16
            }
        ];

        for (const customerInfo of customerData) {
            const customer = new Customer({
                merchant: testMerchant._id,
                customerId: Math.random().toString(36).substr(2, 9),
                name: customerInfo.name,
                email: customerInfo.email,
                phone: customerInfo.phone,
                points: customerInfo.points
            });

            await customer.save();
            customers.push(customer);
        }
        console.log(`✅ Created ${customers.length} test customers`);

        // Create test rewards
        console.log('🎁 Creating test rewards...');
        const rewardsData = [
            {
                description: 'احصل على خصم 10% على إجمالي طلبك',
                rewardType: 'discountOrderPercent',
                rewardValue: 10,
                pointsRequired: 500
            },
            {
                description: 'خصم ثابت 50 ريال على طلبك القادم',
                rewardType: 'discountOrderPrice',
                rewardValue: 50,
                pointsRequired: 1000
            },
            {
                description: 'استمتع بالشحن المجاني على طلبك',
                rewardType: 'discountShipping',
                rewardValue: 0,
                pointsRequired: 300
            },
            {
                description: 'احصل على منتج مجاني من المجموعة المختارة',
                rewardType: 'freeProduct',
                rewardValue: 100,
                pointsRequired: 2000
            },
            {
                description: 'احصل على كاش باك 25 ريال في محفظتك',
                rewardType: 'cashback',
                rewardValue: 25,
                pointsRequired: 750
            }
        ];

        const rewards = [];
        for (const rewardInfo of rewardsData) {
            const reward = new Reward({
                merchant: testMerchant._id,
                description: rewardInfo.description,
                rewardType: rewardInfo.rewardType,
                rewardValue: rewardInfo.rewardValue,
                pointsRequired: rewardInfo.pointsRequired,
                enabled: Math.random() > 0.2,
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            });

            await reward.save();
            rewards.push(reward);
        }
        console.log(`✅ Created ${rewards.length} test rewards`);

        // Create test transactions and loyalty activities
        console.log('💳 Creating test transactions and activities...');
        for (let i = 0; i < 50; i++) {
            const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
            const randomDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
            const orderAmount = Math.floor(Math.random() * 500) + 50;
            const pointsEarned = Math.floor(orderAmount * testMerchant.loyaltySettings.pointsPerCurrencyUnit);

            // Create transaction
            const transaction = new Transaction({
                merchant: testMerchant._id,
                customer: randomCustomer._id,
                type: 'earn',
                points: pointsEarned,
                description: `نقاط من طلب #${Math.random().toString(36).substr(2, 9)}`,
                orderId: Math.random().toString(36).substr(2, 9),
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
                    transactionId: transaction._id
                }
            });

            await activity.save();
        }

        // Create some reward redemptions
        console.log('🎫 Creating test coupon redemptions...');
        for (let i = 0; i < 20; i++) {
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
                        description: `استخدام ${randomReward.pointsRequired} نقطة لـ ${randomReward.description}`,
                        rewardId: randomReward._id,
                        couponId: coupon._id
                    }
                });

                await activity.save();

                // Reward usage tracking would be handled by business logic
                // since usageCount field doesn't exist in this model
            }
        }

        console.log('✅ Test transactions and activities created');

        console.log('\n🎉 TEST DATA CREATION COMPLETED!');
        console.log('\n📝 Test Account Details:');
        console.log('📧 Email: test@loyalfy.io');
        console.log('🔑 Password: testpassword123');
        console.log('🏪 Store: متجر أحمد للألكترونيات');
        console.log('🆔 Merchant ID: test_merchant_001');
        console.log(`👥 Customers: ${customers.length}`);
        console.log(`🎁 Rewards: ${rewards.length}`);
        console.log('💳 Transactions: 50');
        console.log('🎫 Coupon redemptions: 20');
        console.log('\n✨ You can now login to the frontend and see real data from backend!');

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