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

const updateRewardSettings = async (req, res) => {
    const merchant = req.merchant
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

module.exports = {
    loginMerchant,
    getLoyaltySettings,
    updateLoyaltySettings,
    // updateMerchantProfile,
    getMerchantDashboard,
    sendMail
};