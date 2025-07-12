const sallaSDK = require('./sallaSDK');

const getProducts = async(accessToken, merchantId, options = {}) => {
    console.log(`🔍 Fetching products for merchant ${merchantId} with SDK...`);
    try {
        // Set default options
        const defaultOptions = {
            limit: 50,
            page: 1,
            date_from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
            ...options
        };

        const data = await sallaSDK.getProducts(accessToken, defaultOptions);
        
        console.log(`✅ Fetched ${data.data?.length || 0} products for merchant ${merchantId}`);
        return data.data || [];
    } catch (err) {
        console.error(`❌ Error in getProducts for merchant ${merchantId}:`, err.message);
        return []; // fallback to empty list
    }
}

// // Example usage:
// getProducts('ory_at_t8ADUGaU2kuJJwgh5PwdfNTaouOt-0dsynva2q390zI.HhvgFM_SKtQfxuvItqJXjBuFoPzahfo9S2l0vk08pFk', 'merchant_id')
//     .then(products => {
//         console.log('\n\n\n\nProducts: ', products.length, '\n');
//     })
//     .catch(err => {
//         console.error('\nError fetching products:', err, '\n');
//     });

module.exports = getProducts;
