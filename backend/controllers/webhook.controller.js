const Merchant = require('../models/merchant.model');
const generateSecurePassword = require('../config/crypto');
const { randomPasswordTemplate } = require('../utils/templates/randomPass.template');
const { sendEmail } = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');
const loyaltyEngine = require('../services/loyalityEngine');
const Customer = require('../models/customer.model');

const webhookLogic = (req, res) => {
    console.log("\nEnter...\n")
    const { event } = req.body;

    console.log(`\n🔔 Webhook Event Received from webhookLogic: ${event}`);

    console.log(`🔄 Processing webhook event: ${event}`);

    switch (event) {
        // case 'app.installed':
        // return onAppInstalled(req, res);
        case 'app.uninstalled':
            return onAppUninstalled(req, res);
        case 'app.store.authorize':
            return onStoreAuthorize(req, res);
        case 'app.feedback.created':
            return onFeedbackCreated(req, res);
        case 'order.created':
            return onOrderCreated(req, res);
        case 'order.updated':
            return onOrderUpdated(req, res);
        case 'order.deleted':
            return onOrderDeleted(req, res);
        case 'order.refunded':
            return onOrderRefunded(req, res);
        case 'review.added':
            return onReviewAdded(req, res);
        case 'customer.login':
            return onCustomerLogin(req, res);
        case 'customer.created':
            return onCustomerCreated(req, res);
        case 'product.created':
            return onProductCreated(req, res);
        case 'product.updated':
            return onProductUpdated(req, res);
        default:
            console.warn(`⚠️  Unknown webhook event: ${event}`);
            return res.status(400).json({
                error: 'Unknown event type',
                event: event,
                message: 'This event type is not supported'
            });
    }
};

const onOrderCreated = async (req, res) => {
    try {
        console.log('📦 Order created webhook received');
        const { merchant: merchantId, data } = req.body;

        // Debug: Log the data structure to help identify issues
        console.log('🔍 Webhook data structure:', JSON.stringify(data, null, 2));

        // Define totalAmount at the top to avoid reference errors
        // Handle different possible data structures from Salla webhook
        let totalAmount = 0;
        
        if (data.amounts && data.amounts.total && data.amounts.total.amount) {
            totalAmount = data.amounts.total.amount;
        } else if (data.total && data.total.amount) {
            totalAmount = data.total.amount;
        } else if (data.amount) {
            totalAmount = data.amount;
        }

        console.log('Merchant ID:', merchantId);
        console.log('Customer ID:', data.customer?.id);
        console.log('Order Total:', totalAmount);

        // Validate customer data
        if (!data.customer?.id) {
            console.log('⚠️ Missing customer ID in webhook data');
            return res.status(400).json({ message: 'Missing customer ID' });
        }

        // Validate that we have a valid amount
        if (!totalAmount || totalAmount <= 0) {
            console.log('⚠️ Invalid or zero order amount:', totalAmount);
            return res.status(400).json({ message: 'Invalid order amount' });
        }

        const merchantFound = await Merchant.findOne({ merchantId: merchantId });

        if (!merchantFound) {
            console.log('❌ Merchant not found:', merchantId);
            return res.status(404).json({ message: 'Merchant not found' });
        }

        let customer = await Customer.findOne({ customerId: data.customer.id, merchant: merchantFound._id });

        if (!customer) {
            console.log('👤 Customer not found, creating new customer:', data.customer.id);

            // Create new customer from order data
            console.log('🔄 DEBUG: About to create new customer with totalAmount:', totalAmount);
            customer = new Customer({
                customerId: data.customer.id,
                name: data.customer?.full_name || null,
                avatar: data.customer.avatar,
                email: data.customer?.email || null,
                phone: data.customer?.mobile || data.customer?.phone || null,
                merchant: merchantFound._id,
                orderCount: 1, // This is their first order
                totalSpent: totalAmount, // Initialize with first order amount
                metadata: data.customer // Store the full customer data from Salla
            });

            await customer.save();
            console.log('✅ New customer created:', customer.customerId);

            // Award welcome points BEFORE purchase points for new customers
            if (merchantFound.loyaltySettings?.welcomePoints?.enabled) {
                try {
                    const welcomeResult = await loyaltyEngine({
                        event: 'welcome',
                        merchant: merchantFound,
                        customer,
                        metadata: { source: 'order_created_webhook' }
                    });
                    console.log('🎉 Welcome points awarded to new customer:', welcomeResult.pointsAwarded);
                } catch (welcomeError) {
                    console.error('❌ Error awarding welcome points:', welcomeError);
                    // Don't fail the order processing if welcome points fail
                }
            }
        } else {
            // Update order count and total spent for existing customer
            console.log('🔄 DEBUG: About to update existing customer with totalAmount:', totalAmount);
            customer.orderCount = (customer.orderCount || 0) + 1;
            customer.totalSpent = (customer.totalSpent || 0) + totalAmount;
            await customer.save();
            console.log(`💰 Updated customer spending: ${customer.totalSpent} (added ${totalAmount})`);
        }

        console.log('🔄 DEBUG: About to create metadata with totalAmount:', totalAmount);
        const metadata = {
            orderId: data.id,
            amount: totalAmount,
            currency: data.currency,
            referenceId: data.reference_id
        };

        console.log('Processing purchase points...');
        console.log('🔍 DEBUG: Merchant loyalty settings:', JSON.stringify(merchantFound.loyaltySettings, null, 2));
        console.log('🔍 DEBUG: Customer before purchase:', `ID: ${customer.customerId}, Current Points: ${customer.points || 0}`);
        
        const result = await loyaltyEngine({
            event: 'purchase',
            merchant: merchantFound,
            customer,
            metadata
        });
        
        console.log('🔍 DEBUG: Loyalty engine result:', JSON.stringify(result, null, 2));
        
        // Fetch updated customer to show final points
        const updatedCustomer = await Customer.findOne({ customerId: data.customer.id, merchant: merchantFound._id });
        console.log('🔍 DEBUG: Customer after purchase:', `ID: ${updatedCustomer.customerId}, Final Points: ${updatedCustomer.points}, Total Spent: ${updatedCustomer.totalSpent}`);

        // Note: purchaseAmountThresholdPoints is handled automatically within the 'purchase' event
        // in the loyalty engine, so we don't need to call it separately

        console.log('✅ Order processed successfully');
        res.status(200).json({
            message: 'Order processed successfully',
            result,
            orderId: data.id,
            customerId: data.customer?.id,
            amount: totalAmount
        });
    } catch (error) {
        console.error('❌ Error processing order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const onCustomerLogin = async (req, res) => {
    try {
        console.log('\nCustomer login webhook received\n');
        console.log('\nRequest body:', req.body, '\n');

        const { merchant: merchantId, data } = req.body;

        if (!merchantId || !data?.customer?.id) {
            console.log('\nMissing merchant ID or customer ID in webhook data\n');
            return res.status(400).json({ message: 'Missing required data' });
        }

        // Find the merchant
        const merchant = await Merchant.findOne({ merchantId });
        if (!merchant) {
            console.log(`\nMerchant not found for ID: ${merchantId}\n`);
            return res.status(404).json({ message: 'Merchant not found' });
        }

        // Find the customer
        const customer = await Customer.findOne({
            customerId: data.customer.id,
            merchant: merchant._id
        });

        if (!customer) {
            console.log(`\nCustomer not found for ID: ${data.customer.id}\n`);
            return res.status(404).json({ message: 'Customer not found' });
        }

        console.log(`\nCustomer found: ${customer.name || customer.customerId}\n`);

        // Check if today's date is the customer's birthday
        const today = new Date();
        const isBirthday = customer.dateOfBirth &&
            customer.dateOfBirth.getMonth() === today.getMonth() &&
            customer.dateOfBirth.getDate() === today.getDate();

        if (isBirthday) {
            console.log(`\nIt's ${customer.name || customer.customerId}'s birthday today!\n`);

            // Check if merchant has birthday points enabled
            if (merchant.loyaltySettings?.birthdayPoints?.enabled) {
                const birthdayPoints = merchant.loyaltySettings.birthdayPoints.points || 0;

                // Award birthday points using loyalty engine
                const result = await loyaltyEngine({
                    event: 'birthday',
                    merchant,
                    customer,
                    metadata: { birthdayDate: today.toISOString() }
                });

                console.log(`\nBirthday points awarded: ${birthdayPoints} points\n`);

                return res.status(200).json({
                    message: 'Happy Birthday! Points awarded',
                    isBirthday: true,
                    pointsAwarded: birthdayPoints,
                    result
                });
            } else {
                console.log('\nBirthday detected but birthday points not enabled for merchant\n');
                return res.status(200).json({
                    message: 'Happy Birthday!',
                    isBirthday: true,
                    pointsAwarded: 0
                });
            }
        } else {
            console.log('\nNot customer\'s birthday today\n');
            return res.status(200).json({
                message: 'Customer login processed',
                isBirthday: false
            });
        }

    } catch (error) {
        console.error('\nError processing customer login:', error, '\n');
        res.status(500).json({ message: 'Internal server error' });
    }
}

const onFeedbackCreated = async (req, res) => {
    try {
        const { merchant: merchantId, data } = req.body;
        const merchant = await Merchant.findOne({ merchantId });
        const customer = await Customer.findOne({ customerId: data.customer_id, merchant: merchant._id });

        if (!merchant || !customer) return res.status(404).json({ message: 'Merchant or Customer not found' });

        const metadata = { feedbackId: data.id, rating: data.rating };

        const result = await loyaltyEngine({
            event: 'feedbackShippingPoints',
            merchant,
            customer,
            metadata
        });

        res.status(200).json({ message: 'Feedback processed', result });
    } catch (error) {
        console.error('Error processing feedback:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const onReviewAdded = async (req, res) => {
    try {
        const { merchant: merchantId, data } = req.body;
        const merchant = await Merchant.findOne({ merchantId });
        const customer = await Customer.findOne({ customerId: data.customer.id, merchant: merchant._id });

        if (!merchant || !customer) return res.status(404).json({ message: 'Merchant or Customer not found' });

        const metadata = {
            rating: data.rating,
            productId: data.product?.id,
            content: data.content
        };

        const result = await loyaltyEngine({
            event: 'ratingProductPoints',
            merchant,
            customer,
            metadata
        });

        res.status(200).json({ message: 'Review processed', result });
    } catch (error) {
        console.error('Error processing review:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const onStoreAuthorize = async (req, res) => {
    try {
        const { data } = req.body;
        console.log('data: ', data);
        const merchantDetails = await fetchMerchantDetails(data.access_token);
        const email = merchantDetails?.data?.email;

        if (!email) {
            console.error("❌ Missing merchant email. Skipping merchant creation.");
            return res.status(400).json({ message: 'Merchant email is required' });
        }
        const randomPassword = generateSecurePassword();
        console.log("Random Password: ", randomPassword)
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const newMerchant = new Merchant({
            installerMobile: merchantDetails.data.mobile,
            installerRole: merchantDetails.data.role,
            installerName: merchantDetails.data.name,
            installerEmail: merchantDetails.data.email,
            installationId: merchantDetails.data.id.toString(),
            merchantUsername: merchantDetails.data.merchant.username,
            merchantName: merchantDetails.data.merchant.name || merchantDetails.data.merchant.username,
            merchantId: merchantDetails.data.merchant.id.toString(),
            merchantAvatar: merchantDetails.data.merchant.avatar,
            merchantDomain: merchantDetails.data.merchant.domain,
            merchantSubscription: merchantDetails.data.merchant.subscription,
            storeLocation: merchantDetails.data.merchant.store_location,
            password: hashedPassword,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            accessTokenExpiresAt: new Date(data.expires * 1000),
            refreshTokenExpiresAt: new Date(merchantDetails.data.context.exp * 1000),
            scope: data.scope.split(' '),
            storeId: merchantDetails.data.merchant.id.toString(),
            merchantCreatedAt: new Date(merchantDetails.data.merchant.created_at)
        });

        await newMerchant.save();
        console.log(`\nStore authorized and saved: ${newMerchant.merchantName} (${newMerchant.merchantId})\n`);

        const emailHtml = randomPasswordTemplate(merchantDetails.data.email, randomPassword);
        try {
            await sendEmail(merchantDetails.data.email, 'Welcome to Loyalty - مرحباً بك في لويالتي', emailHtml);
            console.log(`\nWelcome email sent to ${merchantDetails.data.email}\n`);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        res.status(200).json({ message: 'Store authorized and saved', merchantId: newMerchant._id });
    } catch (error) {
        console.error('Error in store authorization:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const onAppInstalled = async (req, res) => {
    console.log("\nApp installed successfully\n");
    return res.status(200).json({ message: 'App installed successfully' });
};

const onAppUninstalled = async (req, res) => {
    console.log("Enter onAppUninstalled...\n");

    try {
        const { merchant } = req.body;
        console.log("Merchant will be deleted: ", merchant);
        const deleted = await Merchant.findOneAndDelete({ merchantId: merchant });
        if (!deleted) return res.status(404).json({ message: 'Merchant not found' });
        console.log(`\nApp uninstalled successfully for merchant: ${merchant}\n`);
        res.status(200).json({ message: 'App uninstalled successfully' });
    } catch (error) {
        console.error('Error during uninstall:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const onOrderUpdated = async (req, res) => {
    try {
        console.log('🔄 Order updated webhook received');
        const { merchant: merchantId, data } = req.body;

        const merchant = await Merchant.findOne({ merchantId });
        if (!merchant) {
            return res.status(404).json({ message: 'Merchant not found' });
        }

        // Log the order update for analytics
        console.log(`📦 Order ${data.id} updated for merchant ${merchantId}`);

        res.status(200).json({
            message: 'Order update processed successfully',
            orderId: data.id
        });
    } catch (error) {
        console.error('❌ Error processing order update:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const onCustomerCreated = async (req, res) => {
    try {
        console.log('👤 Customer created webhook received');
        const { merchant: merchantId, data } = req.body;

        const merchant = await Merchant.findOne({ merchantId });
        if (!merchant) {
            return res.status(404).json({ message: 'Merchant not found' });
        }

        // Check if customer already exists
        let customer = await Customer.findOne({
            customerId: data.id,
            merchant: merchant._id
        });

        if (!customer) {
            // Create new customer
            customer = new Customer({
                customerId: data.id,
                name: data.name,
                email: data.email,
                phone: data.mobile,
                dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : null,
                merchant: merchant._id,
                metadata: data
            });
            await customer.save();

            // Award welcome points if enabled
            if (merchant.loyaltySettings?.welcomePoints?.enabled) {
                await loyaltyEngine({
                    event: 'welcome',
                    merchant,
                    customer,
                    metadata: { source: 'customer_created_webhook' }
                });
            }

            console.log(`✅ New customer created: ${customer.name || customer.customerId}`);
        }

        res.status(200).json({
            message: 'Customer creation processed successfully',
            customerId: data.id
        });
    } catch (error) {
        console.error('❌ Error processing customer creation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const onProductCreated = async (req, res) => {
    try {
        console.log('🛍️ Product created webhook received');
        const { merchant: merchantId, data } = req.body;

        const merchant = await Merchant.findOne({ merchantId });
        if (!merchant) {
            return res.status(404).json({ message: 'Merchant not found' });
        }

        // Log the product creation for analytics
        console.log(`📦 Product ${data.id} created for merchant ${merchantId}`);
        console.log(`✅ New product created: ${data.name || data.title || data.id}`);

        res.status(200).json({
            message: 'Product creation processed successfully',
            productId: data.id
        });
    } catch (error) {
        console.error('❌ Error processing product creation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const onProductUpdated = async (req, res) => {
    try {
        console.log('🛍️ Product updated webhook received');
        const { merchant: merchantId, data } = req.body;

        const merchant = await Merchant.findOne({ merchantId });
        if (!merchant) {
            return res.status(404).json({ message: 'Merchant not found' });
        }

        // Log the product update for analytics
        console.log(`📦 Product ${data.id} updated for merchant ${merchantId}`);

        res.status(200).json({
            message: 'Product update processed successfully',
            productId: data.id
        });
    } catch (error) {
        console.error('❌ Error processing product update:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const onOrderDeleted = async (req, res) => {
    try {
        console.log('🗑️ Order deleted webhook received');
        const { merchant: merchantId, data } = req.body;

        const merchant = await Merchant.findOne({ merchantId });
        if (!merchant) {
            return res.status(404).json({ message: 'Merchant not found' });
        }

        // Find the customer associated with this deleted order
        const customer = await Customer.findOne({
            customerId: data.customer_id,
            merchant: merchant._id
        });

        if (!customer) {
            console.log(`⚠️ Customer not found for deleted order: ${data.id}`);
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Handle points deduction and spending reduction for deleted order
        if (data.total && data.total > 0) {
            const orderAmount = data.total;
            
            // Reduce customer's total spending
            customer.totalSpent = Math.max(0, (customer.totalSpent || 0) - orderAmount);
            customer.orderCount = Math.max(0, (customer.orderCount || 0) - 1);
            await customer.save();
            console.log(`💰 Updated customer spending after deletion: ${customer.totalSpent} (deducted ${orderAmount})`);

            const metadata = {
                orderId: data.id,
                amount: orderAmount,
                reason: 'order_deleted'
            };

            // Calculate points that should be deducted
            const pointsToDeduct = Math.floor(orderAmount * (merchant.loyaltySettings?.pointsPerCurrencyUnit || 1));

            if (pointsToDeduct > 0 && customer.points >= pointsToDeduct) {
                // Deduct points using loyalty engine
                await loyaltyEngine({
                    event: 'pointsDeduction',
                    merchant,
                    customer,
                    metadata: {
                        ...metadata,
                        pointsDeducted: pointsToDeduct,
                        originalEvent: 'order_deleted'
                    }
                });

                console.log(`📉 Points deducted for deleted order: ${pointsToDeduct} points`);
            }
        }

        console.log(`🗑️ Order ${data.id} deleted for merchant ${merchantId}`);

        res.status(200).json({
            message: 'Order deletion processed successfully',
            orderId: data.id
        });
    } catch (error) {
        console.error('❌ Error processing order deletion:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const onOrderRefunded = async (req, res) => {
    try {
        console.log('💰 Order refunded webhook received');
        const { merchant: merchantId, data } = req.body;

        const merchant = await Merchant.findOne({ merchantId });
        if (!merchant) {
            return res.status(404).json({ message: 'Merchant not found' });
        }

        // Find the customer associated with this refunded order
        const customer = await Customer.findOne({
            customerId: data.customer_id,
            merchant: merchant._id
        });

        if (!customer) {
            console.log(`⚠️ Customer not found for refunded order: ${data.id}`);
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Handle points deduction and spending reduction for refunded order
        const refundAmount = data.refund_amount || data.total || 0;

        if (refundAmount > 0) {
            // Reduce customer's total spending by refund amount
            customer.totalSpent = Math.max(0, (customer.totalSpent || 0) - refundAmount);
            await customer.save();
            console.log(`💰 Updated customer spending after refund: ${customer.totalSpent} (deducted ${refundAmount})`);

            const metadata = {
                orderId: data.id,
                amount: refundAmount,
                totalOrderAmount: data.total,
                reason: 'order_refunded'
            };

            // Calculate points that should be deducted based on refund amount
            const pointsToDeduct = Math.floor(refundAmount * (merchant.loyaltySettings?.pointsPerCurrencyUnit || 1));

            if (pointsToDeduct > 0 && customer.points >= pointsToDeduct) {
                // Deduct points using loyalty engine
                await loyaltyEngine({
                    event: 'pointsDeduction',
                    merchant,
                    customer,
                    metadata: {
                        ...metadata,
                        pointsDeducted: pointsToDeduct,
                        originalEvent: 'order_refunded'
                    }
                });

                console.log(`📉 Points deducted for refunded order: ${pointsToDeduct} points`);
            }
        }

        console.log(`💰 Order ${data.id} refunded for merchant ${merchantId}`);

        res.status(200).json({
            message: 'Order refund processed successfully',
            orderId: data.id,
            refundAmount: refundAmount
        });
    } catch (error) {
        console.error('❌ Error processing order refund:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const SallaSDKService = require('../services/sallaSDK');

const fetchMerchantDetails = async (accessToken) => {
    try {
        console.log('🔍 Fetching merchant details with SDK...');
        const sallaSDK = new SallaSDKService();
        const data = await sallaSDK.getMerchantInfo(accessToken);
        console.log('✅ Merchant details fetched successfully');
        return data;
    } catch (error) {
        console.error('❌ Error fetching merchant details:', error);
        return {
            data: {
                name: 'Unknown',
                email: 'unknown@merchant.com',
                merchant: {
                    id: 0,
                    domain: 'unknown.com',
                    username: 'unknown'
                },
                context: {
                    app: 0,
                    exp: Date.now() / 1000 + 3600
                }
            }
        };
    }
};

module.exports = webhookLogic;
