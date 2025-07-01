const refreshToken = async (merchant) => {
    try {
        // Check if the merchant has a refresh token
        if (!merchant.refreshToken) {
            throw new Error('No refresh token available');
        }

        const data = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: merchant.refreshToken,
            client_id: process.env.SALLA_CLIENT_ID,
            client_secret: process.env.SALLA_CLIENT_SECRET
        })

        // Prepare the request to refresh the access token
        const response = await fetch(`https://accounts.salla.sa/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: data.toString(),
        });

        if (!response.ok) {
            throw new Error('Failed to refresh access token');
        }

        const sallaData = await response.json();

        console.log('Access token refreshed successfully');
        
        return {
            accessToken: sallaData.access_token,
            refreshToken: sallaData.refresh_token,
            accessTokenExpiresAt: new Date(sallaData.expires * 1000), // Convert seconds to milliseconds
            refreshTokenExpiresAt: new Date(sallaData.refresh_expires * 1000) // Convert seconds to milliseconds
        };

    } catch (error) {
        console.error('Error refreshing access token:', error.message);
    }
}

module.exports = refreshToken;