const mongoose = require('mongoose');

// Schema for individual event-based point rules
const eventRuleSchema = new mongoose.Schema({
    enabled: { type: Boolean, default: false }, // Enable/disable this event rule
    points: { type: Number, default: 0 }        // Points to award for the event
}, { _id: false });

// Main loyalty settings schema stored inside each merchant document
const loyaltySettingsSchema = new mongoose.Schema({
    // 🔁 General Loyalty Program Settings

    pointsPerCurrencyUnit: { type: Number, default: 1 }, // How many currency units are needed to earn 1 point (e.g., 1 point per 10 SAR)
    rewardThreshold: { type: Number, default: 100 },       // Points required before the user can redeem a reward
    rewardType: { type: String, default: 'discount' },     // Type of reward: 'discount', 'coupon', etc.
    rewardValue: { type: Number, default: 10 },            // Value of the reward (e.g., 10 SAR discount or 10% off)
    redemptionLimitPerMonth: { type: Number, default: 5 }, // Max number of redemptions a customer can make per month
    expiryMonths: { type: Number, default: 12 },           // How long earned points are valid (in months)

    // 🎯 Event-Based Loyalty Rules

    purchasePoints: eventRuleSchema,            // Award points for every purchase made by the customer
    welcomePoints: eventRuleSchema,             // Award points when customer signs up or is added (first interaction)
    birthdayPoints: eventRuleSchema,            // Award points to customers on their birthday
    ratingAppPoints: eventRuleSchema,       // Award points when customer rates the app
    installAppPoints: eventRuleSchema,          // Award points when customer installs the merchant's app (if applicable)
    feedbackShippingPoints: eventRuleSchema,    // Award points when customer submits feedback about shipping
    repeatPurchasePoints: eventRuleSchema,      // Award points when a customer purchases multiple times (repeat customer)
    profileCompletionPoints: eventRuleSchema,   // Award points when customer completes their profile (e.g., fills all fields)

    purchaseAmountThresholdPoints: {            // Award points if a customer spends above a specific amount in a purchase
        enabled: { type: Boolean, default: false }, // Enable/disable this rule
        thresholdAmount: { type: Number, default: 500 }, // Spend threshold to earn points (e.g., if spend > 500 SAR)
        points: { type: Number, default: 50 }     // Points to award if threshold is met
    }
}, { _id: false });

const merchantSchema = new mongoose.Schema({
    installerMobile: { type: String, required: true }, // Mobile number of the installer
    installerRole: { type: String, required: true }, // Role of the installer
    installerName: { type: String, required: true },
    installerEmail: { type: String, required: true, unique: true },
    installationId: { type: String, required: true, unique: true }, // Unique installation ID for Salla app
    merchantUsername: { type: String, required: true, unique: true }, // Unique username for Salla app
    installationDate: { type: Date, default: Date.now }, // Date of installation
    merchantName: { type: String, required: true }, // Name of the merchant
    merchantId: { type: String, required: true, unique: true },
    merchantAvatar: { type: String }, // Avatar URL of the merchant
    merchantDomain: { type: String }, // Domain of the merchant's store
    merchantSubscription: { type: Object, },
    accessToken: { type: String, required: true },            // Salla access token
    refreshToken: { type: String, required: true },           // Salla refresh token
    accessTokenExpiresAt: { type: Date },     // Expiry date of access token
    refreshTokenExpiresAt: { type: Date },    // Expiry date of refresh token
    scope: { type: [String] },          // Scopes granted to the app
    // shopName: { type: String, required: true },
    // shopUrl: { type: String, required: true },
    passwordHash: { type: String, required: true },
    storeId: { type: String, required: true },        // Salla store ID
    // storeDomain: { type: String },                    // Optional shop domain
    isActive: { type: Boolean, default: true },

    loyaltySettings: {
        type: loyaltySettingsSchema,
        default: () => ({}) // ensures new object per merchant
    },
    __v: {type: Number},  // For user validation
    merchantCreatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const Merchant = mongoose.model('Merchant', merchantSchema);
module.exports = Merchant;