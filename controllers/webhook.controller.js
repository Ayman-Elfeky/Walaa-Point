const Merchant = require('../models/merchant.model');
const generateSecurePassword = require('../config/crypto');
const { randomPasswordTemplate } = require('../utils/templates/randomPass.template');
const { sendEmail } = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');

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
            console.log("# App installed event triggered")
            return onAppInstalled(req, res);
        case 'app.uninstalled':
            console.log("# App uninstalled event triggered")
            return onAppUninstalled(req, res);
        case 'app.store.authorize':
            console.log("# Store authorization event triggered")
            return onStoreAuthorize(req, res);
        default:
            console.log(`# Unknown event type received: ${event}`);
            return res.status(400).json({ message: 'Unknown event type' });
    }
}

const onStoreAuthorize = async (req, res) => {
    console.log('\nHandling store authorize webhook:', req.body, '\n');
    try {
        const { data } = req.body;
        console.log('\nData access token: ', data.access_token);
        // Fetch merchant details from Salla API to get email
        const merchantDetails = await fetchMerchantDetails(data.access_token);
        console.log('\nMerchant Details:', merchantDetails, '\n');

        // Generate secure password
        const randomPassword = generateSecurePassword();
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        // Update merchant with complete information 
        const newMerchant = new Merchant({
            // Installer information (from API user data)
            installerMobile: merchantDetails.data.mobile,
            installerRole: merchantDetails.data.role,
            installerName: merchantDetails.data.name,
            installerEmail: merchantDetails.data.email,

            // Installation details
            installationId: merchantDetails.data.id.toString(),

            // Merchant information (from API merchant data)
            merchantUsername: merchantDetails.data.merchant.username,
            merchantName: merchantDetails.data.merchant.name || merchantDetails.data.merchant.username,
            merchantId: merchantDetails.data.merchant.id.toString(),
            merchantAvatar: merchantDetails.data.merchant.avatar,
            merchantDomain: merchantDetails.data.merchant.domain,
            merchantSubscription: merchantDetails.data.merchant.subscription,

            // Authentication & tokens
            passwordHash: hashedPassword,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            //this will be saved in the database as a date as milliseconds
            accessTokenExpiresAt: new Date(data.expires * 1000), 
            refreshTokenExpiresAt: new Date(merchantDetails.data.context.exp * 1000),
            scope: data.scope.split(' '),

            // Store details
            storeId: merchantDetails.data.merchant.id.toString(),

            // Merchant creation date from API
            merchantCreatedAt: new Date(merchantDetails.data.merchant.created_at)
        });
        await newMerchant.save();
        console.log('Merchant authorized and saved successfully:', newMerchant);

        // Prepare and send welcome email with random password
        const emailToBeSend = merchantDetails.data.email;
        const emailSubject = 'مرحباً بك في لويالتي - Welcome to Loyalty';
        const emailHtml = randomPasswordTemplate(emailToBeSend, randomPassword);
        
        // Send welcome email with password
        try {
            await sendEmail(emailToBeSend, emailSubject, emailHtml);
            console.log('Welcome email sent successfully to:', emailToBeSend);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // Don't fail the webhook if email fails
        }

        res.status(200).json({
            message: 'Store authorized successfully and welcome email sent',
            merchant: {
                id: newMerchant._id,
                name: newMerchant.installerName,
                email: newMerchant.installerEmail,
                merchantName: newMerchant.merchantName,
                merchantId: newMerchant.merchantId
            }
        });
    } catch (error) {
        console.error('Error handling store authorize webhook:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const onAppInstalled = async (req, res) => {
    return res.status(200).json({ message: 'App installed successfully' });
}

const onAppUninstalled = async (req, res) => {
    console.log('🔔 App uninstalled event received:', req.body);
    const { merchant } = req.body;
    const existingMerchant = await Merchant.findOneAndDelete({ merchantId: merchant });
    if (existingMerchant) {
        console.log('Merchant uninstalled successfully:', existingMerchant);
        return res.status(200).json({ message: 'App uninstalled successfully' });
    } else {
        return res.status(404).json({ message: 'Merchant not found' });
    }
}

// Helper function to fetch merchant details from Salla API
const fetchMerchantDetails = async (accessToken) => {
    try {
        // Fetch user info
        const response = await fetch('https://accounts.salla.sa/oauth2/user/info', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        });
        console.log("\nResponse: ", response, '\n');

        if (!response.ok) {
            throw new Error(`Salla API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("\nFetched Data: ", data, '\n');
        return data; // Return the complete API response
    } catch (error) {
        console.error('Error fetching merchant details from Salla:', error);
        // Return fallback data if API call fails
        return {
            data: {
                name: 'Unknown Merchant',
                email: 'unknown@merchant.com',
                merchant: {
                    id: 0,
                    domain: 'unknown.com'
                },
                context: {
                    app: 0,
                    exp: Date.now() / 1000 + 3600 // 1 hour from now
                }
            }
        };
    }
};

module.exports = webhookLogic;