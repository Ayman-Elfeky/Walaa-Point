const sallaSDK = require('./sallaSDK');

const getOrders = async (accessToken, options = {}) => {
    console.log(`🔍 Fetching orders with SDK...`);
    try {
        // Set default options
        const defaultOptions = {
            limit: 50,
            page: 1,
            date_from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
            ...options
        };

        const data = await sallaSDK.getOrders(accessToken, defaultOptions);
        
        console.log(`✅ Fetched ${data.data?.length || 0} orders`);
        return data.data || [];
    } catch (err) {
        console.error(`❌ Error in getOrders:`, err.message);
        return []; // fallback to empty list
    }
}

// getOrders('ory_at_t8ADUGaU2kuJJwgh5PwdfNTaouOt-0dsynva2q390zI.HhvgFM_SKtQfxuvItqJXjBuFoPzahfo9S2l0vk08pFk')
//     .then(orders => {
//         console.log('\nOrders:', orders, '\n');
//     })
//     .catch(err => {
//         console.error('\nError fetching orders:', err, '\n');
//     });

module.exports = getOrders;
