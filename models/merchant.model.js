const mongoose = require('mongoose');

const loyaltySettingsSchema = new mongoose.Schema({
    pointsPerCurrencyUnit: { type: Number, default: 10 }, // e.g. 1 point per 10 SAR
    rewardThreshold: { type: Number, default: 100 },       // points required to redeem
    rewardType: { type: String, default: 'discount' },      // 'discount', 'coupon', etc.
    rewardValue: { type: Number, default: 10 },             // 10% or 10 SAR
    redemptionLimitPerMonth: { type: Number, default: 5 },
    enableWelcomePoints: { type: Boolean, default: false },
    welcomePoints: { type: Number, default: 100 },
    enableBirthdayPoints: { type: Boolean, default: false },
    birthdayPoints: { type: Number, default: 50 },
    expiryMonths: { type: Number, default: 12 },           // points expire after X months
}, { _id: false }); // prevent nested _id

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