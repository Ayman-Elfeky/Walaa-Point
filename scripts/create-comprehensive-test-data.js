const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Merchant = require('../models/merchant.model');
const Customer = require('../models/customer.model');
const Reward = require('../models/reward.model');
const Transaction = require('../models/transaction.model');
const CustomerLoyaltyActivity = require('../models/customerLoyalityActivitySchema.model');
const Coupon = require('../models/coupon.model');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

const createComprehensiveTestData = async () => {
    try {
        console.log('🚀 Starting comprehensive test data creation...\n');

        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await Promise.all([
            Merchant.deleteMany({}),
            Customer.deleteMany({}),
            Reward.deleteMany({}),
            Transaction.deleteMany({}),
            CustomerLoyaltyActivity.deleteMany({}),
            Coupon.deleteMany({})
        ]);
        console.log('✅ Existing data cleared\n');

        // 1. Create Test Merchant
        console.log('👤 Creating test merchant...');
        const merchant = new Merchant({
            name: 'Ahmed Electronics Store',
            email: 'test@loyalfy.io',
            password: '$2a$10$8K4RgzPQGxz5g9.XvF2uLOkF7M0Hl4.AzkYjKyGQ.Dg9LGhgP7LNm', // testpassword123
            storeName: 'Ahmed Electronics',
            storeDescription: 'Premium electronics and gadgets store',
            storeId: 'STORE_001',
            refreshToken: 'test_refresh_token_12345',
            accessToken: 'test_access_token_12345',
            storeUrl: 'https://ahmed-electronics.com',
            loyaltySettings: {
                isActive: true,
                pointsPerRiyal: 1,
                minOrderForPoints: 10,
                maxPointsPerOrder: 1000,
                pointsExpiry: 365,
                welcomeBonus: 100,
                referralBonus: 50
            },
            rewardSettings: {
                enableRewards: true,
                autoRedeemThreshold: 100,
                maxRewardsPerCustomer: 5
            },
            notificationSettings: {
                emailNotifications: true,
                inAppNotifications: true,
                smsNotifications: false, // No SMS as requested
                webhookNotifications: true,
                newCustomerAlert: true,
                orderCompleteAlert: true,
                pointsEarnedAlert: true,
                rewardRedeemedAlert: true
            }
        });
        await merchant.save();
        console.log('✅ Test merchant created\n');

        // 2. Create 50 Customers with realistic data
        console.log('👥 Creating 50 customers...');
        const customerNames = [
            'أحمد محمد', 'فاطمة عبدالله', 'محمد سالم', 'نورا خالد', 'عبدالله أحمد',
            'سارة محمد', 'خالد عبدالرحمن', 'منى عبدالله', 'سلمان أحمد', 'ريم محمد',
            'عبدالرحمن سالم', 'هند خالد', 'فهد عبدالله', 'ندى محمد', 'طلال أحمد',
            'لولوة عبدالله', 'بندر محمد', 'شهد خالد', 'ماجد سالم', 'رند عبدالله',
            'يوسف أحمد', 'دانة محمد', 'نواف عبدالله', 'غدير خالد', 'سعد سالم',
            'جود عبدالله', 'فيصل أحمد', 'رهف محمد', 'عمر عبدالله', 'لين خالد',
            'تركي سالم', 'ريان عبدالله', 'زياد أحمد', 'مريم محمد', 'حمد خالد',
            'عائشة عبدالله', 'راشد سالم', 'نوف أحمد', 'وليد محمد', 'حصة خالد',
            'عبدالعزيز عبدالله', 'أمل سالم', 'سطام أحمد', 'جواهر محمد', 'عبدالمجيد خالد',
            'شروق عبدالله', 'مشعل سالم', 'رغد أحمد', 'علي محمد', 'وفاء خالد'
        ];

        const customers = [];
        for (let i = 0; i < 50; i++) {
            const basePoints = Math.floor(Math.random() * 2000) + 100;
            const customer = new Customer({
                merchant: merchant._id,
                customerId: `CUST_${String(i + 1).padStart(3, '0')}`,
                salla_customer_id: `salla_${i + 1}`,
                name: customerNames[i],
                email: `customer${i + 1}@example.com`,
                phone: `+96650${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
                points: basePoints,
                totalSpent: Math.floor(Math.random() * 10000) + 500,
                totalOrders: Math.floor(Math.random() * 20) + 1,
                dateOfBirth: new Date(1980 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                tier: basePoints > 1500 ? 'platinum' : basePoints > 1000 ? 'gold' : basePoints > 500 ? 'silver' : 'bronze',
                appliedRewards: []
            });
            customers.push(customer);
        }
        await Customer.insertMany(customers);
        console.log('✅ 50 customers created\n');

        // 3. Create diverse rewards with new structure
        console.log('Creating rewards...');
        const rewardData = [
            {
                name: 'خصم 10% على الطلب',
                nameEn: '10% Order Discount',
                description: 'احصل على خصم 10% على إجمالي قيمة طلبك',
                descriptionEn: 'Get 10% discount on your total order value',
                pointsRequired: 100,
                rewardType: 'percentage',
                rewardValue: 10,
                minOrderValue: 50,
                maxUsagePerCustomer: 2,
                maxTotalUsage: 1000,
                category: 'discount',
                terms: ['ساري لمدة 30 يوم', 'لا يمكن دمجه مع عروض أخرى'],
                termsEn: ['Valid for 30 days', 'Cannot be combined with other offers']
            },
            {
                name: 'شحن مجاني',
                nameEn: 'Free Shipping',
                description: 'شحن مجاني على جميع الطلبات',
                descriptionEn: 'Free shipping on all orders',
                pointsRequired: 75,
                rewardType: 'shipping',
                rewardValue: 25,
                minOrderValue: 0,
                maxUsagePerCustomer: 5,
                maxTotalUsage: 2000,
                category: 'shipping',
                terms: ['ساري على جميع المناطق'],
                termsEn: ['Valid for all regions']
            },
            {
                name: 'خصم 25 ريال',
                nameEn: '25 SAR Discount',
                description: 'خصم ثابت 25 ريال سعودي',
                descriptionEn: 'Fixed 25 SAR discount',
                pointsRequired: 150,
                rewardType: 'fixed',
                rewardValue: 25,
                minOrderValue: 100,
                maxUsagePerCustomer: 1,
                maxTotalUsage: 500,
                category: 'discount',
                terms: ['حد أدنى للطلب 100 ريال'],
                termsEn: ['Minimum order 100 SAR']
            },
            {
                name: 'استرداد نقدي 5%',
                nameEn: '5% Cashback',
                description: 'احصل على استرداد نقدي 5% من قيمة الطلب',
                descriptionEn: 'Get 5% cashback on order value',
                pointsRequired: 200,
                rewardType: 'cashback',
                rewardValue: 5,
                minOrderValue: 200,
                maxUsagePerCustomer: 1,
                maxTotalUsage: 300,
                category: 'cashback',
                terms: ['يتم إضافة الاسترداد للمحفظة خلال 3 أيام'],
                termsEn: ['Cashback added to wallet within 3 days']
            }
        ];

        const rewards = [];
        for (const reward of rewardData) {
            const newReward = new Reward({
                ...reward,
                merchant: merchant._id,
                isActive: true,
                validFrom: new Date(),
                validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                currentUsage: Math.floor(Math.random() * reward.maxTotalUsage * 0.1) // 10% usage
            });
            await newReward.save();
            rewards.push(newReward);
        }
        console.log('✅ Rewards created\n');

        // 4. Create 200 Transactions over last 6 months for analytics
        console.log('💳 Creating 200 transactions...');
        const transactions = [];
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        for (let i = 0; i < 200; i++) {
            const customer = customers[Math.floor(Math.random() * customers.length)];
            const randomDate = new Date(sixMonthsAgo.getTime() + Math.random() * (Date.now() - sixMonthsAgo.getTime()));
            const orderValue = Math.floor(Math.random() * 1500) + 50;
            const pointsEarned = Math.floor(orderValue * merchant.loyaltySettings.pointsPerRiyal);

            const transaction = new Transaction({
                merchant: merchant._id,
                customer: customer._id,
                transactionId: `TXN_${String(i + 1).padStart(6, '0')}`,
                orderId: `ORD_${String(i + 1).padStart(6, '0')}`,
                orderValue: orderValue,
                points: pointsEarned,
                type: 'earn',
                description: `Order #${i + 1} - Electronics purchase`,
                timestamp: randomDate
            });
            transactions.push(transaction);
        }
        await Transaction.insertMany(transactions);
        console.log('✅ 200 transactions created\n');

        // 5. Create 300 Customer Loyalty Activities for comprehensive analytics
        console.log('📊 Creating 300 loyalty activities...');
        const activities = [];
        
        for (let i = 0; i < 300; i++) {
            const customer = customers[Math.floor(Math.random() * customers.length)];
            const activityTypes = ['points_earned', 'points_redeemed', 'reward_claimed', 'tier_upgraded', 'welcome_bonus', 'referral_bonus'];
            const eventType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
            const randomDate = new Date(sixMonthsAgo.getTime() + Math.random() * (Date.now() - sixMonthsAgo.getTime()));
            
            let points = 0;
            let description = '';
            
            switch (eventType) {
                case 'points_earned':
                    points = Math.floor(Math.random() * 200) + 10;
                    description = `Earned ${points} points from purchase`;
                    break;
                case 'points_redeemed':
                    points = -(Math.floor(Math.random() * 150) + 50);
                    description = `Redeemed ${Math.abs(points)} points for reward`;
                    break;
                case 'reward_claimed':
                    points = -(Math.floor(Math.random() * 100) + 25);
                    description = `Claimed reward with ${Math.abs(points)} points`;
                    break;
                case 'tier_upgraded':
                    points = 0;
                    description = `Tier upgraded to ${customer.tier}`;
                    break;
                case 'welcome_bonus':
                    points = 100;
                    description = 'Welcome bonus points';
                    break;
                case 'referral_bonus':
                    points = 50;
                    description = 'Referral bonus points';
                    break;
            }

            const activity = new CustomerLoyaltyActivity({
                customerId: customer._id,
                merchantId: merchant._id,
                event: eventType,
                points: points,
                description: description,
                metadata: {
                    orderId: eventType.includes('points') ? `ORD_${Math.floor(Math.random() * 200) + 1}` : null,
                    rewardId: eventType.includes('reward') ? rewards[Math.floor(Math.random() * rewards.length)]._id : null
                },
                timestamp: randomDate
            });
            activities.push(activity);
        }
        await CustomerLoyaltyActivity.insertMany(activities);
        console.log('✅ 300 loyalty activities created\n');

        // 6. Create 80 Coupons (mix of used and unused)
        console.log('🎫 Creating 80 coupons...');
        const coupons = [];
        
        for (let i = 0; i < 80; i++) {
            const customer = customers[Math.floor(Math.random() * customers.length)];
            const reward = rewards[Math.floor(Math.random() * rewards.length)];
            const isUsed = Math.random() > 0.3; // 70% used, 30% unused
            const createdDate = new Date(sixMonthsAgo.getTime() + Math.random() * (Date.now() - sixMonthsAgo.getTime()));
            
            const coupon = new Coupon({
                merchant: merchant._id,
                customer: customer._id,
                reward: reward._id,
                couponCode: `COUP${String(i + 1).padStart(4, '0')}`,
                discount: reward.rewardValue,
                discountType: reward.rewardType,
                minOrderValue: reward.minOrderValue,
                isUsed: isUsed,
                usedAt: isUsed ? new Date(createdDate.getTime() + Math.random() * (Date.now() - createdDate.getTime())) : null,
                expiresAt: new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from creation
                createdAt: createdDate
            });
            coupons.push(coupon);
        }
        await Coupon.insertMany(coupons);
        console.log('✅ 80 coupons created\n');

        // Update customer points based on activities
        console.log('🔄 Updating customer points based on activities...');
        for (const customer of customers) {
            const customerActivities = activities.filter(a => a.customerId.toString() === customer._id.toString());
            const totalPoints = customerActivities.reduce((sum, activity) => sum + activity.points, 0);
            customer.points = Math.max(0, customer.points + totalPoints);
            await customer.save();
        }
        console.log('✅ Customer points updated\n');

        console.log('🎉 Comprehensive test data creation completed!\n');
        console.log('📊 Summary:');
        console.log(`   • 1 Merchant: ${merchant.name}`);
        console.log(`   • 50 Customers with realistic data`);
        console.log(`   • 20 Diverse rewards`);
        console.log(`   • 200 Transactions over 6 months`);
        console.log(`   • 300 Loyalty activities for analytics`);
        console.log(`   • 80 Coupons (used and unused)`);
        console.log('\n🔐 Login credentials:');
        console.log('   Email: test@loyalfy.io');
        console.log('   Password: testpassword123\n');

    } catch (error) {
        console.error('❌ Error creating test data:', error);
    } finally {
        mongoose.connection.close();
    }
};

const run = async () => {
    await connectDB();
    await createComprehensiveTestData();
};

if (require.main === module) {
    run();
}

module.exports = { createComprehensiveTestData }; 