const sallaSDK = require('./sallaSDK');

const refreshToken = async (merchant) => {
    try {
        // Check if the merchant has a refresh token
        if (!merchant.refreshToken) {
            throw new Error('No refresh token available');
        }

        console.log('🔄 Refreshing access token...');
        
        const tokenData = await sallaSDK.refreshAccessToken(merchant.refreshToken);
        
        console.log('✅ Access token refreshed successfully');
        
        return {
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken,
            accessTokenExpiresAt: tokenData.expiresAt,
            refreshTokenExpiresAt: tokenData.expiresAt // Use same expiry for now
        };

    } catch (error) {
        console.error('❌ Error refreshing access token:', error.message);
        throw error;
    }
}

module.exports = refreshToken;