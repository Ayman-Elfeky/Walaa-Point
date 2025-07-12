const sallaSDK = require('./sallaSDK');

/**
 * Enhanced error handler for Salla API operations
 */
class SallaErrorHandler {
    /**
     * Handle API errors with retry logic
     */
    static async handleApiError(error, context = {}) {
        const { operation, merchant, maxRetries = 3 } = context;
        
        console.error(`❌ Salla API Error in ${operation}:`, {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            merchant: merchant?.merchantId
        });

        // Check if it's a token expiry error
        if (error.response?.status === 401 && merchant?.refreshToken) {
            console.log('🔄 Token expired, attempting refresh...');
            
            try {
                const newTokenData = await sallaSDK.refreshAccessToken(merchant.refreshToken);
                
                // Update merchant with new tokens
                await merchant.updateOne({
                    accessToken: newTokenData.accessToken,
                    refreshToken: newTokenData.refreshToken,
                    accessTokenExpiresAt: newTokenData.expiresAt
                });
                
                console.log('✅ Token refreshed successfully');
                return { shouldRetry: true, newAccessToken: newTokenData.accessToken };
            } catch (refreshError) {
                console.error('❌ Token refresh failed:', refreshError.message);
                return { shouldRetry: false, error: refreshError };
            }
        }

        // Handle rate limiting
        if (error.response?.status === 429) {
            const retryAfter = error.response.headers['retry-after'] || 60;
            console.warn(`⚠️ Rate limited, waiting ${retryAfter} seconds...`);
            
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            return { shouldRetry: true };
        }

        // Handle server errors (5xx)
        if (error.response?.status >= 500) {
            console.warn('⚠️ Server error, may retry...');
            return { shouldRetry: true };
        }

        return { shouldRetry: false, error };
    }

    /**
     * Execute API operation with retry logic
     */
    static async executeWithRetry(operation, context = {}) {
        const { maxRetries = 3, merchant } = context;
        let lastError = null;
        let currentAccessToken = merchant?.accessToken;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation(currentAccessToken);
            } catch (error) {
                lastError = error;
                
                const handleResult = await this.handleApiError(error, {
                    ...context,
                    operation: context.operationName || 'API_CALL',
                    merchant
                });

                if (handleResult.shouldRetry && attempt < maxRetries) {
                    if (handleResult.newAccessToken) {
                        currentAccessToken = handleResult.newAccessToken;
                    }
                    
                    const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
                    console.log(`🔄 Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                throw handleResult.error || error;
            }
        }

        throw lastError;
    }

    /**
     * Validate merchant tokens
     */
    static async validateMerchantTokens(merchant) {
        if (!merchant.accessToken) {
            throw new Error('No access token available');
        }

        const now = new Date();
        const expiresAt = new Date(merchant.accessTokenExpiresAt);

        if (now >= expiresAt) {
            if (!merchant.refreshToken) {
                throw new Error('Access token expired and no refresh token available');
            }

            console.log('🔄 Access token expired, refreshing...');
            const newTokenData = await sallaSDK.refreshAccessToken(merchant.refreshToken);
            
            await merchant.updateOne({
                accessToken: newTokenData.accessToken,
                refreshToken: newTokenData.refreshToken,
                accessTokenExpiresAt: newTokenData.expiresAt
            });

            return newTokenData.accessToken;
        }

        return merchant.accessToken;
    }
}

module.exports = SallaErrorHandler; 