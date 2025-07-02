const Merchant = require('../models/merchant.model');
const generateSecurePassword = require('../config/crypto');
const { randomPasswordTemplate } = require('../utils/templates/randomPass.template');
const { sendEmail } = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');
const loyaltyEngine = require('../services/loyalityEngine');
const Customer = require('../models/customer.model');

const webhookLogic = (req, res) => {
    console.log('🔔 Webhook request received:', req.body);
    const { event } = req.body;

    if (!event) {
        console.log('❌ No event type provided in webhook request');
        return res.status(400).json({ message: 'Event type is required' });
    }

    console.log(`📋 Processing webhook event: ${event}`);

    switch (event) {
        case 'app.installed':
            return onAppInstalled(req, res);
        case 'app.uninstalled':
            return onAppUninstalled(req, res);
        case 'app.store.authorize':
            return onStoreAuthorize(req, res);
        // case 'app.feedback.created':
        //     return onFeedbackCreated(req, res);
        case 'order.created':
            return onOrderCreated(req, res);
        case 'review.added':
            return onReviewAdded(req, res);
        case 'customer.login':
            return onCustomerLogin(req, res);
        default:
            return res.status(400).json({ message: 'Unknown event type' });
    }
};

const onOrderCreated = async (req, res) => {
    try {
        const { merchant: merchantId, data } = req.body;
        const merchant = await Merchant.findOne({ merchantId });
        const customer = await Customer.findOne({ customerId: data.customer_id, merchant: merchant._id });

        if (!merchant || !customer) return res.status(404).json({ message: 'Merchant or Customer not found' });

        const metadata = { orderId: data.id, amount: data.total };

        const result = await loyaltyEngine({
            event: 'purchase',
            merchant,
            customer,
            metadata
        });

        if (merchant.loyaltySettings?.purchaseAmountThresholdPoints?.enabled && data.total >= merchant.loyaltySettings.purchaseAmountThresholdPoints.thresholdAmount) {
            await loyaltyEngine({
                event: 'purchaseAmountThresholdPoints',
                merchant,
                customer,
                metadata
            });
        }

        res.status(200).json({ message: 'Order processed successfully', result });
    } catch (error) {
        console.error('Error processing order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const onCustomerLogin = async (req, res) => {
    try {
        console.log('\nCustomer login webhook received');
        console.log('Request body:', req.body);
        
        const { merchant: merchantId, data } = req.body;
        
        if (!merchantId || !data?.customer?.id) {
            console.log('\nMissing merchant ID or customer ID in webhook data\n');
            return res.status(400).json({ message: 'Missing required data' });
        }

        // Find the merchant
        const merchant = await Merchant.findOne({ merchantId });
        if (!merchant) {
            console.log(`❌ Merchant not found for ID: ${merchantId}`);
            return res.status(404).json({ message: 'Merchant not found' });
        }

        // Find the customer
        const customer = await Customer.findOne({ 
            customerId: data.customer.id, 
            merchant: merchant._id 
        });
        
        if (!customer) {
            console.log(`Customer not found for ID: ${data.customer.id}`);
            return res.status(404).json({ message: 'Customer not found' });
        }

        console.log(`Customer found: ${customer.name || customer.customerId}`);

        // Check if today's date is the customer's birthday
        const today = new Date();
        const isBirthday = customer.dateOfBirth && 
            customer.dateOfBirth.getMonth() === today.getMonth() && 
            customer.dateOfBirth.getDate() === today.getDate();

        if (isBirthday) {
            console.log(`It's ${customer.name || customer.customerId}'s birthday today!`);
            
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

                console.log(`Birthday points awarded: ${birthdayPoints} points`);

                return res.status(200).json({
                    message: 'Happy Birthday! Points awarded',
                    isBirthday: true,
                    pointsAwarded: birthdayPoints,
                    result
                });
            } else {
                console.log('Birthday detected but birthday points not enabled for merchant');
                return res.status(200).json({
                    message: 'Happy Birthday!',
                    isBirthday: true,
                    pointsAwarded: 0
                });
            }
        } else {
            console.log('Not customer\'s birthday today');
            return res.status(200).json({
                message: 'Customer login processed',
                isBirthday: false
            });
        }

    } catch (error) {
        console.error('Error processing customer login:', error);
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
        const merchantDetails = await fetchMerchantDetails(data.access_token);

        const randomPassword = generateSecurePassword();
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

        const emailHtml = randomPasswordTemplate(merchantDetails.data.email, randomPassword);
        try {
            await sendEmail(merchantDetails.data.email, 'Welcome to Loyalty - مرحباً بك في لويالتي', emailHtml);
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
    return res.status(200).json({ message: 'App installed successfully' });
};

const onAppUninstalled = async (req, res) => {
    try {
        const { merchant } = req.body;
        const deleted = await Merchant.findOneAndDelete({ merchantId: merchant });
        if (!deleted) return res.status(404).json({ message: 'Merchant not found' });

        res.status(200).json({ message: 'App uninstalled successfully' });
    } catch (error) {
        console.error('Error during uninstall:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const fetchMerchantDetails = async (accessToken) => {
    try {
        const response = await fetch('https://accounts.salla.sa/oauth2/user/info', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`Salla API error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching merchant details:', error);
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
