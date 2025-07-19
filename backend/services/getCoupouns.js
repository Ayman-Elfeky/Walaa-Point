const salla = require('../services/sallaSDK');

const getCoupons = async (accessToken, options = {}) => {
    console.log(`🔍 Fetching coupons with SDK...`);
    try {
        // Set default options
        const defaultOptions = {
            limit: 50,
            page: 1,
            ...options
        };

        const data = await salla.getCoupons(accessToken, defaultOptions);
        
        console.log(`✅ Fetched ${data.data?.length || 0} coupons`);
        return data.data || [];
    } catch (err) {
        console.error(`❌ Error in getCoupons:`, err.message);
        return []; // fallback to empty list
    }
};

// getCoupons('ory_at_k7GhIgYubx5f6909yOQOIZg0lMfvuNPy_1JKMCW1qlk.6lvqf8lA9xmiko5uiQ5qbZkRL_rih3XrY89st_zqAME')
// .then(coupons => {
//     console.log(`Fetched coupons:`, coupons);
// }).catch(err => {
//     console.error(`Error fetching coupons:`, err);
// });

module.exports = {
    getCoupons
};