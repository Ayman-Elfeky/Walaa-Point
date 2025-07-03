const generateToken = require('../services/generateToken');
const Merchant = require('../models/merchant.model');
const bcrypt = require('bcryptjs');
const { randomPasswordTemplate } = require('../utils/templates/randomPass.template');
const { sendEmail } = require('../utils/sendEmail');
const { generateSecurePassword } = require('../config/crypto');
const refreshToken = require('../services/refreshAccessToken');
const getCustomers = require('../services/getCustomers');
// const getLoyaltyPoints = require('../services/getLoyalityPoints');
const getOrders = require('../services/getOrders');
const Reward = require('../models/reward.model');

const loginMerchant = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Use findOne instead of find to get a single merchant
        const merchant = await Merchant.findOne({ installerEmail: email });
        // Save it in redis for caching
        // await redisClient.set(`merchant:${merchant._id}`, JSON.stringify(merchant)
        // );
        // this will change in redis if the merchant profile is updated

        // Check if merchant exists
        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: 'Merchant not found'
            });
        }

        // Check if password matches
        if (await bcrypt.compare(password, merchant.password)) {            // Generate JWT token
            const token = generateToken(merchant);

            // Set JWT in HTTP-only cookie
            res.cookie('jwt', token, {
                httpOnly: true, // Prevents JavaScript access and mitigates XSS attacks
                secure: process.env.NODE_ENV === 'production', // cookies will only be sent over HTTPS in production
                sameSite: 'strict', // Protection against CSRF
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
                path: '/' // Cookie is valid for all paths
            });

            res.status(200).json({
                success: true,
                merchant: {
                    name: merchant.merchantName,
                    email: merchant.installerEmail,
                    phone: merchant.installerMobile,
                    avatar: merchant.merchantAvatar,
                },
                message: 'Merchant Login Successfully'
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
    } catch (err) {
        console.log('Error From merchant Controller: ', err.message);
        res.status(500).json({
            success: false,
            message: 'Something Went Wrong'
        });
    }
}

const getLoyaltySettings = async (req, res) => {
    try {
        const merchant = req.merchant; // Get the merchant from the request object
        if (!merchant) {
            return res.status(404).json({ message: 'Merchant not found' });
        }

        // Assuming loyalty settings are stored in the merchant document
        const loyaltySettings = merchant.loyaltySettings || {};

        res.status(200).json({
            success: true,
            loyaltySettings
        });
    } catch (error) {
        console.error('Error fetching loyalty settings:', error.message);
        res.status(500).json({ message: 'Something went wrong' });
    }
}

// from frontend check if there is specific option or not
// if not then this just enable the setting 
// if there specific then there is change in an reward system
// from the frontend if the client click in the specific software save then this will specific object
const updateRewardSettings = async (req, res) => {
    const merchant = req.merchant;
    const settings = req.body;

    const reward = await Reward.findOne({ merchant: merchant._id, rewardType: settings.rewardType });

    try {
        if (!settings.specific) {
            if (reward.enabled) {
                console.log("\nReward already enabled, specific is required\n")
                return res.status(400).json({ success: false, message: "Reward already enabled, specific settings is required" });
            } else {
                console.log("\nEnabling reward\n");
                reward.enabled = settings.enabled;
                await reward.save()
                return res.status(200).json({ success: true, message: "Reward enabled successfully" });
            }
        } else {
            console.log("\nReward specific is changing: ", reward, '\n');
            reward = {
                ...reward,
                ...settings.specific
            }
            console.log("\nReward After save:", reward, '\n');
            await reward.save();
            return res.status(200).json({ success: true, message: "Reward updated successfully" });
        }
    } catch (err) {
        console.error("\nThere is an error in update reward settings: ", err.message, '\n');
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
}

const getRewardSettings = async (req, res) => {
    const merchant = req.merchant;
    const reward = await Reward.findOne({ merchant: merchant._id, enabled: true });

    if (!reward) {
        console.log("\nNo reward Found\n");
        return res.status(404).json({ success: false, message: `No reward has found for merchant` });
    }

    return res.status(200).json({ success: true, message: "Reward fetched successfully", data: reward });
}

const updateLoyaltySettings = async (req, res) => {
    const merchantId = req.merchant._id;
    const updates = req.body;

    try {
        // Build dot-notation object for deep merge
        const updateFields = {};
        for (const [key, value] of Object.entries(updates)) {
            updateFields[`loyaltySettings.${key}`] = value;
        }

        const merchant = await Merchant.findByIdAndUpdate(
            merchantId,
            { $set: updateFields },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Loyalty settings updated successfully',
            loyaltySettings: merchant.loyaltySettings
        });
    } catch (error) {
        console.error('Error updating loyalty settings:', error.message);
        res.status(500).json({ message: 'Something went wrong' });
    }
};


// i will make this to get the dashboard of the merchant
// but i need to get the access token and refresh token from the merchant model
// but this will make me fetch the merchant profile again from the database
// so i will use redis to cache the merchant profile

const getMerchantDashboard = async (req, res) => {
    try {
        const merchant = req.merchant;

        if (!merchant) {
            return res.status(404).json({ message: 'Merchant not found' })
        }

        const isTokenExpired = new Date() > new Date(merchant.accessTokenExpiresAt);
        if (isTokenExpired) {
            console.log("\nThe Token is Expired\n");
            // Here you would typically refresh the token using the refresh token
            const newTokens = await refreshToken(merchant);

            // update merchant with new tokens
            merchant.accessToken = newTokens.accessToken;
            merchant.refreshToken = newTokens.refreshToken;
            merchant.accessTokenExpiresAt = newTokens.accessTokenExpiresAt;
            merchant.refreshTokenExpiresAt = newTokens.refreshTokenExpiresAt;

            // Save the updated merchant
            await merchant.save();
        }

        const [customersData, ordersData] = await Promise.all([
            getCustomers(merchant.accessToken),
            getOrders(merchant.accessToken)
        ]);

        console.log('\nCustomers Data: ', customersData, '\nLoyality Data: ', loyalityData, '\nOrders Data: ', ordersData, '\n');

        const lengthOfCustomers = customersData.length;
        const lengthOfOrders = ordersData.length;
        res.status(200).json({
            success: true,
            message: 'Merchant Profile Fetched Successfully',
            customers: customersData,
            orders: ordersData,
            customersDataLength: lengthOfCustomers,
            ordersDataLength: lengthOfOrders
        });

    } catch (error) {
        console.error('Error fetching merchant profile:', error.message);
        res.status(500).json({ message: 'Something went wrong' });
    }
}

// const updateMerchantProfile = async (req, res) => {
//     const { name, email, phone } = req.body;
//     try {
//         const merchant = req.merchant;

//         if(!merchant) {
//             return res.status(404).json({message: 'Merchant not found'});
//         }

//         // Update the merchant profile
//         merchant.name = name || merchant.name;
//         merchant.email = email || merchant.email;
//         merchant.phone = phone || merchant.phone;

//         await merchant.save();

//         res.status(200).json({
//             success: true,
//             message: 'Merchant Profile Updated Successfully',
//             profile: {
//                 name: merchant.name,
//                 email: merchant.email,
//                 phone: merchant.phone
//             }
//         });
//     } catch (error) {
//         console.error('Error updating merchant profile:', error.message);
//         res.status(500).json({ message: 'Something went wrong' });
//     }
// }

const sendMail = async (req, res) => {
    const { email } = req.body;
    try {
        const password = generateSecurePassword();
        const template = randomPasswordTemplate(email, password);
        await sendEmail(email, 'سجل الدخول إلى حسابك', template);
        console.log("Email is sended successfully");
        res.status(200).json({
            success: true,
            message: 'Email send succesfully'
        })
    } catch (error) {
        console.error("Error from merchant controller at sendMail: ", error.message);
        res.status(500).json({
            success: false,
            message: 'Something Went Wrong',
        })
    }
}

const getIdentityAndDesignSettings = async (req, res) => {
    try {
        console.log('\nFetching identity and design settings\n');

        const merchant = req.merchant;
        if (!merchant) {
            console.log('\nMerchant not found\n');
            return res.status(404).json({ success: false, message: 'Merchant not found' });
        }

        const identityAndDesign = merchant.identityAndDesign || {};

        console.log('\nIdentity and design settings fetched successfully\n');

        res.status(200).json({
            success: true,
            message: 'Identity and design settings fetched successfully',
            identityAndDesign
        });
    } catch (error) {
        console.error('\nError fetching identity and design settings:', error, '\n');
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

const updateIdentityAndDesignSettings = async (req, res) => {
    try {
        console.log('\nUpdating identity and design settings\n');
        console.log('\nRequest body:', JSON.stringify(req.body, null, 2), '\n');

        const merchantId = req.merchant._id;
        const updates = req.body;

        // Validate color format for hex colors if provided
        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

        if (updates.globalIdentity?.primaryColor && !hexColorRegex.test(updates.globalIdentity.primaryColor)) {
            console.log('\nInvalid primary color format\n');
            return res.status(400).json({ success: false, message: 'Invalid primary color format. Use hex format (e.g., #596581)' });
        }

        if (updates.globalIdentity?.secondaryColor && !hexColorRegex.test(updates.globalIdentity.secondaryColor)) {
            console.log('\nInvalid secondary color format\n');
            return res.status(400).json({ success: false, message: 'Invalid secondary color format. Use hex format (e.g., #ffffff)' });
        }

        // Build dot-notation object for deep merge
        const updateFields = {};
        for (const [key, value] of Object.entries(updates)) {
            if (typeof value === 'object' && value !== null) {
                // Handle nested objects like globalIdentity, windowProgram, windowOpenButton
                for (const [nestedKey, nestedValue] of Object.entries(value)) {
                    updateFields[`identityAndDesign.${key}.${nestedKey}`] = nestedValue;
                }
            } else {
                updateFields[`identityAndDesign.${key}`] = value;
            }
        }

        console.log('\nUpdate fields:', JSON.stringify(updateFields, null, 2), '\n');

        const merchant = await Merchant.findByIdAndUpdate(
            merchantId,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!merchant) {
            console.log('\nMerchant not found during update\n');
            return res.status(404).json({ success: false, message: 'Merchant not found' });
        }

        console.log('\nIdentity and design settings updated successfully\n');

        res.status(200).json({
            success: true,
            message: 'Identity and design settings updated successfully',
            identityAndDesign: merchant.identityAndDesign
        });
    } catch (error) {
        console.error('\nError updating identity and design settings:', error, '\n');

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationErrors
            });
        }

        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

module.exports = {
    loginMerchant,
    getLoyaltySettings,
    updateLoyaltySettings,
    // updateMerchantProfile,
    getRewardSettings,
    updateRewardSettings,
    getMerchantDashboard,
    sendMail,
    getIdentityAndDesignSettings,
    updateIdentityAndDesignSettings
};