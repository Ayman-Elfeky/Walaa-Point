// Header - Payload - Signature
const jwt = require('jsonwebtoken');
const refreshToken = require('./refreshAccessToken');

const generateToken = (user) => {
    const payload = {
        id: user._id,
        email: user.installerEmail,
        accessToken: user.accessToken,
        refreshToken: user.refreshToken,
        merchantId: user.merchantId,
        version: user.__v || 0 // Include version for token invalidation
    };

    // Generate a token with a secret key and shorter expiration time
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });

    return token;
}

module.exports = generateToken;